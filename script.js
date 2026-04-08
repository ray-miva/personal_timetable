const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DISPLAY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let timetableData = null;

async function init() {
    try {
        const response = await fetch('timetable.json');
        if (!response.ok) throw new Error("データの読み込みに失敗しました");
        
        timetableData = await response.json();
        renderTable();
        updateStatus();
        setInterval(updateStatus, 1000);
    } catch (error) {
        console.error(error);
        alert("timetable.json の読み込みに失敗しました。");
    }
}

function renderTable() {
    const tbody = document.querySelector('#timetable tbody');
    tbody.innerHTML = "";

    timetableData.periods.forEach(p => {
        const tr = document.createElement('tr');

        // 左端の時間列 (基本の時間)
        const timeTd = document.createElement('td');
        timeTd.className = 'time-cell';
        timeTd.innerHTML = `<strong>${p.label}</strong>${p.start}<br>|<br>${p.end}`;
        tr.appendChild(timeTd);

        // 各曜日のコマ
        DISPLAY_DAYS.forEach(day => {
            const td = document.createElement('td');
            const todaySchedule = timetableData.schedule[day] || {};
            const classInfo = todaySchedule[p.id];
            
            let innerHTML = '';
            
            // 通常の授業の描画
            if (classInfo) {
                let timeHTML = '';
                // もし個別に start と end が設定されていれば時間を表示する
                if (classInfo.start && classInfo.end) {
                    timeHTML = `<div class="override-time">⏰ ${classInfo.start}~${classInfo.end}</div>`;
                }

                innerHTML += `
                    <div class="class-block has-class">
                        ${timeHTML}
                        <div class="class-name">${classInfo.name}</div>
                        <div class="prof-name">${classInfo.det}</div>
                    </div>
                `;
            }

            // このコマの後に挿入される特殊な授業(HR等)の描画
            if (todaySchedule.special) {
                const specials = todaySchedule.special.filter(s => s.after === p.id);
                specials.forEach(s => {
                    innerHTML += `
                        <div class="class-block special-class">
                            <div class="special-time">${s.label} (${s.start}~${s.end})</div>
                            <div class="class-name">${s.name}</div>
                            <div class="prof-name">${s.det}</div>
                        </div>
                    `;
                });
            }

            if (innerHTML !== '') {
                td.innerHTML = innerHTML;
            }
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

function updateStatus() {
    if (!timetableData) return;

    const now = new Date();
    const currentDayStr = DAYS[now.getDay()];
    const currentTimeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }); 

    document.getElementById('current-time').textContent = `${currentTimeStr} (${currentDayStr})`;

    let currentClassStr = "なし";
    let nextClassStr = "なし";

    if (DISPLAY_DAYS.includes(currentDayStr)) {
        const todaySchedule = timetableData.schedule[currentDayStr] || {};
        
        // タイムラインを構築
        let timeline = [];
        timetableData.periods.forEach(p => {
            // クラス情報が存在するかチェック
            const classInfo = todaySchedule[p.id];
            
            // 重要：個別の start/end があればそちらを優先、なければ基本の時間を採用
            const actualStart = (classInfo && classInfo.start) ? classInfo.start : p.start;
            const actualEnd = (classInfo && classInfo.end) ? classInfo.end : p.end;

            // コマをタイムラインに追加
            timeline.push({
                isClass: !!classInfo,
                name: classInfo ? classInfo.name : "",
                det: classInfo ? classInfo.det : "",
                start: actualStart,
                end: actualEnd
            });

            // 特殊コマ(HR等)を追加
            if (todaySchedule.special) {
                todaySchedule.special.filter(s => s.after === p.id).forEach(s => {
                    timeline.push({
                        isClass: true,
                        name: s.name,
                        det: s.det,
                        start: s.start,
                        end: s.end
                    });
                });
            }
        });

        let currentIndex = -1;

        // 現在のコマを探す
        for (let i = 0; i < timeline.length; i++) {
            const block = timeline[i];
            if (currentTimeStr >= block.start && currentTimeStr <= block.end) {
                currentIndex = i;
                currentClassStr = block.isClass ? `${block.name} (${block.det})` : "空きコマ";
                break;
            }
        }

        // 次のコマを探す
        if (currentIndex !== -1 && currentIndex + 1 < timeline.length) {
            const nextBlock = timeline[currentIndex + 1];
            if (nextBlock.isClass) {
                nextClassStr = `${nextBlock.name} (${nextBlock.det}) [${nextBlock.start}~]`;
            } else {
                nextClassStr = "なし";
            }
        }
    }

    document.getElementById('current-class').textContent = currentClassStr;
    document.getElementById('next-class').textContent = nextClassStr;
}

document.addEventListener("DOMContentLoaded", init);