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
// 🏏 3. GAME & MULTIPLAYER VARIABLES (Line 50 se)
// ==========================================
let playerChoice = ""; 
let playerRole = ""; 
let score = 0;
let innings = 1;
let target = null;
let isGameOver = false;

// 🌐 MULTIPLAYER CONFIG
let isMultiplayer = false;
let roomId = null;
let playerId = 1;

// ==========================================
// 🎮 4. SOUND & MODE SELECTION
// ==========================================
function playSound(sound) {
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(function () {});
  }
}

// Offline Mode (Vs Computer)
playBtn.addEventListener("click", () => {
  homeScreen.classList.add("hidden");
  tossScreen.classList.remove("hidden");
  isMultiplayer = false;
});

// Online Mode (Multiplayer)
onlineBtn.addEventListener("click", () => {
  homeScreen.classList.add("hidden");
  multiplayerScreen.classList.remove("hidden");
  isMultiplayer = true;
});

// ==========================================
// 🌐 5. FIREBASE ROOM MANAGEMENT
// ==========================================
createRoomBtn.addEventListener("click", () => {
  roomId = Math.floor(1000 + Math.random() * 9000).toString();
  playerId = 1; // Host
  
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
  if (enteredId === "") return alert("Bhai, Room ID toh daal!");

  database.ref('rooms/' + enteredId).once('value', (snapshot) => {
    if (snapshot.exists() && snapshot.val().player2 === false) {
      roomId = enteredId;
      playerId = 2; // Joiner
      database.ref('rooms/' + roomId).update({ player2: true });
      alert("🎉 Room Joined! Match shuru...");
      multiplayerScreen.classList.add("hidden");
      tossScreen.classList.remove("hidden");
    } else {
      alert("Room full hai ya ID galat hai!");
    }
  });
});

// ==========================================
// 🪙 6. SMART TOSS LOGIC
// ==========================================
tossChoices.forEach(button => {
  button.addEventListener("click", () => {
    playerChoice = button.dataset.choice;
    tossChoiceSection.classList.add("hidden");
    numberSelection.classList.remove("hidden");
  });
});

gameNumberButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (isMultiplayer && playerId === 2) return alert("P1 ko toss karne de! Tu wait kar.");

    const pNum = parseInt(button.dataset.number);
    const oNum = Math.floor(Math.random() * 6) + 1;
    const result = (pNum + oNum) % 2 === 0 ? "even" : "odd";

    if (result === playerChoice) {
      alert("🎉 You won the toss! Choose Bat or Bowl.");
      tossScreen.classList.add("hidden");
      batBowlScreen.classList.remove("hidden");
    } else {
      const decision = Math.random() < 0.5 ? "bat" : "bowl";
      alert(`🤖 Opponent won the toss and chose to ${decision}.`);
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

// Player 2 Realtime Toss Sync
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

// ==========================================
// 🏏 7. MAIN GAME FLOW & ENGINE
// ==========================================
function startGame() {
  score = 0;
  isGameOver = false;
  
  tossScreen.classList.add("hidden");
  batBowlScreen.classList.add("hidden");
  multiplayerScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  
  updateUI();
  startAI(); 

  if (isMultiplayer && roomId) {
    database.ref('rooms/' + roomId).off('value'); 
    database.ref('rooms/' + roomId).on('value', (snapshot) => {
      const data = snapshot.val();
      if (data && data.p1Move > 0 && data.p2Move > 0 && !isGameOver) {
        processMultiplayerTurn(data.p1Move, data.p2Move);
      }
    });
  }
}

function processMultiplayerTurn(m1, m2) {
  let localIsBatting = (playerRole === "bat");
  let myMove = (playerId === 1) ? m1 : m2;
  let oppMove = (playerId === 1) ? m2 : m1;
  
  let batMove = localIsBatting ? myMove : oppMove;
  let bowlMove = localIsBatting ? oppMove : myMove;

  computerText.textContent = `Opponent chose: ${oppMove}`;

  if (batMove === bowlMove) {
    commentaryText.textContent = `🏏 OUT! Both played ${batMove}`;
    setTimeout(handleOut, 1000);
  } else {
    score += batMove;
    commentaryText.textContent = localIsBatting ? `🏏 You scored ${batMove} runs!` : `🤖 Opponent scored ${batMove} runs!`;
    updateUI();
    if (target && score >= target) {
      endMatch(localIsBatting ? "🎉 You Won the Match!" : "🤖 Opponent Won the Match!");
    }
  }
  if (playerId === 1) {
    setTimeout(() => database.ref('rooms/' + roomId).update({ p1Move: 0, p2Move: 0 }), 1000);
  }
}

function handleOut() {
  if (innings === 1) {
    target = score + 1;
    innings = 2; 
    score = 0;
    playerRole = playerRole === "bat" ? "bowl" : "bat";
    commentaryText.textContent = `Target is ${target}. Second Innings Start!`;
    updateUI();
  } else {
    if (score >= target) {
      endMatch(playerRole === "bat" ? "🎉 You Won the Match!" : "🤖 Opponent Won the Match!");
    } else if (score === target - 1) {
      endMatch("😲 Match Tie!");
    } else {
      endMatch(playerRole === "bat" ? "🤖 Opponent Won the Match!" : "🎉 You Won the Match!");
    }
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
  if (msg.includes("You Won") || msg.includes("🎉")) {
    playSound(winSound);
  }
}

// ==========================================
// 🤖 8. AI CAMERA & HAND DETECTION SETUP
// ==========================================
const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
hands.onResults(onHandResults);

const camera = new Camera(videoElement, {
  onFrame: async () => { await hands.send({image: videoElement}); },
  width: 300, height: 225
});

function startAI() { cameraContainer.style.display = "block"; camera.start(); }

function countFingers(landmarks) {
  let count = 0;
  if (landmarks[8].y < landmarks[6].y) count++;
  if (landmarks[12].y < landmarks[10].y) count++;
  if (landmarks[16].y < landmarks[14].y) count++;
  if (landmarks[20].y < landmarks[18].y) count++;
  let isThumbOut = Math.abs(landmarks[4].x - landmarks[9].x) > 0.08;
  if (isThumbOut) count++;
  if (count === 1 && isThumbOut && landmarks[8].y > landmarks[6].y) return 6;
  return count === 0 ? 0 : count;
}

let lastDetectedNumber = -1, detectionStartTime = 0;
const HOLD_TIME = 1500;

function onHandResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 3});
    drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1, radius: 2});
    
    let detectedNumber = countFingers(landmarks);
    
    if (detectedNumber > 0 && detectedNumber <= 6 && !isGameOver) {
      if (detectedNumber === lastDetectedNumber) {
        let elapsedTime = Date.now() - detectionStartTime;
        let progress = Math.min(100, (elapsedTime / HOLD_TIME) * 100);
        canvasCtx.font = "bold 24px Arial"; canvasCtx.fillStyle = "#ffaa00";
        canvasCtx.fillText("Locking: " + Math.round(progress) + "%", 15, 80);
        
        if (elapsedTime >= HOLD_TIME) {
          triggerCameraMove(detectedNumber);
          lastDetectedNumber = -1; 
        }
      } else {
        lastDetectedNumber = detectedNumber;
        detectionStartTime = Date.now();
      }
    } else lastDetectedNumber = -1;
    
    canvasCtx.font = "bold 40px Arial"; canvasCtx.fillStyle = "#00ff88"; 
    canvasCtx.fillText("Move: " + detectedNumber, 15, 45);
  }
  canvasCtx.restore();
}

function triggerCameraMove(cameraNumber) {
  if (isGameOver) return;
  
  if (!isMultiplayer) {
    // VS COMPUTER MODE
    const computerNumber = Math.floor(Math.random() * 6) + 1;
    computerText.textContent = `Computer chose: ${computerNumber}`;
    
    if (cameraNumber === computerNumber) {
      commentaryText.textContent = "🏏 OUT!";
      setTimeout(handleOut, 1000);
    } else {
      let runs = (playerRole === "bat") ? cameraNumber : computerNumber;
      score += runs;
      commentaryText.textContent = playerRole === "bat" ? `🏏 You scored ${cameraNumber} runs!` : `🤖 Computer scored ${computerNumber} runs!`;
      updateUI();
      if (target && score >= target) {
        endMatch(playerRole === "bat" ? "🎉 You Won the Match!" : "🤖 Computer Won the Match!");
      }
    }
  } else {
    // MULTIPLAYER MODE
    commentaryText.textContent = `Locked ${cameraNumber}. Waiting for opponent...`;
    if (playerId === 1) database.ref('rooms/' + roomId).update({ p1Move: cameraNumber });
    else database.ref('rooms/' + roomId).update({ p2Move: cameraNumber });
  }
}
