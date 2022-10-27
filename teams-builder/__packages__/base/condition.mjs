
import Objects from 'base/objects.mjs';
import {PromiseExt} from 'base/promises.mjs';


export default class Condition {

  async wait() {
    if (!this._notifyPromise) {
      this._notifyPromise = new PromiseExt();
    }
    return this._notifyPromise;
  }

  notify() {
    const notifyPromise = Objects.pop(this, '_notifyPromise', null);
    notifyPromise && notifyPromise.resolve();
  }
}
