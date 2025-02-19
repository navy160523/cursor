let questions = [];
let autoDeleteInterval; // 인터벌 ID를 저장할 변수

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

// 질문 삭제 함수 추가
async function deleteQuestion(questionId) {
    if (!confirm('이 질문을 삭제하시겠습니까?\n답변도 함께 삭제됩니다.')) {
        return;
    }

    try {
        await db.collection('questions').doc(questionId).delete();
        console.log('질문이 삭제되었습니다.');
    } catch (error) {
        console.error("Error deleting question: ", error);
        alert('질문 삭제 중 오류가 발생했습니다.');
    }
}

// updateQuestionsList 함수 수정
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
            <div class="question-header">
                <h3>${question.title}</h3>
                <button onclick="deleteQuestion('${question.id}')" class="delete-button">삭제</button>
            </div>
            <p>${question.content}</p>
            <div class="metadata">
                <span>작성자: ${question.authorName}</span>
                <span>작성시간: ${timestamp}</span>
            </div>
            
            <div class="answers">
                <h4>답변 목록</h4>
                ${question.answers.map(answer => `
                    <div class="answer">
                        <p>${answer.content}</p>
                        <div class="metadata">
                            <span>작성자: ${answer.authorName}</span>
                            <span>작성시간: ${answer.timestamp}</span>
                        </div>
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

// 닉네임 색상 관련 함수 추가
function getSavedNicknameColor() {
    return localStorage.getItem('chatNicknameColor') || '#007bff';
}

function saveNicknameColor(color) {
    localStorage.setItem('chatNicknameColor', color);
}

// 색상 선택 이벤트 리스너
document.getElementById('nicknameColor')?.addEventListener('change', function(e) {
    saveNicknameColor(e.target.value);
    updateNicknameDisplay();
});

// 채팅 메시지 전송 함수 수정
async function sendMessage() {
    const messageInput = document.getElementById('chatMessage');
    const message = messageInput.value.trim();
    let author = getSavedNickname();
    const color = getSavedNicknameColor();

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
            color: color,
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
                <span class="author" style="color: ${message.color || '#007bff'}">${message.author}</span>
                <span class="content">${message.content}</span>
                <span class="time">${timestamp}</span>
            </div>
        `;
    }).join('');
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Enter 키로 메시지 전송
document.getElementById('chatMessage')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// 닉네임 표시 업데이트 함수 수정
function updateNicknameDisplay() {
    const nickname = getSavedNickname();
    const color = getSavedNicknameColor();
    const chatAuthorDisplay = document.getElementById('chatAuthorDisplay');
    const colorPicker = document.getElementById('nicknameColor');
    const chatInput = document.querySelector('.chat-input');
    
    if (nickname) {
        chatAuthorDisplay.textContent = nickname;
        chatAuthorDisplay.style.color = color;
        colorPicker.value = color;
        chatInput.classList.add('nickname-set');
    } else {
        chatAuthorDisplay.textContent = '닉네임을 설정해주세요';
        chatAuthorDisplay.style.color = '#666';
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

// 전체 메시지 삭제 함수
async function clearAllMessages() {
    if (!confirm('모든 채팅 내용을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        return;
    }

    try {
        const messagesRef = db.collection('messages');
        const snapshot = await messagesRef.get();
        
        // 배치 작업으로 메시지 삭제
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(messagesRef.doc(doc.id));
        });
        
        await batch.commit();
        alert('모든 메시지가 삭제되었습니다.');
    } catch (error) {
        console.error("Error clearing messages: ", error);
        alert('메시지 삭제 중 오류가 발생했습니다.');
    }
}

// 300초마다 메시지 자동 삭제 함수
async function autoDeleteMessages() {
    try {
        const messagesRef = db.collection('messages');
        const snapshot = await messagesRef.get();
        
        // 배치 작업으로 메시지 삭제
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(messagesRef.doc(doc.id));
        });
        
        await batch.commit();
        console.log('메시지가 자동으로 삭제되었습니다.');
        
        // 채팅창 새로고침
        loadMessages();
        
        // 삭제 시간 표시
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="system-message">
                채팅이 초기화되었습니다. (${new Date().toLocaleTimeString()})
            </div>
        `;
    } catch (error) {
        console.error("Error auto-clearing messages: ", error);
    }
}

// 자동 삭제 시작 함수
function startAutoDelete() {
    if (autoDeleteInterval) {
        clearInterval(autoDeleteInterval);
    }
    autoDeleteInterval = setInterval(autoDeleteMessages, 300000); // 5분
    console.log('자동 삭제 시작');
}

// 자동 삭제 중지 함수
function stopAutoDelete() {
    if (autoDeleteInterval) {
        clearInterval(autoDeleteInterval);
        autoDeleteInterval = null;
        console.log('자동 삭제 중지');
    }
}

// 체크박스 이벤트 리스너
document.getElementById('autoClearEnabled')?.addEventListener('change', function(e) {
    if (e.target.checked) {
        startAutoDelete();
    } else {
        stopAutoDelete();
    }
});

// 페이지 로드 시 자동 삭제 시작 (체크박스 상태에 따라)
document.addEventListener('DOMContentLoaded', function() {
    const autoClearEnabled = document.getElementById('autoClearEnabled');
    // 기본값으로 체크 해제
    if (autoClearEnabled) {
        autoClearEnabled.checked = false;
    }
    // 자동 삭제는 시작하지 않음 (체크되어 있을 때만 시작)
});

// 페이지 로드 시 채팅 메시지와 질문 목록 불러오기
loadMessages();
loadQuestions();
updateNicknameDisplay();  // 닉네임 표시 업데이트

// Q&A 섹션 토글 기능
document.getElementById('toggleQnAButton')?.addEventListener('click', function() {
    const qnaSection = document.getElementById('qnaSection');
    if (qnaSection.style.display === 'none') {
        qnaSection.style.display = 'block';
        this.textContent = 'Q&A 숨기기';
    } else {
        qnaSection.style.display = 'none';
        this.textContent = 'Q&A 보기';
    }
});
