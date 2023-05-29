import { Coords, clamp } from "./utils";

const PI2 = Math.PI * 2;
const GRID_SIZE = 40;
const GRID_OFFSET = 40;
export const WIDTH = 16;
export const HEIGHT = 12;
export const CANVAS_WIDTH = WIDTH * GRID_SIZE + 2 * GRID_OFFSET;
export const CANVAS_HEIGHT = HEIGHT * GRID_SIZE + 2 * GRID_OFFSET;

type CanvasCoords = { x: number; y: number };

export type DraggableState = {
  readonly bounds: {
    readonly mini: number;
    readonly maxi: number;
    readonly minj: number;
    readonly maxj: number;
  };
  position: Coords;
  draggingOffset: null | { dx: number; dy: number };
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

export function drawGrid(ctx: CanvasRenderingContext2D) {
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

export function drawEye(ctx: CanvasRenderingContext2D, coords: Coords) {
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

export function drawObject(
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

export function drawMirror(
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

export function drawRay(
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

export function drawIntersectionPoint(
  ctx: CanvasRenderingContext2D,
  coords: Coords
) {
  const { x: x, y: y } = toCanvasCoords(coords);

  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, PI2);
  ctx.fill();
}

export function drawArcs(
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

export function handleMouseUp(state: { [key: string]: DraggableState }) {
  for (const key in state) {
    state[key].draggingOffset = null;
  }
}

export function handleMouseDown(
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

export function handleMouseMove(
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
