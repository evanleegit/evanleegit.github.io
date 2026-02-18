// tank.js
// A quiet ASCII fish tank
// "A quiet place to arrive before going elsewhere."

/* =========================
   Configuration
========================= */

const TANK_WIDTH = 36;
const TANK_HEIGHT = 12;

const FPS = 24;
const FRAME_TIME = 1000 / FPS;

const FISH_SPRITE_RIGHT = "><(((°>";
const FISH_SPRITE_LEFT  = "<°)))><";
const FISH_WIDTH = FISH_SPRITE_RIGHT.length;

const FISH_COUNT = 3;

const GRAVITY = 0.01;
const WATER_DRAG = 0.85;

const FISH_SPEED_MIN = 0.2;
const FISH_SPEED_MAX = 0.6;

const FOOD_SWAY = 0.01;


const FOOD_ATTRACTION_RADIUS = 10;
const FOOD_REACTION_DELAY_MIN = 50;
const FOOD_REACTION_DELAY_MAX = 150;
const FISH_STEER_STRENGTH = 0.02;
const EAT_DISTANCE = 1.5;

const FOOD_BOTTOM = TANK_HEIGHT - 1; // one row above bottom


/* =========================
   DOM References
========================= */

// Assumes <pre id="tank"></pre> in HTML
const tankEl = document.getElementById("tank");

/* =========================
   State
========================= */

let fish = [];
let food = [];
let bubbles = [];

let lastFrameTime = 0;

/* =========================
   Utility
========================= */

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/* =========================
   Entities
========================= */

function createFish() {
  const direction = Math.random() < 0.5 ? 1 : -1;

  return {
    x: rand(5, TANK_WIDTH - 5),
    y: rand(3, TANK_HEIGHT - 3),
    vx: direction * rand(FISH_SPEED_MIN, FISH_SPEED_MAX),
    vy: rand(-0.03, 0.03),
    direction,
    turnTimer: 0,
    nextTurn: rand(8000, 20000), // ms

    targetFood: null,
    noticeDelay: 0
  };
}

function createFood(x) {
  return {
    x,
    y: 0,
    vy: 0,
    eaten: false
  };
}

function findNearbyFood(fish) {
  return food.find(p => !p.eaten && distance(fish, p) < FOOD_ATTRACTION_RADIUS);
}
/* =========================
   Initialization
========================= */

function init() {
  fish = [];
  food = [];

  for (let i = 0; i < FISH_COUNT; i++) {
    fish.push(createFish());
  }

  tankEl.addEventListener("click", handleClick);

  requestAnimationFrame(loop);
}

/* =========================
   Input
========================= */

function handleClick(e) {
  const rect = tankEl.getBoundingClientRect();
  const relX = e.clientX - rect.left;

  const x = Math.floor((relX / rect.width) * TANK_WIDTH);
  food.push(createFood(clamp(x, 1, TANK_WIDTH - 2)));
}

/* =========================
   Update
========================= */

function updateFish(dt) {
  fish.forEach(f => {
    // turn logic
    if (!f.targetFood) {
        f.turnTimer += dt;
        if (f.turnTimer > f.nextTurn) {
            f.vx *= -1;
            f.direction *= -1;
            f.turnTimer = 0;
            f.nextTurn = rand(8000, 20000);
        }
    }
// notice nearby food (if none currently)
if (!f.targetFood) {
  const nearby = findNearbyFood(f);

  if (nearby) {
    if (!f.noticeDelay) {
      f.noticeDelay = rand(FOOD_REACTION_DELAY_MIN, FOOD_REACTION_DELAY_MAX);
    } else {
      f.noticeDelay -= dt;
      if (f.noticeDelay <= 0) {
        f.targetFood = nearby;
        f.noticeDelay = 0;
      }
    }
  }
}

// steering toward target food (if any)
if (f.targetFood && !f.targetFood.eaten) {
  const dx = f.targetFood.x - f.x;
  const dy = f.targetFood.y - f.y;

  const desiredVx =
  Math.abs(dx) < 0.5
  ? f.direction * Math.abs(f.vx)
  : Math.sign(dx) * Math.abs(f.vx);
  const desiredVy = clamp(dy * 0.02, -0.05, 0.05);

  f.vx = lerp(f.vx, desiredVx, FISH_STEER_STRENGTH);
  f.vy = lerp(f.vy, desiredVy, FISH_STEER_STRENGTH);

  // eating
  if (distance(f, f.targetFood) < EAT_DISTANCE) {
    f.targetFood.eaten = true;
    f.targetFood = null;

    // brief pause
    f.vx *= 0.5;
    f.vy *= 0.5;
  }
}

const MIN_VX = 0.3;
if (Math.abs(f.vx) < MIN_VX) {
  f.vx = f.direction * MIN_VX;
}


    // movement
    f.x += f.vx;
    f.y += f.vy;

    // gentle vertical drift
    f.vy += rand(-0.002, 0.002);
    f.vy = clamp(f.vy, -0.05, 0.05);

    // wall awareness
const leftBound = 1;
const rightBound = TANK_WIDTH - 1;

if (f.direction === 1) {
  // moving right → check front of sprite
  if (f.direction === 1 && f.x + FISH_WIDTH >= rightBound) {
    f.vx = -Math.abs(f.vx);
    f.direction = -1;
    f.x = rightBound - FISH_WIDTH; // prevent sprite from going past
  } else if (f.direction === -1 && f.x <= leftBound) {
    f.vx = Math.abs(f.vx);
    f.direction = 1;
    f.x = leftBound; // prevent sprite from going past
    }

} else {
  // moving left → check front of sprite
  if (f.x <= leftBound) {
    f.vx = Math.abs(f.vx);
    f.direction = 1;
  }
}


    f.y = clamp(f.y, 2, TANK_HEIGHT - 2);
  });
}

