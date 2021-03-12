
import Fetch from '/zuzia/v0.2/__packages__/base/fetch.mjs';

class ServiceClient {

  static Connect(messageExtClass, serviceUrl) {
    const rootMessageExt = new messageExtClass();
    const rootMessageExtPromise = new Promise((resolve, reject) => {
    Fetch.get(serviceUrl + '/data?json').streamJson()
      .onData(syncMessageJson => {
        if (syncMessageJson.set) {
          var rootMessageExt = messageExtClass.fromJson(syncMessageJson.set);
          resolve(rootMessageExt);
        } else {
          rootMessageExt.updateJson(syncMessageJson);
        }
      });
    });
    return new this(rootMessageExtPromise);
  }

  constructor(self, rootMessageExtPromise) {
    this._rootMessageExtPromise = rootMessageExtPromise;
  }

  get rootMessageExtPromise() { return this._rootMessageExtPromise; }
}
