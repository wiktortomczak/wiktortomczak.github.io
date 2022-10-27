
import assert from 'base/assert.mjs';
import {CanceledError} from 'base/cancelable-promise.mjs';
import Event from 'base/event.mjs';


export default class Stream {

  static withWriter() {
    const stream = new this();
    return [stream, stream._createWriter()];
  }

  constructor() {
    this._onDataCallbacks = [];
    this._onEndCallbacks = [];
    this._onErrorCallbacks = [];
  }    

  onData(callback) {
    this._onDataCallbacks.push(callback);
  }

  onEnd(callback) {
    this._onEndCallbacks.push(callback);
  }

  onError(callback) {
    this._onErrorCallbacks.push(callback);
  }

  cancel() {
    this._writer.throw(new CanceledError);
  }

  finally(callback) {
    this.onEnd(callback);
    this.onError(callback);
  }

  [Symbol.asyncIterator]() {
    return new this.constructor.AsyncIterator(this);
  }

  static fromAsyncGen(asyncGen) {
    const [stream, writer] = this.withWriter();
    (async () => {
      try {
        for await (const data of asyncGen) {
          writer.put(data);
        }
      } catch (e) {
        writer.throw(e);
        return;
      }
      writer.end();
    })();
    
    return stream;
  }
  
  static fromAsyncGenFunc(asyncGenFunc) {
    return this.fromAsyncGen(asyncGenFunc());
  }

  static fromCallbackAPI(registerUnregisterGenFunc) {
    const [stream, writer] = this.withWriter();
    function putIntoStream(data) { writer.put(data); }
    const registerUnregisterGen = registerUnregisterGenFunc(putIntoStream);
    registerUnregisterGen.next();  // Register. Subsequent .next() unregisters.
    stream.unregister = function unregister() {
      registerUnregisterGen.next();
      writer.end();
    };
    stream.onError(() => registerUnregisterGen.next());
    return stream;
  }

  map(func) {
    const [derived, writer] = this._derivedStreamWithWriter();
    this.onData(data => writer.put(func(data)));
    return derived;
  }

  transform(func) {
    const [derived, writer] = this._derivedStreamWithWriter();
    this.onData(data => func(data, writer));
    return derived;
  }

  _derivedStreamWithWriter() {
    const [derived, writer] = this.constructor.withWriter();
    this.onEnd(() => writer.end());
    this.onError(error => writer.throw(error));
    derived._source = this;
    derived.cancel = function cancel() { this._source.cancel(); };
    return [derived, writer];
  }

  _createWriter() {
    assert(!this._writer);
    return (this._writer = new this.constructor.Writer(this));
  }
}

Stream.Writer = class Writer {

  constructor(stream) {
    this._onDataCallbacks = stream._onDataCallbacks;
    this._onEndCallbacks = stream._onEndCallbacks;
    this._onErrorCallbacks = stream._onErrorCallbacks;
    this._ended = false;
  }

  put(data) {
    assert(!this._ended);
    for (const callback of this._onDataCallbacks) {
      callback(data);
    }
  }

  end() {
    assert(!this._ended);
    this._ended = 'end';
    for (const callback of this._onEndCallbacks) {
      callback();
    }
  }
  
  throw(error) {
    console.error(error);
    assert(!this._ended);
    this._ended = 'throw';
    for (const callback of this._onErrorCallbacks) {
      callback(error);
    }
  }
};


Stream.AsyncIterator = class AsyncIterator {

  constructor(stream) {
    this._data = [];
    this._ended = false;
    this._error = null;
    this._numDataToError = -1;
    stream.onData(this._handleData.bind(this));
    stream.onEnd(this._handleEnd.bind(this));
    stream.onError(this._handleError.bind(this));
  }

  _handleData(data) {
    this._data.push(data);
    if (this._hasNext) {
      this._hasNext.set();
    }
  }

  _handleEnd() {
    this._ended = true;
    if (this._hasNext) {
      this._hasNext.set();
    }
  }

  _handleError(error) {
    this._error = error;
    this._numDataToError = this._data.length;
    if (this._hasNext) {
      this._hasNext.set();
    }
  }

  async next() {
    for (;;) {
      if (this._numDataToError-- == 0) {
        throw this._error;
      }
      if (this._data.length) {
        return {value: this._data.shift(), done: false};
      } else if (this._ended) {
        return {done: true};
      }
      await (this._hasNext = new Event());
      delete this._hasNext;
    }
  }
};
