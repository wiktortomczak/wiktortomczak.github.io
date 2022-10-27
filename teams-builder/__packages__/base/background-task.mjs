
import assert from 'base/assert.mjs';
import EventSource from 'base/event-source.mjs';
import {PromiseExt} from 'base/promises.mjs';
import Stream from 'base/stream.mjs';


export default class BackgroundTask {

  static fromGenerator(gen) {
    const task = new this(gen);
    task._run();
    return task;
  }

  constructor(gen, result) {
    this._gen = gen;
    this._result = result;
    this._isRunning = false;
  }

  get result() { return this._result; }
  get isRunning() { return this._isRunning; }

  cancel() {
    const canceled = new Error('canceled');
    try {
      this._gen.throw(canceled);
    } catch (e) {
      if (!Object.is(e, canceled)) {
        throw e;
      }
    }
  }

  _run() {
    this._setIsRunning(true);
    requestIdleCallback(this._runSomeSteps.bind(this));
  }

  _runSomeSteps(deadline) {
    while (deadline.timeRemaining() > 0) {
      try {
        var {value, done} = this._gen.next();
      } catch (e) {
        this._setIsRunning(false);
        this._handleException(e);
        return;
      }
      if (done) {
        assert(value === undefined);
        this._setIsRunning(false);
        this._handleDone();
        return;
      } else {
        this._handleValue(value);
      }
    }

    this._run();
  }

  _setIsRunning(isRunning) {
    this._isRunning = isRunning;
    isRunning ? 
      this.constructor.running.add(this) : 
      this.constructor.running.delete(this);
    this.constructor.changes._emit(this);
  }
}

BackgroundTask.running = new Set();
BackgroundTask.changes = new EventSource();


export class PromiseTask extends BackgroundTask {

  constructor(gen) {
    super(gen, new PromiseExt());
  }

  _handleValue(value) {
    this._value = value;
  }

  _handleDone() {
    this._result.resolve(this._value);
  }

  _handleException(e) {
    this._result.reject(e);
  }
}


export class StreamTask extends BackgroundTask {

  constructor(gen) {
    const [stream, streamWriter] = Stream.withWriter();
    super(gen, stream);
    this._streamWriter = streamWriter;
  }

  _handleValue(value) {
    this._streamWriter.put(value);
  }

  _handleDone() {
    this._streamWriter.end();
  }

  _handleException(e) {
    this._streamWriter.throw(e);
  }
}
