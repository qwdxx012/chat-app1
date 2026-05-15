import prisma from "../prisma/prismaClient.js";
import { getUserBySupabaseId } from "../utils/socketUtils.js";

// Создать сообщение в базе данных и вернуть его вместе с данными отправителя
export async function createMessage(roomId, supabaseId, content) {
  const sender = await getUserBySupabaseId(supabaseId);
  return prisma.message.create({
    data: {
      content,
      roomId,
      senderId: sender.id,
    },
    include: {
      sender: true,
    },
  });
}

// Получить все сообщения комнаты (с данными отправителя), от старых к новым
export async function getMessages(roomId) {
  return prisma.message.findMany({
    where: { roomId },
    include: { sender: true },
    orderBy: { createdAt: "asc" },
  });
}
