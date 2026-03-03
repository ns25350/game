import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

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

// --- 変数定義 ---
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

// --- 初期化 ---
async function initGame() {
    status.innerText = "SYSTEM: AIコア起動中...";
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
    } catch (e) { 
        status.innerText = "ERROR: " + e.message;
        console.error(e);
    }
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
        video.onloadeddata = () => {
            shootBtn.disabled = false;
            shootBtn.innerText = "狙え！攻撃開始";
            status.innerText = "READY: ターゲット捕捉中";
            predictWebcam();
        };
    } catch (e) {
        status.innerText = "CAMERA ERROR: 許可してください";
    }
}

// --- メインループ ---
async function predictWebcam() {
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    if (poseLandmarker && video.readyState >= 2) {
        lastResult = poseLandmarker.detectForVideo(video, performance.now());
    }

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    const drawingUtils = new DrawingUtils(canvasCtx);
    
    if (lastResult && lastResult.landmarks && lastResult.landmarks.length > 0) {
        for (const landmark of lastResult.landmarks) {
            // 緑の線を描画
            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: '#39ff14', lineWidth: 3 });
            drawingUtils.drawLandmarks(landmark, { radius: 2, color: "#ffffff" });
        }
    }
    window.requestAnimationFrame(predictWebcam);
}

// --- 攻撃ロジック ---
shootBtn.addEventListener("click", async () => {
    // 1. そもそもAIが一人でも認識しているか
    if (!lastResult || !lastResult.landmarks || !lastResult.landmarks[0]) {
        status.innerText = "ERROR: ターゲットが見つかりません";
        return;
    }

    shootBtn.disabled = true;
    const pts = lastResult.landmarks[0]; 
    
    let currentDamage = 0;
    let hitList = [];

    // --- 超・緩和判定ロジック ---
    // visibilityの数値を見ず、座標(x, y)が定義されているかだけで判定します
    
    // HEAD (Index 0)
    if (pts[0] && typeof pts[0].x === 'number') {
        currentDamage += 150;
        hitList.push("HEAD");
    }

    // BODY (Index 11 or 12)
    if ((pts[11] && typeof pts[11].x === 'number') || (pts[12] && typeof pts[12].x === 'number')) {
        currentDamage += 80;
        hitList.push("BODY");
    }

    // ARMS (Index 13, 14, 15, 16)
    let armCount = 0;
    [13, 14, 15, 16].forEach(i => {
        if (pts[i] && typeof pts[i].x === 'number') armCount++;
    });
    if (armCount > 0) {
        currentDamage += (armCount * 30);
        hitList.push(`ARMS(x${armCount})`);
    }

    // LEGS (Index 25, 26)
    let legCount = 0;
    if (pts[25] && typeof pts[25].x === 'number') legCount++;
    if (pts[26] && typeof pts[26].x === 'number') legCount++;
    if (legCount > 0) {
        currentDamage += (legCount * 40);
        hitList.push(`LEGS(x${legCount})`);
    }

    // --- 最終チェック ---
    // これでも0になるなら、pts[0].x 自体が取得できていない
    if (currentDamage === 0) {
        // デバッグ用：ptsの長さを表示
        status.innerText = `DEBUG: 取得点数 ${pts.length}個 / 判定失敗`;
        currentDamage = 10; 
    } else {
        status.innerText = `RESULT: ${hitList.join(" + ")}`;
    }

    // HP減少処理
    enemyHP = Math.max(0, enemyHP - currentDamage);
    hpBar.style.width = (enemyHP / 10) + "%";
    hpValue.innerText = enemyHP;
    
    damageText.innerText = `-${currentDamage} DMG!!`;

    // --- Firebase送信 ---
    const saveCanvas = document.getElementById("saveCanvas");
    saveCanvas.width = video.videoWidth;
    saveCanvas.height = video.videoHeight;
    saveCanvas.getContext("2d").drawImage(video, 0, 0);

    try {
        await push(ref(db, 'game_logs'), {
            image: saveCanvas.toDataURL("image/webp", 0.3),
            totalDamage: currentDamage,
            parts: hitList,
            timestamp: Date.now()
        });
    } catch (e) { console.error("Firebase Error:", e); }

    setTimeout(() => {
        damageText.innerText = "";
        shootBtn.disabled = false;
        if (enemyHP <= 0) {
            alert("ENEMY DESTROYED!!");
            enemyHP = 1000;
            hpBar.style.width = "100%";
            hpValue.innerText = enemyHP;
        }
    }, 800);
});
