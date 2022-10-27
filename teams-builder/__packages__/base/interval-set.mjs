
export default class IntervalSet {

  constructor(intervals=undefined) {
    this._intervals = [];
    if (intervals) {
      for (const [start, stop] of intervals) {
        this.add(start, stop);
      }
    }
  }

  add(start, stop) {
    this._intervals.push([start, stop]);
  }

  find(x) {
    for (const interval of this._intervals) {
      const [start, stop] = interval;
      if (start <= x && x < stop) {
        return interval;
      }
    }
  }
}
