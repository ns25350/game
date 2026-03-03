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

    if (poseLandmarker) {
        lastResult = poseLandmarker.detectForVideo(video, performance.now());
    }

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    const drawingUtils = new DrawingUtils(canvasCtx);
    if (lastResult && lastResult.landmarks) {
        for (const landmark of lastResult.landmarks) {
            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: '#39ff14', lineWidth: 2 });
            drawingUtils.drawLandmarks(landmark, { radius: 2, color: "#ffffff" });
        }
    }
    window.requestAnimationFrame(predictWebcam);
}

// 攻撃ロジック
shootBtn.addEventListener("click", async () => {
    if (!lastResult || !lastResult.landmarks[0]) {
        alert("ターゲットを認識できません！");
        return;
    }

    shootBtn.disabled = true;
    const pts = lastResult.landmarks[0];
    let damage = 0;

    // 部位別判定
    if (pts[0].visibility > 0.6) damage += 150; // HEAD (Nose)
    if (pts[11].visibility > 0.5 || pts[12].visibility > 0.5) damage += 80; // BODY (Shoulders)
    if (pts[13].visibility > 0.5 || pts[14].visibility > 0.5) damage += 30; // ARMS (Elbows)
    if (pts[25].visibility > 0.5 || pts[26].visibility > 0.5) damage += 40; // LEGS (Knees)

    // HP更新
    enemyHP = Math.max(0, enemyHP - damage);
    hpBar.style.width = (enemyHP / 10) + "%";
    hpValue.innerText = enemyHP;
    
    // ダメージ演出
    damageText.innerText = `-${damage} DMG!!`;
    status.innerText = "DATABASE送信中...";

    // 保存用キャンバス作成
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
        status.innerText = "転送完了。次を狙え！";
    } catch (e) { status.innerText = "送信エラー"; }

    setTimeout(() => {
        damageText.innerText = "";
        shootBtn.disabled = false;
        if (enemyHP <= 0) {
            alert("ENEMY DESTROYED! 敵コアを破壊しました。");
            enemyHP = 1000;
            hpBar.style.width = "100%";
            hpValue.innerText = enemyHP;
        }
    }, 1000);
});
