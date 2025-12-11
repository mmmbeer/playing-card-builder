// pips.js
import { settings } from "./state.js";

/* ============================================================================
 * PUBLIC API
 * ========================================================================== */
export function getPipLayout(rank) {
  const n = parseInt(rank, 10);

  // Standard cards A–10
  if (isNaN(n) || n <= 10) return getStandardLayout(rank);

  // Extended 3-column (10–15)
  if (n >= 10 && n <= 15) return generate3col(n);

  // Extended 4-column (16–20)
  if (n >= 16 && n <= 20) return generateNcol(n, 4);

  // Extended 5-column (21–25)
  if (n >= 21 && n <= 25) return generateNcol(n, 5);

  // Fallback: keep using 5 columns beyond 25 unless larger sets defined
  return generateNcol(n, 5);
}

/* ============================================================================
 * STANDARD (A–10) — UNCHANGED FROM ORIGINAL
 * ========================================================================== */

function getStandardLayout(rank) {
  const L = settings.pipLeft;
  const C = settings.pipCenterX;
  const R = settings.pipRight;

  const T  = settings.pipTop;
  const IT = settings.pipInnerTop;
  const CN = settings.pipCenter;
  const IB = settings.pipInnerBottom;
  const B  = settings.pipBottom;

  const up = false;
  const dn = true;

  switch (rank) {
    case "A":
    case "1":
      return [{ x: C, y: CN, rotate180: up }];

    case "2":
      return [
        { x: C, y: T, rotate180: up },
        { x: C, y: B, rotate180: dn }
      ];

    case "3":
      return [
        { x: C, y: T, rotate180: up },
        { x: C, y: CN, rotate180: up },
        { x: C, y: B, rotate180: dn }
      ];

    case "4":
      return [
        { x: L, y: T, rotate180: up },
        { x: R, y: T, rotate180: up },
        { x: L, y: B, rotate180: dn },
        { x: R, y: B, rotate180: dn }
      ];

    case "5":
      return [
        { x: L, y: T, rotate180: up },
        { x: R, y: T, rotate180: up },
        { x: C, y: CN, rotate180: up },
        { x: L, y: B, rotate180: dn },
        { x: R, y: B, rotate180: dn }
      ];

    case "6":
      return [
        { x: L, y: T, rotate180: up },
        { x: R, y: T, rotate180: up },
        { x: L, y: CN, rotate180: up },
        { x: R, y: CN, rotate180: up },
        { x: L, y: B, rotate180: dn },
        { x: R, y: B, rotate180: dn }
      ];

    case "7":
      return [
        { x: C, y: IT, rotate180: up },
        { x: L, y: T, rotate180: up },
        { x: R, y: T, rotate180: up },
        { x: L, y: CN, rotate180: up },
        { x: R, y: CN, rotate180: up },
        { x: L, y: B, rotate180: dn },
        { x: R, y: B, rotate180: dn }
      ];

    case "8":
      return [
        { x: L, y: IT, rotate180: up },
        { x: R, y: IT, rotate180: up },
        { x: L, y: T, rotate180: up },
        { x: R, y: T, rotate180: up },
        { x: L, y: IB, rotate180: dn },
        { x: R, y: IB, rotate180: dn },
        { x: L, y: B, rotate180: dn },
        { x: R, y: B, rotate180: dn }
      ];

    case "9":
      return [
        { x: C, y: CN, rotate180: up },
        { x: L, y: IT, rotate180: up },
        { x: R, y: IT, rotate180: up },
        { x: L, y: T, rotate180: up },
        { x: R, y: T, rotate180: up },
        { x: L, y: IB, rotate180: dn },
        { x: R, y: IB, rotate180: dn },
        { x: L, y: B, rotate180: dn },
        { x: R, y: B, rotate180: dn }
      ];

    case "10":
      return [
        { x: C, y: IT, rotate180: up },
        { x: C, y: IB, rotate180: dn },

        { x: L, y: IT, rotate180: up },
        { x: R, y: IT, rotate180: up },
        { x: L, y: T, rotate180: up },
        { x: R, y: T, rotate180: up },

        { x: L, y: IB, rotate180: dn },
        { x: R, y: IB, rotate180: dn },
        { x: L, y: B, rotate180: dn },
        { x: R, y: B, rotate180: dn }
      ];
  }
  return [];
}

/* ============================================================================
 * EXTENDED 3-COLUMN SYSTEM (RANKS 10–15)
 * ========================================================================== */

function generate3col(n) {
  const rowsY = getBaseRowsY();
  const colsX = getColumns(3);

  const patterns = {
    10: [2,3,0,3,2],
    11: [3,3,0,3,2],
    12: [3,3,0,3,3],
    13: [3,3,1,3,3],
    14: [3,3,2,3,3],
    15: [3,3,3,3,3]
  };

  return placeCounts(patterns[n], rowsY, colsX);
}

/* ============================================================================
 * GENERALIZED N-COLUMN MODE (4-COL, 5-COL, ETC.)
 * ========================================================================== */

function generateNcol(rank, ncols) {
  const rowsY = getBaseRowsY();
  const colsX = getColumns(ncols);

  let centerCount = 0;

  if (ncols === 4) {
    const seq = [0,1,2,3,4];
    centerCount = seq[rank - 16];
  }

  if (ncols === 5) {
    const seq = [1,2,3,4,5];
    centerCount = seq[rank - 21];
  }

  const full = ncols;

  const rowCounts = [
    full,      // Row 0
    full,      // Row 1
    centerCount, // CENTER ROW
    full,      // Row 3
    full       // Row 4
  ];

  return placeCounts(rowCounts, rowsY, colsX);
}

/* ============================================================================
 * SHARED HELPERS
 * ========================================================================== */

function getBaseRowsY() {
  return [
    settings.pipTop,
    settings.pipInnerTop,
    settings.pipCenter,
    settings.pipInnerBottom,
    settings.pipBottom
  ];
}

function getColumns(ncols) {
  const L = settings.pipLeft;
  const C = settings.pipCenterX;
  const R = settings.pipRight;

  if (ncols === 3) return [L, C, R];
  if (ncols === 4) return [L, (L+C)/2, (C+R)/2, R];
  if (ncols === 5) return [L, (L+C)/2, C, (C+R)/2, R];

  // Future expansion: evenly spaced grid when >5 columns
  const cols = [];
  for (let i = 0; i < ncols; i++) {
    cols.push(L + ((R - L) * i) / (ncols - 1));
  }
  return cols;
}

function placeCounts(rowCounts, rowsY, colsX) {
  const out = [];

  for (let r = 0; r < rowCounts.length; r++) {
    const count = rowCounts[r];
    if (count === 0) continue;

    const ncols = colsX.length;
    const y = rowsY[r];

    let colIndices = [];
    if (count === ncols) {
      colIndices = [...Array(ncols).keys()];
    } else {
      const start = Math.floor((ncols - count) / 2);
      for (let i = 0; i < count; i++) colIndices.push(start + i);
    }

    for (const c of colIndices) {
      out.push({
        x: colsX[c],
        y,
        rotate180: y > settings.pipCenter
      });
    }
  }

  return out;
}
