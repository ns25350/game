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
    if (!lastResult || !lastResult.landmarks || lastResult.landmarks.length === 0) {
        status.innerText = "WARNING: ターゲットをロスト！";
        return;
    }

    shootBtn.disabled = true;
    const pts = lastResult.landmarks[0]; 
    
    // --- スコア計算用変数をリセット ---
    let currentDamage = 0;
    let hitList = [];

    // 1. 【HEAD】 (Index 0: Nose) -> 150
    if (pts[0] && pts[0].visibility > 0.2) {
        currentDamage += 150;
        hitList.push("HEAD");
    }

    // 2. 【BODY】 (Index 11 or 12: Shoulders) -> 80
    // 両肩映っていても「BODY」として1回だけ加算
    if ((pts[11] && pts[11].visibility > 0.2) || (pts[12] && pts[12].visibility > 0.2)) {
        currentDamage += 80;
        hitList.push("BODY");
    }

    // 3. 【ARMS】 (Index 13,14,15,16) -> 1本につき30
    let armCount = 0;
    if (pts[13] && pts[13].visibility > 0.2) armCount++; // Left Elbow
    if (pts[14] && pts[14].visibility > 0.2) armCount++; // Right Elbow
    if (pts[15] && pts[15].visibility > 0.2) armCount++; // Left Wrist
    if (pts[16] && pts[16].visibility > 0.2) armCount++; // Right Wrist
    
    if (armCount > 0) {
        currentDamage += (armCount * 30);
        hitList.push(`ARMS(x${armCount})`);
    }

    // 4. 【LEGS】 (Index 25, 26: Knees) -> 1つにつき40
    let legCount = 0;
    if (pts[25] && pts[25].visibility > 0.2) legCount++;
    if (pts[26] && pts[26].visibility > 0.2) legCount++;

    if (legCount > 0) {
        currentDamage += (legCount * 40);
        hitList.push(`LEGS(x${legCount})`);
    }

    // --- 最終ダメージの適用 ---
    // もし何も当たっていなければ最低ダメージ
    if (currentDamage === 0) {
        currentDamage = 10;
        hitList.push("SCRATCH");
    }

    // HP更新
    enemyHP = Math.max(0, enemyHP - currentDamage);
    hpBar.style.width = (enemyHP / 10) + "%";
    hpValue.innerText = enemyHP;
    
    // 演出
    damageText.innerText = `-${currentDamage} DMG!!`;
    status.innerText = `RESULT: ${hitList.join(" + ")}`;

    // --- Firebase送信 & 画像保存 ---
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
    } catch (e) { console.error(e); }

    setTimeout(() => {
        damageText.innerText = "";
        shootBtn.disabled = false;
        if (enemyHP <= 0) {
            alert("MISSION COMPLETE!!");
            enemyHP = 1000;
            hpBar.style.width = "100%";
            hpValue.innerText = enemyHP;
        }
    }, 800);
});
