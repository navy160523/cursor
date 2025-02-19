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

// 폰트 관련 함수 추가
function getSavedFont() {
    return localStorage.getItem('chatFont') || "'Noto Sans KR', sans-serif";
}

function saveFont(font) {
    localStorage.setItem('chatFont', font);
}

// 폰트 선택 이벤트 리스너 추가
document.getElementById('fontSelect')?.addEventListener('change', function(e) {
    saveFont(e.target.value);
});

// 글자 크기 관련 함수 추가
function getSavedFontSize() {
    return localStorage.getItem('chatFontSize') || '10px';
}

function saveFontSize(size) {
    localStorage.setItem('chatFontSize', size);
}

// 글자 크기 선택 이벤트 리스너 추가
document.getElementById('fontSize')?.addEventListener('change', function(e) {
    saveFontSize(e.target.value);
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
            font: getSavedFont(),
            fontSize: getSavedFontSize(),  // 글자 크기 추가
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
    const currentUser = getSavedNickname();
    
    chatMessages.innerHTML = messages.map(message => {
        const timestamp = message.timestamp ? 
            new Date(message.timestamp.toDate()).toLocaleString() : 
            '시간 정보 없음';
        
        const isMyMessage = message.author === currentUser;
        
        return `
            <div class="message ${isMyMessage ? 'my-message' : 'other-message'}">
                <span class="author" style="color: ${message.color || '#007bff'}; font-size: ${currentViewSize}px">${message.author}</span>
                <span class="content" style="font-family: ${message.font || "'Noto Sans KR', sans-serif"}; font-size: ${currentViewSize}px">${message.content}</span>
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

// 보기 크기 조절 관련 변수와 함수
let currentViewSize = 10;
const MIN_SIZE = 2;
const MAX_SIZE = 50;

function updateViewSize() {
    document.getElementById('currentViewSize').textContent = currentViewSize;
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => {
        // 내용과 작성자 모두 크기 조절
        message.querySelector('.content').style.fontSize = `${currentViewSize}px`;
        message.querySelector('.author').style.fontSize = `${currentViewSize}px`;
    });
}

function increaseViewSize() {
    if (currentViewSize < MAX_SIZE) {
        currentViewSize += 2;
        updateViewSize();
    }
}

function decreaseViewSize() {
    if (currentViewSize > MIN_SIZE) {
        currentViewSize -= 2;
        updateViewSize();
    }
}

// 채팅창 크기 조절 관련 변수 수정
let currentWindowSize = 85;
const MIN_WINDOW_SIZE = 50;
const MAX_WINDOW_SIZE = 95;

function updateWindowSize() {
    document.getElementById('currentWindowSize').textContent = currentWindowSize;
    const chatBox = document.querySelector('.chat-box');
    chatBox.style.height = `calc(${currentWindowSize}vh - 40px)`;
}

function increaseWindowSize() {
    if (currentWindowSize < MAX_WINDOW_SIZE) {
        currentWindowSize += 5;
        updateWindowSize();
    }
}

function decreaseWindowSize() {
    if (currentWindowSize > MIN_WINDOW_SIZE) {
        currentWindowSize -= 5;
        updateWindowSize();
    }
}

// 채팅창 너비 조절 관련 변수와 함수
let currentWidthSize = 100;
const MIN_WIDTH_SIZE = 50;
const MAX_WIDTH_SIZE = 100;

function updateWidthSize() {
    document.getElementById('currentWidthSize').textContent = currentWidthSize;
    const container = document.querySelector('.container');
    container.style.maxWidth = `${currentWidthSize}%`;
}

function increaseWidthSize() {
    if (currentWidthSize < MAX_WIDTH_SIZE) {
        currentWidthSize += 5;
        updateWidthSize();
    }
}

function decreaseWidthSize() {
    if (currentWidthSize > MIN_WIDTH_SIZE) {
        currentWidthSize -= 5;
        updateWidthSize();
    }
}

// 페이지 로드 시 초기 크기 설정
document.addEventListener('DOMContentLoaded', function() {
    updateWindowSize();
    updateWidthSize();
});

// 페이지 로드 시 실행되는 코드 수정
loadMessages();
updateNicknameDisplay();

// 드래그 기능
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

const chatBox = document.querySelector('.chat-box');
const chatHeader = document.querySelector('.chat-header');

// 초기 위치 및 크기 설정
document.addEventListener('DOMContentLoaded', () => {
    const rect = chatBox.getBoundingClientRect();
    
    // 초기 위치 설정 (화면 중앙)
    xOffset = (window.innerWidth - rect.width) / 2;
    yOffset = (window.innerHeight - rect.height) / 3;
    
    // 초기 크기 설정
    chatBox.style.width = '800px';
    chatBox.style.height = '600px';
    
    setTranslate(xOffset, yOffset, chatBox);
});

// 이벤트 리스너 추가
chatBox.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

function dragStart(e) {
    // input, button, select 요소에서는 드래그 시작하지 않음
    if (e.target.tagName.toLowerCase() === 'input' || 
        e.target.tagName.toLowerCase() === 'button' || 
        e.target.tagName.toLowerCase() === 'select') {
        return;
    }
    
    // 왼쪽 마우스 버튼일 때만 드래그 시작
    if (e.button === 0) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        isDragging = true;
        chatBox.style.transition = 'none';
        chatBox.style.cursor = 'grabbing';
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        // 화면 경계 체크 (여유 공간 추가)
        const chatBoxRect = chatBox.getBoundingClientRect();
        const maxX = window.innerWidth - chatBoxRect.width / 3;
        const maxY = window.innerHeight - chatBoxRect.height / 3;
        const minX = -chatBoxRect.width * 2/3;
        const minY = -chatBoxRect.height * 2/3;

        // 제한된 범위 내에서 이동
        currentX = Math.max(minX, Math.min(currentX, maxX));
        currentY = Math.max(minY, Math.min(currentY, maxY));

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, chatBox);
    }
}

function dragEnd() {
    if (isDragging) {
        isDragging = false;
        chatBox.style.transition = 'transform 0.2s ease-out';
        chatBox.style.cursor = '';  // 커서 스타일 초기화
        
        // 화면 밖으로 너무 많이 나가지 않도록 조정
        const chatBoxRect = chatBox.getBoundingClientRect();
        const minVisible = 100;

        if (chatBoxRect.right < minVisible) {
            xOffset = minVisible - chatBoxRect.width;
        }
        if (chatBoxRect.bottom < minVisible) {
            yOffset = minVisible - chatBoxRect.height;
        }
        if (chatBoxRect.left > window.innerWidth - minVisible) {
            xOffset = window.innerWidth - minVisible;
        }
        if (chatBoxRect.top > window.innerHeight - minVisible) {
            yOffset = window.innerHeight - minVisible;
        }

        setTranslate(xOffset, yOffset, chatBox);
    }
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
}

// 창 크기가 변경될 때 위치 조정
window.addEventListener('resize', () => {
    const chatBoxRect = chatBox.getBoundingClientRect();
    const minVisible = 100;

    if (chatBoxRect.right < minVisible) {
        xOffset = minVisible - chatBoxRect.width;
    }
    if (chatBoxRect.left > window.innerWidth - minVisible) {
        xOffset = window.innerWidth - minVisible;
    }
    if (chatBoxRect.bottom < minVisible) {
        yOffset = minVisible - chatBoxRect.height;
    }
    if (chatBoxRect.top > window.innerHeight - minVisible) {
        yOffset = window.innerHeight - minVisible;
    }

    setTranslate(xOffset, yOffset, chatBox);
});

