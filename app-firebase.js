// Firebase配置
const firebaseConfig = {
    apiKey: "AIzaSyD67Xa8tXqNsZ-9pTv-Qlf_Q_c_C2Kz4ZQ",
    authDomain: "vision-baa84.firebaseapp.com",
    databaseURL: "https://vision-baa84-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "vision-baa84",
    storageBucket: "vision-baa84.firebasestorage.app",
    messagingSenderId: "605465736006",
    appId: "1:605465736006:web:c9bcbd874c8a522862ab47",
    measurementId: "G-9EWLMJ961F"
};

// 初始化Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// 啟用Google登入
const googleProvider = new firebase.auth.GoogleAuthProvider();

let currentUser = null;
let userDataRef = null;

// 默認每日任務數據
const defaultDailyTasks = [
    { time: "06:30 - 06:45", title: "祭壇禱告（15分鐘）", goal: "目標1", id: "task1" },
    { time: "06:45 - 06:55", title: "背經時段1：今日3節經文第1次", goal: "目標5", id: "task2" },
    { time: "06:55 - 07:05", title: "整理：執拾房間/書包/檢查今日物品", goal: "目標3", id: "task3" },
    { time: "07:30 - 08:00", title: "背經複習：用手機App或錄音重聽昨日經文", goal: "目標5", id: "task4" },
    { time: "12:30 - 12:45", title: "背經時段2：今日3節經文第2次", goal: "目標5", id: "task5" },
    { time: "17:30 - 18:00", title: "背經時段3：今日3節經文第3次", goal: "目標5", id: "task6" },
    { time: "18:15 - 18:30", title: "試探check-in：寫低今日最易跌倒時刻", goal: "目標2", id: "task7" },
    { time: "19:30 - 20:00", title: "黃金記憶時間：與家人傾偈/食飯/玩遊戲", goal: "目標4", id: "task8" },
    { time: "20:30 - 21:00", title: "AI學習：實作1個小項目或學1個新功能", goal: "目標6", id: "task9" },
    { time: "22:30 - 22:40", title: "感恩+回顧：3件感恩事+今日試探", goal: "目標1, 2", id: "task10" }
];

let dailyTasks = [...defaultDailyTasks];

const weeklyTasks = [
    { category: "禱告祭壇", task: "完成5日或以上早晨祭壇禱告", id: "weekly1" },
    { category: "禱告祭壇", task: "週日：家人一起祭壇前禱告（10分鐘）", id: "weekly2" },
    { category: "背經進度", task: "本週新增背誦：21節（7日x3節）", id: "weekly3" },
    { category: "背經進度", task: "複習舊經文：最少3次", id: "weekly4" },
    { category: "試探/癮癖", task: "與問責夥伴更新1次", id: "weekly5" },
    { category: "有系統", task: "週日晚：規劃下週三件最重要事", id: "weekly6" },
    { category: "黃金記憶球", task: "家人：安排1次特別時間", id: "weekly7" },
    { category: "黃金記憶球", task: "組員：主動約1位深度傾偈", id: "weekly8" },
    { category: "AI學習", task: "產出1件分享內容", id: "weekly9" },
    { category: "關係建立", task: "深度接觸2人", id: "weekly10" }
];

