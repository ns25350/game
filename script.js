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
let attackHistory = [];

const video = document.getElementById("video");
const shootBtn = document.getElementById("shootBtn");
const status = document.getElementById("status");
const hpBar = document.getElementById("hpBar");
const hpValue = document.getElementById("hpValue");
const bossImage = document.getElementById("boss-image");

// === 弾丸用イメージの登録 ===
const partImages = {
    "HEAD": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj1rjxRdqjv0ro97FAExrFQ4dAiGrLHX4vHkL0Zp7ExRTs56lqQzWt0T4TnfDIi1NKkQf51134toAPvJtmfcoPYnbHMNyE0W5_Hhg2Okr-vChDF9TP2P4NbzVHEAy07YmZTleG1M4lYcekw/s400/body_zugaikotsu_skull.png",
    "BODY": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTeU_cNvLjGF98H_HiEHDMlB0_eB-tHtHYjJ9mGcErmndF2dPFUSlFf19N_BbUbdq9ds-d4ecEoMFAvTn-MUDrRiqykuUSfW4T3FbcyoXQfZQ052I6R5q2cMZV1zJhY5L0Vax1tiZlY_Y/s400/body_shinzou.png",
    "ARMS": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhBMex3yPXGQ_lT4ySIeZsPYYUXA5MCpjz45kdzzRARRMu7eYfIaLMHy6C8DYiGhm3i2tsD7iRhKqlQ76KkqqadZN1Ey05Suw4FQsp5MpuFRwxj3y1I6tyBW1OBvPWUlBzfbY629jkGSWU/s200/rubber_band_white.png",
    "LEGS": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjECz0u4eiFupkK9nXyfsftjtPNwUybjhstTxfjCs1SpG3VstoYjBrax9bmPrt3_NG0KVjNvzFLbvYUbfqSMTax-yhKVOST_Oy395k9wfU0fWAl825RqLD0xp82GqRizwq31bn1kUtLtCV6/s400/body_foot_side_long_sotogawa.png"
};

// --- UI要素 ---
const tutorialModal = document.getElementById("tutorial-panel");
document.getElementById("close-tutorial").onclick = () => tutorialModal.classList.add("hide-to-menu");
document.getElementById("start-tutorial-btn").onclick = () => tutorialModal.classList.add("hide-to-menu");
document.getElementById("menu-btn").onclick = () => tutorialModal.classList.remove("hide-to-menu");

// --- ロード & 同意画面 ---
window.onload = () => {
    let width = 0;
    const bar = document.getElementById("load-progress-bar");
    const timer = setInterval(() => {
        width += 2; bar.style.width = width + "%";
        if (width >= 100) {
            clearInterval(timer);
            document.getElementById("loading-screen").style.display = "none";
            document.getElementById("tos-screen").style.display = "flex";
        }
    }, 30);
};

document.getElementById("agreeBtn").onclick = () => {
    document.getElementById("tos-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "flex";
    initGame();
};

document.getElementById("retryBtn").onclick = () => {
    enemyHP = 1000;
    attackHistory = [];
    updateHP();
    document.getElementById("result-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "flex";
};

// --- ゲーム初期化 ---
async function initGame() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
        video.onloadeddata = () => {
            video.play();
            poseNet = ml5.poseNet(video, () => {
                shootBtn.disabled = false;
                shootBtn.innerText = "ATTACK START";
            });
            poseNet.on('pose', (results) => { poses = results; });
            drawLoop();
        };
    } catch (e) {}
}

