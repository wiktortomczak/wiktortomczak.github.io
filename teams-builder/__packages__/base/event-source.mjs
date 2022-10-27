
import Arrays from 'base/arrays.mjs';


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

  listenOnce(callback) {
    const listener = new Listener((...args) => {
      callback(...args);
      listener.remove();
    }, this);
    this._listeners.push(listener);
    return listener;
  }

  removeListener(listener) {
    Arrays.remove(this._listeners, listener);
  }

  _emit(...args) {
    this._listeners.forEach(listener => listener._callback(...args));
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
