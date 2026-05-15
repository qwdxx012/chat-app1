// Центральное хранилище состояния всего приложения
const state = {
  user: null,           // Текущий авторизованный пользователь
  rooms: [],            // Все доступные комнаты
  currentRoom: null,    // Выбранная комната
  members: [],          // Участники текущей комнаты
  onlineIds: new Set(), // ID пользователей онлайн
  myRoomIds: null,      // Set с ID комнат, в которых состоит пользователь
  pendingRoom: null,    // Комната, к которой пользователь хочет присоединиться
}

// ─── Блок страницы авторизации ───────────────────────────────────────────────

const authForm = document.getElementById('auth-form')
if (authForm) {
  // Переключение вкладок Войти / Регистрация
  document.getElementById('tab-login').addEventListener('click', () => ui.switchTab('login'))
  document.getElementById('tab-register').addEventListener('click', () => ui.switchTab('register'))

  // Отправка формы входа или регистрации
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    ui.clearError()

    const email = document.getElementById('input-email').value.trim()
    const password = document.getElementById('input-password').value.trim()

    try {
      // При регистрации сначала создаём аккаунт
      if (ui.currentTab === 'register') {
        const name = document.getElementById('input-name').value.trim()
        await api.register(email, password, name)
      }

      // Затем в любом случае выполняем вход и сохраняем токен
      const data = await api.login(email, password)
      localStorage.setItem('token', data.session.access_token)
      localStorage.setItem('user_email', email)
      window.location.href = '/chat.html'
    } catch (err) {
      ui.showError(err.message)
    }
  })
}

// ─── Блок страницы чата ───────────────────────────────────────────────────────

const roomsList = document.getElementById('rooms-list')
if (roomsList) {
  const token = api.getToken()
  // Если токена нет — перенаправляем на страницу входа
  if (!token) {
    window.location.href = '/login.html'
  } else {
    initChat()
  }
}

// Основная функция инициализации чата
async function initChat() {
  const token = api.getToken()

  // Загружаем данные текущего пользователя и отображаем в интерфейсе
  state.user = await api.getMe()
  ui.setUser(state.user)

  // Устанавливаем WebSocket-соединение с токеном для аутентификации
  socketClient.connect(token)

  // ── Обработчики входящих событий от сервера ──

  // Новое сообщение — показываем только если оно для текущей комнаты
  socketClient.onMessage((msg) => {
    if (msg.roomId === state.currentRoom?.id) {
      ui.appendMessage(msg, state.user?.id)
    }
  })

  // Обновление списка участников комнаты
  socketClient.onRoomUsers((members) => {
    state.members = members
    state.onlineIds = new Set(members.map((m) => m.id))
    ui.renderMembers(state.members, state.onlineIds)
  })

  // Пользователь появился онлайн — обновляем список
  socketClient.onUserOnline(({ userId, username }) => {
    if (state.currentRoom) {
      state.onlineIds.add(userId)
      if (!state.members.find((m) => m.id === userId)) {
        state.members.push({ id: userId, name: username })
      }
      ui.renderMembers(state.members, state.onlineIds)
    }
  })

  // Пользователь ушёл офлайн — убираем из онлайн-списка
  socketClient.onUserOffline(({ userId }) => {
    if (state.currentRoom) {
      state.onlineIds.delete(userId)
      ui.renderMembers(state.members, state.onlineIds)
    }
  })

  // Ошибка от сервера через сокет
  socketClient.onError(({ message }) => {
    console.error('Socket error:', message)
  })

  // Пользователь успешно вошёл в комнату — обновляем список
  socketClient.onRoomJoined(({ roomId }) => {
    if (state.myRoomIds && !state.myRoomIds.has(roomId)) {
      state.myRoomIds.add(roomId)
      ui.renderRooms(state.rooms, state.currentRoom?.id, selectRoom)
    }
  })

  // Пользователь вышел из комнаты — обновляем список
  socketClient.onRoomLeft(({ roomId }) => {
    if (state.myRoomIds) {
      state.myRoomIds.delete(roomId)
      ui.renderRooms(state.rooms, state.currentRoom?.id, selectRoom)
    }
  })

  // Загружаем все комнаты
  await loadRooms()

  // ── Кнопка выхода из аккаунта ──
  document.getElementById('btn-logout').addEventListener('click', async () => {
    try {
      await api.logout()
    } finally {
      localStorage.clear()
      socketClient.disconnect()
      window.location.href = '/login.html'
    }
  })

  // ── Кнопки модального окна создания комнаты ──
  document.getElementById('btn-create-room').addEventListener('click', () => ui.showModal())
  document.getElementById('btn-cancel-room').addEventListener('click', () => ui.hideModal())

  // Подтверждение создания комнаты
  document.getElementById('btn-confirm-room').addEventListener('click', async () => {
    const name = document.getElementById('input-room-name').value.trim()
    if (!name) return
    try {
      const room = await api.createRoom(name)
      state.rooms.unshift(room)
      ui.renderRooms(state.rooms, state.currentRoom?.id, selectRoom)
      ui.hideModal()
    } catch (err) {
      const errEl = document.getElementById('room-error')
      errEl.textContent = err.message
      errEl.classList.remove('hidden')
    }
  })

  // ── Кнопка выхода из текущей комнаты ──
  document.getElementById('btn-leave-room').addEventListener('click', () => {
    if (!state.currentRoom) return
    const roomId = state.currentRoom.id
    socketClient.leaveRoom(roomId)
    state.currentRoom = null
    state.members = []
    state.onlineIds = new Set()
    localStorage.removeItem('currentRoomId')
    if (state.myRoomIds) state.myRoomIds.delete(roomId)
    ui.setRoomHeader(null)
    ui.setInputEnabled(false)
    ui.renderMembers([], new Set())
    ui.clearMessages()
    ui.showEmptyState()
    ui.renderRooms(state.rooms, null, selectRoom)
  })

  // ── Кнопка присоединения к комнате (из экрана join-state) ──
  document.getElementById('btn-join-room').addEventListener('click', () => joinRoom(state.pendingRoom))

  // ── Отправка сообщений ──
  const messageInput = document.getElementById('message-input')
  document.getElementById('btn-send').addEventListener('click', sendMessage)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage()
  })
}

