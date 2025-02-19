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
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// DOM elements
const whenSignedIn = document.getElementById('whenSignedIn');
const whenSignedOut = document.getElementById('whenSignedOut');
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userDetails = document.getElementById('userDetails');
const questionForm = document.getElementById('questionForm');

// Sign in/out handlers
signInBtn.onclick = () => auth.signInWithPopup(provider);
signOutBtn.onclick = () => auth.signOut();

// Auth state observer
auth.onAuthStateChanged(user => {
    if (user) {
        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;
        questionForm.hidden = false;
        userDetails.innerHTML = `
            <img src="${user.photoURL}" alt="프로필 사진">
            <span>${user.displayName}</span>
        `;
    } else {
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false;
        questionForm.hidden = true;
        userDetails.innerHTML = '';
    }
});

// 질문 목록을 실시간으로 가져오기
function loadQuestions() {
    db.collection('questions')
        .orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
            questions = [];
            snapshot.forEach((doc) => {
                questions.push({ 
                    id: doc.id, 
                    ...doc.data(),
                    userId: doc.data().userId,
                    userDisplayName: doc.data().userDisplayName
                });
            });
            updateQuestionsList();
        });
}

// 질문 추가 함수 수정
async function addQuestion() {
    if (!auth.currentUser) {
        alert('질문을 작성하려면 로그인이 필요합니다.');
        return;
    }

    const title = document.getElementById('questionTitle').value;
    const content = document.getElementById('questionContent').value;
    
    if (!title || !content) {
        alert('제목과 내용을 모두 입력해주세요!');
        return;
    }

    try {
        await db.collection('questions').add({
            title: title,
            content: content,
            answers: [],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userId: auth.currentUser.uid,
            userDisplayName: auth.currentUser.displayName
        });
        clearForm();
    } catch (error) {
        console.error("Error adding question: ", error);
        alert('질문 등록 중 오류가 발생했습니다.');
    }
}

// 답변 추가 함수 수정
async function addAnswer(questionId) {
    if (!auth.currentUser) {
        alert('답변을 작성하려면 로그인이 필요합니다.');
        return;
    }

    const answerContent = document.getElementById(`answer-${questionId}`).value;
    
    if (!answerContent) {
        alert('답변 내용을 입력해주세요!');
        return;
    }

    try {
        const questionRef = db.collection('questions').doc(questionId);
        await questionRef.update({
            answers: firebase.firestore.FieldValue.arrayUnion({
                content: answerContent,
                timestamp: new Date().toLocaleString(),
                userId: auth.currentUser.uid,
                userDisplayName: auth.currentUser.displayName
            })
        });
        document.getElementById(`answer-${questionId}`).value = '';
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
            <small>작성자: ${question.userDisplayName} | 작성시간: ${timestamp}</small>
            
            <div class="answers">
                <h4>답변 목록:</h4>
                ${question.answers.map(answer => `
                    <div class="answer">
                        <p>${answer.content}</p>
                        <small>작성자: ${answer.userDisplayName} | 작성시간: ${answer.timestamp}</small>
                    </div>
                `).join('')}
            </div>
            
            ${auth.currentUser ? `
                <div class="answer-form">
                    <textarea id="answer-${question.id}" placeholder="답변을 입력하세요"></textarea>
                    <button onclick="addAnswer('${question.id}')">답변 등록</button>
                </div>
            ` : `
                <div class="login-required-message">
                    답변을 작성하려면 로그인이 필요합니다.
                </div>
            `}
        `;
        
        questionsList.appendChild(questionCard);
    });
}

function clearForm() {
    document.getElementById('questionTitle').value = '';
    document.getElementById('questionContent').value = '';
}

// 페이지 로드 시 질문 목록 불러오기
loadQuestions();
