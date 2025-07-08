// login.js - Tutor IA 3.0 Login/Register

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const googleLoginBtn = document.getElementById('google-login');
    const googleRegisterBtn = document.getElementById('google-register');

    // Alternar entre formulários
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Simular login
    loginForm.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        if (email && password) {
            // Simular dados do usuário logado
            const userData = {
                id: Date.now(),
                name: email.split('@')[0], // Nome temporário baseado no email
                email: email,
                age: 20, // Idade padrão
                educationLevel: 'medio',
                difficulty: 'medio',
                profilePicture: null,
                isLoggedIn: true,
                loginMethod: 'email'
            };

            // Salvar dados do usuário
            localStorage.setItem('tutorIA_userData', JSON.stringify(userData));
            localStorage.setItem('tutorIA_isLoggedIn', 'true');
            
            if (rememberMe) {
                localStorage.setItem('tutorIA_rememberMe', 'true');
            }

            // Redirecionar para a aplicação principal
            window.location.href = 'index.html';
        } else {
            alert('Por favor, preencha todos os campos.');
        }
    });

    // Simular cadastro
    registerForm.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const age = parseInt(document.getElementById('register-age').value);
        const education = document.getElementById('register-education').value;
        const acceptTerms = document.getElementById('accept-terms').checked;

        if (!acceptTerms) {
            alert('Você deve aceitar os Termos de Uso e Política de Privacidade.');
            return;
        }

        if (password !== confirmPassword) {
            alert('As senhas não coincidem.');
            return;
        }

        if (name && email && password && age && education) {
            // Determinar dificuldade baseada na idade
            let difficulty = 'medio';
            if (age >= 6 && age <= 10) {
                difficulty = 'muito_facil';
            } else if (age > 10 && age <= 12) {
                difficulty = 'facil';
            } else if (age > 12 && age <= 14) {
                difficulty = 'medio_facil';
            } else if (age > 14 && age <= 16) {
                difficulty = 'medio';
            } else if (age > 16 && age <= 18) {
                difficulty = 'medio_dificil';
            } else if (age > 18) {
                difficulty = 'dificil';
            }

            const userData = {
                id: Date.now(),
                name: name,
                email: email,
                age: age,
                educationLevel: education,
                difficulty: difficulty,
                profilePicture: null,
                isLoggedIn: true,
                loginMethod: 'email'
            };

            // Salvar dados do usuário
            localStorage.setItem('tutorIA_userData', JSON.stringify(userData));
            localStorage.setItem('tutorIA_isLoggedIn', 'true');

            // Redirecionar para a aplicação principal
            window.location.href = 'index.html';
        } else {
            alert('Por favor, preencha todos os campos.');
        }
    });

    // Simular login com Google
    googleLoginBtn.addEventListener('click', () => {
        // Simular dados do Google
        const userData = {
            id: Date.now(),
            name: 'Usuário Google',
            email: 'usuario@gmail.com',
            age: 20,
            educationLevel: 'medio',
            difficulty: 'medio',
            profilePicture: 'https://via.placeholder.com/100',
            isLoggedIn: true,
            loginMethod: 'google'
        };

        localStorage.setItem('tutorIA_userData', JSON.stringify(userData));
        localStorage.setItem('tutorIA_isLoggedIn', 'true');
        window.location.href = 'index.html';
    });

    // Simular cadastro com Google
    googleRegisterBtn.addEventListener('click', () => {
        // Simular dados do Google
        const userData = {
            id: Date.now(),
            name: 'Novo Usuário Google',
            email: 'novousuario@gmail.com',
            age: 18,
            educationLevel: 'medio',
            difficulty: 'medio',
            profilePicture: 'https://via.placeholder.com/100',
            isLoggedIn: true,
            loginMethod: 'google'
        };

        localStorage.setItem('tutorIA_userData', JSON.stringify(userData));
        localStorage.setItem('tutorIA_isLoggedIn', 'true');
        window.location.href = 'index.html';
    });

    // Verificar se já está logado
    const isLoggedIn = localStorage.getItem('tutorIA_isLoggedIn');
    if (isLoggedIn === 'true') {
        window.location.href = 'index.html';
    }
});

