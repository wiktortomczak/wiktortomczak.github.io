
import assert from 'https://wiktortomczak.github.io/vb/__packages__/base/assert.mjs';


export default class Event {

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
