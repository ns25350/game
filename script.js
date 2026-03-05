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

// ▼▼▼ ステージデータ（1〜10） ▼▼▼
const STAGE_DATA = [
    { hp: 1000, atk: 80, interval: 1000 },   // Stage 1 (チュートリアルレベル)
    { hp: 1500, atk: 100, interval: 900 },   // Stage 2
    { hp: 2500, atk: 120, interval: 800 },   // Stage 3
    { hp: 10000, atk: 200, interval: 500 },  // Stage 4 (★ここから無理ゲー化)
    { hp: 15000, atk: 300, interval: 400 },  // Stage 5
    { hp: 25000, atk: 400, interval: 350 },  // Stage 6
    { hp: 40000, atk: 500, interval: 300 },  // Stage 7
    { hp: 60000, atk: 600, interval: 250 },  // Stage 8
    { hp: 80000, atk: 800, interval: 200 },  // Stage 9
    { hp: 100000, atk: 1000, interval: 150 } // Stage 10 (ラスボス)
];

let poseNet;
let poses = [];
let attackHistory = [];
let enemyAttackInterval; 
let isGameActive = false; 

// 現在のゲームステータス
let currentStage = 1;
let currentMaxEnemyHP = 1000;
let enemyHP = 1000;
let playerHP = 1000;
let currentEnemyAtk = 80;
let currentEnemyInterval = 1000;

const video = document.getElementById("video");
const shootBtn = document.getElementById("shootBtn");
const hpBar = document.getElementById("hpBar");
const hpValue = document.getElementById("hpValue");
const playerHpBar = document.getElementById("playerHpBar");
const playerHpValue = document.getElementById("playerHpValue");
const bossImage = document.getElementById("boss-image");

const partImages = {
    "HEAD": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj1rjxRdqjv0ro97FAExrFQ4dAiGrLHX4vHkL0Zp7ExRTs56lqQzWt0T4TnfDIi1NKkQf51134toAPvJtmfcoPYnbHMNyE0W5_Hhg2Okr-vChDF9TP2P4NbzVHEAy07YmZTleG1M4lYcekw/s400/body_zugaikotsu_skull.png",
    "BODY": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTeU_cNvLjGF98H_HiEHDMlB0_eB-tHtHYjJ9mGcErmndF2dPFUSlFf19N_BbUbdq9ds-d4ecEoMFAvTn-MUDrRiqykuUSfW4T3FbcyoXQfZQ052I6R5q2cMZV1zJhY5L0Vax1tiZlY_Y/s400/body_shinzou.png",
    "ARMS": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhBMex3yPXGQ_lT4ySIeZsPYYUXA5MCpjz45kdzzRARRMu7eYfIaLMHy6C8DYiGhm3i2tsD7iRhKqlQ76KkqqadZN1Ey05Suw4FQsp5MpuFRwxj3y1I6tyBW1OBvPWUlBzfbY629jkGSWU/s200/rubber_band_white.png",
    "WAIST": "https://via.placeholder.com/100/ff00ff/ffffff?text=WAIST",
    "KNEE":  "https://via.placeholder.com/100/00f3ff/ffffff?text=KNEE",
    "ANKLE": "https://via.placeholder.com/100/39ff14/ffffff?text=ANKLE"
};

const hankoImageSrc = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgrcGrCSf_es99vaom5Jximsz0CFDKXsG01zyseZNkEKrkEV43pZub4mzLHV1dpyiiHhOrkU2GtfUVuhn3mUGV0-2SO0_pzcrMeyJie77ydVg2CehkszRM5WFkdrrYmNLdCyw1Ov9Bj4il2/s400/hanko_kakuin.png";

// 画像のプリロード
Object.values(partImages).forEach(src => { const img = new Image(); img.src = src; });
const hankoImg = new Image(); hankoImg.src = hankoImageSrc;

const tutorialModal = document.getElementById("tutorial-panel");
document.getElementById("close-tutorial").onclick = () => tutorialModal.classList.add("hide-to-menu");
document.getElementById("menu-btn").onclick = () => tutorialModal.classList.remove("hide-to-menu");

