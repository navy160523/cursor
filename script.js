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

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM 요소들
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// 채팅 데이터
let messages = [];
let currentUser = '나';
let unsubscribe = null;
let isFirstMessage = true; // 첫 메시지 여부 확인
let loadedMessageIds = new Set(); // 이미 로드된 메시지 ID 추적
let isInitialLoadComplete = false; // 초기 로드 완료 여부
let originalTitle = ''; // 원래 탭 제목 저장
let unreadCount = 0; // 읽지 않은 메시지 수
let isTabActive = true; // 탭이 활성 상태인지 확인
let titleBlinkInterval = null; // 탭 제목 깜빡임 인터벌

// 페이지 가시성 변경 감지
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        isTabActive = false;
    } else {
        isTabActive = true;
        // 탭이 활성화되면 깜빡임 중지 및 원래 제목으로 복원
        stopTitleBlink();
        unreadCount = 0;
    }
});

// 탭 제목 깜빡임 시작
function startTitleBlink() {
    if (titleBlinkInterval) return; // 이미 깜빡이고 있으면 중복 시작 방지
    
    let isBlinking = false;
    titleBlinkInterval = setInterval(() => {
        if (!isTabActive) { // 탭이 비활성 상태일 때만 깜빡임
            if (isBlinking) {
                document.title = originalTitle;
            } else {
                document.title = `[${unreadCount}개 새 메시지] 카카오톡 채팅`;
            }
            isBlinking = !isBlinking;
        }
    }, 1000); // 1초마다 깜빡임
}

// 탭 제목 깜빡임 중지
function stopTitleBlink() {
    if (titleBlinkInterval) {
        clearInterval(titleBlinkInterval);
        titleBlinkInterval = null;
        document.title = originalTitle;
    }
}

// 원래 탭 제목 저장
function saveOriginalTitle() {
    originalTitle = document.title || '카카오톡 채팅';
}

// 사용자 닉네임 설정
function setUserNickname() {
    const savedNickname = localStorage.getItem('chatNickname');
    if (savedNickname) {
        currentUser = savedNickname;
    } else {
        const nickname = prompt('채팅에서 사용할 닉네임을 입력해주세요:', '사용자');
        if (nickname && nickname.trim()) {
            currentUser = nickname.trim();
            localStorage.setItem('chatNickname', currentUser);
        } else {
            currentUser = '사용자' + Math.floor(Math.random() * 1000);
            localStorage.setItem('chatNickname', currentUser);
        }
    }
}

// 실시간 메시지 리스너 설정
function setupRealtimeListener() {
    unsubscribe = db.collection('chatMessages')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const messageData = change.doc.data();
                    const messageId = change.doc.id;
                    
                    // 이미 로드된 메시지가 아니고, 초기 로드가 완료된 후에만 추가
                    if (!loadedMessageIds.has(messageId) && isInitialLoadComplete) {
                        loadedMessageIds.add(messageId);
                        addMessageToUI(messageData.text, messageData.author, messageData.timestamp, messageData.author === currentUser, messageId);
                        
                        // 누군가 메시지를 보냈을 때 웰컴 메시지 제거
                        if (isFirstMessage) {
                            removeWelcomeMessages();
                        }
                        
                        // 내가 보낸 메시지가 아닌 경우 읽지 않은 메시지로 카운트
                        if (messageData.author !== currentUser && !isTabActive) {
                            unreadCount++;
                            startTitleBlink();
                        }
                    }
                } else if (change.type === 'modified') {
                    // 메시지가 수정된 경우 (닉네임 변경 등)
                    const messageData = change.doc.data();
                    const messageId = change.doc.id;
                    
                    // UI에서 해당 메시지의 닉네임 업데이트
                    updateMessageNickname(messageId, messageData.author);
                    
                } else if (change.type === 'removed') {
                    // 메시지가 삭제된 경우
                    const messageId = change.doc.id;
                    loadedMessageIds.delete(messageId);
                    
                    // UI에서 해당 메시지 제거
                    const messageElement = chatMessages.querySelector(`[data-message-id="${messageId}"]`);
                    if (messageElement) {
                        messageElement.remove();
                    }
                }
            });
        }, (error) => {
            // 에러 발생 시 조용히 처리
            showErrorMessage('연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
        });
}

