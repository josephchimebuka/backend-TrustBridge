import jwt from "jsonwebtoken";
import { User } from "../models/user";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-token-secret";

export interface JWTPayload {
  walletAddress: string;
  type: "access" | "refresh";
}

export const generateAccessToken = (user: User): string => {
  return jwt.sign(
    { walletAddress: user.walletAddress, type: "access" } as JWTPayload,
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

export const generateRefreshToken = (user: User): string => {
  return jwt.sign(
    { walletAddress: user.walletAddress, type: "refresh" } as JWTPayload,
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
};
