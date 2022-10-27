
export default class Promises {

  static withResolver() {
    let resolve, reject;
    const promise = new Promise((resolve_, reject_) => {
      resolve = resolve_;
      reject = reject_;
    });
    promise.resolve = resolve;
    promise.reject = reject;
    return promise;
  }

  static tick(msec) {
    return new Promise(resolve => window.setTimeout(resolve, msec));
  }

  static async isPending(promise) {
    let isPending = true;
    await Promise.any([
      promise.finally(() => isPending = false),
      Promises.tick(100)
    ]);
    return isPending;
  }
}


export class PromiseExt extends Promise {

  constructor(executor=undefined) {
    let resolve_, reject_;
    super((resolve, reject) => {
      executor && executor(resolve, reject);
      resolve_ = resolve;
      reject_ = reject;
    });
    this.resolve = resolve_;
    this.reject = reject_;
  }
}
