const Engine = Matter.Engine;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Body = Matter.Body;

let engine;

let apple, lemon, orange, watermelon, blueberry;
let mixerLeftA, mixerLeftB, mixerRightA, mixerRightB;
let waterLevel;


// SETUP

function setup() {

  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);

  engine = Engine.create();

  // 중력
  engine.gravity.y = 1;
  engine.gravity.scale = 0.002;

  // 물의 높이
  waterLevel = height * 0.45;

  // 화면 벽
  Composite.add(engine.world, [
    Bodies.rectangle(-15, height / 2, 30, height, {
      isStatic: true,
      restitution: 0.8
    }),

    Bodies.rectangle(width + 15, height / 2, 30, height, {
      isStatic: true,
      restitution: 0.8
    }),

    Bodies.rectangle(width / 2, height + 20, width, 40, {
      isStatic: true,
      restitution: 0.8
    }),

    Bodies.rectangle(width / 2, -35, width, 30, {
      isStatic: true,
      restitution: 0.5
    })
  ]);


  // 과일

  apple = Bodies.circle(width * 0.17, 100, 72, {
    density: 0.0013,
    restitution: 0.90,
    friction: 0.4,
    frictionAir: 0.002
  });

  lemon = Bodies.rectangle(width * 0.34, 70, 175, 210, {
    density: 0.0010,
    restitution: 0.90,
    friction: 0.3,
    frictionAir: 0.002,
    chamfer: {
      radius: [140, 20, 140, 10]
    }
  });

  orange = Bodies.circle(width * 0.50, 120, 62, {
    density: 0.0007,
    restitution: 0.96,
    friction: 0.2,
    frictionAir: 0.001
  });

  watermelon = Bodies.circle(width * 0.67, 80, 100, {
    density: 0.0018,
    restitution: 0.78,
    friction: 0.6,
    frictionAir: 0.003
  });

  blueberry = Bodies.circle(width * 0.84, 100, 45, {
    density: 0.0004,
    restitution: 0.99,
    friction: 0.1,
    frictionAir: 0.001
  });

  Composite.add(engine.world, [
    apple,
    lemon,
    orange,
    watermelon,
    blueberry
  ]);


  // 과일 초기 회전

  Body.setAngularVelocity(apple, 0.035);
  Body.setAngularVelocity(lemon, -0.07);
  Body.setAngularVelocity(orange, 0.05);
  Body.setAngularVelocity(watermelon, -0.03);
  Body.setAngularVelocity(blueberry, 0.08);


  // 과일 초기 좌우 속도

  Body.setVelocity(apple, {
    x: 1.5,
    y: 0
  });

  Body.setVelocity(lemon, {
    x: -1.5,
    y: 0
  });

  Body.setVelocity(orange, {
    x: 1.2,
    y: 0
  });

  Body.setVelocity(watermelon, {
    x: -1.4,
    y: 0
  });

  Body.setVelocity(blueberry, {
    x: -1.0,
    y: 0
  });


  // 회전하는 십자

  mixerLeftA = Bodies.rectangle(
    width * 0.27,
    height * 0.70,
    360,
    18,
    {
      isStatic: true,
      restitution: 1,
      friction: 0.02
    }
  );

  mixerLeftB = Bodies.rectangle(
    width * 0.27,
    height * 0.70,
    18,
    360,
    {
      isStatic: true,
      restitution: 1,
      friction: 0.02
    }
  );

  mixerRightA = Bodies.rectangle(
    width * 0.73,
    height * 0.70,
    360,
    18,
    {
      isStatic: true,
      restitution: 1,
      friction: 0.02
    }
  );

  mixerRightB = Bodies.rectangle(
    width * 0.73,
    height * 0.70,
    18,
    360,
    {
      isStatic: true,
      restitution: 1,
      friction: 0.02
    }
  );

  Composite.add(engine.world, [
    mixerLeftA,
    mixerLeftB,
    mixerRightA,
    mixerRightB
  ]);
}


// DRAW

function draw() {

  background("#dff7ff");
  Engine.update(engine);


  // 십자 회전

  let leftAngle =
    frameCount * 0.045 +
    sin(frameCount * 0.02) * 0.5;

  let rightAngle =
    -frameCount * 0.055 +
    cos(frameCount * 0.017) * 0.5;

  Body.setAngle(mixerLeftA, leftAngle);
  Body.setAngle(mixerLeftB, leftAngle);
  Body.setAngle(mixerRightA, rightAngle);
  Body.setAngle(mixerRightB, rightAngle);


  // 과일 부력

  buoyancy(apple, 72, 1.45);
  buoyancy(lemon, 95, 1.35);
  buoyancy(orange, 62, 1.60);
  buoyancy(watermelon, 100, 1.30);
  buoyancy(blueberry, 45, 1.75);


  // 물 흐름

  waterFlow(apple, 0.0007);
  waterFlow(lemon, -0.00075);
  waterFlow(orange, 0.0008);
  waterFlow(watermelon, -0.00065);
  waterFlow(blueberry, 0.0009);


  // 과일

  drawCircle(apple, "#a9df45", 144);
  drawLemon();
  drawCircle(orange, "#ff8a00", 124);
  drawCircle(
    watermelon,
    "#ed5148",
    200,
    "#27823d",
    14
  );
  drawCircle(blueberry, "#5265d9", 90);


  // 십자

  drawMixer(mixerLeftA);
  drawMixer(mixerLeftB);
  drawMixer(mixerRightA);
  drawMixer(mixerRightB);


  // 물

  noStroke();

  fill(45, 175, 215, 60);

  rect(
    width / 2,
    (waterLevel + height) / 2,
    width,
    height - waterLevel
  );
}


// 부력

function buoyancy(body, radius, strength) {

  let bottom = body.position.y + radius;

  if (bottom <= waterLevel) return;

  let submerged = constrain(
    (bottom - waterLevel) / (radius * 2),
    0,
    1
  );

  let gravityForce =
    body.mass *
    engine.gravity.y *
    engine.gravity.scale;

  let lift =
    gravityForce *
    strength *
    submerged;

  Body.applyForce(body, body.position, {
    x: 0,
    y: -lift
  });

  body.frictionAir = 0.008;

  // 레몬은 물속에서 회전이 점점 느려짐

  if (
    body === lemon &&
    body.position.y > waterLevel
  ) {
    Body.setAngularVelocity(
      body,
      body.angularVelocity * 0.992
    );
  }
}


// 물 흐름

function waterFlow(body, amount) {

  if (body.position.y <= waterLevel - 30) return;

  let force =
    sin(frameCount * 0.017 + body.id * 3) *
    amount;

  Body.applyForce(body, body.position, {
    x: force,
    y: 0
  });
}


// 원형 과일

function drawCircle(
  body,
  fillColor,
  size,
  strokeColor = null,
  strokeSize = 0
) {

  push();

  translate(
    body.position.x,
    body.position.y
  );

  rotate(body.angle);

  fill(fillColor);

  if (strokeColor) {
    stroke(strokeColor);
    strokeWeight(strokeSize);
  } else {
    noStroke();
  }

  circle(0, 0, size);

  pop();
}


// 레몬

function drawLemon() {

  fill("#ceff1e");
  noStroke();

  beginShape();

  for (let v of lemon.vertices) {
    vertex(v.x, v.y);
  }

  endShape(CLOSE);
}


// 십자

function drawMixer(body) {

  fill(255);
  noStroke();

  beginShape();

  for (let v of body.vertices) {
    vertex(v.x, v.y);
  }

  endShape(CLOSE);
}


// 화면 크기 변경

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );

  waterLevel = height * 0.45;
}