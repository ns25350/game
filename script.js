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

const STAGE_DATA = [
    { hp: 1000, atk: 80, interval: 1000 },
    { hp: 1500, atk: 100, interval: 900 },
    { hp: 2500, atk: 120, interval: 800 },
    { hp: 10000, atk: 200, interval: 500 },
    { hp: 15000, atk: 300, interval: 400 },
    { hp: 25000, atk: 400, interval: 350 },
    { hp: 40000, atk: 500, interval: 300 },
    { hp: 60000, atk: 600, interval: 250 },
    { hp: 80000, atk: 800, interval: 200 },
    { hp: 100000, atk: 1000, interval: 150 }
];

const baseValues = [150, 80, 60, 30, 50, 120];
let currentDamages = { "HEAD": 150, "BODY": 80, "WAIST": 60, "ARMS": 30, "KNEE": 50, "ANKLE": 120 };
let buffAttacksLeft = 0; 

// ▼ プレイヤーステータス管理 ▼
let playerStats = {
    maxHp: 1000,
    baseAtk: 10,
    critRate: 5,   // %
    critDmg: 50    // %
};
let availableMaterials = 0;
let playerHP = 1000;

let poseNet;
let poses = [];
let attackHistory = [];
let enemyAttackInterval; 
let isGameActive = false; 

let currentStage = 1;
let currentMaxEnemyHP = 1000;
let enemyHP = 1000;
let currentEnemyAtk = 80;
let currentEnemyInterval = 1000;

const THRESHOLD = 0.18;

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
    "WAIST": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgBhvyH-tG8AtVzGLg-HCBRE63yzgVKFkMW2whVV_UiZLdfRMj1pt8BXYBWZ9qSFTpyaQzU6Pj9pHK34KiaqKsp_Px56WFGHqTayGQj1VsbtfM9Ih_6FXYiyL60j3p2XXYvgp5cc7Z607t_/s400/sick_gikkurigoshi_man2.png",
    "KNEE":  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgxPVZ7XkGHBbQ9LGdjOU6XDCEqf9L0RTKn54o25yTZWsllDVCy29lfb60F4OVq1CKSngf1jyjKGOCTtVIs0W_hCoytyubKkghjIgcNPXDth-THloV7qqUvGH6lJG-_u645vcvqqpDKgQtd/s400/body_hizamae_juuji_jintai.png",
    "ANKLE": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhBRYoWa6FwxmvgM6ZZtPFXhX1L8t3547VkYjHoByFYw2Tm4qrpVCOer_RcsptOV7l9R3MWprbFunTwZM1rRGx9jWN70zWf5qwhJUvSkvn6rgLQ9fM3Gbv_Xf0qbBepoUn-rCLybkv6CQam/s400/body_foot_kakato.png"
};

const hankoImageSrc = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgrcGrCSf_es99vaom5Jximsz0CFDKXsG01zyseZNkEKrkEV43pZub4mzLHV1dpyiiHhOrkU2GtfUVuhn3mUGV0-2SO0_pzcrMeyJie77ydVg2CehkszRM5WFkdrrYmNLdCyw1Ov9Bj4il2/s400/hanko_kakuin.png";

Object.values(partImages).forEach(src => { const img = new Image(); img.src = src; });
const hankoImg = new Image(); hankoImg.src = hankoImageSrc;

const tutorialModal = document.getElementById("tutorial-panel");
document.getElementById("close-tutorial").onclick = () => tutorialModal.classList.add("hide-to-menu");
document.getElementById("menu-btn").onclick = () => tutorialModal.classList.remove("hide-to-menu");

function shuffleDamages() {
    let values = [...baseValues];
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    const keys = ["HEAD", "BODY", "WAIST", "ARMS", "KNEE", "ANKLE"];
    keys.forEach((key, index) => {
        currentDamages[key] = values[index];
    });
}

function prepareStage() {
    shuffleDamages();
    buffAttacksLeft = 0; 
    
    document.getElementById("stage-info-title").innerText = `STAGE ${currentStage} BRIEFING`;
    const list = document.getElementById("stage-info-list");
    list.innerHTML = "";
    for(let key in currentDamages) {
        list.innerHTML += `<li><span class="part">${key}</span>: ${currentDamages[key]} DMG (Base +${playerStats.baseAtk})</li>`;
    }
    
    let desc = "⚠️ 各部位の攻撃力がシャッフルされた！";
    if (currentStage >= 3 && currentStage <= 6) {
        desc += "<br><br><span style='color:#ffeb3b; text-shadow: 0 0 10px #ffeb3b;'>【特殊ルール発動】<br>KNEE（膝）をスキャンすると、次の2回の攻撃ダメージが2倍になるぞ！！</span>";
    }
    document.getElementById("stage-info-desc").innerHTML = desc;
    
    document.getElementById("game-screen").style.display = "flex";
    document.getElementById("stage-info-panel").classList.remove("hide-to-menu");
}

