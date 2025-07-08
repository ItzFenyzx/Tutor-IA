// challenges.js - Tutor IA 3.0 - Página de Desafios

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

    const subjectFilter = document.getElementById('subject-filter');
    const difficultyFilter = document.getElementById('difficulty-filter');
    const statusFilter = document.getElementById('status-filter');
    const challengeGrid = document.getElementById('challenge-grid');

    const challengeDetailsModal = document.getElementById('challenge-details-modal');
    const closeChallengeDetails = document.getElementById('close-challenge-details');

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

    // === FUNÇÕES DOS DESAFIOS === //
    window.viewChallengeDetails = (challengeId) => {
        showModal(challengeDetailsModal);
    };

    window.startChallenge = (challengeId) => {
        // Fechar modal se estiver aberto
        if (challengeDetailsModal) {
            hideModal(challengeDetailsModal);
        }
        
        // Simular início do desafio
        alert('🎯 Desafio Iniciado!\n\nEm breve você será redirecionado para a interface do desafio.\n\nPor enquanto, esta é uma demonstração do layout e funcionalidade.');
        
        // Em uma implementação real, aqui seria o redirecionamento para a página do desafio
        // window.location.href = `challenge-player.html?id=${challengeId}`;
    };

    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            hideModal(modal);
        }
    };

    // === FILTROS === //
    const applyFilters = () => {
        const subjectValue = subjectFilter?.value || '';
        const difficultyValue = difficultyFilter?.value || '';
        const statusValue = statusFilter?.value || 'available';

        const challengeCards = document.querySelectorAll('.challenge-card');
        const comingSoonSection = document.querySelector('.coming-soon-section');

        challengeCards.forEach(card => {
            const cardSubject = card.dataset.subject || '';
            const cardDifficulty = card.dataset.difficulty || '';
            const cardStatus = card.dataset.status || '';

            let shouldShow = true;

            if (subjectValue && cardSubject !== subjectValue) {
                shouldShow = false;
            }

            if (difficultyValue && cardDifficulty !== difficultyValue) {
                shouldShow = false;
            }

            if (statusValue !== 'all' && cardStatus !== statusValue) {
                shouldShow = false;
            }

            card.style.display = shouldShow ? 'block' : 'none';
        });

        // Mostrar/ocultar seção "Em Breve" baseado nos filtros
        if (comingSoonSection) {
            const hasVisibleChallenges = Array.from(challengeCards).some(card => card.style.display !== 'none');
            comingSoonSection.style.display = hasVisibleChallenges ? 'block' : 'none';
        }
    };

    // === INICIALIZAÇÃO === //
    const initializeChallenges = () => {
        const userData = getUserData();
        const isDarkMode = getThemePreference();
        
        // Aplicar tema
        applyThemeGlobally(isDarkMode);
        
        // Aplicar dados do usuário
        if (userData) {
            applyUserDataGlobally(userData);
        }
        
        // Carregar chats
        renderChatList();
        
        // Aplicar filtros iniciais
        applyFilters();
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

    // Filtros
    if (subjectFilter) {
        subjectFilter.addEventListener('change', applyFilters);
    }

    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', applyFilters);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }

    // Modal de detalhes do desafio
    if (closeChallengeDetails) {
        closeChallengeDetails.addEventListener('click', () => hideModal(challengeDetailsModal));
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
    [settingsModal, upgradeModal, challengeDetailsModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    hideModal(modal);
                }
            });
        }
    });

    // === INICIALIZAÇÃO FINAL === //
    initializeChallenges();
});

