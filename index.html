let questions = [];

// Firebase 초기화
const firebaseConfig = {
    apiKey: "AIzaSyBlKjMG0JXrMmJ8cUn3HSMSkzCTl8N1koE",
    authDomain: "cursor-f571e.firebaseapp.com",
    projectId: "cursor-f571e",
    storageBucket: "cursor-f571e.firebasestorage.app",
    messagingSenderId: "806241464094",
    appId: "1:806241464094:web:d4c9d2b97cf3558547a30f",
    measurementId: "G-E0WVBRLL0F"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 질문 목록을 실시간으로 가져오기
function loadQuestions() {
    try {
        db.collection('questions')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                questions = [];
                snapshot.forEach((doc) => {
                    questions.push({ 
                        id: doc.id, 
                        ...doc.data()
                    });
                });
                updateQuestionsList();
            }, (error) => {
                console.error("Error loading questions: ", error);
                alert('질문 목록을 불러오는 중 오류가 발생했습니다.');
            });
    } catch (error) {
        console.error("Error setting up listener: ", error);
        alert('데이터베이스 연결 중 오류가 발생했습니다.');
    }
}

// 질문 추가 함수
async function addQuestion() {
    const title = document.getElementById('questionTitle').value;
    const content = document.getElementById('questionContent').value;
    const authorName = document.getElementById('authorName').value;
    
    if (!title || !content || !authorName) {
        alert('제목, 내용, 작성자 이름을 모두 입력해주세요!');
        return;
    }

    try {
        await db.collection('questions').add({
            title: title,
            content: content,
            authorName: authorName,
            answers: [],
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        clearForm();
    } catch (error) {
        console.error("Error adding question: ", error);
        alert('질문 등록 중 오류가 발생했습니다: ' + error.message);
    }
}

// 답변 추가 함수
async function addAnswer(questionId) {
    const answerContent = document.getElementById(`answer-${questionId}`).value;
    const authorName = document.getElementById(`answer-author-${questionId}`).value;
    
    if (!answerContent || !authorName) {
        alert('답변 내용과 작성자 이름을 입력해주세요!');
        return;
    }

    try {
        const questionRef = db.collection('questions').doc(questionId);
        await questionRef.update({
            answers: firebase.firestore.FieldValue.arrayUnion({
                content: answerContent,
                authorName: authorName,
                timestamp: new Date().toLocaleString()
            })
        });
        document.getElementById(`answer-${questionId}`).value = '';
        document.getElementById(`answer-author-${questionId}`).value = '';
    } catch (error) {
        console.error("Error adding answer: ", error);
        alert('답변 등록 중 오류가 발생했습니다.');
    }
}

function updateQuestionsList() {
    const questionsList = document.getElementById('questionsList');
    questionsList.innerHTML = '';

    questions.forEach(question => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        
        const timestamp = question.timestamp ? 
            new Date(question.timestamp.toDate()).toLocaleString() : 
            '시간 정보 없음';
        
        questionCard.innerHTML = `
            <h3>${question.title}</h3>
            <p>${question.content}</p>
            <small>작성자: ${question.authorName} | 작성시간: ${timestamp}</small>
            
            <div class="answers">
                <h4>답변 목록:</h4>
                ${question.answers.map(answer => `
                    <div class="answer">
                        <p>${answer.content}</p>
                        <small>작성자: ${answer.authorName} | 작성시간: ${answer.timestamp}</small>
                    </div>
                `).join('')}
            </div>
            
            <div class="answer-form">
                <input type="text" id="answer-author-${question.id}" placeholder="작성자 이름">
                <textarea id="answer-${question.id}" placeholder="답변을 입력하세요"></textarea>
                <button onclick="addAnswer('${question.id}')">답변 등록</button>
            </div>
        `;
        
        questionsList.appendChild(questionCard);
    });
}

function clearForm() {
    document.getElementById('questionTitle').value = '';
    document.getElementById('questionContent').value = '';
    document.getElementById('authorName').value = '';
}

// 채팅 메시지 로드
function loadMessages() {
    try {
        db.collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .onSnapshot((snapshot) => {
                const messages = [];
                snapshot.forEach((doc) => {
                    messages.push(doc.data());
                });
                updateChatMessages(messages.reverse());
            }, (error) => {
                console.error("Error loading messages: ", error);
            });
    } catch (error) {
        console.error("Error setting up chat listener: ", error);
    }
}

// 닉네임 관련 함수 추가
function getSavedNickname() {
    return localStorage.getItem('chatNickname');
}

function saveNickname(nickname) {
    localStorage.setItem('chatNickname', nickname);
}

// 채팅 메시지 전송 함수 수정
async function sendMessage() {
    const messageInput = document.getElementById('chatMessage');
    const message = messageInput.value.trim();
    let author = getSavedNickname();

    if (!author) {
        author = prompt('닉네임을 입력해주세요:');
        if (!author) return;
        author = author.trim();
        if (author) {
            saveNickname(author);
            updateNicknameDisplay();
        } else {
            alert('닉네임을 입력해주세요!');
            return;
        }
    }

    if (!message) {
        alert('메시지를 입력해주세요!');
        return;
    }

    try {
        await db.collection('messages').add({
            content: message,
            author: author,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        messageInput.value = '';
    } catch (error) {
        console.error("Error sending message: ", error);
        alert('메시지 전송 중 오류가 발생했습니다.');
    }
}

// 채팅 메시지 업데이트
function updateChatMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = messages.map(message => {
        const timestamp = message.timestamp ? 
            new Date(message.timestamp.toDate()).toLocaleString() : 
            '시간 정보 없음';
        
        return `
            <div class="message">
                <span class="author">${message.author}</span>
                <span class="content">${message.content}</span>
                <span class="time">${timestamp}</span>
            </div>
        `;
    }).join('');
    
    // 스크롤을 항상 최신 메시지로 이동
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Enter 키로 메시지 전송
document.getElementById('chatMessage')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// 닉네임 표시 업데이트 함수
function updateNicknameDisplay() {
    const nickname = getSavedNickname();
    const chatAuthorDisplay = document.getElementById('chatAuthorDisplay');
    const chatInput = document.querySelector('.chat-input');
    
    if (nickname) {
        chatAuthorDisplay.textContent = nickname;
        chatInput.classList.add('nickname-set');
    } else {
        chatAuthorDisplay.textContent = '닉네임을 설정해주세요';
        chatInput.classList.remove('nickname-set');
    }
}

// 닉네임 변경 함수
function changeNickname() {
    const newNickname = prompt('새로운 닉네임을 입력해주세요:', getSavedNickname());
    if (newNickname) {
        saveNickname(newNickname.trim());
        updateNicknameDisplay();
    }
}

// 페이지 로드 시 채팅 메시지와 질문 목록 불러오기
loadMessages();
loadQuestions();
updateNicknameDisplay();  // 닉네임 표시 업데이트
