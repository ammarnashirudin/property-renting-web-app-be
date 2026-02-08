import { Router } from "express";
import { authController } from "../controllers/auth.controllers";

const authRouter = Router();

authRouter.post("/register/user", authController.registerUser);
authRouter.post("/register/tenant", authController.registerTenant);

authRouter.post("/verify/resend", authController.resendVerification);
authRouter.post("/verify", authController.verifyEmailSetPassword);

authRouter.post("/login", authController.login);

authRouter.post("/reset-password", authController.requestResetPassword);
authRouter.post("/reset-password/confirm", authController.confirmResetPassword);

authRouter.post("/social", authController.socialAuth);

export default authRouter;
