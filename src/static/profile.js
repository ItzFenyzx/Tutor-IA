// profile.js - Tutor IA 3.0 - Página de Perfil

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

    const profilePictureLarge = document.getElementById('profile-picture-large');
    const profilePictureInput = document.getElementById('profile-picture-input');
    const profileDisplayName = document.getElementById('profile-display-name');
    const profileDisplayEmail = document.getElementById('profile-display-email');

    const profileForm = document.getElementById('profile-form');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileAge = document.getElementById('profile-age');
    const profileEducation = document.getElementById('profile-education');
    const profileDifficulty = document.getElementById('profile-difficulty');
    const profilePhone = document.getElementById('profile-phone');
    const profileBio = document.getElementById('profile-bio');
    const cancelProfileEdit = document.getElementById('cancel-profile-edit');

    const chatList = document.getElementById('chat-list');
    const newChatButton = document.getElementById('new-chat-button');

    const totalChats = document.getElementById('total-chats');
    const completedChallenges = document.getElementById('completed-challenges');
    const studyTime = document.getElementById('study-time');
    const learningStreak = document.getElementById('learning-streak');

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
    const saveUserData = (data) => {
        localStorage.setItem('tutorIA_userData', JSON.stringify(data));
        applyUserDataGlobally(data);
    };

    const getUserData = () => {
        const data = localStorage.getItem('tutorIA_userData');
        return data ? JSON.parse(data) : null;
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
        if (profilePictureLarge) {
            profilePictureLarge.src = userData.profilePicture || 'https://via.placeholder.com/150';
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
        if (profileDisplayName) {
            profileDisplayName.textContent = userData.name || 'Nome do Usuário';
        }
        if (profileDisplayEmail) {
            profileDisplayEmail.textContent = userData.email || 'email@exemplo.com';
        }
    };

    const applyThemeGlobally = (isDark) => {
        document.body.classList.toggle('dark-theme', isDark);
        document.body.classList.toggle('light-theme', !isDark);
        
        if (darkModeToggle) {
            darkModeToggle.checked = isDark;
        }
    };

    // === CARREGAMENTO DE DADOS === //
    const loadProfileData = () => {
        const userData = getUserData();
        if (!userData) return;

        // Preencher formulário
        if (profileName) profileName.value = userData.name || '';
        if (profileEmail) profileEmail.value = userData.email || '';
        if (profileAge) profileAge.value = userData.age || '';
        if (profileEducation) profileEducation.value = userData.educationLevel || '';
        if (profileDifficulty) profileDifficulty.value = userData.difficulty || 'medio';
        if (profilePhone) profilePhone.value = userData.phone || '';
        if (profileBio) profileBio.value = userData.bio || '';

        // Marcar matérias de interesse
        if (userData.interestedSubjects) {
            userData.interestedSubjects.forEach(subject => {
                const checkbox = document.querySelector(`input[value="${subject}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    };

    // === UPLOAD DE FOTO === //
    const handleProfilePictureUpload = (file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageDataUrl = e.target.result;
            
            // Atualizar todas as imagens de perfil
            if (profilePicture) profilePicture.src = imageDataUrl;
            if (profilePictureLarge) profilePictureLarge.src = imageDataUrl;
            if (profilePopupPicture) profilePopupPicture.src = imageDataUrl;
            
            // Salvar no userData
            const userData = getUserData();
            if (userData) {
                userData.profilePicture = imageDataUrl;
                saveUserData(userData);
            }
        };
        reader.readAsDataURL(file);
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

    // === ESTATÍSTICAS === //
    const updateStatistics = () => {
        const allChats = getChats();
        const userData = getUserData();
        
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
    const initializeProfile = () => {
        const userData = getUserData();
        const isDarkMode = getThemePreference();
        
        // Aplicar tema
        applyThemeGlobally(isDarkMode);
        
        // Aplicar dados do usuário
        if (userData) {
            applyUserDataGlobally(userData);
            loadProfileData();
        }
        
        // Carregar chats e estatísticas
        renderChatList();
        updateStatistics();
    };

    // === EVENT LISTENERS === //

    // Upload de foto de perfil
    if (profilePictureLarge) {
        profilePictureLarge.addEventListener('click', () => {
            if (profilePictureInput) {
                profilePictureInput.click();
            }
        });
    }

    if (profilePictureInput) {
        profilePictureInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleProfilePictureUpload(file);
            }
        });
    }

    // Formulário de perfil
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const userData = getUserData();
            if (!userData) return;

            // Coletar dados do formulário
            userData.name = profileName?.value || '';
            userData.email = profileEmail?.value || '';
            userData.age = parseInt(profileAge?.value) || 0;
            userData.educationLevel = profileEducation?.value || '';
            userData.difficulty = profileDifficulty?.value || 'medio';
            userData.phone = profilePhone?.value || '';
            userData.bio = profileBio?.value || '';

            // Coletar matérias de interesse
            const interestedSubjects = [];
            document.querySelectorAll('.subjects-checkboxes input[type="checkbox"]:checked').forEach(checkbox => {
                interestedSubjects.push(checkbox.value);
            });
            userData.interestedSubjects = interestedSubjects;

            // Salvar dados
            saveUserData(userData);
            
            alert('Perfil atualizado com sucesso!');
        });
    }

    if (cancelProfileEdit) {
        cancelProfileEdit.addEventListener('click', () => {
            loadProfileData(); // Recarregar dados originais
        });
    }

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
    initializeProfile();
});

