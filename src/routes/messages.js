import { Router } from "express";
import * as messageController from "../controllers/messageController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

// Получить историю сообщений комнаты через REST (отправка — только через WebSocket)
router.get("/:id/messages", authenticate, messageController.getMessages);

export default router;
