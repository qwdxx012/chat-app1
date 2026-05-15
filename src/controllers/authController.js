import * as authService from "../services/authService.js";

// Регистрация нового пользователя
export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    const { user, session } = await authService.register(email, password, name);
    res.status(201).json({ user, session });
  } catch (error) {
    next(error);
  }
}

// Вход пользователя
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { session } = await authService.login(email, password);
    res.status(200).json({ session });
  } catch (error) {
    next(error);
  }
}

// Выход пользователя
export async function logout(req, res, next) {
  try {
    // Используем optional chaining для безопасного извлечения токена
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(400).json({ message: "Токен не предоставлен" });
    }
    await authService.logout(token);
    res.status(200).json({ message: "Выход выполнен" });
  } catch (error) {
    next(error);
  }
}

// Получить данные текущего авторизованного пользователя
export async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.sub);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}
