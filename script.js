let questions = [];

function addQuestion() {
    const title = document.getElementById('questionTitle').value;
    const content = document.getElementById('questionContent').value;
    
    if (!title || !content) {
        alert('제목과 내용을 모두 입력해주세요!');
        return;
    }

    const question = {
        id: Date.now(),
        title: title,
        content: content,
        answers: [],
        timestamp: new Date().toLocaleString()
    };

    questions.push(question);
    updateQuestionsList();
    clearForm();
}

function addAnswer(questionId) {
    const answerContent = document.getElementById(`answer-${questionId}`).value;
    
    if (!answerContent) {
        alert('답변 내용을 입력해주세요!');
        return;
    }

    const question = questions.find(q => q.id === questionId);
    if (question) {
        question.answers.push({
            content: answerContent,
            timestamp: new Date().toLocaleString()
        });
        updateQuestionsList();
    }
}

function updateQuestionsList() {
    const questionsList = document.getElementById('questionsList');
    questionsList.innerHTML = '';

    questions.forEach(question => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        
        questionCard.innerHTML = `
            <h3>${question.title}</h3>
            <p>${question.content}</p>
            <small>작성시간: ${question.timestamp}</small>
            
            <div class="answers">
                <h4>답변 목록:</h4>
                ${question.answers.map(answer => `
                    <div class="answer">
                        <p>${answer.content}</p>
                        <small>작성시간: ${answer.timestamp}</small>
                    </div>
                `).join('')}
            </div>
            
            <div class="answer-form">
                <textarea id="answer-${question.id}" placeholder="답변을 입력하세요"></textarea>
                <button onclick="addAnswer(${question.id})">답변 등록</button>
            </div>
        `;
        
        questionsList.appendChild(questionCard);
    });
}

function clearForm() {
    document.getElementById('questionTitle').value = '';
    document.getElementById('questionContent').value = '';
}

// 페이지 로드 시 질문 목록 업데이트
updateQuestionsList();