// 특정 메시지의 닉네임 업데이트 함수
function updateMessageNickname(messageId, newAuthor) {
    const messageElement = chatMessages.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        const authorElement = messageElement.querySelector('.message-author');
        
        // 닉네임만 업데이트하고 메시지 정렬은 변경하지 않음
        if (authorElement) {
            authorElement.textContent = newAuthor;
        }
        
        // 메시지 정렬은 원래 상태로 유지 (닉네임 변경으로 인한 정렬 변경 방지)
        // 내가 보낸 메시지인지 확인하여 UI 클래스 업데이트하지 않음
        
        // 받은 메시지에만 닉네임 표시 (원래 메시지 타입 유지)
        const isReceivedMessage = messageElement.classList.contains('received');
        if (isReceivedMessage && newAuthor !== '시스템') {
            if (!authorElement) {
                const newAuthorElement = document.createElement('div');
                newAuthorElement.className = 'message-author';
                newAuthorElement.textContent = newAuthor;
                newAuthorElement.style.cssText = `
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 4px;
                    font-weight: 500;
                `;
                
                const messageContent = messageElement.querySelector('.message-content');
                if (messageContent) {
                    messageContent.insertBefore(newAuthorElement, messageContent.firstChild);
                }
            }
        }
    }
}

// 에러 메시지 표시 (사용자 친화적)
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        background: #ff6b6b;
        color: white;
        padding: 10px;
        margin: 10px;
        border-radius: 8px;
        text-align: center;
        font-size: 14px;
    `;
    
    chatMessages.appendChild(errorDiv);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 3000);
}

// 성공 메시지 표시
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        background: #51cf66;
        color: white;
        padding: 10px;
        margin: 10px;
        border-radius: 8px;
        text-align: center;
        font-size: 14px;
    `;
    
    chatMessages.appendChild(successDiv);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

// 웰컴 메시지 제거 함수
function removeWelcomeMessages() {
    if (isFirstMessage) {
        const welcomeMessages = chatMessages.querySelectorAll('.message');
        welcomeMessages.forEach(message => {
            const messageText = message.querySelector('.message-content div:first-child').textContent;
            if (messageText.includes('환영합니다') || messageText.includes('새로운 대화를 시작해보세요')) {
                message.remove();
            }
        });
        isFirstMessage = false;
    }
}

// 메뉴 표시 함수
function showMenu() {
    // 기존 메뉴가 있다면 제거
    const existingMenu = document.querySelector('.menu-overlay');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    const menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    menuOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    const menuContent = document.createElement('div');
    menuContent.className = 'menu-content';
    menuContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        min-width: 250px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
    `;

    const menuTitle = document.createElement('h3');
    menuTitle.textContent = '메뉴';
    menuTitle.style.cssText = `
        margin: 0 0 20px 0;
        color: #333;
        font-size: 18px;
        text-align: center;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    `;

    const nicknameButton = document.createElement('button');
    nicknameButton.textContent = '👤 닉네임 변경';
    nicknameButton.style.cssText = `
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        border: none;
        border-radius: 8px;
        background: #4ecdc4;
        color: white;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.2s;
    `;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '🗑️ 대화 삭제';
    deleteButton.style.cssText = `
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        border: none;
        border-radius: 8px;
        background: #ff6b6b;
        color: white;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.2s;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = '❌ 취소';
    cancelButton.style.cssText = `
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        border: none;
        border-radius: 8px;
        background: #6c757d;
        color: white;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.2s;
    `;

    // 호버 효과
    nicknameButton.addEventListener('mouseenter', () => {
        nicknameButton.style.background = '#45b7aa';
    });
    nicknameButton.addEventListener('mouseleave', () => {
        nicknameButton.style.background = '#4ecdc4';
    });

    deleteButton.addEventListener('mouseenter', () => {
        deleteButton.style.background = '#ff5252';
    });
    deleteButton.addEventListener('mouseleave', () => {
        deleteButton.style.background = '#ff6b6b';
    });

    cancelButton.addEventListener('mouseenter', () => {
        cancelButton.style.background = '#5a6268';
    });
    cancelButton.addEventListener('mouseleave', () => {
        cancelButton.style.background = '#6c757d';
    });

    // 이벤트 리스너
    nicknameButton.addEventListener('click', () => {
        changeNickname();
        menuOverlay.remove();
    });

    deleteButton.addEventListener('click', () => {
        deleteAllChats();
        menuOverlay.remove();
    });

    cancelButton.addEventListener('click', () => {
        menuOverlay.remove();
    });

    // 메뉴 외부 클릭 시 닫기
    menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay) {
            menuOverlay.remove();
        }
    });

    // 메뉴 구성
    menuContent.appendChild(menuTitle);
    menuContent.appendChild(nicknameButton);
    menuContent.appendChild(deleteButton);
    menuContent.appendChild(cancelButton);
    menuOverlay.appendChild(menuContent);

    // 애니메이션 CSS 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(menuOverlay);
}

