import express, { Request, Response, NextFunction, Router } from 'express';
import passport from 'passport';
import { findUserByWalletAddress, createUser, updateUserNonce } from '../models/user';
import { isAuthenticated, authenticateUser } from '../middleware/auth';
import { revokeRefreshToken } from '../services/tokenService';

const router: Router = express.Router();

// Get nonce for wallet address
router.get('/nonce/:walletAddress', async (req: Request, res: Response, next: NextFunction) => {
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
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

// Login with wallet
router.post('/login', authenticateUser, (req: Request, res: Response) => {
  res.json({ 
    message: 'Successfully authenticated',
    user: { walletAddress: (req.user as { walletAddress: string }).walletAddress }
  });
});

// Logout
router.post(
  "/logout",
  isAuthenticated,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        res.status(400).json({ error: "Refresh token is required" });
        return;
      }
      const revoked = await revokeRefreshToken(refresh_token);
      if (!revoked) {
        res.status(400).json({ error: "Invalid or expired refresh token" });
        return;
      }

      res.json({ message: 'Successfully logged out' });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user
router.get('/me', (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Auth error:', err);
  if (err.name === 'AuthenticationError') {
    res.status(401).json({ error: err.message });
    return;
  }
  next(err);
});

export default router; 
