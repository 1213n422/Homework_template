// =====================================================
// MOSQUITO CATCHING
// sketch.js
// =====================================================

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


// =====================================================
// 모바일 터치
// =====================================================

let isTouching = false;

// 손가락에 모기가 가려지지 않도록
// 손가락보다 위쪽을 목표점으로 사용
let touchOffset = 90;


// =====================================================
// SETUP
// =====================================================

function setup() {

  createCanvas(
    windowWidth,
    windowHeight
  );

  // iPhone / Safari에서
  // 캔버스가 브라우저 제스처에 가로채이지 않도록
  let canvasElement = document.querySelector("canvas");

  if (canvasElement) {
    canvasElement.style.touchAction = "none";
  }

  noStroke();

  background(
    "#111111"
  );

  // 모기 12마리
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


// =====================================================
// DRAW
// =====================================================

function draw() {

  background(
    "#111111"
  );


  // ---------------------------------
  // 모기
  // ---------------------------------

  for (
    let i = mosquitoes.length - 1;
    i >= 0;
    i--
  ) {

    let mosquito =
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
  // 피 / 색 점
  // ---------------------------------

  for (
    let i = dots.length - 1;
    i >= 0;
    i--
  ) {

    dots[i].update();
    dots[i].display();


    if (
      dots[i].dead
    ) {

      dots.splice(
        i,
        1
      );

    }

  }

}


// =====================================================
// 화면 가장자리에서 모기 생성
// =====================================================

function createMosquitoFromEdge() {

  let x;
  let y;


  let side =
    floor(
      random(4)
    );


  if (
    side === 0
  ) {

    x =
      random(width);

    y =
      -30;

  }


  else if (
    side === 1
  ) {

    x =
      width + 30;

    y =
      random(height);

  }


  else if (
    side === 2
  ) {

    x =
      random(width);

    y =
      height + 30;

  }


  else {

    x =
      -30;

    y =
      random(height);

  }


  return new Mosquito(
    x,
    y
  );

}


// =====================================================
// 터치 목표점
// =====================================================

function getTouchTarget(
  x,
  y
) {

  let targetX =
    x;

  let targetY =
    y;


  if (
    isTouching
  ) {

    // 손가락보다 90px 위쪽
    targetY =
      y - touchOffset;

    targetY =
      constrain(
        targetY,
        20,
        height - 20
      );

  }


  return {
    x: targetX,
    y: targetY
  };

}


// =====================================================
// 마우스 클릭
// =====================================================

function mousePressed() {

  // 모바일에서 발생하는
  // 중복 mouse 이벤트 방지
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


// =====================================================
// 눌림 처리
// =====================================================

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


  // ---------------------------------
  // 벽에 붙어 있는 모기
  // ---------------------------------

  let wallMosquito =
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


  // ---------------------------------
  // 가장 가까운 비행 모기
  // ---------------------------------

  let mosquito =
    findNearestFlyingMosquito(
      x,
      y
    );


  if (
    !mosquito
  ) {

    return;

  }


  // ---------------------------------
  // 실제 목표점
  // ---------------------------------

  let target =
    getTouchTarget(
      x,
      y
    );


  mosquito.startAttracting(
    target.x,
    target.y
  );

}


// =====================================================
// 마우스 드래그
// =====================================================

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


// =====================================================
// 터치 시작
// =====================================================

function touchStarted() {

  if (
    touches.length === 0
  ) {

    return false;

  }


  isTouching =
    true;


  let touch =
    touches[0];


  handlePress(
    touch.x,
    touch.y,
    true
  );


  return false;

}


// =====================================================
// 터치 이동
// =====================================================

function touchMoved() {

  if (
    !isTouching ||
    touches.length === 0
  ) {

    return false;

  }


  let touch =
    touches[0];


  updateAttractTarget(
    touch.x,
    touch.y
  );


  return false;

}


// =====================================================
// 목표점 업데이트
// =====================================================

function updateAttractTarget(
  x,
  y
) {

  let target =
    getTouchTarget(
      x,
      y
    );


  for (
    let i = 0;
    i < mosquitoes.length;
    i++
  ) {

    let mosquito =
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


// =====================================================
// 마우스 놓기
// =====================================================

function mouseReleased() {

  if (
    isTouching
  ) {

    return false;

  }


  stopAllAttracting();


  return false;

}


// =====================================================
// 터치 놓기
// =====================================================

function touchEnded() {

  stopAllAttracting();

  isTouching =
    false;


  return false;

}


// =====================================================
// 유인 중인 모기 해제
// =====================================================

function stopAllAttracting() {

  for (
    let i = 0;
    i < mosquitoes.length;
    i++
  ) {

    if (
      mosquitoes[i].state === "attract" ||
      mosquitoes[i].state === "suck"
    ) {

      mosquitoes[i].stopAttracting();

    }

  }

}


// =====================================================
// 가장 가까운 비행 모기
// =====================================================

function findNearestFlyingMosquito(
  x,
  y
) {

  let nearest =
    null;


  let nearestDistance =
    Infinity;


  for (
    let i = 0;
    i < mosquitoes.length;
    i++
  ) {

    let mosquito =
      mosquitoes[i];


    if (
      mosquito.state !== "fly"
    ) {

      continue;

    }


    let d =
      dist(
        x,
        y,
        mosquito.x,
        mosquito.y
      );


    if (
      d < nearestDistance
    ) {

      nearestDistance =
        d;

      nearest =
        mosquito;

    }

  }


  return nearest;

}


// =====================================================
// 벽 모기 찾기
// =====================================================

function findWallMosquito(
  x,
  y
) {

  let nearest =
    null;


  let nearestDistance =
    Infinity;


  for (
    let i = 0;
    i < mosquitoes.length;
    i++
  ) {

    let mosquito =
      mosquitoes[i];


    if (
      mosquito.state !== "wall"
    ) {

      continue;

    }


    let d =
      dist(
        x,
        y,
        mosquito.x,
        mosquito.y
      );


    if (
      d < 28 &&
      d < nearestDistance
    ) {

      nearestDistance =
        d;

      nearest =
        mosquito;

    }

  }


  return nearest;

}


// =====================================================
// ★ 피 / 색 점 생성
// =====================================================

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


// =====================================================
// ★ 피 / 색 점
// =====================================================

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

    // ★ 아무것도 하지 않음
    //
    // 피가 화면에 계속 남아있도록
    // 수명 / 투명도 감소를 제거

  }


  display() {

    push();


    noStroke();


    fill(
      this.c
    );


    circle(
      this.x,
      this.y,
      this.size
    );


    pop();

  }

}


// =====================================================
// 화면 크기 변경
// =====================================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );

}