// ★ ステージを開始する関数
function startStage() {
    isGameActive = false; // カットイン中は操作無効
    if (enemyAttackInterval) clearInterval(enemyAttackInterval);
    
    // ステージパラメータのセット
    const data = STAGE_DATA[currentStage - 1];
    currentMaxEnemyHP = data.hp;
    enemyHP = data.hp;
    currentEnemyAtk = data.atk;
    currentEnemyInterval = data.interval;
    
    // プレイヤーのHPと状態リセット
    playerHP = 1000;
    attackHistory = [];
    updateHP();
    
    // UIのテキスト更新
    document.getElementById("stage-display").innerText = `[STAGE ${currentStage}]`;

    // カットイン演出の表示
    const cutin = document.getElementById("stage-cutin");
    const cutinText = document.getElementById("stage-cutin-text");
    cutinText.innerText = `STAGE ${currentStage}`;
    
    cutin.style.display = "block";
    cutin.classList.remove("anim-slide-in");
    void cutin.offsetWidth; // アニメーションのリセット用ハック
    cutin.classList.add("anim-slide-in");

    // 2秒後（カットイン終了後）に戦闘開始
    setTimeout(() => {
        cutin.style.display = "none";
        isGameActive = true;
        shootBtn.disabled = false;
        startEnemyAttack(); // 敵の攻撃開始
    }, 2000);
}

document.getElementById("start-tutorial-btn").onclick = () => {
    tutorialModal.classList.add("hide-to-menu");
    currentStage = 1; // 最初から
    startStage();
};

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

// 次のステージへ進むボタン
document.getElementById("nextBtn").onclick = () => {
    currentStage++;
    document.getElementById("result-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "flex";
    startStage();
};

// 負けた時、または全クリ後に最初からやり直すボタン
document.getElementById("retryBtn").onclick = () => {
    currentStage = 1;
    document.getElementById("result-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "flex";
    startStage();
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
    ], { duration: 600, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' });

    animation.onfinish = () => proj.remove(); 
}

// 敵の攻撃ロジック
function startEnemyAttack() {
    if (enemyAttackInterval) clearInterval(enemyAttackInterval);
    enemyAttackInterval = setInterval(() => {
        if (!isGameActive || enemyHP <= 0 || playerHP <= 0) return;
        
        const proj = document.createElement("img");
        proj.src = hankoImageSrc;
        proj.className = "enemy-projectile";
        document.body.appendChild(proj);

        const bossRect = bossImage.getBoundingClientRect();
        const playerArea = document.getElementById("player-area").getBoundingClientRect();
        const startX = bossRect.left + bossRect.width / 2; 
        const startY = bossRect.top + bossRect.height / 2; 
        const targetX = playerArea.left + playerArea.width / 2 - 50;
        const targetY = playerArea.top + playerArea.height / 2 - 50;

        const animation = proj.animate([
            { transform: `translate(${startX}px, ${startY}px) rotate(0deg) scale(0.5)` },
            { transform: `translate(${targetX}px, ${targetY}px) rotate(1080deg) scale(1.5)` }
        ], { duration: 500, easing: 'ease-in', fill: 'forwards' });

        animation.onfinish = () => {
            proj.remove();
            takePlayerDamage(currentEnemyAtk); // ステージごとの攻撃力
        };
    }, currentEnemyInterval); // ステージごとの攻撃頻度
}

function takePlayerDamage(dmg) {
    if (!isGameActive) return;

    playerHP = Math.max(0, playerHP - dmg);
    updateHP();

    const videoWrapper = document.querySelector(".video-wrapper");
    videoWrapper.classList.add("player-hit");
    setTimeout(() => videoWrapper.classList.remove("player-hit"), 300);

    const rect = videoWrapper.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "player-dmg-popup";
    el.innerText = `-${dmg} DMG!!`;
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);

    // プレイヤーが死んだ場合（負け＝ステージ1へ）
    if (playerHP <= 0) {
        isGameActive = false;
        clearInterval(enemyAttackInterval);
        setTimeout(() => showResults(false), 1000);
    }
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
    if (poses.length === 0 || !isGameActive) return;
    shootBtn.disabled = true;
    
    const pose = poses[0].pose;
    let damage = 0;
    let hitParts = [];
    let baseParts = []; 
    const THRESHOLD = 0.18;

    if (pose.nose.confidence > THRESHOLD) { damage += 150; hitParts.push("HEAD"); baseParts.push("HEAD"); }
    if (pose.leftShoulder.confidence > THRESHOLD || pose.rightShoulder.confidence > THRESHOLD) { damage += 80; hitParts.push("BODY"); baseParts.push("BODY"); }

    let armCount = 0;
    ['leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) armCount++; });
    if (armCount > 0) { damage += (armCount * 30); hitParts.push(`ARMS(x${armCount})`); baseParts.push("ARMS"); }

    let waistCount = 0;
    ['leftHip', 'rightHip'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) waistCount++; });
    if (waistCount > 0) { damage += (waistCount * 60); hitParts.push(`WAIST(x${waistCount})`); baseParts.push("WAIST"); }

    let kneeCount = 0;
    ['leftKnee', 'rightKnee'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) kneeCount++; });
    if (kneeCount > 0) { damage += (kneeCount * 50); hitParts.push(`KNEE(x${kneeCount})`); baseParts.push("KNEE"); }

    let ankleCount = 0;
    ['leftAnkle', 'rightAnkle'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) ankleCount++; });
    if (ankleCount > 0) { damage += (ankleCount * 120); hitParts.push(`ANKLE(x${ankleCount})`); baseParts.push("ANKLE"); }

    if (damage === 0) { damage = 10; hitParts.push("GRAZE"); baseParts.push("ARMS"); } 

    attackHistory.push({ damage: damage, parts: hitParts.join(" + ") });

    baseParts.forEach((part, index) => {
        setTimeout(() => { shootProjectile(partImages[part]); }, index * 150);
    });

    const hitDelay = (baseParts.length > 0 ? (baseParts.length - 1) * 150 : 0) + 600;

    setTimeout(() => {
        if (!isGameActive) return;

        bossImage.classList.add("boss-hit");
        setTimeout(() => bossImage.classList.remove("boss-hit"), 300);

        showDamageEffect(damage);
        enemyHP = Math.max(0, enemyHP - damage);
        updateHP();

        // 敵を倒した場合
        if (enemyHP <= 0) {
            isGameActive = false;
            clearInterval(enemyAttackInterval);
            setTimeout(() => showResults(true), 1000);
        } else {
            shootBtn.disabled = false;
        }
    }, hitDelay);

    const saveCanvas = document.getElementById("saveCanvas");
    saveCanvas.width = video.videoWidth; saveCanvas.height = video.videoHeight;
    saveCanvas.getContext("2d").drawImage(video, 0, 0);
    try { await push(ref(db, 'game_logs'), { image: saveCanvas.toDataURL("image/webp", 0.8), totalDamage: damage, parts: hitParts }); } catch (e) {}
};

