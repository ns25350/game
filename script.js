import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

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
const video = document.getElementById("video");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const shootBtn = document.getElementById("shootBtn");
const hpBar = document.getElementById("hpBar");
const damageText = document.getElementById("damageText");
const status = document.getElementById("status");

let poseLandmarker = undefined;
let enemyHP = 1000;
let lastResult = null;

// --- 利用規約処理 ---
const tosModal = document.getElementById("tosModal");
document.getElementById("agreeBtn").addEventListener("click", () => {
    tosModal.style.display = "none";
    setupGame();
});

// --- 初期セットアップ ---
async function setupGame() {
    status.innerText = "システム起動中...";
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU"
        },
        runningMode: "VIDEO"
    });

    startCamera();
}

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
    shootBtn.disabled = false;
    shootBtn.innerText = "狙え！攻撃開始";
}

// --- リアルタイム解析ループ ---
let lastVideoTime = -1;
async function predictWebcam() {
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        lastResult = poseLandmarker.detectForVideo(video, performance.now());
    }

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    const drawingUtils = new DrawingUtils(canvasCtx);
    
    if (lastResult.landmarks) {
        for (const landmark of lastResult.landmarks) {
            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
            drawingUtils.drawLandmarks(landmark, { radius: 1, color: "#39ff14" });
        }
    }
    window.requestAnimationFrame(predictWebcam);
}

// --- ダメージ計算ロジック ---
function calculateDamage(landmarks) {
    if (!landmarks || landmarks.length === 0) return 0;
    
    let totalDmg = 0;
    const pts = landmarks[0];

    // 顔 (0-10)
    if (pts[0].visibility > 0.5) totalDmg += 100; // Nose
    // 胴体 (11,12,23,24)
    if (pts[11].visibility > 0.5 || pts[12].visibility > 0.5) totalDmg += 50;
    // 手足 (13-22, 25-32)
    const limbs = [13, 14, 15, 16, 25, 26];
    limbs.forEach(idx => {
        if (pts[idx].visibility > 0.5) totalDmg += 20;
    });

    return totalDmg;
}

// --- 撮影・送信実行 ---
shootBtn.addEventListener("click", async () => {
    if (!lastResult || lastResult.landmarks.length === 0) {
        alert("ターゲットを捕捉できません！全身を映してください。");
        return;
    }

    shootBtn.disabled = true;
    const damage = calculateDamage(lastResult.landmarks);
    
    // HP更新
    enemyHP = Math.max(0, enemyHP - damage);
    hpBar.style.width = (enemyHP / 10) + "%";
    damageText.innerText = `CRITICAL HIT: ${damage}pts!`;
    
    // 画像保存準備
    const saveCanvas = document.getElementById("saveCanvas");
    saveCanvas.width = video.videoWidth;
    saveCanvas.height = video.videoHeight;
    const sCtx = saveCanvas.getContext("2d");
    sCtx.drawImage(video, 0, 0);
    const imageData = saveCanvas.toDataURL("image/webp", 0.4);

    try {
        status.innerText = "データを送信中...";
        await push(ref(db, 'game_logs'), {
            image: imageData,
            damage: damage,
            remainingHP: enemyHP,
            timestamp: Date.now()
        });
        status.innerText = "転送完了。次の攻撃へ！";
    } catch (e) {
        console.error(e);
        status.innerText = "通信エラー！";
    } finally {
        setTimeout(() => {
            shootBtn.disabled = false;
            damageText.innerText = "";
            if(enemyHP <= 0) {
                alert("ENEMY DEFEATED! 敵を殲滅しました。");
                enemyHP = 1000;
                hpBar.style.width = "100%";
            }
        }, 1500);
    }
});
