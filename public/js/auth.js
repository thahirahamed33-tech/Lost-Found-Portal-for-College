document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const toRegister = document.getElementById('to-register');
    const toLogin = document.getElementById('to-login');

    // Toggle logic
    toRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    });
    toLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.style.display = 'none';
        loginSection.style.display = 'block';
    });

    // Check session
    fetch('/api/session').then(r => r.json()).then(data => {
        if (data.loggedIn) {
            window.location.href = 'dashboard.html';
        }
    });

    // Login logic
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = 'dashboard.html';
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (err) {
            alert('Something went wrong!');
        }
    });

    // Register logic
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullname = document.getElementById('reg-fullname').value;
        const reg_no = document.getElementById('reg-no').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, reg_no, email, password })
            });
            const data = await res.json();
            if (data.success) {
                alert('Registration successful! Please login.');
                toLogin.click();
            } else {
                alert(data.message || 'Registration failed');
            }
        } catch (err) {
            alert('Something went wrong!');
        }
    });
});
