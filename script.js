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

// 3. Game Variables
let playerChoice = "";
let playerRole = "";
let score = 0;
let innings = 1;
let firstInningsScore = 0;
let target = null;
let isMultiplayer = false;
let roomId = null;
let playerId = 1; // 1 for Host (P1), 2 for Joiner (P2)
let isGameOver = false;

// 4. Sound Function
function playSound(sound) {
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(function () {});
  }
}

// 5. Buttons Logic (Gichh Midd Fix)
// Offline Khelna hai (Vs Computer)
playBtn.addEventListener("click", () => {
  homeScreen.classList.add("hidden");
  tossScreen.classList.remove("hidden");
  isMultiplayer = false;
});

// Online Khelna hai (Play Online)
onlineBtn.addEventListener("click", () => {
  homeScreen.classList.add("hidden");
  multiplayerScreen.classList.remove("hidden");
  isMultiplayer = true;
});

// 6. Baaki ka Purana Game Logic (Vs Computer + Multiplayer Smart Sync)
tossChoices.forEach(button => {
  button.addEventListener("click", () => {
    playerChoice = button.dataset.choice;
    const firstChoiceButtons = document.querySelector(".choice-buttons");
    if (firstChoiceButtons) firstChoiceButtons.classList.add("hidden");
    const tossParagraph = document.querySelector(".toss-screen p");
    if (tossParagraph) tossParagraph.textContent = `You selected ${playerChoice.toUpperCase()}. Now choose your number.`;
    numberSelection.classList.remove("hidden");
  });
});

numberButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (isMultiplayer && playerId === 2) {
      alert("Bhai, Player 1 ko toss karne de! Tu wait kar.");
      return;
    }

    const playerNumber = parseInt(button.dataset.number);
    const computerNumber = Math.floor(Math.random() * 6) + 1;
    const total = playerNumber + computerNumber;
    const result = total % 2 === 0 ? "even" : "odd";
    let message = `You chose: ${playerNumber}\nComputer chose: ${computerNumber}\nTotal = ${total} (${result.toUpperCase()})\n\n`;

    if (result === playerChoice) {
      alert(message + "🎉 You won the toss!");
      tossScreen.classList.add("hidden");
      batBowlScreen.classList.remove("hidden");
    } else {
      const computerDecision = Math.random() < 0.5 ? "BAT" : "BOWL";
      alert(message + `🤖 Computer won the toss!\nComputer chooses to ${computerDecision}.`);
      playerRole = computerDecision === "BAT" ? "bowl" : "bat";
      
      if (isMultiplayer) {
        database.ref('rooms/' + roomId).update({
          tossWinner: 2,
          tossDecision: computerDecision.toLowerCase(),
          gameState: "playing"
        });
      }
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

function startGame() {
  score = 0;
  isGameOver = false;
  batBowlScreen.classList.add("hidden");
  tossScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  updateUI();
  startAI();

  // Multiplayer Listener: Dono players ke moves track karne ke liye
  if (isMultiplayer && roomId) {
    database.ref('rooms/' + roomId).on('value', (snapshot) => {
      const data = snapshot.val();
      if (data && data.p1Move > 0 && data.p2Move > 0 && !isGameOver) {
        processMultiplayerTurn(data.p1Move, data.p2Move);
      }
    });
  }
}

function processMultiplayerTurn(m1, m2) {
  let myMove = (playerId === 1) ? m1 : m2;
  let oppMove = (playerId === 1) ? m2 : m1;
  
  let batMove = (playerRole === "bat") ? myMove : oppMove;
  let bowlMove = (playerRole === "bat") ? oppMove : myMove;

  computerText.textContent = `Opponent chose: ${oppMove}`;

  if (batMove === bowlMove) {
    commentaryText.textContent = "🏏 OUT!";
    setTimeout(handleOut, 300);
  } else {
    if (playerRole === "bat") {
      score += batMove;
      commentaryText.textContent = `🏏 You scored ${batMove} runs!`;
    } else {
      score += batMove;
      commentaryText.textContent = `🤖 Opponent scored ${batMove} runs!`;
    }
    scoreText.textContent = `Score: ${score}`;

    if (target && score >= target) {
      if (playerRole === "bat") endMatch("🎉 You Won the Match!");
      else endMatch("❌ Opponent Won the Match!");
    }
  }
  
  // Game state clear karna agli ball ke liye (Sirf P1 karega taaki loop na bane)
  if (playerId === 1) {
    setTimeout(() => database.ref('rooms/' + roomId).update({ p1Move: 0, p2Move: 0 }), 500);
  }
}

function updateUI() {
  gameRole.textContent = playerRole === "bat" ? "🏏 You are Batting" : "🎯 You are Bowling";
  scoreText.textContent = `Score: ${score}`;
  targetText.textContent = target ? `Target: ${target}` : "Target: --";
  computerText.textContent = isMultiplayer ? "Opponent chose: ?" : "Computer chose: ?";
  commentaryText.textContent = innings === 1 ? "First Innings - Choose a number." : "Second Innings - Chase the target!";
}

gameNumberButtons.forEach(button => {
  button.addEventListener("click", () => {
    const playerNumber = parseInt(button.dataset.number);
    
    if (isMultiplayer) {
      commentaryText.textContent = `Locked ${playerNumber}. Waiting for opponent...`;
      if (playerId === 1) database.ref('rooms/' + roomId).update({ p1Move: playerNumber });
      else database.ref('rooms/' + roomId).update({ p2Move: playerNumber });
    } else {
      // VS Computer Mode Standard Logic
      const computerNumber = Math.floor(Math.random() * 6) + 1;
      computerText.textContent = `Computer chose: ${computerNumber}`;

      if (playerNumber === computerNumber) {
        commentaryText.textContent = "🏏 OUT!";
        setTimeout(handleOut, 300);
        return;
      }

      if (playerRole === "bat") {
        score += playerNumber;
        commentaryText.textContent = `🏏 You scored ${playerNumber} runs!`;
      } else {
        score += computerNumber;
        commentaryText.textContent = `🤖 Computer scored ${computerNumber} runs!`;
      }
      scoreText.textContent = `Score: ${score}`;

      if (target && score >= target) {
        if (playerRole === "bat") endMatch("🎉 You Won the Match!");
        else endMatch("🤖 Computer Won the Match!");
      }
    }
  });
});

function handleOut() {
  if (innings === 1) {
    firstInningsScore = score;
    target = firstInningsScore + 1;
    innings = 2;
    playerRole = playerRole === "bat" ? "bowl" : "bat";
    score = 0;
    alert(`🏏 First Innings Over!\nScore: ${firstInningsScore}\nTarget: ${target}`);
    updateUI();
  } else {
    if (score === target - 1) endMatch("🤝 Match Draw!");
    else if (playerRole === "bat") endMatch(isMultiplayer ? "❌ Opponent Won the Match!" : "🤖 Computer Won the Match!");
    else endMatch("🎉 You Won the Match!");
  }
}

function endMatch(message) {
  isGameOver = true;
  if (message === "🎉 You Won the Match!") playSound(winSound);
  gameScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");
  resultTitle.textContent = message;
  resultSummary.textContent = `1st Innings: ${firstInningsScore} | Target: ${target}`;
}

playAgainBtn.addEventListener("click", () => { location.reload(); });

// ==========================================
// 🌐 MULTIPLAYER FIREBASE LOGIC 🌐
// ==========================================

createRoomBtn.addEventListener("click", () => {
  roomId = Math.floor(1000 + Math.random() * 9000).toString();
  playerId = 1; 

  database.ref('rooms/' + roomId).set({
    player1: true,
    player2: false,
    gameState: "waiting",
    p1Move: 0,
    p2Move: 0,
    tossWinner: "",
    tossDecision: ""
  });

  roomControls.classList.add("hidden");
  waitingArea.classList.remove("hidden");
  displayRoomId.textContent = "Room ID: " + roomId;

  database.ref('rooms/' + roomId + '/player2').on('value', (snapshot) => {
    if (snapshot.val() === true) {
      alert("🎉 Dost aa gaya! Get ready for Toss.");
      multiplayerScreen.classList.add("hidden");
      tossScreen.classList.remove("hidden");
      
      if (playerId === 1) {
          database.ref('rooms/' + roomId).update({ gameState: "toss" });
      }
    }
  });
});

joinRoomBtn.addEventListener("click", () => {
  const enteredId = roomInput.value.trim();
  
  if (enteredId === "") {
    alert("Bhai, pehle Room ID toh daal!");
    return;
  }

  database.ref('rooms/' + enteredId).once('value', (snapshot) => {
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      
      if (roomData.player2 === false) {
        roomId = enteredId;
        playerId = 2; 
        
        database.ref('rooms/' + roomId).update({
          player2: true
        });

        alert("🎉 Room Joined! Match shuru karte hain...");
        multiplayerScreen.classList.add("hidden");
        tossScreen.classList.remove("hidden");
        
        // Player 2 listens for Game State update from P1
        database.ref('rooms/' + roomId).on('value', (roomSnapshot) => {
          const data = roomSnapshot.val();
          if (data && data.gameState === "playing" && playerRole === "") {
            if (data.tossWinner === 1) {
              playerRole = (data.tossDecision === "bat") ? "bowl" : "bat";
            } else if (data.tossWinner === 2) {
              playerRole = (data.tossDecision === "bat") ? "bat" : "bowl";
            }
            alert(`Toss Done! You are ${playerRole.toUpperCase()}ing.`);
            startGame();
          }
        });
        
      } else {
        alert("Ye room pehle se full hai bhai!");
      }
    } else {
      alert("Room nahi mila! ID check kar le.");
    }
  });
});