// --- 描画ループ ---
function drawLoop() {
    const canvas = document.getElementById("output_canvas");
    const ctx = canvas.getContext("2d");
    if (video.videoWidth > 0 && canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (poses.length > 0) {
        const pose = poses[0].pose;
        const skeleton = poses[0].skeleton;
        pose.keypoints.forEach(kp => {
            if (kp.score > 0.2) {
                ctx.fillStyle = "#39ff14"; ctx.beginPath(); ctx.arc(kp.position.x, kp.position.y, 5, 0, 2 * Math.PI); ctx.fill();
            }
        });
        skeleton.forEach(bone => {
            ctx.strokeStyle = "#39ff14"; ctx.lineWidth = 2; ctx.beginPath();
            ctx.moveTo(bone[0].position.x, bone[0].position.y);
            ctx.lineTo(bone[1].position.x, bone[1].position.y); ctx.stroke();
        });
    }
    requestAnimationFrame(drawLoop);
}

// === 弾を撃つアニメーション関数 ===
function shootProjectile(imgSrc) {
    const proj = document.createElement("img");
    proj.src = imgSrc;
    proj.className = "projectile";
    document.body.appendChild(proj);

    // ボスの座標を取得
    const bossRect = bossImage.getBoundingClientRect();
    const targetX = bossRect.left + bossRect.width / 2 - 30; // ボスの中心X
    const targetY = bossRect.top + bossRect.height / 2 - 30; // ボスの中心Y

    // 画面右外からスタート
    const startX = window.innerWidth + 50; 
    const startY = targetY + (Math.random() * 100 - 50); // 高さは少しバラけさせる

    // Web Animations APIで飛ばす
    const animation = proj.animate([
        { transform: `translate(${startX}px, ${startY}px) rotate(0deg) scale(1)` },
        { transform: `translate(${targetX}px, ${targetY}px) rotate(-720deg) scale(0.5)` }
    ], {
        duration: 400, // 0.4秒で着弾
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
    });

    animation.onfinish = () => proj.remove(); // 着弾したら画像を消す
}

// --- ボスにダメージ文字を出す関数 ---
function showDamageEffect(dmg) {
    const rect = bossImage.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "dmg-popup";
    el.innerText = `-${dmg} DMG!!`;
    
    // ボスの真ん中座標を指定
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top + rect.height / 2}px`;
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// --- 攻撃アクション ---
shootBtn.onclick = async () => {
    if (poses.length === 0) return;
    shootBtn.disabled = true;
    
    const pose = poses[0].pose;
    let damage = 0;
    let hitParts = [];
    let baseParts = []; // アニメーションさせるイラストの種類
    const THRESHOLD = 0.2;

    if (pose.nose.confidence > THRESHOLD) { damage += 150; hitParts.push("HEAD"); baseParts.push("HEAD"); }
    if (pose.leftShoulder.confidence > THRESHOLD || pose.rightShoulder.confidence > THRESHOLD) { damage += 80; hitParts.push("BODY"); baseParts.push("BODY"); }

    let armCount = 0;
    ['leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) armCount++; });
    if (armCount > 0) { damage += (armCount * 30); hitParts.push(`ARMS(x${armCount})`); baseParts.push("ARMS"); }

    let legCount = 0;
    ['leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) legCount++; });
    if (legCount > 0) { damage += (legCount * 40); hitParts.push(`LEGS(x${legCount})`); baseParts.push("LEGS"); }

    if (damage === 0) { damage = 10; hitParts.push("GRAZE"); baseParts.push("ARMS"); } // 当たらなかった時は輪ゴムを飛ばす

    attackHistory.push({ damage: damage, parts: hitParts.join(" + ") });

    // 1. 弾を右から左へ発射！ (複数箇所当たった場合は少し時間をズラして連射する)
    baseParts.forEach((part, index) => {
        setTimeout(() => {
            shootProjectile(partImages[part]);
        }, index * 150); // 0.15秒間隔で連射
    });

    // 弾がボスの位置に到達する時間（400ms） + 連射の遅延分 を計算
    const hitDelay = (baseParts.length > 0 ? (baseParts.length - 1) * 150 : 0) + 400;

    // 2. 着弾したタイミングでHPを減らし、揺らしてダメージを出す
    setTimeout(() => {
        bossImage.classList.add("boss-hit");
        setTimeout(() => bossImage.classList.remove("boss-hit"), 300); // 揺れを戻す

        showDamageEffect(damage);
        enemyHP = Math.max(0, enemyHP - damage);
        updateHP();

        if (enemyHP <= 0) setTimeout(showResults, 1000);
        else shootBtn.disabled = false;
    }, hitDelay);

    // Firebase保存 (省略せず裏で実行)
    const saveCanvas = document.getElementById("saveCanvas");
    saveCanvas.width = video.videoWidth; saveCanvas.height = video.videoHeight;
    saveCanvas.getContext("2d").drawImage(video, 0, 0);
    try {
        await push(ref(db, 'game_logs'), { image: saveCanvas.toDataURL("image/webp", 0.3), totalDamage: damage, parts: hitParts });
    } catch (e) {}
};

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
        list.innerHTML += `<div class="result-item"><span>[LOG_${idx + 1}] ${atk.parts}</span><span class="neon-text-pink">${atk.damage} DMG</span></div>`;
    });
}
