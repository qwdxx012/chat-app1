import supabase from "../utils/supabase.js";
import prisma from "../prisma/prismaClient.js";
import AppError from "../utils/appError.js";

// Регистрация нового пользователя: создаём в Supabase и в нашей БД
export async function register(email, password, name) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new AppError(error.message, 400);

  const user = await prisma.user.create({
    data: {
      supabaseId: data.user.id,
      email,
      name,
    },
  });

  return { user, session: data.session };
}

// Вход пользователя: аутентифицируемся через Supabase
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new AppError("Неверный электронный адрес или пароль", 401);

  return { session: data.session };
}

// Выход: инвалидируем сессию на стороне Supabase
export async function logout(accessToken) {
  const { error } = await supabase.auth.signOut(accessToken);
  if (error) throw new AppError(error.message, 400);
}

// Получить данные текущего пользователя по supabaseId
export async function getMe(supabaseId) {
  const user = await prisma.user.findUnique({
    where: { supabaseId },
  });
  if (!user) throw new AppError("Пользователь не найден", 404);
  return user;
}
