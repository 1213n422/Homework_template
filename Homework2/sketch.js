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


// 손가락보다 위에 모기가 오도록
const touchOffset = 140;


// 모바일에서 터치 후
// 가짜 mouse 이벤트가 들어오는 것 방지
let lastTouchTime = 0;


function setup() {

  const canvas =
    createCanvas(
      windowWidth,
      windowHeight
    );

  noStroke();

  background(
    "#111111"
  );


  // 모바일 터치 설정

  const canvasElement =
    canvas.elt;

  canvasElement.style.touchAction =
    "none";

  canvasElement.style.userSelect =
    "none";

  canvasElement.style.webkitUserSelect =
    "none";

  canvasElement.style.webkitTouchCallout =
    "none";


  // p5 touch 대신
  // native touch 이벤트 사용

  canvasElement.addEventListener(
    "touchstart",
    nativeTouchStart,
    {
      passive: false
    }
  );

  canvasElement.addEventListener(
    "touchmove",
    nativeTouchMove,
    {
      passive: false
    }
  );

  canvasElement.addEventListener(
    "touchend",
    nativeTouchEnd,
    {
      passive: false
    }
  );

  canvasElement.addEventListener(
    "touchcancel",
    nativeTouchEnd,
    {
      passive: false
    }
  );


  // 처음 12마리

  for (
    let i = 0;
    i < 12;
    i++
  ) {

    mosquitoes.push(
      createMosquitoFromEdge()
    );
  }
}


function draw() {

  background(
    "#111111"
  );


  // -----------------------------
  // 모기
  // -----------------------------

  for (
    let i = mosquitoes.length - 1;
    i >= 0;
    i--
  ) {

    const mosquito =
      mosquitoes[i];

    mosquito.update();

    mosquito.display();


    if (
      mosquito.death
    ) {

      mosquitoes.splice(
        i,
        1
      );
    }
  }


  // 항상 12마리 유지

  while (
    mosquitoes.length < 12
  ) {

    mosquitoes.push(
      createMosquitoFromEdge()
    );
  }


  // -----------------------------
  // 색 점
  // -----------------------------

  for (
    let i = dots.length - 1;
    i >= 0;
    i--
  ) {

    const dot =
      dots[i];

    dot.update();

    dot.display();


    if (
      dot.dead
    ) {

      dots.splice(
        i,
        1
      );
    }
  }
}


// =================================================
// 화면 밖에서 들어오는 모기
// =================================================

function createMosquitoFromEdge() {

  let x;
  let y;

  const edge =
    floor(
      random(4)
    );


  if (edge === 0) {

    x = -40;
    y = random(height);

  }

  else if (edge === 1) {

    x = width + 40;
    y = random(height);

  }

  else if (edge === 2) {

    x = random(width);
    y = -40;

  }

  else {

    x = random(width);
    y = height + 40;
  }


  return new Mosquito(
    x,
    y
  );
}


// =================================================
// 손가락 위치 → 모기가 갈 위치
// =================================================

function getTouchTarget(x, y) {

  let targetX =
    x;

  let targetY =
    y;


  if (
    isTouching
  ) {

    targetY =
      y - touchOffset;


    targetY =
      constrain(
        targetY,
        50,
        height - 50
      );
  }


  return {
    x: targetX,
    y: targetY
  };
}


// =================================================
// MOUSE
// =================================================

function mousePressed() {

  // 모바일 터치 직후 생기는
  // 가짜 mouse 이벤트 차단

  if (
    millis() - lastTouchTime <
    500
  ) {

    return false;
  }


  if (
    isTouching
  ) {

    return false;
  }


  handlePress(
    mouseX,
    mouseY,
    false
  );


  return false;
}


function mouseDragged() {

  if (
    isTouching
  ) {

    return false;
  }


  updateAttractTarget(
    mouseX,
    mouseY
  );


  return false;
}


function mouseReleased() {

  if (
    isTouching
  ) {

    return false;
  }


  stopAllAttracting();

  return false;
}


// =================================================
// 모바일 TOUCH
// =================================================

function getNativeTouchPosition(
  touch
) {

  const rect =
    canvas.elt.getBoundingClientRect();


  return {

    x:
      (touch.clientX - rect.left)
      *
      (
        width /
        rect.width
      ),

    y:
      (touch.clientY - rect.top)
      *
      (
        height /
        rect.height
      )
  };
}


// =================================================
// TOUCH START
// =================================================

function nativeTouchStart(
  event
) {

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


  isTouching =
    true;


  handlePress(
    pos.x,
    pos.y,
    true
  );
}


// =================================================
// TOUCH MOVE
// =================================================

function nativeTouchMove(
  event
) {

  event.preventDefault();


  if (
    !isTouching
  ) {

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
// TOUCH END
// =================================================

function nativeTouchEnd(
  event
) {

  event.preventDefault();


  stopAllAttracting();


  isTouching =
    false;


  lastTouchTime =
    millis();
}


// =================================================
// 클릭 / 터치 처리
// =================================================

function handlePress(
  x,
  y,
  fromTouch
) {

  if (
    fromTouch
  ) {

    isTouching =
      true;
  }


  // 먼저 벽 모기 확인

  const wallMosquito =
    findWallMosquito(
      x,
      y
    );


  if (
    wallMosquito
  ) {

    wallMosquito.kill();

    return;
  }


  // 가장 가까운 비행 모기

  const mosquito =
    findNearestFlyingMosquito(
      x,
      y
    );


  if (
    !mosquito
  ) {

    return;
  }


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
// 가장 가까운 비행 모기
// =================================================

function findNearestFlyingMosquito(
  x,
  y
) {

  let nearest =
    null;

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


    // sqrt 없이 거리 비교

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

  let nearest =
    null;

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
// 색 점
// =================================================

function createDot(
  x,
  y,
  c
) {

  dots.push(
    new ColorDot(
      x,
      y,
      c
    )
  );
}


class ColorDot {

  constructor(
    x,
    y,
    c
  ) {

    this.x =
      x;

    this.y =
      y;

    this.c =
      c;

    this.size =
      random(
        16,
        24
      );

    this.dead =
      false;
  }


  update() {
    // 영구적으로 남음
  }


  display() {

    noStroke();

    fill(
      this.c
    );

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