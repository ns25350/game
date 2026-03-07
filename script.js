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

const BOSS_IMG_DEFAULT = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEieoNzaobsebcl38IfzsTJVw6rWsyjs3znCTUM1FvmEBOk-AEMbK7fpQNgIxKlAYs9975b504ugIaTUpusOaaBkZzujeTCjjmyeb4SavcUGNQdmLI-IgOAWIsAhmRCOJejPk7dOSFoOv7m_/s400/gomasuri_businessman.png";
const HANKO_IMG = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgrcGrCSf_es99vaom5Jximsz0CFDKXsG01zyseZNkEKrkEV43pZub4mzLHV1dpyiiHhOrkU2GtfUVuhn3mUGV0-2SO0_pzcrMeyJie77ydVg2CehkszRM5WFkdrrYmNLdCyw1Ov9Bj4il2/s400/hanko_kakuin.png";
const DOCTOR_IMG = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgNvpds-3q1I5Hb1-Mu-GCVzJTZYNnaw7BY5aiD0JTitFUk0g5DWKxPBpC7O6SYsqEW3MPtdWi4TJ5sTIQ_U8ZBXOf8F_G3TMxpviU7biVabcm6-5jxh7p0IzbCXso853ovCUQ11eWthnN7/s450/job_doctor_woman.png";

