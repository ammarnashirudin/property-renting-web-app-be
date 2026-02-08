import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";

export const userController = {
  profile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = await userService.getProfile(req.user!.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = await userService.updateProfile(req.user!.id, req.body, req.file);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  updateEmail: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = await userService.updateEmail(req.user!.id, req.body.email);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
  updatePassword: async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.updatePassword(
      req.user!.id,
      currentPassword,
      newPassword
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
},

};
