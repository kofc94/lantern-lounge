// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Animate hamburger menu
            navToggle.classList.toggle('active');
        });

        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Authentication state management
class AuthManager {
    constructor() {
        this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        this.username = localStorage.getItem('username') || '';
        this.updateUI();
    }

    login(username, password) {
        // Simple authentication for demo purposes
        // In production, this would connect to a real backend
        if (username && password) {
            this.isLoggedIn = true;
            this.username = username;
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            this.updateUI();
            return true;
        }
        return false;
    }

    logout() {
        this.isLoggedIn = false;
        this.username = '';
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        this.updateUI();
    }

    updateUI() {
        const loginLink = document.querySelector('.login-btn');
        if (loginLink) {
            if (this.isLoggedIn) {
                loginLink.textContent = `Welcome, ${this.username}`;
                loginLink.href = '#';
                loginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showUserMenu();
                });
            } else {
                loginLink.textContent = 'Member Login';
                loginLink.href = 'login.html';
            }
        }
    }

    showUserMenu() {
        // Simple user menu for demo
        const userChoice = confirm('Logged in as ' + this.username + '. Click OK to logout, Cancel to continue.');
        if (userChoice) {
            this.logout();
            window.location.href = 'index.html';
        }
    }
}

// Initialize authentication manager
const authManager = new AuthManager();

// Make it globally accessible
window.authManager = authManager;

// Join form functionality
function showJoinForm() {
    const membershipGrid = document.getElementById('membershipGrid');
    
    if (membershipGrid) {
        // Clear the entire grid content
        membershipGrid.innerHTML = '';
        
        // Create iframe container that spans full width
        const formContainer = document.createElement('div');
        formContainer.className = 'join-form-container';
        formContainer.innerHTML = `
            <iframe title='Donation form powered by Zeffy' 
                    style='border: 0; width:100%; height:800px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);' 
                    src='https://www.zeffy.com/embed/ticketing/lantern-lounge-associate-membership' 
                    allowpaymentrequest allowTransparency="true">
            </iframe>
        `;
        
        // Add form container to the membership grid
        membershipGrid.appendChild(formContainer);
        
        // Update grid to single column for full width
        membershipGrid.style.gridTemplateColumns = '1fr';
    }
}