const STAGE_DATA = [
    { hp: 1000, atk: 80, interval: 1000, name: "部長", quote: ["おい、君。", "今日中にこの書類、", "全部ハンコ押しといて！"], bossImg: BOSS_IMG_DEFAULT, projImg: HANKO_IMG },
    { hp: 1500, atk: 120, interval: 1000, name: "若い男", quote: ["言っとくけど...", "僕は部長より強いよ？","まぁいい","やろうか.."], bossImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhE5wqxTpmTkoWAqwRv4njE_9uLS3h2_ozMeQyAtGnCaOfEiElVPH_lebH-eZIGJ_o459Ev6HKQUOCiAK6-liX2KXQ-vaTpUFZUai3KmrJkCWPw-IlMjb_hKM9YcEH68iVTDMAl3rOMUp5n/s450/kamen_warui_businessman.png", projImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh4KaLRO3uqI78DqWcvzLj_4sX02hn6vgXHSdcGcE6VpQElZrJsYlH67t0dASdfN8wqzQsglzodFr0IvBYfJ4_9w_fsVyzLjH6-MdYeiiIXqMBFn-1LJ1FTB8QpWbd0iAStVJ0-mxkw4Cs/s400/knife.png" },
    { hp: 2500, atk: 200, interval: 1000, name: "ケンタ", quote: ["俺の尊敬しているミニマリストがさ...", "「雑魚は無駄」","そう言ったんだよね..."], bossImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_K2yDx69sXqaCSRMhSW69pHLcDC80Hyvq8N8voY4fezy0_D2maC09y5taUVo7Yow9ChMeNeGIKJdMAVM5FiqnYKL5kKcYUKS54k2tBruy5vWAhQ5MTcTHqHh8YbEGMW_i5LzgZ7ETNeSm/s300/tablet03_man.png", projImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiMZFyeoVGoLuRCV_6euTcdxqTjF2U6Y0YORRAJLKfkg6ZwTHA6U0AMuthwb6R4x8cdSNkSNGkO-mCuZbDfejCFaccNoUjVkOWkEgz4s5ixN3Qgy1STow68x21R-utX32fZUfXWHBRAHUdZ/s400/computer_tablet2_icon.png" },
    { hp: 7000, atk: 800, interval: 1500, name: "ミツル", quote: ["やめとけ", "ここからはレベルが違いすぎる。","ん。聞いてない？","お前らの事大好きやから言うとんねんぞ！！"], bossImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhyyaNjzGtKTnucVqq0TKCK9ZAsJSgAbg4LbA9RKf0ej4BjmdQvNlWeB7-qUIO3uhWPRN1OB7RkuZvIr37YBhrFP-C4L9noxKOZ354QR2lPWoMCyZB1FilodEloaK81DHAt8X8QLp2ygYs/s400/osumousan_yukata.png", projImg: HANKO_IMG },
    { hp: 15000, atk: 100, interval: 500, name: "闇女", quote: ["フフフ…", "切り刻んであげる…", "原型がなくなるまでね。"], bossImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjxuKKsa2P5HNwBdmLVsxNqUre-y5LIONGXK6AY4XPxJQ1IAM8CajxVw3PU_pmVgI7a2xJ5zm4xxu6qWmtqau7tM_qqreK4YLZS0kxwt6nBi971Q5F0RVuH6f6uHsXB-P5p_tJvmEqJFp2d/s400/mental_yandere_woman.png", projImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh_OLKPIxhrUjmMbCJpiIxZzHspEu4qutF4Fnis_ctWV4ciK03ZS9CQ0At-ai83TNYuJjMOaYjcdbjSx-WUEjUNVGVpSwAwhVtqMdwN9ZdA5hL15xuD3I7ibAC4Hwxs_lzTzxV2C2ZAsdwc/s400/cooking_houchou.png" },
    { hp: 25000, atk: 100, interval: 1000, name: "味方だった女医", quote: ["ごめんね...", "君がここまで強いとは思わなかったの", "でもここからは神の領域よ","通すわけには行かないわ"], bossImg: DOCTOR_IMG, projImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhzRwpTokXBgP4k6W6Cy_OUve1m7C2B53LHAEjC__mCZrzF12cf_1D5kdQLjfaG0pN_pgV47MBDbCICTEoalPO_qV107tsPiq-KIagfWwC4Dz1HFNSI1i8lKce39sb1S8a3sWvikUB1XTw/s400/medical_doku.png" },
    { hp: 40000, atk: 5000, interval: 1500, name: "インターネットの神様", quote: ["フォッフォッフォ"], bossImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiwlcuDsgNcobziyPqJVTe35lsdWQm58Bfzvo4ir-gSd6iHi_URVclOTSdYKlMxGXvTgdeaAMY8NJ9WlL8SonYkqyzUrecJNq3Z0RgCZmuMuk7fx6yavDFlCtERTSLbkY2cis8N3l1ILcnQ/s500/internet_god.png", projImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhUZM1KLUe_PRo7WpwLFpNtisBQ3zfmT9Oz-641VvismJS2m2eW8VfLsmQltNqmfcQ5ZOfpYip8XeZz0yvM4o_pjz4HSRacI36fSPuJrlm0Voot00CVUbEh49jE47k8pP9N0pSHibUxwMQ/s500/wifi_speed_fast_l.png" },
    { hp: 60000, atk: 1500, interval: 1000, name: "ゼウス", quote: ["....", "来たか..."], bossImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjkC6ttflvux0pShojUbjbkme82R7a943avGBeJZf5ZVl9RMSSP5TH8siaiYPsYpyNCGzSmlR0TwHKFjELx1GI6W24Yi6fVCJs2z49zAYbG7vkFHp3xvX49L1nAxkgzkyup1v8gkiekct7w/s400/shinwa_zeus.png", projImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhtaZhoOV3S4Y_biS94VsaKLEPUndTCxlUI7C6l2poKQcWDqemp4VmpKGacv2UYeKqWCc5JrKc73lQtPRJ1LcZWrTh1Ab7JzUPNpx2I0IzMwQWhUU52lbEfffGhedY3gQA8PPc94EWLr9U/s400/shizensaigai_kaminari.png" },
    { hp: 80000, atk: 999999, interval: 15000, name: "寝不足な医者", quote: ["あぁ…もう限界だ…", "頼む、15秒で終わらせてくれ…", "じゃないと…"], bossImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWJrwJXkl7PKW4KZICGWvvyJNGMQvTPkFPBeDAaOIlD2dgK4aNvvFR-zs8qYzNl2yQ949jYbYvAvcmfU-9W5H6y6pjLg__7GbVZrkHHhF82-wVV16uFRUA2j5ylPSA7Cs2bwJihZeuHyoa/s400/nebusoku_doctor_man.png", projImg: "https://via.placeholder.com/100/005500/ffffff?text=UNKNOWN" },
    { hp: 100000, atk: 20000, interval: 1500, name: "開発者", quote: ["君ぃ、膝が弱いよね。", "データが言ってるんだよ。", "オスグッドなのにここまで来るとは...","まるでバグ...","いや、これでいい","さぁデバッグ作業を始めようか！"], bossImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgJWP8a9vbGKmeUKbagxvtnL6XsYxKaKeQ01Vm8uiQPdkAdpUQtSGaICZO9MY5P-uzPFhJ_i6txSb8aSjOlxNEgMTJEi8bh0QkHNv8L-96G4uERtiwIEDn7F9dj8Vie7_vCLxqOIH6Qtt0B/s400/job_programmer.png", projImg: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgFnLWd5N0cyubKq4DhgnPBJlyNQiEw6-P6YdDQ0wOZFoHQeAGsTKPHmsdvmW2B3rP6FdjRsirEyVbOn3ZNuwYL8B5_-4x7unE_jHd6usR3kBeM-7LImK2PUo-ueRzzWHnDCAJr3Ydx4_RK/s500/computer_big_data.png" }
];

const baseValues = [150, 80, 60, 30, 50, 120];
let currentDamages = { "HEAD": 150, "BODY": 80, "WAIST": 60, "ARMS": 30, "KNEE": 50, "ANKLE": 120 };
let buffAttacksLeft = 0; 

let playerStats = { maxHp: 1000, baseAtk: 10, critRate: 5, critDmg: 50 };
let basePlayerStats = null; // ←追加
let availableMaterials = 0;
let playerHP = 1000;
let selectedPlayerImage = "";

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
let currentProjImg = HANKO_IMG;

let dialogueLines = [];
let currentLineIndex = 0;
let isTyping = false;
let typeInterval;
let currentTextStr = "";

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

Object.values(partImages).forEach(src => { const img = new Image(); img.src = src; });

function shuffleDamages() {
    let values = [...baseValues];
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    const keys = ["HEAD", "BODY", "WAIST", "ARMS", "KNEE", "ANKLE"];
    keys.forEach((key, index) => { currentDamages[key] = values[index]; });
}

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
    document.getElementById("char-select-screen").style.display = "flex";
    initGame();
};

function selectCharacter(playerId, imgSrc) {
    selectedPlayerImage = imgSrc;
    document.getElementById("ally-image").src = selectedPlayerImage;

    if (playerId === 1) {
        basePlayerStats = { maxHp: 1500, baseAtk: 15, critRate: 5, critDmg: 50 };
    } else {
        basePlayerStats = { maxHp: 800, baseAtk: 10, critRate: 25, critDmg: 80 };
    }

    playerStats = { ...basePlayerStats };

    playerHP = playerStats.maxHp;
    document.getElementById("char-select-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "flex";
    document.getElementById("tutorial-panel").classList.remove("hide-to-menu");
}

document.getElementById("char1-btn").onclick = () => selectCharacter(1, "https://via.placeholder.com/200/ff0000/ffffff?text=PLAYER+A");
document.getElementById("char2-btn").onclick = () => selectCharacter(2, "https://via.placeholder.com/200/0000ff/ffffff?text=PLAYER+B");

document.getElementById("start-tutorial-btn").onclick = () => {
    document.getElementById("tutorial-panel").classList.add("hide-to-menu");
    currentStage = 1;
    availableMaterials = 0;
    prepareStage();
};

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
    document.getElementById("stage-info-panel").classList.remove("hide-to-menu");
}

document.getElementById("start-stage-btn").onclick = () => {
    document.getElementById("stage-info-panel").classList.add("hide-to-menu");
    showEnemyDialogue(); 
};

function typeDialogue() {
    if (currentLineIndex >= dialogueLines.length) {
        document.getElementById("start-fight-btn").style.display = "inline-block";
        document.querySelector(".blinking-cursor").style.display = "none";
        return;
    }
    currentTextStr = dialogueLines[currentLineIndex];
    document.getElementById("enemy-quote").innerText = "";
    document.getElementById("start-fight-btn").style.display = "none";
    document.querySelector(".blinking-cursor").style.display = "inline-block";
    
    isTyping = true;
    let charIndex = 0;
    typeInterval = setInterval(() => {
        document.getElementById("enemy-quote").innerText += currentTextStr[charIndex];
        charIndex++;
        if (charIndex >= currentTextStr.length) {
            clearInterval(typeInterval);
            isTyping = false;
            currentLineIndex++;
        }
    }, 50);
}

function showEnemyDialogue() {
    const data = STAGE_DATA[currentStage - 1];
    document.getElementById("enemy-dialogue-image").src = data.bossImg;
    bossImage.src = data.bossImg;
    bossImage.style.opacity = "0"; 
    
    document.getElementById("enemy-name").innerText = data.name;
    document.getElementById("enemy-target-name").innerText = `TARGET: ${data.name}`;
    
    document.getElementById("enemy-dialogue").style.display = "flex";
    
    dialogueLines = data.quote;
    currentLineIndex = 0;
    document.getElementById("enemy-bubble-area").style.display = "block";
    
    typeDialogue();
}

document.getElementById("enemy-dialogue").onclick = (e) => {
    if (e.target.id === "start-fight-btn") return; 
    if (isTyping) {
        clearInterval(typeInterval);
        document.getElementById("enemy-quote").innerText = currentTextStr;
        isTyping = false;
        currentLineIndex++;
    } else {
        typeDialogue();
    }
};

document.getElementById("start-fight-btn").onclick = (e) => {
    e.stopPropagation();
    
    const enemyDialogImg = document.getElementById("enemy-dialogue-image");
    const targetArea = document.getElementById("boss-image");
    const bubble = document.getElementById("enemy-bubble-area");
    bubble.style.display = "none";
    
    const anim = enemyDialogImg.animate([
        { transform: `translateY(0px) scale(1)`, opacity: 1 },
        { transform: `translateY(-50px) scale(1.2)`, opacity: 0 }
    ], { duration: 500, easing: 'ease-in', fill: 'forwards' });

    anim.onfinish = () => {
        document.getElementById("enemy-dialogue").style.display = "none";
        enemyDialogImg.style.transform = "none";
        enemyDialogImg.style.opacity = "1"; 
        
        targetArea.style.opacity = "1"; 
        targetArea.animate([
            { transform: 'scale(0.5)', opacity: 0 },
            { transform: 'scale(1)', opacity: 1 }
        ], { duration: 500, easing: 'ease-out' });
        
        startStageSequence();
    };
};

function startStageSequence() {
    isGameActive = false;
    if (enemyAttackInterval) clearInterval(enemyAttackInterval);
    
    const data = STAGE_DATA[currentStage - 1];
    currentMaxEnemyHP = data.hp;
    enemyHP = data.hp;
    currentEnemyAtk = data.atk;
    currentEnemyInterval = data.interval;
    currentProjImg = data.projImg; 
    
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
        proj.src = currentProjImg; 
        proj.className = "enemy-projectile";
        
        // ★修正: 敵の攻撃画像の初期位置を固定
        proj.style.left = "0px";
        proj.style.top = "0px";
        
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
        hitParts.push("HEAD" + (calc.isCrit ? "★" : "")); baseParts.push("HEAD"); 
    }

    let bodyCount = 0;
    if (pose.leftShoulder.confidence > THRESHOLD || pose.rightShoulder.confidence > THRESHOLD) bodyCount++;
    if (bodyCount > 0) { 
        let calc = calcPartDamage(currentDamages.BODY);
        totalDamage += calc.damage; if(calc.isCrit) anyCrit = true;
        hitParts.push("BODY" + (calc.isCrit ? "★" : "")); baseParts.push("BODY"); 
    }

    let armCount = 0;
    ['leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) armCount++; });
    if (armCount > 0) { 
        let calc = calcPartDamage(currentDamages.ARMS);
        totalDamage += (calc.damage * armCount); if(calc.isCrit) anyCrit = true;
        hitParts.push(`ARMS(x${armCount})` + (calc.isCrit ? "★" : "")); baseParts.push("ARMS"); 
    }

    let waistCount = 0;
    ['leftHip', 'rightHip'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) waistCount++; });
    if (waistCount > 0) { 
        let calc = calcPartDamage(currentDamages.WAIST);
        totalDamage += (calc.damage * waistCount); if(calc.isCrit) anyCrit = true;
        hitParts.push(`WAIST(x${waistCount})` + (calc.isCrit ? "★" : "")); baseParts.push("WAIST"); 
    }

    let kneeCount = 0;
    ['leftKnee', 'rightKnee'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) kneeCount++; });
    if (kneeCount > 0) { 
        let calc = calcPartDamage(currentDamages.KNEE);
        totalDamage += (calc.damage * kneeCount); if(calc.isCrit) anyCrit = true;
        hitParts.push(`KNEE(x${kneeCount})` + (calc.isCrit ? "★" : "")); baseParts.push("KNEE"); 
    }

    let ankleCount = 0;
    ['leftAnkle', 'rightAnkle'].forEach(p => { if (pose[p] && pose[p].confidence > THRESHOLD) ankleCount++; });
    if (ankleCount > 0) { 
        let calc = calcPartDamage(currentDamages.ANKLE);
        totalDamage += (calc.damage * ankleCount); if(calc.isCrit) anyCrit = true;
        hitParts.push(`ANKLE(x${ankleCount})` + (calc.isCrit ? "★" : "")); baseParts.push("ANKLE"); 
    }

    if (totalDamage === 0) { 
        let calc = calcPartDamage(0); 
        totalDamage = calc.damage; if(calc.isCrit) anyCrit = true;
        hitParts.push("GRAZE" + (calc.isCrit ? "★" : "")); baseParts.push("ARMS"); 
    } 

    let isBuffedAttack = false;
    if (buffAttacksLeft > 0) {
        totalDamage *= 2; buffAttacksLeft--; isBuffedAttack = true;
    }

    let buffTriggered = false;
    if (currentStage >= 3 && currentStage <= 6 && kneeCount > 0) {
        buffAttacksLeft = 2; buffTriggered = true;
    }

    let logText = hitParts.join(" + ");
    if (isBuffedAttack) logText = "[KNEE BUFFx2] " + logText;
    attackHistory.push({ damage: totalDamage, parts: logText });

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
};

