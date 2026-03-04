import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
let poseNet;
let poses = []; // ml5が検知した骨格データを入れる配列
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

// --- 初期化 (ml5.js版) ---
async function initGame() {
    status.innerText = "SYSTEM: カメラ起動中...";
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
        
        video.onloadeddata = () => {
            video.play();
            status.innerText = "SYSTEM: AIコア(ml5.js) ロード中...";
            
            // ml5のPoseNetを初期化
            poseNet = ml5.poseNet(video, () => {
                shootBtn.disabled = false;
                shootBtn.innerText = "狙え！攻撃開始";
                status.innerText = "READY: ターゲット捕捉中";
            });

            // 姿勢が検知されるたびに変数 poses にデータを更新
            poseNet.on('pose', (results) => {
                poses = results;
            });

            predictWebcam();
        };
    } catch (e) {
        status.innerText = "CAMERA ERROR: 許可してください";
        console.error(e);
    }
}

// --- メインループ (描画) ---
function predictWebcam() {
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");
    
    // ビデオのサイズに合わせる
    if (video.videoWidth > 0) {
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;
    }

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // 骨格が検知されていれば描画する
    if (poses.length > 0) {
        const pose = poses[0].pose;
        const skeleton = poses[0].skeleton;

        // 関節（ドット）の描画
        for (let i = 0; i < pose.keypoints.length; i++) {
            let keypoint = pose.keypoints[i];
            // 信頼度が20%以上なら描画
            if (keypoint.score > 0.2) {
                canvasCtx.beginPath();
                canvasCtx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
                canvasCtx.fillStyle = "#ffffff";
                canvasCtx.fill();
            }
        }

        // 骨（線）の描画
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

// --- 攻撃ロジック (ml5.js版) ---
shootBtn.addEventListener("click", async () => {
    // 1. AIが人を認識しているか
    if (!poses || poses.length === 0) {
        status.innerText = "ERROR: ターゲットが見つかりません";
        return;
    }

    shootBtn.disabled = true;
    const pose = poses[0].pose; 
    
    let currentDamage = 0;
    let hitList = [];

    // --- 判定ロジック ---
    // ml5は score(確信度) が 0.0〜1.0 で返る。0.2(20%)でかなり甘めな判定。
    const THRESHOLD = 0.2; 
    
    // HEAD (鼻)
    if (pose.nose.confidence > THRESHOLD) {
        currentDamage += 150;
        hitList.push("HEAD");
    }

    // BODY (左右の肩のどちらか)
    if (pose.leftShoulder.confidence > THRESHOLD || pose.rightShoulder.confidence > THRESHOLD) {
        currentDamage += 80;
        hitList.push("BODY");
    }

    // ARMS (肘と手首)
    let armCount = 0;
    ['leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'].forEach(part => {
        if (pose[part].confidence > THRESHOLD) armCount++;
    });
    if (armCount > 0) {
        currentDamage += (armCount * 30);
        hitList.push(`ARMS(x${armCount})`);
    }

    // LEGS (膝と足首)
    let legCount = 0;
    ['leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'].forEach(part => {
        if (pose[part].confidence > THRESHOLD) legCount++;
    });
    if (legCount > 0) {
        currentDamage += (legCount * 40);
        hitList.push(`LEGS(x${legCount})`);
    }

    // --- 最終チェック ---
    if (currentDamage === 0) {
        status.innerText = `DEBUG: 判定基準を満たす部位がありません`;
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
