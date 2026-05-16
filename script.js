// 1. Firebase Configuration (Tera wala)
const firebaseConfig = {
  apiKey: "AIzaSyDRxU36dyL5mMkC8chknxVOnO_MCv3F6N8",
  authDomain: "fir-cricket-hand-game.firebaseapp.com",
  databaseURL: "https://fir-cricket-hand-game-default-rtdb.firebaseio.com",
  projectId: "fir-cricket-hand-game",
  storageBucket: "fir-cricket-hand-game.firebasestorage.app",
  messagingSenderId: "697339566532",
  appId: "1:697339566532:web:8327bff9e8fc03f06aac91"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 2. Naye aur Purane UI Elements
const homeScreen = document.getElementById("homeScreen");
const playBtn = document.getElementById("playBtn");
const onlineBtn = document.getElementById("onlineBtn"); // Naya Button

const multiplayerScreen = document.getElementById("multiplayerScreen"); // Nayi Screen
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomInput = document.getElementById("roomInput");
const waitingArea = document.getElementById("waitingArea");
const roomControls = document.getElementById("roomControls");
const displayRoomId = document.getElementById("displayRoomId");

const tossScreen = document.getElementById("tossScreen");
const tossChoices = document.querySelectorAll(".toss-choice");
const numberSelection = document.getElementById("numberSelection");
const numberButtons = document.querySelectorAll(".number-btn");

const batBowlScreen = document.getElementById("batBowlScreen");
const batBtn = document.getElementById("batBtn");
const bowlBtn = document.getElementById("bowlBtn");

const gameScreen = document.getElementById("gameScreen");
const gameRole = document.getElementById("gameRole");
const scoreText = document.getElementById("scoreText");
const targetText = document.getElementById("targetText");
const computerText = document.getElementById("computerText");
const commentaryText = document.getElementById("commentaryText");
const gameNumberButtons = document.querySelectorAll(".game-number");

const resultScreen = document.getElementById("resultScreen");
const resultTitle = document.getElementById("resultTitle");
const resultSummary = document.getElementById("resultSummary");
const playAgainBtn = document.getElementById("playAgainBtn");
const winSound = document.getElementById("winSound");

// ==========================================
// 🏏 3. GAME VARIABLES (Line 50 se shuru)
// ==========================================
let playerChoice = ""; 
let playerRole = ""; 
let score = 0;
let innings = 1;
let target = null;
let isGameOver = false;

// 🌐 MULTIPLAYER VARIABLES
let isMultiplayer = false;
let roomId = null;
let playerId = 1;

// ==========================================
// 🎮 4. SOUND & MODE FUNCTIONS
// ==========================================
function playSound(sound) {
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(function () {});
  }
}

// Vs Computer Mode
playBtn.addEventListener("click", () => {
  homeScreen.classList.add("hidden");
  tossScreen.classList.remove("hidden");
  isMultiplayer = false;
});

// Multiplayer Mode
onlineBtn.addEventListener("click", () => {
  homeScreen.classList.add("hidden");
  multiplayerScreen.classList.remove("hidden");
  isMultiplayer = true;
});

// ==========================================
// 🌐 5. MULTIPLAYER ROOM SETUP
// ==========================================
createRoomBtn.addEventListener("click", () => {
  roomId = Math.floor(1000 + Math.random() * 9000).toString();
  playerId = 1;
  database.ref('rooms/' + roomId).set({
    player1: true,
    player2: false,
    gameState: "waiting",
    tossWinner: 0,
    tossDecision: "",
    p1Move: 0,
    p2Move: 0
  });
  roomControls.classList.add("hidden");
  waitingArea.classList.remove("hidden");
  displayRoomId.textContent = "Room ID: " + roomId;

  database.ref('rooms/' + roomId + '/player2').on('value', (snapshot) => {
    if (snapshot.val() === true) {
      alert("🎉 Dost aa gaya! Get ready for Toss.");
      multiplayerScreen.classList.add("hidden");
      tossScreen.classList.remove("hidden");
      if (playerId === 1) database.ref('rooms/' + roomId).update({ gameState: "toss" });
    }
  });
});