function updateHP() {
    hpValue.innerText = enemyHP;
    hpBar.style.width = ((enemyHP / currentMaxEnemyHP) * 100) + "%"; 
    
    playerHpValue.innerText = playerHP + " / " + playerStats.maxHp;
    playerHpBar.style.width = ((playerHP / playerStats.maxHp) * 100) + "%";
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
            nextBtn.style.display = "inline-block";
            retryBtn.style.display = "none";
        } else {
            title.innerText = "ALL STAGE CLEAR!!!";
            title.style.color = "var(--neon-blue)";
            nextBtn.style.display = "none";
            retryBtn.style.display = "inline-block";
            retryBtn.innerText = "PLAY AGAIN (STAGE 1)";
        }
    } else {
        title.innerText = "GAME OVER";
        title.style.color = "var(--neon-red)";
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

document.getElementById("nextBtn").onclick = () => {
    document.getElementById("result-screen").style.display = "none";
    availableMaterials += currentStage;
    currentStage++;

    if(currentStage === 2) {
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

    // 戦闘停止
    isGameActive = false;
    if (enemyAttackInterval) clearInterval(enemyAttackInterval);
    if (typeInterval) clearInterval(typeInterval);

    // ステージリセット
    currentStage = 1;
    availableMaterials = 0;
    attackHistory = [];
    buffAttacksLeft = 0;

    // ステータス初期化
    playerStats = { ...basePlayerStats };

    playerHP = playerStats.maxHp;

    document.getElementById("result-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "flex";

    prepareStage();
};

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
    btns.forEach(btn => { btn.disabled = availableMaterials <= 0; });
}

document.querySelectorAll(".upgrade-btn").forEach(btn => {
    btn.onclick = (e) => {
        if(availableMaterials <= 0) return;
        availableMaterials--;
        const stat = e.target.getAttribute("data-stat");
        if(stat === "hp") playerStats.maxHp += 1000;
        else if(stat === "atk") playerStats.baseAtk += 20;
        else if(stat === "crate") playerStats.critRate += 20;
        else if(stat === "cdmg") playerStats.critDmg += 40;
        updateUpgradeUI();
    };
});

document.getElementById("finish-upgrade-btn").onclick = () => {
    document.getElementById("upgrade-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "flex"; 
    playerHP = playerStats.maxHp; 
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
    if (!isGameActive) return;
    const proj = document.createElement("img");
    proj.src = imgSrc;
    proj.className = "projectile";
    
    // ★修正: プレイヤーの攻撃画像の初期位置を固定
    proj.style.left = "0px";
    proj.style.top = "0px";
    
    document.body.appendChild(proj);

    const playerArea = document.getElementById("player-area").getBoundingClientRect();
    const bossRect = bossImage.getBoundingClientRect();

    const startX = playerArea.left + playerArea.width / 2 - 25;
    const startY = playerArea.top;
    const targetX = bossRect.left + bossRect.width / 2 - 25;
    const targetY = bossRect.top + bossRect.height / 2 - 25;

    const animation = proj.animate([
        { transform: `translate(${startX}px, ${startY}px) rotate(0deg) scale(0.5)` },
        { transform: `translate(${targetX}px, ${targetY}px) rotate(720deg) scale(1.5)` }
    ], { duration: 600, easing: 'ease-out', fill: 'forwards' });

    animation.onfinish = () => proj.remove();
}
