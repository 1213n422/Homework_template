let mosquitoColors = [
  "#FFB3BA",
  "#FFCC80",
  "#FFF59D",
  "#B5EAD7",
  "#BDE0FE",
  "#CDB4DB",
  "#A8DADC",
  "#F1C0E8",
  "#CDEAC0",
  "#FFD6A5",
  "#B8F2E6",
  "#D0BFFF"
];

let mosquitoes = [];
let dots = [];

let isTouching = false;
let lastTouchTime = 0;

const SHIELD_RADIUS = 30;
const WALL_TOUCH_RADIUS = 55;


function setup() {

  const canvas = createCanvas(
    windowWidth,
    windowHeight
  );

  noStroke();
  background("#111111");

  const canvasElement = canvas.elt;

  canvasElement.style.touchAction = "none";
  canvasElement.style.userSelect = "none";
  canvasElement.style.webkitUserSelect = "none";
  canvasElement.style.webkitTouchUserSelect = "none";
  canvasElement.style.webkitTouchCallout = "none";

  canvasElement.addEventListener(
    "touchstart",
    nativeTouchStart,
    { passive: false }
  );

  canvasElement.addEventListener(
    "touchmove",
    nativeTouchMove,
    { passive: false }
  );

  canvasElement.addEventListener(
    "touchend",
    nativeTouchEnd,
    { passive: false }
  );

  canvasElement.addEventListener(
    "touchcancel",
    nativeTouchEnd,
    { passive: false }
  );

  frameRate(60);

  for (let i = 0; i < 12; i++) {
    mosquitoes.push(
      createMosquitoFromEdge()
    );
  }
}


function draw() {

  background("#111111");

  for (
    let i = mosquitoes.length - 1;
    i >= 0;
    i--
  ) {

    const mosquito = mosquitoes[i];

    mosquito.update();
    mosquito.display();

    if (mosquito.death) {
      mosquitoes.splice(i, 1);
    }
  }

  while (mosquitoes.length < 12) {
    mosquitoes.push(
      createMosquitoFromEdge()
    );
  }

  for (let i = 0; i < dots.length; i++) {
    dots[i].display();
  }
}


// =================================================
// 모기 생성
// =================================================

function createMosquitoFromEdge() {

  let x;
  let y;

  const side = floor(random(4));

  if (side === 0) {
    x = random(width);
    y = -40;
  }

  else if (side === 1) {
    x = width + 40;
    y = random(height);
  }

  else if (side === 2) {
    x = random(width);
    y = height + 40;
  }

  else {
    x = -40;
    y = random(height);
  }

  return new Mosquito(x, y);
}


// =================================================
// 마우스
// =================================================

function mousePressed() {

  if (
    millis() - lastTouchTime < 500
  ) {
    return false;
  }

  if (isTouching) {
    return false;
  }

  handleMousePress(
    mouseX,
    mouseY
  );

  return false;
}


function handleMousePress(x, y) {

  const wallMosquito =
    findWallMosquito(x, y);

  if (wallMosquito) {
    wallMosquito.kill();
    return;
  }

  const mosquito =
    findNearestFlyingMosquito(x, y);

  if (!mosquito) {
    return;
  }

  mosquito.startAttracting(
    x,
    y
  );
}


function mouseDragged() {

  if (isTouching) {
    return false;
  }

  updateMouseAttractTarget(
    mouseX,
    mouseY
  );

  return false;
}


function updateMouseAttractTarget(
  x,
  y
) {

  for (
    let i = 0;
    i < mosquitoes.length;
    i++
  ) {

    const mosquito = mosquitoes[i];

    if (
      mosquito.state === "attract" ||
      mosquito.state === "suck"
    ) {

      mosquito.setAttractTarget(
        x,
        y
      );
    }
  }
}


function mouseReleased() {

  if (isTouching) {
    return false;
  }

  stopAllAttracting();

  return false;
}


// =================================================
// 모바일 터치 위치
// =================================================

function getNativeTouchPosition(touch) {

  const rect =
    canvas.elt.getBoundingClientRect();

  return {

    x:
      (touch.clientX - rect.left) *
      (width / rect.width),

    y:
      (touch.clientY - rect.top) *
      (height / rect.height)
  };
}


