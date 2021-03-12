
export default function range(start, stop) {
  const arr = new Array(stop - start);
  for (let i = start; i < stop; ++i) {
    arr[i] = i;
  }
  return arr;
}
