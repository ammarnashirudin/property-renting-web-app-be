import { Router } from "express";
import { propertyManagementController } from "../controllers/propertyManagement.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authGuard } from "../middlewares/authGuard";
import { roleMiddleware } from "../middlewares/role.middleware";
import { upload } from "../middlewares/uploud.middleware"

const propertyManagementRouter = Router();

propertyManagementRouter.get(
  "/my",
  authMiddleware,
  authGuard,
  roleMiddleware(["TENANT"]),
  propertyManagementController.listMy
);

propertyManagementRouter.post(
  "/",
  authMiddleware,
  authGuard,
  roleMiddleware(["TENANT"]),
  upload.single("image"),
  propertyManagementController.create
);

propertyManagementRouter.patch(
  "/:id",
  authMiddleware,
  authGuard,
  roleMiddleware(["TENANT"]),
  upload.single("image"),
  propertyManagementController.update
);

propertyManagementRouter.delete(
  "/:id",
  authMiddleware,
  authGuard,
  roleMiddleware(["TENANT"]),
  propertyManagementController.remove
);

export default propertyManagementRouter;