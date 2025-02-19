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
        });
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
        alert('질문 등록 중 오류가 발생했습니다.');
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

// 페이지 로드 시 질문 목록 불러오기
loadQuestions();