function updateFood(dt) {
  food.forEach(p => {
    if (!p.eaten) {
      p.vy += GRAVITY;      // slow gravity
      p.vy *= WATER_DRAG;   // gentle drag

      p.y += p.vy;
      p.x += Math.sin(Date.now() * 0.001) * FOOD_SWAY;

      // limit food to tank bottom, no bouncing
      if (p.y > TANK_HEIGHT - 2) {
        p.y = TANK_HEIGHT - 2;
        p.vy = 0;
      }

      if (p.y > FOOD_BOTTOM) {
        p.y = FOOD_BOTTOM;
        p.vy = 0;
}
    }
  });

  // Remove eaten or old food
  food = food.filter(p => !p.eaten && p.y < TANK_HEIGHT + 2);
}


/* =========================
   Rendering
========================= */

function createEmptyGrid() {
  const grid = [];

  for (let y = 0; y < TANK_HEIGHT; y++) {
    grid[y] = Array(TANK_WIDTH).fill(" ");
  }

  return grid;
}

function drawBorders(grid, time = 0) {
  const wavePattern = "~~~"; // calm water pattern
  const offset = Math.floor(time * 0.002);

  // Top row of the tank: waves inside the walls
  for (let x = 0; x < TANK_WIDTH; x++) {
    if (x === 0) {
      grid[0][x] = "│"; // left wall
    } else if (x === TANK_WIDTH - 1) {
      grid[0][x] = "│"; // right wall
    } else {
      grid[0][x] = wavePattern[(x + offset) % wavePattern.length]; // water
    }
  }

  // Side walls for the rest of the tank
  for (let y = 1; y < TANK_HEIGHT - 1; y++) {
    grid[y][0] = "│";
    grid[y][TANK_WIDTH - 1] = "│";
  }

  // Bottom corners
  grid[TANK_HEIGHT - 1][0] = "└";
  grid[TANK_HEIGHT - 1][TANK_WIDTH - 1] = "┘";

  // Bottom line
  for (let x = 1; x < TANK_WIDTH - 1; x++) {
    grid[TANK_HEIGHT - 1][x] = "─";
  }
}




function drawFood(grid) {
  food.forEach(p => {
    const x = Math.floor(p.x);
    const y = Math.floor(p.y);
    if (grid[y] && grid[y][x]) {
      grid[y][x] = "*";
    }
  });
}

function drawFish(grid) {
  fish.forEach(f => {
    const sprite =
      f.direction === 1 ? "><(((°>" : "<°)))><";

    const x = Math.floor(f.x);
    const y = Math.floor(f.y);
    
    for (let i = 0; i < sprite.length; i++) {
        const px = x + i;
        if (px >= 0 && px < TANK_WIDTH && y >= 0 && y < TANK_HEIGHT) {grid[y][px] = sprite[i];
  }
}

  });
}

function render() {
  const grid = createEmptyGrid();

  drawBorders(grid, Date.now());
  drawBubbles(grid);
  drawFood(grid);
  drawFish(grid);

  tankEl.textContent = grid.map(row => row.join("")).join("\n");
}


/* =========================
   Bubbles
========================= */
function createBubble() {
  return {
    x: rand(2, TANK_WIDTH - 3),
    y: TANK_HEIGHT - 2,
    vy: -rand(0.04, 0.1), // faster upward movement
    char: Math.random() < 0.5 ? "o" : "."
  };
}

function updateBubbles(dt) {
  // much lower spawn chance
  if (Math.random() < 0.005) {
    bubbles.push(createBubble());
  }

  // move bubbles
  bubbles.forEach(b => {
    b.y += b.vy;
  });

  // remove bubbles that reach the top (row 0)
  bubbles = bubbles.filter(b => b.y > 0);
}


function drawBubbles(grid) {
  bubbles.forEach(b => {
    const x = Math.floor(b.x);
    const y = Math.floor(b.y);
    if (grid[y] && grid[y][x] === " ") { // only draw if empty
      grid[y][x] = b.char;
    }
  });
}


/* =========================
   Main Loop
========================= */

function loop(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const dt = timestamp - lastFrameTime;

  if (dt >= FRAME_TIME) {
    updateFish(dt);
    updateFood(dt);
    updateBubbles(dt);  // move bubbles
    render();           // draw everything
    lastFrameTime = timestamp;
  }

  requestAnimationFrame(loop);
}


/* =========================
   Start
========================= */

init();
