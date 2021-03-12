
import assert from '/zuzia/v0.1/__packages__/base/assert.mjs';
import Functions from '/zuzia/v0.1/__packages__/base/functions.mjs';

// jakearchibald.com/2017/async-iterators-and-generators/
// developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of


export default class Iterables {

  static forEach(iterable, func) {
    return this._getIterablesClass(iterable).forEach(iterable, func);
  }

  static map(iterable, func) {
    return this._getIterablesClass(iterable).map(iterable, func);
  }

  static transform(iterable, func) {
    return this._getIterablesClass(iterable).transform(iterable, func);
  }

  static slice(iterable, start, end) {
    return this._getIterablesClass(iterable).slice(iterable, start, end);
  }

  static toArray(iterable) {
    const arr = [];
    this.forEach(iterable, x => arr.push(x));
    return arr;
  }

  static *fromValueFunc(func) {
    for (let value; (value = func()) !== undefined; ) {
      yield value;
    }
  }

  static _getIterablesClass(iterable) {
    if (SyncIterables.isSyncIterable(iterable)) {
      return SyncIterables;
    }
    if (AsyncIterables.isAsyncIterable(iterable)) {
      return AsyncIterables;
    }
    throw Error(iterable);
  }
}

Iterables.SinkBase = class SinkBase {

  constructor() {
    this._values = [];
    this._ended = false;
    this._error = null;
    this._numValuesToError = null;
  }

  next() {
    if (this._numValuesToError != null) {
      if (this._numValuesToError-- == 0) {
        throw this._error;
      }
    }
    if (this._values.length) {
      return {value: this._values.shift(), done: false};
    } else {
      return {done: true};
    }
  }

  put(value) {
    if (!this._ended) {
      this._values.push(value);
    } else {
      throw Error('already ended');
    }
  }

  throw(error) {
    if (!this._ended) {
      this._error = error;
      this._numValuesToError = this._values.length;
      this._ended = true;
    } else {
      throw Error('already ended');
    }
  }

  end() {
    if (!this._ended) {
      this._ended = true;
    } else {
      throw Error('already ended');
    }
  }
};

export class SyncIterables {

  static forEach(iterable, func) {
    if (Functions.isFunction(iterable['forEach'])) {
      iterable.forEach(func);
    } else {
      for (const x of iterable) {
        func(x);
      }
    }
  }

  static map(iterable, func) {
    if (Functions.isFunction(iterable['map'])) {
      return iterable.map(func);
    } else {
      return this.mapGenerator(iterable, func);
    }
  }

  static *mapGenerator(iterable, func) {
    for (const x of iterable) {
      yield func(x);
    }
  }

  static transform(iterable, func) {
    const sink = new this.Sink();
    this.forEach(iterable, elem => func(elem, sink));
    sink.end();
    return sink;
  }

  static *slice(iterable, start, end) {
    let i = 0;
    while (i < start) {
      const valueDone = iterable.next();
      if (valueDone.done)
        return;
      ++i;
    }
    while (i++ < end) {
      const valueDone = iterable.next();
      if (!valueDone.done) {
        yield valueDone.value;
      } else {
        return;
      }
    }
  }

  static isSyncIterable(iterable) {
    return Functions.isFunction(iterable[this.ITERATOR_PROPERTY]);
  }
}

SyncIterables.ITERATOR_PROPERTY =
  ((typeof Symbol != 'undefined') && Symbol.iterator)
  || '@@iterator';

SyncIterables.Sink = class Sink extends Iterables.SinkBase {  
  [SyncIterables.ITERATOR_PROPERTY]() {
    return this;
  }
};

SyncIterables.toArray = Iterables.toArray;


export class AsyncIterables {

  static async forEach(iterable, func) {
    let i = 0;
    for await (const x of iterable) {
      func(x, i++);
    }
  }
  
  static async *map(iterable, func) {
    let i = 0;
    for await (const x of iterable) {
      yield func(x, i++);
    }
  }

  static transform(iterable, func) {
    const sink = new this.Sink();
    // TODO: Stop iteration after sink.end() ?
    this.forEach(iterable, elem => func(elem, sink)).then(() => sink.end());
    return sink;
  }

  static isAsyncIterable(iterable) {
    return Functions.isFunction(iterable[this.ASYNC_ITERATOR_PROPERTY]);
  }
}

AsyncIterables.ASYNC_ITERATOR_PROPERTY =
  ((typeof Symbol != 'undefined') && Symbol.asyncIterator)
  || '@@asyncIterator';

AsyncIterables.Sink = class Sink extends Iterables.SinkBase {
  [AsyncIterables.ASYNC_ITERATOR_PROPERTY]() {
    return this;
  }

  async next() {
    const hasNext = (
      this._values.length
        || this._numValuesToError != null
        || this._ended);
    if (!hasNext) {
      this._hasNext = new Promise(resolve => this._resolveHasNext = resolve);
      await this._hasNext;
      this._hasNext = this._resolveHasNext = null;
    }

    return super.next();
  }

  put(value) {
    super.put(value);
    if (this._resolveHasNext) {
      this._resolveHasNext();
    }
  }

  throw(error) {
    super.throw(error);
    if (this._resolveHasNext) {
      this._resolveHasNext();
    }
  }
  
  end() {
    super.end();
    if (this._resolveHasNext) {
      this._resolveHasNext();
    }
  }

  static fromAsyncIterablePromise(asyncIterablePromise, cancel) {
    const sink = new this();
    asyncIterablePromise.then(async function(asyncIterable) {
      try {
        for await (const elem of asyncIterable) {
          sink.put(elem);
        }
        sink.end();
      } catch (error) {
        sink.throw(error);
      }
    });
    return sink;
  }
};

AsyncIterables.toArray = Iterables.toArray;