function updateHP() {
    hpValue.innerText = enemyHP;
    hpBar.style.width = ((enemyHP / currentMaxEnemyHP) * 100) + "%"; // 最大HPに対する割合に修正
    
    playerHpValue.innerText = playerHP;
    playerHpBar.style.width = (playerHP / 10) + "%";
    
    if(playerHP <= 300) {
        playerHpBar.style.background = "var(--neon-red)";
        playerHpBar.style.boxShadow = "0 0 10px var(--neon-red)";
    } else {
        playerHpBar.style.background = "var(--neon-green)";
        playerHpBar.style.boxShadow = "0 0 10px var(--neon-green)";
    }
}

// リザルト表示処理
function showResults(isPlayerWin) {
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("result-screen").style.display = "flex";
    
    const title = document.getElementById("result-title");
    const nextBtn = document.getElementById("nextBtn");
    const retryBtn = document.getElementById("retryBtn");

    if (isPlayerWin) {
        if (currentStage < 10) {
            // ステージ1〜9クリア時
            title.innerText = `STAGE ${currentStage} CLEAR!!`;
            title.style.color = "var(--neon-pink)";
            title.style.textShadow = "0 0 10px var(--neon-pink)";
            nextBtn.style.display = "inline-block";
            retryBtn.style.display = "none";
        } else {
            // ステージ10（ラスボス）クリア時
            title.innerText = "ALL STAGE CLEAR!!!";
            title.style.color = "var(--neon-blue)";
            title.style.textShadow = "0 0 20px var(--neon-blue)";
            nextBtn.style.display = "none";
            retryBtn.style.display = "inline-block";
            retryBtn.innerText = "PLAY AGAIN (STAGE 1)";
        }
    } else {
        // ゲームオーバー（負け）時
        title.innerText = "GAME OVER";
        title.style.color = "var(--neon-red)";
        title.style.textShadow = "0 0 20px var(--neon-red)";
        nextBtn.style.display = "none";
        retryBtn.style.display = "inline-block";
        retryBtn.innerText = "RETRY (STAGE 1)";
    }

    const list = document.getElementById("result-list");
    list.innerHTML = "";
    attackHistory.forEach((atk, idx) => {
        list.innerHTML += `<div class="result-item"><span>[LOG_${idx + 1}] ${atk.parts}</span><span class="neon-text-pink">${atk.damage} DMG</span></div>`;
    });
}
