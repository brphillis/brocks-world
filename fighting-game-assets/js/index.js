//CANVAS SETTINGS
const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 576;
c.fillRect(0, 0, canvas.width, canvas.height);

const gravity = 0.7;
const background = new Sprite({
  position: {
    x: 0,
    y: 0,
  },
  imageSrc: "./fighting-game-assets/background.png",
});

//DETERMINE COLLISION
function rectangularCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.attackBox.position.x + rectangle1.attackBox.width >=
      rectangle2.position.x &&
    rectangle1.attackBox.position.x <=
      rectangle2.position.x + rectangle2.width &&
    rectangle1.attackBox.position.y + rectangle1.attackBox.height >=
      rectangle2.position.y &&
    rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
  );
}

//DETERMINE WINNER
function determineWinner({ playerFighter, enemyFighter, fightingGameTimerId }) {
  clearTimeout(fightingGameTimerId);
  clearInterval(fightingGameTimerId);
  document.querySelector("#displayTextContainer").style.display = "flex";
  if (playerFighter.health === enemyFighter.health) {
    document.querySelector("#displayText").innerHTML = "Tie!";
  } else if (playerFighter.health > enemyFighter.health) {
    document.querySelector("#displayText").innerHTML = "Player 1 Wins!";
    if (vpExecuted) {
      victoryPoints++;
      vpExecuted = false;
      console.log(victoryPoints);
    }
  } else if (playerFighter.health < enemyFighter.health) {
    document.querySelector("#displayText").innerHTML = "Player 2 Wins!";
  }
}

//TIMER
function decreaseTimer() {
  if (fightingGameTimer > 0) {
    fightingGameTimerId = setTimeout(decreaseTimer, 1000);
    fightingGameTimer--;
    document.querySelector("#timer").innerHTML = fightingGameTimer;
  }
}

const shop = new Sprite({
  position: {
    x: 650,
    y: 223.5,
  },
  imageSrc: "./fighting-game-assets/shop.png",
  scale: 2,
  framesMax: 6,
});

/////////PLAYER/////////
const playerFighter = new Fighter({
  position: {
    x: 0,
    y: 0,
  },
  velocity: {
    x: 0,
    y: 0,
  },
  offset: {
    x: 0,
    y: 0,
  },
  imageSrc: "./fighting-game-assets/king/Idle.png",
  framesMax: 6,
  scale: 1.4,
  offset: {
    x: 10,
    y: 14,
  },
  sprites: {
    idle: {
      imageSrc: "./fighting-game-assets/king/Idle.png",
      framesMax: 6,
    },
    run: {
      imageSrc: "./fighting-game-assets/king/Run.png",
      framesMax: 8,
    },
    jump: {
      imageSrc: "./fighting-game-assets/king/Jump.png",
      framesMax: 2,
    },
    fall: {
      imageSrc: "./fighting-game-assets/king/Fall.png",
      framesMax: 2,
    },
    attack1: {
      imageSrc: "./fighting-game-assets/king/Attack_1.png",
      framesMax: 6,
    },
    takeHit: {
      imageSrc: "./fighting-game-assets/king/Hit.png",
      framesMax: 4,
    },
    death: {
      imageSrc: "./fighting-game-assets/king/Death.png",
      framesMax: 11,
    },
  },
  attackBox: {
    offset: {
      x: 0,
      y: 50,
    },
    width: 90,
    height: 100,
  },
});

/////////ENEMY/////////
const enemyFighter = new Fighter({
  position: {
    x: 600,
    y: 100,
  },
  velocity: {
    x: 0,
    y: 0,
  },
  color: "blue",
  offset: {
    x: -50,
    y: 0,
  },
  imageSrc: "./fighting-game-assets/wizard/Idle.png",
  framesMax: 6,
  scale: 1.4,
  offset: {
    x: 10,
    y: 47.5,
  },
  sprites: {
    idle: {
      imageSrc: "./fighting-game-assets/wizard/Idle.png",
      framesMax: 6,
    },
    run: {
      imageSrc: "./fighting-game-assets/wizard/Run.png",
      framesMax: 8,
    },
    jump: {
      imageSrc: "./fighting-game-assets/wizard/Jump.png",
      framesMax: 2,
    },
    fall: {
      imageSrc: "./fighting-game-assets/wizard/Fall.png",
      framesMax: 2,
    },
    attack1: {
      imageSrc: "./fighting-game-assets/wizard/Attack_1.png",
      framesMax: 6,
    },
    takeHit: {
      imageSrc: "./fighting-game-assets/wizard/Hit.png",
      framesMax: 4,
    },
    death: {
      imageSrc: "./fighting-game-assets/wizard/Death.png",
      framesMax: 7,
    },
  },
  attackBox: {
    offset: {
      x: -50,
      y: 50,
    },
    width: 200,
    height: 100,
  },
});

