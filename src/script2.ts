import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  HEIGHT,
  drawEye,
  drawGrid,
  drawMirror,
  drawRay,
  drawObject,
  DraggableState,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
} from "./shared";
import { reflectOverLine, lineLineIntersection } from "./utils";

type Part4State = {
  eye: DraggableState;
  object: DraggableState;
};

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

function setUpPart4(
  instructions: HTMLDivElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  const p = document.createElement("p");
  p.innerHTML =
    "Multiple reflections are possible with multiple mirrors. Experiment with dragging the eye and the object to see how the light ray and virtual image are affected.";
  instructions.replaceChildren(p);

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

  const canvas = document.getElementById("interactive") as HTMLCanvasElement;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  setUpPart4(instructions, canvas, ctx);
}

main();