// 聖經書卷數據（66卷）
const bibleBooks = [
    { name: "創世記", chapters: 50 }, { name: "出埃及記", chapters: 40 }, { name: "利未記", chapters: 27 },
    { name: "民數記", chapters: 36 }, { name: "申命記", chapters: 34 }, { name: "約書亞記", chapters: 24 },
    { name: "士師記", chapters: 21 }, { name: "路得記", chapters: 4 }, { name: "撒母耳記上", chapters: 31 },
    { name: "撒母耳記下", chapters: 24 }, { name: "列王紀上", chapters: 22 }, { name: "列王紀下", chapters: 25 },
    { name: "歷代志上", chapters: 29 }, { name: "歷代志下", chapters: 36 }, { name: "以斯拉記", chapters: 10 },
    { name: "尼希米記", chapters: 13 }, { name: "以斯帖記", chapters: 10 }, { name: "約伯記", chapters: 42 },
    { name: "詩篇", chapters: 150 }, { name: "箴言", chapters: 31 }, { name: "傳道書", chapters: 12 },
    { name: "雅歌", chapters: 8 }, { name: "以賽亞書", chapters: 66 }, { name: "耶利米書", chapters: 52 },
    { name: "耶利米哀歌", chapters: 5 }, { name: "以西結書", chapters: 48 }, { name: "但以理書", chapters: 12 },
    { name: "何西阿書", chapters: 14 }, { name: "約珥書", chapters: 3 }, { name: "阿摩司書", chapters: 9 },
    { name: "俄巴底亞書", chapters: 1 }, { name: "約拿書", chapters: 4 }, { name: "彌迦書", chapters: 7 },
    { name: "那鴻書", chapters: 3 }, { name: "哈巴谷書", chapters: 3 }, { name: "西番雅書", chapters: 3 },
    { name: "哈該書", chapters: 2 }, { name: "撒迦利亞書", chapters: 14 }, { name: "瑪拉基書", chapters: 4 },
    { name: "馬太福音", chapters: 28 }, { name: "馬可福音", chapters: 16 }, { name: "路加福音", chapters: 24 },
    { name: "約翰福音", chapters: 21 }, { name: "使徒行傳", chapters: 28 }, { name: "羅馬書", chapters: 16 },
    { name: "哥林多前書", chapters: 16 }, { name: "哥林多後書", chapters: 13 }, { name: "加拉太書", chapters: 6 },
    { name: "以弗所書", chapters: 6 }, { name: "腓立比書", chapters: 4 }, { name: "歌羅西書", chapters: 4 },
    { name: "帖撒羅尼迦前書", chapters: 5 }, { name: "帖撒羅尼迦後書", chapters: 3 }, { name: "提摩太前書", chapters: 6 },
    { name: "提摩太後書", chapters: 4 }, { name: "提多書", chapters: 3 }, { name: "腓利門書", chapters: 1 },
    { name: "希伯來書", chapters: 13 }, { name: "雅各書", chapters: 5 }, { name: "彼得前書", chapters: 5 },
    { name: "彼得後書", chapters: 3 }, { name: "約翰一書", chapters: 5 }, { name: "約翰二書", chapters: 1 },
    { name: "約翰三書", chapters: 1 }, { name: "猶大書", chapters: 1 }, { name: "啟示錄", chapters: 22 }
];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    updateDateDisplay();
    checkAuthState();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
    }
});

// 檢查登入狀態
function checkAuthState() {
    auth.onAuthStateChanged(async user => {
        if (user) {
            currentUser = user;
            userDataRef = database.ref('users/' + user.uid);
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            updateSyncStatus('online', '已連線');

            // 加載用戶自定義任務列表
            await loadCustomTasks();

            showTab('daily', null);
            loadNotificationSettings();
            listenToDataChanges();
        } else {
            document.getElementById('loginScreen').style.display = 'block';
            document.getElementById('mainApp').style.display = 'none';
        }
    });
}

// 加載用戶自定義任務
async function loadCustomTasks() {
    const snapshot = await userDataRef.child('customDailyTasks').once('value');
    if (snapshot.exists()) {
        dailyTasks = snapshot.val();
    } else {
        dailyTasks = [...defaultDailyTasks];
        await userDataRef.child('customDailyTasks').set(dailyTasks);
    }
}

// 登入
async function login() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    if (!email || !password) {
        showModal('錯誤', '請填寫電郵和密碼');
        return;
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
        showModal('成功', '登入成功！數據正在同步...');
    } catch (error) {
        showModal('登入失敗', error.message);
    }
}

// Google 登入
async function loginWithGoogle() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;

        // 檢查是否是新用戶
        const userSnapshot = await database.ref('users/' + user.uid).once('value');
        if (!userSnapshot.exists()) {
            // 初始化新用戶數據
            await database.ref('users/' + user.uid).set({
                email: user.email,
                displayName: user.displayName,
                createdAt: new Date().toISOString(),
                customDailyTasks: defaultDailyTasks,
                dailyTasks: {},
                scriptures: [],
                weeklyTasks: {},
                notificationsEnabled: false
            });
        }

        showModal('成功', '已使用 Google 帳號登入！');
    } catch (error) {
        showModal('登入失敗', error.message);
    }
}

