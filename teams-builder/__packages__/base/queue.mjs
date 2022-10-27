
import Arrays from 'base/arrays.mjs';
import assert from 'base/assert.mjs';
import Condition from 'base/condition.mjs';


export class AsyncQueue {

  static List() {
    return new this(new ListQueue());
  }

  constructor(queue) {
    this._queue = queue;
    this._isEnded = false;
    this._dataOrEnded = new Condition();
  }

  get isEmpty() { return this._queue.isEmpty; }

  async pop() {
    if (this._queue.isEmpty && !this._isEnded) {
      await this._dataOrEnded.wait();
    }
    this._throwIfEnded();
    return this._queue.pop();
  }

  push(data) {
    this._throwIfEnded();
    this._queue.push(data);
    this._dataOrEnded.notify();
  }

  end() {
    this._throwIfEnded();
    this._isEnded = true;
    this._dataOrEnded.notify();
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  async next() {
    if (this._queue.isEmpty && !this._isEnded) {
      await this._dataOrEnded.wait();
    }
    if (!this._isEnded) {
      return {value: this._queue.pop()};
    } else {
      return {done: true};
    }
  }

  _throwIfEnded() {
    if (this._isEnded) {
      throw Error('ended');
    }
  }
}


class ListQueue {

  constructor() {
    this._data = [];
  }

  get isEmpty() { return !this._data.length; }
  pop() { return Arrays.pop(this._data, 0); }
  push(data) { this._data.push(data); }
}