const keys = {
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  ArrowRight: {
    pressed: false,
  },
  ArrowLeft: {
    pressed: false,
  },
};

function animate() {
  window.requestAnimationFrame(animate);
  c.fillStyle = "black";
  c.fillRect(0, 0, canvas.width, canvas.height);
  background.update();
  shop.update();
  c.fillStyle = "rgba(255, 255, 255, 0.08)";
  c.fillRect(0, 0, canvas.width, canvas.height);
  playerFighter.update();
  enemyFighter.update();
  playerFighter.velocity.x = 0;
  enemyFighter.velocity.x = 0;

  // PLAYER MOVEMENT

  if (keys.a.pressed && playerFighter.lastKey === "a") {
    playerFighter.velocity.x = -5;
    playerFighter.switchSprite("run");
  } else if (keys.d.pressed && playerFighter.lastKey === "d") {
    playerFighter.velocity.x = 5;
    playerFighter.switchSprite("run");
  } else {
    playerFighter.switchSprite("idle");
  }

  // jumping
  if (playerFighter.velocity.y < 0) {
    playerFighter.switchSprite("jump");
  } else if (playerFighter.velocity.y > 0) {
    playerFighter.switchSprite("fall");
  }

  // ENEMY MOVEMENT
  if (keys.ArrowLeft.pressed && enemyFighter.lastKey === "ArrowLeft") {
    enemyFighter.velocity.x = -5;
    enemyFighter.switchSprite("run");
  } else if (keys.ArrowRight.pressed && enemyFighter.lastKey === "ArrowRight") {
    enemyFighter.velocity.x = 5;
    enemyFighter.switchSprite("run");
  } else {
    enemyFighter.switchSprite("idle");
  }

  // jumping
  if (enemyFighter.velocity.y < 0) {
    enemyFighter.switchSprite("jump");
  } else if (enemyFighter.velocity.y > 0) {
    enemyFighter.switchSprite("fall");
  }

  // DETECT COLLISION ENEMY
  if (
    rectangularCollision({
      rectangle1: playerFighter,
      rectangle2: enemyFighter,
    }) &&
    playerFighter.isAttacking &&
    playerFighter.framesCurrent === 4
  ) {
    enemyFighter.takeHit();
    playerFighter.isAttacking = false;

    gsap.to("#enemyHealth", {
      width: enemyFighter.health + "%",
    });
  }

  // PLAYER HIT
  if (playerFighter.isAttacking && playerFighter.framesCurrent === 4) {
    playerFighter.isAttacking = false;
  }

  // PLAYER GETS HIT
  if (
    rectangularCollision({
      rectangle1: enemyFighter,
      rectangle2: playerFighter,
    }) &&
    enemyFighter.isAttacking &&
    enemyFighter.framesCurrent === 2
  ) {
    playerFighter.takeHit();
    enemyFighter.isAttacking = false;

    gsap.to("#playerHealth", {
      width: playerFighter.health + "%",
    });
  }

  // PLAYER MISSES
  if (enemyFighter.isAttacking && enemyFighter.framesCurrent === 2) {
    enemyFighter.isAttacking = false;
  }

  //DETERMINE WINNER
  if (playerFighter.health <= 0 || enemyFighter.health <= 0) {
    determineWinner({ playerFighter, enemyFighter });
  }

  if (fightingGameTimer === 0) {
    determineWinner({ playerFighter, enemyFighter });
  }
}
animate();

window.addEventListener("keydown", (event) => {
  if (!playerFighter.dead && !controllable) {
    switch (event.key) {
      case "d":
        keys.d.pressed = true;
        playerFighter.lastKey = "d";
        break;
      case "a":
        keys.a.pressed = true;
        playerFighter.lastKey = "a";
        break;
      case "w":
        playerFighter.velocity.y = -20;
        break;
      case " ":
        playerFighter.attack();
        break;
    }
  }

  if (!enemyFighter.dead && !controllable) {
    switch (event.key) {
      case "ArrowRight":
        keys.ArrowRight.pressed = true;
        enemyFighter.lastKey = "ArrowRight";
        break;
      case "ArrowLeft":
        keys.ArrowLeft.pressed = true;
        enemyFighter.lastKey = "ArrowLeft";
        break;
      case "ArrowUp":
        enemyFighter.velocity.y = -20;
        break;
      case "ArrowDown":
        enemyFighter.attack();

        break;
    }
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "d":
      keys.d.pressed = false;
      break;
    case "a":
      keys.a.pressed = false;
      break;
  }

  // ENEMY KEYS
  switch (event.key) {
    case "ArrowRight":
      keys.ArrowRight.pressed = false;
      break;
    case "ArrowLeft":
      keys.ArrowLeft.pressed = false;
      break;
  }
});
