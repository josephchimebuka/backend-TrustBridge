import express, { Request, Response, NextFunction, Router } from 'express';
import passport from 'passport';
import authController from '../controllers/authController';
import { isAuthenticated, authenticateUser, forgotPassword, resetPassword } from '../middleware/auth';
import expressAsyncHandler from 'express-async-handler';
import {
  findUserByWalletAddress,
  createUser,
  updateUserNonce,
} from "../models/user";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import {
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  detectTokenReuse,
  handleTokenReuse,
  getTokenFamily,
  revokeDeviceRefreshTokens,
  getUserActiveDevices,
  DeviceInfo,
} from "../models/refreshToken";
import { v4 as uuidv4 } from "uuid";
import errorHandler from '../middleware/errorHandler'; // Import the global error handler
import { validateRegister, validateVerifyEmail, checkValidationResult } from '../middleware/validation'; // Import validation middleware
import { COOKIE_CONFIG, REFRESH_TOKEN_COOKIE_NAME, ALLOWED_REFRESH_ORIGINS } from '../middleware/config'; // Import centralized config

const router: Router = express.Router();

/**
 * Extract device information from request
 */
const getDeviceInfo = (req: Request): DeviceInfo => {
  return {
    device: detectDeviceType(req.headers["user-agent"] || ""),
    deviceId: req.body.deviceId || uuidv4(), // Use provided ID or generate a new one
    userAgent: req.headers["user-agent"] || null,
    ipAddress: getClientIp(req),
  };
};

/**
 * Detect device type from user agent
 */
const detectDeviceType = (userAgent: string): string => {
  if (/mobile|android|iphone|ipad|ipod/i.test(userAgent.toLowerCase())) {
    return "Mobile";
  } else if (/tablet|ipad/i.test(userAgent.toLowerCase())) {
    return "Tablet";
  } else {
    return "Desktop";
  }
};

/**
 * Get client IP address
 */
const getClientIp = (req: Request): string => {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    ""
  );
};

/**
 * Validate the origin of a request against allowed origins
 */
const validateOrigin = (req: Request): boolean => {
  const requestOrigin = req.headers.origin || "";

  // If we have no allowed origins defined, allow all origins
  if (!ALLOWED_REFRESH_ORIGINS.length) return true;

  return ALLOWED_REFRESH_ORIGINS.includes(requestOrigin);
};

/**
 * Get the origin from the request
 */
const getOrigin = (req: Request): string => {
  return req.headers.origin || req.headers.referer || "";
};

// Get nonce for wallet address
router.get(
  "/nonce/:walletAddress",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { walletAddress } = req.params;
      let user = await findUserByWalletAddress(walletAddress);

      if (!user) {
        user = await createUser(walletAddress);
      } else {
        user.nonce = await updateUserNonce(user);
      }

      res.json({ nonce: user.nonce });
    } catch (error) {
      next(error); // Pass the error to the global error handler
    }
  }
);

// Login with wallet
router.post(
  "/login",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as { walletAddress: string };
      const deviceInfo = getDeviceInfo(req);
      const origin = getOrigin(req);

      // Generate tokens
      const accessToken = generateAccessToken({
        walletAddress: user.walletAddress,
      });
      const refreshToken = generateRefreshToken(
        {
          walletAddress: user.walletAddress,
        },
        origin
      );

      // Store refresh token with a new family (brand new login) and device info
      await createRefreshToken(
        { walletAddress: user.walletAddress },
        refreshToken,
        deviceInfo
      );

      // Set refresh token as HTTP-only cookie
      res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, COOKIE_CONFIG);

      // Return device ID so client can store it for future requests
      res.json({
        message: "Successfully authenticated",
        user: { walletAddress: user.walletAddress },
        accessToken,
        deviceId: deviceInfo.deviceId,
      });
    } catch (error) {
      next(error); // Pass the error to the global error handler
    }
  }
);

