import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { LoginDto, RefreshTokenDto, RegisterDto } from "../../src/dtos/auth.dto";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

// Initialize Prisma
const prisma = new PrismaClient();

// Define a custom interface to extend JwtPayload
interface CustomJwtPayload extends JwtPayload {
  userId: string;
}

class AuthService {
  /**
   * Registers a new user and generates tokens.
   */
  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await prisma.user.create({
      data: { email: dto.email, password: hashedPassword },
    });

    return { user, Tokens: await this.generateTokens(user.id)};
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new Error("Invalid credentials");
    }

    return { user};
  }

  async generateTokens(userId: string) {
    const jwtSecret = process.env.JWT_SECRET as string;
    const refreshSecret = process.env.JWT_REFRESH_SECRET as string;

    if (!jwtSecret || !refreshSecret) {
      throw new Error("JWT secrets are missing in environment variables");
    }

    const accessToken = jwt.sign({ userId }, jwtSecret, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId }, refreshSecret, {
      expiresIn: "7d",
    });

    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return { refreshToken };
  }

  /**
   * Refreshes a user's access token using the refresh token.
   */
  async refreshToken(dto: RefreshTokenDto) {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET as string;
      if (!refreshSecret) {
        throw new Error("JWT refresh secret is missing in environment variables");
      }
  
      const payload = jwt.verify(dto.refreshToken, refreshSecret) as CustomJwtPayload;
  
      if (!payload.userId) {
        throw new Error("Invalid token payload");
      }
  
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
  
      if (!user) {
        throw new Error("User not found");
      }
  
      const tokens = await this.generateTokens(user.id);   
      return await { user, tokens }; 
    } catch (error) {
      throw new Error( "Invalid refresh token"); 
    }
  }
  }

export default new AuthService();
