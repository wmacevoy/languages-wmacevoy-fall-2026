const lotList = document.getElementById('lot-list');
const lastUpdated = document.getElementById('last-updated');
const refreshBtn = document.getElementById('refresh');
const languageSelect = document.getElementById('language-select');

const loginForm = document.getElementById('login-form');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginStatus = document.getElementById('login-status');
const logoutBtn = document.getElementById('logout');
const currentUserLabel = document.getElementById('current-user');

const adminPanel = document.getElementById('admin-panel');
const adminForm = document.getElementById('admin-form');
const adminSelect = document.getElementById('admin-lot');
const adminStatus = document.getElementById('admin-status');

const sensorPanel = document.getElementById('sensor-panel');
const sensorForm = document.getElementById('sensor-form');
const sensorSelect = document.getElementById('sensor-lot');
const sensorOccupancy = document.getElementById('sensor-occupancy');
const sensorStatus = document.getElementById('sensor-status');

const usersPanel = document.getElementById('users-panel');
const userForm = document.getElementById('user-form');
const userUsername = document.getElementById('user-username');
const userPassword = document.getElementById('user-password');
const userRole = document.getElementById('user-role');
const userLotRow = document.getElementById('user-lot-row');
const userLotSelect = document.getElementById('user-lot');
const userList = document.getElementById('user-list');
const userStatus = document.getElementById('user-status');

