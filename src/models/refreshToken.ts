import prisma from "../config/prisma";
import { User } from "./user";

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
}

export const createRefreshToken = async (
  user: User,
  token: string
): Promise<RefreshToken> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  return await prisma.refreshToken.create({
    data: {
      token,
      userId: user.walletAddress,
      expiresAt,
      isRevoked: false,
    },
  });
};

export const findRefreshToken = async (
  token: string
): Promise<RefreshToken | null> => {
  return await prisma.refreshToken.findFirst({
    where: {
      token,
      isRevoked: false,
      expiresAt: {
        gt: new Date(), // not expired
      },
    },
  });
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.update({
    where: { token },
    data: { isRevoked: true },
  });
};

export const revokeAllUserRefreshTokens = async (
  userId: string
): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
};
