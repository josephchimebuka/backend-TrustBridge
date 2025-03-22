import { Request, Response, NextFunction } from "express";
import passport from "passport";
import prisma from "../config/prisma";
import { verifyAccessToken } from "../utils/jwt";

interface AuthInfo {
  message?: string;
  status?: number;
}

interface AuthUser {
  walletAddress: string;
}

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const [bearer, token] = authHeader.split(" ");

    if (bearer !== "Bearer" || !token) {
      res.status(401).json({ error: "Invalid token format" });
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = { walletAddress: payload.walletAddress };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
};

export const isLender = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.walletAddress;

    if (!userId) {
      res
        .status(401)
        .json({ error: "Unauthorized - User not authenticated properly" });
      return;
    }

    const userRole = await prisma.role.findMany({
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
        name: "lender",
      },
    });

    if (userRole.length === 0) {
      res.status(403).json({
        error: "Forbidden - You do not have access to the audit logs",
      });
      return;
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate(
    "wallet",
    (err: Error | null, user: AuthUser | false, info: AuthInfo) => {
      if (err) {
        next(err);
        return;
      }
      if (!user) {
        const status =
          info?.status || (info?.message?.includes("not found") ? 400 : 401);
        res
          .status(status)
          .json({ error: info?.message || "Authentication failed" });
        return;
      }
      req.logIn(user, (err) => {
        if (err) {
          next(err);
          return;
        }
        next();
      });
    }
  )(req, res, next);
};

// Custom error handler for authentication
export const handleAuthError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err.name === "AuthenticationError") {
    res.status(401).json({ error: err.message });
    return;
  }
  next(err);
};
