let startGame = false;
let controllable = false;
let player,
  playerBox,
  playerBoundingBox = undefined;

let playerProximityBox,
  playerProximityBoundingBox = undefined;
let arcadeMachineBox,
  arcadeMachineBoundingBox = undefined;

let victoryPoints = 0;
let victoryPointsContainer = document.getElementById("victoryPoints");
let vpExecuted = true;

let fightingGameTimer,
  fightingGameTimerId = null;
let animateMiniGame = null;

const startButton = document.querySelector("#startButton");
const fightingGame = document.getElementById("fightingGame");
const fightingGameStyles = document.querySelector("#fightingGameStyles");
const fgMenu = document.querySelector("#displayTextContainer");
const fgPlayAgain = document.getElementById("fgPlayAgain");
const fgExit = document.getElementById("fgExit");

const startFightingGame = function () {
  controllable = false;
  vpExecuted = true;
  fgMenu.style.display = "none";
  fightingGame.style.display = "block";
  fightingGameStyles.innerHTML = "*{box-sizing: border-box;}";
  fightingGameTimer = 40;
  playerFighter.heal();
  enemyFighter.heal();
  playerFighter.position.x = 0;
  playerFighter.position.y = 50;
  enemyFighter.position.x = 600;
  enemyFighter.position.y = 50;
  decreaseTimer();
};

const endFightingGame = function () {
  fightingGameTimer = 0;
  fightingGameStyles.innerHTML = " ";
  fgMenu.style.display = "none";
  fightingGame.style.display = "none";
  window.cancelAnimationFrame(animate);
  controllable = true;
};
