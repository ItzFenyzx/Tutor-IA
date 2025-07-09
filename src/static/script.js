// script.js - Tutor IA 3.0 - Sistema Completo

// === PREVENÇÃO DE FLASH BRANCO === //
document.documentElement.style.backgroundColor = localStorage.getItem('theme') === 'dark' ? '#1a1a1a' : '#ffffff';

document.addEventListener('DOMContentLoaded', function() {
    // Aplicar tema imediatamente
    applyTheme();
    
    // Verificar autenticação
    const userData = getUserData();
    if (!userData || !userData.isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    // Mostrar body após carregar
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);

    // === ELEMENTOS DOM === //
    const subjectsSection = document.getElementById('subjects-section');
    const chatArea = document.getElementById('chat-area');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const characterCount = document.getElementById('character-count');
    const userNameDisplay = document.getElementById('user-name');
    const profilePicture = document.getElementById('profile-picture');
    const chatList = document.getElementById('chat-list');
    
    // Elementos do popup de perfil
    const userProfileTrigger = document.getElementById('user-profile-trigger');
    const profilePopupOverlay = document.getElementById('profile-popup-overlay');
    const profilePopup = document.getElementById('profile-popup');
    const profilePopupPicture = document.getElementById('profile-popup-picture');
    const profilePopupName = document.getElementById('profile-popup-name');
    const profilePopupEmail = document.getElementById('profile-popup-email');
    
    // Elementos do chat header
    const chatSubjectIcon = document.getElementById('chat-subject-icon');
    const chatSubjectTitle = document.getElementById('chat-subject-title');
    const chatSubjectDescription = document.getElementById('chat-subject-description');
    
    // Elementos de ações do chat
    const newChatButton = document.getElementById('new-chat-button');
    const newChatFromHeader = document.getElementById('new-chat-from-header');
    const editChatName = document.getElementById('edit-chat-name');
    const deleteChat = document.getElementById('delete-chat');
    
    // Modal de edição
    const editChatModal = document.getElementById('edit-chat-modal');
    const chatNameInput = document.getElementById('chat-name-input');
    const saveChatName = document.getElementById('save-chat-name');
    const cancelEditChat = document.getElementById('cancel-edit-chat');
    const closeEditChatModal = document.getElementById('close-edit-chat-modal');

    // === DADOS DAS MATÉRIAS === //
    const subjects = {
        'matematica': { title: 'Matemática', description: 'Álgebra, geometria, cálculo e muito mais', icon: '🧮', color: '#FF6B6B' },
        'portugues': { title: 'Português', description: 'Gramática, literatura e redação', icon: '📚', color: '#4ECDC4' },
        'historia': { title: 'História', description: 'História do Brasil e mundial', icon: '🏛️', color: '#45B7D1' },
        'geografia': { title: 'Geografia', description: 'Geografia física e humana', icon: '🌍', color: '#96CEB4' },
        'ciencias': { title: 'Ciências', description: 'Biologia, física e química básica', icon: '🔬', color: '#FFEAA7' },
        'ingles': { title: 'Inglês', description: 'Gramática, vocabulário e conversação', icon: '🇺🇸', color: '#DDA0DD' },
        'fisica': { title: 'Física', description: 'Mecânica, termodinâmica e eletromagnetismo', icon: '⚡', color: '#FFB347' },
        'quimica': { title: 'Química', description: 'Química orgânica, inorgânica e físico-química', icon: '🧪', color: '#98FB98' },
        'biologia': { title: 'Biologia', description: 'Genética, ecologia e anatomia', icon: '🧬', color: '#87CEEB' },
        'filosofia': { title: 'Filosofia', description: 'Ética, lógica e história da filosofia', icon: '🤔', color: '#F0E68C' },
        'sociologia': { title: 'Sociologia', description: 'Sociedade, cultura e relações sociais', icon: '👥', color: '#DEB887' },
        'artes': { title: 'Artes', description: 'História da arte, técnicas e expressão artística', icon: '🎨', color: '#FFB6C1' },
        'informatica': { title: 'Informática', description: 'Programação, algoritmos e tecnologia', icon: '💻', color: '#B0C4DE' },
        'educacao-fisica': { title: 'Educação Física', description: 'Esportes, saúde e atividade física', icon: '⚽', color: '#90EE90' }
    };

    // === VARIÁVEIS GLOBAIS === //
    let currentSubject = null;
    let currentChatId = null;
    let isTyping = false;

    // === INICIALIZAÇÃO === //
    init();

    function init() {
        loadUserData();
        loadSubjects();
        loadChats();
        setupEventListeners();
        checkDailyLimit();
    }

    // === DADOS DO USUÁRIO === //
    function getUserData() {
        const data = localStorage.getItem('tutorIA_userData');
        return data ? JSON.parse(data) : null;
    }

    function saveUserData(data) {
        localStorage.setItem('tutorIA_userData', JSON.stringify(data));
    }

    function loadUserData() {
        const userData = getUserData();
        if (userData) {
            userNameDisplay.textContent = userData.name || 'Usuário';
            profilePicture.src = userData.profilePicture || 'https://via.placeholder.com/40';
            
            // Popup de perfil
            profilePopupName.textContent = userData.name || 'Usuário';
            profilePopupEmail.textContent = userData.email || 'usuario@email.com';
            profilePopupPicture.src = userData.profilePicture || 'https://via.placeholder.com/48';
        }
    }

    // === TEMA === //
    function applyTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.backgroundColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    }

    // === MATÉRIAS === //
    function loadSubjects() {
        const subjectsGrid = document.getElementById('subjects-grid');
        subjectsGrid.innerHTML = '';

        Object.entries(subjects).forEach(([key, subject]) => {
            const subjectCard = document.createElement('div');
            subjectCard.className = 'subject-card';
            subjectCard.dataset.subject = key;
            
            subjectCard.innerHTML = `
                <span class="subject-icon" style="color: ${subject.color}">${subject.icon}</span>
                <h3>${subject.title}</h3>
                <p>${subject.description}</p>
            `;
            
            subjectCard.addEventListener('click', () => selectSubject(key));
            subjectsGrid.appendChild(subjectCard);
        });
    }

    function selectSubject(subjectKey) {
        currentSubject = subjectKey;
        const subject = subjects[subjectKey];
        
        // Atualizar header do chat
        chatSubjectIcon.textContent = subject.icon;
        chatSubjectIcon.style.color = subject.color;
        chatSubjectTitle.textContent = subject.title;
        chatSubjectDescription.textContent = subject.description;
        
        // Mostrar área do chat e esconder matérias
        subjectsSection.classList.add('hidden');
        chatArea.classList.remove('hidden');
        
        // Criar novo chat automaticamente
        createNewChat(subject.title);
    }

    // === CHATS === //
    function getChats() {
        const chats = localStorage.getItem('tutorIA_chats');
        return chats ? JSON.parse(chats) : [];
    }

    function saveChats(chats) {
        localStorage.setItem('tutorIA_chats', JSON.stringify(chats));
    }

    function loadChats() {
        const chats = getChats();
        chatList.innerHTML = '';
        
        if (chats.length === 0) {
            chatList.innerHTML = '<div class="text-muted text-center" style="padding: 20px; font-size: 0.9rem;">Nenhum chat ainda.<br>Selecione uma matéria para começar!</div>';
            return;
        }
        
        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.dataset.chatId = chat.id;
            
            chatItem.innerHTML = `
                <span class="chat-icon">${subjects[chat.subject]?.icon || '💬'}</span>
                <span class="chat-name">${chat.name}</span>
            `;
            
            chatItem.addEventListener('click', () => openChat(chat.id));
            chatList.appendChild(chatItem);
        });
    }

    function createNewChat(subjectTitle) {
        const chats = getChats();
        const chatId = 'chat_' + Date.now();
        const chatName = `${subjectTitle} - ${new Date().toLocaleDateString()}`;
        
        const newChat = {
            id: chatId,
            name: chatName,
            subject: currentSubject,
            messages: [],
            createdAt: new Date().toISOString()
        };
        
        chats.unshift(newChat);
        saveChats(chats);
        loadChats();
        openChat(chatId);
    }

    function openChat(chatId) {
        const chats = getChats();
        const chat = chats.find(c => c.id === chatId);
        
        if (!chat) return;
        
        currentChatId = chatId;
        currentSubject = chat.subject;
        
        // Atualizar UI
        const subject = subjects[chat.subject];
        if (subject) {
            chatSubjectIcon.textContent = subject.icon;
            chatSubjectIcon.style.color = subject.color;
            chatSubjectTitle.textContent = subject.title;
            chatSubjectDescription.textContent = subject.description;
        }
        
        // Mostrar área do chat
        subjectsSection.classList.add('hidden');
        chatArea.classList.remove('hidden');
        
        // Carregar mensagens
        loadMessages(chat.messages);
        
        // Atualizar lista de chats
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.toggle('active', item.dataset.chatId === chatId);
        });
    }

    function loadMessages(messages) {
        chatMessages.innerHTML = '';
        
        if (messages.length === 0) {
            const welcomeMessage = document.createElement('div');
            welcomeMessage.className = 'message';
            welcomeMessage.innerHTML = `
                <div class="message-avatar">IA</div>
                <div class="message-content">
                    <div class="message-text">Olá! Sou seu tutor de ${subjects[currentSubject]?.title}. Como posso ajudá-lo hoje?</div>
                    <div class="message-time">${new Date().toLocaleTimeString()}</div>
                </div>
            `;
            chatMessages.appendChild(welcomeMessage);
            return;
        }
        
        messages.forEach(message => {
            addMessageToChat(message.text, message.sender, message.timestamp, false);
        });
        
        scrollToBottom();
    }

    function addMessageToChat(text, sender, timestamp, save = true) {
        const message = document.createElement('div');
        message.className = `message ${sender}`;
        
        const avatar = sender === 'user' ? 'EU' : 'IA';
        const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
        
        message.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${text}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        chatMessages.appendChild(message);
        scrollToBottom();
        
        if (save && currentChatId) {
            saveMessage(text, sender, timestamp || new Date().toISOString());
        }
    }

    function saveMessage(text, sender, timestamp) {
        const chats = getChats();
        const chatIndex = chats.findIndex(c => c.id === currentChatId);
        
        if (chatIndex !== -1) {
            chats[chatIndex].messages.push({
                text,
                sender,
                timestamp
            });
            saveChats(chats);
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // === ENVIO DE MENSAGENS === //
    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text || isTyping) return;
        
        // Verificar limite diário
        if (!checkDailyLimit()) {
            showUpgradeModal();
            return;
        }
        
        // Adicionar mensagem do usuário
        addMessageToChat(text, 'user');
        chatInput.value = '';
        updateCharacterCount();
        
        // Simular resposta da IA
        simulateAIResponse(text);
        
        // Incrementar contador diário
        incrementDailyUsage();
    }

    function simulateAIResponse(userMessage) {
        isTyping = true;
        sendButton.disabled = true;
        
        // Mostrar indicador de digitação
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message typing-indicator';
        typingIndicator.innerHTML = `
            <div class="message-avatar">IA</div>
            <div class="message-content">
                <div class="typing-dots">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();
        
        // Simular delay de resposta
        setTimeout(() => {
            chatMessages.removeChild(typingIndicator);
            
            // Gerar resposta baseada na matéria
            const response = generateAIResponse(userMessage, currentSubject);
            addMessageToChat(response, 'ai');
            
            isTyping = false;
            sendButton.disabled = false;
            chatInput.focus();
        }, 1500 + Math.random() * 1000);
    }

    function generateAIResponse(message, subject) {
        const subjectName = subjects[subject]?.title || 'esta matéria';
        
        const responses = [
            `Excelente pergunta sobre ${subjectName}! Vou explicar de forma clara e didática.`,
            `Ótimo! Essa é uma questão importante em ${subjectName}. Deixe-me ajudá-lo a entender.`,
            `Perfeito! Vamos explorar esse conceito de ${subjectName} juntos.`,
            `Muito bem! Essa é uma dúvida comum em ${subjectName}. Vou esclarecer para você.`,
            `Interessante! Esse tópico de ${subjectName} é fundamental. Vou explicar passo a passo.`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // === LIMITE DIÁRIO === //
    function checkDailyLimit() {
        const userData = getUserData();
        if (userData?.isPro) return true;
        
        const today = new Date().toDateString();
        const usage = JSON.parse(localStorage.getItem('tutorIA_dailyUsage') || '{}');
        
        return (usage[today] || 0) < 5;
    }

    function incrementDailyUsage() {
        const today = new Date().toDateString();
        const usage = JSON.parse(localStorage.getItem('tutorIA_dailyUsage') || '{}');
        
        usage[today] = (usage[today] || 0) + 1;
        localStorage.setItem('tutorIA_dailyUsage', JSON.stringify(usage));
    }

    function getRemainingChats() {
        const userData = getUserData();
        if (userData?.isPro) return 'Ilimitado';
        
        const today = new Date().toDateString();
        const usage = JSON.parse(localStorage.getItem('tutorIA_dailyUsage') || '{}');
        
        return Math.max(0, 5 - (usage[today] || 0));
    }

    // === EVENT LISTENERS === //
    function setupEventListeners() {
        // Envio de mensagem
        sendButton.addEventListener('click', sendMessage);
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        chatInput.addEventListener('input', updateCharacterCount);
        
        // Popup de perfil
        userProfileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profilePopupOverlay.classList.add('active');
        });
        
        profilePopupOverlay.addEventListener('click', (e) => {
            if (e.target === profilePopupOverlay) {
                profilePopupOverlay.classList.remove('active');
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                profilePopupOverlay.classList.remove('active');
                closeAllModals();
            }
        });
        
        // Links do popup de perfil
        document.getElementById('settings-link').addEventListener('click', (e) => {
            e.preventDefault();
            profilePopupOverlay.classList.remove('active');
            showSettingsModal();
        });
        
        document.getElementById('help-link').addEventListener('click', (e) => {
            e.preventDefault();
            profilePopupOverlay.classList.remove('active');
            showHelpModal();
        });
        
        document.getElementById('logout-link').addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
        
        // Botões de chat
        newChatButton.addEventListener('click', () => {
            if (currentSubject) {
                createNewChat(subjects[currentSubject].title);
            } else {
                // Voltar para seleção de matérias
                chatArea.classList.add('hidden');
                subjectsSection.classList.remove('hidden');
            }
        });
        
        newChatFromHeader.addEventListener('click', () => {
            if (currentSubject) {
                createNewChat(subjects[currentSubject].title);
            }
        });
        
        editChatName.addEventListener('click', showEditChatModal);
        deleteChat.addEventListener('click', deleteChatConfirm);
        
        // Modal de edição
        saveChatName.addEventListener('click', saveNewChatName);
        cancelEditChat.addEventListener('click', closeEditChatModal);
        closeEditChatModal.addEventListener('click', closeEditChatModal);
        
        // Upgrade
        document.getElementById('upgrade-button').addEventListener('click', showUpgradeModal);
        
        // Ajuda
        document.getElementById('help-button').addEventListener('click', showHelpModal);
        
        // Modais
        setupModalListeners();
    }

    function updateCharacterCount() {
        const count = chatInput.value.length;
        characterCount.textContent = `${count}/2000`;
        
        if (count > 1800) {
            characterCount.style.color = 'var(--error-color)';
        } else if (count > 1500) {
            characterCount.style.color = 'var(--warning-color)';
        } else {
            characterCount.style.color = 'var(--text-muted)';
        }
    }

    // === EDIÇÃO DE CHAT === //
    function showEditChatModal() {
        if (!currentChatId) return;
        
        const chats = getChats();
        const chat = chats.find(c => c.id === currentChatId);
        
        if (chat) {
            chatNameInput.value = chat.name;
            document.getElementById('edit-chat-modal').classList.add('active');
        }
    }

    function closeEditChatModal() {
        document.getElementById('edit-chat-modal').classList.remove('active');
    }

    function saveNewChatName() {
        const newName = chatNameInput.value.trim();
        if (!newName || !currentChatId) return;
        
        const chats = getChats();
        const chatIndex = chats.findIndex(c => c.id === currentChatId);
        
        if (chatIndex !== -1) {
            chats[chatIndex].name = newName;
            saveChats(chats);
            loadChats();
            closeEditChatModal();
        }
    }

    function deleteChatConfirm() {
        if (!currentChatId) return;
        
        if (confirm('Tem certeza que deseja excluir este chat? Esta ação não pode ser desfeita.')) {
            const chats = getChats();
            const filteredChats = chats.filter(c => c.id !== currentChatId);
            
            saveChats(filteredChats);
            loadChats();
            
            // Voltar para seleção de matérias
            currentChatId = null;
            currentSubject = null;
            chatArea.classList.add('hidden');
            subjectsSection.classList.remove('hidden');
        }
    }

    // === MODAIS === //
    function setupModalListeners() {
        // Upgrade Modal
        const upgradeModal = document.getElementById('upgrade-modal');
        const closeUpgradeModal = document.getElementById('close-upgrade-modal');
        const maybeLater = document.getElementById('maybe-later');
        const upgradeNow = document.getElementById('upgrade-now');
        
        closeUpgradeModal.addEventListener('click', () => upgradeModal.classList.remove('active'));
        maybeLater.addEventListener('click', () => upgradeModal.classList.remove('active'));
        upgradeNow.addEventListener('click', () => {
            alert('Redirecionando para o pagamento...');
            upgradeModal.classList.remove('active');
        });
        
        // Settings Modal
        const settingsModal = document.getElementById('settings-modal');
        const closeSettingsModal = document.getElementById('close-settings-modal');
        const saveSettings = document.getElementById('save-settings');
        const lightTheme = document.getElementById('light-theme');
        const darkTheme = document.getElementById('dark-theme');
        const ageInput = document.getElementById('age-input');
        const difficultySelect = document.getElementById('difficulty-select');
        
        closeSettingsModal.addEventListener('click', () => settingsModal.classList.remove('active'));
        
        lightTheme.addEventListener('click', () => {
            localStorage.setItem('theme', 'light');
            applyTheme();
        });
        
        darkTheme.addEventListener('click', () => {
            localStorage.setItem('theme', 'dark');
            applyTheme();
        });
        
        saveSettings.addEventListener('click', () => {
            const userData = getUserData();
            if (userData) {
                userData.age = parseInt(ageInput.value) || userData.age;
                userData.difficulty = difficultySelect.value || userData.difficulty;
                saveUserData(userData);
            }
            settingsModal.classList.remove('active');
        });
        
        // Carregar configurações atuais
        const userData = getUserData();
        if (userData) {
            ageInput.value = userData.age || '';
            difficultySelect.value = userData.difficulty || 'auto';
        }
    }

    function showUpgradeModal() {
        document.getElementById('upgrade-modal').classList.add('active');
    }

    function showSettingsModal() {
        document.getElementById('settings-modal').classList.add('active');
    }

    function showHelpModal() {
        alert('Central de Ajuda\n\n• Use o chat para fazer perguntas sobre qualquer matéria\n• Você tem 5 chats gratuitos por dia\n• Faça upgrade para chats ilimitados\n• Clique na sua foto de perfil para acessar configurações');
    }

    function closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // === LOGOUT === //
    function logout() {
        if (confirm('Tem certeza que deseja sair?')) {
            localStorage.removeItem('tutorIA_userData');
            window.location.href = 'login.html';
        }
    }

    // === NAVEGAÇÃO === //
    document.getElementById('dashboard-link').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'dashboard.html';
    });
    
    document.getElementById('challenges-link').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'challenges.html';
    });
});

// === FUNÇÕES GLOBAIS === //
function getUserData() {
    const data = localStorage.getItem('tutorIA_userData');
    return data ? JSON.parse(data) : null;
}

