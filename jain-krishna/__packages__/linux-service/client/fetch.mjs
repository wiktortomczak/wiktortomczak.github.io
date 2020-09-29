
import assert from 'https://tomczak.xyz/jain-krishna/__packages__/linux-service/client/assert.mjs';


class Fetch {

  /**
   * Fetches a URI asynchronously via HTTP GET request.
   *
   * @param {!String} uri
   * @return {!FetchResponse} Response (URI content).
   */ 
  static get(uri) {
    return this.fetch(uri, {method: 'GET'});
  };

  /**
   * Sends an HTTP POST request.
   *
   * @param {!String} uri
   * @param {!Object} body
   * @param {String=} opt_contentType
   * @return {!FetchResponse} Response.
   */ 
  static post(uri, body, opt_contentType) {
    return this.fetch(uri, {
      body: body,
      headers: opt_contentType ? {'content-type': opt_contentType} : null,
      method: 'POST',
      mode: 'cors'
    });
  }

  static fetch(uri, init) {
    const abortController = new AbortController();
    const responsePromise = fetch(uri, {
      ...init, signal: abortController.signal});
    return new FetchResponse(responsePromise, abortController);
  }
}


class FetchResponse {

  constructor(responsePromise, abortController) {
    this._responsePromise = responsePromise;
    this._abortController = abortController;
    [this._responseRead, this._responseReadResolver] = promiseWithResolver();
    responsePromise.catch(error => this._responseReadResolver.reject(error));
  }

  static fromPromise(fetchResponsePromise) {
    const responsePromise = new Promise((resolve, reject) => {
      fetchResponsePromise
        .then(fetchResponse => fetchResponse._responsePromise.then(resolve))
        .catch(reject);
    });
    const abortController = {
      abort: () => fetchResponsePromise
        .then(fetchResponse => fetchResponse.cancel())
    };
    return new this(responsePromise, abortController);
  }

  getText() {
    return this._responsePromise.then(response => {
      this._assertResponseOk(response);
      const text = response.text();
      this._responseReadResolver.resolve();
      return text;
    });
  }

  getStream() {
    const stream = new Stream();
    this._responsePromise.then(response => {
      this._assertResponseOk(response);  // TODO: Write into stream.
      this._readerToStream(response.body.getReader(), stream);
    });
    return stream;
  }

  getJsonStream({framing, shouldParse}) {
    return JsonStream.fromDataStream(
      this.getStream(), {framing, shouldParse});
  }

  cancel() {
    this._abortController.abort();
  }

  get cancelablePromise() {
    if (!this._cancelablePromise) {
      this._cancelablePromise = {
        then: func => this._responseRead.then(func),
        finally: func => this._responseRead.finally(func),
        cancel: () => this.cancel()
      };
    }
    return this._cancelablePromise;
  }

  async _readerToStream(reader, stream) {
    try {
      while (true) {
        // Can throw exception, eg. if canceled.
        const {done, value} = await reader.read();
        if (!done) {
          stream.put(value); 
        } else {
          break;
        }
      }
      stream.end();
      this._responseReadResolver.resolve();
    }
    catch (e) {
      // TODO: stream.fail();
      this._responseReadResolver.reject();
    }
  }
  
  _assertResponseOk(response) {
    assert(response.ok, () => response.status + ' ' + response.statusText);
  }
}


// TODO: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API
class Stream {
  
  constructor() {
    this._onData = null;
    this._onEnd = null;
  }

  put(data) {
    this._onData(data);
  }

  end() {
    this._onEnd && this._onEnd();
  }

  onData(callback) {
    this._onData = callback;
    return this;
  }

  onEnd(callback) {
    this._onEnd = callback;
    return this;
  }
}


class JsonStream extends Stream {

  static fromDataStream(dataStream, {framing, shouldParse}) {
    assert(!framing || framing == 'line-delimited');
    return new this(dataStream, !isUndefined(shouldParse) ? shouldParse : true);
  }

  constructor(dataStream, shouldParse) {
    super();
    dataStream.onData(this._handleData.bind(this));
    dataStream.onEnd(this._handleEnd.bind(this));
    this._shouldParse = shouldParse;
    this._textRemainder = '';
  }

  _handleData(data) {
    let text = JsonStream._decoder.decode(data);
    for ( ;; ) {
      const newlineIndex = text.indexOf('\n');
      if (newlineIndex == -1)
        break;

      const textUntilNewline = text.slice(0, newlineIndex);
      text = text.slice(newlineIndex + 1);
      
      const textJson = this._textRemainder + textUntilNewline;
      this.put(this._shouldParse ? JSON.parse(textJson) : textJson);

      this._textRemainder = '';
    }
    this._textRemainder += text;
  }

  _handleEnd() {
    assert(!this._textRemainder);
    this.end();
  }
}

JsonStream._decoder = new TextDecoder();


function isUndefined(v) {
  return typeof v == 'undefined';
}


function promiseWithResolver() {
  const resolver = {};
  const promise = new Promise((resolve, reject) => {
    resolver.resolve = resolve;
    resolver.reject = reject;
  });
  return [promise, resolver];
}


export {Fetch as default, FetchResponse};
