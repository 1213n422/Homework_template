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

// 손가락과 모기 사이의 거리
// 기존 140보다 크게 잡음
const touchOffset = 210;


// =================================================
// SETUP
// =================================================

function setup() {

  const canvas = createCanvas(
    windowWidth,
    windowHeight
  );

  noStroke();

  background("#111111");

  // ---------------------------------
  // 모바일 터치 설정
  // ---------------------------------

  const canvasElement = canvas.elt;

  canvasElement.style.touchAction = "none";
  canvasElement.style.userSelect = "none";
  canvasElement.style.webkitUserSelect = "none";
  canvasElement.style.webkitTouchCallout = "none";


  // ---------------------------------
  // 네이티브 터치 이벤트
  // ---------------------------------

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


  // ---------------------------------
  // iPad에서 과도한 프레임 방지
  // ---------------------------------

  frameRate(60);


  // ---------------------------------
  // 모기 생성
  // ---------------------------------

  for (let i = 0; i < 12; i++) {

    mosquitoes.push(
      createMosquitoFromEdge()
    );
  }
}


// =================================================
// DRAW
// =================================================

function draw() {

  background("#111111");


  // ---------------------------------
  // 모기
  // ---------------------------------

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


  // ---------------------------------
  // 항상 12마리 유지
  // ---------------------------------

  while (
    mosquitoes.length < 12
  ) {

    mosquitoes.push(
      createMosquitoFromEdge()
    );
  }


  // ---------------------------------
  // 죽은 자리에 남는 점
  // ---------------------------------

  for (
    let i = dots.length - 1;
    i >= 0;
    i--
  ) {

    const dot = dots[i];

    dot.update();

    dot.display();


    if (dot.dead) {

      dots.splice(i, 1);
    }
  }
}


// =================================================
// 화면 가장자리에서 모기 생성
// =================================================

function createMosquitoFromEdge() {

  let x;
  let y;

  const side = floor(
    random(4)
  );


  if (side === 0) {

    // 위

    x = random(width);
    y = -40;

  }

  else if (side === 1) {

    // 오른쪽

    x = width + 40;
    y = random(height);

  }

  else if (side === 2) {

    // 아래

    x = random(width);
    y = height + 40;

  }

  else {

    // 왼쪽

    x = -40;
    y = random(height);
  }


  return new Mosquito(x, y);
}


// =================================================
// ★ 손가락 위치 보정
// =================================================

function getTouchTarget(x, y) {

  let targetX = x;
  let targetY = y;


  if (isTouching) {

    // ---------------------------------
    // 손가락보다 위쪽을 목표로 사용
    // ---------------------------------

    targetY =
      y - touchOffset;


    // ---------------------------------
    // 화면 밖으로 나가지 않도록
    // ---------------------------------

    targetY =
      constrain(
        targetY,
        80,
        height - 80
      );
  }


  return {
    x: targetX,
    y: targetY
  };
}


// =================================================
// 마우스
// =================================================

function mousePressed() {

  // 터치 후 발생하는 가짜 mouse 이벤트 방지

  if (
    millis() - lastTouchTime < 500
  ) {

    return false;
  }


  if (isTouching) {

    return false;
  }


  handlePress(
    mouseX,
    mouseY,
    false
  );


  return false;
}


// =================================================
// 마우스 드래그
// =================================================

function mouseDragged() {

  if (isTouching) {

    return false;
  }


  updateAttractTarget(
    mouseX,
    mouseY
  );


  return false;
}


// =================================================
// 마우스 놓기
// =================================================

function mouseReleased() {

  if (isTouching) {

    return false;
  }


  stopAllAttracting();


  return false;
}


// =================================================
// 네이티브 터치 좌표
// =================================================

function getNativeTouchPosition(touch) {

  const rect =
    canvas.elt.getBoundingClientRect();


  return {

    x:
      (touch.clientX - rect.left)
      * (width / rect.width),

    y:
      (touch.clientY - rect.top)
      * (height / rect.height)
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
    getNativeTouchPosition(
      touch
    );


  lastTouchTime =
    millis();


  isTouching = true;


  handlePress(
    pos.x,
    pos.y,
    true
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
    getNativeTouchPosition(
      touch
    );


  updateAttractTarget(
    pos.x,
    pos.y
  );
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


// =================================================
// 클릭 / 터치했을 때
// =================================================

function handlePress(
  x,
  y,
  fromTouch
) {

  if (fromTouch) {

    isTouching = true;
  }


  // ---------------------------------
  // 1. 벽에 붙은 모기 클릭
  // ---------------------------------

  const wallMosquito =
    findWallMosquito(
      x,
      y
    );


  if (wallMosquito) {

    wallMosquito.kill();

    return;
  }


  // ---------------------------------
  // 2. 가장 가까운 날아다니는 모기
  // ---------------------------------

  const mosquito =
    findNearestFlyingMosquito(
      x,
      y
    );


  if (!mosquito) {

    return;
  }


  // ---------------------------------
  // 3. 손가락에서 위쪽에 목표 생성
  // ---------------------------------

  const target =
    getTouchTarget(
      x,
      y
    );


  mosquito.startAttracting(
    target.x,
    target.y
  );
}


// =================================================
// 손가락 이동
// =================================================

function updateAttractTarget(
  x,
  y
) {

  const target =
    getTouchTarget(
      x,
      y
    );


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
        target.x,
        target.y
      );
    }
  }
}


// =================================================
// 손가락 놓기
// =================================================

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
    28 * 28;


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
// ★ 색깔 점
// =================================================

class ColorDot {

  constructor(
    x,
    y,
    c
  ) {

    this.x = x;
    this.y = y;

    this.c = c;

    this.size =
      random(
        16,
        24
      );

    this.dead = false;
  }


  update() {
    // 아무것도 하지 않음
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


// =================================================
// 화면 크기 변경
// =================================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );
}