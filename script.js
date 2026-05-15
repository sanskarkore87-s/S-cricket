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

// 6. Baaki ka Purana Game Logic (Vs Computer ke liye)
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
      startGame();
    }
  });
});

batBtn.addEventListener("click", () => { playerRole = "bat"; startGame(); });
bowlBtn.addEventListener("click", () => { playerRole = "bowl"; startGame(); });

function startGame() {
  score = 0;
  batBowlScreen.classList.add("hidden");
  tossScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  updateUI();
}

function updateUI() {
  gameRole.textContent = playerRole === "bat" ? "🏏 You are Batting" : "🎯 You are Bowling";
  scoreText.textContent = `Score: ${score}`;
  targetText.textContent = target ? `Target: ${target}` : "Target: --";
  computerText.textContent = "Computer chose: ?";
  commentaryText.textContent = innings === 1 ? "First Innings - Choose a number." : "Second Innings - Chase the target!";
}

gameNumberButtons.forEach(button => {
  button.addEventListener("click", () => {
    const playerNumber = parseInt(button.dataset.number);
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
    else if (playerRole === "bat") endMatch("🤖 Computer Won the Match!");
    else endMatch("🎉 You Won the Match!");
  }
}

function endMatch(message) {
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

// 1. Create Room (Room banane ka logic)
createRoomBtn.addEventListener("click", () => {
  // 4-digit ka random Room ID banana
  roomId = Math.floor(1000 + Math.random() * 9000).toString();
  playerId = 1; // Tu Player 1 (Creator) hai

  // Firebase me room ka data save karna
  database.ref('rooms/' + roomId).set({
    player1: true,
    player2: false,
    gameState: "waiting"
  });

  // UI update karna (Code dikhana)
  roomControls.classList.add("hidden");
  waitingArea.classList.remove("hidden");
  displayRoomId.textContent = "Room ID: " + roomId;

  // Player 2 ka wait karna (Realtime Listen)
  database.ref('rooms/' + roomId + '/player2').on('value', (snapshot) => {
    if (snapshot.val() === true) {
      alert("🎉 Dost aa gaya! Get ready for Toss.");
      multiplayerScreen.classList.add("hidden");
      tossScreen.classList.remove("hidden");
    }
  });
});

// 2. Join Room (Dost ke room me ghusne ka logic)
joinRoomBtn.addEventListener("click", () => {
  const enteredId = roomInput.value.trim();
  
  if (enteredId === "") {
    alert("Bhai, pehle Room ID toh daal!");
    return;
  }

  // Firebase me check karna ki room hai ya nahi
  database.ref('rooms/' + enteredId).once('value', (snapshot) => {
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      
      if (roomData.player2 === false) {
        // Room me join karna
        roomId = enteredId;
        playerId = 2; // Tu Player 2 (Joiner) hai
        
        database.ref('rooms/' + roomId).update({
          player2: true,
          gameState: "connected"
        });

        alert("🎉 Room Joined! Match shuru karte hain...");
        multiplayerScreen.classList.add("hidden");
        tossScreen.classList.remove("hidden");
        
      } else {
        alert("Ye room pehle se full hai bhai!");
      }
    } else {
      alert("Room nahi mila! ID check kar le.");
    }
  });
});
