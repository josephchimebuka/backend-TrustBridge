import express, { Request, Response, NextFunction, Router } from "express";
import {
  findUserByWalletAddress,
  createUser,
  updateUserNonce,
} from "../models/user";
import AuthController from "../../src/controllers/authController";
import { authenticateUser } from "../../src/middleware/auth";
import { isAuthenticated } from "../../src/middleware/auth";
import authService from "../../src/services/authService";
import { RefreshTokenDto } from "../../src/dtos/auth.dto";

const router: Router = express.Router();

// Get nonce for wallet address
router.get(
  "/nonce/:walletAddress",
  async (req: Request, res: Response, next: NextFunction) => {
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
router.post("/login", authenticateUser, (req: Request, res: Response) => {
  res.json({
    message: "Successfully authenticated",
    user: {
      walletAddress: (req.user as { walletAddress: string }).walletAddress,
    },
  });
});

// Logout
router.post(
  "/logout",
  isAuthenticated,
  (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.json({ message: "Successfully logged out" });
    });
  }
);

// Get current user
router.get("/me", (req: Request, res: Response, next: NextFunction) => {
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
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Auth error:", err);
  if (err.name === "AuthenticationError") {
    res.status(401).json({ error: err.message });
    return;
  }
  next(err);
});

// Register a new user
router.post("/register", AuthController.register);

// Login user
router.post("/login-web2", AuthController.login);

// router.post("/refresh-token", AuthController.refreshToken);

router.post(
  "/refresh-token",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
    const dto: RefreshTokenDto = req.body;
      
     const token = authService.refreshToken(dto);

      res.status(201).json({message: 'Token generated', token: (await token).tokens});
      res.json();
    } catch (error) {
      next(error)
      res.status(500).json();
    }
  }
);

export default router;