const translations = {
  en: {
    languageLabel: 'Language',
    eyebrowCityParking: 'City Parking',
    heroTitle: 'Live Parking Availability',
    heroSubtitle:
      'Customers see open lots and live availability. Admins open/close lots. Sensors update occupancy.',
    lastRefresh: 'Last Refresh',
    refreshNow: 'Refresh Now',
    customerViewTitle: 'Customer View',
    customerViewSubtitle: 'Open lots with available spaces.',
    languagePanelTitle: 'First Languages Over 100M',
    languagePanelSubtitle: 'Approximate native-speaker populations.',
    loginTitle: 'Login',
    loginSubtitle: 'Admins and sensors sign in to manage lots.',
    usernameLabel: 'Username',
    passwordLabel: 'Password',
    signIn: 'Sign In',
    currentUserLabel: 'Current User',
    currentUserFormat: '{username} ({role})',
    guest: 'Guest',
    logout: 'Logout',
    adminConsoleTitle: 'Admin Console',
    adminConsoleSubtitle: 'Open or close parking areas.',
    lotLabel: 'Lot',
    openLot: 'Open Lot',
    closeLot: 'Close Lot',
    sensorUpdateTitle: 'Sensor Update',
    sensorUpdateSubtitle: 'Push occupancy counts for a lot.',
    occupancyLabel: 'Occupancy',
    sendUpdate: 'Send Update',
    userManagementTitle: 'User Management',
    userManagementSubtitle: 'Admins create or remove users.',
    userNamePlaceholder: 'sensor/2',
    roleLabel: 'Role',
    roleNone: 'None',
    roleSensor: 'Sensor',
    roleAdmin: 'Admin',
    roleRoot: 'root',
    sensorLotLabel: 'Sensor Lot',
    createUser: 'Create User',
    delete: 'Delete',
    lotOpen: 'Open',
    lotClosed: 'Closed',
    availableLabel: 'Available',
    capacityLabel: 'Capacity',
    occupiedLabel: 'Occupied',
    updatedLabel: 'Updated',
    working: 'Working...',
    sending: 'Sending...',
    signingIn: 'Signing in...',
    signedIn: 'Signed in.',
    signedOut: 'Signed out.',
    creating: 'Creating...',
    removing: 'Removing...',
    errLoadLots: 'Failed to load lots',
    errLoadUsers: 'Failed to load users',
    errActionFailed: 'Action failed',
    errUpdateFailed: 'Update failed',
    errLoginFailed: 'Login failed',
    errCreateFailed: 'Create failed',
    errDeleteFailed: 'Delete failed',
    lotNowState: '{name} is now {state}.',
    stateOpen: 'open',
    stateClosed: 'closed',
    occupancyUpdated: '{name} occupancy updated to {occupancy}.',
    createdUser: 'Created {username}.',
    deletedUser: 'Deleted {username}.',
  },
  zh: {
    languageLabel: '语言',
    eyebrowCityParking: '城市停车',
    heroTitle: '实时停车位可用性',
    heroSubtitle: '客户可查看开放停车场和实时车位。管理员可开放或关闭停车场。传感器更新占用量。',
    lastRefresh: '上次刷新',
    refreshNow: '立即刷新',
    customerViewTitle: '客户视图',
    customerViewSubtitle: '显示有空位的开放停车场。',
    languagePanelTitle: '母语使用者超过1亿的语言',
    languagePanelSubtitle: '母语使用者人数为近似值。',
    loginTitle: '登录',
    loginSubtitle: '管理员和传感器用户登录后可管理停车场。',
    usernameLabel: '用户名',
    passwordLabel: '密码',
    signIn: '登录',
    currentUserLabel: '当前用户',
    currentUserFormat: '{username}（{role}）',
    guest: '访客',
    logout: '退出登录',
    adminConsoleTitle: '管理控制台',
    adminConsoleSubtitle: '开放或关闭停车区域。',
    lotLabel: '停车场',
    openLot: '开放停车场',
    closeLot: '关闭停车场',
    sensorUpdateTitle: '传感器更新',
    sensorUpdateSubtitle: '上传停车场占用数量。',
    occupancyLabel: '占用量',
    sendUpdate: '发送更新',
    userManagementTitle: '用户管理',
    userManagementSubtitle: '管理员可创建或移除用户。',
    userNamePlaceholder: 'sensor/2',
    roleLabel: '角色',
    roleNone: '无',
    roleSensor: '传感器',
    roleAdmin: '管理员',
    roleRoot: '根用户',
    sensorLotLabel: '传感器停车场',
    createUser: '创建用户',
    delete: '删除',
    lotOpen: '开放',
    lotClosed: '关闭',
    availableLabel: '可用',
    capacityLabel: '容量',
    occupiedLabel: '已占用',
    updatedLabel: '更新时间',
    working: '处理中...',
    sending: '发送中...',
    signingIn: '登录中...',
    signedIn: '已登录。',
    signedOut: '已退出。',
    creating: '创建中...',
    removing: '移除中...',
    errLoadLots: '加载停车场失败',
    errLoadUsers: '加载用户失败',
    errActionFailed: '操作失败',
    errUpdateFailed: '更新失败',
    errLoginFailed: '登录失败',
    errCreateFailed: '创建失败',
    errDeleteFailed: '删除失败',
    lotNowState: '{name} 现已{state}。',
    stateOpen: '开放',
    stateClosed: '关闭',
    occupancyUpdated: '{name} 的占用量已更新为 {occupancy}。',
    createdUser: '已创建 {username}。',
    deletedUser: '已删除 {username}。',
  },
  es: {
    languageLabel: 'Idioma',
    eyebrowCityParking: 'Estacionamiento Urbano',
    heroTitle: 'Disponibilidad de Estacionamiento en Vivo',
    heroSubtitle:
      'Los clientes ven lotes abiertos y disponibilidad en vivo. Los administradores abren o cierran lotes. Los sensores actualizan la ocupación.',
    lastRefresh: 'Última Actualización',
    refreshNow: 'Actualizar Ahora',
    customerViewTitle: 'Vista del Cliente',
    customerViewSubtitle: 'Lotes abiertos con espacios disponibles.',
    languagePanelTitle: 'Primeras Lenguas con Más de 100M',
    languagePanelSubtitle: 'Poblaciones aproximadas de hablantes nativos.',
    loginTitle: 'Inicio de Sesión',
    loginSubtitle: 'Administradores y sensores inician sesión para gestionar lotes.',
    usernameLabel: 'Usuario',
    passwordLabel: 'Contraseña',
    signIn: 'Entrar',
    currentUserLabel: 'Usuario Actual',
    currentUserFormat: '{username} ({role})',
    guest: 'Invitado',
    logout: 'Cerrar Sesión',
    adminConsoleTitle: 'Consola de Administración',
    adminConsoleSubtitle: 'Abrir o cerrar áreas de estacionamiento.',
    lotLabel: 'Lote',
    openLot: 'Abrir Lote',
    closeLot: 'Cerrar Lote',
    sensorUpdateTitle: 'Actualización de Sensor',
    sensorUpdateSubtitle: 'Enviar conteos de ocupación para un lote.',
    occupancyLabel: 'Ocupación',
    sendUpdate: 'Enviar Actualización',
    userManagementTitle: 'Gestión de Usuarios',
    userManagementSubtitle: 'Los administradores crean o eliminan usuarios.',
    userNamePlaceholder: 'sensor/2',
    roleLabel: 'Rol',
    roleNone: 'Ninguno',
    roleSensor: 'Sensor',
    roleAdmin: 'Administrador',
    roleRoot: 'raíz',
    sensorLotLabel: 'Lote del Sensor',
    createUser: 'Crear Usuario',
    delete: 'Eliminar',
    lotOpen: 'Abierto',
    lotClosed: 'Cerrado',
    availableLabel: 'Disponible',
    capacityLabel: 'Capacidad',
    occupiedLabel: 'Ocupado',
    updatedLabel: 'Actualizado',
    working: 'Procesando...',
    sending: 'Enviando...',
    signingIn: 'Iniciando sesión...',
    signedIn: 'Sesión iniciada.',
    signedOut: 'Sesión cerrada.',
    creating: 'Creando...',
    removing: 'Eliminando...',
    errLoadLots: 'No se pudieron cargar los lotes',
    errLoadUsers: 'No se pudieron cargar los usuarios',
    errActionFailed: 'La acción falló',
    errUpdateFailed: 'La actualización falló',
    errLoginFailed: 'Falló el inicio de sesión',
    errCreateFailed: 'Falló la creación',
    errDeleteFailed: 'Falló la eliminación',
    lotNowState: '{name} ahora está {state}.',
    stateOpen: 'abierto',
    stateClosed: 'cerrado',
    occupancyUpdated: 'La ocupación de {name} se actualizó a {occupancy}.',
    createdUser: 'Se creó {username}.',
    deletedUser: 'Se eliminó {username}.',
  },
  hi: {
    languageLabel: 'भाषा',
    eyebrowCityParking: 'शहर पार्किंग',
    heroTitle: 'लाइव पार्किंग उपलब्धता',
    heroSubtitle: 'ग्राहक खुले लॉट और लाइव उपलब्धता देखते हैं। एडमिन लॉट खोलते/बंद करते हैं। सेंसर ऑक्यूपेंसी अपडेट करते हैं।',
    lastRefresh: 'अंतिम रिफ्रेश',
    refreshNow: 'अभी रिफ्रेश करें',
    customerViewTitle: 'ग्राहक दृश्य',
    customerViewSubtitle: 'उपलब्ध स्थानों वाले खुले लॉट।',
    languagePanelTitle: '10 करोड़ से अधिक मातृभाषाएँ',
    languagePanelSubtitle: 'मातृभाषी जनसंख्या का अनुमान।',
    loginTitle: 'लॉगिन',
    loginSubtitle: 'लॉट प्रबंधन के लिए एडमिन और सेंसर साइन इन करें।',
    usernameLabel: 'यूज़रनेम',
    passwordLabel: 'पासवर्ड',
    signIn: 'साइन इन',
    currentUserLabel: 'वर्तमान उपयोगकर्ता',
    currentUserFormat: '{username} ({role})',
    guest: 'अतिथि',
    logout: 'लॉगआउट',
    adminConsoleTitle: 'एडमिन कंसोल',
    adminConsoleSubtitle: 'पार्किंग क्षेत्र खोलें या बंद करें।',
    lotLabel: 'लॉट',
    openLot: 'लॉट खोलें',
    closeLot: 'लॉट बंद करें',
    sensorUpdateTitle: 'सेंसर अपडेट',
    sensorUpdateSubtitle: 'किसी लॉट के लिए ऑक्यूपेंसी काउंट भेजें।',
    occupancyLabel: 'ऑक्यूपेंसी',
    sendUpdate: 'अपडेट भेजें',
    userManagementTitle: 'उपयोगकर्ता प्रबंधन',
    userManagementSubtitle: 'एडमिन उपयोगकर्ता बनाते या हटाते हैं।',
    userNamePlaceholder: 'sensor/2',
    roleLabel: 'भूमिका',
    roleNone: 'कोई नहीं',
    roleSensor: 'सेंसर',
    roleAdmin: 'एडमिन',
    roleRoot: 'रूट',
    sensorLotLabel: 'सेंसर लॉट',
    createUser: 'उपयोगकर्ता बनाएँ',
    delete: 'हटाएँ',
    lotOpen: 'खुला',
    lotClosed: 'बंद',
    availableLabel: 'उपलब्ध',
    capacityLabel: 'क्षमता',
    occupiedLabel: 'भरा हुआ',
    updatedLabel: 'अपडेट',
    working: 'काम हो रहा है...',
    sending: 'भेजा जा रहा है...',
    signingIn: 'साइन इन हो रहा है...',
    signedIn: 'साइन इन हो गया।',
    signedOut: 'साइन आउट हो गया।',
    creating: 'बनाया जा रहा है...',
    removing: 'हटाया जा रहा है...',
    errLoadLots: 'लॉट लोड नहीं हो सके',
    errLoadUsers: 'उपयोगकर्ता लोड नहीं हो सके',
    errActionFailed: 'कार्रवाई विफल रही',
    errUpdateFailed: 'अपडेट विफल रहा',
    errLoginFailed: 'लॉगिन विफल रहा',
    errCreateFailed: 'बनाना विफल रहा',
    errDeleteFailed: 'हटाना विफल रहा',
    lotNowState: '{name} अब {state} है।',
    stateOpen: 'खुला',
    stateClosed: 'बंद',
    occupancyUpdated: '{name} की ऑक्यूपेंसी {occupancy} पर अपडेट हुई।',
    createdUser: '{username} बनाया गया।',
    deletedUser: '{username} हटाया गया।',
  },
  bn: {
    languageLabel: 'ভাষা',
    eyebrowCityParking: 'সিটি পার্কিং',
    heroTitle: 'লাইভ পার্কিং প্রাপ্যতা',
    heroSubtitle: 'গ্রাহকরা খোলা লট ও লাইভ প্রাপ্যতা দেখেন। অ্যাডমিন লট খোলেন/বন্ধ করেন। সেন্সর দখল আপডেট করে।',
    lastRefresh: 'সর্বশেষ রিফ্রেশ',
    refreshNow: 'এখনই রিফ্রেশ',
    customerViewTitle: 'গ্রাহক ভিউ',
    customerViewSubtitle: 'উপলব্ধ জায়গাসহ খোলা লট।',
    languagePanelTitle: '১০ কোটির বেশি মাতৃভাষা',
    languagePanelSubtitle: 'মাতৃভাষী জনসংখ্যা আনুমানিক।',
    loginTitle: 'লগইন',
    loginSubtitle: 'লট ম্যানেজ করতে অ্যাডমিন ও সেন্সর সাইন ইন করে।',
    usernameLabel: 'ইউজারনেম',
    passwordLabel: 'পাসওয়ার্ড',
    signIn: 'সাইন ইন',
    currentUserLabel: 'বর্তমান ব্যবহারকারী',
    currentUserFormat: '{username} ({role})',
    guest: 'অতিথি',
    logout: 'লগআউট',
    adminConsoleTitle: 'অ্যাডমিন কনসোল',
    adminConsoleSubtitle: 'পার্কিং এলাকা খুলুন বা বন্ধ করুন।',
    lotLabel: 'লট',
    openLot: 'লট খুলুন',
    closeLot: 'লট বন্ধ করুন',
    sensorUpdateTitle: 'সেন্সর আপডেট',
    sensorUpdateSubtitle: 'একটি লটের দখল সংখ্যা পাঠান।',
    occupancyLabel: 'দখল',
    sendUpdate: 'আপডেট পাঠান',
    userManagementTitle: 'ব্যবহারকারী ব্যবস্থাপনা',
    userManagementSubtitle: 'অ্যাডমিন ব্যবহারকারী তৈরি বা সরান।',
    userNamePlaceholder: 'sensor/2',
    roleLabel: 'ভূমিকা',
    roleNone: 'কোনোটি নয়',
    roleSensor: 'সেন্সর',
    roleAdmin: 'অ্যাডমিন',
    roleRoot: 'রুট',
    sensorLotLabel: 'সেন্সর লট',
    createUser: 'ব্যবহারকারী তৈরি করুন',
    delete: 'মুছুন',
    lotOpen: 'খোলা',
    lotClosed: 'বন্ধ',
    availableLabel: 'উপলব্ধ',
    capacityLabel: 'ক্ষমতা',
    occupiedLabel: 'দখলকৃত',
    updatedLabel: 'আপডেট',
    working: 'কাজ হচ্ছে...',
    sending: 'পাঠানো হচ্ছে...',
    signingIn: 'সাইন ইন হচ্ছে...',
    signedIn: 'সাইন ইন হয়েছে।',
    signedOut: 'সাইন আউট হয়েছে।',
    creating: 'তৈরি হচ্ছে...',
    removing: 'সরানো হচ্ছে...',
    errLoadLots: 'লট লোড করা যায়নি',
    errLoadUsers: 'ব্যবহারকারী লোড করা যায়নি',
    errActionFailed: 'কাজটি ব্যর্থ হয়েছে',
    errUpdateFailed: 'আপডেট ব্যর্থ হয়েছে',
    errLoginFailed: 'লগইন ব্যর্থ হয়েছে',
    errCreateFailed: 'তৈরি করা ব্যর্থ হয়েছে',
    errDeleteFailed: 'মুছে ফেলা ব্যর্থ হয়েছে',
    lotNowState: '{name} এখন {state}।',
    stateOpen: 'খোলা',
    stateClosed: 'বন্ধ',
    occupancyUpdated: '{name} এর দখল {occupancy} এ আপডেট হয়েছে।',
    createdUser: '{username} তৈরি হয়েছে।',
    deletedUser: '{username} মুছে ফেলা হয়েছে।',
  },
  pt: {
    languageLabel: 'Idioma',
    eyebrowCityParking: 'Estacionamento Urbano',
    heroTitle: 'Disponibilidade de Estacionamento ao Vivo',
    heroSubtitle:
      'Clientes veem lotes abertos e disponibilidade ao vivo. Administradores abrem/fecham lotes. Sensores atualizam a ocupação.',
    lastRefresh: 'Última Atualização',
    refreshNow: 'Atualizar Agora',
    customerViewTitle: 'Visão do Cliente',
    customerViewSubtitle: 'Lotes abertos com vagas disponíveis.',
    languagePanelTitle: 'Primeiras Línguas com Mais de 100M',
    languagePanelSubtitle: 'Populações aproximadas de falantes nativos.',
    loginTitle: 'Entrar',
    loginSubtitle: 'Administradores e sensores entram para gerenciar lotes.',
    usernameLabel: 'Usuário',
    passwordLabel: 'Senha',
    signIn: 'Entrar',
    currentUserLabel: 'Usuário Atual',
    currentUserFormat: '{username} ({role})',
    guest: 'Convidado',
    logout: 'Sair',
    adminConsoleTitle: 'Console Administrativo',
    adminConsoleSubtitle: 'Abrir ou fechar áreas de estacionamento.',
    lotLabel: 'Lote',
    openLot: 'Abrir Lote',
    closeLot: 'Fechar Lote',
    sensorUpdateTitle: 'Atualização do Sensor',
    sensorUpdateSubtitle: 'Enviar contagens de ocupação para um lote.',
    occupancyLabel: 'Ocupação',
    sendUpdate: 'Enviar Atualização',
    userManagementTitle: 'Gerenciamento de Usuários',
    userManagementSubtitle: 'Administradores criam ou removem usuários.',
    userNamePlaceholder: 'sensor/2',
    roleLabel: 'Função',
    roleNone: 'Nenhuma',
    roleSensor: 'Sensor',
    roleAdmin: 'Administrador',
    roleRoot: 'root',
    sensorLotLabel: 'Lote do Sensor',
    createUser: 'Criar Usuário',
    delete: 'Excluir',
    lotOpen: 'aberto',
    lotClosed: 'fechado',
    availableLabel: 'Disponível',
    capacityLabel: 'Capacidade',
    occupiedLabel: 'Ocupado',
    updatedLabel: 'Atualizado',
    working: 'Processando...',
    sending: 'Enviando...',
    signingIn: 'Entrando...',
    signedIn: 'Sessão iniciada.',
    signedOut: 'Sessão encerrada.',
    creating: 'Criando...',
    removing: 'Removendo...',
    errLoadLots: 'Falha ao carregar lotes',
    errLoadUsers: 'Falha ao carregar usuários',
    errActionFailed: 'Ação falhou',
    errUpdateFailed: 'Atualização falhou',
    errLoginFailed: 'Falha no login',
    errCreateFailed: 'Falha ao criar',
    errDeleteFailed: 'Falha ao excluir',
    lotNowState: '{name} agora está {state}.',
    stateOpen: 'aberto',
    stateClosed: 'fechado',
    occupancyUpdated: 'A ocupação de {name} foi atualizada para {occupancy}.',
    createdUser: '{username} foi criado.',
    deletedUser: '{username} foi excluído.',
  },
  ru: {
    languageLabel: 'Язык',
    eyebrowCityParking: 'Городская Парковка',
    heroTitle: 'Доступность Парковки в Реальном Времени',
    heroSubtitle:
      'Клиенты видят открытые парковки и актуальную доступность. Администраторы открывают и закрывают парковки. Сенсоры обновляют занятость.',
    lastRefresh: 'Последнее Обновление',
    refreshNow: 'Обновить Сейчас',
    customerViewTitle: 'Вид Клиента',
    customerViewSubtitle: 'Открытые парковки со свободными местами.',
    languagePanelTitle: 'Родные Языки Более 100М',
    languagePanelSubtitle: 'Примерная численность носителей языка.',
    loginTitle: 'Вход',
    loginSubtitle: 'Администраторы и сенсоры входят для управления парковками.',
    usernameLabel: 'Имя пользователя',
    passwordLabel: 'Пароль',
    signIn: 'Войти',
    currentUserLabel: 'Текущий Пользователь',
    currentUserFormat: '{username} ({role})',
    guest: 'Гость',
    logout: 'Выйти',
    adminConsoleTitle: 'Консоль Администратора',
    adminConsoleSubtitle: 'Открывайте или закрывайте парковочные зоны.',
    lotLabel: 'Парковка',
    openLot: 'Открыть Парковку',
    closeLot: 'Закрыть Парковку',
    sensorUpdateTitle: 'Обновление Сенсора',
    sensorUpdateSubtitle: 'Отправьте данные занятости для парковки.',
    occupancyLabel: 'Занятость',
    sendUpdate: 'Отправить Обновление',
    userManagementTitle: 'Управление Пользователями',
    userManagementSubtitle: 'Администраторы создают и удаляют пользователей.',
    userNamePlaceholder: 'sensor/2',
    roleLabel: 'Роль',
    roleNone: 'Нет',
    roleSensor: 'Сенсор',
    roleAdmin: 'Администратор',
    roleRoot: 'root',
    sensorLotLabel: 'Парковка Сенсора',
    createUser: 'Создать Пользователя',
    delete: 'Удалить',
    lotOpen: 'открыта',
    lotClosed: 'закрыта',
    availableLabel: 'Доступно',
    capacityLabel: 'Вместимость',
    occupiedLabel: 'Занято',
    updatedLabel: 'Обновлено',
    working: 'Выполняется...',
    sending: 'Отправка...',
    signingIn: 'Вход...',
    signedIn: 'Вход выполнен.',
    signedOut: 'Вы вышли.',
    creating: 'Создание...',
    removing: 'Удаление...',
    errLoadLots: 'Не удалось загрузить парковки',
    errLoadUsers: 'Не удалось загрузить пользователей',
    errActionFailed: 'Действие не выполнено',
    errUpdateFailed: 'Обновление не выполнено',
    errLoginFailed: 'Ошибка входа',
    errCreateFailed: 'Ошибка создания',
    errDeleteFailed: 'Ошибка удаления',
    lotNowState: '{name} теперь {state}.',
    stateOpen: 'открыта',
    stateClosed: 'закрыта',
    occupancyUpdated: 'Занятость {name} обновлена до {occupancy}.',
    createdUser: 'Пользователь {username} создан.',
    deletedUser: 'Пользователь {username} удалён.',
  },
  ja: {
    languageLabel: '言語',
    eyebrowCityParking: '都市駐車場',
    heroTitle: 'リアルタイム駐車場空き状況',
    heroSubtitle: '利用者は営業中の駐車場と空き状況を確認できます。管理者は駐車場を開閉し、センサーが占有数を更新します。',
    lastRefresh: '最終更新',
    refreshNow: '今すぐ更新',
    customerViewTitle: '利用者ビュー',
    customerViewSubtitle: '空きがある営業中の駐車場。',
    languagePanelTitle: '母語話者が1億人超の言語',
    languagePanelSubtitle: '母語話者人口は概算です。',
    loginTitle: 'ログイン',
    loginSubtitle: '管理者とセンサーがサインインして駐車場を管理します。',
    usernameLabel: 'ユーザー名',
    passwordLabel: 'パスワード',
    signIn: 'サインイン',
    currentUserLabel: '現在のユーザー',
    currentUserFormat: '{username}（{role}）',
    guest: 'ゲスト',
    logout: 'ログアウト',
    adminConsoleTitle: '管理コンソール',
    adminConsoleSubtitle: '駐車エリアを開閉します。',
    lotLabel: '駐車場',
    openLot: '駐車場を開く',
    closeLot: '駐車場を閉じる',
    sensorUpdateTitle: 'センサー更新',
    sensorUpdateSubtitle: '駐車場の占有数を送信します。',
    occupancyLabel: '占有数',
    sendUpdate: '更新を送信',
    userManagementTitle: 'ユーザー管理',
    userManagementSubtitle: '管理者がユーザーを作成または削除します。',
    userNamePlaceholder: 'sensor/2',
    roleLabel: '役割',
    roleNone: 'なし',
    roleSensor: 'センサー',
    roleAdmin: '管理者',
    roleRoot: 'root',
    sensorLotLabel: 'センサー駐車場',
    createUser: 'ユーザー作成',
    delete: '削除',
    lotOpen: '営業中',
    lotClosed: '閉鎖中',
    availableLabel: '空き',
    capacityLabel: '収容台数',
    occupiedLabel: '使用中',
    updatedLabel: '更新',
    working: '処理中...',
    sending: '送信中...',
    signingIn: 'サインイン中...',
    signedIn: 'サインインしました。',
    signedOut: 'サインアウトしました。',
    creating: '作成中...',
    removing: '削除中...',
    errLoadLots: '駐車場の読み込みに失敗しました',
    errLoadUsers: 'ユーザーの読み込みに失敗しました',
    errActionFailed: '操作に失敗しました',
    errUpdateFailed: '更新に失敗しました',
    errLoginFailed: 'ログインに失敗しました',
    errCreateFailed: '作成に失敗しました',
    errDeleteFailed: '削除に失敗しました',
    lotNowState: '{name} は現在 {state} です。',
    stateOpen: '営業中',
    stateClosed: '閉鎖中',
    occupancyUpdated: '{name} の占有数を {occupancy} に更新しました。',
    createdUser: '{username} を作成しました。',
    deletedUser: '{username} を削除しました。',
  },
};


