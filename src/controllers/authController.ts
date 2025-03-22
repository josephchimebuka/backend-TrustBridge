import { NextFunction, Request, Response } from "express";
import { LoginDto, RefreshTokenDto, RegisterDto } from "../../src/dtos/auth.dto";
import AuthService from "../../src/services/authService";

class AuthController {
  /**
   * Handles user registration.
   */
  async register(req: Request, res: Response) {
    try {
      const dto: RegisterDto = req.body;
      const tokens = await AuthService.register(dto);
      res.status(201).json(tokens);
    } catch (error) {
      res?.status(400).json({ message: error });
    }
  }

  /**
   * Handles user login.
   */
  async login(req: Request, res: Response) {
    try {
      const dto: LoginDto = req.body;
      const tokens = await AuthService.login(dto);
      res.status(200).json(tokens);
    } catch (error) {
      res.status(401).json({ message: error });
    }
  }
      

}

export default new AuthController();