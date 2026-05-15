import * as roomService from "../services/roomService.js";

// Получить все комнаты
export async function getRooms(req, res, next) {
  try {
    const rooms = await roomService.getRooms();
    res.status(200).json({ rooms });
  } catch (error) {
    next(error);
  }
}

// Получить список ID комнат текущего пользователя
export async function getMyRooms(req, res, next) {
  try {
    const roomIds = await roomService.getMyRooms(req.user.sub);
    res.status(200).json({ roomIds });
  } catch (error) {
    next(error);
  }
}

// Получить комнату по ID
export async function getRoomById(req, res, next) {
  try {
    const room = await roomService.getRoomById(req.params.id);
    res.status(200).json({ room });
  } catch (error) {
    next(error);
  }
}

// Создать новую комнату
export async function createRoom(req, res, next) {
  try {
    const room = await roomService.createRoom(req.body.name, req.user.sub);
    res.status(201).json({ room });
  } catch (error) {
    next(error);
  }
}

// Удалить комнату
export async function deleteRoom(req, res, next) {
  try {
    await roomService.deleteRoom(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
