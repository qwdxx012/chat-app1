import prisma from "../prisma/prismaClient.js";
import AppError from "../utils/appError.js";
import { getUserBySupabaseId } from "../utils/socketUtils.js";

// Получить все комнаты
export async function getRooms() {
  return prisma.room.findMany({ orderBy: { createdAt: "desc" } });
}

// Получить ID комнат, в которых состоит текущий пользователь
export async function getMyRooms(supabaseId) {
  const user = await getUserBySupabaseId(supabaseId);
  const members = await prisma.roomMember.findMany({
    where: { userId: user.id },
    select: { roomId: true },
  });
  return members.map((m) => m.roomId);
}

// Найти комнату по ID
export async function getRoomById(id) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw new AppError("Комната не найдена", 404);
  return room;
}

// Создать новую комнату и сразу добавить создателя как участника
export async function createRoom(name, supabaseId) {
  const user = await getUserBySupabaseId(supabaseId);
  const existing = await prisma.room.findUnique({ where: { name } });
  if (existing) throw new AppError("Комната с таким названием уже существует", 400);
  const room = await prisma.room.create({ data: { name } });
  await prisma.roomMember.create({ data: { roomId: room.id, userId: user.id } });
  return room;
}

// Удалить комнату по ID
export async function deleteRoom(id) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw new AppError("Комната не найдена", 404);
  await prisma.room.delete({ where: { id } });
}

// Добавить пользователя в комнату (если уже там — просто вернуть запись)
export async function joinRoom(roomId, supabaseId) {
  const user = await getUserBySupabaseId(supabaseId);
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new AppError("Комната не найдена", 404);

  const existing = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId: user.id, roomId } },
  });
  if (existing) return existing;

  return prisma.roomMember.create({ data: { roomId, userId: user.id } });
}

// Удалить пользователя из комнаты
export async function leaveRoom(roomId, supabaseId) {
  const user = await getUserBySupabaseId(supabaseId);
  await prisma.roomMember.deleteMany({
    where: { userId: user.id, roomId },
  });
}
