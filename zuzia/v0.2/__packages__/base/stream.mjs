
import assert from '/zuzia/v0.2/__packages__/base/assert.mjs';
import Arrays from '/zuzia/v0.2/__packages__/base/arrays.mjs';


export default class Stream {

  // writer
  // static fromAsyncIterable(asyncIterable) {
  //   const stream = new this(() => asyncIterableForEach.cancel());
  //   const asyncIterableForEach = AsyncIterables.forEach(
  //     asyncIterable, data => stream.put(data));
  //   asyncIterableForEach.then(() => stream.end());
  //   return stream;
  // }

  static fromAsyncIterable(asyncIterable, cancel) {
    return new this((put, end, throw_) => {
      const it = asyncIterable[Symbol.asyncIterator]();
      (async function () {
        try {
          for await (const data of it) {
            put(data);
          }
          end();
        } catch (e) {
          throw_(e);
        }
      })();
      return cancel;
    });
  }
  
  constructor(writer) {
    if (writer) {
      this._cancel = writer(
        this._put.bind(this),
        this._end.bind(this),
        this._throw.bind(this));
    }
    this._onData = [];
    this._onEnd = [];
    this._onError = [];
    this._ended = false;
  }

  // reader
  onData(callback) {
    this._onData.push(callback);
    return callback;
  }

  // reader
  removeOnData(callback) {
    Arrays.remove(this._onData, callback);
  }

  // reader
  onEnd(callback) {
    this._onEnd.push(callback);
    return callback;
  }

  // reader
  removeOnEnd(callback) {
    Arrays.remove(this._onEnd, callback);
  }

  // reader
  onError(callback) {
    this._onError.push(callback);
    return callback;
  }

  // reader
  removeOnError(callback) {
    Arrays.remove(this._onError, callback);
  }

  // reader
  cancel() {
    this._cancel();
  }

  map(func) {
    return new Stream((put, end, throw_) => {
      this.onData(data => put(func(data)));
      this.onEnd(end);
      this.onError(throw_);
      return this._cancel;
    });
  }

  transform(func) {
    return new Stream((put, end, throw_) => {
      const writer = {put, end, throw_};
      this.onData(data => func(data, writer));
      this.onEnd(end);
      this.onError(throw_);
      return this._cancel;
    });
  }

  transformViaGenerator(generatorFunc) {
    return new Stream((put, end, throw_) => {
      const it = generatorFunc({put, end, throw_});
      it.next();
      this.onData(data => it.next(data));
      this.onEnd(() => {it.return(); end(); });
      this.onError(throw_);
      return this._cancel;
    });
  }

  // reader
  // TODO: toAsyncIterator()


  // writer
  _put(data) {
    if (!this._ended) {
      // TOOD: Separate call stack (async) ?
      this._onData.forEach(callback => callback(data));
    } else {
      throw Error('already ended');
    }
  }

  // writer
  _end() {
    if (!this._ended) {
      // TOOD: Separate call stack (async) ?
      this._onEnd.forEach(callback => callback());
      this._ended = true;
    } else {
      throw Error('already ended');
    }
  }

  // writer
  _throw(error) {
    if (!this._ended) {
      // TOOD: Separate call stack (async) ?
      this._onError.forEach(callback => callback(error));
      if (!this._onError.length) {
        console.error(error);
      }
      this._ended = true;      
    } else {
      throw Error('already ended');
    }
  }
}


export class Pipe extends Stream {

  onReader(callback) {
    if (this._hasReader) {
      callback();
    } else {
      this._onReader = callback;
    }
  }

  onData(callback) {
    assert(!this._hasReader);
    this._hasReader = true;
    super.onData(callback);
    if (this._onReader) {
      this._onReader();
    }
    return callback;
  }
}

// TODO: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API