// Refresh token endpoint
router.post("/refresh", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate the request has a valid origin
    if (!validateOrigin(req)) {
      res.status(403).json({ error: "Invalid origin for token refresh" });
      return;
    }

    // Validate Content-Type to ensure it's not a CSRF attack
    const contentType = req.headers["content-type"] || "";
    if (
      !contentType.includes("application/json") &&
      !contentType.includes("application/x-www-form-urlencoded")
    ) {
      res.status(400).json({ error: "Invalid content type" });
      return;
    }

    // Get refresh token from cookie instead of request body
    const refresh_token = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

    if (!refresh_token) {
      res.status(401).json({ error: "No refresh token provided" });
      return;
    }

    // Check for token reuse
    const isReused = await detectTokenReuse(refresh_token);
    if (isReused) {
      await handleTokenReuse(refresh_token);
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(401).json({ error: "Token reuse detected - session revoked" });
      return;
    }

    // Verify the refresh token
    const storedToken = await findRefreshToken(refresh_token);
    if (!storedToken) {
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    // Check expiration
    if (storedToken.expiresAt < new Date()) {
      await revokeRefreshToken(refresh_token);
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(401).json({ error: "Refresh token expired" });
      return;
    }

    // Verify the JWT refresh token
    const payload = verifyRefreshToken(refresh_token);
    if (payload.type !== "refresh") {
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(401).json({ error: "Invalid token type" });
      return;
    }

    // Validate the token's origin
    const currentOrigin = getOrigin(req);
    if (
      payload.origin &&
      payload.origin !== currentOrigin &&
      ALLOWED_REFRESH_ORIGINS.length > 0
    ) {
      await handleTokenReuse(refresh_token);
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(403).json({ error: "Origin mismatch - possible CSRF attempt" });
      return;
    }

    // Get the token family for rotation
    const tokenFamily = await getTokenFamily(refresh_token);

    // Extract and update device info
    const deviceInfo: DeviceInfo = {
      device: storedToken.device,
      deviceId: storedToken.deviceId,
      userAgent: req.headers["user-agent"] || storedToken.userAgent,
      ipAddress: getClientIp(req),
    };

    // Generate new tokens
    const user = { walletAddress: payload.walletAddress };
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user, currentOrigin);

    // Implement token rotation
    await createRefreshToken(
      user,
      newRefreshToken,
      deviceInfo,
      tokenFamily || undefined,
      refresh_token
    );

    // Set the new refresh token as HTTP-only cookie
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, COOKIE_CONFIG);

    // Only return the access token in the response body
    res.json({ accessToken });
  } catch (error) {
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
    next(error); // Pass the error to the global error handler
  }
});

// Logout
router.post(
  "/logout",
  isAuthenticated,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refresh_token = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

      if (refresh_token) {
        await revokeRefreshToken(refresh_token);
      }

      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      await revokeAllUserRefreshTokens(req.user!.walletAddress);
      res.json({ message: "Successfully logged out" });
    } catch (error) {
      next(error); // Pass the error to the global error handler
    }
  }
);

// Logout from a specific device
router.post(
  "/logout/device/:deviceId",
  isAuthenticated,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deviceId } = req.params;

      if (!deviceId) {
        res.status(400).json({ error: "Device ID is required" });
        return;
      }

      await revokeDeviceRefreshTokens(req.user!.walletAddress, deviceId);

      const current_token = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
      if (current_token) {
        const tokenData = await findRefreshToken(current_token);
        if (tokenData && tokenData.deviceId === deviceId) {
          res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
        }
      }

      res.json({ message: "Successfully logged out from device" });
    } catch (error) {
      next(error); // Pass the error to the global error handler
    }
  }
);

// Get all active devices for the user
router.get(
  "/devices",
  isAuthenticated,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const devices = await getUserActiveDevices(req.user!.walletAddress);
      res.json({ devices });
    } catch (error) {
      next(error); // Pass the error to the global error handler
    }
  }
);

// Get current user
router.get("/me", (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.json({ user: req.user });
  } catch (error) {
    next(error); // Pass the error to the global error handler
  }
});

// Error handling middleware
router.use((err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error("Auth error:", err);
  if (err.name === "AuthenticationError") {
    res.status(401).json({ error: err.message });
    return;
  }
  next(err); // Pass to global error handler if not handled here
});

// Routes for password management
router.post('/forgot-password', expressAsyncHandler(forgotPassword));
router.post('/reset-password', expressAsyncHandler(resetPassword));

// Route to send verification email
router.post('/send-verification-email', expressAsyncHandler(authController.sendVerificationEmail));

// Route to verify email with token
router.post('/verify-email', 
  validateVerifyEmail, 
  checkValidationResult, 
  expressAsyncHandler(authController.verifyEmail)
);

// Route to register a new user
router.post('/register', 
  validateRegister, 
  checkValidationResult, 
  expressAsyncHandler(authController.register)
);

export default router;
