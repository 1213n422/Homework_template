class Mosquito {

  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.size = random(18, 24);

    this.c = random(mosquitoColors);
    this.baseColor = color(this.c);

    this.wingColor = color(this.c);
    this.wingColor.setAlpha(120);

    this.topWingColor = color(this.c);
    this.topWingColor.setAlpha(135);

    // 비행
    this.angle = random(TWO_PI);
    this.speed = random(3.5, 5);
    this.targetSpeed = this.speed;
    this.targetAngle = this.angle;
    this.changeTimer = random(100, 180);

    // 비행 움직임
    this.flightTime = random(0, 1000);
    this.wobbleAmount = random(0.8, 1.5);

    // 상태
    this.state = "fly";
    this.death = false;

    // 벽
    this.targetX = 0;
    this.targetY = 0;
    this.wallTimer = 0;
    this.wallDuration = random(120, 240);

    // 손가락
    this.attractX = 0;
    this.attractY = 0;

    // 흡혈
    this.suckTimer = 0;
    this.suckDuration = 120;
    this.belly = 1;

    // 화면 기울기
    this.visualAngle = 0;

    // 제거 효과
    this.burstSize = 0;
    this.burstAlpha = 255;
  }


  // =================================================
  // UPDATE
  // =================================================

  update() {

    if (this.death) return;

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

    let angleDifference = atan2(
      sin(this.targetAngle - this.angle),
      cos(this.targetAngle - this.angle)
    );

    const turnSpeed = 0.035;

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

    this.angle = atan2(
      sin(this.angle),
      cos(this.angle)
    );

    this.speed = lerp(
      this.speed,
      this.targetSpeed,
      0.025
    );

    const sideWobble =
      sin(this.flightTime * 2.3)
      * 0.035
      * this.wobbleAmount;

    const moveAngle =
      this.angle + sideWobble;

    this.x +=
      cos(moveAngle) * this.speed;

    this.y +=
      sin(moveAngle) * this.speed;


    // 화면 밖으로 나가면 제거

    if (
      this.x < -60 ||
      this.x > width + 60 ||
      this.y < -60 ||
      this.y > height + 60
    ) {

      this.death = true;

      return;
    }


    // 기울기

    let wantedAngle =
      sin(this.angle) * 0.35;

    wantedAngle +=
      sin(this.flightTime * 2.0) * 0.015;

    wantedAngle = constrain(
      wantedAngle,
      -0.35,
      0.35
    );

    this.visualAngle = lerp(
      this.visualAngle,
      wantedAngle,
      0.12
    );


    // 가끔 착륙

    if (random() < 0.0015) {
      this.prepareLanding();
    }
  }


  // =================================================
  // 새로운 방향
  // =================================================

  chooseNewDirection() {

    const turn =
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

    const dx =
      this.targetX - this.x;

    const dy =
      this.targetY - this.y;

    const d =
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

    const targetAngle =
      atan2(
        dy,
        dx
      );

    const difference =
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
      constrain(
        sin(this.angle) * 0.35,
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
  // 주둥이 끝 좌표
  // =================================================

  getNosePosition() {

    const noseLength =
      this.size * 1.45;

    const facing =
      cos(this.angle) >= 0
        ? 1
        : -1;

    const localX =
      noseLength * facing;

    return {
      x:
        this.x +
        cos(this.visualAngle) *
        localX,

      y:
        this.y +
        sin(this.visualAngle) *
        localX
    };
  }


  // =================================================
  // 손가락으로 날아가기
  // =================================================

  updateAttract() {

    const dx =
      this.attractX - this.x;

    const dy =
      this.attractY - this.y;

    const targetAngle =
      atan2(
        dy,
        dx
      );

    const difference =
      atan2(
        sin(targetAngle - this.angle),
        cos(targetAngle - this.angle)
      );

    this.angle +=
      difference * 0.08;

    this.flightTime += 0.15;

    const wobble =
      sin(
        this.flightTime * 2
      ) * 0.02;

    const moveAngle =
      this.angle + wobble;

    this.x +=
      cos(moveAngle) * 4;

    this.y +=
      sin(moveAngle) * 4;


    // 화면 기울기

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


    // 주둥이 위치

    const nose =
      this.getNosePosition();

    const nx =
      this.attractX - nose.x;

    const ny =
      this.attractY - nose.y;

    const noseDistance =
      sqrt(
        nx * nx +
        ny * ny
      );


    // 주둥이가 손가락에 닿으면 흡혈

    if (
      noseDistance < 12
    ) {

      this.x += nx;
      this.y += ny;

      this.state =
        "suck";

      this.suckTimer = 0;

      this.belly = 1;
    }
  }


  // =================================================
  // 흡혈
  // =================================================

  updateSuck() {

    const nose =
      this.getNosePosition();

    this.x +=
      this.attractX -
      nose.x;

    this.y +=
      this.attractY -
      nose.y;

    this.suckTimer++;

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

    const s =
      this.size;

    noStroke();


    // 날개 하나

    fill(
      this.wingColor
    );

    ellipse(
      -s * 0.15,
      -s * 0.58,
      s * 1.3,
      s * 0.6
    );


    // 몸

    fill(
      this.baseColor
    );

    ellipse(
      0,
      0,
      s * 0.85,
      s * 0.35
    );


    // 배만 커짐

    ellipse(
      -s * 0.38,
      0,
      s * 0.55 * this.belly,
      s * 0.38 * this.belly
    );


    // 머리

    circle(
      s * 0.48,
      0,
      s * 0.38
    );


    // 주둥이

    stroke(
      this.baseColor
    );

    strokeWeight(1);

    line(
      s * 0.65,
      0,
      s * 1.45,
      0
    );


    // 다리

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

    const s =
      this.size;


    fill(
      this.topWingColor
    );


    // 왼쪽 날개

    ellipse(
      -s * 0.42,
      -s * 0.2,
      s * 0.9,
      s * 0.55
    );


    // 오른쪽 날개

    ellipse(
      s * 0.42,
      -s * 0.2,
      s * 0.9,
      s * 0.55
    );


    // 몸

    fill(
      this.baseColor
    );

    ellipse(
      0,
      s * 0.15,
      s * 0.55,
      s
    );


    // 머리

    circle(
      0,
      -s * 0.36,
      s * 0.38
    );


    // 주둥이

    stroke(
      this.baseColor
    );

    strokeWeight(1);

    line(
      0,
      -s * 0.52,
      0,
      -s * 0.75
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

    if (!this.burstColor) {
      this.burstColor =
        color(this.c);
    }

    this.burstColor.setAlpha(
      this.burstAlpha
    );

    fill(
      this.burstColor
    );

    circle(
      this.x,
      this.y,
      this.burstSize
    );

    pop();
  }
}