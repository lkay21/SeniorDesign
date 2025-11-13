let conversationHistory = [];
let userProfile = {
    name: null,
    age: null,
    gender: null,
    height: null,
    weight: null
};

const questions = [
    { key: 'name', question: "What is your full name or nickname you'd like to use?" },
    { key: 'age', question: "What is your age?" },
    { key: 'gender', question: "What is your gender?" },
    { key: 'height', question: "What is your height? (in cm or ft/in)" },
    { key: 'weight', question: "What is your current weight? (in kg or lbs)" }
];

let currentQuestionIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const generatePlanBtn = document.getElementById('generate-plan-btn');

    // Check if user is logged in
    const username = sessionStorage.getItem('username');
    if (!username) {
        window.location.href = '/';
        return;
    }

    // Start conversation
    if (currentQuestionIndex < questions.length) {
        addMessage('ai', questions[currentQuestionIndex].question);
    }

    // Send message on button click
    sendBtn.addEventListener('click', handleSend);

    // Send message on Enter key
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !sendBtn.disabled) {
            handleSend();
        }
    });

    // Generate plan button
    generatePlanBtn.addEventListener('click', async function() {
        if (Object.values(userProfile).some(v => v === null)) {
            addMessage('ai', 'Please complete all the profile questions first before generating a plan.');
            return;
        }
        
        generatePlanBtn.disabled = true;
        generatePlanBtn.textContent = 'Generating...';
        
        try {
            const prompt = `Based on the following user profile, create a personalized fitness plan:\n\nName: ${userProfile.name}\nAge: ${userProfile.age}\nGender: ${userProfile.gender}\nHeight: ${userProfile.height}\nWeight: ${userProfile.weight}\n\nPlease provide a comprehensive fitness plan including workout routines, nutrition advice, and goals.`;
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: prompt })
            });

            const data = await response.json();
            
            if (response.ok) {
                addMessage('ai', data.response);
            } else {
                addMessage('ai', 'Sorry, I encountered an error. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage('ai', 'Sorry, I encountered an error. Please try again.');
        } finally {
            generatePlanBtn.disabled = false;
            generatePlanBtn.textContent = 'Generate Plan';
        }
    });

    async function handleSend() {
        const message = userInput.value.trim();
        if (!message || sendBtn.disabled) return;

        // Add user message
        addMessage('user', message);
        userInput.value = '';
        sendBtn.disabled = true;

        // Handle profile questions
        if (currentQuestionIndex < questions.length) {
            const currentQuestion = questions[currentQuestionIndex];
            userProfile[currentQuestion.key] = message;
            currentQuestionIndex++;

            // Ask next question or move to free chat
            if (currentQuestionIndex < questions.length) {
                setTimeout(() => {
                    addMessage('ai', questions[currentQuestionIndex].question);
                    sendBtn.disabled = false;
                    userInput.focus();
                }, 500);
            } else {
                setTimeout(() => {
                    addMessage('ai', 'Great! I have all your information. You can now ask me any fitness-related questions, or click "Generate Plan" to get a personalized fitness plan.');
                    sendBtn.disabled = false;
                    userInput.focus();
                }, 500);
            }
        } else {
            // Free chat mode - send to AI
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        message: message,
                        profile: userProfile
                    })
                });

                const data = await response.json();
                
                if (response.ok) {
                    addMessage('ai', data.response);
                } else {
                    const errorMsg = data.error || 'Sorry, I encountered an error. Please try again.';
                    addMessage('ai', errorMsg);
                }
            } catch (error) {
                console.error('Error:', error);
                addMessage('ai', 'Network error. Please check your connection and try again.');
            } finally {
                sendBtn.disabled = false;
                userInput.focus();
            }
        }
    }

    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

