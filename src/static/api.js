// api.js - Integração com Backend do Tutor IA 3.0

const API_BASE_URL = window.location.origin + '/api';

class TutorAPI {
    constructor() {
        this.token = localStorage.getItem('tutorIA_token');
    }

    // === MÉTODOS DE AUTENTICAÇÃO === //
    
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.access_token;
                localStorage.setItem('tutorIA_token', this.token);
                localStorage.setItem('tutorIA_userData', JSON.stringify({
                    ...data.user,
                    isLoggedIn: true
                }));
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.access_token;
                localStorage.setItem('tutorIA_token', this.token);
                localStorage.setItem('tutorIA_userData', JSON.stringify({
                    ...data.user,
                    isLoggedIn: true
                }));
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    async logout() {
        try {
            if (this.token) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            this.token = null;
            localStorage.removeItem('tutorIA_token');
            localStorage.removeItem('tutorIA_userData');
        }
    }

    async getCurrentUser() {
        try {
            if (!this.token) return { success: false, error: 'Não autenticado' };

            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('tutorIA_userData', JSON.stringify({
                    ...data.user,
                    isLoggedIn: true
                }));
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    // === MÉTODOS DE CHAT === //

    async getChats() {
        try {
            if (!this.token) return { success: false, error: 'Não autenticado' };

            const response = await fetch(`${API_BASE_URL}/chats/`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, chats: data.chats };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Erro ao buscar chats:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    async createChat(chatData) {
        try {
            if (!this.token) return { success: false, error: 'Não autenticado' };

            const response = await fetch(`${API_BASE_URL}/chats/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chatData)
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, chat: data.chat };
            } else {
                return { success: false, error: data.error, upgradeRequired: data.upgrade_required };
            }
        } catch (error) {
            console.error('Erro ao criar chat:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    async getChat(chatId) {
        try {
            if (!this.token) return { success: false, error: 'Não autenticado' };

            const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, chat: data.chat };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Erro ao buscar chat:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    async updateChat(chatId, updateData) {
        try {
            if (!this.token) return { success: false, error: 'Não autenticado' };

            const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, chat: data.chat };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Erro ao atualizar chat:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    async deleteChat(chatId) {
        try {
            if (!this.token) return { success: false, error: 'Não autenticado' };

            const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Erro ao deletar chat:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    // === MÉTODOS DE IA === //

    async sendMessage(chatId, message) {
        try {
            if (!this.token) return { success: false, error: 'Não autenticado' };

            const response = await fetch(`${API_BASE_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    message: message
                })
            });

            const data = await response.json();

            if (response.ok) {
                return { 
                    success: true, 
                    userMessage: data.user_message,
                    aiMessage: data.ai_message,
                    responseTime: data.response_time_ms,
                    remainingChats: data.remaining_chats
                };
            } else {
                return { 
                    success: false, 
                    error: data.error, 
                    upgradeRequired: data.upgrade_required 
                };
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    // === MÉTODOS DE USUÁRIO === //

    async updateProfile(profileData) {
        try {
            if (!this.token) return { success: false, error: 'Não autenticado' };

            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (response.ok) {
                // Atualizar dados locais
                const userData = JSON.parse(localStorage.getItem('tutorIA_userData') || '{}');
                const updatedUser = { ...userData, ...data.user };
                localStorage.setItem('tutorIA_userData', JSON.stringify(updatedUser));
                
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    async getStudyStats() {
        try {
            if (!this.token) return { success: false, error: 'Não autenticado' };

            const response = await fetch(`${API_BASE_URL}/study/stats`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, stats: data.stats };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    // === MÉTODOS DE TURMA === //

    async getClassrooms() {
        try {
            if (!this.token) return { success: false, error: 'Não autenticado' };

            const response = await fetch(`${API_BASE_URL}/classrooms/`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, classrooms: data.classrooms };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Erro ao buscar turmas:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    async joinClassroom(accessCode) {
        try {
            if (!this.token) return { success: false, error: 'Não autenticado' };

            const response = await fetch(`${API_BASE_URL}/classrooms/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ access_code: accessCode })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, classroom: data.classroom };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Erro ao entrar na turma:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    // === MÉTODOS DE DESAFIO === //

    async getChallenges(classroomId = null) {
        try {
            if (!this.token) return { success: false, error: 'Não autenticado' };

            let url = `${API_BASE_URL}/challenges/`;
            if (classroomId) {
                url += `?classroom_id=${classroomId}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, challenges: data.challenges };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Erro ao buscar desafios:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    async submitChallenge(challengeId, answerData) {
        try {
            if (!this.token) return { success: false, error: 'Não autenticado' };

            const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answer_data: answerData })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, submission: data.submission };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Erro ao submeter desafio:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }

    // === MÉTODOS UTILITÁRIOS === //

    isAuthenticated() {
        return !!this.token;
    }

    async checkHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            const data = await response.json();
            return response.ok ? data : null;
        } catch (error) {
            console.error('Erro ao verificar saúde da API:', error);
            return null;
        }
    }
}

// Instância global da API
const tutorAPI = new TutorAPI();

// Exportar para uso global
window.tutorAPI = tutorAPI;

