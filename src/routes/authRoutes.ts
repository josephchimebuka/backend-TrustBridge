import express, { Request, Response, NextFunction, Router } from "express";
import passport from "passport";
import {
  findUserByWalletAddress,
  createUser,
  updateUserNonce,
} from "../models/user";
import { isAuthenticated, authenticateUser } from "../middleware/auth";
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
} from "../models/refreshToken";

const router: Router = express.Router();

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

      // Generate tokens
      const accessToken = generateAccessToken({
        walletAddress: user.walletAddress,
      } as any);
      const refreshToken = generateRefreshToken({
        walletAddress: user.walletAddress,
      } as any);

      // Store refresh token
      await createRefreshToken(
        { walletAddress: user.walletAddress } as any,
        refreshToken
      );

      res.json({
        message: "Successfully authenticated",
        user: { walletAddress: user.walletAddress },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      res.status(500).json({ error: "Authentication failed" });
    }
  }
);

// Refresh token endpoint
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    // Verify the refresh token
    const storedToken = await findRefreshToken(refresh_token);
    if (!storedToken) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    // Verify the JWT refresh token
    const payload = verifyRefreshToken(refresh_token);
    if (payload.type !== "refresh") {
      res.status(401).json({ error: "Invalid token type" });
      return;
    }

    // Generate new tokens
    const user = { walletAddress: payload.walletAddress };
    const accessToken = generateAccessToken(user as any);
    const newRefreshToken = generateRefreshToken(user as any);

    // Revoke old refresh token and create new one
    await revokeRefreshToken(refresh_token);
    await createRefreshToken(user as any, newRefreshToken);

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
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
      const { refresh_token } = req.body;
      if (refresh_token) {
        await revokeRefreshToken(refresh_token);
      }
      // Optionally revoke all refresh tokens for the user
      await revokeAllUserRefreshTokens(req.user!.walletAddress);
      res.json({ message: "Successfully logged out" });
    } catch (error) {
      console.error("Logout error:", error);
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

export default router;