// 닉네임 변경 함수
async function changeNickname() {
    const currentNickname = currentUser;
    const newNickname = prompt(`현재 닉네임: ${currentNickname}\n새로운 닉네임을 입력해주세요:`, currentNickname);
    
    if (newNickname && newNickname.trim() && newNickname.trim() !== currentNickname) {
        const trimmedNickname = newNickname.trim();
        
        // 닉네임 길이 제한 (1-20자)
        if (trimmedNickname.length < 1 || trimmedNickname.length > 20) {
            alert('닉네임은 1자 이상 20자 이하여야 합니다.');
            return;
        }
        
        // 특수문자 제한 (한글, 영문, 숫자만 허용)
        const nicknameRegex = /^[가-힣a-zA-Z0-9]+$/;
        if (!nicknameRegex.test(trimmedNickname)) {
            alert('닉네임은 한글, 영문, 숫자만 사용 가능합니다.');
            return;
        }
        
        try {
            // 로딩 메시지 표시
            showSuccessMessage('닉네임을 변경하는 중...');
            
            // Firestore에서 현재 사용자의 모든 메시지 찾기
            const snapshot = await db.collection('chatMessages')
                .where('author', '==', currentNickname)
                .get();
            
            if (!snapshot.empty) {
                // 배치 작업으로 모든 메시지 업데이트
                const batch = db.batch();
                
                snapshot.docs.forEach((doc) => {
                    batch.update(doc.ref, { author: trimmedNickname });
                });
                
                await batch.commit();
                
                // 성공 메시지 표시
                showSuccessMessage(`닉네임이 "${trimmedNickname}"으로 변경되었습니다!\n이전 대화도 함께 업데이트되었습니다.`);
            } else {
                // 메시지가 없는 경우
                showSuccessMessage(`닉네임이 "${trimmedNickname}"으로 변경되었습니다!`);
            }
            
            // 닉네임 변경
            currentUser = trimmedNickname;
            localStorage.setItem('chatNickname', trimmedNickname);
            
            // 헤더의 프로필 정보 업데이트
            updateProfileDisplay();
            
            // UI에서 기존 메시지들의 닉네임 업데이트
            updateExistingMessagesNickname(currentNickname, trimmedNickname);
            
        } catch (error) {
            showErrorMessage('닉네임 변경 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
        
    } else if (newNickname && newNickname.trim() === currentNickname) {
        alert('동일한 닉네임입니다.');
    }
}

// UI에서 기존 메시지들의 닉네임 업데이트
function updateExistingMessagesNickname(oldNickname, newNickname) {
    const messageElements = chatMessages.querySelectorAll('.message');
    
    messageElements.forEach((messageElement) => {
        const authorElement = messageElement.querySelector('.message-author');
        if (authorElement && authorElement.textContent === oldNickname) {
            authorElement.textContent = newNickname;
        }
    });
}

// 프로필 표시 업데이트 함수
function updateProfileDisplay() {
    const profileText = document.querySelector('.profile-text h3');
    if (profileText) {
        profileText.textContent = currentUser;
    }
}

// 모든 대화 삭제 함수
async function deleteAllChats() {
    const confirmed = confirm('정말로 모든 대화를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
    
    if (!confirmed) return;

    try {
        // 로딩 표시
        showSuccessMessage('대화를 삭제하는 중...');
        
        // Firestore에서 모든 메시지 삭제
        const snapshot = await db.collection('chatMessages').get();
        const batch = db.batch();
        
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        // UI는 실시간 리스너가 자동으로 처리하므로 수동 제거하지 않음
        
        // 성공 메시지
        showSuccessMessage('모든 대화가 삭제되었습니다.');
        
        // 웰컴 메시지 추가 (삭제 후)
        setTimeout(() => {
            addMessageToUI('새로운 대화를 시작해보세요! 💬', '시스템', new Date(), false);
        }, 1000);
        
        // 첫 메시지 상태 초기화
        isFirstMessage = true;
        
        // 로드된 메시지 ID 초기화
        loadedMessageIds.clear();
        
    } catch (error) {
        showErrorMessage('대화 삭제 중 오류가 발생했습니다.');
    }
}

// 메시지 전송 함수
async function sendMessage() {
    const text = messageInput.value.trim();
    if (text === '') return;
    
    try {
        // 첫 메시지 전송 시 웰컴 메시지 제거
        if (isFirstMessage) {
            removeWelcomeMessages();
        }
        
        // Firestore에 메시지 저장
        const docRef = await db.collection('chatMessages').add({
            text: text,
            author: currentUser,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'text'
        });
        
        // 새로 생성된 메시지 ID를 로드된 메시지 목록에 추가
        loadedMessageIds.add(docRef.id);
        
        // 입력창 초기화
        messageInput.value = '';
        
    } catch (error) {
        // 에러 발생 시 사용자에게 알림
        showErrorMessage('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    }
}

// UI에 메시지 추가
function addMessageToUI(text, author, timestamp, isMyMessage, messageId = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isMyMessage ? 'sent' : 'received'}`;
    
    // 메시지 ID를 data 속성으로 추가 (삭제 시 식별용)
    if (messageId) {
        messageDiv.setAttribute('data-message-id', messageId);
    } else {
        // 새로 생성된 메시지의 경우 임시 ID 생성
        const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        messageDiv.setAttribute('data-message-id', tempId);
    }
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // 닉네임 표시 (받은 메시지에만)
    if (!isMyMessage && author !== '시스템') {
        const authorName = document.createElement('div');
        authorName.className = 'message-author';
        authorName.textContent = author;
        authorName.style.cssText = `
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
            font-weight: 500;
        `;
        messageContent.appendChild(authorName);
    }
    
    const messageText = document.createElement('div');
    messageText.textContent = text;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    
    // 타임스탬프 처리
    if (timestamp) {
        if (timestamp.toDate) {
            // Firestore 타임스탬프
            messageTime.textContent = formatTime(timestamp.toDate());
        } else {
            // 일반 Date 객체
            messageTime.textContent = formatTime(new Date(timestamp));
        }
    } else {
        messageTime.textContent = getCurrentTime();
    }
    
    messageContent.appendChild(messageText);
    messageContent.appendChild(messageTime);
    messageDiv.appendChild(messageContent);
    
    chatMessages.appendChild(messageDiv);
    
    // 스크롤을 맨 아래로
    scrollToBottom();
    
    // 애니메이션 효과
    messageDiv.style.animation = 'fadeInUp 0.3s ease-out';
}

// 메시지 ID 생성 함수
function generateMessageId() {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 시간 포맷팅
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 현재 시간 가져오기
function getCurrentTime() {
    const now = new Date();
    return formatTime(now);
}

// 스크롤을 맨 아래로
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 기존 메시지들 로드
async function loadExistingMessages() {
    try {
        const snapshot = await db.collection('chatMessages')
            .orderBy('timestamp', 'asc')
            .limit(50)
            .get();
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const messageId = doc.id;
            
            // 메시지 ID를 로드된 목록에 추가
            loadedMessageIds.add(messageId);
            
            addMessageToUI(data.text, data.author, data.timestamp, data.author === currentUser, messageId);
        });
        
        scrollToBottom();
        
        // 초기 로드 완료 표시
        isInitialLoadComplete = true;
        
    } catch (error) {
        // 에러 발생 시 조용히 처리
        showErrorMessage('메시지를 불러오는 중 문제가 발생했습니다.');
    }
}

// 이벤트 리스너들
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// 입력창 포커스 시 스크롤
messageInput.addEventListener('focus', () => {
    setTimeout(scrollToBottom, 100);
});

// 헤더 아이콘들에 이벤트 추가
document.querySelector('.header-left i').addEventListener('click', () => {
    alert('뒤로 가기 기능입니다');
});

document.querySelector('.header-right i:first-child').addEventListener('click', () => {
    alert('검색 기능입니다');
});

// 메뉴 아이콘 클릭 시 메뉴 표시
document.querySelector('.header-right i:last-child').addEventListener('click', () => {
    showMenu();
});

// 플러스 아이콘 클릭 시 파일 첨부 시뮬레이션
document.querySelector('.fa-plus').addEventListener('click', () => {
    alert('파일 첨부 기능입니다');
});

// 이모티콘 아이콘 클릭 시 이모티콘 선택 시뮬레이션
document.querySelector('.fa-smile').addEventListener('click', () => {
    const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '😍', '🤔'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    messageInput.value += randomEmoji;
    messageInput.focus();
});

// 터치/스와이프 제스처 지원 (모바일)
let touchStartY = 0;
let touchEndY = 0;

chatMessages.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
});

chatMessages.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].clientY;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartY - touchEndY;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // 위로 스와이프 - 새로고침
            refreshMessages();
        } else {
            // 아래로 스와이프 - 스크롤 맨 아래
            scrollToBottom();
        }
    }
}

// 메시지 새로고침
async function refreshMessages() {
    chatMessages.style.opacity = '0.5';
    
    try {
        // 기존 메시지들 제거
        chatMessages.innerHTML = '';
        
        // 로드된 메시지 ID 초기화
        loadedMessageIds.clear();
        
        // 새로 로드
        await loadExistingMessages();
        
        setTimeout(() => {
            chatMessages.style.opacity = '1';
        }, 300);
    } catch (error) {
        // 에러 발생 시 조용히 처리
        chatMessages.style.opacity = '1';
    }
}

// 더블 탭으로 메시지 좋아요 기능
let lastTap = 0;

chatMessages.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
        // 더블 탭
        const messageElement = e.target.closest('.message');
        if (messageElement) {
            showLikeAnimation(messageElement);
        }
    }
    lastTap = currentTime;
});

function showLikeAnimation(element) {
    const likeIcon = document.createElement('div');
    likeIcon.innerHTML = '❤️';
    likeIcon.style.cssText = `
        position: absolute;
        font-size: 24px;
        pointer-events: none;
        animation: likeAnimation 1s ease-out forwards;
        z-index: 1000;
    `;
    
    element.style.position = 'relative';
    element.appendChild(likeIcon);
    
    setTimeout(() => {
        likeIcon.remove();
    }, 1000);
}

// 좋아요 애니메이션 CSS 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes likeAnimation {
        0% {
            transform: scale(0) translateY(0);
            opacity: 1;
        }
        50% {
            transform: scale(1.2) translateY(-20px);
            opacity: 1;
        }
        100% {
            transform: scale(1) translateY(-40px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    // 원래 탭 제목 저장
    saveOriginalTitle();
    
    // 사용자 닉네임 설정
    setUserNickname();
    
    // 기존 메시지들 로드
    await loadExistingMessages();
    
    // 실시간 리스너 설정
    setupRealtimeListener();
    
    // 입력창에 포커스
    messageInput.focus();
    
    // 웰컴 메시지 (기존 메시지가 없을 때만)
    if (loadedMessageIds.size === 0) {
        setTimeout(() => {
            addMessageToUI('환영합니다! 자유롭게 대화해보세요 💬', '시스템', new Date(), false);
        }, 500);
    }
});

// 오프라인/온라인 상태 시뮬레이션
setInterval(() => {
    const statusElement = document.querySelector('.status');
    const isOnline = Math.random() > 0.1; // 90% 확률로 온라인
    
    if (isOnline) {
        statusElement.textContent = '온라인';
        statusElement.style.color = '#28a745';
    } else {
        statusElement.textContent = '오프라인';
        statusElement.style.color = '#6c757d';
    }
}, 10000); // 10초마다 상태 변경

// 페이지 언로드 시 리스너 정리
window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
        unsubscribe();
    }
});