const dateLocales = {
  en: 'en-US',
  zh: 'zh-CN',
  es: 'es-ES',
  hi: 'hi-IN',
  bn: 'bn-BD',
  pt: 'pt-PT',
  ru: 'ru-RU',
  ja: 'ja-JP',
};

const state = {
  lots: [],
  users: [],
  language: localStorage.getItem('parking_language') || 'en',
  lastRefreshAt: null,
};

if (!translations[state.language]) {
  state.language = 'en';
}

const auth = {
  token: localStorage.getItem('parking_token'),
  user: null,
};

const t = (key, params = {}) => {
  const languagePack = translations[state.language] || translations.en;
  const template = languagePack[key] ?? translations.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, token) =>
    Object.prototype.hasOwnProperty.call(params, token)
      ? String(params[token])
      : `{${token}}`
  );
};

const currentDateLocale = () => dateLocales[state.language] || undefined;

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString(currentDateLocale());
};

const statusMessage = (element, message, isError = false) => {
  element.textContent = message;
  element.style.color = isError ? '#8a2b1f' : 'rgba(16, 21, 24, 0.65)';
};

const authFetch = (url, options = {}) => {
  const headers = new Headers(options.headers || {});
  if (auth.token) {
    headers.set('Authorization', `Bearer ${auth.token}`);
  }
  return fetch(url, { ...options, headers });
};

