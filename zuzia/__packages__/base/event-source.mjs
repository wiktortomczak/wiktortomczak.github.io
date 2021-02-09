
import Arrays from '/zuzia/__packages__/base/arrays.mjs';


export default class EventSource {

  static withEmitter() {
    const eventSource = new this();
    return [eventSource, eventSource._emit.bind(eventSource)];
  }

  constructor() {
    this._listeners = [];
  }

  listen(callback) {
    const listener = new Listener(callback, this);
    this._listeners.push(listener);
    return listener;
  }

  removeListener(listener) {
    Arrays.remove(this._listeners, listener);
  }

  _emit() {
    this._listeners.forEach(listener => listener._callback());
  }
}


class Listener {

  constructor(callback, eventSource) {
    this._callback = callback;
    this._eventSource = eventSource;
  }

  remove() {
    this._eventSource.removeListener(this);
  }
}
