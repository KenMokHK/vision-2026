// Firebase配置 - 請替換為你自己的配置
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

let currentUser = null;
let userDataRef = null;

// 每日任務數據
const dailyTasks = [
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

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    updateDateDisplay();
    checkAuthState();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }
});

// 檢查登入狀態
function checkAuthState() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            userDataRef = database.ref('users/' + user.uid);
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            updateSyncStatus('online', '已連線');
            showTab('daily');
            scheduleNotifications();
            listenToDataChanges();
        } else {
            document.getElementById('loginScreen').style.display = 'block';
            document.getElementById('mainApp').style.display = 'none';
        }
    });
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
        // 初始化用戶數據
        await database.ref('users/' + userCredential.user.uid).set({
            email: email,
            createdAt: new Date().toISOString(),
            dailyTasks: {},
            scriptures: [],
            weeklyTasks: {}
        });
        showModal('成功', '註冊成功！歡迎使用願景追蹤器');
    } catch (error) {
        showModal('註冊失敗', error.message);
    }
}

// 登出
async function logout() {
    if (confirm('確定要登出嗎？本地未同步的數據可能會遺失。')) {
        await auth.signOut();
        location.reload();
    }
}

// 監聽數據變化（即時同步）
function listenToDataChanges() {
    const today = new Date().toDateString();

    // 監聽每日任務
    userDataRef.child('dailyTasks/' + today).on('value', snapshot => {
        if (snapshot.exists()) {
            // 數據有更新，重新渲染
            if (document.querySelector('.tab.active').textContent.includes('每日')) {
                showTab('daily');
            }
        }
    });

    // 監聽背經進度
    userDataRef.child('scriptures').on('value', snapshot => {
        if (snapshot.exists()) {
            if (document.querySelector('.tab.active').textContent.includes('背經')) {
                showTab('scripture');
            }
        }
    });
}

// 更新同步狀態
function updateSyncStatus(status, text) {
    const statusEl = document.getElementById('syncStatus');
    const iconEl = document.getElementById('syncIcon');
    const textEl = document.getElementById('syncText');

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
    document.getElementById('dateDisplay').textContent = now.toLocaleDateString('zh-HK', options);
}

// 切換標籤
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    const content = document.getElementById('content');
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
    const today = new Date().toDateString();
    const snapshot = await userDataRef.child('dailyTasks/' + today).once('value');
    const completed = snapshot.val() || {};

    const total = dailyTasks.length;
    const done = Object.values(completed).filter(v => v).length;
    const progress = Math.round((done / total) * 100);

    let html = `<div class="progress-bar">
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
        </div>`;
    });

    if (done >= 7) {
        html += `<div class="reward-box">
            🎉 恭喜！完成7項任務，可獲得每日小獎勵！
        </div>`;
    }

    document.getElementById('content').innerHTML = html;
}

// 渲染背經頁面
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

    html += `<div class="scripture-input">
        <h3>今日背經（3節）</h3>
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
            html += `<h3 style="margin: 20px 0 10px 0;">${task.category}</h3>`;
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
    const today = new Date().toDateString();
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
            <div class="stat-number">${dailyDone}/10</div>
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
    <button class="btn btn-success" onclick="syncAllDevices()">🔄 手動同步</button>`;

    document.getElementById('content').innerHTML = html;
}

// 渲染設定頁面
function renderSettings() {
    const html = `
        <h2>⚙️ 設定</h2>
        <div class="device-list">
            <h3>帳號資訊</h3>
            <p>電郵：${currentUser.email}</p>
            <p>用戶ID：${currentUser.uid.substring(0, 8)}...</p>
            <p>註冊日期：${new Date(currentUser.metadata.creationTime).toLocaleDateString('zh-HK')}</p>
        </div>

        <div class="device-list">
            <h3>數據管理</h3>
            <button class="btn" onclick="downloadBackup()">💾 下載備份JSON</button>
            <button class="btn" onclick="syncAllDevices()">🔄 立即同步所有數據</button>
            <button class="btn btn-danger" onclick="clearAllData()">🗑️ 清除所有數據</button>
        </div>

        <div class="device-list">
            <h3>通知設定</h3>
            <button class="btn" onclick="enableNotifications()">🔔 開啟每日提醒</button>
            <button class="btn" onclick="testNotification()">🧪 測試通知</button>
        </div>

        <button class="btn btn-danger" style="width: 100%; margin-top: 20px;" onclick="logout()">登出</button>
    `;
    document.getElementById('content').innerHTML = html;
}

// 切換任務狀態（即時同步到Firebase）
async function toggleTask(taskId, checked) {
    const today = new Date().toDateString();
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

// 清除所有數據
async function clearAllData() {
    if (!confirm('⚠️ 警告：此操作會刪除所有數據且無法復原！確定要繼續嗎？')) return;
    if (!confirm('最後確認：你真的要刪除所有願景追蹤數據嗎？')) return;

    try {
        await userDataRef.remove();
        showModal('成功', '所有數據已清除');
        renderStats();
    } catch (error) {
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

// 開啟通知
async function enableNotifications() {
    if (!('Notification' in window)) {
        showModal('不支援', '你的瀏覽器不支援通知功能');
        return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        showModal('成功', '通知已開啟！你會在每個任務時段收到提醒');
        scheduleNotifications();
    }
}

// 測試通知
function testNotification() {
    if (Notification.permission === 'granted') {
        new Notification('測試通知', {
            body: '如果你看到這條訊息，代表通知功能正常運作！',
            icon: 'icon-192.png'
        });
    } else {
        showModal('錯誤', '請先開啟通知權限');
    }
}

// 排程通知
function scheduleNotifications() {
    if (Notification.permission !== 'granted') return;

    const times = ['06:30', '06:45', '12:30', '17:30', '20:30', '22:30'];
    const titles = ['祭壇禱告時間⏰', '背經時段📖', '背經時段📖', '背經複習📖', 'AI學習時間💻', '感恩回顧🙏'];

    times.forEach((time, i) => {
        const [hour, minute] = time.split(':');
        const now = new Date();
        const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);

        if (scheduled > now) {
            const delay = scheduled - now;
            setTimeout(() => {
                new Notification(titles[i], {
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