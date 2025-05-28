
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

    const detailsModal = document.getElementById('detailsModal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalPanel = document.getElementById('modalPanel');
    const closeModal = document.getElementById('closeModal');
    const closeModalBottom = document.getElementById('closeModalBottom');
    const modalContent = document.getElementById('modalContent');

    function openModal(verification) {
        const confidenceScore = verification.confidenceScore || verification.similarityScore || 0;
        const confidenceColor = confidenceScore > 0.8 ? 'text-green-600' :
            confidenceScore > 0.6 ? 'text-yellow-600' : 'text-red-600';

        const statusBadge = verification.verificationStatus === 'success'
            ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Success</span>'
            : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">✗ Failed</span>';

        modalContent.innerHTML = `
        <div class="py-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span class="text-lg font-medium text-indigo-800">${verification.matricNumber ? verification.matricNumber.slice(-4) : 'N/A'}</span>
                    </div>
                    <div class="ml-4">
                        <h3 class="text-lg font-medium text-gray-900">${verification.matricNumber || 'N/A'}</h3>
                        <p class="text-sm text-gray-500">Student ID</p>
                    </div>
                </div>
                ${statusBadge}
            </div>
            
            <div class="mt-6">
                <h4 class="text-sm font-medium text-gray-500">Verification Information</h4>
                <dl class="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="px-4 py-5 sm:p-6">
                            <dt class="text-sm font-medium text-gray-500 truncate">Date</dt>
                            <dd class="mt-1 text-lg font-semibold text-gray-900">${verification.timestamp ? new Date(verification.timestamp).toLocaleDateString() : 'N/A'}</dd>
                        </div>
                    </div>
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="px-4 py-5 sm:p-6">
                            <dt class="text-sm font-medium text-gray-500 truncate">Time</dt>
                            <dd class="mt-1 text-lg font-semibold text-gray-900">${verification.timestamp ? new Date(verification.timestamp).toLocaleTimeString() : 'N/A'}</dd>
                        </div>
                    </div>
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="px-4 py-5 sm:p-6">
                            <dt class="text-sm font-medium text-gray-500 truncate">Confidence</dt>
                            <dd class="mt-1 text-lg font-semibold ${confidenceColor}">${(confidenceScore * 100).toFixed(1)}%</dd>
                        </div>
                    </div>
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="px-4 py-5 sm:p-6">
                            <dt class="text-sm font-medium text-gray-500 truncate">Device</dt>
                            <dd class="mt-1 text-lg font-semibold text-gray-900">${verification.deviceId || 'Unknown'}</dd>
                        </div>
                    </div>
                </dl>
            </div>
            
            <div class="mt-6">
                <h4 class="text-sm font-medium text-gray-500">Images</h4>
                <div class="mt-4 grid grid-cols-2 items-stretch gap-4">
                    <div class="h-full">
                        <div class="aspect-w-1 aspect-h-1 h-full bg-gray-100 rounded-lg overflow-hidden">
                            <img src="${verification.capturedImageBase64 || 'https://via.placeholder.com/300'}" alt="Captured" class="object-cover h-full w-full">
                        </div>
                        <p class="mt-2 text-sm text-center text-gray-500">Captured Image</p>
                    </div>
                    <div class="h-full">
                        <div class="aspect-w-1 aspect-h-1 h-full bg-gray-100 rounded-lg overflow-hidden">
                            <img src="${verification.storedImageUrl || 'https://via.placeholder.com/300'}" alt="Stored" class="object-cover h-full w-full">
                        </div>
                        <p class="mt-2 text-sm text-center text-gray-500">Stored Image</p>
                    </div>
                </div>
            </div>
            
            ${verification.verificationStatus === 'failure' ? `
            <div class="mt-6">
                <h4 class="text-sm font-medium text-gray-500">Failure Analysis</h4>
                <div class="mt-2 bg-red-50 rounded-lg p-4">
                    <p class="text-sm text-red-700">The system detected a mismatch between the captured image and the stored image. This could be due to:</p>
                    <ul class="mt-2 list-disc list-inside text-sm text-red-700">
                        <li>Poor lighting conditions</li>
                        <li>Obstructions (glasses, masks, etc.)</li>
                        <li>Significant changes in appearance</li>
                        <li>Potential impersonation attempt</li>
                    </ul>
                </div>
            </div>
            ` : ''}
        </div>
    `;

        detailsModal.classList.remove('hidden');
        setTimeout(() => {
            modalBackdrop.classList.add('opacity-100');
            modalPanel.classList.remove('translate-x-full');
        }, 20);
    }

    function closeModalHandler() {
        modalBackdrop.classList.remove('opacity-100');
        modalPanel.classList.add('translate-x-full');
        setTimeout(() => {
            detailsModal.classList.add('hidden');
        }, 300);
    }

    closeModal.addEventListener('click', closeModalHandler);
    closeModalBottom.addEventListener('click', closeModalHandler);
    modalBackdrop.addEventListener('click', closeModalHandler);

    document.addEventListener('click', (e) => {
        if (e.target.textContent === 'View Details') {
            const row = e.target.closest('tr');
            const rowIndex = Array.from(row.parentNode.children).indexOf(row);
            const startIndex = (verificationPage - 1) * verificationRowsPerPage;
            const actualIndex = startIndex + rowIndex;

            const searchQuery = searchVerificationInput.value.toLowerCase();
            const filteredVerifications = verifications.filter(verification => {
                return (
                    verification.matricNumber.toLowerCase().includes(searchQuery) ||
                    (verification.verificationStatus && verification.verificationStatus.toLowerCase().includes(searchQuery))
                );
            });

            if (filteredVerifications[actualIndex]) {
                openModal(filteredVerifications[actualIndex]);
            }
        }
    });

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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            verifications = data.data || [];
            updateVerificationTable();
            updateStats();
        } catch (error) {
            console.error('Failed to fetch verifications', error);
            alert('Failed to fetch verification data. Please try again later.');
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            suspiciousLogins = data.data || [];
            updateSuspiciousLoginsTable();
            updateStats();
        } catch (error) {
            console.error('Failed to fetch suspicious logins', error);
            // Show error to user
            alert('Failed to fetch suspicious login data. Please try again later.');
        } finally {
            document.getElementById('loader02').classList.add('hidden');
        }
    }

    function updateStats() {
        const total = verifications.length;
        const successful = verifications.filter(v => v.verificationStatus === 'success').length;
        const failed = verifications.filter(v => v.verificationStatus === 'failure').length;
        const suspicious = suspiciousLogins.length;

        document.getElementById('totalVerifications').textContent = total;
        document.getElementById('successfulVerifications').textContent = successful;
        document.getElementById('failedVerifications').textContent = failed;
        document.getElementById('suspiciousCount').textContent = suspicious;
    }

    function updateVerificationTable() {
        const tbody = document.getElementById('verificationBody');
        tbody.innerHTML = '';
        const searchQuery = searchVerificationInput.value.toLowerCase();
        const filteredVerifications = verifications.filter(verification => {
            return (
                verification.matricNumber.toLowerCase().includes(searchQuery) ||
                (verification.verificationStatus && verification.verificationStatus.toLowerCase().includes(searchQuery))
            );
        });

        if (filteredVerifications.length === 0) {
            tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5c0-1.1.9-2 2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <p class="mt-2">No verification records found</p>
                        </td>
                    </tr>
                `;
            return;
        }

        const startIndex = (verificationPage - 1) * verificationRowsPerPage;
        const endIndex = Math.min(startIndex + verificationRowsPerPage, filteredVerifications.length);
        const paginatedVerifications = filteredVerifications.slice(startIndex, endIndex);

        paginatedVerifications.forEach((verification) => {
            const row = document.createElement('tr');
            row.className = `fade-in ${verification.verificationStatus === 'failure' ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors duration-150`;

            const statusBadge = verification.verificationStatus === 'success'
                ? '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Success</span>'
                : '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">✗ Failed</span>';

            const confidenceScore = verification.confidenceScore || verification.similarityScore || 0;
            const confidenceColor = confidenceScore > 0.8 ? 'text-green-600' :
                confidenceScore > 0.6 ? 'text-yellow-600' : 'text-red-600';

            row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10">
                                <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span class="text-sm font-medium text-indigo-800">${verification.matricNumber ? verification.matricNumber.slice(-4) : 'N/A'}</span>
                                </div>
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900">${verification.matricNumber || 'N/A'}</div>
                                <div class="text-sm text-gray-500">Student ID</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${verification.timestamp ? new Date(verification.timestamp).toLocaleDateString() : 'N/A'}</div>
                        <div class="text-sm text-gray-500">${verification.timestamp ? new Date(verification.timestamp).toLocaleTimeString() : ''}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${statusBadge}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="text-sm font-medium ${confidenceColor}">${(confidenceScore * 100).toFixed(1)}%</div>
                            <div class="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                <div class="h-2 rounded-full ${verification.verificationStatus === 'success' ? 'bg-green-500' : 'bg-red-500'}" 
                                     style="width: ${confidenceScore * 100}%"></div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center space-x-3">
                            <div class="flex flex-col items-center">
                                <img class="h-12 w-12 rounded-full object-cover border-2 border-gray-200" 
                                     src="${verification.capturedImageBase64 || 'https://via.placeholder.com/48'}" alt="Captured">
                                <span class="text-xs text-gray-500 mt-1">Captured</span>
                            </div>
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                            <div class="flex flex-col items-center">
                                <img class="h-12 w-12 rounded-full object-cover border-2 border-gray-200" 
                                     src="${verification.storedImageUrl || 'https://via.placeholder.com/48'}" alt="Stored">
                                <span class="text-xs text-gray-500 mt-1">Stored</span>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="text- hover:text-gray-900 mr-3 view-details-btn">View Details</button>
                    </td>
                `;
            tbody.appendChild(row);
        });

        document.getElementById('verificationStart').textContent = startIndex + 1;
        document.getElementById('verificationEnd').textContent = endIndex;
        document.getElementById('verificationTotal').textContent = filteredVerifications.length;

        updateVerificationPagination(filteredVerifications.length);
    }

    function updateSuspiciousLoginsTable() {
        const tbody = document.getElementById('suspiciousBody');
        tbody.innerHTML = '';
        const searchQuery = searchSuspiciousInput.value.toLowerCase();
        const filteredLogins = suspiciousLogins.filter(login => {
            return login.matricNumber && login.matricNumber.toLowerCase().includes(searchQuery);
        });

        if (filteredLogins.length === 0) {
            tbody.innerHTML = `
                                <tr>
                                    <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                                        <svg class="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M12 3l7.5 4.5v5.25c0 4.42-3.5 8.43-7.5 9.75-4-1.32-7.5-5.33-7.5-9.75V7.5L12 3z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 12l2 2 4-4" />
                                        </svg>
                                        <p class="mt-2">No suspicious login records found</p>
                                        <p class="text-sm text-gray-400">This is good news!</p>
                                    </td>
                                </tr>
                `;
            return;
        }

        const startIndex = (suspiciousLoginPage - 1) * suspiciousLoginRowsPerPage;
        const endIndex = Math.min(startIndex + suspiciousLoginRowsPerPage, filteredLogins.length);
        const paginatedLogins = filteredLogins.slice(startIndex, endIndex);

        paginatedLogins.forEach(login => {
            const row = document.createElement('tr');
            row.className = 'fade-in hover:bg-red-25 transition-colors duration-150';

            const failureCount = login.failureCount || 0;
            const riskLevel = failureCount >= 5 ? 'High' : failureCount >= 3 ? 'Medium' : 'Low';
            const riskColor = failureCount >= 5 ? 'bg-red-100 text-red-800' :
                failureCount >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800';

            row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10">
                                <div class="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                    </svg>
                                </div>
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900">${login.matricNumber || 'N/A'}</div>
                                <div class="text-sm text-gray-500">Suspicious Activity</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <span class="text-2xl font-bold text-red-600">${failureCount}</span>
                            <span class="ml-2 text-sm text-gray-500">failed attempts</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${login.firstFailureTime ? new Date(login.firstFailureTime).toLocaleDateString() : 'N/A'}</div>
                        <div class="text-sm text-gray-500">${login.firstFailureTime ? new Date(login.firstFailureTime).toLocaleTimeString() : ''}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${riskColor}">
                            ${riskLevel} Risk
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="text-red-600 hover:text-red-900 mr-3">Block User</button>
                        <button class="text-gray-600 hover:text-gray-900">Investigate</button>
                    </td>
                `;
            tbody.appendChild(row);
        });

        document.getElementById('suspiciousStart').textContent = startIndex + 1;
        document.getElementById('suspiciousEnd').textContent = endIndex;
        document.getElementById('suspiciousTotal').textContent = filteredLogins.length;

        updateSuspiciousPagination(filteredLogins.length);
    }

    function updateVerificationPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / verificationRowsPerPage);
        const pagination = document.getElementById('verificationPagination');

        let paginationHtml = '';

        paginationHtml += `<button class="pagination-button px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${verificationPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                               ${verificationPage <= 1 ? 'disabled' : ''} data-action="prev-verification">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
            </button>`;

        const startPage = Math.max(1, verificationPage - 2);
        const endPage = Math.min(totalPages, verificationPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === verificationPage;
            paginationHtml += `<button class="pagination-button px-3 py-2 rounded-md border text-sm font-medium ${isActive ? 'active bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'}" 
                                   data-page-verification="${i}">${i}</button>`;
        }

        paginationHtml += `<button class="pagination-button px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${verificationPage >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                               ${verificationPage >= totalPages ? 'disabled' : ''} data-action="next-verification">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>`;

        pagination.innerHTML = paginationHtml;
    }

    function updateSuspiciousPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / suspiciousLoginRowsPerPage);
        const pagination = document.getElementById('suspiciousPagination');

        let paginationHtml = '';

        paginationHtml += `<button class="pagination-button px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${suspiciousLoginPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                               ${suspiciousLoginPage <= 1 ? 'disabled' : ''} data-action="prev-suspicious">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
            </button>`;

        const startPage = Math.max(1, suspiciousLoginPage - 2);
        const endPage = Math.min(totalPages, suspiciousLoginPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === suspiciousLoginPage;
            paginationHtml += `<button class="pagination-button px-3 py-2 rounded-md border text-sm font-medium ${isActive ? 'active bg-red-600 text-white border-red-600' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'}" 
                                   data-page-suspicious="${i}">${i}</button>`;
        }

        paginationHtml += `<button class="pagination-button px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${suspiciousLoginPage >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                               ${suspiciousLoginPage >= totalPages ? 'disabled' : ''} data-action="next-suspicious">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>`;

        pagination.innerHTML = paginationHtml;
    }

    searchVerificationInput.addEventListener('input', () => {
        verificationPage = 1;
        updateVerificationTable();
    });

    searchSuspiciousInput.addEventListener('input', () => {
        suspiciousLoginPage = 1;
        updateSuspiciousLoginsTable();
    });

    rowsPerPageSelectVerification.addEventListener('change', (e) => {
        verificationRowsPerPage = parseInt(e.target.value);
        verificationPage = 1;
        updateVerificationTable();
    });

    rowsPerPageSelectSuspicious.addEventListener('change', (e) => {
        suspiciousLoginRowsPerPage = parseInt(e.target.value);
        suspiciousLoginPage = 1;
        updateSuspiciousLoginsTable();
    });

    document.addEventListener('click', (e) => {
        if (e.target.dataset.pageVerification) {
            verificationPage = parseInt(e.target.dataset.pageVerification);
            updateVerificationTable();
        } else if (e.target.dataset.action === 'prev-verification' && verificationPage > 1) {
            verificationPage--;
            updateVerificationTable();
        } else if (e.target.dataset.action === 'next-verification') {
            const totalPages = Math.ceil(verifications.length / verificationRowsPerPage);
            if (verificationPage < totalPages) {
                verificationPage++;
                updateVerificationTable();
            }
        }

        if (e.target.dataset.pageSuspicious) {
            suspiciousLoginPage = parseInt(e.target.dataset.pageSuspicious);
            updateSuspiciousLoginsTable();
        } else if (e.target.dataset.action === 'prev-suspicious' && suspiciousLoginPage > 1) {
            suspiciousLoginPage--;
            updateSuspiciousLoginsTable();
        } else if (e.target.dataset.action === 'next-suspicious') {
            const totalPages = Math.ceil(suspiciousLogins.length / suspiciousLoginRowsPerPage);
            if (suspiciousLoginPage < totalPages) {
                suspiciousLoginPage++;
                updateSuspiciousLoginsTable();
            }
        }
    });

    socket.on('connect', () => {
        console.log('Connected to server');
        document.getElementById('connectionStatus').textContent = 'Connected';
        document.querySelector('#connectionStatus').previousElementSibling.className = 'w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2';
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        document.getElementById('connectionStatus').textContent = 'Disconnected';
        document.querySelector('#connectionStatus').previousElementSibling.className = 'w-2 h-2 bg-red-400 rounded-full mr-2';
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        document.getElementById('connectionStatus').textContent = 'Connection Error';
        document.querySelector('#connectionStatus').previousElementSibling.className = 'w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2';
    });

    socket.on('newVerification', (verification) => {
        verifications.unshift(verification);
        updateVerificationTable();
        updateStats();
    });

    socket.on('newSuspiciousLogin', (login) => {
        suspiciousLogins.unshift(login);
        updateSuspiciousLoginsTable();
        updateStats();
    });

    fetchVerifications();
    fetchSuspiciousLogins();

    setInterval(() => {
        fetchVerifications();
        fetchSuspiciousLogins();
    }, 300000);
});