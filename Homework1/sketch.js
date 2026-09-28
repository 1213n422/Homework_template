const Engine = Matter.Engine;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Body = Matter.Body;

let engine;

let apple;
let lemon;
let orange;
let watermelon;
let blueberry;

let mixerLeftA, mixerLeftB;
let mixerRightA, mixerRightB;

let waterLevel;
let time = 0;


function setup() {

  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);

  engine = Engine.create();

  engine.gravity.y = 1;
  engine.gravity.scale = 0.0016;

  waterLevel = height * 0.45;


  // 벽

  Composite.add(engine.world, [

    Bodies.rectangle(
      -15,
      height / 2,
      30,
      height,
      {
        isStatic: true,
        restitution: 0.8
      }
    ),

    Bodies.rectangle(
      width + 15,
      height / 2,
      30,
      height,
      {
        isStatic: true,
        restitution: 0.8
      }
    ),

    Bodies.rectangle(
      width / 2,
      height + 20,
      width,
      40,
      {
        isStatic: true,
        restitution: 0.8
      }
    )

  ]);


  // 과일

  apple = Bodies.circle(
    width * 0.17,
    -20,
    72,
    {
      density: 0.0013,
      restitution: 0.90,
      friction: 0.4,
      frictionAir: 0.002
    }
  );


  lemon = Bodies.rectangle(
    width * 0.34,
    -70,
    175,
    210,
    {
      density: 0.0010,
      restitution: 0.90,
      friction: 0.3,
      frictionAir: 0.002,

      chamfer: {
        radius: [140, 20, 140, 10]
      }
    }
  );


  orange = Bodies.circle(
    width * 0.50,
    -10,
    62,
    {
      density: 0.0007,
      restitution: 0.96,
      friction: 0.2,
      frictionAir: 0.001
    }
  );


  watermelon = Bodies.circle(
    width * 0.67,
    -40,
    100,
    {
      density: 0.0018,
      restitution: 0.78,
      friction: 0.6,
      frictionAir: 0.003
    }
  );


  blueberry = Bodies.circle(
    width * 0.84,
    -15,
    45,
    {
      density: 0.0004,
      restitution: 0.99,
      friction: 0.1,
      frictionAir: 0.001
    }
  );


  Composite.add(engine.world, [
    apple,
    lemon,
    orange,
    watermelon,
    blueberry
  ]);


  // 초기 회전

  Body.setAngularVelocity(
    apple,
    0.03
  );

  Body.setAngularVelocity(
    lemon,
    -0.06
  );

  Body.setAngularVelocity(
    orange,
    0.04
  );

  Body.setAngularVelocity(
    watermelon,
    -0.025
  );

  Body.setAngularVelocity(
    blueberry,
    0.07
  );


  // 초기 좌우 움직임

  Body.setVelocity(
    apple,
    {
      x: 1.2,
      y: 0
    }
  );

  Body.setVelocity(
    lemon,
    {
      x: -1.2,
      y: 0
    }
  );

  Body.setVelocity(
    orange,
    {
      x: 1.0,
      y: 0
    }
  );

  Body.setVelocity(
    watermelon,
    {
      x: -1.1,
      y: 0
    }
  );

  Body.setVelocity(
    blueberry,
    {
      x: -0.8,
      y: 0
    }
  );


  // 왼쪽 십자

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


  // 오른쪽 십자

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


function draw() {

  background("#dff7ff");

  time += deltaTime / 1000;

  Engine.update(
    engine,
    min(deltaTime, 33.3)
  );


  // 십자 회전

  let leftAngle =
    time * 1.25 +
    sin(time * 0.7) * 0.35;

  let rightAngle =
    -time * 1.45 +
    cos(time * 0.6) * 0.35;


  Body.setAngle(
    mixerLeftA,
    leftAngle
  );

  Body.setAngle(
    mixerLeftB,
    leftAngle
  );

  Body.setAngle(
    mixerRightA,
    rightAngle
  );

  Body.setAngle(
    mixerRightB,
    rightAngle
  );


  // 부력

  buoyancy(
    apple,
    72,
    1.45
  );

  buoyancy(
    lemon,
    95,
    1.35
  );

  buoyancy(
    orange,
    62,
    1.60
  );

  buoyancy(
    watermelon,
    100,
    1.30
  );

  buoyancy(
    blueberry,
    45,
    1.75
  );


  // 물 흐름

  waterFlow(
    apple,
    0.00045
  );

  waterFlow(
    lemon,
    -0.00050
  );

  waterFlow(
    orange,
    0.00055
  );

  waterFlow(
    watermelon,
    -0.00042
  );

  waterFlow(
    blueberry,
    0.00058
  );


  // 사과

  drawCircle(
    apple,
    "#a9df45",
    144
  );


  // 레몬

  drawLemon();


  // 귤

  drawCircle(
    orange,
    "#ff8a00",
    124
  );


  // 수박

  drawCircle(
    watermelon,
    "#ed5148",
    200,
    "#27823d",
    14
  );


  // 블루베리

  drawCircle(
    blueberry,
    "#5265d9",
    90
  );


  // 십자

  drawMixer(mixerLeftA);
  drawMixer(mixerLeftB);

  drawMixer(mixerRightA);
  drawMixer(mixerRightB);


  // 물

  noStroke();

  fill(
    45,
    175,
    215,
    60
  );

  rect(
    width / 2,
    (waterLevel + height) / 2,
    width,
    height - waterLevel
  );
}


// 부력

function buoyancy(
  body,
  radius,
  strength
) {

  let bottom =
    body.position.y + radius;


  if (
    bottom <= waterLevel
  ) {
    return;
  }


  let submerged =
    constrain(
      (bottom - waterLevel) /
      (radius * 2),
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


  Body.applyForce(
    body,
    body.position,
    {
      x: 0,
      y: -lift
    }
  );


  body.frictionAir = 0.008;


  // 레몬 회전 감소

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

function waterFlow(
  body,
  amount
) {

  if (
    body.position.y <=
    waterLevel - 30
  ) {
    return;
  }


  let force =
    sin(
      time +
      body.id * 3
    ) * amount;


  Body.applyForce(
    body,
    body.position,
    {
      x: force,
      y: 0
    }
  );

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

  rotate(
    body.angle
  );

  fill(fillColor);


  if (strokeColor) {

    stroke(strokeColor);
    strokeWeight(strokeSize);

  } else {

    noStroke();

  }


  circle(
    0,
    0,
    size
  );

  pop();

}


// 레몬

function drawLemon() {

  fill("#ceff1e");
  noStroke();

  beginShape();

  for (
    let v of lemon.vertices
  ) {

    vertex(
      v.x,
      v.y
    );

  }

  endShape(CLOSE);

}


// 십자

function drawMixer(body) {

  fill(255);
  noStroke();

  beginShape();

  for (
    let v of body.vertices
  ) {

    vertex(
      v.x,
      v.y
    );

  }

  endShape(CLOSE);

}


// 화면 크기 변경

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );

  waterLevel =
    height * 0.45;

}