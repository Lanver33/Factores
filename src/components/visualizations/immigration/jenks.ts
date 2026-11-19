export interface ChoroplethClass {
  classIndex: number;
  min: number;
  max: number;
  color: string;
}

export interface ChoroplethClassification {
  classes: ChoroplethClass[];
  minVal: number;
  maxVal: number;
  getClass(value: number): ChoroplethClass | null;
  getColor(value: number, fallbackColor?: string): string;
}

/**
 * Jenks natural breaks algorithm returning cut points.
 */
function getJenksCutPoints(sortedData: number[], numClasses: number): number[] {
  const n = sortedData.length;
  if (n === 0) return [];
  if (numClasses >= n) {
    return Array.from(new Set(sortedData));
  }

  const mat1: number[][] = Array(n + 1)
    .fill(0)
    .map(() => Array(numClasses + 1).fill(0));
  const mat2: number[][] = Array(n + 1)
    .fill(0)
    .map(() => Array(numClasses + 1).fill(0));

  for (let i = 1; i <= numClasses; i++) {
    mat1[1][i] = 1;
    mat2[1][i] = 0;
    for (let j = 2; j <= n; j++) {
      mat2[j][i] = Infinity;
    }
  }

  for (let l = 2; l <= n; l++) {
    let sum = 0;
    let sumSquares = 0;
    let w = 0;
    for (let m = 1; m <= l; m++) {
      const val = sortedData[l - m];
      w++;
      sum += val;
      sumSquares += val * val;
      const variance = sumSquares - (sum * sum) / w;
      const i4 = l - m;
      if (i4 !== 0) {
        for (let j = 2; j <= numClasses; j++) {
          if (mat2[l][j] >= variance + mat2[i4][j - 1]) {
            mat1[l][j] = i4;
            mat2[l][j] = variance + mat2[i4][j - 1];
          }
        }
      }
    }
    mat1[l][1] = 1;
    mat2[l][1] = sumSquares - (sum * sum) / w;
  }

  let k = n;
  const kclass: number[] = Array(numClasses + 1).fill(0);
  kclass[numClasses] = sortedData[n - 1];
  kclass[0] = sortedData[0];

  let countNum = numClasses;
  while (countNum >= 2) {
    const idx = Math.round(mat1[k][countNum]);
    kclass[countNum - 1] = sortedData[idx - 1];
    k = idx;
    countNum--;
  }

  const cutPoints: number[] = [];
  for (let i = 1; i < kclass.length; i++) {
    cutPoints.push(kclass[i]);
  }

  return Array.from(new Set(cutPoints)).sort((a, b) => a - b);
}

/**
 * Pure, hardened choropleth classifier with graceful degradation.
 */
export function classifyChoropleth(
  values: number[],
  palette: readonly string[]
): ChoroplethClassification {
  if (!palette || palette.length === 0) {
    throw new Error("Palette must contain at least one color");
  }

  const positive = values
    .filter((v) => typeof v === "number" && Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b);

  if (positive.length === 0) {
    return {
      classes: [],
      minVal: 0,
      maxVal: 0,
      getClass: () => null,
      getColor: (_val, fallbackColor = "#1e293b") => fallbackColor,
    };
  }

  const minVal = positive[0];
  const maxVal = positive[positive.length - 1];
  const uniqueValues = Array.from(new Set(positive));

  // Case: Only 1 unique value
  if (uniqueValues.length === 1) {
    const singleClass: ChoroplethClass = {
      classIndex: 0,
      min: minVal,
      max: maxVal,
      color: palette[0],
    };
    return {
      classes: [singleClass],
      minVal,
      maxVal,
      getClass: (val) => (val > 0 ? singleClass : null),
      getColor: (val, fallback = "#1e293b") => (val > 0 ? palette[0] : fallback),
    };
  }

  // Gracefully degrade target classes count
  const targetClassesCount = Math.min(palette.length, uniqueValues.length);
  const cutPoints = getJenksCutPoints(positive, targetClassesCount);

  // Build contiguous classes
  const classes: ChoroplethClass[] = [];
  let prevUpper = minVal;

  for (let i = 0; i < cutPoints.length; i++) {
    const upper = cutPoints[i];
    classes.push({
      classIndex: i,
      min: prevUpper,
      max: upper,
      color: palette[i] ?? palette[palette.length - 1],
    });
    prevUpper = upper;
  }

  const getClass = (value: number): ChoroplethClass | null => {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      return null;
    }
    for (const c of classes) {
      if (value <= c.max) {
        return c;
      }
    }
    return classes[classes.length - 1] ?? null;
  };

  const getColor = (value: number, fallbackColor = "#1e293b"): string => {
    const matched = getClass(value);
    return matched ? matched.color : fallbackColor;
  };

  return {
    classes,
    minVal,
    maxVal,
    getClass,
    getColor,
  };
}