// =================================================
// 터치 시작
// =================================================

function nativeTouchStart(event) {

  event.preventDefault();

  if (
    !event.touches ||
    event.touches.length === 0
  ) {
    return;
  }

  const touch =
    event.touches[0];

  const pos =
    getNativeTouchPosition(touch);

  lastTouchTime =
    millis();

  isTouching =
    true;

  handleTouchPress(
    pos.x,
    pos.y
  );
}


function handleTouchPress(x, y) {

  const wallMosquito =
    findWallMosquito(x, y);

  if (wallMosquito) {
    wallMosquito.kill();
    return;
  }

  const mosquito =
    findNearestFlyingMosquito(x, y);

  if (!mosquito) {
    return;
  }

  mosquito.startAttracting(
    x,
    y
  );
}


// =================================================
// 터치 이동
// =================================================

function nativeTouchMove(event) {

  event.preventDefault();

  if (!isTouching) {
    return;
  }

  if (
    !event.touches ||
    event.touches.length === 0
  ) {
    return;
  }

  const touch =
    event.touches[0];

  const pos =
    getNativeTouchPosition(touch);

  updateTouchAttractTarget(
    pos.x,
    pos.y
  );
}


function updateTouchAttractTarget(
  x,
  y
) {

  for (
    let i = 0;
    i < mosquitoes.length;
    i++
  ) {

    const mosquito =
      mosquitoes[i];

    if (
      mosquito.state === "attract" ||
      mosquito.state === "suck"
    ) {

      mosquito.setAttractTarget(
        x,
        y
      );
    }
  }
}


// =================================================
// 터치 종료
// =================================================

function nativeTouchEnd(event) {

  event.preventDefault();

  stopAllAttracting();

  isTouching = false;

  lastTouchTime =
    millis();
}


function stopAllAttracting() {

  for (
    let i = 0;
    i < mosquitoes.length;
    i++
  ) {

    const mosquito =
      mosquitoes[i];

    if (
      mosquito.state === "attract" ||
      mosquito.state === "suck"
    ) {

      mosquito.stopAttracting();
    }
  }
}


// =================================================
// 가장 가까운 날아다니는 모기
// =================================================

function findNearestFlyingMosquito(
  x,
  y
) {

  let nearest = null;

  let nearestDistanceSq =
    Infinity;

  for (
    let i = 0;
    i < mosquitoes.length;
    i++
  ) {

    const mosquito =
      mosquitoes[i];

    if (
      mosquito.state !== "fly"
    ) {
      continue;
    }

    const dx =
      mosquito.x - x;

    const dy =
      mosquito.y - y;

    const distanceSq =
      dx * dx +
      dy * dy;

    if (
      distanceSq <
      nearestDistanceSq
    ) {

      nearestDistanceSq =
        distanceSq;

      nearest =
        mosquito;
    }
  }

  return nearest;
}


// =================================================
// 벽 모기 찾기
// =================================================

function findWallMosquito(
  x,
  y
) {

  let nearest = null;

  let nearestDistanceSq =
    WALL_TOUCH_RADIUS *
    WALL_TOUCH_RADIUS;

  for (
    let i = 0;
    i < mosquitoes.length;
    i++
  ) {

    const mosquito =
      mosquitoes[i];

    if (
      mosquito.state !== "wall"
    ) {
      continue;
    }

    const dx =
      mosquito.x - x;

    const dy =
      mosquito.y - y;

    const distanceSq =
      dx * dx +
      dy * dy;

    if (
      distanceSq <
      nearestDistanceSq
    ) {

      nearestDistanceSq =
        distanceSq;

      nearest =
        mosquito;
    }
  }

  return nearest;
}


// =================================================
// 컬러 점
// =================================================

class ColorDot {

  constructor(x, y, c) {

    this.x = x;
    this.y = y;
    this.c = c;

    this.size =
      random(16, 24);
  }

  display() {

    noStroke();

    fill(this.c);

    circle(
      this.x,
      this.y,
      this.size
    );
  }
}


function createDot(x, y, c) {

  dots.push(
    new ColorDot(
      x,
      y,
      c
    )
  );
}


// =================================================
// 화면 크기
// =================================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );
}