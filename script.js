document.addEventListener('DOMContentLoaded', () => {
    // LocalStorage Keys
    const USERS_KEY = 'portal_users';
    const CURRENT_USER_KEY = 'portal_current_user';
    const SUBMISSIONS_KEY = 'portal_submissions';

    // App State
    let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    let currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null;
    let submissions = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY)) || [];

    // DOM Elements
    const authView = document.getElementById('auth-view');
    const dashboardView = document.getElementById('dashboard-view');
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const submissionForm = document.getElementById('submission-form');
    const logoutBtn = document.getElementById('logout-btn');

    const welcomeHeading = document.getElementById('welcome-heading');
    const userDisplayName = document.getElementById('user-display-name');
    const userDisplayEmail = document.getElementById('user-display-email');
    const userAvatar = document.getElementById('user-avatar');

    const statTotal = document.getElementById('stat-total');
    const statLastActivity = document.getElementById('stat-last-activity');
    const submissionsList = document.getElementById('submissions-list');

    const navItems = document.querySelectorAll('.nav-item');
    const dashSections = document.querySelectorAll('.dash-section');

    // Init App
    init();

    function init() {
        setupEventListeners();
        if (currentUser) {
            showDashboard();
        } else {
            showAuth();
        }
    }

    function setupEventListeners() {
        // Tab Switcher (Login/Register)
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                authForms.forEach(f => f.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`${btn.dataset.tab}-form`).classList.add('active');
            });
        });

        // Navigation Switcher (Dashboard Sections)
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navItems.forEach(i => i.classList.remove('active'));
                dashSections.forEach(s => s.classList.remove('active'));

                item.classList.add('active');
                document.getElementById(`section-${item.dataset.target}`).classList.add('active');
            });
        });

        // Register Submission
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            if (users.find(u => u.email === email)) {
                showToast('Email already registered!', 'error');
                return;
            }

            const newUser = { id: Date.now(), name, email, password };
            users.push(newUser);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));

            currentUser = newUser;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));

            showToast('Account created successfully!');
            registerForm.reset();
            showDashboard();
        });

        // Login Submission
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const user = users.find(u => u.email === email && u.password === password);

            if (!user) {
                showToast('Invalid email or password!', 'error');
                return;
            }

            currentUser = user;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));

            showToast('Welcome back!');
            loginForm.reset();
            showDashboard();
        });

        // Logout Event
        logoutBtn.addEventListener('click', () => {
            currentUser = null;
            localStorage.removeItem(CURRENT_USER_KEY);
            showAuth();
            showToast('Logged out successfully.');
        });

        // Create Entry Submission Form Event
        submissionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('form-title').value;
            const category = document.getElementById('form-category').value;
            const description = document.getElementById('form-description').value;

            const newSubmission = {
                id: Date.now(),
                userId: currentUser.id,
                title,
                category,
                description,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };

            submissions.push(newSubmission);
            localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));

            submissionForm.reset();
            showToast('Entry submitted successfully!');
            renderDashboardData();
        });
    }

    // View Controls
    function showAuth() {
        authView.classList.add('active');
        dashboardView.classList.remove('active');
    }

    function showDashboard() {
        authView.classList.remove('active');
        dashboardView.classList.add('active');
        
        // Populate Header Data
        welcomeHeading.textContent = `Welcome back, ${currentUser.name.split(' ')[0]}!`;
        userDisplayName.textContent = currentUser.name;
        userDisplayEmail.textContent = currentUser.email;
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();

        renderDashboardData();
    }

    // Render Dashboard Table and Metrics
    function renderDashboardData() {
        const userSubmissions = submissions.filter(s => s.userId === currentUser.id);

        // Update Stats
        statTotal.textContent = userSubmissions.length;
        statLastActivity.textContent = userSubmissions.length > 0 
            ? userSubmissions[userSubmissions.length - 1].date 
            : 'Never';

        // Update Submissions Table
        submissionsList.innerHTML = '';

        if (userSubmissions.length === 0) {
            submissionsList.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
                        No submissions found. Create your first entry above!
                    </td>
                </tr>`;
            return;
        }

        userSubmissions.slice().reverse().forEach(sub => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(sub.title)}</strong></td>
                <td><span class="badge">${escapeHtml(sub.category)}</span></td>
                <td>${escapeHtml(sub.description)}</td>
                <td>${sub.date}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteSubmission(${sub.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            submissionsList.appendChild(tr);
        });
    }

    // Global Action: Delete Entry
    window.deleteSubmission = function(id) {
        submissions = submissions.filter(s => s.id !== id);
        localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
        showToast('Entry deleted');
        renderDashboardData();
    };

    // Helper: Toast Notifications
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

        toastMessage.textContent = message;
        toastIcon.className = type === 'error' ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-circle-info';
        
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // Utility: XSS Sanitation
    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
});