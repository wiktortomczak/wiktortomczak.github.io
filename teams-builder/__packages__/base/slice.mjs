
export default class Slice {

  constructor(start, stop) {
    this.start = start;
    this.stop = stop;
  }

  *[Symbol.iterator]() {
    yield this.start;
    yield this.stop;
  }

  contains(i) {
    return this.start <= i && i < this.stop;
  }

  toString() {
    return `[${this.start}:${this.stop}]`;
  }
}
