document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const BASE_URL = isLocal ? 'http://127.0.0.1:8888' : 'https://project-facial-verification.onrender.com';

    const socket = io(BASE_URL, {
        auth: {
            token: token
        }
    });

    let verifications = [];
    let suspiciousLogins = [];
    let verificationPage = 1;
    let suspiciousLoginPage = 1;
    let verificationRowsPerPage = 10;
    let suspiciousLoginRowsPerPage = 10;

    const searchVerificationInput = document.getElementById('searchVerification');
    const searchSuspiciousInput = document.getElementById('searchSuspicious');
    const rowsPerPageSelectVerification = document.getElementById('rowsPerPageVerification');
    const rowsPerPageSelectSuspicious = document.getElementById('rowsPerPageSuspicious');

    async function fetchVerifications() {
        document.getElementById('loader').classList.remove('hidden');
        try {
            const response = await fetch(`${BASE_URL}/v1/user/verifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            verifications = data.data;
            updateVerificationTable();
        } catch (error) {
            console.error('Failed to fetch verifications', error);
        } finally {
            document.getElementById('loader').classList.add('hidden');
        }
    }

    async function fetchSuspiciousLogins() {
        document.getElementById('loader02').classList.remove('hidden');
        try {
            const response = await fetch(`${BASE_URL}/v1/user/suspicious-logins`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            suspiciousLogins = data.data;
            updateSuspiciousLoginsTable();
        } catch (error) {
            console.error('Failed to fetch suspicious logins', error);
        } finally {
            document.getElementById('loader02').classList.add('hidden');
        }
    }

    function updateVerificationTable() {
        const tbody = document.getElementById('verificationBody');
        tbody.innerHTML = '';
        const searchQuery = searchVerificationInput.value.toLowerCase();
        const filteredVerifications = verifications.filter(verification => {
            return (
                verification.matricNumber.toLowerCase().includes(searchQuery) ||
                verification.verificationStatus.toLowerCase().includes(searchQuery)
            );
        });

        if (filteredVerifications.length === 0) {
            const row = tbody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 6;
            cell.textContent = 'No verification records found';
            cell.classList.add('text-center', 'text-gray-500', 'py-4');
            return;
        }

        const paginatedVerifications = filteredVerifications.slice(
            (verificationPage - 1) * verificationRowsPerPage,
            verificationPage * verificationRowsPerPage
        );

        paginatedVerifications.forEach(verification => {
            const row = tbody.insertRow();
            row.classList.add('px-4', 'py-4');

            row.insertCell(0).textContent = verification.matricNumber;
            row.insertCell(1).textContent = new Date(verification.timestamp).toLocaleString();

            const statusCell = row.insertCell(2);
            const badge = document.createElement('span');
            const statusClass = verification.verificationStatus === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800';

            badge.classList.add(
                'px-3', 'py-1', 'rounded-full', 'text-xs', ...statusClass.split(' ')
            );
            badge.textContent = verification.verificationStatus;
            statusCell.appendChild(badge);

            row.insertCell(3).textContent = verification.confidenceScore;

            const capturedImageCell = row.insertCell(4);
            const capturedImage = document.createElement('img');
            capturedImage.src = verification.capturedImageBase64;
            capturedImage.classList.add('w-16', 'h-16', 'object-cover', 'rounded-full');
            capturedImageCell.appendChild(capturedImage);

            const storedImageCell = row.insertCell(5);
            const storedImage = document.createElement('img');
            storedImage.src = verification.storedImageUrl;
            storedImage.classList.add('w-16', 'h-16', 'object-cover', 'rounded-full');
            storedImageCell.appendChild(storedImage);

            if (verification.verificationStatus === 'failure') {
                row.classList.add('bg-red-50');
            }
        });
        document.getElementById('verificationPagination').innerHTML = generatePagination(filteredVerifications.length, verificationRowsPerPage);
    }

    function updateSuspiciousLoginsTable() {
        const tbody = document.getElementById('suspiciousBody');
        tbody.innerHTML = '';
        const searchQuery = searchSuspiciousInput.value.toLowerCase();
        const filteredLogins = suspiciousLogins.filter(login => {
            return login.matricNumber.toLowerCase().includes(searchQuery);
        });

        const paginatedLogins = filteredLogins.slice(
            (suspiciousLoginPage - 1) * suspiciousLoginRowsPerPage,
            suspiciousLoginPage * suspiciousLoginRowsPerPage
        );

        if (filteredLogins.length === 0) {
            const row = tbody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 3;
            cell.textContent = 'No suspicious login records found';
            cell.classList.add('text-center', 'text-gray-500', 'py-4');
            return;
        }

        paginatedLogins.forEach(login => {
            const row = tbody.insertRow();
            row.classList.add('px-4', 'py-2')

            row.insertCell(0).textContent = login.matricNumber;
            row.insertCell(1).textContent = login.failureCount;
            row.insertCell(2).textContent = new Date(login.firstFailureTime).toLocaleString();
        });
        document.getElementById('suspiciousPagination').innerHTML = generatePagination(filteredLogins.length, suspiciousLoginRowsPerPage);
    }

    function generatePagination(totalItems, rowsPerPage) {
        const totalPages = Math.ceil(totalItems / rowsPerPage);
        let paginationHtml = '';

        paginationHtml += `<button class="pagination-button px-4 py-2 mx-1" id="prevPage">Prev</button>`;

        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += `<button class="pagination-button px-4 py-2 mx-1" data-page="${i}">${i}</button>`;
        }

        paginationHtml += `<button class="pagination-button px-4 py-2 mx-1" id="nextPage">Next</button>`;

        return paginationHtml;
    }

    searchVerificationInput.addEventListener('input', updateVerificationTable);
    searchSuspiciousInput.addEventListener('input', updateSuspiciousLoginsTable);

    rowsPerPageSelectVerification.addEventListener('change', (e) => {
        verificationRowsPerPage = parseInt(e.target.value);
        updateVerificationTable();
    });

    rowsPerPageSelectSuspicious.addEventListener('change', (e) => {
        suspiciousLoginRowsPerPage = parseInt(e.target.value);
        updateSuspiciousLoginsTable();
    });

    document.getElementById('verificationPagination').addEventListener('click', (e) => {
        if (e.target.dataset.page) {
            verificationPage = parseInt(e.target.dataset.page);
        } else if (e.target.id === 'prevPage' && verificationPage > 1) {
            verificationPage--;
        } else if (e.target.id === 'nextPage' && verificationPage < Math.ceil(verifications.length / verificationRowsPerPage)) {
            verificationPage++;
        }
        updateVerificationTable();
    });

    document.getElementById('suspiciousPagination').addEventListener('click', (e) => {
        if (e.target.dataset.page) {
            suspiciousLoginPage = parseInt(e.target.dataset.page);
        } else if (e.target.id === 'prevPage' && suspiciousLoginPage > 1) {
            suspiciousLoginPage--;
        } else if (e.target.id === 'nextPage' && suspiciousLoginPage < Math.ceil(suspiciousLogins.length / suspiciousLoginRowsPerPage)) {
            suspiciousLoginPage++;
        }
        updateSuspiciousLoginsTable();
    });

    socket.on('newVerification', (verification) => {
        const tbody = document.getElementById('verificationBody');
        const row = tbody.insertRow(0);
        row.classList.add('px-4', 'py-2');

        row.insertCell(0).textContent = verification.matricNumber;
        row.insertCell(1).textContent = new Date(verification.timestamp).toLocaleString();

        const statusCell = row.insertCell(2);
        const badge = document.createElement('span');
        const statusClass = verification.verificationStatus === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800';

        badge.classList.add(
            'px-3', 'py-1', 'rounded-full', 'text-xs', ...statusClass.split(' ')
        );
        badge.textContent = verification.verificationStatus;
        statusCell.appendChild(badge);

        row.insertCell(3).textContent = verification.confidenceScore;

        const capturedImageCell = row.insertCell(4);
        const capturedImage = document.createElement('img');
        capturedImage.src = verification.capturedImageBase64;
        capturedImage.classList.add('w-16', 'h-16', 'object-cover', 'rounded-full');
        capturedImageCell.appendChild(capturedImage);

        const storedImageCell = row.insertCell(5);
        const storedImage = document.createElement('img');
        storedImage.src = verification.storedImageUrl;
        storedImage.classList.add('w-16', 'h-16', 'object-cover', 'rounded-full');
        storedImageCell.appendChild(storedImage);

        if (verification.verificationStatus === 'failure') {
            row.classList.add('bg-red-50');
        }
    });

    socket.on('suspiciousLogins', (suspiciousLogins) => {
        const tbody = document.getElementById('suspiciousBody');
        tbody.innerHTML = '';

        suspiciousLogins.forEach(login => {
            const row = tbody.insertRow();
            row.classList.add('px-4', 'py-2');

            row.insertCell(0).textContent = login.matricNumber;
            row.insertCell(1).textContent = login.failureCount;
            row.insertCell(2).textContent = new Date(login.firstFailureTime).toLocaleString();
        });
    });

    fetchVerifications();
    fetchSuspiciousLogins();

    socket.on('connect', () => console.log('Connected to WebSocket server'));
    socket.on('disconnect', () => console.log('Disconnected from WebSocket server'));
});
