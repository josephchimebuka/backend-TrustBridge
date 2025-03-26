import express, { Request, Response, NextFunction, Router } from 'express';
import passport from 'passport';
import { isAuthenticated, authenticateUser,forgotPassword, resetPassword } from '../middleware/auth';
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
  REFRESH_TOKEN_COOKIE_NAME,
  COOKIE_CONFIG,
  ALLOWED_REFRESH_ORIGINS,
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
      let user = findUserByWalletAddress(walletAddress);

      if (!user) {
        user = await createUser(walletAddress);
      } else {
        user.nonce = await updateUserNonce(user);
      }

      res.json({ nonce: user.nonce });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate nonce" });
    }
  }
);

// Login with wallet
router.post(
  "/login",
  authenticateUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as { walletAddress: string };
      const deviceInfo = getDeviceInfo(req);
      const origin = getOrigin(req);

      // Generate tokens
      const accessToken = generateAccessToken({
        walletAddress: user.walletAddress,
      } as any);
      const refreshToken = generateRefreshToken(
        {
          walletAddress: user.walletAddress,
        } as any,
        origin
      );

      // Store refresh token with a new family (brand new login) and device info
      await createRefreshToken(
        { walletAddress: user.walletAddress } as any,
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
      res.status(500).json({ error: "Authentication failed" });
    }
  }
);

// Refresh token endpoint
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
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

    // Check for token reuse - this is a potential attack
    const isReused = await detectTokenReuse(refresh_token);
    if (isReused) {
      // Handle token reuse by revoking all related tokens
      await handleTokenReuse(refresh_token);
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(401).json({ error: "Token reuse detected - session revoked" });
      return;
    }

    // Verify the refresh token
    const storedToken = await findRefreshToken(refresh_token);
    if (!storedToken) {
      // Clear the invalid cookie
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    // Add expiration check
    if (storedToken.expiresAt < new Date()) {
      await revokeRefreshToken(refresh_token);
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(401).json({ error: "Refresh token expired" });
      return;
    }

    // Verify the JWT refresh token
    const payload = verifyRefreshToken(refresh_token);
    if (payload.type !== "refresh") {
      // Clear the invalid cookie
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(401).json({ error: "Invalid token type" });
      return;
    }

    // Validate that the token is being used from the same origin it was issued from
    const currentOrigin = getOrigin(req);
    if (
      payload.origin &&
      payload.origin !== currentOrigin &&
      ALLOWED_REFRESH_ORIGINS.length > 0
    ) {
      // Origin mismatch - potential CSRF attack
      await handleTokenReuse(refresh_token); // Revoke all tokens in this family
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res
        .status(403)
        .json({ error: "Origin mismatch - possible CSRF attempt" });
      return;
    }

    // Get the token family for rotation
    const tokenFamily = await getTokenFamily(refresh_token);

    // Extract device info from the stored token and update with current request
    const deviceInfo: DeviceInfo = {
      device: storedToken.device,
      deviceId: storedToken.deviceId,
      userAgent: req.headers["user-agent"] || storedToken.userAgent,
      ipAddress: getClientIp(req),
    };

    // Generate new tokens
    const user = { walletAddress: payload.walletAddress };
    const accessToken = generateAccessToken(user as any);
    const newRefreshToken = generateRefreshToken(user as any, currentOrigin);

    // Implement token rotation - create new token in the same family and mark old one as replaced
    await createRefreshToken(
      user as any,
      newRefreshToken,
      deviceInfo,
      tokenFamily || undefined,
      refresh_token
    );

    // Set the new refresh token as HTTP-only cookie
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, COOKIE_CONFIG);

    // Only return the access token in the response body
    res.json({
      accessToken,
    });
  } catch (error) {
    // Clear the cookie on error
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);

    if (error instanceof Error && error.name === "JsonWebTokenError") {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout
router.post(
  "/logout",
  isAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Get refresh token from cookie instead of request body
      const refresh_token = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

      if (refresh_token) {
        // Verify the refresh token is valid before revoking
        const storedToken = await findRefreshToken(refresh_token);
        
        if (storedToken) {
          // Check if the token belongs to the authenticated user
          if (storedToken.userId !== req.user!.walletAddress) {
            // Token mismatch - potential security issue
            await handleTokenReuse(refresh_token);
            res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
            res.status(403).json({ error: "Token mismatch - security violation" });
            return;
          }

          // Revoke the specific refresh token
          await revokeRefreshToken(refresh_token);
        }
      }

      // Clear the refresh token cookie with secure options
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        ...COOKIE_CONFIG,
        maxAge: 0, // Immediately expire the cookie
        path: '/', // Ensure cookie is cleared from all paths
      });

      // Revoke all refresh tokens for the user
      await revokeAllUserRefreshTokens(req.user!.walletAddress);

      res.json({ 
        message: "Successfully logged out",
        details: "All sessions have been terminated"
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, try to clear the cookie
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(500).json({ error: "Internal server error during logout" });
    }
  }
);

// Logout from a specific device
router.post(
  "/logout/device/:deviceId",
  isAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;

      if (!deviceId) {
        res.status(400).json({ error: "Device ID is required" });
        return;
      }

      // Revoke all tokens for this device
      await revokeDeviceRefreshTokens(req.user!.walletAddress, deviceId);

      // Check if current device is being logged out
      const current_token = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
      if (current_token) {
        const tokenData = await findRefreshToken(current_token);
        if (tokenData && tokenData.deviceId === deviceId) {
          res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
        }
      }

      res.json({ message: "Successfully logged out from device" });
    } catch (error) {
      console.error("Device logout error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get all active devices for the user
router.get(
  "/devices",
  isAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const devices = await getUserActiveDevices(req.user!.walletAddress);
      res.json({ devices });
    } catch (error) {
      console.error("Get devices error:", error);
      res.status(500).json({ error: "Internal server error" });
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
    next(error);
  }
});

// Error handling middleware
router.use(
  (err: any, req: Request, res: Response, next: NextFunction): void => {
    console.error("Auth error:", err);
    if (err.name === "AuthenticationError") {
      res.status(401).json({ error: err.message });
      return;
    }
    next(err);
  }
);


router.post('/forgot-password', expressAsyncHandler(forgotPassword));
router.post('/reset-password', expressAsyncHandler(resetPassword));

export default router; 


