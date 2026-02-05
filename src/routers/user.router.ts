import { Router } from "express";
import { userController } from "../controllers/user.controllers";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/uploud.middleware";
import { authGuard } from "../middlewares/authGuard";

const userRouter = Router();

userRouter.get("/profile", authGuard, authMiddleware, userController.profile);
userRouter.patch("/profile", authGuard, authMiddleware, upload.single("profileImage"), userController.updateProfile);
userRouter.patch("/email", authGuard, authMiddleware, userController.updateEmail);
userRouter.patch("/password", authGuard, authMiddleware, userController.updatePassword);

export default userRouter;
