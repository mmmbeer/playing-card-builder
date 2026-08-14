export type PipAnchors = {
  pipLeft: number;
  pipCenterX: number;
  pipRight: number;
  pipTop: number;
  pipInnerTop: number;
  pipCenter: number;
  pipInnerBottom: number;
  pipBottom: number;
};

export type PipPosition = [x: number, y: number, rotate180?: boolean];

export function getPipLayout(rank: string, anchors: PipAnchors): PipPosition[] {
  const numericRank = Number.parseInt(rank, 10);
  if (!Number.isFinite(numericRank) || numericRank <= 10) return getStandardLayout(rank, anchors);
  if (numericRank <= 15) return generateThreeColumn(numericRank, anchors);
  if (numericRank <= 20) return generateFixedGrid(numericRank, 4, numericRank - 16, anchors);
  if (numericRank <= 25) return generateFixedGrid(numericRank, 5, numericRank - 20, anchors);
  return generateAdaptiveGrid(numericRank, anchors);
}

function getStandardLayout(rank: string, a: PipAnchors): PipPosition[] {
  const L = a.pipLeft, C = a.pipCenterX, R = a.pipRight;
  const T = a.pipTop, IT = a.pipInnerTop, M = a.pipCenter, IB = a.pipInnerBottom, B = a.pipBottom;
  const layouts: Record<string, PipPosition[]> = {
    A: [[C, M]],
    "1": [[C, M]],
    "2": [[C, T], [C, B, true]],
    "3": [[C, T], [C, M], [C, B, true]],
    "4": [[L, T], [R, T], [L, B, true], [R, B, true]],
    "5": [[L, T], [R, T], [C, M], [L, B, true], [R, B, true]],
    "6": [[L, T], [R, T], [L, M], [R, M], [L, B, true], [R, B, true]],
    "7": [[C, IT], [L, T], [R, T], [L, M], [R, M], [L, B, true], [R, B, true]],
    "8": [[L, IT], [R, IT], [L, T], [R, T], [L, IB, true], [R, IB, true], [L, B, true], [R, B, true]],
    "9": [[C, M], [L, IT], [R, IT], [L, T], [R, T], [L, IB, true], [R, IB, true], [L, B, true], [R, B, true]],
    "10": [[C, IT], [C, IB, true], [L, IT], [R, IT], [L, T], [R, T], [L, IB, true], [R, IB, true], [L, B, true], [R, B, true]],
  };
  return layouts[rank] || [];
}

function generateThreeColumn(rank: number, anchors: PipAnchors) {
  const patterns: Record<number, number[]> = {
    11: [3, 3, 0, 3, 2],
    12: [3, 3, 0, 3, 3],
    13: [3, 3, 1, 3, 3],
    14: [3, 3, 2, 3, 3],
    15: [3, 3, 3, 3, 3],
  };
  return placeCounts(patterns[rank], getBaseRows(anchors), getColumns(3, anchors), anchors.pipCenter);
}

function generateFixedGrid(rank: number, columns: number, centerCount: number, anchors: PipAnchors) {
  return placeCounts(
    [columns, columns, centerCount, columns, columns],
    getBaseRows(anchors),
    getColumns(columns, anchors),
    anchors.pipCenter,
  );
}

function generateAdaptiveGrid(rank: number, anchors: PipAnchors) {
  const count = Math.max(1, Math.min(99, rank));
  const columnCount = Math.max(5, Math.min(9, Math.ceil(Math.sqrt(count))));
  const rowCount = Math.ceil(count / columnCount);
  const base = Math.floor(count / rowCount);
  const remainder = count % rowCount;
  const priority = Array.from({ length: rowCount }, (__, position) => position)
    .sort((left, right) => Math.abs(left - (rowCount - 1) / 2) - Math.abs(right - (rowCount - 1) / 2));
  const expandedRows = new Set(priority.slice(0, remainder));
  const rowCounts = Array.from({ length: rowCount }, (_, index) => base + (expandedRows.has(index) ? 1 : 0));
  const rows = evenlySpaced(anchors.pipTop, anchors.pipBottom, rowCount);
  const columns = getColumns(columnCount, anchors);
  return placeCounts(rowCounts, rows, columns, anchors.pipCenter);
}

function getBaseRows(a: PipAnchors) {
  return [a.pipTop, a.pipInnerTop, a.pipCenter, a.pipInnerBottom, a.pipBottom];
}

function getColumns(count: number, a: PipAnchors) {
  if (count === 3) return [a.pipLeft, a.pipCenterX, a.pipRight];
  if (count === 4) return [a.pipLeft, (a.pipLeft + a.pipCenterX) / 2, (a.pipCenterX + a.pipRight) / 2, a.pipRight];
  if (count === 5) return [a.pipLeft, (a.pipLeft + a.pipCenterX) / 2, a.pipCenterX, (a.pipCenterX + a.pipRight) / 2, a.pipRight];
  return evenlySpaced(a.pipLeft, a.pipRight, count);
}

function evenlySpaced(start: number, end: number, count: number) {
  if (count <= 1) return [(start + end) / 2];
  return Array.from({ length: count }, (_, index) => start + ((end - start) * index) / (count - 1));
}

function placeCounts(rowCounts: number[], rows: number[], columns: number[], center: number): PipPosition[] {
  const positions: PipPosition[] = [];
  for (let row = 0; row < rowCounts.length; row += 1) {
    const count = rowCounts[row] || 0;
    if (!count) continue;
    const firstColumn = Math.floor((columns.length - count) / 2);
    for (let offset = 0; offset < count; offset += 1) {
      const x = columns[firstColumn + offset];
      if (typeof x === "number") positions.push([x, rows[row], rows[row] > center || undefined]);
    }
  }
  return positions;
}
