
import CancelablePromise from 'https://wiktortomczak.github.io/vb/__packages__/base/cancelable-promise.mjs';
import Stream from 'https://wiktortomczak.github.io/vb/__packages__/base/stream.mjs';


export default function domEvent(el, eventName, capture) {
  return {
    callback: callback => domEventCallback(el, eventName, capture, callback),
    promise: () => domEventPromise(el, eventName, capture),
    stream: () => domEventStream(el, eventName, capture)
  };
}

export function domEventCallback(el, eventName, capture, callback) {
  function callBackAndRemoveListener(event) {
    callback(event);
    el.removeEventListener(eventName, callBackAndRemoveListener, capture);
  }
  el.addEventListener(eventName, callBackAndRemoveListener, capture);
  return {
    cancel: function cancel() {
      el.removeEventListener(eventName, callBackAndRemoveListener, capture);
    }
  };
}

export function domEventPromise(el, eventName, capture) {
  let resolve_;
  const promise = new CancelablePromise(resolve => {
    resolve_ = resolve;
    el.addEventListener(eventName, resolve_, capture);
  });
  promise.finally(() => {
    el.removeEventListener(eventName, resolve_, capture);
  });
  return promise;
}

export function domEventStream(el, eventName, capture) {
  const stream = Stream.fromCallbackAPI(function *(putIntoStream) {
    el.addEventListener(eventName, putIntoStream, capture);
    yield;
    el.removeEventListener(eventName, putIntoStream, capture);
  });
  stream.unlisten = function unlisten() { stream.unregister(); };
  return stream;
}