const isAdmin = () =>
  auth.user && (auth.user.is_root || auth.user.role === 'admin');

const isSensor = () =>
  auth.user && (auth.user.is_root || auth.user.role === 'sensor');

const roleLabel = (role, isRoot = false) => {
  if (isRoot) return t('roleRoot');
  if (role === 'admin') return t('roleAdmin');
  if (role === 'sensor') return t('roleSensor');
  return t('roleNone');
};

const updateLastRefreshDisplay = () => {
  lastUpdated.textContent = state.lastRefreshAt
    ? formatDateTime(state.lastRefreshAt)
    : '--';
};

const applyTranslations = () => {
  document.documentElement.lang = state.language;

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const { i18n } = element.dataset;
    if (i18n) {
      element.textContent = t(i18n);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (key) {
      element.placeholder = t(key);
    }
  });

  languageSelect.setAttribute('aria-label', t('languageLabel'));

  updateLastRefreshDisplay();
  setRoleVisibility();
  renderLots();
  renderUsers();
};

const setRoleVisibility = () => {
  adminPanel.hidden = !isAdmin();
  usersPanel.hidden = !isAdmin();
  sensorPanel.hidden = !isSensor();

  loginForm.hidden = Boolean(auth.user);
  logoutBtn.hidden = !auth.user;

  const label = auth.user
    ? t('currentUserFormat', {
        username: auth.user.username,
        role: roleLabel(auth.user.role, auth.user.is_root),
      })
    : t('guest');
  currentUserLabel.textContent = label;
};

