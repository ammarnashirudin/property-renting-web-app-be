import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";



export const authController = {
  
  registerUser: async (req: Request, res: Response, next: NextFunction) => {
      console.log("🔥 REGISTER USER MASUK");
  console.log(req.body);
    try {
      const result = await authService.registerUser(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  registerTenant: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.registerTenant(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  resendVerification: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.resendVerificationByEmail(req.body.email);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  verifyEmailSetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.verifyEmailAndSetPassword(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  requestResetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.requestResetPassword(req.body.email);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  confirmResetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.confirmResetPassword(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
  
  socialAuth: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.socialAuth(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
