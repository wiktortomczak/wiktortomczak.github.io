
export default class Random {

  static choice(arr) {
    // stackoverflow.com/questions/4550505/getting-a-random-value-from-a-javascript-array
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // stackoverflow.com/a/2450976
  static shuffle(arr) {
    for (let i = arr.length; i != 0; ) {
      // Pick a remaining element.
      const randomIndex = Math.floor(Math.random() * i);
      --i;

      // And swap it with the current element.
      let tmp = arr[i];
      arr[i] = arr[randomIndex];
      arr[randomIndex] = tmp;
    }
    return arr;
  }
}
