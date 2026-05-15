import { Router } from "express";
import * as authController from "../controllers/authController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authenticate, authController.logout);
// Новый маршрут — получить данные текущего пользователя
router.get("/me", authenticate, authController.getMe);

export default router;
