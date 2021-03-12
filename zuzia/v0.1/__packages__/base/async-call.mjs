
import assert from '/zuzia/v0.1/__packages__/base/assert.mjs';


export default class AsyncCall {

  static inAnimationFrame(callback) {
    return new InAnimationFrame(callback);
  }

  constructor(callback) {
    if (callback) {
      this.schedule(callback);
    }
  }

  get isPending() { return !!this._id; }

  schedule(callback) {
    assert(!this._id);
    this._id = this._schedule(() => {
      callback();
      delete this._id;
    });
  }

  scheduleIfNotPending(callback) {
    if (!this.isPending) {
      this.schedule(callback);
    }
  }

  reschedule(callback) {
    this.cancelIfPending();
    this.schedule(callback);
  }

  cancel() {
    this._cancel(this._id);
    delete this._id;
  }

  cancelIfPending() {
    if (this.isPending) {
      this.cancel();
    }
  }
}

class InAnimationFrame extends AsyncCall {

  _schedule(callback) {
    return window.requestAnimationFrame(callback);
  }

  _cancel(scheduledCallbackId) {
    window.cancelAnimationFrame(scheduledCallbackId);
  }
}
