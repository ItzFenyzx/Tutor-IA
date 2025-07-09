// script.js - Tutor IA 3.0 - Versão Simplificada e Funcional

document.addEventListener('DOMContentLoaded', () => {
    console.log('Script carregado');

    // === VERIFICAÇÃO DE LOGIN === //

    // === ELEMENTOS DOM === //
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const characterCount = document.getElementById('character-count');
    const userNameDisplay = document.getElementById('user-name');
    const profilePicture = document.getElementById('profile-picture');
    
    // Popup de perfil
    const profilePopupOverlay = document.getElementById('profile-popup-overlay');
    const profilePopup = document.getElementById('profile-popup');
    const profilePopupPicture = document.getElementById('profile-popup-picture');
    const profilePopupName = document.getElementById('profile-popup-name');
    const profilePopupEmail = document.getElementById('profile-popup-email');

    // === DADOS DAS MATÉRIAS === //
    const subjects = {
        'matematica': { title: 'Matemática', description: 'Álgebra, geometria, cálculo e muito mais', icon: '🧮', color: '#FF6B6B' },
        'portugues': { title: 'Português', description: 'Gramática, literatura e redação', icon: '📚', color: '#4ECDC4' },
        'historia': { title: 'História', description: 'História do Brasil e mundial', icon: '🏛️', color: '#45B7D1' },
        'geografia': { title: 'Geografia', description: 'Geografia física e humana', icon: '🌍', color: '#96CEB4' },
        'ciencias': { title: 'Ciências', description: 'Ciências naturais e experimentos', icon: '🔬', color: '#FECA57' },
        'ingles': { title: 'Inglês', description: 'Gramática, conversação e vocabulário', icon: '🇺🇸', color: '#FF9FF3' },
        'fisica': { title: 'Física', description: 'Mecânica, eletricidade e óptica', icon: '⚡', color: '#54A0FF' },
        'quimica': { title: 'Química', description: 'Química orgânica e inorgânica', icon: '🧪', color: '#5F27CD' },
        'biologia': { title: 'Biologia', description: 'Genética, ecologia e anatomia', icon: '🌱', color: '#00D2D3' },
        'filosofia': { title: 'Filosofia', description: 'Ética, lógica e história da filosofia', icon: '🤔', color: '#FF7675' },
        'sociologia': { title: 'Sociologia', description: 'Sociedade, cultura e movimentos sociais', icon: '👥', color: '#A29BFE' },
        'artes': { title: 'Artes', description: 'História da arte, técnicas e criatividade', icon: '🎨', color: '#FD79A8' },
        'informatica': { title: 'Informática', description: 'Programação, algoritmos e tecnologia', icon: '💻', color: '#6C5CE7' },
        'educacao_fisica': { title: 'Ed. Física', description: 'Esportes, saúde e bem-estar', icon: '🏃', color: '#00B894' }
    };

    // === ESTADO GLOBAL === //
    let currentChat = null;
    let isTyping = false;

    // === FUNÇÕES DE PERSISTÊNCIA === //
    const getUserData = () => {
        const data = localStorage.getItem('tutorIA_userData');
        return data ? JSON.parse(data) : { name: 'Usuário', email: 'usuario@exemplo.com' };
    };

    const getChats = () => {
        const chats = localStorage.getItem('tutorIA_chats');
        return chats ? JSON.parse(chats) : [];
    };

    const saveChats = (chats) => {
        localStorage.setItem('tutorIA_chats', JSON.stringify(chats));
        renderChatList();
    };

    // === APLICAÇÃO GLOBAL === //
    const applyUserData = () => {
        const userData = getUserData();
        if (userNameDisplay) {
            userNameDisplay.textContent = userData.name || 'Usuário';
        }
        if (profilePicture) {
            profilePicture.src = userData.profilePicture || 'https://via.placeholder.com/40';
        }
        
        // Atualizar popup de perfil
        if (profilePopupPicture) {
            profilePopupPicture.src = userData.profilePicture || 'https://via.placeholder.com/50';
        }
        if (profilePopupName) {
            profilePopupName.textContent = userData.name || 'Usuário';
        }
        if (profilePopupEmail) {
            profilePopupEmail.textContent = userData.email || 'usuario@exemplo.com';
        }
    };

    // === POPUP DE PERFIL === //
    const showProfilePopup = () => {
        if (profilePopupOverlay) {
            profilePopupOverlay.style.display = 'block';
        }
    };

    const hideProfilePopup = () => {
        if (profilePopupOverlay) {
            profilePopupOverlay.style.display = 'none';
        }
    };

    // === GERENCIAMENTO DE CHATS === //
    const createNewChat = (subject) => {
        const chatId = 'chat_' + Date.now();
        const newChat = {
            id: chatId,
            subject: subject,
            messages: [],
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };

        const allChats = getChats();
        allChats.push(newChat);
        saveChats(allChats);

        return newChat;
    };

    const updateChat = (chatId, updates) => {
        const allChats = getChats();
        const chatIndex = allChats.findIndex(c => c.id === chatId);
        
        if (chatIndex !== -1) {
            allChats[chatIndex] = { ...allChats[chatIndex], ...updates };
            allChats[chatIndex].lastActivity = new Date().toISOString();
            saveChats(allChats);
            
            if (currentChat && currentChat.id === chatId) {
                currentChat = allChats[chatIndex];
            }
        }
    };

    // === INTERFACE === //
    const showWelcomeScreen = () => {
        if (welcomeScreen) welcomeScreen.style.display = 'block';
        if (chatContainer) chatContainer.style.display = 'none';
    };

    const showChatInterface = (chat) => {
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (chatContainer) chatContainer.style.display = 'flex';
        
        // Atualizar header do chat
        const chatSubjectIcon = document.getElementById('chat-subject-icon');
        const chatSubjectTitle = document.getElementById('chat-subject-title');
        const chatSubjectDescription = document.getElementById('chat-subject-description');
        
        if (chatSubjectIcon) {
            chatSubjectIcon.textContent = chat.subject.icon;
            chatSubjectIcon.style.color = chat.subject.color;
        }
        if (chatSubjectTitle) {
            chatSubjectTitle.textContent = chat.subject.title;
        }
        if (chatSubjectDescription) {
            chatSubjectDescription.textContent = chat.subject.description;
        }
    };

    const renderMessages = (messages) => {
        if (!chatMessages) return;
        
        chatMessages.innerHTML = '';
        
        if (messages.length === 0) {
            const welcomeMessage = document.createElement('div');
            welcomeMessage.classList.add('message', 'ai-message');
            welcomeMessage.innerHTML = `
                <div class="message-content">
                    <p>Olá! Sou seu tutor de ${currentChat.subject.title}. Como posso ajudá-lo hoje?</p>
                    <p>Você pode me fazer perguntas sobre qualquer tópico da matéria!</p>
                </div>
                <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            `;
            chatMessages.appendChild(welcomeMessage);
        } else {
            messages.forEach(message => {
                const messageElement = createMessageElement(message);
                chatMessages.appendChild(messageElement);
            });
        }
        
        scrollToBottom();
    };

    const createMessageElement = (message) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', message.sender === 'user' ? 'user-message' : 'ai-message');
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${message.text}</p>
            </div>
            <div class="message-time">${new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        `;
        
        return messageDiv;
    };

    const addMessage = (text, sender = 'user') => {
        if (!currentChat) return;
        
        const message = {
            id: 'msg_' + Date.now(),
            text: text,
            sender: sender,
            timestamp: new Date().toISOString()
        };
        
        currentChat.messages.push(message);
        updateChat(currentChat.id, { messages: currentChat.messages });
        
        const messageElement = createMessageElement(message);
        chatMessages.appendChild(messageElement);
        scrollToBottom();
        
        return message;
    };

    const scrollToBottom = () => {
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    // === SIMULAÇÃO DE IA === //
    const simulateAIResponse = (userMessage) => {
        if (isTyping) return;
        
        isTyping = true;
        
        // Mostrar indicador de digitação
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'ai-message', 'typing-indicator');
        typingIndicator.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();
        
        // Simular tempo de resposta
        setTimeout(() => {
            chatMessages.removeChild(typingIndicator);
            
            // Gerar resposta simulada
            const responses = [
                `Excelente pergunta sobre ${currentChat.subject.title}! Vou explicar isso de forma clara e didática.`,
                `Entendo sua dúvida. Vamos resolver isso passo a passo.`,
                `Ótimo tópico para estudarmos! Deixe-me te ajudar com isso.`,
                `Essa é uma questão importante em ${currentChat.subject.title}. Vou te dar uma explicação completa.`,
                `Perfeito! Vamos explorar esse conceito juntos.`
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            addMessage(randomResponse, 'ai');
            
            isTyping = false;
        }, 1500 + Math.random() * 2000);
    };

    // === RENDERIZAÇÃO DE CHATS === //
    const renderChatList = () => {
        const chatList = document.getElementById('chat-list');
        if (!chatList) return;
        
        const allChats = getChats();
        chatList.innerHTML = '';
        
        if (allChats.length === 0) {
            chatList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px; font-size: 0.9em;">Nenhum chat ainda.<br>Clique em + para começar!</p>';
            return;
        }
        
        // Ordenar chats por atividade mais recente
        const sortedChats = [...allChats].sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

        sortedChats.slice(0, 5).forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.classList.add('chat-item');
            chatItem.dataset.chatId = chat.id;
            
            const lastMessage = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
            const preview = lastMessage ? lastMessage.text.substring(0, 25) + '...' : 'Novo Chat';
            
            chatItem.innerHTML = `
                <span class="chat-icon" style="background-color: ${chat.subject.color};">${chat.subject.icon}</span>
                <div class="chat-info">
                    <div class="chat-subject">${chat.subject.title}</div>
                    <div class="chat-name">${preview}</div>
                </div>
                <div class="chat-time">${new Date(chat.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            `;
            chatList.appendChild(chatItem);

            chatItem.addEventListener('click', () => {
                loadChat(chat.id);
            });
        });
    };

    const loadChat = (chatId) => {
        const allChats = getChats();
        const chat = allChats.find(c => c.id === chatId);
        
        if (!chat) {
            showWelcomeScreen();
            return null;
        }

        currentChat = chat;
        showChatInterface(chat);
        renderMessages(chat.messages);
        
        return chat;
    };

    // === ENVIO DE MENSAGENS === //
    const sendMessage = () => {
        if (!chatInput || !currentChat || isTyping) return;
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        addMessage(message, 'user');
        chatInput.value = '';
        
        if (characterCount) {
            characterCount.textContent = '0/2000';
        }
        if (sendButton) {
            sendButton.disabled = true;
        }
        
        // Simular resposta da IA
        simulateAIResponse(message);
    };

    // === INICIALIZAÇÃO === //
    const initializeApp = () => {
        console.log('Inicializando app');
        
        // Aplicar dados do usuário
        applyUserData();
        
        // Carregar chats
        renderChatList();
        
        // Mostrar tela de boas-vindas
        showWelcomeScreen();
    };

    // === EVENT LISTENERS === //

    // Seleção de matérias
    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => {
            const subjectId = card.dataset.subject;
            const subject = subjects[subjectId];
            if (subject) {
                const newChat = createNewChat(subject);
                currentChat = newChat;
                showChatInterface(newChat);
                renderMessages(newChat.messages);
            }
        });
    });

    // Input de chat
    if (chatInput) {
        chatInput.addEventListener('input', () => {
            const length = chatInput.value.length;
            if (characterCount) {
                characterCount.textContent = `${length}/2000`;
            }
            
            if (sendButton) {
                sendButton.disabled = length === 0 || isTyping;
            }
        });

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Botão de enviar
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    // Botão de novo chat
    const newChatButton = document.getElementById('new-chat-button');
    if (newChatButton) {
        newChatButton.addEventListener('click', () => {
            currentChat = null;
            showWelcomeScreen();
        });
    }

    // Navegação
    const dashboardLink = document.getElementById('dashboard-link');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'dashboard.html';
        });
    }

    const challengesLink = document.getElementById('challenges-link');
    if (challengesLink) {
        challengesLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'challenges.html';
        });
    }

    const profileLink = document.getElementById('profile-link');
    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'profile.html';
        });
    }

    // Logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }

    // === POPUP DE PERFIL === //
    // Abrir popup ao clicar na foto de perfil
    if (profilePicture) {
        profilePicture.addEventListener('click', (e) => {
            e.stopPropagation();
            showProfilePopup();
        });
    }

    // Fechar popup ao clicar no overlay
    if (profilePopupOverlay) {
        profilePopupOverlay.addEventListener('click', (e) => {
            hideProfilePopup();
        });
    }

    // Não fechar popup ao clicar dentro dele
    if (profilePopup) {
        profilePopup.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Fechar popup com tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && profilePopupOverlay && profilePopupOverlay.style.display === 'block') {
            hideProfilePopup();
        }
    });

    // Event listeners dos itens do popup
    const logoutPopupItem = document.getElementById('logout-popup-item');
    if (logoutPopupItem) {
        logoutPopupItem.addEventListener('click', () => {
            hideProfilePopup();
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }

    const settingsPopupItem = document.getElementById('settings-popup-item');
    if (settingsPopupItem) {
        settingsPopupItem.addEventListener('click', () => {
            hideProfilePopup();
            // Aqui você pode adicionar a funcionalidade de configurações
            alert('Configurações em desenvolvimento!');
        });
    }

    const helpPopupItem = document.getElementById('help-popup-item');
    if (helpPopupItem) {
        helpPopupItem.addEventListener('click', () => {
            hideProfilePopup();
            // Aqui você pode adicionar a funcionalidade de ajuda
            alert('Ajuda em desenvolvimento!');
        });
    }

    // === INICIALIZAÇÃO FINAL === //
    initializeApp();
    console.log('App inicializado com sucesso');
});




    // === MODAL DE LOGIN (ADAPTADO DO POPUP DE PERFIL) === //
    const loginModalOverlay = document.getElementById("profile-popup-overlay"); // Reutilizando o overlay do popup de perfil
    const loginModal = document.getElementById("profile-popup"); // Reutilizando o popup de perfil como modal de login

    const showLoginModal = () => {
        if (loginModalOverlay) {
            loginModalOverlay.style.display = 'flex'; // Usar flex para centralizar
            loginModal.innerHTML = `
                <div class="modal-content upgrade-modal-content" style="max-width: 400px;">
                    <span class="close-button" id="close-login-modal">&times;</span>
                    <h2>Faça Login ou Cadastre-se</h2>
                    <p>Para continuar, por favor, faça login ou crie uma conta.</p>
                    <button class="button-primary" id="go-to-login-page" style="width: 100%; margin-top: 20px;">Ir para a página de Login</button>
                </div>
            `;
            document.getElementById("close-login-modal").addEventListener("click", hideLoginModal);
            document.getElementById("go-to-login-page").addEventListener("click", () => {
                window.location.href = 'login.html';
            });
        }
    };

    const hideLoginModal = () => {
        if (loginModalOverlay) {
            loginModalOverlay.style.display = 'none';
        }
    };

    // Modificar o evento de clique do botão de novo chat
    if (newChatButton) {
        newChatButton.removeEventListener("click", () => {
            currentChat = null;
            showWelcomeScreen();
        }); // Remover o listener antigo
        newChatButton.addEventListener("click", () => {
            const isLoggedIn = localStorage.getItem("tutorIA_isLoggedIn");
            if (isLoggedIn === "true") {
                currentChat = null;
                showWelcomeScreen();
            } else {
                showLoginModal();
            }
        });
    }

    // Modificar o evento de clique dos cards de matéria
    document.querySelectorAll(".subject-card").forEach(card => {
        const oldClickListener = card._currentClickListener; // Salvar o listener antigo se existir
        if (oldClickListener) {
            card.removeEventListener("click", oldClickListener);
        }

        const newClickListener = () => {
            const isLoggedIn = localStorage.getItem("tutorIA_isLoggedIn");
            if (isLoggedIn === "true") {
                const subjectId = card.dataset.subject;
                const subject = subjects[subjectId];
                if (subject) {
                    const newChat = createNewChat(subject);
                    currentChat = newChat;
                    showChatInterface(newChat);
                    renderMessages(newChat.messages);
                }
            } else {
                showLoginModal();
            }
        };
        card.addEventListener("click", newClickListener);
        card._currentClickListener = newClickListener; // Salvar o novo listener
    });

    // Remover o listener de clique do overlay do profile-popup para evitar conflito
    if (profilePopupOverlay) {
        profilePopupOverlay.removeEventListener("click", (e) => {
            hideProfilePopup();
        });
    }

    // Adicionar um listener para fechar o modal de login se o usuário clicar fora dele
    if (loginModalOverlay) {
        loginModalOverlay.addEventListener("click", (e) => {
            if (e.target === loginModalOverlay) { // Verifica se o clique foi no overlay e não no conteúdo do modal
                hideLoginModal();
            }
        });
    }

    // Não fechar modal ao clicar dentro dele
    if (loginModal) {
        loginModal.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }

    // Fechar modal com tecla Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && loginModalOverlay && loginModalOverlay.style.display === "flex") {
            hideLoginModal();
        }
    });

    // Ajustar o CSS do profile-popup-overlay para ser um modal centralizado
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .profile-popup-overlay {
            display: none; /* Esconder por padrão */
            align-items: center; /* Centralizar verticalmente */
            justify-content: center; /* Centralizar horizontalmente */
            background-color: rgba(0, 0, 0, 0.6); /* Fundo mais escuro */
            backdrop-filter: blur(4px); /* Blur mais forte */
        }
        .profile-popup {
            position: relative; /* Remover posicionamento absoluto */
            top: auto; /* Remover top */
            right: auto; /* Remover right */
            transform: none; /* Remover transform */
            animation: none; /* Remover animação */
            min-width: auto; /* Ajustar largura mínima */
            max-width: 500px; /* Ajustar largura máxima */
            width: 90%; /* Largura responsiva */
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); /* Sombra mais pronunciada */
        }
        .profile-popup-content {
            border-radius: 16px; /* Bordas mais arredondadas */
            padding: 30px; /* Mais padding */
        }
        .profile-popup-header, .profile-popup-options {
            display: none; /* Esconder conteúdo original do popup de perfil */
        }
    `;
    document.head.appendChild(styleElement);


