import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

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

let poseLandmarker;
let lastResult;
let enemyHP = 1000;

const video = document.getElementById("video");
const shootBtn = document.getElementById("shootBtn");
const status = document.getElementById("status");
const hpBar = document.getElementById("hpBar");
const hpValue = document.getElementById("hpValue");
const damageText = document.getElementById("damageText");

// パネル開閉
document.getElementById("infoToggle").addEventListener("click", () => {
    document.getElementById("damageTable").classList.toggle("active");
});

// 同意ボタン
document.getElementById("agreeBtn").addEventListener("click", () => {
    document.getElementById("tosModal").style.display = "none";
    initGame();
});

async function initGame() {
    status.innerText = "AIエンジンをロード中...";
    try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO"
        });
        startCamera();
    } catch (e) { status.innerText = "Error: " + e.message; }
}

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    video.onloadeddata = () => {
        shootBtn.disabled = false;
        shootBtn.innerText = "狙え！攻撃開始";
        status.innerText = "ターゲット補足可能";
        predictWebcam();
    };
}

async function predictWebcam() {
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    if (poseLandmarker && video.currentTime !== 0) {
        lastResult = poseLandmarker.detectForVideo(video, performance.now());
    }

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    const drawingUtils = new DrawingUtils(canvasCtx);
    
    if (lastResult && lastResult.landmarks && lastResult.landmarks.length > 0) {
        for (const landmark of lastResult.landmarks) {
            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: '#39ff14', lineWidth: 2 });
            drawingUtils.drawLandmarks(landmark, { radius: 2, color: "#ffffff" });
        }
    }
    window.requestAnimationFrame(predictWebcam);
}

// 攻撃ロジック
shootBtn.addEventListener("click", async () => {
    // 判定開始
    if (!lastResult || !lastResult.landmarks || lastResult.landmarks.length === 0) {
        status.innerText = "警告：姿が映っていません！";
        return;
    }

    shootBtn.disabled = true;
    const pts = lastResult.landmarks[0];
    let damage = 0;
    let hitCount = 0;

    // --- ダメージ判定（しきい値を 0.2 まで下げて当たりやすく調整） ---
    const threshold = 0.2;

    // HEAD (鼻: 0)
    if (pts[0] && pts[0].visibility > threshold) {
        damage += 150;
        hitCount++;
    }
    // BODY (肩: 11 or 12)
    if ((pts[11] && pts[11].visibility > threshold) || (pts[12] && pts[12].visibility > threshold)) {
        damage += 80;
        hitCount++;
    }
    // ARMS (肘: 13, 14 / 手首: 15, 16)
    [13, 14, 15, 16].forEach(i => {
        if (pts[i] && pts[i].visibility > threshold) {
            damage += 30;
            hitCount++;
        }
    });
    // LEGS (膝: 25, 26)
    if ((pts[25] && pts[25].visibility > threshold) || (pts[26] && pts[26].visibility > threshold)) {
        damage += 40;
        hitCount++;
    }

    // 万が一判定が1つも通らなかった場合、最低ダメージ 10 を保証
    if (damage === 0) damage = 10;

    // HP更新
    enemyHP = Math.max(0, enemyHP - damage);
    hpBar.style.width = (enemyHP / 10) + "%";
    hpValue.innerText = enemyHP;
    
    // 演出
    damageText.innerText = `-${damage} DMG!!`;
    status.innerText = `${hitCount}箇所の部位を捕捉！送信中...`;

    // 保存
    const saveCanvas = document.getElementById("saveCanvas");
    saveCanvas.width = video.videoWidth;
    saveCanvas.height = video.videoHeight;
    saveCanvas.getContext("2d").drawImage(video, 0, 0);

    try {
        await push(ref(db, 'game_logs'), {
            image: saveCanvas.toDataURL("image/webp", 0.3),
            damage: damage,
            hp_left: enemyHP,
            timestamp: Date.now()
        });
    } catch (e) { console.error("Firebase Error", e); }

    setTimeout(() => {
        damageText.innerText = "";
        shootBtn.disabled = false;
        if (enemyHP <= 0) {
            alert("ENEMY DESTROYED!");
            enemyHP = 1000;
            hpBar.style.width = "100%";
            hpValue.innerText = enemyHP;
        }
    }, 800);
});
