import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- Firebase 設定 ---
const firebaseConfig = {
    apiKey: "AIzaSyB4OchbsfGGC_VozMPeBGbr2ZtiMJTWTJg",
    authDomain: "johou7-275be.firebaseapp.com",
    databaseURL: "https://johou7-275be-default-rtdb.firebaseio.com",
    projectId: "johou7-275be",
    storageBucket: "johou7-275be.firebasestorage.app",
    messagingSenderId: "840280999329",
    appId: "1:840280999329:web:d7cefde6ec9953cabb77e0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let poseNet;
let poses = [];
let enemyHP = 1000;
let attackHistory = [];

const video = document.getElementById("video");
const shootBtn = document.getElementById("shootBtn");
const status = document.getElementById("status");
const hpBar = document.getElementById("hpBar");
const hpValue = document.getElementById("hpValue");

// --- ロード画面の遷移 ---
window.onload = () => {
    let width = 0;
    const bar = document.getElementById("load-progress-bar");
    const timer = setInterval(() => {
        width += 2;
        bar.style.width = width + "%";
        if (width >= 100) {
            clearInterval(timer);
            document.getElementById("loading-screen").style.display = "none";
            document.getElementById("tos-screen").style.display = "flex";
        }
    }, 30);
};

// 同意ボタン
document.getElementById("agreeBtn").onclick = () => {
    document.getElementById("tos-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "flex";
    initGame();
};

// リトライボタン
document.getElementById("retryBtn").onclick = () => {
    enemyHP = 1000;
    attackHistory = [];
    updateHP();
    document.getElementById("result-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "flex";
};

// --- 初期化 ---
async function initGame() {
    status.innerText = "SYSTEM: カメラ起動中...";
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
        
        video.onloadeddata = () => {
            video.play();
            status.innerText = "SYSTEM: AIコア起動中...";
            
            // ml5.jsのPoseNetを初期化
            poseNet = ml5.poseNet(video, () => {
                shootBtn.disabled = false;
                shootBtn.innerText = "ATTACK START";
                status.innerText = "READY: ターゲット捕捉中";
            });

            poseNet.on('pose', (results) => {
                poses = results;
            });

            drawLoop();
        };
    } catch (e) {
        status.innerText = "CAMERA ERROR: 許可が必要です";
    }
}

// --- 描画ループ ---
function drawLoop() {
    const canvas = document.getElementById("output_canvas");
    const ctx = canvas.getContext("2d");

    // キャンバスサイズをビデオの解像度に同期
    if (video.videoWidth > 0 && canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (poses.length > 0) {
        const pose = poses[0].pose;
        const skeleton = poses[0].skeleton;

        // 関節を描画
        pose.keypoints.forEach(kp => {
            if (kp.score > 0.2) {
                ctx.fillStyle = "#39ff14";
                ctx.beginPath();
                ctx.arc(kp.position.x, kp.position.y, 5, 0, 2 * Math.PI);
                ctx.fill();
            }
        });

        // 骨格（線）を描画
        skeleton.forEach(bone => {
            const start = bone[0];
            const end = bone[1];
            ctx.strokeStyle = "#39ff14";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(start.position.x, start.position.y);
            ctx.lineTo(end.position.x, end.position.y);
            ctx.stroke();
        });
    }
    requestAnimationFrame(drawLoop);
}

// --- 攻撃アクション ---
shootBtn.onclick = async () => {
    if (poses.length === 0) {
        status.innerText = "ERROR: ターゲット未捕捉";
        return;
    }

    shootBtn.disabled = true;
    const pose = poses[0].pose;
    let damage = 0;
    let hitParts = [];
    const THRESHOLD = 0.2;

    // 頭部判定
    if (pose.nose.confidence > THRESHOLD) {
        damage += 150;
        hitParts.push("HEAD");
    }

    // 胴体判定
    if (pose.leftShoulder.confidence > THRESHOLD || pose.rightShoulder.confidence > THRESHOLD) {
        damage += 80;
        hitParts.push("BODY");
    }

    // 腕の数
    let armCount = 0;
    ['leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'].forEach(p => {
        if (pose[p] && pose[p].confidence > THRESHOLD) armCount++;
    });
    if (armCount > 0) {
        damage += (armCount * 30);
        hitParts.push(`ARMS(x${armCount})`);
    }

    // 足の数
    let legCount = 0;
    ['leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'].forEach(p => {
        if (pose[p] && pose[p].confidence > THRESHOLD) legCount++;
    });
    if (legCount > 0) {
        damage += (legCount * 40);
        hitParts.push(`LEGS(x${legCount})`);
    }

    // 判定が何も出なかった場合の最低保証
    if (damage === 0) {
        damage = 10;
        hitParts.push("GRAZE");
    }

    // 履歴保存
    attackHistory.push({
        damage: damage,
        parts: hitParts.join(" + ")
    });

    // 演出・HP更新
    showDamageEffect(damage);
    enemyHP = Math.max(0, enemyHP - damage);
    updateHP();

    // Firebaseへの画像保存
    const saveCanvas = document.getElementById("saveCanvas");
    saveCanvas.width = video.videoWidth;
    saveCanvas.height = video.videoHeight;
    const sCtx = saveCanvas.getContext("2d");
    sCtx.drawImage(video, 0, 0);

    try {
        await push(ref(db, 'game_logs'), {
            image: saveCanvas.toDataURL("image/webp", 0.3),
            totalDamage: damage,
            parts: hitParts,
            timestamp: Date.now()
        });
    } catch (e) { console.error(e); }

    // 終了判定
    setTimeout(() => {
        shootBtn.disabled = false;
        if (enemyHP <= 0) {
            showResults();
        }
    }, 800);
};

function showDamageEffect(dmg) {
    const overlay = document.getElementById("damage-overlay");
    const el = document.createElement("div");
    el.className = "dmg-popup";
    el.innerText = `-${dmg} DMG!!`;
    overlay.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function updateHP() {
    hpValue.innerText = enemyHP;
    hpBar.style.width = (enemyHP / 10) + "%";
}

function showResults() {
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("result-screen").style.display = "flex";
    
    const list = document.getElementById("result-list");
    list.innerHTML = "";
    attackHistory.forEach((atk, idx) => {
        list.innerHTML += `
            <div class="result-item">
                <span>[LOG_${idx + 1}] ${atk.parts}</span>
                <span class="neon-text-pink">${atk.damage} DMG</span>
            </div>`;
    });
}