const renderLots = () => {
  lotList.innerHTML = '';

  state.lots.forEach((lot, index) => {
    const card = document.createElement('div');
    card.className = 'lot-card';
    card.style.animationDelay = `${index * 60}ms`;

    const badgeClass = lot.is_open ? 'open' : 'closed';
    const badgeLabel = lot.is_open ? t('lotOpen') : t('lotClosed');

    card.innerHTML = `
      <div class="lot-top">
        <strong>${lot.name}</strong>
        <span class="badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <div class="availability">
        <span>${t('availableLabel')}</span>
        <strong>${lot.available}</strong>
      </div>
      <div class="meta-row">
        <span>${t('capacityLabel')}: ${lot.capacity}</span>
        <span>${t('occupiedLabel')}: ${lot.occupancy}</span>
      </div>
      <div class="meta-row">
        <span>${t('updatedLabel')}</span>
        <span>${formatDateTime(lot.updated_at)}</span>
      </div>
    `;

    lotList.appendChild(card);
  });
};

const sensorLots = () => {
  if (!isSensor()) return [];
  if (auth.user.is_root) return state.lots;
  const assignedLotId = Number(auth.user.lot_id);
  return state.lots.filter((lot) => lot.id === assignedLotId);
};

const renderSelects = () => {
  const adminValue = adminSelect.value;
  const sensorValue = sensorSelect.value;
  const userLotValue = userLotSelect.value;

  adminSelect.innerHTML = '';
  sensorSelect.innerHTML = '';
  userLotSelect.innerHTML = '';

  state.lots.forEach((lot) => {
    const option = document.createElement('option');
    option.value = lot.id;
    option.textContent = lot.name;

    const adminOption = option.cloneNode(true);
    adminSelect.appendChild(adminOption);

    const userOption = option.cloneNode(true);
    userLotSelect.appendChild(userOption);
  });

  const sensorList = sensorLots();
  sensorList.forEach((lot) => {
    const option = document.createElement('option');
    option.value = lot.id;
    option.textContent = lot.name;
    sensorSelect.appendChild(option);
  });

  if (adminValue) adminSelect.value = adminValue;
  if (sensorValue) sensorSelect.value = sensorValue;
  if (userLotValue) userLotSelect.value = userLotValue;

  sensorSelect.disabled = sensorList.length <= 1;
  updateOccupancyHint();
};

