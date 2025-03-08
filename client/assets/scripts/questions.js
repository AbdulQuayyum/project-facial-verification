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

    // Retrieve matric number from sessionStorage and format it
    const matricNumber = sessionStorage.getItem('matricNumber');
    if (matricNumber) {
        const formattedMatricNumber = matricNumber.slice(0, 2) + "/" + matricNumber.slice(2);
        matricNumberDisplay.innerText = `Matric Number: ${formattedMatricNumber}`;
    }

    // Load the quiz
    loadQuiz();

    function loadQuiz() {
        deselectAnswers();

        const currentQuizData = quizData[currentQuiz];

        // Update question counter
        questionCounter.innerText = `Question ${currentQuiz + 1} of ${quizData.length}`;

        // Update question and answers
        questionEL.innerText = currentQuizData.question;
        a_text.innerText = currentQuizData.a;
        b_text.innerText = currentQuizData.b;
        c_text.innerText = currentQuizData.c;
        d_text.innerText = currentQuizData.d;

        // Show/hide navigation buttons
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

    // Previous button event listener
    prevBtn.addEventListener("click", () => {
        if (currentQuiz > 0) {
            currentQuiz--;
            loadQuiz();
        }
    });

    // Next button event listener
    nextBtn.addEventListener("click", () => {
        const answer = getSelected();

     
            if (answer === quizData[currentQuiz].correct) {
                score++;
            }
            currentQuiz++;
            loadQuiz();
    });

    // Submit button event listener
    submitBtn.addEventListener("click", () => {
        const answer = getSelected();

        if (answer) {
            if (answer === quizData[currentQuiz].correct) {
                score++;
            }
            quiz.innerHTML = `<h2>You've answered ${score}/${quizData.length} questions correctly.</h2> 
            <button onclick="location.reload()">Reload</button>`;
        } else {
            alert("Please select an answer before submitting.");
        }
    });
});