joinRoomBtn.addEventListener("click", () => {
  const enteredId = roomInput.value.trim();
  if (enteredId === "") return alert("Room ID daal bhai!");
  database.ref('rooms/' + enteredId).once('value', (snapshot) => {
    if (snapshot.exists() && snapshot.val().player2 === false) {
      roomId = enteredId;
      playerId = 2;
      database.ref('rooms/' + roomId).update({ player2: true });
      alert("🎉 Room Joined!");
      multiplayerScreen.classList.add("hidden");
      tossScreen.classList.remove("hidden");
    } else {
      alert("Room nahi mila ya full hai!");
    }
  });
});

// ==========================================
// 🪙 6. TOSS & START GAME
// ==========================================
tossChoices.forEach(button => {
  button.addEventListener("click", () => {
    playerChoice = button.dataset.choice;
    tossChoiceSection.classList.add("hidden");
    numberSelection.classList.remove("hidden");
  });
});

numberButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (isMultiplayer && playerId === 2) return alert("P1 ko toss karne de!");
    const pNum = parseInt(button.dataset.number);
    const oNum = Math.floor(Math.random() * 6) + 1;
    const result = (pNum + oNum) % 2 === 0 ? "even" : "odd";
    if (result === playerChoice) {
      alert("🎉 You won the toss!");
      tossScreen.classList.add("hidden");
      batBowlScreen.classList.remove("hidden");
    } else {
      const decision = Math.random() < 0.5 ? "bat" : "bowl";
      alert(`🤖 Opponent won and chose to ${decision}.`);
      playerRole = decision === "bat" ? "bowl" : "bat";
      if (isMultiplayer) database.ref('rooms/' + roomId).update({ tossWinner: 2, tossDecision: decision, gameState: "playing" });
      startGame();
    }
  });
});

batBtn.addEventListener("click", () => { 
  playerRole = "bat"; 
  if (isMultiplayer) database.ref('rooms/' + roomId).update({ tossWinner: 1, tossDecision: "bat", gameState: "playing" });
  startGame(); 
});
bowlBtn.addEventListener("click", () => { 
  playerRole = "bowl"; 
  if (isMultiplayer) database.ref('rooms/' + roomId).update({ tossWinner: 1, tossDecision: "bowl", gameState: "playing" });
  startGame(); 
});

// Sync Toss for P2
setInterval(() => {
  if (isMultiplayer && roomId && playerId === 2 && !tossScreen.classList.contains("hidden")) {
    database.ref('rooms/' + roomId).once('value', (snapshot) => {
      const data = snapshot.val();
      if (data && data.gameState === "playing") {
        playerRole = data.tossWinner === 1 ? (data.tossDecision === "bat" ? "bowl" : "bat") : (data.tossDecision === "bat" ? "bat" : "bowl");
        alert(`Toss Done! You are ${playerRole}ing.`);
        startGame();
      }
    });
  }
}, 1500);

function startGame() {
  score = 0;
  isGameOver = false;
  batBowlScreen.classList.add("hidden");
  tossScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  updateUI();
  startAI(); 

  if (isMultiplayer && playerId === 1) {
    database.ref('rooms/' + roomId).on('value', (snapshot) => {
      const data = snapshot.val();
      if (data && data.p1Move > 0 && data.p2Move > 0 && !isGameOver) {
        processMultiplayerTurn(data.p1Move, data.p2Move);
      }
    });
  }
}

// ==========================================
// 🏏 7. GAME PLAY & AI SYNC
// ==========================================
function processMultiplayerTurn(m1, m2) {
  let p1IsBatting = (playerId === 1 && playerRole === "bat") || (playerId === 2 && playerRole === "bowl");
  let batMove = p1IsBatting ? m1 : m2;
  let bowlMove = p1IsBatting ? m2 : m1;

  if (batMove === bowlMove) {
    commentaryText.textContent = `🏏 OUT! Both played ${batMove}`;
    setTimeout(handleOut, 1000);
  } else {
    score += batMove;
    commentaryText.textContent = `Shot: ${batMove} runs!`;
    if (target && score >= target) endMatch("🎉 Target Chased!");
    updateUI();
  }
  setTimeout(() => database.ref('rooms/' + roomId).update({ p1Move: 0, p2Move: 0 }), 500);
}

