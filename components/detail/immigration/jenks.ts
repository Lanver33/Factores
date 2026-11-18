// Jenks Natural Breaks Algorithm Implementation in TypeScript
export function getJenksBreaks(data: number[], numClasses: number): number[] {
  if (!data || data.length === 0) return [];
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  if (numClasses >= n) {
    return [...new Set(sorted)];
  }

  const mat1 = Array(n + 1).fill(0).map(() => Array(numClasses + 1).fill(0));
  const mat2 = Array(n + 1).fill(0).map(() => Array(numClasses + 1).fill(0));

  for (let i = 1; i <= numClasses; i++) {
    mat1[1][i] = 1;
    mat2[1][i] = 0;
    for (let j = 2; j <= n; j++) {
      mat2[j][i] = Infinity;
    }
  }

  let variance = 0;
  for (let l = 2; l <= n; l++) {
    let sum = 0;
    let sumSquares = 0;
    let w = 0;
    for (let m = 1; m <= l; m++) {
      const val = sorted[l - m];
      w++;
      sum += val;
      sumSquares += val * val;
      variance = sumSquares - (sum * sum) / w;
      const i4 = l - m;
      if (i4 !== 0) {
        for (let j = 2; j <= numClasses; j++) {
          if (mat2[l][j] >= (variance + mat2[i4][j - 1])) {
            mat1[l][j] = i4;
            mat2[l][j] = variance + mat2[i4][j - 1];
          }
        }
      }
    }
    mat1[l][1] = 1;
    mat2[l][1] = variance;
  }

  let k = n;
  const kclass = Array(numClasses + 1).fill(0);
  kclass[numClasses] = sorted[n - 1];
  kclass[0] = sorted[0];

  let countNum = numClasses;
  while (countNum >= 2) {
    const idx = Math.round(mat1[k][countNum]);
    kclass[countNum - 1] = sorted[idx - 1];
    k = idx;
    countNum--;
  }

  // Extract unique threshold cut points
  const breaks = [];
  for (let i = 1; i < kclass.length; i++) {
    breaks.push(kclass[i]);
  }
  return Array.from(new Set(breaks)).sort((a, b) => a - b);
}
