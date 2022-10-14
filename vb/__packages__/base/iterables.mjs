
import assert from 'https://wiktortomczak.github.io/vb/__packages__/base/assert.mjs';
import Arrays from 'https://wiktortomczak.github.io/vb/__packages__/base/arrays.mjs';
import Event from 'https://wiktortomczak.github.io/vb/__packages__/base/event.mjs';
import Types from 'https://wiktortomczak.github.io/vb/__packages__/base/types.mjs';

// jakearchibald.com/2017/async-iterators-and-generators/
// developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of


export class BaseIterables {

  static forEach(iterable, func) {
    return this._getSubclass(iterable).forEach(iterable, func);
  }

  static map(iterable, func) {
    return this._getSubclass(iterable).map(iterable, func);
  }

  static mapToArray(iterable, func) {
    return this._getSubclass(iterable).mapToArray(iterable, func);
  }

  static transform(iterable, func) {
    return this._getSubclass(iterable).transform(iterable, func);
  }

  static slice(iterable, start, end) {
    return this._getSubclass(iterable).slice(iterable, start, end);
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

  static _getSubclass(iterable) {
    if (Iterables.isIterable(iterable)) {
      return Iterables;
    } else if (AsyncIterables.isAsyncIterable(iterable)) {
      return AsyncIterables;
    } else {
      throw Error(iterable);
    }
  }
}

BaseIterables.SinkBase = class SinkBase {

  constructor() {
    this._values = [];
    this._ended = false;
    this._error = null;
    this._numValuesToError = null;
    this._cancelCallbacks = [];
  }

  next(allowNotEnded) {
    if (this._numValuesToError != null) {
      if (this._numValuesToError-- == 0) {
        throw this._error;
      }
    }
    if (this._values.length) {
      return {value: this._values.shift(), done: false};
    } else if (this._ended) {
      return {done: true};
    } else {
      if (!allowNotEnded) {
        throw Error('not ended');
      }
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
      this._ended = 'throw';
    } else {
      throw Error('already ended');
    }
  }

  end() {
    if (!this._ended) {
      this._ended = 'end';
    } else {
      throw Error('already ended');
    }
  }

  cancel(error) {
    if (this._ended != 'cancel') {
      this._error = error || new Error('canceled');
      this._numValuesToError = 0;
      this._ended = 'cancel';
      this._cancelCallbacks.forEach(callback => callback(error));
    }
  }

  onCancel(callback) {
    this._cancelCallbacks.push(callback);
  }
};

export default class Iterables {

  static forEach(iterable, func) {
    if (Types.isFunction(iterable['forEach'])) {
      iterable.forEach(func);
    } else {
      for (const x of iterable) {
        func(x);
      }
    }
  }

  static filter(iterable, func) {
    if (Types.isFunction(iterable.filter)) {
      return iterable.filter(func);
    } else {
      return this.filterGenerator(iterable, func);
    }
  }

  static map(iterable, func) {
    if (Types.isFunction(iterable.map)) {
      return iterable.map(func);
    } else {
      return this.mapGenerator(iterable, func);
    }
  }

  static *filterGenerator(iterable, func) {
    for (const x of iterable) {
      if (func(x)) {
        yield x;
      }
    }
  }

  static mapToArray(iterable, func) {
    const mapped = [];
    for (const x of iterable) {
      mapped.push(func(x));
    }
    return mapped;
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
  
  static sortedByKey(iterable, keyFunc) {
    const sorted = [...iterable];
    Arrays.sortByKey(sorted, keyFunc);
    return sorted;
  }

  static isIterable(iterable) {
    return Types.isFunction(iterable[this.ITERATOR_PROPERTY]);
  }
}

Iterables.ITERATOR_PROPERTY =
  ((typeof Symbol != 'undefined') && Symbol.iterator)
  || '@@iterator';

Iterables.Sink = class Sink extends BaseIterables.SinkBase {  
  [Iterables.ITERATOR_PROPERTY]() {
    return this;
  }
};

Iterables.toArray = BaseIterables.toArray;


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
    return Types.isFunction(iterable[this.ASYNC_ITERATOR_PROPERTY]);
  }
}

AsyncIterables.ASYNC_ITERATOR_PROPERTY =
  ((typeof Symbol != 'undefined') && Symbol.asyncIterator)
  || '@@asyncIterator';

AsyncIterables.Sink = class Sink extends BaseIterables.SinkBase {
  [AsyncIterables.ASYNC_ITERATOR_PROPERTY]() {
    return this;
  }

  async next() {
    for (;;) {
      // If next() throws, the exception is wrapped in a rejected Promise.
      const valueDone = super.next(true /* allowNotEnded */);
      if (Types.isDefined(valueDone)) {
        return valueDone;  // Wrapped in a resolved promise.
      }
      await (this._hasNext = new Event());
      delete this._hasNext;
    }
  }

  put(value) {
    super.put(value);
    if (this._hasNext) {
      this._hasNext.set();
    }
  }

  throw(error) {
    super.throw(error);
    if (this._hasNext) {
      this._hasNext.set();
    }
  }
  
  end() {
    super.end();
    if (this._hasNext) {
      this._hasNext.set();
    }
  }
  
  cancel() {
    super.cancel();
    if (this._hasNext) {
      this._hasNext.set();
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

AsyncIterables.toArray = BaseIterables.toArray;


class AsyncGenerators {

  static async *map(asyncGen, func) {
    try {
      for await (const x of asyncGen) {
        yield func(x);
      }
    } catch (e) {
      if (e instanceof CanceledError) {
        asyncGen.throw(e);
      } else {
        throw e;
      }
    }
  }
}


class CanceledError extends Error {}
