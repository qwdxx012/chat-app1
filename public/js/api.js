// Базовый URL сервера для всех HTTP-запросов
const API_URL = 'http://localhost:3000/api'

// Объект api — единая точка для всех запросов к серверу
const api = {

  // Получить токен из localStorage (сохраняется при входе)
  getToken() {
    return localStorage.getItem('token')
  },

  // Сформировать заголовки для защищённых запросов с Bearer-токеном
  authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getToken()}`,
    }
  },

  // Универсальный метод для всех HTTP-запросов
  async request(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, options)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Ошибка запроса')
    return data
  },

  // Регистрация нового пользователя
  async register(email, password, name) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    return data
  },

  // Вход в систему по email и паролю
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return data
  },

  // Выход из системы (требует авторизации)
  async logout() {
    await this.request('/auth/logout', {
      method: 'POST',
      headers: this.authHeaders(),
    })
  },

  // Получить данные текущего авторизованного пользователя
  async getMe() {
    const data = await this.request('/auth/me', {
      headers: this.authHeaders(),
    })
    return data.user
  },

  // Получить список ID комнат, в которых состоит текущий пользователь
  async getMyRooms() {
    const data = await this.request('/rooms/my', {
      headers: this.authHeaders(),
    })
    return data.roomIds
  },

  // Получить все доступные комнаты
  async getRooms() {
    const data = await this.request('/rooms', {
      headers: this.authHeaders(),
    })
    return data.rooms
  },

  // Создать новую комнату с указанным именем
  async createRoom(name) {
    const data = await this.request('/rooms', {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ name }),
    })
    return data.room
  },

  // Удалить комнату по ID
  async deleteRoom(id) {
    await this.request(`/rooms/${id}`, {
      method: 'DELETE',
      headers: this.authHeaders(),
    })
  },

  // Получить сообщения конкретной комнаты
  async getMessages(roomId) {
    const data = await this.request(`/rooms/${roomId}/messages`, {
      headers: this.authHeaders(),
    })
    return data.messages
  },
}
