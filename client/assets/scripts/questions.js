const quizData = [
    {
        question: "Which of the following is a fundamental principle of cybersecurity?",
        a: "Confidentiality",
        b: "Scalability",
        c: "Accessibility",
        d: "Redundancy",
        correct: "a",
    },
    {
        question: "What is the primary function of a firewall in network security?",
        a: "Data encryption",
        b: "Traffic filtering",
        c: "File compression",
        d: "Load balancing",
        correct: "b",
    },
    {
        question: "In cryptography, what does RSA stand for?",
        a: "Randomized Security Algorithm",
        b: "Rivest-Shamir-Adleman",
        c: "Reliable Secure Authentication",
        d: "Recursive Symmetric Architecture",
        correct: "b",
    },
    {
        question: "Which of the following best describes a Denial-of-Service (DoS) attack?",
        a: "Intercepting communication between two parties",
        b: "Overloading a system to make it unavailable",
        c: "Gaining unauthorized access to a network",
        d: "Encrypting data without permission",
        correct: "b",
    },
    {
        question: "Which data structure uses the Last-In-First-Out (LIFO) principle?",
        a: "Queue",
        b: "Stack",
        c: "Linked List",
        d: "Heap",
        correct: "b",
    },
    {
        question: "Which algorithm is used to find the shortest path in a weighted graph?",
        a: "Depth-First Search",
        b: "Breadth-First Search",
        c: "Dijkstra's Algorithm",
        d: "Kruskal's Algorithm",
        correct: "c",
    },
    {
        question: "What does ACID stand for in database transactions?",
        a: "Atomicity, Consistency, Isolation, Durability",
        b: "Access, Control, Integrity, Distribution",
        c: "Authentication, Confidentiality, Integrity, Deployment",
        d: "Allocation, Configuration, Isolation, Debugging",
        correct: "a",
    },
    {
        question: "Which of the following is an example of symmetric key encryption?",
        a: "RSA",
        b: "DES",
        c: "ECC",
        d: "Diffie-Hellman",
        correct: "b",
    },
    {
        question: "In software development, what does the acronym 'CI/CD' stand for?",
        a: "Continuous Integration/Continuous Deployment",
        b: "Code Implementation/Code Debugging",
        c: "Cloud Infrastructure/Cloud Development",
        d: "Cybersecurity Integration/Cybersecurity Defense",
        correct: "a",
    },
    {
        question: "Which of the following best describes a hash function?",
        a: "A function that encrypts data using a public key",
        b: "A one-way function that maps data to a fixed-size output",
        c: "A function that compresses files for storage",
        d: "A two-way function used for data decryption",
        correct: "b",
    }
];

const quizdata = []
class ToastManager {
    constructor() {
        this.container = document.getElementById('toastContainer');
        this.toasts = [];
    }

    show(message, type = 'info', title = '', duration = 5000) {
        const toast = this.createToast(message, type, title, duration);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Auto remove
        const autoRemoveTimer = setTimeout(() => {
            this.remove(toast);
        }, duration);

        // Store timer reference for manual removal
        toast.autoRemoveTimer = autoRemoveTimer;

        return toast;
    }

    createToast(message, type, title, duration) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: `<svg class="toast-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" style="color: #10b981;"/>
                    </svg>`,
            error: `<svg class="toast-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" style="color: #ef4444;"/>
                    </svg>`,
            warning: `<svg class="toast-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" style="color: #f59e0b;"/>
                    </svg>`,
            info: `<svg class="toast-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" style="color: #3b82f6;"/>
                    </svg>`
        };

        toast.innerHTML = `
                    ${icons[type] || icons.info}
                    <div class="toast-content">
                        ${title ? `<div class="toast-title">${title}</div>` : ''}
                        <div class="toast-message">${message}</div>
                    </div>
                    <button class="toast-close" onclick="toastManager.remove(this.parentElement)">&times;</button>
                    <div class="toast-progress" style="width: 100%; animation: shrink ${duration}ms linear;"></div>
                `;

        // Add CSS animation for progress bar
        if (!document.querySelector('#toast-progress-animation')) {
            const style = document.createElement('style');
            style.id = 'toast-progress-animation';
            style.textContent = `
                        @keyframes shrink {
                            from { width: 100%; }
                            to { width: 0%; }
                        }
                    `;
            document.head.appendChild(style);
        }

        return toast;
    }

    remove(toast) {
        if (toast.autoRemoveTimer) {
            clearTimeout(toast.autoRemoveTimer);
        }

        toast.style.animation = 'slideOutRight 0.3s ease-in-out forwards';

        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }

    success(message, title = 'Success!') {
        return this.show(message, 'success', title);
    }

    error(message, title = 'Error!') {
        return this.show(message, 'error', title);
    }

    warning(message, title = 'Warning!') {
        return this.show(message, 'warning', title);
    }

    info(message, title = 'Info') {
        return this.show(message, 'info', title);
    }
}

// Initialize toast manager
const toastManager = new ToastManager();