// ==========================================
// 🤖 AI CAMERA & HAND DETECTION SETUP 🤖
// ==========================================
const cameraContainer = document.getElementById("cameraContainer");
const videoElement = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1, 
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(onHandResults);

function countFingers(landmarks) {
  let count = 0;
  if (landmarks[8].y < landmarks[6].y) count++;
  if (landmarks[12].y < landmarks[10].y) count++;
  if (landmarks[16].y < landmarks[14].y) count++;
  if (landmarks[20].y < landmarks[18].y) count++;

  let isThumbOut = Math.abs(landmarks[4].x - landmarks[9].x) > 0.08;
  if (isThumbOut) count++;

  if (count === 1 && isThumbOut && landmarks[8].y > landmarks[6].y) {
     return 6;
  }
  return count === 0 ? 0 : count;
}

let lastDetectedNumber = -1;
let detectionStartTime = 0;
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
        
        canvasCtx.font = "bold 24px Arial";
        canvasCtx.fillStyle = "#ffaa00";
        canvasCtx.fillText("Locking: " + Math.round(progress) + "%", 15, 80);
        
        if (elapsedTime >= HOLD_TIME) {
          triggerCameraMove(detectedNumber);
          lastDetectedNumber = -1; 
        }
      } else {
        lastDetectedNumber = detectedNumber;
        detectionStartTime = Date.now();
      }
    } else {
      lastDetectedNumber = -1;
    }
    
    canvasCtx.font = "bold 40px Arial";
    canvasCtx.fillStyle = "#00ff88"; 
    canvasCtx.fillText("Move: " + detectedNumber, 15, 45);
  }
  canvasCtx.restore();
}

function triggerCameraMove(cameraNumber) {
  if (isGameOver) return; 
  
  if (isMultiplayer) {
    commentaryText.textContent = `Locked ${cameraNumber} (Camera). Waiting for opponent...`;
    if (playerId === 1) database.ref('rooms/' + roomId).update({ p1Move: cameraNumber });
    else database.ref('rooms/' + roomId).update({ p2Move: cameraNumber });
  } else {
    const computerNumber = Math.floor(Math.random() * 6) + 1;
    computerText.textContent = `Computer chose: ${computerNumber}`;

    if (cameraNumber === computerNumber) {
      commentaryText.textContent = "🏏 OUT! (Camera Shot)";
      setTimeout(handleOut, 300);
      return;
    }

    if (playerRole === "bat") {
      score += cameraNumber;
      commentaryText.textContent = `🏏 Camera Shot: You scored ${cameraNumber} runs!`;
    } else {
      score += computerNumber;
      commentaryText.textContent = `🤖 Computer scored ${computerNumber} runs!`;
    }
    scoreText.textContent = `Score: ${score}`;

    if (target && score >= target) {
      if (playerRole === "bat") endMatch("🎉 You Won the Match!");
      else endMatch("🤖 Computer Won the Match!");
    }
  }
}

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 300,
  height: 225
});

function startAI() {
  cameraContainer.style.display = "block"; 
  camera.start(); 
}
