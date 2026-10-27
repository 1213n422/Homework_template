// 잡고 흔들기 설정
const SHAKE_MIN_STEP = 4;     // 이만큼 움직여야 흔든 것으로 센다
const SHAKE_LIMIT = 8;        // 방향을 이만큼 바꾸면 어지러워진다
const SHAKE_DECAY = 0.03;     // 프레임마다 줄어드는 흔든 횟수
const DIZZY_FRAMES = 36;      // 빙글빙글 도는 시간
const TAP_FRAMES = 20;        // 이 시간 안에 떼면 톡 터치
const TAP_MOVE = 12;          // 이만큼보다 덜 움직여야 톡 터치


class Mosquito {

  constructor(x, y) {

    this.x = x;
    this.y = y;

    this.size =
      random(18, 24);

    this.c =
      random(mosquitoColors);

    this.baseColor =
      color(this.c);

    this.wingColor =
      color(this.c);

    this.wingColor.setAlpha(120);

    this.topWingColor =
      color(this.c);

    this.topWingColor.setAlpha(135);


    // 비행
    this.angle =
      random(TWO_PI);

    this.speed =
      random(3.5, 5);

    this.targetSpeed =
      this.speed;

    this.targetAngle =
      this.angle;

    this.changeTimer =
      random(100, 180);


    // 비행 움직임
    this.flightTime =
      random(0, 1000);

    this.wobbleAmount =
      random(0.8, 1.5);


    // 상태
    this.state =
      "fly";

    this.death =
      false;


    // 벽
    this.targetX = 0;
    this.targetY = 0;

    this.wallTimer = 0;

    this.wallDuration =
      random(120, 240);


    // 손가락
    this.touchX = 0;
    this.touchY = 0;


    // 흡혈
    this.suckTimer = 0;

    this.suckDuration =
      120;

    this.belly = 1;


    // 화면 기울기
    this.visualAngle = 0;


    // 제거 효과
    this.burstSize = 0;
    this.burstAlpha = 255;


    // 잡고 흔들기
    this.heldFrames = 0;
    this.heldMoved = 0;
    this.shake = 0;
    this.lastDX = 0;
    this.lastDY = 0;
    this.wobble = 0;

    this.dizzyTimer = 0;
    this.spin = 0;

    this.fallVX = 0;
    this.fallVY = 0;
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

    else if (this.state === "held") {
      this.updateHeld();
    }

    else if (this.state === "dizzy") {
      this.updateDizzy();
    }

    else if (this.state === "fall") {
      this.updateFall();
    }
  }


  // =================================================
  // 비행
  // =================================================

