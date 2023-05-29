import { Coords, clamp, reflectOverLine, lineLineIntersection } from "./utils";

const GRID_SIZE = 40;
const GRID_OFFSET = 40;
const WIDTH = 16;
const HEIGHT = 12;
const CANVAS_WIDTH = WIDTH * GRID_SIZE + 2 * GRID_OFFSET;
const CANVAS_HEIGHT = HEIGHT * GRID_SIZE + 2 * GRID_OFFSET;
const PI2 = Math.PI * 2;

type CanvasCoords = { x: number; y: number };

const INITIAL_EYE_POSITION: Coords = { i: 10, j: 3 } as const;
const INITIAL_OBJECT_POSITION: Coords = { i: 2, j: 1 } as const;
const INITIAL_POINT_POSITION: Coords = { i: 7, j: HEIGHT / 2 } as const;

type DraggableState = {
  readonly bounds: {
    readonly mini: number;
    readonly maxi: number;
    readonly minj: number;
    readonly maxj: number;
  };
  position: Coords;
  draggingOffset: null | { dx: number; dy: number };
};

type Part1State = {
  point: DraggableState;
};

type Part2State = {
  image: DraggableState;
};

type Part3State = {
  eye: DraggableState;
  object: DraggableState;
};

type Part4State = {
  eye: DraggableState;
  object: DraggableState;
};

function toCanvasCoords({ i: i, j: j }: Coords): CanvasCoords {
  return {
    x: i * GRID_SIZE + GRID_OFFSET,
    y: j * GRID_SIZE + GRID_OFFSET,
  };
}

