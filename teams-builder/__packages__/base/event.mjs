
import assert from 'base/assert.mjs';


export default class Event {

  static fromEventTarget(eventTarget, eventName) {
    const event = new this();
    eventTarget.addEventListener(eventName, () => event.set());
    return event;
  }

  set() {
    assert(!this._isSet);
    if (this._resolve) {
      this._resolve();
    }
    this._isSet = true;
  }

  then(resolve, reject) {
    assert(!this._resolve);
    if (this._isSet) {
      resolve();
    }
    this._resolve = resolve;
  }
}
