const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const startBtn = document.getElementById('start-btn');

const GRID_SIZE = 20;
const CELL = canvas.width / GRID_SIZE;
const TICK_MS = 120;

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

let snake;
let direction;
let nextDirection;
let food;
let score;
let highScore = Number(localStorage.getItem('snake-high-score')) || 0;
let gameLoop = null;
let state = 'idle';

highScoreEl.textContent = highScore;

function initGame() {
  const startX = Math.floor(GRID_SIZE / 2);
  const startY = Math.floor(GRID_SIZE / 2);

  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];

  direction = { x: 1, y: 0 };
  nextDirection = { ...direction };
  score = 0;
  scoreEl.textContent = score;
  spawnFood();
}

function spawnFood() {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  let pos;

  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (occupied.has(`${pos.x},${pos.y}`));

  food = pos;
}

function isOpposite(a, b) {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

function handleKeydown(e) {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const newDir = DIRECTIONS[key];

  if (newDir && !isOpposite(newDir, direction)) {
    nextDirection = newDir;
    e.preventDefault();
  }

  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    if (state === 'playing') {
      pauseGame();
    } else if (state === 'paused') {
      resumeGame();
    } else {
      startGame();
    }
  }
}

function drawCell(x, y, color, radius = 3) {
  const px = x * CELL;
  const py = y * CELL;
  const pad = 1;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, radius);
  ctx.fill();
}

function drawGrid() {
  ctx.fillStyle = '#1a2332';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(45, 58, 79, 0.4)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(canvas.width, i * CELL);
    ctx.stroke();
  }
}

function draw() {
  drawGrid();

  drawCell(food.x, food.y, '#ff6b6b', 6);

  snake.forEach((segment, i) => {
    const isHead = i === 0;
    const color = isHead ? '#3dd68c' : '#2a9d6a';
    drawCell(segment.x, segment.y, color, isHead ? 5 : 3);
  });
}

function update() {
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    gameOver();
    return;
  }

  if (snake.some((s) => s.x === head.x && s.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;

    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      localStorage.setItem('snake-high-score', highScore);
    }

    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function showOverlay(title, message, buttonText) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  startBtn.textContent = buttonText;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function startGame() {
  if (gameLoop) clearInterval(gameLoop);

  initGame();
  draw();
  hideOverlay();
  state = 'playing';
  gameLoop = setInterval(update, TICK_MS);
}

function pauseGame() {
  clearInterval(gameLoop);
  gameLoop = null;
  state = 'paused';
  showOverlay('Пауза', 'Нажмите пробел, чтобы продолжить', 'Продолжить');
}

function resumeGame() {
  hideOverlay();
  state = 'playing';
  gameLoop = setInterval(update, TICK_MS);
}

function gameOver() {
  clearInterval(gameLoop);
  gameLoop = null;
  state = 'idle';
  showOverlay('Игра окончена', `Ваш счёт: ${score}`, 'Играть снова');
}

startBtn.addEventListener('click', () => {
  if (state === 'paused') {
    resumeGame();
  } else {
    startGame();
  }
});

document.addEventListener('keydown', handleKeydown);

drawGrid();
showOverlay('Змейка', 'Собирайте красные яблоки и не врезайтесь в стены и хвост', 'Играть');
