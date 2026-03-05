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

const partImages = {
    "HEAD": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj1rjxRdqjv0ro97FAExrFQ4dAiGrLHX4vHkL0Zp7ExRTs56lqQzWt0T4TnfDIi1NKkQf51134toAPvJtmfcoPYnbHMNyE0W5_Hhg2Okr-vChDF9TP2P4NbzVHEAy07YmZTleG1M4lYcekw/s400/body_zugaikotsu_skull.png",
    "BODY": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTeU_cNvLjGF98H_HiEHDMlB0_eB-tHtHYjJ9mGcErmndF2dPFUSlFf19N_BbUbdq9ds-d4ecEoMFAvTn-MUDrRiqykuUSfW4T3FbcyoXQfZQ052I6R5q2cMZV1zJhY5L0Vax1tiZlY_Y/s400/body_shinzou.png",
    "ARMS": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhBMex3yPXGQ_lT4ySIeZsPYYUXA5MCpjz45kdzzRARRMu7eYfIaLMHy6C8DYiGhm3i2tsD7iRhKqlQ76KkqqadZN1Ey05Suw4FQsp5MpuFRwxj3y1I6tyBW1OBvPWUlBzfbY629jkGSWU/s200/rubber_band_white.png",
    "LEGS": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjECz0u4eiFupkK9nXyfsftjtPNwUybjhstTxfjCs1SpG3VstoYjBrax9bmPrt3_NG0KVjNvzFLbvYUbfqSMTax-yhKVOST_Oy395k9wfU0fWAl825RqLD0xp82GqRizwq31bn1kUtLtCV6/s400/body_foot_side_long_sotogawa.png"
};

// 画像のプリロード
Object.values(partImages).forEach(src => {
    const img = new Image();
    img.src = src;
});

const tutorialModal = document.getElementById("tutorial-panel");
document.getElementById("close-tutorial").onclick = () => tutorialModal.classList.add("hide-to-menu");
document.getElementById("start-tutorial-btn").onclick = () => tutorialModal.classList.add("hide-to-menu");
document.getElementById("menu-btn").onclick = () => tutorialModal.classList.remove("hide-to-menu");

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

// ▼▼▼ ここを修正（リトライ時のボタン復活） ▼▼▼
document.getElementById("retryBtn").onclick = () => {
    enemyHP = 1000;
    attackHistory = [];
    updateHP();
    shootBtn.disabled = false; // ★ ここを追加してボタンを押せるようにしました！
    document.getElementById("result-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "flex";
};

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

function shootProjectile(imgSrc) {
    const proj = document.createElement("img");
    proj.src = imgSrc;
    proj.className = "projectile";
    document.body.appendChild(proj);

    const bossRect = bossImage.getBoundingClientRect();
    const targetX = bossRect.left + bossRect.width / 2 - 50; 
    const targetY = bossRect.top + bossRect.height / 2 - 50; 

    const startX = window.innerWidth + 100; 
    const startY = targetY + (Math.random() * 80 - 40); 

    const animation = proj.animate([
        { transform: `translate(${startX}px, ${startY}px) rotate(0deg) scale(1)` },
        { transform: `translate(${targetX}px, ${targetY}px) rotate(-720deg) scale(0.6)` }
    ], {
        duration: 600, 
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
    });

    animation.onfinish = () => proj.remove(); 
}

function showDamageEffect(dmg) {
    const rect = bossImage.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "dmg-popup";
    el.innerText = `-${dmg} DMG!!`;
    
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top + rect.height / 2}px`;
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

shootBtn.onclick = async () => {
    if (poses.length === 0) return;
    shootBtn.disabled = true;
    
    const pose = poses[0].pose;
    let damage = 0;
    let hitParts = [];
    let baseParts = []; 
    const THRESHOLD = 0.2;

    if (pose.nose.confidence > THRESHOLD) { damage += 150; hitParts.push("HEAD"); baseParts.push("HEAD"); }
    if (pose.leftShoulder.confidence > THRESHOLD || pose.rightShoulder.confidence > THRESHOLD) { damage += 80; hitParts.push("BODY"); baseParts.push("BODY"); }

    let armCount = 0;
    ['leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) armCount++; });
    if (armCount > 0) { damage += (armCount * 30); hitParts.push(`ARMS(x${armCount})`); baseParts.push("ARMS"); }

    let legCount = 0;
    ['leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) legCount++; });
    if (legCount > 0) { damage += (legCount * 40); hitParts.push(`LEGS(x${legCount})`); baseParts.push("LEGS"); }

    if (damage === 0) { damage = 10; hitParts.push("GRAZE"); baseParts.push("ARMS"); } 

    attackHistory.push({ damage: damage, parts: hitParts.join(" + ") });

    baseParts.forEach((part, index) => {
        setTimeout(() => { shootProjectile(partImages[part]); }, index * 150);
    });

    const hitDelay = (baseParts.length > 0 ? (baseParts.length - 1) * 150 : 0) + 600;

    setTimeout(() => {
        bossImage.classList.add("boss-hit");
        setTimeout(() => bossImage.classList.remove("boss-hit"), 300);

        showDamageEffect(damage);
        enemyHP = Math.max(0, enemyHP - damage);
        updateHP();

        if (enemyHP <= 0) setTimeout(showResults, 1000);
        else shootBtn.disabled = false;
    }, hitDelay);

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
