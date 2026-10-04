class Mosquito {

  constructor(x, y) {

    this.x = x;
    this.y = y;

    this.size = random(18, 24);

    this.c = random(mosquitoColors);


    // -----------------------------
    // 비행
    // -----------------------------

    this.angle = random(TWO_PI);

    this.speed = random(3.5, 5);

    this.targetSpeed = this.speed;

    this.targetAngle = this.angle;

    this.changeTimer = random(100, 180);


    // -----------------------------
    // 빙글빙글 감지
    // -----------------------------

    this.checkX = this.x;
    this.checkY = this.y;

    this.travelDistance = 0;

    this.spinCheckTimer = 0;

    this.spinCheckInterval = 75;


    // -----------------------------
    // 비행 움직임
    // -----------------------------

    this.flightTime = random(0, 1000);

    this.wobbleAmount = random(0.8, 1.5);


    // -----------------------------
    // 상태
    // -----------------------------

    this.state = "fly";

    this.death = false;


    // -----------------------------
    // 벽
    // -----------------------------

    this.targetX = 0;
    this.targetY = 0;

    this.wallTimer = 0;

    this.wallDuration = random(120, 240);


    // -----------------------------
    // 손가락
    // -----------------------------

    this.attractX = 0;
    this.attractY = 0;


    // -----------------------------
    // 흡혈
    // -----------------------------

    this.suckTimer = 0;

    this.suckDuration = 120;

    this.belly = 1;


    // -----------------------------
    // 화면 기울기
    // -----------------------------

    this.visualAngle = 0;


    // -----------------------------
    // 제거 효과
    // -----------------------------

    this.burstSize = 0;

    this.burstAlpha = 255;
  }


  // =================================================
  // UPDATE
  // =================================================

  update() {

    if (this.death) {
      return;
    }


    if (this.state === "fly") {

      this.updateFlying();

    }

    else if (this.state === "landing") {

      this.updateLanding();

    }

    else if (this.state === "wall") {

      this.updateWall();

    }

    else if (this.state === "attract") {

      this.updateAttract();

    }

    else if (this.state === "suck") {

      this.updateSuck();

    }

    else if (this.state === "burst") {

      this.updateBurst();
    }
  }


  // =================================================
  // 일반 비행
  // =================================================

  updateFlying() {

    this.flightTime += 0.18;

    this.changeTimer--;


    if (this.changeTimer <= 0) {

      this.chooseNewDirection();
    }


    let angleDifference =
      atan2(
        sin(this.targetAngle - this.angle),
        cos(this.targetAngle - this.angle)
      );


    let turnSpeed = 0.035;


    if (abs(angleDifference) > turnSpeed) {

      if (angleDifference > 0) {

        this.angle += turnSpeed;

      }

      else {

        this.angle -= turnSpeed;
      }

    }

    else {

      this.angle = this.targetAngle;
    }


    this.angle =
      atan2(
        sin(this.angle),
        cos(this.angle)
      );


    this.speed =
      lerp(
        this.speed,
        this.targetSpeed,
        0.025
      );


    let sideWobble =
      sin(this.flightTime * 2.3)
      * 0.035
      * this.wobbleAmount;


    let moveAngle =
      this.angle + sideWobble;


    let previousX = this.x;
    let previousY = this.y;


    this.x +=
      cos(moveAngle) * this.speed;


    this.y +=
      sin(moveAngle) * this.speed;


    this.travelDistance +=
      dist(
        previousX,
        previousY,
        this.x,
        this.y
      );


    // ---------------------------------
    // 빙글빙글 감지
    // ---------------------------------

    this.spinCheckTimer++;


    if (
      this.spinCheckTimer >=
      this.spinCheckInterval
    ) {

      let netDistance =
        dist(
          this.checkX,
          this.checkY,
          this.x,
          this.y
        );


      let looping =
        (
          this.travelDistance > 180 &&
          netDistance < 75
        );


      if (looping) {

        this.resetFlyingDirection();
      }


      this.checkX = this.x;
      this.checkY = this.y;

      this.travelDistance = 0;

      this.spinCheckTimer = 0;
    }


    // ---------------------------------
    // 기울기
    // ---------------------------------

    let wantedAngle =
      sin(this.angle) * 0.35;


    wantedAngle +=
      sin(this.flightTime * 2.0) * 0.015;


    wantedAngle =
      constrain(
        wantedAngle,
        -0.35,
        0.35
      );


    this.visualAngle =
      lerp(
        this.visualAngle,
        wantedAngle,
        0.12
      );


    // ---------------------------------
    // 화면 밖으로 나감
    // ---------------------------------

    if (
      this.x < -60 ||
      this.x > width + 60 ||
      this.y < -60 ||
      this.y > height + 60
    ) {

      this.death = true;

      return;
    }


    // ---------------------------------
    // 가끔 착륙
    // ---------------------------------

    if (random() < 0.0015) {

      this.prepareLanding();
    }
  }


  // =================================================
  // 새로운 방향
  // =================================================

  chooseNewDirection() {

    let turn =
      random(-1.15, 1.15);


    this.targetAngle =
      this.angle + turn;


    this.targetAngle =
      atan2(
        sin(this.targetAngle),
        cos(this.targetAngle)
      );


    this.targetSpeed =
      random(3.5, 5.5);


    this.changeTimer =
      random(110, 190);
  }


  // =================================================
  // 빙글빙글 탈출
  // =================================================

  resetFlyingDirection() {

    this.angle =
      random(TWO_PI);


    this.targetAngle =
      this.angle;


    this.speed =
      random(4.5, 5.5);


    this.targetSpeed =
      random(4.5, 5.5);


    this.changeTimer =
      random(120, 190);


    this.checkX =
      this.x;

    this.checkY =
      this.y;

    this.travelDistance =
      0;

    this.spinCheckTimer =
      0;


    this.flightTime =
      random(0, 1000);
  }


  // =================================================
  // 착륙 준비
  // =================================================

  prepareLanding() {

    this.state = "landing";


    this.targetX =
      random(
        60,
        width - 60
      );


    this.targetY =
      random(
        60,
        height - 60
      );
  }


  // =================================================
  // 착륙
  // =================================================

  updateLanding() {

    let dx =
      this.targetX - this.x;

    let dy =
      this.targetY - this.y;


    let d =
      sqrt(
        dx * dx +
        dy * dy
      );


    if (d < 4) {

      this.x =
        this.targetX;

      this.y =
        this.targetY;

      this.state =
        "wall";

      this.wallTimer = 0;

      return;
    }


    let targetAngle =
      atan2(
        dy,
        dx
      );


    let difference =
      atan2(
        sin(targetAngle - this.angle),
        cos(targetAngle - this.angle)
      );


    this.angle +=
      difference * 0.05;


    this.x +=
      cos(this.angle) * 2.5;


    this.y +=
      sin(this.angle) * 2.5;


    let wantedAngle =
      sin(this.angle) * 0.35;


    wantedAngle =
      constrain(
        wantedAngle,
        -0.35,
        0.35
      );


    this.visualAngle =
      lerp(
        this.visualAngle,
        wantedAngle,
        0.1
      );
  }


  // =================================================
  // 벽에 붙어 있음
  // =================================================

  updateWall() {

    this.wallTimer++;


    if (
      this.wallTimer >
      this.wallDuration
    ) {

      this.flyAgain();
    }
  }


  // =================================================
  // 다시 날아감
  // =================================================

  flyAgain() {

    this.state = "fly";


    this.angle +=
      random(-0.4, 0.4);


    this.targetAngle =
      this.angle;


    this.speed =
      random(3.5, 5);


    this.targetSpeed =
      random(3.5, 5.5);


    this.changeTimer =
      random(100, 180);


    this.checkX =
      this.x;

    this.checkY =
      this.y;

    this.travelDistance =
      0;

    this.spinCheckTimer =
      0;


    this.flightTime =
      random(0, 1000);


    this.belly = 1;
  }


  // =================================================
  // 손가락 유인 시작
  // =================================================

  startAttracting(x, y) {

    if (
      this.state !== "fly"
    ) {
      return;
    }


    this.state =
      "attract";


    this.attractX =
      x;

    this.attractY =
      y;
  }


  // =================================================
  // 손가락 위치 변경
  // =================================================

  setAttractTarget(x, y) {

    if (
      this.state === "attract" ||
      this.state === "suck"
    ) {

      this.attractX =
        x;

      this.attractY =
        y;
    }
  }


  // =================================================
  // ★ 주둥이 끝 좌표
  // =================================================

  getNosePosition() {

    let noseLength =
      this.size * 1.45;


    // 오른쪽을 보면 +X
    // 왼쪽을 보면 -X
    let facing =
      cos(this.angle) >= 0
        ? 1
        : -1;


    let localX =
      noseLength * facing;


    let offsetX =
      cos(this.visualAngle) *
      localX;


    let offsetY =
      sin(this.visualAngle) *
      localX;


    return {
      x: this.x + offsetX,
      y: this.y + offsetY
    };
  }


  // =================================================
  // ★ 손가락으로 날아가기
  // =================================================

  updateAttract() {

    let dx =
      this.attractX - this.x;

    let dy =
      this.attractY - this.y;


    let targetAngle =
      atan2(
        dy,
        dx
      );


    let difference =
      atan2(
        sin(targetAngle - this.angle),
        cos(targetAngle - this.angle)
      );


    // 방향 전환
    this.angle +=
      difference * 0.08;


    this.flightTime += 0.15;


    let wobble =
      sin(
        this.flightTime * 2
      ) * 0.02;


    this.x +=
      cos(
        this.angle + wobble
      ) * 4;


    this.y +=
      sin(
        this.angle + wobble
      ) * 4;


    // ---------------------------------
    // 화면상 기울기
    // ---------------------------------

    let wantedAngle =
      sin(this.angle) * 0.35;


    wantedAngle =
      constrain(
        wantedAngle,
        -0.35,
        0.35
      );


    this.visualAngle =
      lerp(
        this.visualAngle,
        wantedAngle,
        0.12
      );


    // ---------------------------------
    // ★ 실제 주둥이 끝 위치
    // ---------------------------------

    let nose =
      this.getNosePosition();


    let noseDistance =
      dist(
        nose.x,
        nose.y,
        this.attractX,
        this.attractY
      );


    // ---------------------------------
    // ★ 주둥이가 손가락에 닿으면
    // 정확히 꽂아버림
    // ---------------------------------

    if (
      noseDistance < 12
    ) {

      this.x +=
        this.attractX -
        nose.x;


      this.y +=
        this.attractY -
        nose.y;


      this.state =
        "suck";


      this.suckTimer =
        0;


      this.belly =
        1;
    }
  }


  // =================================================
  // ★ 흡혈
  // =================================================

  updateSuck() {

    // ---------------------------------
    // 현재 주둥이 위치
    // ---------------------------------

    let nose =
      this.getNosePosition();


    // ---------------------------------
    // 손가락과 주둥이의 차이
    // ---------------------------------

    let fixX =
      this.attractX -
      nose.x;


    let fixY =
      this.attractY -
      nose.y;


    // ---------------------------------
    // ★ 주둥이 끝을 손가락에 고정
    // ---------------------------------

    this.x +=
      fixX;


    this.y +=
      fixY;


    this.suckTimer++;


    // ---------------------------------
    // ★ 배만 커짐
    // ---------------------------------

    let progress =
      this.suckTimer /
      this.suckDuration;


    progress =
      constrain(
        progress,
        0,
        1
      );


    this.belly =
      1 + progress;


    // ---------------------------------
    // 완료
    // ---------------------------------

    if (
      this.suckTimer >=
      this.suckDuration
    ) {

      this.burst();
    }
  }


  // =================================================
  // 손가락 놓기
  // =================================================

  stopAttracting() {

    if (
      this.state === "attract" ||
      this.state === "suck"
    ) {

      this.state = "fly";


      this.angle +=
        random(-0.4, 0.4);


      this.targetAngle =
        this.angle;


      this.speed =
        random(3.5, 5);


      this.targetSpeed =
        random(3.5, 5.5);


      this.changeTimer =
        random(100, 180);


      this.checkX =
        this.x;

      this.checkY =
        this.y;

      this.travelDistance =
        0;

      this.spinCheckTimer =
        0;


      this.flightTime =
        random(0, 1000);


      this.belly = 1;
    }
  }


  // =================================================
  // DISPLAY
  // =================================================

  display() {

    if (
      this.state === "wall"
    ) {

      this.displayTop();
    }

    else if (
      this.state === "burst"
    ) {

      this.displayBurst();
    }

    else {

      this.displaySide();
    }
  }


  // =================================================
  // SIDE VIEW
  // =================================================

  displaySide() {

    push();


    translate(
      this.x,
      this.y
    );


    rotate(
      this.visualAngle
    );


    // 왼쪽으로 날아가면 좌우 반전
    if (
      cos(this.angle) < 0
    ) {

      scale(-1, 1);
    }


    let s =
      this.size;


    noStroke();


    // ---------------------------------
    // 날개 하나
    // ---------------------------------

    let wingColor =
      color(this.c);


    wingColor.setAlpha(120);


    fill(wingColor);


    ellipse(
      -s * 0.15,
      -s * 0.58,
      s * 1.3,
      s * 0.6
    );


    // ---------------------------------
    // 몸
    // ---------------------------------

    fill(this.c);


    ellipse(
      0,
      0,
      s * 0.85,
      s * 0.35
    );


    // ---------------------------------
    // 배
    // ---------------------------------

    ellipse(
      -s * 0.38,
      0,
      s * 0.55 * this.belly,
      s * 0.38 * this.belly
    );


    // ---------------------------------
    // 머리
    // ---------------------------------

    circle(
      s * 0.48,
      0,
      s * 0.38
    );


    // ---------------------------------
    // 주둥이
    // ---------------------------------

    stroke(this.c);

    strokeWeight(1);


    line(
      s * 0.65,
      0,
      s * 1.45,
      0
    );


    // ---------------------------------
    // 다리
    // ---------------------------------

    line(
      s * 0.15,
      0,
      s * 0.05,
      s * 0.45
    );


    line(
      -s * 0.05,
      0,
      -s * 0.2,
      s * 0.45
    );


    line(
      -s * 0.2,
      0,
      -s * 0.4,
      s * 0.4
    );


    pop();
  }


  // =================================================
  // TOP VIEW
  // =================================================

  displayTop() {

    push();


    translate(
      this.x,
      this.y
    );


    noStroke();


    let wingColor =
      color(this.c);


    wingColor.setAlpha(135);


    fill(wingColor);


    // 왼쪽 날개
    ellipse(
      -this.size * 0.42,
      -this.size * 0.2,
      this.size * 0.9,
      this.size * 0.55
    );


    // 오른쪽 날개
    ellipse(
      this.size * 0.42,
      -this.size * 0.2,
      this.size * 0.9,
      this.size * 0.55
    );


    // 몸
    fill(this.c);


    ellipse(
      0,
      this.size * 0.15,
      this.size * 0.55,
      this.size
    );


    // 머리
    circle(
      0,
      -this.size * 0.36,
      this.size * 0.38
    );


    // 주둥이
    stroke(this.c);

    strokeWeight(1);


    line(
      0,
      -this.size * 0.52,
      0,
      -this.size * 0.75
    );


    pop();
  }


  // =================================================
  // 벽 모기 제거
  // =================================================

  kill() {

    if (
      this.state !== "wall"
    ) {
      return;
    }


    createDot(
      this.x,
      this.y,
      this.c
    );


    this.death = true;
  }


  // =================================================
  // 흡혈 완료
  // =================================================

  burst() {

    this.state =
      "burst";


    this.burstSize =
      this.size;


    this.burstAlpha =
      255;


    // ★ 피 남김
    createDot(
      this.x,
      this.y,
      this.c
    );
  }


  // =================================================
  // 터지는 모기
  // =================================================

  updateBurst() {

    this.burstSize += 2;

    this.burstAlpha -= 18;


    if (
      this.burstAlpha <= 0
    ) {

      this.death = true;
    }
  }


  displayBurst() {

    push();


    noStroke();


    let c =
      color(this.c);


    c.setAlpha(
      this.burstAlpha
    );


    fill(c);


    circle(
      this.x,
      this.y,
      this.burstSize
    );


    pop();
  }
}