const updateOccupancyHint = () => {
  const selectedId = Number(sensorSelect.value);
  const lot = state.lots.find((item) => item.id === selectedId);
  if (!lot) return;

  sensorOccupancy.max = String(lot.capacity);
  sensorOccupancy.value = String(lot.occupancy);
};

const renderUsers = () => {
  userList.innerHTML = '';

  state.users.forEach((user) => {
    const row = document.createElement('div');
    row.className = 'user-row';

    const lotText = user.lot_name ? user.lot_name : '-';
    const roleText = roleLabel(user.role, user.is_root);

    row.innerHTML = `
      <div class="user-meta">
        <strong>${user.username}</strong>
        <span>${t('lotLabel')}: ${lotText}</span>
        <span class="tag">${roleText}</span>
      </div>
      <button class="danger" data-id="${user.id}" ${
        user.is_root ? 'disabled' : ''
      }>${t('delete')}</button>
    `;

    userList.appendChild(row);
  });
};

const loadLots = async () => {
  const response = await fetch('/api/lots');
  if (!response.ok) {
    throw new Error(t('errLoadLots'));
  }
  state.lots = await response.json();
  state.lastRefreshAt = Date.now();
  renderLots();
  renderSelects();
  updateLastRefreshDisplay();
};

const loadUsers = async () => {
  if (!isAdmin()) return;
  const response = await authFetch('/api/users');
  if (response.status === 401) {
    handleLogout();
    return;
  }
  if (!response.ok) {
    throw new Error(t('errLoadUsers'));
  }
  state.users = await response.json();
  renderUsers();
};