// 忘記密碼
async function forgotPassword() {
    const email = document.getElementById('emailInput').value;

    if (!email) {
        showModal('錯誤', '請先輸入你的電郵地址');
        return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        showModal('成功', `密碼重設郵件已發送到 ${email}，請檢查你的收件箱（包括垃圾郵件）`);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            showModal('錯誤', '找不到此電郵帳號');
        } else {
            showModal('錯誤', error.message);
        }
    }
}

// 註冊
async function register() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    if (!email || !password) {
        showModal('錯誤', '請填寫電郵和密碼');
        return;
    }

    if (password.length < 6) {
        showModal('錯誤', '密碼最少6位');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await database.ref('users/' + userCredential.user.uid).set({
            email: email,
            createdAt: new Date().toISOString(),
            customDailyTasks: defaultDailyTasks,
            dailyTasks: {},
            scriptures: [],
            weeklyTasks: {},
            notificationsEnabled: false
        });
        showModal('成功', '註冊成功！歡迎使用願景追蹤器');
    } catch (error) {
        showModal('註冊失敗', error.message);
    }
}

// 登出
async function logout() {
    if (confirm('確定要登出嗎？')) {
        await auth.signOut();
        location.reload();
    }
}

// 監聽數據變化
function listenToDataChanges() {
    const today = getTodayKey();

    userDataRef.child('dailyTasks/' + today).on('value', snapshot => {
        const activeTab = document.querySelector('.tab.active');
        if (activeTab && activeTab.textContent.includes('每日')) {
            renderDailyTasks();
        }
    });

    userDataRef.child('scriptures').on('value', snapshot => {
        const activeTab = document.querySelector('.tab.active');
        if (activeTab && activeTab.textContent.includes('背經')) {
            renderScripturePage();
        }
    });
}

// 更新同步狀態
function updateSyncStatus(status, text) {
    const statusEl = document.getElementById('syncStatus');
    const iconEl = document.getElementById('syncIcon');
    const textEl = document.getElementById('syncText');

    if (!statusEl || !iconEl || !textEl) return;

    statusEl.className = 'sync-status ' + status;
    textEl.textContent = text;

    if (status === 'online') iconEl.textContent = '✅';
    else if (status === 'syncing') iconEl.textContent = '🔄';
    else iconEl.textContent = '⚠️';
}

// 更新日期顯示
function updateDateDisplay() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateEl = document.getElementById('dateDisplay');
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('zh-HK', options);
    }
}

// 獲取今日key
function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

// 切換標籤
function showTab(tabName, event) {
    if (event) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
    }

    switch(tabName) {
        case 'daily':
            renderDailyTasks();
            break;
        case 'scripture':
            renderScripturePage();
            break;
        case 'weekly':
            renderWeeklyTasks();
            break;
        case 'stats':
            renderStats();
            break;
        case 'settings':
            renderSettings();
            break;
    }
}