// Загрузить все комнаты и список комнат пользователя
async function loadRooms() {
  const [rooms, myRoomIds] = await Promise.all([api.getRooms(), api.getMyRooms()])
  state.rooms = rooms
  state.myRoomIds = new Set(myRoomIds)

  // Попробовать восстановить последнюю открытую комнату
  const savedRoomId = localStorage.getItem('currentRoomId')
  if (savedRoomId && state.myRoomIds.has(savedRoomId)) {
    const room = state.rooms.find((r) => r.id === savedRoomId)
    if (room) await joinRoom(room)
  } else {
    ui.renderRooms(state.rooms, state.currentRoom?.id, selectRoom)
  }
}

// Выбрать комнату из списка
function selectRoom(room) {
  if (state.currentRoom?.id === room.id) return

  // Если уже есть активная комната — сбрасываем её состояние
  if (state.currentRoom) {
    state.currentRoom = null
    state.members = []
    state.onlineIds = new Set()
    ui.setRoomHeader(null)
    ui.setInputEnabled(false)
    ui.renderMembers([], new Set())
    ui.clearMessages()
  }

  // Если пользователь уже в этой комнате — входим, иначе показываем экран join
  if (state.myRoomIds?.has(room.id)) {
    joinRoom(room)
  } else {
    state.pendingRoom = room
    ui.showJoinState(room)
    ui.renderRooms(state.rooms, room.id, selectRoom)
  }
}

// Войти в комнату: обновить состояние, загрузить историю сообщений
async function joinRoom(room) {
  if (!room) return

  state.currentRoom = room
  state.pendingRoom = null
  state.members = []
  state.onlineIds = new Set()

  // Сохранить выбранную комнату в localStorage для восстановления при перезагрузке
  localStorage.setItem('currentRoomId', room.id)
  if (state.myRoomIds) state.myRoomIds.add(room.id)

  ui.setRoomHeader(room)
  ui.setInputEnabled(true)
  ui.showEmptyState()
  document.getElementById('join-state').classList.add('hidden')
  document.getElementById('empty-state').classList.add('hidden')
  ui.renderMembers([], new Set())

  // Подписаться на события комнаты через WebSocket
  socketClient.joinRoom(room.id)

  // Загрузить историю сообщений через REST API
  const messages = await api.getMessages(room.id)
  ui.renderMessages(
    messages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.sender.id,
      senderName: m.sender.name || m.sender.email,
      createdAt: m.createdAt,
      roomId: room.id,
    })),
    state.user?.id
  )

  ui.renderRooms(state.rooms, state.currentRoom?.id, selectRoom)
}

// Отправить сообщение в текущую комнату
function sendMessage() {
  const input = document.getElementById('message-input')
  const content = input.value.trim()
  if (!content || !state.currentRoom) return
  socketClient.sendMessage(state.currentRoom.id, content)
  input.value = ''
}
