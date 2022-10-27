
import EventSource from 'base/event-source.mjs';
import Types from 'base/types.mjs';


export default class AsyncValue {

  constructor(value) {
    this._change = new EventSource();
    if (value) {
      this._setValue(value);
    }
  }

  get value() { return this._value; }
  get change() { return this._change; }

  get isResolved() {
    return AsyncValue.isResolved(this._value);
  }

  static isResolved(value) {
    return Types.isDefined(value)
      && !(value instanceof Promise)
      && !(value instanceof Error);
  }

  update(value) {
    delete this._value;
    this._setValue(value);
    this._change._emit();
  }

  _setValue(value) {
    if (value instanceof Promise) {
      this._setValueFromPromise(value);
    } else {
      this._value = value;
    }
  }

  async _setValueFromPromise(promise) {
    try {
      this._value = await promise;
    } catch (e) {
      this._value = e;
      throw e;
    } finally {
      this._change._emit();
    }
  }
}
