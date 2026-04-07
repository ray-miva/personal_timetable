const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DISPLAY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let timetableData = null;

// JSONデータを取得して初期化
async function init() {
    try {
        const response = await fetch('timetable.json');
        if (!response.ok) throw new Error("データの読み込みに失敗しました");
        
        timetableData = await response.json();
        renderTable();
        updateStatus(); // 初回実行
        setInterval(updateStatus, 1000); // 1秒ごとに更新
    } catch (error) {
        console.error(error);
        alert("timetable.json の読み込みに失敗しました。ローカルサーバーで実行しているか確認してください。");
    }
}

// テーブルをHTMLに描画する処理
function renderTable() {
    const tbody = document.querySelector('#timetable tbody');
    tbody.innerHTML = "";

    timetableData.periods.forEach(p => {
        const tr = document.createElement('tr');

        // 左端の時間列
        const timeTd = document.createElement('td');
        timeTd.className = 'time-cell';
        timeTd.innerHTML = `<strong>${p.id}限</strong>${p.start}<br>|<br>${p.end}`;
        tr.appendChild(timeTd);

        // 月〜土の各コマ
        DISPLAY_DAYS.forEach(day => {
            const td = document.createElement('td');
            const classInfo = timetableData.schedule[day] && timetableData.schedule[day][p.id];
            
            if (classInfo) {
                td.innerHTML = `
                    <div class="class-name">${classInfo.name}</div>
                    <div class="prof-name">${classInfo.prof}</div>
                `;
                td.classList.add('has-class');
            }
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

// 現在の時刻・授業・次の授業を判定して表示する処理
function updateStatus() {
    if (!timetableData) return;

    const now = new Date();
    const currentDayStr = DAYS[now.getDay()];
    // "HH:MM"形式で現在時刻を取得
    const currentTimeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }); 

    // 現在時刻の表示更新
    document.getElementById('current-time').textContent = `${currentTimeStr} (${currentDayStr})`;

    let currentClassStr = "なし";
    let nextClassStr = "なし";
    let foundNext = false;

    // 今日のスケジュールが存在する場合（月〜土）
    if (DISPLAY_DAYS.includes(currentDayStr)) {
        const todaySchedule = timetableData.schedule[currentDayStr] || {};

        for (const p of timetableData.periods) {
            const classInfo = todaySchedule[p.id];
            
            // 現在の授業の判定（開始時刻〜終了時刻の間）
            if (currentTimeStr >= p.start && currentTimeStr <= p.end) {
                currentClassStr = classInfo ? `${classInfo.name} (${classInfo.prof})` : "空きコマ";
            } 
            // 次の授業の判定（現在時刻より後で、まだ見つかっていない最初の授業）
            else if (currentTimeStr < p.start && !foundNext) {
                if (classInfo) {
                    nextClassStr = `${classInfo.name} (${classInfo.prof}) [${p.start}~]`;
                    foundNext = true;
                }
            }
        }
    }

    document.getElementById('current-class').textContent = currentClassStr;
    document.getElementById('next-class').textContent = nextClassStr;
}

// 読み込み完了時に初期化関数を呼び出す
document.addEventListener("DOMContentLoaded", init);