  updateFlying() {

    this.flightTime += 0.18;

    this.changeTimer--;

    if (
      this.changeTimer <= 0
    ) {
      this.chooseNewDirection();
    }


    let angleDifference =
      atan2(
        sin(
          this.targetAngle -
          this.angle
        ),
        cos(
          this.targetAngle -
          this.angle
        )
      );


    const turnSpeed =
      0.035;


    if (
      abs(angleDifference) >
      turnSpeed
    ) {

      if (
        angleDifference > 0
      ) {
        this.angle +=
          turnSpeed;
      }

      else {
        this.angle -=
          turnSpeed;
      }
    }

    else {
      this.angle =
        this.targetAngle;
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


    const sideWobble =
      sin(
        this.flightTime * 2.3
      )
      * 0.035
      * this.wobbleAmount;


    const moveAngle =
      this.angle +
      sideWobble;


    this.x +=
      cos(moveAngle) *
      this.speed;

    this.y +=
      sin(moveAngle) *
      this.speed;


    if (
      this.x < -60 ||
      this.x > width + 60 ||
      this.y < -60 ||
      this.y > height + 60
    ) {

      this.death = true;

      return;
    }


    let wantedAngle =
      sin(this.angle) *
      0.35;


    wantedAngle +=
      sin(
        this.flightTime * 2.0
      ) * 0.015;


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


    if (
      random() < 0.0015
    ) {
      this.prepareLanding();
    }
  }


  // =================================================
  // 방향 변경
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
  // 착륙
  // =================================================

  prepareLanding() {

    this.state =
      "landing";

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

      this.wallTimer =
        0;

      return;
    }


    const targetAngle =
      atan2(
        dy,
        dx
      );


    const difference =
      atan2(
        sin(
          targetAngle -
          this.angle
        ),
        cos(
          targetAngle -
          this.angle
        )
      );


    // 목표 가까이에서는 방향을 빨리 틀고 속도를 줄여서,
    // 목표 주위를 빙글빙글 도는 일이 없게 한다
    const turn =
      d < 100
        ? 0.3
        : 0.05;

    this.angle +=
      difference * turn;


    const landingSpeed =
      min(
        d,
        2.5
      );

    this.x +=
      cos(this.angle) *
      landingSpeed;

    this.y +=
      sin(this.angle) *
      landingSpeed;


    let wantedAngle =
      constrain(
        sin(this.angle) *
        0.35,
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
  // 벽
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


  flyAgain() {

    this.state =
      "fly";

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

    this.belly =
      1;
  }


  // =================================================
  // 흡혈 시작
  // =================================================

  startAttracting(
    x,
    y
  ) {

    if (
      this.state !== "fly"
    ) {
      return;
    }


    this.state =
      "attract";


    this.touchX =
      x;

    this.touchY =
      y;
  }


  // =================================================
  // 터치 위치 변경
  // =================================================

  setAttractTarget(
    x,
    y
  ) {

    if (
      this.state === "attract" ||
      this.state === "suck"
    ) {

      this.touchX =
        x;

      this.touchY =
        y;
    }
  }


  // =================================================
  // 주둥이 위치
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
  // 손가락으로 접근
  // =================================================

  updateAttract() {

    const dx =
      this.touchX -
      this.x;

    const dy =
      this.touchY -
      this.y;


    const distance =
      sqrt(
        dx * dx +
        dy * dy
      );


    // ---------------------------------------------
    // 방향을 손가락 쪽으로 돌림
    // ---------------------------------------------

    const targetAngle =
      atan2(
        dy,
        dx
      );


    const difference =
      atan2(
        sin(
          targetAngle -
          this.angle
        ),
        cos(
          targetAngle -
          this.angle
        )
      );


    this.angle +=
      difference * 0.08;


    this.flightTime +=
      0.15;


    const wobble =
      sin(
        this.flightTime * 2
      ) * 0.02;


    const moveAngle =
      this.angle +
      wobble;


    // ---------------------------------------------
    // 화면 기울기
    // ---------------------------------------------

    let wantedAngle =
      sin(this.angle) *
      0.35;


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


    // ---------------------------------------------
    // 주둥이 끝이 손가락에서 SHIELD_RADIUS만큼
    // 떨어진 곳에 오도록 목표 몸 위치 계산
    // ---------------------------------------------

    const facing =
      cos(this.angle) >= 0
        ? 1
        : -1;


    const noseLength =
      this.size * 1.45;


    const noseOffsetX =
      cos(this.visualAngle) *
      noseLength *
      facing;


    const noseOffsetY =
      sin(this.visualAngle) *
      noseLength *
      facing;


    // 모기와 손가락 사이의 방향
    let dirX =
      this.x -
      this.touchX;

    let dirY =
      this.y -
      this.touchY;


    let dirDistance =
      sqrt(
        dirX * dirX +
        dirY * dirY
      );


    if (
      dirDistance < 0.001
    ) {

      dirX =
        -cos(this.angle);

      dirY =
        -sin(this.angle);

      dirDistance = 1;
    }


    dirX /=
      dirDistance;

    dirY /=
      dirDistance;


    // 주둥이가 위치해야 하는 곳
    const noseTargetX =
      this.touchX +
      dirX *
      SHIELD_RADIUS;


    const noseTargetY =
      this.touchY +
      dirY *
      SHIELD_RADIUS;


    // 주둥이 목표 → 몸 중심 목표
    const bodyTargetX =
      noseTargetX -
      noseOffsetX;


    const bodyTargetY =
      noseTargetY -
      noseOffsetY;


    const bodyDX =
      bodyTargetX -
      this.x;

    const bodyDY =
      bodyTargetY -
      this.y;


    const bodyDistance =
      sqrt(
        bodyDX * bodyDX +
        bodyDY * bodyDY
      );


    // ---------------------------------------------
    // 주둥이가 커서 바로 앞에 도착
    // ---------------------------------------------

    if (
      bodyDistance < 3
    ) {

      this.x =
        bodyTargetX;

      this.y =
        bodyTargetY;

      this.state =
        "suck";

      this.suckTimer =
        0;

      this.belly =
        1;

      return;
    }


    // ---------------------------------------------
    // 목표 몸 위치로 이동
    // ---------------------------------------------

    const moveSpeed =
      min(
        5,
        bodyDistance
      );


    this.x +=
      (bodyDX / bodyDistance) *
      moveSpeed;


    this.y +=
      (bodyDY / bodyDistance) *
      moveSpeed;
  }


  // =================================================
  // 흡혈
  // =================================================

  updateSuck() {

    // ---------------------------------------------
    // 손가락과 모기의 현재 위치를 기준으로
    // 주둥이가 항상 손가락 바로 앞에 있도록 함
    // ---------------------------------------------

    let dirX =
      this.x -
      this.touchX;

    let dirY =
      this.y -
      this.touchY;


    let distance =
      sqrt(
        dirX * dirX +
        dirY * dirY
      );


    if (
      distance < 0.001
    ) {

      dirX =
        -cos(this.angle);

      dirY =
        -sin(this.angle);

      distance = 1;
    }


    dirX /=
      distance;

    dirY /=
      distance;


    const noseTargetX =
      this.touchX +
      dirX *
      SHIELD_RADIUS;


    const noseTargetY =
      this.touchY +
      dirY *
      SHIELD_RADIUS;


    const facing =
      cos(this.angle) >= 0
        ? 1
        : -1;


    const noseLength =
      this.size * 1.45;


    const noseOffsetX =
      cos(this.visualAngle) *
      noseLength *
      facing;


    const noseOffsetY =
      sin(this.visualAngle) *
      noseLength *
      facing;


    // 주둥이를 정확히 방어막 위치에 고정
    this.x =
      noseTargetX -
      noseOffsetX;

    this.y =
      noseTargetY -
      noseOffsetY;


    // ---------------------------------------------
    // 흡혈 진행
    // ---------------------------------------------

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
  // 손가락 놓음
  // =================================================

  stopAttracting() {

    if (
      this.state === "attract" ||
      this.state === "suck"
    ) {

      this.state =
        "fly";


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


      this.belly =
        1;
    }
  }


  // =================================================
  // 멈춰있는 모기 잡기
  // =================================================

  grab(x, y) {

    if (this.state !== "wall") {
      return false;
    }

    this.state = "held";

    this.touchX = x;
    this.touchY = y;

    this.heldFrames = 0;
    this.heldMoved = 0;
    this.shake = 0;
    this.lastDX = 0;
    this.lastDY = 0;

    return true;
  }


  // 손가락이 움직일 때: 방향이 반대로 바뀔 때마다 흔든 횟수가 쌓인다
  setHeldTarget(x, y) {

    if (this.state !== "held") {
      return;
    }

    const dx = x - this.touchX;
    const dy = y - this.touchY;

    const d = sqrt(dx * dx + dy * dy);

    this.touchX = x;
    this.touchY = y;

    this.heldMoved += d;

    if (d > SHAKE_MIN_STEP) {

      if (this.lastDX * dx + this.lastDY * dy < 0) {
        this.shake++;
      }

      this.lastDX = dx;
      this.lastDY = dy;
    }
  }


  updateHeld() {

    this.heldFrames++;

    // 손가락을 따라다닌다
    this.x = lerp(this.x, this.touchX, 0.35);
    this.y = lerp(this.y, this.touchY, 0.35);

    // 흔든 횟수는 시간이 지나면 줄어든다
    this.shake = max(0, this.shake - SHAKE_DECAY);

    // 많이 흔들수록 몸이 더 떨린다
    this.wobble =
      sin(this.heldFrames * 0.9) *
      min(this.shake / SHAKE_LIMIT, 1) *
      0.5;

    if (this.shake >= SHAKE_LIMIT) {
      this.makeDizzy();
    }
  }


  // 손가락을 뗄 때: 짧게 톡 눌렀으면 잡힘, 아니면 제자리로
  release() {

    if (this.state !== "held") {
      return;
    }

    this.state = "wall";

    if (
      this.heldFrames < TAP_FRAMES &&
      this.heldMoved < TAP_MOVE
    ) {
      this.kill();
    }
  }


  makeDizzy() {

    this.state = "dizzy";

    this.dizzyTimer = 0;
    this.spin = 0;
  }


  // 어지러워서 빙글빙글
  updateDizzy() {

    this.dizzyTimer++;

    this.spin += 0.3;

    if (this.dizzyTimer > DIZZY_FRAMES) {

      this.state = "fall";

      this.fallVX = random(-1.2, 1.2);
      this.fallVY = 0;
    }
  }


  // 툭 떨어져서 화면 아래로 사라진다
  updateFall() {

    this.fallVY += 0.7;

    this.x += this.fallVX;
    this.y += this.fallVY;

    this.spin += 0.2;

    if (this.y > height + 80) {
      this.death = true;
    }
  }


  // =================================================
  // DISPLAY
  // =================================================

  display() {

    if (
      this.state === "wall" ||
      this.state === "held" ||
      this.state === "dizzy" ||
      this.state === "fall"
    ) {

      this.displayTop();

      if (this.state === "dizzy") {
        this.displayStars();
      }
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


    // 배

    ellipse(
      -s * 0.38,
      0,
      s * 0.55 *
      this.belly,
      s * 0.38 *
      this.belly
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

    if (this.state === "held") {
      rotate(this.wobble);
    }

    else if (
      this.state === "dizzy" ||
      this.state === "fall"
    ) {
      rotate(this.spin);
    }

    noStroke();

    const s =
      this.size;


    fill(
      this.topWingColor
    );

    ellipse(
      -s * 0.42,
      -s * 0.2,
      s * 0.9,
      s * 0.55
    );

    ellipse(
      s * 0.42,
      -s * 0.2,
      s * 0.9,
      s * 0.55
    );


    fill(
      this.baseColor
    );

    ellipse(
      0,
      s * 0.15,
      s * 0.55,
      s
    );


    circle(
      0,
      -s * 0.36,
      s * 0.38
    );


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
  // 어지러운 별
  // =================================================

  displayStars() {

    push();

    noStroke();

    fill(this.baseColor);

    for (let i = 0; i < 3; i++) {

      const a =
        this.spin * 1.5 +
        i * TWO_PI / 3;

      circle(
        this.x + cos(a) * this.size * 0.9,
        this.y - this.size * 0.6 +
        sin(a) * this.size * 0.3,
        this.size * 0.22
      );
    }

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

    this.death =
      true;
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
  // 터지는 효과
  // =================================================

  updateBurst() {

    this.burstSize += 2;

    this.burstAlpha -= 18;

    if (
      this.burstAlpha <= 0
    ) {

      this.death =
        true;
    }
  }


  displayBurst() {

    push();

    noStroke();


    if (
      !this.burstColor
    ) {

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