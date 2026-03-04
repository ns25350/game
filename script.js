import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase設定 (中略 - 以前と同じものを入れてください)
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

// 要素取得
const video = document.getElementById("video");
const shootBtn = document.getElementById("shootBtn");
const status = document.getElementById("status");
const hpBar = document.getElementById("hpBar");
const hpValue = document.getElementById("hpValue");
const damageText = document.getElementById("damageText");

// --- ロード演出の実行 ---
window.addEventListener('load', () => {
    const progressBar = document.getElementById("load-progress-bar");
    const loadScreen = document.getElementById("loading-screen");
    const tosModal = document.getElementById("tosModal");
    let width = 0;

    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                loadScreen.style.display = "none";
                tosModal.style.display = "flex"; // ロード完了後に同意画面を表示
            }, 500);
        } else {
            width += 2;
            progressBar.style.width = width + "%";
        }
    }, 50);
});

// パネル開閉
document.getElementById("infoToggle").addEventListener("click", () => {
    document.getElementById("damageTable").classList.toggle("active");
});

// 同意ボタン
document.getElementById("agreeBtn").addEventListener("click", () => {
    document.getElementById("tosModal").style.display = "none";
    initGame();
});

// --- 以下、以前のml5.js用ロジックをそのまま貼り付け ---
async function initGame() {
    status.innerText = "SYSTEM: カメラ起動中...";
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
        video.onloadeddata = () => {
            video.play();
            status.innerText = "SYSTEM: AIコア ロード中...";
            poseNet = ml5.poseNet(video, () => {
                shootBtn.disabled = false;
                shootBtn.innerText = "狙え！攻撃開始";
                status.innerText = "READY: ターゲット捕捉中";
            });
            poseNet.on('pose', (results) => { poses = results; });
            predictWebcam();
        };
    } catch (e) {
        status.innerText = "CAMERA ERROR: 許可してください";
    }
}

function predictWebcam() {
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");
    if (video.videoWidth > 0) {
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;
    }
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (poses.length > 0) {
        const pose = poses[0].pose;
        const skeleton = poses[0].skeleton;
        for (let i = 0; i < pose.keypoints.length; i++) {
            let keypoint = pose.keypoints[i];
            if (keypoint.score > 0.2) {
                canvasCtx.beginPath();
                canvasCtx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
                canvasCtx.fillStyle = "#ffffff";
                canvasCtx.fill();
            }
        }
        for (let i = 0; i < skeleton.length; i++) {
            let partA = skeleton[i][0];
            let partB = skeleton[i][1];
            canvasCtx.beginPath();
            canvasCtx.moveTo(partA.position.x, partA.position.y);
            canvasCtx.lineTo(partB.position.x, partB.position.y);
            canvasCtx.strokeStyle = "#39ff14";
            canvasCtx.lineWidth = 3;
            canvasCtx.stroke();
        }
    }
    window.requestAnimationFrame(predictWebcam);
}

// 攻撃ロジック
shootBtn.addEventListener("click", async () => {
    if (!poses || poses.length === 0) {
        status.innerText = "ERROR: ターゲットが見つかりません";
        return;
    }
    shootBtn.disabled = true;
    const pose = poses[0].pose; 
    let currentDamage = 0;
    let hitList = [];
    const THRESHOLD = 0.2; 
    
    if (pose.nose.confidence > THRESHOLD) { currentDamage += 150; hitList.push("HEAD"); }
    if (pose.leftShoulder.confidence > THRESHOLD || pose.rightShoulder.confidence > THRESHOLD) { currentDamage += 80; hitList.push("BODY"); }
    ['leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'].forEach(part => { if (pose[part].confidence > THRESHOLD) armCount++; });
    // (中略 - 以前のダメージ計算ロジック)
    // ※ 簡略化のため、以前のロジックをそのまま維持してください。
    
    // HP更新・Firebase送信処理...
    enemyHP = Math.max(0, enemyHP - currentDamage); // ダミー計算
    hpBar.style.width = (enemyHP / 10) + "%";
    hpValue.innerText = enemyHP;
    damageText.innerText = `-${currentDamage} DMG!!`;

    setTimeout(() => {
        damageText.innerText = "";
        shootBtn.disabled = false;
    }, 800);
});
