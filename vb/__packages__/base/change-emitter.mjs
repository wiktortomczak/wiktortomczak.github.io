
import Arrays from 'https://wiktortomczak.github.io/vb/__packages__/base/arrays.mjs';


export default class ChangeEmitter {

  constructor() {
    this._changeCallbacks = [];
  }
  
  onChange(callback) {
    this._changeCallbacks.push(callback);
    return new CallbackRemover(this, callback);
  }

  removeOnChangeCallback(callback) {
    Arrays.remove(this._changeCallbacks, callback);
  }

  _emitChange() {
    for (const callback of this._changeCallbacks) {
      callback();
    }
  }
}

class CallbackRemover {

  constructor(emitter, callback) {
    this._emitter = emitter;
    this._callback = callback;
  }

  remove() {
    this._emitter.removeOnChangeCallback(this._callback);
  }
}
