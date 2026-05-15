import { Router } from "express";
import * as roomController from "../controllers/roomController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

// Все маршруты требуют аутентификации
router.get("/", authenticate, roomController.getRooms);
router.get("/my", authenticate, roomController.getMyRooms);
router.get("/:id", authenticate, roomController.getRoomById);
router.post("/", authenticate, roomController.createRoom);
router.delete("/:id", authenticate, roomController.deleteRoom);
// Вход/выход из комнат — только через WebSocket (room:join / room:leave)

export default router;
