import { Router } from "express";
import { userController } from "../controllers/user.controllers";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/uploud.middleware";
import { authGuard } from "../middlewares/authGuard";

const userRouter = Router();

userRouter.get("/profile", authMiddleware,authGuard,userController.profile);
userRouter.patch("/profile", authMiddleware,authGuard, upload.single("profileImage"), userController.updateProfile);
userRouter.patch("/email", authMiddleware,authGuard, userController.updateEmail);
userRouter.patch("/password", authMiddleware,authGuard, userController.updatePassword);

export default userRouter;
