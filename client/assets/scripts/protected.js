// protect-routes.js - Include this on your questions page

document.addEventListener('DOMContentLoaded', () => {
    function protectRoute() {
        const verificationPassed = sessionStorage.getItem('verificationPassed');
        const currentPath = window.location.pathname;
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        const protectedRoutes = ['/questions.html', '/client/questions.html', '/exam', '/test'];

        if (protectedRoutes.some(route => currentPath.startsWith(route))) {
            if (verificationPassed !== 'true') {
                console.log('Unauthorized access attempt - redirecting to verification page');

                sessionStorage.setItem('intendedDestination', window.location.href);

                const body = document.body;
                const unauthorizedMessage = document.createElement('div');
                unauthorizedMessage.innerHTML = `
                    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                                background-color: #fff; display: flex; flex-direction: column; 
                                align-items: center; justify-content: center; z-index: 9999;">
                        <h2 style="color: #00044b; margin-bottom: 20px;">Facial Verification Required</h2>
                        <p style="margin-bottom: 20px;">You need to complete facial verification before accessing this page.</p>
                        <p style="margin-bottom: 20px;">Redirecting to verification page...</p>
                    </div>
                `;
                body.appendChild(unauthorizedMessage);

                setTimeout(() => {
                    window.location.href = isLocal ? '/client/index.html' : '/';
                }, 2000);

                return false;
            }
            return true;
        }
        return true;
    }

    protectRoute();
});