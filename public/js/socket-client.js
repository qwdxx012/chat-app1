// Клиент для работы с WebSocket-соединением через Socket.IO
const socketClient = {
  // Текущее сокет-соединение (null если не подключён)
  socket: null,

  // Установить соединение с сервером, передав JWT-токен для аутентификации
  connect(token) {
    this.socket = io('http://localhost:3000/chat', {
      auth: { token },
    })

    // Обработчик ошибки подключения — выводим в консоль
    this.socket.on('connect_error', (err) => {
      console.error('Socket ошибка подключения:', err.message)
    })
  },

  // Закрыть соединение и обнулить ссылку (например при выходе)
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  },

  // Отправить событие входа в комнату на сервер
  joinRoom(roomId) {
    this.socket.emit('room:join', roomId)
  },

  // Отправить событие выхода из комнаты на сервер
  leaveRoom(roomId) {
    this.socket.emit('room:leave', roomId)
  },

  // Отправить сообщение в комнату через WebSocket
  sendMessage(roomId, content) {
    this.socket.emit('message:send', roomId, content)
  },

  // Подписаться на событие успешного входа в комнату
  onRoomJoined(cb) {
    this.socket.on('room:joined', cb)
  },

  // Подписаться на событие выхода из комнаты
  onRoomLeft(cb) {
    this.socket.on('room:left', cb)
  },

  // Подписаться на входящие сообщения
  onMessage(cb) {
    this.socket.on('message:receive', cb)
  },

  // Подписаться на обновление списка пользователей в комнате
  onRoomUsers(cb) {
    this.socket.on('room:users', cb)
  },

  // Подписаться на событие появления пользователя онлайн
  onUserOnline(cb) {
    this.socket.on('user:online', cb)
  },

  // Подписаться на событие ухода пользователя офлайн
  onUserOffline(cb) {
    this.socket.on('user:offline', cb)
  },

  // Подписаться на ошибки от сервера через сокет
  onError(cb) {
    this.socket.on('error', cb)
  },
}