function toClosestCoords({ x: x, y: y }: CanvasCoords): Coords {
  return {
    i: clamp(Math.round((x - GRID_OFFSET) / GRID_SIZE), 0, WIDTH),
    j: clamp(Math.round((y - GRID_OFFSET) / GRID_SIZE), 0, HEIGHT),
  };
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#999";
  for (let i = 0; i <= WIDTH; i++) {
    for (let j = 0; j <= HEIGHT; j++) {
      const { x: x, y: y } = toCanvasCoords({ i: i, j: j });
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

function drawEye(ctx: CanvasRenderingContext2D, coords: Coords) {
  const SIZE = 20;
  const { x: x, y: y } = toCanvasCoords(coords);

  ctx.setTransform(1, 0, 0, 1, x, y);

  // Outline of eye
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.fillStyle = "white";
  ctx.beginPath();
  // Top arc
  ctx.arc(0, SIZE, SIZE * Math.SQRT2, PI2 * (5 / 8), PI2 * (7 / 8));
  // Bottom arc
  ctx.arc(0, -SIZE, SIZE * Math.SQRT2, PI2 * (1 / 8), PI2 * (3 / 8));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Iris
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(0, 0, (Math.SQRT2 - 1) * SIZE, 0, PI2);
  ctx.fill();

  ctx.resetTransform();
}

function drawObject(
  ctx: CanvasRenderingContext2D,
  coords: Coords,
  virtual = 0,
  [a, b, c, d]: [number, number, number, number] = [1, 0, 0, 1]
) {
  const SIZE = 20;
  const { x: x, y: y } = toCanvasCoords(coords);

  ctx.setTransform(a, b, c, d, x, y);

  if (virtual === 0) {
    ctx.fillStyle = "#f00";
    ctx.strokeStyle = "#000";
  } else if (virtual === 1) {
    ctx.fillStyle = "#f66";
    ctx.strokeStyle = "#666";
  } else {
    ctx.fillStyle = "#f99";
    ctx.strokeStyle = "#999";
  }
  ctx.lineCap = "round";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-(3 / 4) * SIZE, -(3 / 4) * SIZE);
  ctx.lineTo(-(1 / 4) * SIZE, -(3 / 4) * SIZE);
  ctx.arc(0, -(3 / 4) * SIZE, (1 / 4) * SIZE, (1 / 2) * PI2, PI2, false);
  ctx.lineTo((3 / 4) * SIZE, -(3 / 4) * SIZE);
  ctx.lineTo((3 / 4) * SIZE, -(1 / 4) * SIZE);
  // prettier-ignore
  ctx.arc((3 / 4) * SIZE, 0, (1 / 4) * SIZE, (3 / 4) * PI2, (1 / 4) * PI2, false);
  ctx.lineTo((3 / 4) * SIZE, (3 / 4) * SIZE);
  ctx.lineTo((1 / 4) * SIZE, (3 / 4) * SIZE);
  ctx.arc(0, (3 / 4) * SIZE, (1 / 4) * SIZE, 0, (1 / 2) * PI2, true);
  ctx.lineTo(-(3 / 4) * SIZE, (3 / 4) * SIZE);
  ctx.lineTo(-(3 / 4) * SIZE, (1 / 4) * SIZE);
  // prettier-ignore
  ctx.arc(-(3 / 4) * SIZE, 0, (1 / 4) * SIZE, (1 / 4) * PI2, (3 / 4) * PI2, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.resetTransform();
}

function drawMirror(
  ctx: CanvasRenderingContext2D,
  start: Coords,
  end: Coords,
  virtual = 0
) {
  const { x: startX, y: startY } = toCanvasCoords(start);
  const { x: endX, y: endY } = toCanvasCoords(end);

  if (virtual === 0) {
    ctx.strokeStyle = "#666";
  } else if (virtual === 1) {
    ctx.strokeStyle = "#999";
  } else {
    ctx.strokeStyle = "#ccc";
  }
  ctx.lineCap = "square";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function drawRay(
  ctx: CanvasRenderingContext2D,
  start: Coords,
  end: Coords,
  virtual = false
) {
  const { x: startX, y: startY } = toCanvasCoords(start);
  const { x: endX, y: endY } = toCanvasCoords(end);

  ctx.strokeStyle = "red";
  ctx.lineCap = "butt";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (virtual) {
    ctx.setLineDash([4, 6]);
  }
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);

  const angle = Math.atan2(endY - startY, endX - startX);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  ctx.setTransform(cos, sin, -sin, cos, midX, midY);
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(5, 5);
  ctx.lineTo(5, -5);
  ctx.lineTo(0, 0);
  ctx.fill();
  ctx.resetTransform();
}

function drawIntersectionPoint(ctx: CanvasRenderingContext2D, coords: Coords) {
  const { x: x, y: y } = toCanvasCoords(coords);

  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, PI2);
  ctx.fill();
}

function drawArcs(
  ctx: CanvasRenderingContext2D,
  pt: Coords,
  eye: Coords,
  object: Coords
) {
  const { x: x, y: y } = toCanvasCoords(pt);
  const objectAngle =
    (Math.atan2(object.j - pt.j, object.i - pt.i) + PI2) % PI2;
  const eyeAngle = (Math.atan2(eye.j - pt.j, eye.i - pt.i) + PI2) % PI2;

  const objectAngleFrac = (objectAngle - (1 / 2) * PI2) / ((1 / 4) * PI2);
  const eyeAngleFrac = (PI2 - eyeAngle) / ((1 / 4) * PI2);

  // Draw angle measure arcs
  ctx.lineCap = "butt";
  ctx.strokeStyle = "#fcc";

  ctx.lineWidth = 10 * objectAngleFrac;
  ctx.beginPath();
  ctx.arc(x, y, 30, (1 / 2) * PI2, objectAngle);
  ctx.stroke();

  ctx.lineWidth = 10 * eyeAngleFrac;
  ctx.beginPath();
  ctx.arc(x, y, 30, eyeAngle, 0);
  ctx.stroke();
}

function handleMouseUp(state: { [key: string]: DraggableState }) {
  for (const key in state) {
    state[key].draggingOffset = null;
  }
}

function handleMouseDown(
  e: MouseEvent,
  state: { [key: string]: DraggableState }
) {
  const clickCanvasCoords = { x: e.offsetX, y: e.offsetY };
  const coords = toClosestCoords(clickCanvasCoords);
  const canvasCoords = toCanvasCoords(coords);
  const mouseOffset = {
    dx: clickCanvasCoords.x - canvasCoords.x,
    dy: clickCanvasCoords.y - canvasCoords.y,
  };

  for (const key in state) {
    if (
      coords.i === state[key].position.i &&
      coords.j === state[key].position.j
    ) {
      state[key].draggingOffset = mouseOffset;
      return;
    }
  }
}

function handleMouseMove(
  e: MouseEvent,
  canvas: HTMLCanvasElement,
  computeAndDrawFunction: () => void,
  state: { [key: string]: DraggableState }
) {
  for (const key in state) {
    const offset = state[key].draggingOffset;
    if (offset != null) {
      const canvasRect = canvas.getBoundingClientRect();
      const mouseCanvasCoords = {
        x: e.clientX - canvasRect.x,
        y: e.clientY - canvasRect.y,
      };

      const centerCanvasCoords = {
        x: mouseCanvasCoords.x - offset.dx,
        y: mouseCanvasCoords.y - offset.dy,
      };
      const centerCoords = toClosestCoords(centerCanvasCoords);
      const clampedCenterCoords = {
        i: clamp(
          centerCoords.i,
          state[key].bounds.mini,
          state[key].bounds.maxi
        ),
        j: clamp(
          centerCoords.j,
          state[key].bounds.minj,
          state[key].bounds.maxj
        ),
      };
      if (
        clampedCenterCoords.i != state[key].position.i ||
        clampedCenterCoords.j != state[key].position.j
      ) {
        state[key].position = clampedCenterCoords;
        computeAndDrawFunction();
      }
      break;
    }
  }
}

function computeAndDrawPart1(ctx: CanvasRenderingContext2D, state: Part1State) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawGrid(ctx);
  drawArcs(
    ctx,
    state.point.position,
    INITIAL_EYE_POSITION,
    INITIAL_OBJECT_POSITION
  );
  drawMirror(ctx, { i: 0, j: HEIGHT / 2 }, { i: WIDTH, j: HEIGHT / 2 });
  drawEye(ctx, INITIAL_EYE_POSITION);
  drawObject(ctx, INITIAL_OBJECT_POSITION);
  drawRay(ctx, INITIAL_EYE_POSITION, state.point.position);
  drawRay(ctx, state.point.position, INITIAL_OBJECT_POSITION);
  drawIntersectionPoint(ctx, state.point.position);
}

function computeAndDrawPart2(ctx: CanvasRenderingContext2D, state: Part2State) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawGrid(ctx);
  drawMirror(ctx, { i: 0, j: HEIGHT / 2 }, { i: WIDTH, j: HEIGHT / 2 });
  drawEye(ctx, INITIAL_EYE_POSITION);
  drawObject(ctx, INITIAL_OBJECT_POSITION);
  drawRay(ctx, INITIAL_EYE_POSITION, INITIAL_POINT_POSITION);
  drawRay(ctx, INITIAL_POINT_POSITION, INITIAL_OBJECT_POSITION);
  drawObject(ctx, state.image.position, 1, [1, 0, 0, -1]);
  drawRay(ctx, INITIAL_POINT_POSITION, state.image.position, true);
}

