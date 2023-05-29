import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  HEIGHT,
  WIDTH,
  drawEye,
  drawGrid,
  drawMirror,
  drawRay,
  drawObject,
  drawArcs,
  drawIntersectionPoint,
  DraggableState,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
} from "./shared";
import { Coords, reflectOverLine, lineLineIntersection } from "./utils";

const INITIAL_EYE_POSITION: Coords = { i: 10, j: 3 } as const;
const INITIAL_OBJECT_POSITION: Coords = { i: 2, j: 1 } as const;
const INITIAL_POINT_POSITION: Coords = { i: 7, j: HEIGHT / 2 } as const;

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

  feedback.replaceChildren();

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

  computeAndDrawPart3(ctx, part3State);
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
