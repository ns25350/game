import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
let attackHistory = []; // 攻撃履歴を保存する配列

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

async function initGame() {
    const video = document.getElementById("video");
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    video.onloadeddata = () => {
        video.play();
        poseNet = ml5.poseNet(video, () => {
            document.getElementById("shootBtn").disabled = false;
            document.getElementById("shootBtn").innerText = "ATTACK START";
        });
        poseNet.on('pose', (results) => { poses = results; });
        drawLoop();
    };
}

function drawLoop() {
    const canvas = document.getElementById("output_canvas");
    const ctx = canvas.getContext("2d");
    const video = document.getElementById("video");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (poses.length > 0) {
        // 骨格描画（省略版：以前と同じ）
        poses[0].pose.keypoints.forEach(kp => {
            if (kp.score > 0.2) {
                ctx.fillStyle = "#39ff14";
                ctx.beginPath(); ctx.arc(kp.position.x, kp.position.y, 4, 0, 2*Math.PI); ctx.fill();
            }
        });
    }
    requestAnimationFrame(drawLoop);
}

// 攻撃実行
document.getElementById("shootBtn").onclick = async () => {
    if (poses.length === 0) return;
    
    const pose = poses[0].pose;
    let damage = 0;
    let parts = [];
    const THRESHOLD = 0.2;

    if (pose.nose.confidence > THRESHOLD) { damage += 150; parts.push("HEAD"); }
    if (pose.leftShoulder.confidence > THRESHOLD || pose.rightShoulder.confidence > THRESHOLD) { damage += 80; parts.push("BODY"); }
    
    // 腕と足
    let armCount = 0;
    ['leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'].forEach(p => { if(pose[p].confidence > THRESHOLD) armCount++; });
    if(armCount > 0) { damage += (armCount * 30); parts.push(`ARMS(x${armCount})`); }

    let legCount = 0;
    ['leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'].forEach(p => { if(pose[p].confidence > THRESHOLD) legCount++; });
    if(legCount > 0) { damage += (legCount * 40); parts.push(`LEGS(x${legCount})`); }

    if (damage === 0) damage = 10;

    // 履歴に追加
    attackHistory.push({ damage, parts: parts.length > 0 ? parts.join(", ") : "MISS" });

    // 演出表示
    showDamageEffect(damage);
    
    enemyHP = Math.max(0, enemyHP - damage);
    updateHP();

    // Firebase送信（以前のロジック）
    // push(ref(db, 'game_logs'), { totalDamage: damage, parts: parts });

    if (enemyHP <= 0) {
        setTimeout(showResults, 1000);
    }
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
    document.getElementById("hpValue").innerText = enemyHP;
    document.getElementById("hpBar").style.width = (enemyHP / 10) + "%";
}

function showResults() {
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("result-screen").style.display = "flex";
    
    const list = document.getElementById("result-list");
    list.innerHTML = "";
    attackHistory.forEach((atk, idx) => {
        list.innerHTML += `<div class="result-item">
            <span>ATTACK ${idx + 1}: [${atk.parts}]</span>
            <span style="color:#ff00ff">${atk.damage} DMG</span>
        </div>`;
    });
}
