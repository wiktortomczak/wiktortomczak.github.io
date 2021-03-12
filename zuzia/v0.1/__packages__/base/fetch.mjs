
import assert from '/zuzia/v0.1/__packages__/base/assert.mjs';
import {Uint8Arrays} from '/zuzia/v0.1/__packages__/base/binary.mjs';
import Iterables, {AsyncIterables} from '/zuzia/v0.1/__packages__/base/iterables.mjs';
import Stream from '/zuzia/v0.1/__packages__/base/stream.mjs';


export default class Fetch {

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
    const init = {
      body: body,
      method: 'POST',
      mode: 'cors'
    };
    if (opt_contentType) {
      init.headers = {'content-type': opt_contentType};
    }
    return this.fetch(uri, init);
  }

  static fetch(uri, init) {
    const abortController = new AbortController();
    const responsePromise = fetch(uri, {
      ...init, signal: abortController.signal});
    return new FetchResponse(responsePromise, abortController);
  }
}


export class FetchResponse {

  constructor(responsePromise, abortController) {
    this._responsePromise = responsePromise;
    this._abortController = abortController;
    // TODO: Replace _responseRead with reader.closed?
    // (reader of type ReadableStreamDefaultReader returned by getReader()).
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

  iterLines() {
    let completeLines, partialLine;
    return AsyncIterables.transform(this.iterUint8Array(), (data, sink) => {
      const text = this.constructor._textDecoder.decode(data);
      [completeLines, partialLine] = _splitLines(text, partialLine);
      completeLines.forEach(line => sink.put(line));
    });
  }

  streamLines() {
    return Stream.fromAsyncIterable(this.iterLines(), () => this.cancel());
  }

  getJson() {
    return this.getText().then(JSON.parse);
  }
  
  iterUint8Array() {
    // TODO: Make the returned iterator cancellable, via iter.cancel()?
    return AsyncIterables.Sink.fromAsyncIterablePromise(
      this._responsePromise.then(response => {
        this._assertResponseOk(response);
        return this._iterReader(response.body.getReader());
      }));
  }

  streamUint8Array() {
    return Stream.fromAsyncIterable(this.iterUint8Array(), () => this.cancel());
  }

  iterUint8Frames() {
    let completeFrames, partialData;
    return AsyncIterables.transform(this.iterUint8Array(), (data, sink) => {
      [completeFrames, partialData] = _splitFrames(partialData, data);
      completeFrames.forEach(frame => sink.put(frame));
    });      
  }

  streamUint8Frames() {
    return Stream.fromAsyncIterable(this.iterUint8Frames(), () => this.cancel());
  }
  
  iterJson(framing, jsonParseFunc) {
    framing = framing || 'line-delimited';
    jsonParseFunc = jsonParseFunc || JSON.parse;

    const jsonFramesIter = (
      (framing == 'line-delimited') ? this.iterLines() :
      (framing == 'length-prefixed') ? this.iterUint8Frames() :
      throw_(framing));      
    return AsyncIterables.map(jsonFramesIter, jsonParseFunc);
  }

  streamJson(framing, jsonParseFunc) {
    return Stream.fromAsyncIterable(
      this.iterJson(framing, jsonParseFunc), () => this.cancel());
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

  async *_iterReader(reader) {
    try {
      while (true) {
        // Can throw exception, eg. if canceled.
        const {done, value} = await reader.read();
        if (!done) {
          yield value;
        } else {
          break;
        }
      }
      this._responseReadResolver.resolve();
    }
    catch (e) {
      this._responseReadResolver.reject(e);
      throw e;
    }
  }
  
  _assertResponseOk(response) {
    assert(response.ok, () => response.status + ' ' + response.statusText);
  }
}

FetchResponse._textDecoder = new TextDecoder();


function _splitLines(text, prevPartialLine) {
  const completeLines = text.split('\n');
  if (prevPartialLine) {
    completeLines[0] = prevPartialLine + completeLines[0];
  }
  if (!text.endsWith('\n')) {
    var partialLine = completeLines.pop();
  } else {
    completeLines.pop();
  }
  return [completeLines, partialLine];
}


function _splitFrames(prevData, data) {
  if (prevData) {
    data = Uint8Arrays.concat(prevData, data);
  }
  return [Iterables.toArray(Iterables.fromValueFunc(splitNextFrame)), data];

  function splitNextFrame() {
    if (data.length >= 4) {
      const frameLength = Uint8Arrays.unpackUint32(data);
      const frameEnd = 4 + frameLength;
      if (data.length >= frameEnd) {
        const frame = data.slice(4, frameEnd);
        data = data.slice(frameEnd);
        return frame;
      }
    }
  }
}


function promiseWithResolver() {
  const resolver = {};
  const promise = new Promise((resolve, reject) => {
    resolver.resolve = resolve;
    resolver.reject = reject;
  });
  return [promise, resolver];
}
