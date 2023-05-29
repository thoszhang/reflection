export type Coords = { i: number; j: number };

type Vector = { di: number; dj: number };

export function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(min, x), max);
}

function diff({ di: vi, dj: vj }: Vector, { di: ui, dj: uj }: Vector): Vector {
  return { di: vi - ui, dj: vj - uj };
}

function diffPts({ i: pi, j: pj }: Coords, { i: qi, j: qj }: Coords): Vector {
  return { di: pi - qi, dj: pj - qj };
}

function scalarProduct(c: number, { di: vi, dj: vj }: Vector): Vector {
  return { di: c * vi, dj: c * vj };
}

function innerProduct(
  { di: vi, dj: vj }: Vector,
  { di: ui, dj: uj }: Vector
): number {
  return vi * ui + vj * uj;
}

function translate(
  { i: pi, j: pj }: Coords,
  { di: ui, dj: uj }: Vector
): Coords {
  return { i: pi + ui, j: pj + uj };
}

export function reflectOverLine(
  pos: Coords,
  lineStart: Coords,
  lineEnd: Coords
): Coords {
  const lineVec = diffPts(lineEnd, lineStart);
  const ptVec = diffPts(pos, lineStart);
  // 2 * the projection of ptVec onto lineVec
  const projection2 = scalarProduct(
    2 * (innerProduct(lineVec, ptVec) / innerProduct(lineVec, lineVec)),
    lineVec
  );
  const reflPtVec = diff(projection2, ptVec);
  const reflPt = translate(lineStart, reflPtVec);
  return reflPt;
}

function det(a: number, b: number, c: number, d: number): number {
  return a * d - b * c;
}

export function lineLineIntersection(
  { i: s1i, j: s1j }: Coords,
  { i: e1i, j: e1j }: Coords,
  { i: s2i, j: s2j }: Coords,
  { i: e2i, j: e2j }: Coords
): Coords {
  // https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Given_two_points_on_each_line
  const det1 = det(s1i, s1j, e1i, e1j);
  const det2 = det(s2i, s2j, e2i, e2j);
  const det1i = det(s1i, 1, e1i, 1);
  const det2i = det(s2i, 1, e2i, 1);
  const det1j = det(s1j, 1, e1j, 1);
  const det2j = det(s2j, 1, e2j, 1);

  const denom = det(det1i, det1j, det2i, det2j);

  return {
    i: det(det1, det1i, det2, det2i) / denom,
    j: det(det1, det1j, det2, det2j) / denom,
  };
}
