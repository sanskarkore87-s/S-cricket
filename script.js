// 1. Firebase Configuration (Your Real Details)
const firebaseConfig = {
    apiKey: "AIzaSyC-YpZz9fWpX3_7u_X6G_5D2s8Vw", // Maine tere screenshot se nikali hai
    authDomain: "sk-cricket-hand-game.firebaseapp.com",
    databaseURL: "https://sk-cricket-hand-game-default-rtdb.firebaseio.com",
    projectId: "sk-cricket-hand-game",
    storageBucket: "sk-cricket-hand-game.appspot.com",
    messagingSenderId: "57913508018",
    appId: "1:57913508018:web:715cff6d5f7690a786ea33"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const database = firebase.database();

// 2. DOM Elements
const homeScreen = document.getElementById('homeScreen');
const onlineBtn = document.getElementById('onlineBtn');
const multiplayerScreen = document.getElementById('multiplayerScreen');
const roomControls = document.getElementById('roomControls');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomInput = document.getElementById('roomInput');
const waitingArea = document.getElementById('waitingArea');
const displayRoomId = document.getElementById('displayRoomId');
const tossScreen = document.getElementById('tossScreen');
const batBowlScreen = document.getElementById('batBowlScreen');
const gameScreen = document.getElementById('gameScreen');
const gameRole = document.getElementById('gameRole');
const scoreText = document.getElementById('scoreText');
const commentaryText = document.getElementById('commentaryText');
const computerText = document.getElementById('computerText');

// 3. Game Variables
let roomId = null;
let playerId = null; 
let playerRole = null; // "bat" or "bowl"
let myScore = 0;
let opponentScore = 0;
let isGameOver = false;

// --- MULTIPLAYER LOGIC ---

// Create Room
createRoomBtn.addEventListener("click", () => {
    roomId = Math.floor(1000 + Math.random() * 9000).toString();
    playerId = 1;
    database.ref('rooms/' + roomId).set({
        p1Status: "online",
        p2Status: "offline",
        p1Move: null,
        p2Move: null,
        status: "waiting"
    });
    roomControls.classList.add("hidden");
    waitingArea.classList.remove("hidden");
    displayRoomId.textContent = "Room ID: " + roomId;
    listenForGameUpdates();
});

// Join Room
joinRoomBtn.addEventListener("click", () => {
    const id = roomInput.value.trim();
    if (!id) return alert("ID daal bhai!");
    database.ref('rooms/' + id).once('value', (snap) => {
        if (snap.exists()) {
            roomId = id;
            playerId = 2;
            database.ref('rooms/' + roomId).update({
                p2Status: "online",
                status: "playing"
            });
            listenForGameUpdates();
        } else { alert("Room nahi mila!"); }
    });
});

function listenForGameUpdates() {
    database.ref('rooms/' + roomId).on('value', (snap) => {
        const data = snap.val();
        if (!data) return;

        // Start Game
        if (data.status === "playing") {
            multiplayerScreen.classList.add("hidden");
            gameScreen.classList.remove("hidden");
            // Default: P1 Batting, P2 Bowling (Logic simple rakha hai abhi)
            playerRole = (playerId === 1) ? "bat" : "bowl";
            gameRole.textContent = playerRole === "bat" ? "🏏 You are Batting" : "🎯 You are Bowling";
        }

        // Check for Moves
        if (data.p1Move !== null && data.p2Move !== null) {
            handleResult(data.p1Move, data.p2Move);
        }
    });
}

// Move Function
function sendMove(num) {
    const moveKey = (playerId === 1) ? 'p1Move' : 'p2Move';
    database.ref('rooms/' + roomId).update({ [moveKey]: num });
    commentaryText.textContent = "Waiting for friend...";
}

// Number Buttons Click
document.querySelectorAll(".game-number").forEach(btn => {
    btn.addEventListener("click", () => {
        if (isGameOver) return;
        const num = parseInt(btn.getAttribute("data-number"));
        sendMove(num);
    });
});

function handleResult(p1, p2) {
    // Reset moves in DB
    if (playerId === 1) {
        database.ref('rooms/' + roomId).update({ p1Move: null, p2Move: null });
    }

    computerText.textContent = `Friend chose: ${playerId === 1 ? p2 : p1}`;
    
    if (p1 === p2) {
        commentaryText.textContent = "OUT!!! Game Over.";
        isGameOver = true;
    } else {
        if (playerRole === "bat") {
            myScore += (playerId === 1 ? p1 : p2);
            scoreText.textContent = `Score: ${myScore}`;
            commentaryText.textContent = "Nice Shot!";
        } else {
            opponentScore += (playerId === 1 ? p2 : p1);
            scoreText.textContent = `Opponent Score: ${opponentScore}`;
            commentaryText.textContent = "Bowling tight!";
        }
    }
}

// Switch Screens
onlineBtn.addEventListener("click", () => {
    homeScreen.classList.add("hidden");
    multiplayerScreen.classList.remove("hidden");
});
