
import Arrays from 'base/arrays.mjs';


export function mean(arr) {
  let sum = 0;
  for (const e of arr) {
    sum += e;
  }
  return sum / arr.length;
}


export function range(arr) {
  const [min, max] = Arrays.minmax(arr);
  return max - min;
}


export function variance(arr) {
  const xMean = mean(arr);
  return mean(arr.map(x => Math.pow(x - xMean, 2)));
}