function computeAndDrawPart3(ctx: CanvasRenderingContext2D, state: Part3State) {
  const mirrorStart = { i: 0, j: HEIGHT / 2 };
  const mirrorEnd = { i: WIDTH, j: HEIGHT / 2 };

  const virtualImgPosition = reflectOverLine(
    state.object.position,
    mirrorStart,
    mirrorEnd
  );

  const mirrorIntersection = lineLineIntersection(
    state.eye.position,
    virtualImgPosition,
    mirrorStart,
    mirrorEnd
  );

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawGrid(ctx);
  drawMirror(ctx, { i: 0, j: HEIGHT / 2 }, { i: WIDTH, j: HEIGHT / 2 });
  drawObject(ctx, state.object.position);
  drawObject(ctx, virtualImgPosition, 1, [1, 0, 0, -1]);
  drawEye(ctx, state.eye.position);
  drawRay(ctx, state.eye.position, mirrorIntersection);
  drawRay(ctx, mirrorIntersection, state.object.position);
  drawRay(ctx, mirrorIntersection, virtualImgPosition, true);
}

function computeAndDrawPart4(ctx: CanvasRenderingContext2D, state: Part4State) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawGrid(ctx);

  const virtualImgPosition1 = reflectOverLine(
    state.object.position,
    { i: 4, j: 0 },
    { i: 4, j: HEIGHT }
  );

  const virtualImgPosition2 = reflectOverLine(
    state.object.position,
    { i: 8, j: 0 },
    { i: 8, j: HEIGHT }
  );

  const virtualImgPosition3 = reflectOverLine(
    virtualImgPosition2,
    { i: 12, j: 0 },
    { i: 12, j: HEIGHT }
  );

  const mirrorIntersection1 = lineLineIntersection(
    state.eye.position,
    virtualImgPosition3,
    { i: 8, j: 0 },
    { i: 8, j: HEIGHT }
  );

  const mirrorIntersection2 = lineLineIntersection(
    mirrorIntersection1,
    virtualImgPosition1,
    { i: 4, j: 0 },
    { i: 4, j: HEIGHT }
  );

  for (const i of [4, 8]) {
    drawMirror(ctx, { i: i, j: 0 }, { i: i, j: HEIGHT });
  }
  for (const i of [0, 12]) {
    drawMirror(ctx, { i: i, j: 0 }, { i: i, j: HEIGHT }, 1);
  }
  drawMirror(ctx, { i: 16, j: 0 }, { i: 16, j: HEIGHT }, 2);

  drawObject(ctx, state.object.position);
  drawEye(ctx, state.eye.position);

  drawObject(ctx, virtualImgPosition1, 1, [-1, 0, 0, 1]);
  drawObject(ctx, virtualImgPosition2, 1, [-1, 0, 0, 1]);
  drawObject(ctx, virtualImgPosition3, 2, [1, 0, 0, 1]);

  drawRay(ctx, state.eye.position, mirrorIntersection1);
  drawRay(ctx, mirrorIntersection1, mirrorIntersection2);
  drawRay(ctx, mirrorIntersection2, state.object.position);
  drawRay(ctx, mirrorIntersection1, virtualImgPosition3, true);
}

