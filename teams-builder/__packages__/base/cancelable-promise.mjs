
export default class CancelablePromise extends Promise {

  constructor(executor) {
    let _reject;
    super((resolve, reject) => {
      _reject = reject;
      executor(resolve, reject);
    });
    this._reject = _reject;
  }

  cancel() {
    this._reject(new CanceledError());
  }
}


export class CanceledError extends Error {}