// 渲染每日任務
async function renderDailyTasks() {
    const today = getTodayKey();
    const snapshot = await userDataRef.child('dailyTasks/' + today).once('value');
    const completed = snapshot.val() || {};

    const total = dailyTasks.length;
    const done = Object.values(completed).filter(v => v).length;
    const progress = Math.round((done / total) * 100);

    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="color: #667eea;">📅 今日任務</h2>
            <button class="btn btn-success" onclick="showAddTaskForm()">+ 新增任務</button>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%">${done}/${total} 完成</div>
        </div>`;

    dailyTasks.forEach(task => {
        const isCompleted = completed[task.id] || false;
        html += `<div class="task-item ${isCompleted ? 'completed' : ''}">
            <input type="checkbox" class="checkbox" ${isCompleted ? 'checked' : ''} 
                onchange="toggleTask('${task.id}', this.checked)">
            <div class="task-info">
                <div class="task-time">${task.time}</div>
                <div class="task-title">${task.title}</div>
                <div class="task-goal">${task.goal}</div>
            </div>
            <button class="btn" style="margin: 0 5px; padding: 8px 15px;" onclick="editTask('${task.id}')">✏️</button>
            <button class="btn btn-danger" style="padding: 8px 15px;" onclick="deleteTask('${task.id}')">🗑️</button>
        </div>`;
    });

    if (done >= 7) {
        html += `<div class="reward-box">
            🎉 恭喜！完成7項任務，可獲得每日小獎勵！
        </div>`;
    }

    document.getElementById('content').innerHTML = html;
}

// 顯示新增任務表單
function showAddTaskForm() {
    const html = `
        <div style="background: white; padding: 20px; border-radius: 12px; border: 2px solid #667eea;">
            <h3 style="color: #667eea; margin-bottom: 15px;">新增每日任務</h3>
            <input type="text" id="newTaskTime" placeholder="時間（例如：08:00 - 08:30）" 
                style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px;">
            <input type="text" id="newTaskTitle" placeholder="任務標題" 
                style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px;">
            <input type="text" id="newTaskGoal" placeholder="對應目標（例如：目標3）" 
                style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px;">
            <div style="margin-top: 15px;">
                <button class="btn btn-success" onclick="saveNewTask()">儲存</button>
                <button class="btn" onclick="renderDailyTasks()">取消</button>
            </div>
        </div>
    `;
    document.getElementById('content').innerHTML = html + document.getElementById('content').innerHTML;
}

// 儲存新任務
async function saveNewTask() {
    const time = document.getElementById('newTaskTime').value;
    const title = document.getElementById('newTaskTitle').value;
    const goal = document.getElementById('newTaskGoal').value;

    if (!time || !title || !goal) {
        showModal('錯誤', '請填寫所有欄位');
        return;
    }

    const newTask = {
        time: time,
        title: title,
        goal: goal,
        id: 'task' + Date.now()
    };

    dailyTasks.push(newTask);

    updateSyncStatus('syncing', '同步中...');
    await userDataRef.child('customDailyTasks').set(dailyTasks);
    updateSyncStatus('online', '已同步');

    showModal('成功', '任務已新增');
    renderDailyTasks();
}

// 編輯任務
function editTask(taskId) {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    const html = `
        <div style="background: white; padding: 20px; border-radius: 12px; border: 2px solid #667eea;">
            <h3 style="color: #667eea; margin-bottom: 15px;">編輯任務</h3>
            <input type="text" id="editTaskTime" value="${task.time}" 
                style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px;">
            <input type="text" id="editTaskTitle" value="${task.title}" 
                style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px;">
            <input type="text" id="editTaskGoal" value="${task.goal}" 
                style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px;">
            <div style="margin-top: 15px;">
                <button class="btn btn-success" onclick="saveEditTask('${taskId}')">儲存</button>
                <button class="btn" onclick="renderDailyTasks()">取消</button>
            </div>
        </div>
    `;
    document.getElementById('content').innerHTML = html + document.getElementById('content').innerHTML;
}

// 儲存編輯的任務
async function saveEditTask(taskId) {
    const time = document.getElementById('editTaskTime').value;
    const title = document.getElementById('editTaskTitle').value;
    const goal = document.getElementById('editTaskGoal').value;

    if (!time || !title || !goal) {
        showModal('錯誤', '請填寫所有欄位');
        return;
    }

    const taskIndex = dailyTasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        dailyTasks[taskIndex] = { ...dailyTasks[taskIndex], time, title, goal };

        updateSyncStatus('syncing', '同步中...');
        await userDataRef.child('customDailyTasks').set(dailyTasks);
        updateSyncStatus('online', '已同步');

        showModal('成功', '任務已更新');
        renderDailyTasks();
    }
}

// 刪除任務
async function deleteTask(taskId) {
    if (!confirm('確定要刪除這個任務嗎？')) return;

    dailyTasks = dailyTasks.filter(t => t.id !== taskId);

    updateSyncStatus('syncing', '同步中...');
    await userDataRef.child('customDailyTasks').set(dailyTasks);
    updateSyncStatus('online', '已同步');

    showModal('成功', '任務已刪除');
    renderDailyTasks();
}

// 渲染背經頁面（添加聖經選擇器）
async function renderScripturePage() {
    const snapshot = await userDataRef.child('scriptures').once('value');
    const scriptures = snapshot.val() || [];
    const totalCount = scriptures.filter(s => s.completed >= 3).length;

    let html = `<div class="stats">
        <div class="stat-card">
            <div class="stat-number">${totalCount}</div>
            <div class="stat-label">已完成經文</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${200 - totalCount}</div>
            <div class="stat-label">剩餘目標</div>
        </div>
    </div>`;

    // 聖經選擇器
    html += `<div class="scripture-input">
        <h3>📖 聖經章節選擇器</h3>
        <select id="bibleBook" onchange="updateChapterOptions()" 
            style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
            <option value="">選擇書卷</option>`;

    bibleBooks.forEach((book, index) => {
        html += `<option value="${index}">${book.name}</option>`;
    });

    html += `</select>
        <select id="bibleChapter" 
            style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
            <option value="">先選擇書卷</option>
        </select>
        <input type="text" id="bibleVerse" placeholder="節數（例如：1-5 或 16）" 
            style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px;">
        <button class="btn btn-success" onclick="addBibleReference()">快速添加</button>
    </div>`;

    // 手動輸入
    html += `<div class="scripture-input">
        <h3>✍️ 手動輸入今日背經（3節）</h3>
        <input type="text" id="scripture1" placeholder="經文1（例如：約3:16）">
        <input type="text" id="scripture2" placeholder="經文2">
        <input type="text" id="scripture3" placeholder="經文3">
        <button class="btn btn-success" onclick="saveScriptures()">儲存今日經文</button>
    </div>`;

    scriptures.slice(-10).reverse().forEach((s, i) => {
        html += `<div class="task-item ${s.completed >= 3 ? 'completed' : ''}">
            <div class="task-info">
                <div class="task-title">${s.text}</div>
                <div class="task-goal">完成次數: ${s.completed}/3 | ${s.date}</div>
            </div>
            <button class="btn" onclick="markScripture(${scriptures.length - 1 - i})">+1次</button>
        </div>`;
    });

    document.getElementById('content').innerHTML = html;
}

// 更新章節選項
function updateChapterOptions() {
    const bookIndex = document.getElementById('bibleBook').value;
    const chapterSelect = document.getElementById('bibleChapter');

    if (!bookIndex) {
        chapterSelect.innerHTML = '<option value="">先選擇書卷</option>';
        return;
    }

    const book = bibleBooks[bookIndex];
    chapterSelect.innerHTML = '<option value="">選擇章節</option>';

    for (let i = 1; i <= book.chapters; i++) {
        chapterSelect.innerHTML += `<option value="${i}">${i}</option>`;
    }
}

// 添加聖經引用
function addBibleReference() {
    const bookIndex = document.getElementById('bibleBook').value;
    const chapter = document.getElementById('bibleChapter').value;
    const verse = document.getElementById('bibleVerse').value;

    if (!bookIndex || !chapter) {
        showModal('錯誤', '請選擇書卷和章節');
        return;
    }

    const book = bibleBooks[bookIndex];
    const reference = verse ? `${book.name}${chapter}:${verse}` : `${book.name}${chapter}`;

    // 自動填入到輸入框
    const inputs = ['scripture1', 'scripture2', 'scripture3'];
    for (let id of inputs) {
        const input = document.getElementById(id);
        if (!input.value) {
            input.value = reference;
            break;
        }
    }
}

// 儲存背經
async function saveScriptures() {
    const s1 = document.getElementById('scripture1').value;
    const s2 = document.getElementById('scripture2').value;
    const s3 = document.getElementById('scripture3').value;

    if (!s1 || !s2 || !s3) {
        showModal('錯誤', '請填寫全部3節經文');
        return;
    }

    updateSyncStatus('syncing', '同步中...');

    const snapshot = await userDataRef.child('scriptures').once('value');
    const scriptures = snapshot.val() || [];
    const today = new Date().toLocaleDateString('zh-HK');

    [s1, s2, s3].forEach(text => {
        scriptures.push({ text, date: today, completed: 0 });
    });

    await userDataRef.child('scriptures').set(scriptures);
    updateSyncStatus('online', '已同步');
    showModal('成功', '已儲存今日3節經文');
    renderScripturePage();
}

// 標記背經次數
async function markScripture(index) {
    updateSyncStatus('syncing', '同步中...');
    const snapshot = await userDataRef.child('scriptures').once('value');
    const scriptures = snapshot.val() || [];
    scriptures[index].completed = Math.min(scriptures[index].completed + 1, 3);
    await userDataRef.child('scriptures').set(scriptures);
    updateSyncStatus('online', '已同步');
    renderScripturePage();
}

// 渲染每週任務
async function renderWeeklyTasks() {
    const weekKey = getWeekKey();
    const snapshot = await userDataRef.child('weeklyTasks/' + weekKey).once('value');
    const completed = snapshot.val() || {};
    const done = Object.values(completed).filter(v => v).length;

    let html = `<div class="progress-bar">
        <div class="progress-fill" style="width: ${(done/weeklyTasks.length)*100}%">
            ${done}/${weeklyTasks.length} 完成
        </div>
    </div>`;

    let currentCategory = '';
    weeklyTasks.forEach(task => {
        if (task.category !== currentCategory) {
            html += `<h3 style="margin: 20px 0 10px 0; color: #667eea;">${task.category}</h3>`;
            currentCategory = task.category;
        }

        const isCompleted = completed[task.id] || false;
        html += `<div class="task-item ${isCompleted ? 'completed' : ''}">
            <input type="checkbox" class="checkbox" ${isCompleted ? 'checked' : ''} 
                onchange="toggleWeeklyTask('${task.id}', this.checked)">
            <div class="task-info">
                <div class="task-title">${task.task}</div>
            </div>
        </div>`;
    });

    if (done >= 8) {
        html += `<div class="reward-box">
            🎁 太好了！完成8項週任務，可獲得每週獎勵！
        </div>`;
    }

    document.getElementById('content').innerHTML = html;
}

// 渲染統計
async function renderStats() {
    const today = getTodayKey();
    const dailySnapshot = await userDataRef.child('dailyTasks/' + today).once('value');
    const dailyCompleted = dailySnapshot.val() || {};
    const dailyDone = Object.values(dailyCompleted).filter(v => v).length;

    const scriptureSnapshot = await userDataRef.child('scriptures').once('value');
    const scriptures = scriptureSnapshot.val() || [];
    const scripturesDone = scriptures.filter(s => s.completed >= 3).length;

    const weekKey = getWeekKey();
    const weeklySnapshot = await userDataRef.child('weeklyTasks/' + weekKey).once('value');
    const weeklyCompleted = weeklySnapshot.val() || {};
    const weeklyDone = Object.values(weeklyCompleted).filter(v => v).length;

    const startDate = new Date('2026-01-01');
    const now = new Date();
    const daysElapsed = Math.floor((now - startDate) / (1000*60*60*24)) + 1;

    const html = `<div class="stats">
        <div class="stat-card">
            <div class="stat-number">${dailyDone}/${dailyTasks.length}</div>
            <div class="stat-label">今日完成</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${scripturesDone}/200</div>
            <div class="stat-label">背經進度</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${weeklyDone}/10</div>
            <div class="stat-label">本週完成</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${daysElapsed}</div>
            <div class="stat-label">已堅持天數</div>
        </div>
    </div>
    <button class="btn" onclick="downloadBackup()">💾 下載備份</button>
    <button class="btn btn-success" onclick="syncAllDevices()">🔄 手動同步</button>
    <button class="btn" onclick="resetToDefaultTasks()">🔄 恢復默認任務</button>`;

    document.getElementById('content').innerHTML = html;
}

// 恢復默認任務
async function resetToDefaultTasks() {
    if (!confirm('確定要恢復默認任務列表嗎？這將覆蓋你的自定義任務。')) return;

    dailyTasks = [...defaultDailyTasks];
    updateSyncStatus('syncing', '同步中...');
    await userDataRef.child('customDailyTasks').set(dailyTasks);
    updateSyncStatus('online', '已同步');

    showModal('成功', '已恢復默認任務列表');
    renderDailyTasks();
}

// 加載通知設定
async function loadNotificationSettings() {
    const snapshot = await userDataRef.child('notificationsEnabled').once('value');
    const enabled = snapshot.val() || false;

    if (enabled && Notification.permission === 'granted') {
        scheduleNotifications();
    }
}

// 切換通知開關
async function toggleNotifications(enabled) {
    if (enabled) {
        if (!('Notification' in window)) {
            showModal('不支援', '你的瀏覽器不支援通知功能');
            document.getElementById('notificationSwitch').checked = false;
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            showModal('錯誤', '請允許通知權限');
            document.getElementById('notificationSwitch').checked = false;
            return;
        }

        await userDataRef.child('notificationsEnabled').set(true);
        scheduleNotifications();
        showModal('成功', '通知已開啟！你會在每個任務時段收到提醒');
    } else {
        await userDataRef.child('notificationsEnabled').set(false);
        showModal('成功', '通知已關閉');
    }
}

// 渲染設定頁面
async function renderSettings() {
    const notifSnapshot = await userDataRef.child('notificationsEnabled').once('value');
    const notifEnabled = notifSnapshot.val() || false;

    const html = `
        <h2>⚙️ 設定</h2>
        <div class="device-list">
            <h3>帳號資訊</h3>
            <p>電郵：${currentUser.email}</p>
            <p>顯示名稱：${currentUser.displayName || '未設定'}</p>
            <p>用戶ID：${currentUser.uid.substring(0, 8)}...</p>
        </div>

        <div class="device-list">
            <h3>🔔 通知設定</h3>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: white; border-radius: 8px; margin: 10px 0;">
                <span style="font-size: 16px;">啟用每日任務提醒</span>
                <label class="switch">
                    <input type="checkbox" id="notificationSwitch" ${notifEnabled ? 'checked' : ''} 
                        onchange="toggleNotifications(this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
            <p style="font-size: 12px; color: #666;">開啟後會在每個任務時間發送通知提醒</p>
        </div>

        <div class="device-list">
            <h3>數據管理</h3>
            <button class="btn" onclick="downloadBackup()">💾 下載備份JSON</button>
            <button class="btn" onclick="syncAllDevices()">🔄 立即同步所有數據</button>
        </div>

        <button class="btn btn-danger" style="width: 100%; margin-top: 20px;" onclick="logout()">登出</button>
    `;
    document.getElementById('content').innerHTML = html;
}

// 切換任務狀態
async function toggleTask(taskId, checked) {
    const today = getTodayKey();
    updateSyncStatus('syncing', '同步中...');
    await userDataRef.child('dailyTasks/' + today + '/' + taskId).set(checked);
    updateSyncStatus('online', '已同步');
    renderDailyTasks();
}

// 切換週任務
async function toggleWeeklyTask(taskId, checked) {
    const weekKey = getWeekKey();
    updateSyncStatus('syncing', '同步中...');
    await userDataRef.child('weeklyTasks/' + weekKey + '/' + taskId).set(checked);
    updateSyncStatus('online', '已同步');
    renderWeeklyTasks();
}

// 手動同步
async function syncAllDevices() {
    updateSyncStatus('syncing', '正在同步...');
    try {
        await userDataRef.child('lastSync').set(new Date().toISOString());
        updateSyncStatus('online', '同步完成');
        showModal('成功', '所有設備數據已同步！');
    } catch (error) {
        updateSyncStatus('offline', '同步失敗');
        showModal('錯誤', error.message);
    }
}

// 下載備份
async function downloadBackup() {
    const snapshot = await userDataRef.once('value');
    const data = snapshot.val();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `願景備份_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

// 獲取週標識
function getWeekKey() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
    return `${now.getFullYear()}_W${week}`;
}

// 排程通知
function scheduleNotifications() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    dailyTasks.forEach(task => {
        const timeMatch = task.time.match(/(\d{2}):(\d{2})/);
        if (!timeMatch) return;

        const [_, hour, minute] = timeMatch;
        const now = new Date();
        const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);

        if (scheduled > now) {
            const delay = scheduled - now;
            setTimeout(() => {
                new Notification(task.title, {
                    body: '時間到喇！打開2026願景追蹤器完成任務 🎯',
                    icon: 'icon-192.png',
                    badge: 'icon-192.png'
                });
            }, delay);
        }
    });
}

// 顯示彈窗
function showModal(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('modal').classList.add('active');
}

// 關閉彈窗
function closeModal() {
    document.getElementById('modal').classList.remove('active');
}