document.getElementById("start-tutorial-btn").onclick = () => {
    tutorialModal.classList.add("hide-to-menu");
    currentStage = 1;
    // ステータス初期化
    playerStats = { maxHp: 1000, baseAtk: 10, critRate: 5, critDmg: 50 };
    availableMaterials = 0;
    playerHP = playerStats.maxHp;
    currentDamages = { "HEAD": 150, "BODY": 80, "WAIST": 60, "ARMS": 30, "KNEE": 50, "ANKLE": 120 };
    buffAttacksLeft = 0;
    document.getElementById("game-screen").style.display = "flex";
    startStageSequence();
};

document.getElementById("start-stage-btn").onclick = () => {
    document.getElementById("stage-info-panel").classList.add("hide-to-menu");
    startStageSequence();
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

// ▼ 次のステージへ行く前に「強化フェーズ」を挟む ▼
document.getElementById("nextBtn").onclick = () => {
    document.getElementById("result-screen").style.display = "none";
    
    // ステージレベルに応じて強化素材付与 (例: ステージ1クリアなら1個、ステージ3なら2個等)
    let materialEarned = 1 + Math.floor((currentStage - 1) / 2); 
    availableMaterials += materialEarned;

    currentStage++;

    if(currentStage === 2) {
        // ステージ2の前だけ味方キャラの解説を入れる
        document.getElementById("ally-dialogue").style.display = "flex";
    } else {
        openUpgradeScreen();
    }
};

document.getElementById("ally-text").onclick = () => {
    document.getElementById("ally-dialogue").style.display = "none";
    openUpgradeScreen();
};

document.getElementById("retryBtn").onclick = () => {
    currentStage = 1;
    playerStats = { maxHp: 1000, baseAtk: 10, critRate: 5, critDmg: 50 };
    availableMaterials = 0;
    document.getElementById("result-screen").style.display = "none";
    currentDamages = { "HEAD": 150, "BODY": 80, "WAIST": 60, "ARMS": 30, "KNEE": 50, "ANKLE": 120 };
    buffAttacksLeft = 0;
    startStageSequence(); 
};

// ▼ 強化画面の処理 ▼
function openUpgradeScreen() {
    document.getElementById("upgrade-screen").style.display = "flex";
    updateUpgradeUI();
}

function updateUpgradeUI() {
    document.getElementById("upgrade-points").innerText = availableMaterials;
    document.getElementById("stat-hp-val").innerText = playerStats.maxHp;
    document.getElementById("stat-atk-val").innerText = playerStats.baseAtk;
    document.getElementById("stat-crate-val").innerText = playerStats.critRate + "%";
    document.getElementById("stat-cdmg-val").innerText = playerStats.critDmg + "%";

    const btns = document.querySelectorAll(".upgrade-btn");
    btns.forEach(btn => {
        btn.disabled = availableMaterials <= 0;
    });
}

document.querySelectorAll(".upgrade-btn").forEach(btn => {
    btn.onclick = (e) => {
        if(availableMaterials <= 0) return;
        availableMaterials--;
        const stat = e.target.getAttribute("data-stat");
        
        if(stat === "hp") {
            playerStats.maxHp += 1000;
        } else if(stat === "atk") {
            playerStats.baseAtk += 20;
        } else if(stat === "crate") {
            playerStats.critRate += 20;
        } else if(stat === "cdmg") {
            playerStats.critDmg += 40;
        }
        updateUpgradeUI();
    };
});

document.getElementById("finish-upgrade-btn").onclick = () => {
    document.getElementById("upgrade-screen").style.display = "none";
    prepareStage();
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
            if (kp.score > THRESHOLD) {
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

function startStageSequence() {
    isGameActive = false;
    if (enemyAttackInterval) clearInterval(enemyAttackInterval);
    
    const data = STAGE_DATA[currentStage - 1];
    currentMaxEnemyHP = data.hp;
    enemyHP = data.hp;
    currentEnemyAtk = data.atk;
    currentEnemyInterval = data.interval;
    
    // ステージ開始時はHPを全回復
    playerHP = playerStats.maxHp;
    attackHistory = [];
    updateHP();
    
    document.getElementById("stage-display").innerText = `[STAGE ${currentStage}]`;

    const cutin = document.getElementById("stage-cutin");
    const cutinText = document.getElementById("stage-cutin-text");
    cutinText.innerText = `STAGE ${currentStage}`;
    
    cutin.style.display = "block";
    cutin.classList.remove("anim-slide-in");
    void cutin.offsetWidth;
    cutin.classList.add("anim-slide-in");

    setTimeout(() => {
        cutin.style.display = "none";
        isGameActive = true;
        shootBtn.disabled = false;
        startEnemyAttack();
    }, 2000);
}

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
            takePlayerDamage(currentEnemyAtk);
        };
    }, currentEnemyInterval); 
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

    if (playerHP <= 0) {
        isGameActive = false;
        clearInterval(enemyAttackInterval);
        setTimeout(() => showResults(false), 1000);
    }
}

