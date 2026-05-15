// Модуль управления пользовательским интерфейсом
const ui = {
  // Текущая активная вкладка: 'login' или 'register'
  currentTab: 'login',

  // Переключить вкладку авторизации и обновить интерфейс
  switchTab(tab) {
    this.currentTab = tab

    const btnLogin = document.getElementById('tab-login')
    const btnRegister = document.getElementById('tab-register')
    const fieldName = document.getElementById('field-name')
    const submitBtn = document.querySelector('#auth-form button[type="submit"]')

    if (tab === 'login') {
      btnLogin.className = btnLogin.className.replace('tab-inactive', 'tab-active')
      btnRegister.className = btnRegister.className.replace('tab-active', 'tab-inactive')
      fieldName.classList.add('hidden')
      submitBtn.textContent = 'Войти'
    } else {
      btnRegister.className = btnRegister.className.replace('tab-inactive', 'tab-active')
      btnLogin.className = btnLogin.className.replace('tab-active', 'tab-inactive')
      fieldName.classList.remove('hidden')
      submitBtn.textContent = 'Зарегистрироваться'
    }

    this.clearError()
  },

  // Показать сообщение об ошибке (авторизация или комната)
  showError(message) {
    const el = document.getElementById('auth-error') || document.getElementById('room-error')
    if (!el) return
    el.textContent = message
    el.classList.remove('hidden')
  },

  // Скрыть сообщение об ошибке
  clearError() {
    const el = document.getElementById('auth-error')
    if (el) el.classList.add('hidden')
  },

  // Отрисовать список комнат в боковой панели
  renderRooms(rooms, currentRoomId, onSelect) {
    const list = document.getElementById('rooms-list')
    list.innerHTML = ''
    rooms.forEach((room) => {
      const isActive = room.id === currentRoomId
      const li = document.createElement('li')
      li.className = `flex items-center gap-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
        isActive
          ? 'bg-[#404249] text-white'
          : 'text-[#949ba4] hover:bg-[#35373c] hover:text-white'
      }`
      li.innerHTML = `<span class="text-[#949ba4]">#</span><span class="truncate">${room.name}</span>`
      li.addEventListener('click', () => onSelect(room))
      list.appendChild(li)
    })
  },

  // Отрисовать все сообщения в области чата
  renderMessages(messages, currentUserId) {
    const area = document.getElementById('messages-area')
    // Удаляем всё кроме специальных блоков состояния
    Array.from(area.children).forEach((el) => {
      if (el.id !== 'empty-state' && el.id !== 'join-state') el.remove()
    })
    messages.forEach((msg) => {
      area.appendChild(this.createMessageEl(msg, currentUserId))
    })
    // Прокрутить вниз к последнему сообщению
    area.scrollTop = area.scrollHeight
  },

  // Очистить область сообщений (оставить блоки состояния)
  clearMessages() {
    const area = document.getElementById('messages-area')
    Array.from(area.children).forEach((el) => {
      if (el.id !== 'empty-state' && el.id !== 'join-state') el.remove()
    })
  },

  // Добавить одно новое сообщение (используется при получении через WebSocket)
  appendMessage(msg, currentUserId) {
    const area = document.getElementById('messages-area')
    area.appendChild(this.createMessageEl(msg, currentUserId))
    area.scrollTop = area.scrollHeight
  },

  // Создать DOM-элемент для одного сообщения
  createMessageEl(msg, currentUserId) {
    const isOwn = msg.senderId === currentUserId
    const div = document.createElement('div')
    div.className = `flex flex-col ${isOwn ? 'items-end' : 'items-start'}`
    div.innerHTML = `
      <span class="text-[#949ba4] text-xs mb-1">${msg.senderName}</span>
      <div class="max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm text-white ${
        isOwn ? 'bg-[#5865f2]' : 'bg-[#383a40]'
      }">${msg.content}</div>
    `
    return div
  },

  // Отрисовать список участников комнаты с индикаторами онлайн-статуса
  renderMembers(members, onlineIds) {
    const list = document.getElementById('members-list')
    list.innerHTML = ''
    members.forEach((user) => {
      const isOnline = onlineIds.has(user.id)
      const li = document.createElement('li')
      li.className = 'flex items-center gap-2 px-2 py-1.5 rounded text-sm text-[#949ba4]'
      li.innerHTML = `
        <div class="relative shrink-0">
          <div class="w-7 h-7 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-bold">
            ${(user.name || user.email)[0].toUpperCase()}
          </div>
          <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31] ${
            isOnline ? 'bg-green-500' : 'bg-[#747f8d]'
          }"></span>
        </div>
        <span class="truncate">${user.name || user.email}</span>
      `
      list.appendChild(li)
    })
  },

  // Обновить заголовок текущей комнаты и кнопку выхода
  setRoomHeader(room) {
    document.getElementById('room-name').textContent = room ? room.name : 'Выберите комнату'
    const leaveBtn = document.getElementById('btn-leave-room')
    if (room) leaveBtn.classList.remove('hidden')
    else leaveBtn.classList.add('hidden')
  },

  // Включить или отключить поле ввода сообщений
  setInputEnabled(enabled) {
    const input = document.getElementById('message-input')
    const btn = document.getElementById('btn-send')
    input.disabled = !enabled
    btn.disabled = !enabled
    input.placeholder = enabled ? 'Написать сообщение...' : 'Сообщение недоступно — выберите комнату'
  },

  // Показать состояние "нет выбранной комнаты"
  showEmptyState() {
    document.getElementById('empty-state').classList.remove('hidden')
    document.getElementById('join-state').classList.add('hidden')
  },

  // Показать экран предложения присоединиться к комнате
  showJoinState(room) {
    document.getElementById('join-room-name').textContent = room.name
    document.getElementById('join-state').classList.remove('hidden')
    document.getElementById('empty-state').classList.add('hidden')
  },

  // Открыть модальное окно создания комнаты
  showModal() {
    document.getElementById('modal-create-room').classList.remove('hidden')
    document.getElementById('input-room-name').focus()
  },

  // Закрыть модальное окно и сбросить его состояние
  hideModal() {
    document.getElementById('modal-create-room').classList.add('hidden')
    document.getElementById('input-room-name').value = ''
    const err = document.getElementById('room-error')
    if (err) err.classList.add('hidden')
  },

  // Отобразить данные текущего пользователя в интерфейсе
  setUser(user) {
    const name = user.name || user.email
    document.getElementById('user-name').textContent = name
    document.getElementById('user-avatar').textContent = name[0].toUpperCase()
  },
}