function handleOut() {
  if (innings === 1) {
    target = score + 1;
    innings = 2; score = 0;
    playerRole = playerRole === "bat" ? "bowl" : "bat";
    commentaryText.textContent = `Target: ${target}. 2nd Innings Start!`;
    updateUI();
  } else {
    if (score >= target) endMatch("🎉 Batting Side Won!");
    else if (score === target - 1) endMatch("😲 Match Tie!");
    else endMatch("🔥 Bowling Side Won!");
  }
}

function updateUI() {
  gameRole.textContent = playerRole === "bat" ? "🏏 Batting" : "🎯 Bowling";
  scoreText.textContent = `Score: ${score}`;
  targetText.textContent = target ? `Target: ${target}` : "Target: --";
}

function endMatch(msg) {
  isGameOver = true;
  commentaryText.textContent = msg;
}

// ==========================================
// 🤖 8. AI CAMERA & DETECTION
// ==========================================
const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
hands.onResults(onHandResults);

const camera = new Camera(videoElement, {
  onFrame: async () => { await hands.send({image: videoElement}); },
  width: 300, height: 225
});

function startAI() { cameraContainer.style.display = "block"; camera.start(); }

function countFingers(l) {
  let c = 0;
  if (l[8].y < l[6].y) c++; if (l[12].y < l[10].y) c++;
  if (l[16].y < l[14].y) c++; if (l[20].y < l[18].y) c++;
  let thumb = Math.abs(l[4].x - l[9].x) > 0.08;
  if (thumb) c++;
  if (c === 1 && thumb && l[8].y > l[6].y) return 6;
  return c;
}

let lastNum = -1, startT = 0;
const HOLD = 1500;

function onHandResults(res) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  if (res.multiHandLandmarks && res.multiHandLandmarks.length > 0) {
    const l = res.multiHandLandmarks[0];
    drawConnectors(canvasCtx, l, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 3});
    drawLandmarks(canvasCtx, l, {color: '#FF0000', lineWidth: 1, radius: 2});
    let det = countFingers(l);
    if (det > 0 && det <= 6 && !isGameOver) {
      if (det === lastNum) {
        let elap = Date.now() - startT;
        let prog = Math.min(100, (elap / HOLD) * 100);
        canvasCtx.font = "bold 24px Arial"; canvasCtx.fillStyle = "#ffaa00";
        canvasCtx.fillText("Locking: " + Math.round(prog) + "%", 15, 80);
        if (elap >= HOLD) { triggerCameraMove(det); lastNum = -1; }
      } else { lastNum = det; startT = Date.now(); }
    } else lastNum = -1;
    canvasCtx.font = "bold 40px Arial"; canvasCtx.fillStyle = "#00ff88"; 
    canvasCtx.fillText("Move: " + det, 15, 45);
  }
  canvasCtx.restore();
}

function triggerCameraMove(num) {
  if (isGameOver) return;
  if (!isMultiplayer) {
    const cpu = Math.floor(Math.random() * 6) + 1;
    computerText.textContent = `Computer: ${cpu}`;
    if (num === cpu) { commentaryText.textContent = "🏏 OUT!"; setTimeout(handleOut, 300); }
    else {
      score += playerRole === "bat" ? num : cpu;
      updateUI();
      if (target && score >= target) endMatch(playerRole === "bat" ? "🎉 Won!" : "🤖 CPU Won!");
    }
  } else {
    commentaryText.textContent = `Locked ${num}. Waiting...`;
    if (playerId === 1) database.ref('rooms/' + roomId).update({ p1Move: num });
    else database.ref('rooms/' + roomId).update({ p2Move: num });
  }
}