function setUpPart1(
  instructions: HTMLDivElement,
  feedback: HTMLDivElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  const p = document.createElement("p");
  p.innerHTML =
    "When light is reflected from a mirror, the angle of incidence is equal to the angle of reflection. Drag the point at which the light ray hits the mirror to the correct position.";
  const checkButton = document.createElement("button");
  checkButton.innerHTML = "Check";
  checkButton.type = "button";
  instructions.replaceChildren(p, checkButton);

  const part1State = {
    point: {
      bounds: {
        mini: 0,
        maxi: WIDTH,
        minj: HEIGHT / 2,
        maxj: HEIGHT / 2,
      },
      position: { i: 4, j: HEIGHT / 2 },
      draggingOffset: null,
    },
  };

  const handleMouseUp1 = () => handleMouseUp(part1State);
  const handleMouseDown1 = (e: MouseEvent) => handleMouseDown(e, part1State);
  const handleMouseMove1 = (e: MouseEvent) =>
    handleMouseMove(
      e,
      canvas,
      () => computeAndDrawPart1(ctx, part1State),
      part1State
    );

  document.addEventListener("mouseup", handleMouseUp1);
  canvas.addEventListener("mousedown", handleMouseDown1);
  document.addEventListener("mousemove", handleMouseMove1);

  checkButton.addEventListener("click", () => {
    if (part1State.point.position.i === 7) {
      document.removeEventListener("mouseup", handleMouseUp1);
      canvas.removeEventListener("mousedown", handleMouseDown1);
      document.removeEventListener("mousemove", handleMouseMove1);

      const correctP = document.createElement("p");
      correctP.innerHTML = "Correct!";

      const continueButton = document.createElement("button");
      continueButton.innerHTML = "Continue";
      continueButton.type = "button";
      feedback.replaceChildren(correctP, continueButton);

      continueButton.addEventListener("click", () => {
        setUpPart2(instructions, feedback, canvas, ctx);
      });
    } else {
      const incorrectP = document.createElement("p");
      incorrectP.innerHTML = "Incorrect.";
      feedback.replaceChildren(incorrectP);
    }
  });

  computeAndDrawPart1(ctx, part1State);
}

function setUpPart2(
  instructions: HTMLDivElement,
  feedback: HTMLDivElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  const p = document.createElement("p");
  p.innerHTML =
    "Drag the virtual image formed by reflection to the correct position by extending the reflected ray backwards.";
  const checkButton = document.createElement("button");
  checkButton.innerHTML = "Check";
  checkButton.type = "button";
  instructions.replaceChildren(p, checkButton);

  feedback.replaceChildren();

  const part2State = {
    image: {
      bounds: {
        mini: 0,
        maxi: WIDTH,
        minj: HEIGHT / 2 + 1,
        maxj: HEIGHT,
      },
      position: { i: 5, j: 10 },
      draggingOffset: null,
    },
  };

  const handleMouseUp2 = () => handleMouseUp(part2State);
  const handleMouseDown2 = (e: MouseEvent) => handleMouseDown(e, part2State);
  const handleMouseMove2 = (e: MouseEvent) =>
    handleMouseMove(
      e,
      canvas,
      () => computeAndDrawPart2(ctx, part2State),
      part2State
    );

  document.addEventListener("mouseup", handleMouseUp2);
  canvas.addEventListener("mousedown", handleMouseDown2);
  document.addEventListener("mousemove", handleMouseMove2);

  checkButton.addEventListener("click", () => {
    if (
      part2State.image.position.i === 2 &&
      part2State.image.position.j == 11
    ) {
      document.removeEventListener("mouseup", handleMouseUp2);
      canvas.removeEventListener("mousedown", handleMouseDown2);
      document.removeEventListener("mousemove", handleMouseMove2);

      const correctP = document.createElement("p");
      correctP.innerHTML = "Correct!";

      const continueButton = document.createElement("button");
      continueButton.innerHTML = "Continue";
      continueButton.type = "button";
      feedback.replaceChildren(correctP, continueButton);

      continueButton.addEventListener("click", () => {
        setUpPart3(instructions, feedback, canvas, ctx);
      });
    } else {
      const incorrectP = document.createElement("p");
      incorrectP.innerHTML = "Incorrect.";
      feedback.replaceChildren(incorrectP);
    }
  });

  computeAndDrawPart2(ctx, part2State);
}