// Quiz Application Logic
document.addEventListener('DOMContentLoaded', () => {
    const quiz = document.getElementById("quiz");
    const answerELs = document.querySelectorAll(".answer");
    const questionEL = document.getElementById("question");

    const a_text = document.getElementById("a_text");
    const b_text = document.getElementById("b_text");
    const c_text = document.getElementById("c_text");
    const d_text = document.getElementById("d_text");

    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");
    const submitBtn = document.getElementById("submit");

    const questionCounter = document.getElementById("questionCounter");
    const matricNumberDisplay = document.getElementById("matricNumberDisplay");

    let currentQuiz = 0;
    let score = 0;
    let userAnswers = new Array(quizData.length).fill(null);

    const matricNumber = sessionStorage.getItem('matricNumber') || 'UNILORIN/CSC/001';
    matricNumberDisplay.innerText = `Matric Number: ${matricNumber}`;

    // Show welcome toast
    setTimeout(() => {
        toastManager.info(`Welcome to the quiz, ${matricNumber}!`, 'Quiz Started');
    }, 500);

    loadQuiz();

    function loadQuiz() {
        deselectAnswers();

        const currentQuizData = quizData[currentQuiz];

        questionCounter.innerText = `Question ${currentQuiz + 1} of ${quizData.length}`;

        questionEL.innerText = currentQuizData.question;
        a_text.innerText = currentQuizData.a;
        b_text.innerText = currentQuizData.b;
        c_text.innerText = currentQuizData.c;
        d_text.innerText = currentQuizData.d;

        // Restore previous answer if exists
        if (userAnswers[currentQuiz]) {
            document.getElementById(userAnswers[currentQuiz]).checked = true;
        }

        if (currentQuiz === 0) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'inline-block';
        }

        if (currentQuiz === quizData.length - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
    }

    function getSelected() {
        let answer = undefined;

        answerELs.forEach((answerEL) => {
            if (answerEL.checked) {
                answer = answerEL.id;
            }
        });

        return answer;
    }

    function deselectAnswers() {
        answerELs.forEach((answerEL) => {
            answerEL.checked = false;
        });
    }

    prevBtn.addEventListener("click", () => {
        if (currentQuiz > 0) {
            const answer = getSelected();
            if (answer) {
                userAnswers[currentQuiz] = answer;
            }
            currentQuiz--;
            loadQuiz();
        }
    });

    nextBtn.addEventListener("click", () => {
        const answer = getSelected();

        if (!answer) {
            toastManager.warning(
                'Please select an answer before proceeding to the next question.',
                'Answer Required'
            );
            return;
        }

        userAnswers[currentQuiz] = answer;
        if (answer === quizData[currentQuiz].correct) {
            score++;
        }

        currentQuiz++;
        loadQuiz();

        // Show progress toast
        toastManager.info(
            `Question ${currentQuiz} completed. ${quizData.length - currentQuiz} questions remaining.`,
            'Progress Update'
        );
    });

    submitBtn.addEventListener("click", () => {
        const answer = getSelected();

        if (!answer) {
            toastManager.error(
                'Please select an answer for the final question before submitting.',
                'Answer Required'
            );
            return;
        }

        // Check for unanswered questions
        const unansweredQuestions = [];
        for (let i = 0; i < quizData.length; i++) {
            if (!userAnswers[i] && i !== currentQuiz) {
                unansweredQuestions.push(i + 1);
            }
        }

        if (unansweredQuestions.length > 0) {
            toastManager.warning(
                `You have ${unansweredQuestions.length} unanswered question(s). Questions: ${unansweredQuestions.join(', ')}`,
                'Incomplete Quiz'
            );
            return;
        }

        userAnswers[currentQuiz] = answer;
        if (answer === quizData[currentQuiz].correct) {
            score++;
        }

        // Show completion toast
        const percentage = Math.round((score / quizData.length) * 100);
        let resultType = 'success';
        let resultTitle = 'Excellent!';
        let resultMessage = `Quiz completed! You scored ${score}/${quizData.length} (${percentage}%)`;

        if (percentage < 50) {
            resultType = 'error';
            resultTitle = 'Needs Improvement';
        } else if (percentage < 75) {
            resultType = 'warning';
            resultTitle = 'Good Job!';
        }

        toastManager.show(resultMessage, resultType, resultTitle, 8000);

        quiz.innerHTML = `
                    <div class="text-center">
                        <h2 class="text-2xl font-bold mb-4">Quiz Completed!</h2>
                        <div class="bg-gray-100 rounded-lg p-6 mb-6">
                            <p class="text-lg mb-2">Your Score: <span class="font-bold text-[#00044b]">${score}/${quizData.length}</span></p>
                            <p class="text-sm text-gray-600">Percentage: ${percentage}%</p>
                        </div>
                        <button 
                            onclick="location.reload()" 
                            class="bg-[#00044b] text-white px-6 py-3 rounded-lg hover:bg-[#000366] transition-colors">
                            Try Again
                        </button>
                    </div>
                `;

        sessionStorage.clear();

        // Redirect after a delay
        setTimeout(() => {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            window.location.href = isLocal ? '/client/index.html' : '/';
        }, 10000);
    });
});