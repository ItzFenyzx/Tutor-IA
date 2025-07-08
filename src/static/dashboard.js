// dashboard.js - Tutor IA 3.0 - Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // === VERIFICAÇÃO DE LOGIN === //
    const isLoggedIn = localStorage.getItem('tutorIA_isLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // === ELEMENTOS DOM === //
    const userNameDisplay = document.getElementById('user-name');
    const profilePicture = document.getElementById('profile-picture');
    const userProfileTrigger = document.getElementById('user-profile-trigger');
    const profilePopup = document.getElementById('profile-popup');
    const profilePopupPicture = document.getElementById('profile-popup-picture');
    const profilePopupName = document.getElementById('profile-popup-name');
    const profilePopupEmail = document.getElementById('profile-popup-email');

    const chatList = document.getElementById('chat-list');
    const newChatButton = document.getElementById('new-chat-button');
    const dashboardChats = document.getElementById('dashboard-chats');
    const viewAllChatsButton = document.getElementById('view-all-chats');

    const totalChats = document.getElementById('total-chats');
    const completedChallenges = document.getElementById('completed-challenges');
    const studyTime = document.getElementById('study-time');
    const learningStreak = document.getElementById('learning-streak');

    const profileSummaryPicture = document.getElementById('profile-summary-picture');
    const profileSummaryName = document.getElementById('profile-summary-name');
    const profileSummaryEducation = document.getElementById('profile-summary-education');
    const profileSummaryAge = document.getElementById('profile-summary-age');
    const profileSummarySubjects = document.getElementById('profile-summary-subjects');
    const editProfileButton = document.getElementById('edit-profile-button');

    const friendsList = document.getElementById('friends-list');
    const subjectProgress = document.getElementById('subject-progress');

    const settingsButton = document.getElementById('settings-button');
    const upgradeButton = document.getElementById('upgrade-button');
    const logoutButton = document.getElementById('logout-button');
    const helpButton = document.getElementById('help-button');

    const popupSettings = document.getElementById('popup-settings');
    const popupUpgrade = document.getElementById('popup-upgrade');
    const popupLogout = document.getElementById('popup-logout');

    const settingsModal = document.getElementById('settings-modal');
    const upgradeModal = document.getElementById('upgrade-modal');
    const closeSettingsModal = document.getElementById('close-settings-modal');
    const closeUpgradeModal = document.getElementById('close-upgrade-modal');
    const saveSettingsButton = document.getElementById('save-settings');
    const settingDifficultySelect = document.getElementById('setting-difficulty');
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    // === CORES DAS MATÉRIAS === //
    const subjectColors = {
        'matematica': '#FF6B6B',
        'portugues': '#4ECDC4',
        'historia': '#45B7D1',
        'geografia': '#96CEB4',
        'ciencias': '#FECA57',
        'ingles': '#FF9FF3',
        'fisica': '#54A0FF',
        'quimica': '#5F27CD',
        'biologia': '#00D2D3',
        'filosofia': '#FF7675',
        'sociologia': '#A29BFE',
        'artes': '#FD79A8',
        'informatica': '#6C5CE7',
        'educacao_fisica': '#00B894'
    };

    const subjectNames = {
        'matematica': 'Matemática',
        'portugues': 'Português',
        'historia': 'História',
        'geografia': 'Geografia',
        'ciencias': 'Ciências',
        'ingles': 'Inglês',
        'fisica': 'Física',
        'quimica': 'Química',
        'biologia': 'Biologia',
        'filosofia': 'Filosofia',
        'sociologia': 'Sociologia',
        'artes': 'Artes',
        'informatica': 'Informática',
        'educacao_fisica': 'Ed. Física'
    };

    // === FUNÇÕES DE PERSISTÊNCIA === //
    const getUserData = () => {
        const data = localStorage.getItem('tutorIA_userData');
        return data ? JSON.parse(data) : null;
    };

    const saveUserData = (data) => {
        localStorage.setItem('tutorIA_userData', JSON.stringify(data));
        applyUserDataGlobally(data);
    };

    const saveThemePreference = (isDark) => {
        localStorage.setItem('tutorIA_darkMode', isDark.toString());
        applyThemeGlobally(isDark);
    };

    const getThemePreference = () => {
        return localStorage.getItem('tutorIA_darkMode') === 'true';
    };

    const getChats = () => {
        const chats = localStorage.getItem('tutorIA_chats');
        return chats ? JSON.parse(chats) : [];
    };

    // === APLICAÇÃO GLOBAL === //
    const applyUserDataGlobally = (userData) => {
        if (userNameDisplay) {
            userNameDisplay.textContent = userData.name || 'Usuário';
        }
        if (profilePicture) {
            profilePicture.src = userData.profilePicture || 'https://via.placeholder.com/40';
        }
        if (profilePopupPicture) {
            profilePopupPicture.src = userData.profilePicture || 'https://via.placeholder.com/60';
        }
        if (profilePopupName) {
            profilePopupName.textContent = userData.name || 'Usuário';
        }
        if (profilePopupEmail) {
            profilePopupEmail.textContent = userData.email || 'email@exemplo.com';
        }
        if (profileSummaryPicture) {
            profileSummaryPicture.src = userData.profilePicture || 'https://via.placeholder.com/80';
        }
        if (profileSummaryName) {
            profileSummaryName.textContent = userData.name || 'Nome do Usuário';
        }
    };

    const applyThemeGlobally = (isDark) => {
        document.body.classList.toggle('dark-theme', isDark);
        document.body.classList.toggle('light-theme', !isDark);
        
        if (darkModeToggle) {
            darkModeToggle.checked = isDark;
        }
    };

    // === RENDERIZAÇÃO DE CHATS === //
    const renderChatList = () => {
        if (!chatList) return;
        
        const allChats = getChats();
        chatList.innerHTML = '';
        
        if (allChats.length === 0) {
            chatList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px; font-size: 0.9em;">Nenhum chat ainda.<br>Clique em + para começar!</p>';
            return;
        }
        
        // Ordenar chats por atividade mais recente
        const sortedChats = [...allChats].sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

        sortedChats.slice(0, 5).forEach(chat => { // Mostrar apenas os 5 mais recentes
            const chatItem = document.createElement('div');
            chatItem.classList.add('chat-item');
            chatItem.dataset.chatId = chat.id;
            
            const lastMessage = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
            const preview = lastMessage ? lastMessage.text.substring(0, 25) + '...' : 'Novo Chat';
            const chatName = chat.customName || chat.subject.title;
            
            const color = subjectColors[chat.subject.id] || '#4CAF50';
            
            chatItem.innerHTML = `
                <span class="material-icons chat-icon" style="background-color: ${color};">${chat.subject.icon}</span>
                <div class="chat-info">
                    <div class="chat-subject">${chatName}</div>
                    <div class="chat-name">${preview}</div>
                </div>
                <div class="chat-time">${new Date(chat.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            `;
            chatList.appendChild(chatItem);

            chatItem.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        });
    };

    const renderDashboardChats = () => {
        if (!dashboardChats) return;
        
        const allChats = getChats();
        dashboardChats.innerHTML = '';
        
        if (allChats.length === 0) {
            dashboardChats.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">chat_bubble_outline</span>
                    <h3>Nenhum chat criado ainda</h3>
                    <p>Comece uma conversa com o Tutor IA para ver seus chats aqui!</p>
                    <button class="button-primary" onclick="window.location.href='index.html'">Criar Primeiro Chat</button>
                </div>
            `;
            return;
        }
        
        // Ordenar chats por atividade mais recente
        const sortedChats = [...allChats].sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

        sortedChats.slice(0, 6).forEach(chat => { // Mostrar apenas os 6 mais recentes
            const chatCard = document.createElement('div');
            chatCard.classList.add('dashboard-chat-card');
            
            const lastMessage = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
            const preview = lastMessage ? lastMessage.text.substring(0, 80) + '...' : 'Novo Chat';
            const chatName = chat.customName || chat.subject.title;
            const messageCount = chat.messages.length;
            
            const color = subjectColors[chat.subject.id] || '#4CAF50';
            
            chatCard.innerHTML = `
                <div class="chat-card-header">
                    <span class="material-icons chat-card-icon" style="color: ${color};">${chat.subject.icon}</span>
                    <div class="chat-card-info">
                        <h4>${chatName}</h4>
                        <p>${subjectNames[chat.subject.id] || chat.subject.title}</p>
                    </div>
                    <span class="chat-card-time">${new Date(chat.lastActivity).toLocaleDateString()}</span>
                </div>
                <div class="chat-card-preview">${preview}</div>
                <div class="chat-card-stats">
                    <span><span class="material-icons">message</span>${messageCount} mensagens</span>
                    <button class="chat-card-button" onclick="window.location.href='index.html'">Continuar</button>
                </div>
            `;
            dashboardChats.appendChild(chatCard);
        });
    };

    // === ESTATÍSTICAS === //
    const updateStatistics = () => {
        const allChats = getChats();
        
        // Total de chats
        if (totalChats) {
            totalChats.textContent = allChats.length;
        }
        
        // Desafios concluídos (simulado)
        if (completedChallenges) {
            completedChallenges.textContent = Math.floor(allChats.length * 0.3);
        }
        
        // Tempo de estudo (simulado baseado no número de mensagens)
        if (studyTime) {
            const totalMessages = allChats.reduce((total, chat) => total + chat.messages.length, 0);
            const estimatedHours = Math.floor(totalMessages * 0.1);
            studyTime.textContent = `${estimatedHours}h`;
        }
        
        // Sequência de aprendizado (simulado)
        if (learningStreak) {
            learningStreak.textContent = Math.min(allChats.length, 7);
        }
    };

    // === PERFIL === //
    const updateProfileSummary = () => {
        const userData = getUserData();
        if (!userData) return;

        if (profileSummaryEducation) {
            const educationLabels = {
                'fundamental_i': 'Ensino Fundamental I',
                'fundamental_ii': 'Ensino Fundamental II',
                'medio': 'Ensino Médio',
                'superior': 'Ensino Superior',
                'outros': 'Outros'
            };
            profileSummaryEducation.textContent = educationLabels[userData.educationLevel] || 'Não informado';
        }

        if (profileSummaryAge) {
            profileSummaryAge.textContent = userData.age ? `${userData.age} anos` : 'Idade não informada';
        }

        if (profileSummarySubjects && userData.interestedSubjects) {
            profileSummarySubjects.innerHTML = '';
            userData.interestedSubjects.slice(0, 4).forEach(subjectId => {
                const subjectTag = document.createElement('span');
                subjectTag.classList.add('subject-tag');
                subjectTag.style.backgroundColor = subjectColors[subjectId] || '#4CAF50';
                subjectTag.textContent = subjectNames[subjectId] || subjectId;
                profileSummarySubjects.appendChild(subjectTag);
            });
            
            if (userData.interestedSubjects.length > 4) {
                const moreTag = document.createElement('span');
                moreTag.classList.add('subject-tag', 'more-tag');
                moreTag.textContent = `+${userData.interestedSubjects.length - 4}`;
                profileSummarySubjects.appendChild(moreTag);
            }
        }
    };

    // === AMIGOS === //
    const renderFriendsList = () => {
        if (!friendsList) return;
        
        // Simular que não há amigos
        friendsList.innerHTML = `
            <div class="empty-friends">
                <span class="material-icons">people_outline</span>
                <h4>Nenhum amigo ainda</h4>
                <p>Conecte-se com outros estudantes para compartilhar o aprendizado!</p>
                <button class="button-secondary" disabled>Em breve</button>
            </div>
        `;
    };

    // === PROGRESSO POR MATÉRIA === //
    const renderSubjectProgress = () => {
        if (!subjectProgress) return;
        
        const allChats = getChats();
        const subjectStats = {};
        
        // Contar chats por matéria
        allChats.forEach(chat => {
            const subjectId = chat.subject.id;
            if (!subjectStats[subjectId]) {
                subjectStats[subjectId] = {
                    name: subjectNames[subjectId] || chat.subject.title,
                    color: subjectColors[subjectId] || '#4CAF50',
                    icon: chat.subject.icon,
                    chatCount: 0,
                    messageCount: 0
                };
            }
            subjectStats[subjectId].chatCount++;
            subjectStats[subjectId].messageCount += chat.messages.length;
        });

        subjectProgress.innerHTML = '';
        
        if (Object.keys(subjectStats).length === 0) {
            subjectProgress.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">school</span>
                    <h3>Nenhuma atividade ainda</h3>
                    <p>Comece a estudar para ver seu progresso por matéria!</p>
                </div>
            `;
            return;
        }

        Object.values(subjectStats).forEach(subject => {
            const progressCard = document.createElement('div');
            progressCard.classList.add('subject-progress-card');
            
            const progress = Math.min((subject.messageCount / 10) * 100, 100); // Simular progresso
            
            progressCard.innerHTML = `
                <div class="subject-progress-header">
                    <span class="material-icons" style="color: ${subject.color};">${subject.icon}</span>
                    <div class="subject-progress-info">
                        <h4>${subject.name}</h4>
                        <p>${subject.chatCount} chat(s) • ${subject.messageCount} mensagens</p>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%; background-color: ${subject.color};"></div>
                </div>
                <div class="progress-percentage">${Math.round(progress)}% completo</div>
            `;
            subjectProgress.appendChild(progressCard);
        });
    };

    // === POPUP DO PERFIL === //
    const showProfilePopup = () => {
        if (profilePopup) {
            profilePopup.style.display = 'flex';
        }
    };

    const hideProfilePopup = () => {
        if (profilePopup) {
            profilePopup.style.display = 'none';
        }
    };

    // === MODAIS === //
    const showModal = (modal) => {
        if (modal) {
            modal.style.display = 'flex';
        }
    };

    const hideModal = (modal) => {
        if (modal) {
            modal.style.display = 'none';
        }
    };

    const showSettingsModal = () => {
        const userData = getUserData();
        if (userData && settingDifficultySelect) {
            settingDifficultySelect.value = userData.difficulty || 'medio';
        }
        if (darkModeToggle) {
            darkModeToggle.checked = getThemePreference();
        }
        showModal(settingsModal);
    };

    const saveSettings = () => {
        const userData = getUserData();
        if (!userData) return;
        
        const difficulty = settingDifficultySelect?.value || 'medio';
        const isDarkMode = darkModeToggle?.checked || false;
        
        userData.difficulty = difficulty;
        saveUserData(userData);
        saveThemePreference(isDarkMode);
        
        hideModal(settingsModal);
    };

    const logout = () => {
        if (confirm('Tem certeza que deseja sair?')) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
    };

    // === INICIALIZAÇÃO === //
    const initializeDashboard = () => {
        const userData = getUserData();
        const isDarkMode = getThemePreference();
        
        // Aplicar tema
        applyThemeGlobally(isDarkMode);
        
        // Aplicar dados do usuário
        if (userData) {
            applyUserDataGlobally(userData);
            updateProfileSummary();
        }
        
        // Carregar dados
        renderChatList();
        renderDashboardChats();
        updateStatistics();
        renderFriendsList();
        renderSubjectProgress();
    };

    // === EVENT LISTENERS === //

    // Popup do Perfil
    if (userProfileTrigger) {
        userProfileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            showProfilePopup();
        });
    }

    // Fechar popup ao clicar fora
    if (profilePopup) {
        profilePopup.addEventListener('click', (e) => {
            if (e.target === profilePopup) {
                hideProfilePopup();
            }
        });
    }

    // Novo Chat
    if (newChatButton) {
        newChatButton.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // Ver todos os chats
    if (viewAllChatsButton) {
        viewAllChatsButton.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // Editar perfil
    if (editProfileButton) {
        editProfileButton.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }

    // Botões da Sidebar
    if (settingsButton) {
        settingsButton.addEventListener('click', showSettingsModal);
    }

    if (upgradeButton) {
        upgradeButton.addEventListener('click', () => showModal(upgradeModal));
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    if (helpButton) {
        helpButton.addEventListener('click', () => {
            alert('Em breve: Central de Ajuda do Tutor IA!\n\nPor enquanto, entre em contato conosco em: suporte@tutoria.com');
        });
    }

    // Botões do Popup
    if (popupSettings) {
        popupSettings.addEventListener('click', (e) => {
            e.preventDefault();
            hideProfilePopup();
            showSettingsModal();
        });
    }

    if (popupUpgrade) {
        popupUpgrade.addEventListener('click', (e) => {
            e.preventDefault();
            hideProfilePopup();
            showModal(upgradeModal);
        });
    }

    if (popupLogout) {
        popupLogout.addEventListener('click', (e) => {
            e.preventDefault();
            hideProfilePopup();
            logout();
        });
    }

    // Modais
    if (closeSettingsModal) {
        closeSettingsModal.addEventListener('click', () => hideModal(settingsModal));
    }

    if (closeUpgradeModal) {
        closeUpgradeModal.addEventListener('click', () => hideModal(upgradeModal));
    }

    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', saveSettings);
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (event) => {
            saveThemePreference(event.target.checked);
        });
    }

    // Fechar modais ao clicar fora
    [settingsModal, upgradeModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    hideModal(modal);
                }
            });
        }
    });

    // === INICIALIZAÇÃO FINAL === //
    initializeDashboard();
});

