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
    // 1. データの存在確認（最も重要なチェック）
    if (!lastResult || !lastResult.landmarks || lastResult.landmarks.length === 0) {
        status.innerText = "WARNING: ターゲットをロスト！";
        return;
    }

    shootBtn.disabled = true;
    const pts = lastResult.landmarks[0]; // 0番目の人物データ
    let damage = 0;
    let hitList = [];

    // --- 判定ロジックを「確実性重視」に ---
    // MediaPipe Pose Indices: 0=Nose, 11/12=Shoulders, 13/14=Elbows, 15/16=Wrists, 23/24=Hips
    
    // 【HEAD】鼻
    if (pts[0] && (pts[0].visibility > 0.1 || pts[0].z < 1)) {
        damage += 150;
        hitList.push("HEAD");
    }

    // 【BODY】肩のどちらか
    if ((pts[11] && pts[11].visibility > 0.1) || (pts[12] && pts[12].visibility > 0.1)) {
        damage += 80;
        hitList.push("BODY");
    }

    // 【ARMS】肘・手首（どれか1つでも映れば加算、最大120）
    const armIndices = [13, 14, 15, 16];
    let armDmg = 0;
    armIndices.forEach(i => {
        if (pts[i] && pts[i].visibility > 0.1) armDmg += 30;
    });
    if (armDmg > 0) {
        damage += Math.min(armDmg, 120);
        hitList.push("ARMS");
    }

    // 【LEGS】膝
    if ((pts[25] && pts[25].visibility > 0.1) || (pts[26] && pts[26].visibility > 0.1)) {
        damage += 40;
        hitList.push("LEGS");
    }

    // 【救済措置】緑の線が出ているのに計算が0になった場合
    if (damage === 0 && pts.length > 0) {
        damage = 50; 
        hitList.push("SCRATCH");
    }

    // 2. HP更新
    enemyHP = Math.max(0, enemyHP - damage);
    hpBar.style.width = (enemyHP / 10) + "%";
    hpValue.innerText = enemyHP;
    
    // 3. 演出
    damageText.innerText = `-${damage} DMG!!`;
    status.innerText = `HIT: ${hitList.join(" / ")}`;

    // 4. 画像とログをFirebaseへ
    const saveCanvas = document.getElementById("saveCanvas");
    saveCanvas.width = video.videoWidth;
    saveCanvas.height = video.videoHeight;
    saveCanvas.getContext("2d").drawImage(video, 0, 0);

    try {
        await push(ref(db, 'game_logs'), {
            image: saveCanvas.toDataURL("image/webp", 0.3),
            totalDamage: damage,
            parts: hitList,
            timestamp: Date.now()
        });
    } catch (e) { 
        console.error("Firebase Sync Error", e); 
    }

    // 5. リセット処理
    setTimeout(() => {
        damageText.innerText = "";
        shootBtn.disabled = false;
        if (enemyHP <= 0) {
            alert("MISSION COMPLETE: 敵を殲滅しました！");
            enemyHP = 1000;
            hpBar.style.width = "100%";
            hpValue.innerText = enemyHP;
        }
    }, 800);
});