function showDamageEffect(dmg, isCrit) {
    const rect = bossImage.getBoundingClientRect();
    const el = document.createElement("div");
    
    if(isCrit) {
        el.className = "crit-popup";
        el.innerText = `CRITICAL!\n-${dmg} DMG!!`;
    } else {
        el.className = "dmg-popup";
        el.innerText = `-${dmg} DMG!!`;
    }

    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// ▼ ダメージ計算処理 (基礎攻撃力 + 部位攻撃力) * 会心補正 ▼
function calcPartDamage(partBaseDamage) {
    let atk = playerStats.baseAtk + partBaseDamage;
    let isCrit = (Math.random() * 100) < playerStats.critRate;
    let critMult = isCrit ? (1 + (playerStats.critDmg / 100)) : 1;
    return { damage: Math.floor(atk * critMult), isCrit: isCrit };
}

shootBtn.onclick = async () => {
    if (poses.length === 0 || !isGameActive) return;
    shootBtn.disabled = true;
    
    const pose = poses[0].pose;
    let totalDamage = 0;
    let hitParts = [];
    let baseParts = []; 
    let anyCrit = false;

    let headCount = 0;
    if (pose.nose.confidence > THRESHOLD) headCount++;
    if (headCount > 0) { 
        let calc = calcPartDamage(currentDamages.HEAD);
        totalDamage += calc.damage; if(calc.isCrit) anyCrit = true;
        hitParts.push("HEAD" + (calc.isCrit ? "★" : "")); 
        baseParts.push("HEAD"); 
    }

    let bodyCount = 0;
    if (pose.leftShoulder.confidence > THRESHOLD || pose.rightShoulder.confidence > THRESHOLD) bodyCount++;
    if (bodyCount > 0) { 
        let calc = calcPartDamage(currentDamages.BODY);
        totalDamage += calc.damage; if(calc.isCrit) anyCrit = true;
        hitParts.push("BODY" + (calc.isCrit ? "★" : "")); 
        baseParts.push("BODY"); 
    }

    let armCount = 0;
    ['leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) armCount++; });
    if (armCount > 0) { 
        let calc = calcPartDamage(currentDamages.ARMS);
        totalDamage += (calc.damage * armCount); if(calc.isCrit) anyCrit = true;
        hitParts.push(`ARMS(x${armCount})` + (calc.isCrit ? "★" : "")); 
        baseParts.push("ARMS"); 
    }

    let waistCount = 0;
    ['leftHip', 'rightHip'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) waistCount++; });
    if (waistCount > 0) { 
        let calc = calcPartDamage(currentDamages.WAIST);
        totalDamage += (calc.damage * waistCount); if(calc.isCrit) anyCrit = true;
        hitParts.push(`WAIST(x${waistCount})` + (calc.isCrit ? "★" : "")); 
        baseParts.push("WAIST"); 
    }

    let kneeCount = 0;
    ['leftKnee', 'rightKnee'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) kneeCount++; });
    if (kneeCount > 0) { 
        let calc = calcPartDamage(currentDamages.KNEE);
        totalDamage += (calc.damage * kneeCount); if(calc.isCrit) anyCrit = true;
        hitParts.push(`KNEE(x${kneeCount})` + (calc.isCrit ? "★" : "")); 
        baseParts.push("KNEE"); 
    }

    let ankleCount = 0;
    ['leftAnkle', 'rightAnkle'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) ankleCount++; });
    if (ankleCount > 0) { 
        let calc = calcPartDamage(currentDamages.ANKLE);
        totalDamage += (calc.damage * ankleCount); if(calc.isCrit) anyCrit = true;
        hitParts.push(`ANKLE(x${ankleCount})` + (calc.isCrit ? "★" : "")); 
        baseParts.push("ANKLE"); 
    }

    if (totalDamage === 0) { 
        let calc = calcPartDamage(0); 
        totalDamage = calc.damage; if(calc.isCrit) anyCrit = true;
        hitParts.push("GRAZE" + (calc.isCrit ? "★" : "")); 
        baseParts.push("ARMS"); 
    } 

    let isBuffedAttack = false;
    if (buffAttacksLeft > 0) {
        totalDamage *= 2;
        buffAttacksLeft--;
        isBuffedAttack = true;
    }

    let buffTriggered = false;
    if (currentStage >= 3 && currentStage <= 6 && kneeCount > 0) {
        buffAttacksLeft = 2; 
        buffTriggered = true;
    }

    let logText = hitParts.join(" + ");
    if (isBuffedAttack) logText = "[KNEE BUFFx2] " + logText;
    attackHistory.push({ damage: totalDamage, parts: logText });

    if (isBuffedAttack) {
        const el = document.createElement("div"); el.className = "buff-popup"; el.innerText = "KNEE BUFF x2 !!";
        document.body.appendChild(el); setTimeout(() => el.remove(), 1000);
    } else if (buffTriggered) {
        const el2 = document.createElement("div"); el2.className = "buff-popup"; el2.innerText = "KNEE BUFF +2 ATKS!";
        el2.style.top = "40%"; document.body.appendChild(el2); setTimeout(() => el2.remove(), 1000);
    }

    baseParts.forEach((part, index) => {
        setTimeout(() => { shootProjectile(partImages[part]); }, index * 150);
    });

    const hitDelay = (baseParts.length > 0 ? (baseParts.length - 1) * 150 : 0) + 600;

    setTimeout(() => {
        if (!isGameActive) return;

        bossImage.classList.add("boss-hit");
        setTimeout(() => bossImage.classList.remove("boss-hit"), 300);

        showDamageEffect(totalDamage, anyCrit);
        enemyHP = Math.max(0, enemyHP - totalDamage);
        updateHP();

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
    try { await push(ref(db, 'game_logs'), { image: saveCanvas.toDataURL("image/webp", 0.8), totalDamage: totalDamage, parts: logText }); } catch (e) {}
};

function updateHP() {
    hpValue.innerText = enemyHP;
    hpBar.style.width = ((enemyHP / currentMaxEnemyHP) * 100) + "%"; 
    
    playerHpValue.innerText = playerHP + " / " + playerStats.maxHp;
    playerHpBar.style.width = ((playerHP / playerStats.maxHp) * 100) + "%";
    
    if(playerHP <= playerStats.maxHp * 0.3) {
        playerHpBar.style.background = "var(--neon-red)";
        playerHpBar.style.boxShadow = "0 0 10px var(--neon-red)";
    } else {
        playerHpBar.style.background = "var(--neon-green)";
        playerHpBar.style.boxShadow = "0 0 10px var(--neon-green)";
    }
}

function showResults(isPlayerWin) {
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("result-screen").style.display = "flex";
    
    const title = document.getElementById("result-title");
    const nextBtn = document.getElementById("nextBtn");
    const retryBtn = document.getElementById("retryBtn");

    if (isPlayerWin) {
        if (currentStage < 10) {
            title.innerText = `STAGE ${currentStage} CLEAR!!`;
            title.style.color = "var(--neon-pink)";
            title.style.textShadow = "0 0 10px var(--neon-pink)";
            nextBtn.style.display = "inline-block";
            retryBtn.style.display = "none";
        } else {
            title.innerText = "ALL STAGE CLEAR!!!";
            title.style.color = "var(--neon-blue)";
            title.style.textShadow = "0 0 20px var(--neon-blue)";
            nextBtn.style.display = "none";
            retryBtn.style.display = "inline-block";
            retryBtn.innerText = "PLAY AGAIN (STAGE 1)";
        }
    } else {
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