const handleAdminAction = async (action) => {
  adminStatus.textContent = t('working');
  const lotId = adminSelect.value;
  try {
    const response = await authFetch(`/api/lots/${lotId}/${action}`, {
      method: 'POST',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || t('errActionFailed'));
    }
    statusMessage(
      adminStatus,
      t('lotNowState', {
        name: data.name,
        state: data.is_open ? t('stateOpen') : t('stateClosed'),
      })
    );
    await loadLots();
  } catch (err) {
    statusMessage(adminStatus, err.message, true);
  }
};

const handleSensorUpdate = async (event) => {
  event.preventDefault();
  sensorStatus.textContent = t('sending');

  const lotId = sensorSelect.value;
  const occupancy = Number(sensorOccupancy.value);

  try {
    const response = await authFetch(`/api/lots/${lotId}/occupancy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ occupancy }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || t('errUpdateFailed'));
    }
    statusMessage(
      sensorStatus,
      t('occupancyUpdated', {
        name: data.name,
        occupancy: data.occupancy,
      })
    );
    await loadLots();
  } catch (err) {
    statusMessage(sensorStatus, err.message, true);
  }
};

const handleLogin = async (event) => {
  event.preventDefault();
  loginStatus.textContent = t('signingIn');
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loginUsername.value.trim(),
        password: loginPassword.value,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || t('errLoginFailed'));
    }
    auth.token = data.token;
    auth.user = data.user;
    localStorage.setItem('parking_token', auth.token);
    statusMessage(loginStatus, t('signedIn'));
    loginPassword.value = '';
    setRoleVisibility();
    await loadLots();
    await loadUsers();
  } catch (err) {
    statusMessage(loginStatus, err.message, true);
  }
};

const handleLogout = () => {
  auth.token = null;
  auth.user = null;
  localStorage.removeItem('parking_token');
  statusMessage(loginStatus, t('signedOut'));
  setRoleVisibility();
  loadLots().catch(() => {});
};

const loadSession = async () => {
  if (!auth.token) {
    setRoleVisibility();
    return;
  }

  const response = await authFetch('/api/me');
  if (!response.ok) {
    handleLogout();
    return;
  }

  const data = await response.json();
  if (!data.user) {
    handleLogout();
    return;
  }
  auth.user = data.user;
  setRoleVisibility();
};

const handleUserRoleChange = () => {
  userLotRow.hidden = userRole.value !== 'sensor';
};

const handleUserCreate = async (event) => {
  event.preventDefault();
  userStatus.textContent = t('creating');
  try {
    const payload = {
      username: userUsername.value.trim(),
      password: userPassword.value,
      role: userRole.value,
      lot_id: userRole.value === 'sensor' ? Number(userLotSelect.value) : null,
    };

    const response = await authFetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || t('errCreateFailed'));
    }
    statusMessage(userStatus, t('createdUser', { username: data.username }));
    userUsername.value = '';
    userPassword.value = '';
    await loadUsers();
  } catch (err) {
    statusMessage(userStatus, err.message, true);
  }
};

const handleUserDelete = async (event) => {
  const id = event.target.dataset.id;
  if (!id) return;
  userStatus.textContent = t('removing');
  try {
    const response = await authFetch(`/api/users/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || t('errDeleteFailed'));
    }
    statusMessage(userStatus, t('deletedUser', { username: data.username }));
    await loadUsers();
  } catch (err) {
    statusMessage(userStatus, err.message, true);
  }
};

const handleLanguageChange = (event) => {
  const nextLanguage = event.target.value;
  if (!translations[nextLanguage]) return;

  state.language = nextLanguage;
  localStorage.setItem('parking_language', state.language);
  applyTranslations();
};

refreshBtn.addEventListener('click', () => {
  loadLots().catch((err) => {
    statusMessage(adminStatus, err.message, true);
  });
});

loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
languageSelect.addEventListener('change', handleLanguageChange);

adminForm.addEventListener('click', (event) => {
  const action = event.target.dataset.action;
  if (action) {
    handleAdminAction(action);
  }
});

sensorForm.addEventListener('submit', handleSensorUpdate);

sensorSelect.addEventListener('change', updateOccupancyHint);
userRole.addEventListener('change', handleUserRoleChange);
userForm.addEventListener('submit', handleUserCreate);
userList.addEventListener('click', handleUserDelete);

languageSelect.value = state.language;
handleUserRoleChange();
applyTranslations();

Promise.all([loadSession(), loadLots()])
  .then(loadUsers)
  .catch((err) => {
    statusMessage(adminStatus, err.message, true);
  });

setInterval(() => {
  loadLots().catch(() => {});
}, 5000);
