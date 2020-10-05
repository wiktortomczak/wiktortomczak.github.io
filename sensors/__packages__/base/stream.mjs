
// TODO: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API
export default class Stream {
  
  constructor() {
    this._onData = null;
    this._onEnd = null;
  }

  put(data) {
    this._onData && this._onData(data);
  }

  end() {
    this._onEnd && this._onEnd();
  }

  onData(callback) {
    this._onData = callback;
    return this;
  }

  onEnd(callback) {
    this._onEnd = callback;
    return this;
  }
}