function setUpPart3(
  instructions: HTMLDivElement,
  feedback: HTMLDivElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  const p = document.createElement("p");
  p.innerHTML =
    "Experiment with dragging the eye and the object to see how the light ray and virtual image are affected.";
  instructions.replaceChildren(p);

  const continueButton = document.createElement("button");
  continueButton.innerHTML = "Next";
  continueButton.type = "button";
  feedback.replaceChildren(continueButton);

  const part3State: Part3State = {
    eye: {
      bounds: { mini: 0, maxi: WIDTH, minj: 0, maxj: HEIGHT / 2 - 1 },
      position: INITIAL_EYE_POSITION,
      draggingOffset: null,
    },
    object: {
      bounds: { mini: 0, maxi: WIDTH, minj: 0, maxj: HEIGHT / 2 - 1 },
      position: INITIAL_OBJECT_POSITION,
      draggingOffset: null,
    },
  };

  const handleMouseUp3 = () => handleMouseUp(part3State);
  const handleMouseDown3 = (e: MouseEvent) => handleMouseDown(e, part3State);
  const handleMouseMove3 = (e: MouseEvent) =>
    handleMouseMove(
      e,
      canvas,
      () => computeAndDrawPart3(ctx, part3State),
      part3State
    );

  document.addEventListener("mouseup", handleMouseUp3);
  canvas.addEventListener("mousedown", handleMouseDown3);
  document.addEventListener("mousemove", handleMouseMove3);

  continueButton.addEventListener("click", () => {
    document.removeEventListener("mouseup", handleMouseUp3);
    canvas.removeEventListener("mousedown", handleMouseDown3);
    document.removeEventListener("mousemove", handleMouseMove3);

    setUpPart4(instructions, feedback, canvas, ctx);
  });

  computeAndDrawPart3(ctx, part3State);
}

function setUpPart4(
  instructions: HTMLDivElement,
  feedback: HTMLDivElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  const p = document.createElement("p");
  p.innerHTML =
    "Multiple reflections are possible with multiple mirrors. Experiment with dragging the eye and the object to see how the light ray and virtual image are affected.";
  instructions.replaceChildren(p);

  feedback.replaceChildren();

  const part4State: Part4State = {
    eye: {
      bounds: { mini: 5, maxi: 7, minj: 0, maxj: HEIGHT },
      position: { i: 6, j: 10 },
      draggingOffset: null,
    },
    object: {
      bounds: { mini: 5, maxi: 7, minj: 0, maxj: HEIGHT },
      position: { i: 7, j: 3 },
      draggingOffset: null,
    },
  };

  const handleMouseUp4 = () => handleMouseUp(part4State);
  const handleMouseDown4 = (e: MouseEvent) => handleMouseDown(e, part4State);
  const handleMouseMove4 = (e: MouseEvent) =>
    handleMouseMove(
      e,
      canvas,
      () => computeAndDrawPart4(ctx, part4State),
      part4State
    );

  document.addEventListener("mouseup", handleMouseUp4);
  canvas.addEventListener("mousedown", handleMouseDown4);
  document.addEventListener("mousemove", handleMouseMove4);

  computeAndDrawPart4(ctx, part4State);
}

function main() {
  const wrapper = document.getElementById("wrapper") as HTMLDivElement;
  wrapper.style.width = `${CANVAS_WIDTH}px`;
  const instructions = document.getElementById(
    "instructions"
  ) as HTMLDivElement;
  const feedback = document.getElementById("feedback") as HTMLDivElement;

  const canvas = document.getElementById("interactive") as HTMLCanvasElement;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  setUpPart1(instructions, feedback, canvas, ctx);
}

main();
