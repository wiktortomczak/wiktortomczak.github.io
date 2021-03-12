// TODO: fake signal from mouse Y.
// TODO: threshold.
// TODO: CSS
// TODO: Call addSignal, removeSignal directly.
// TODO: RecordingEditor label x axis unit msec.
// TODO: grid every 1s.

// TODO: Remove from signal plot.
// TODO: auto-adjust y range based on all plots.

import '/zuzia/v0.2/__packages__/react/umd/react.production.min.js';
const React = window.React;

import Arrays from '/zuzia/v0.2/__packages__/base/arrays.mjs';
import assert from '/zuzia/v0.2/__packages__/base/assert.mjs';
import Dates from '/zuzia/v0.2/__packages__/base/dates.mjs';
import Entries from '/zuzia/v0.2/__packages__/base/entries.mjs';
import EventSource from '/zuzia/v0.2/__packages__/base/event-source.mjs';
import IdMap from '/zuzia/v0.2/__packages__/base/id-map.mjs';
import Objects from '/zuzia/v0.2/__packages__/base/objects.mjs';
import Promises from '/zuzia/v0.2/__packages__/base/promises.mjs';
import range from '/zuzia/v0.2/__packages__/base/range.mjs';
import {cE, fragment, Components, button, Dropdown, TextInput} from '/zuzia/v0.2/__packages__/base/react.mjs';
import Sets from '/zuzia/v0.2/__packages__/base/sets.mjs';
import Stream from '/zuzia/v0.2/__packages__/base/stream.mjs';
import Types from '/zuzia/v0.2/__packages__/base/types.mjs';

import Graph from '/zuzia/v0.2/graph.mjs';


function main() {
  const sensorSignal = SignalSource.create().signal;
  const recordingDatabase = RecordingDatabase.create();
  Components.createAndRender(SignalView, {sensorSignal, recordingDatabase});
}


class SignalView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      tab: 'sensor',
      recordings: this._recordingDatabase.getRecordings()
    };
    this._recordingDatabase.update.listen(() => {
      this.setState({recordings: [...this._recordingDatabase.getRecordings()]});
    });
  }

  get _sensorSignal() { return this.props.sensorSignal; }
  get _recordingDatabase() { return this.props.recordingDatabase; }
  get _recordings() { return this.state.recordings; }
  get _tab() { return this.state.tab; }

  render() {
    return fragment(
      this._renderTabs(),
      this._tab == 'sensor' ? cE(SensorTab, {
        sensorSignal: this._sensorSignal,
        recordings: this._recordings,
        recordingDatabase: this._recordingDatabase}) :
      this._tab == 'recordings' ? cE(RecordingsTab, {
        recordings: this._recordings,
        recordingDatabase: this._recordingDatabase}) :
      throw_()
    );
  }

  _renderTabs() {
    return cE('section', {id: 'tabs'}, ['sensor', 'recordings'].map(tab => {
      return cE('span', {
        className: this._tab == tab ? 'selected' : undefined,
        onClick: e => {this.setState({tab}); e.preventDefault();}
      }, tab);
    }));
  }
};


class SensorTab extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      plotSignals: [this._sensorSignal],
      plotSignalOptions: [{name: 'sensor', color: 'green', strokeWidth: 1}]
    };
    this._playbackSignal = null;
  }

  render() {
    return fragment(
      this._renderSensorSignalControls(),
      this._renderPlaybackSignalControls(),
      this._renderSignalPlot());
  }

  get _sensorSignal() { return this.props.sensorSignal; }
  get _recordings() { return this.props.recordings; }
  get _recordingDatabase() { return this.props.recordingDatabase; }
  get _plotSignals() { return this.state.plotSignals; }
  get _plotSignalOptions() { return this.state.plotSignalOptions; }

  componentWillUnmount() {
    this._updatePlaybackSignal();  // Remove playback signal, if any.
  }

  _renderSensorSignalControls() {
    return cE(SensorSignalControls, {
      sensorSignal: this._sensorSignal,
      recordingDatabase: this._recordingDatabase
    });
  }

  _renderPlaybackSignalControls() {
    return cE('section', {id: 'playback'}, [
      cE('label', null, 'playback'),
      cE(Dropdown, {
        values: Entries.keys(this._recordings),
        onChange: name => {
          const recording = Entries.getValue(this._recordings, name);
          this._updatePlaybackSignal(name, recording);
        },
        allowUndefined: true
      })
    ]);
  }

  _renderSignalPlot() {
    return cE('section', {id: 'plot'}, (
      cE(SignalPlot, {
        signals: this._plotSignals,
        signalOptions: this._plotSignalOptions})
    ));
  }

  _updatePlaybackSignal(recordingName, recording) {
    // Remove the signal from previously selected recording.
    if (this._playbackSignal) {
      this._playbackSignal.cancel();
      this._playbackSignal = null;
    }
    const plotSignals = [this._sensorSignal];
    const plotSignalOptions = this._plotSignalOptions.slice(0, 1);

    if (recording) {
      // Add signal from currently selected recording.
      this._playbackSignal = recording.toPlaybackSignal();
      plotSignals.push(this._playbackSignal);
      plotSignalOptions.push({name: recordingName, color: 'gray', strokeWidth: .5});
    }

    this.setState({plotSignals, plotSignalOptions});
  }
}


class RecordingsTab extends React.Component {
  
  constructor(props) {
    super(props);
    this._recordingIds = new IdMap;
  }

  get _recordings() { return this.props.recordings; }
  get _recordingDatabase() { return this.props.recordingDatabase; }

  render() {
    return cE('section', {id: 'recordings'}, this._recordings.map(
      ([recordingName, recording]) => cE(RecordingEditor, {
        recordingName, recording,
        recordingDatabase: this._recordingDatabase,
        key: recordingName + this._recordingIds.getAddIfNotSet(recording)
      })
    ));
  }
}


class SensorSignalControls extends React.Component {

  state = {}

  get _sensorSignal() { return this.props.sensorSignal; }
  get _recordingDatabase() { return this.props.recordingDatabase; }
  get _sensorRecording() { return this.state.sensorRecording; }

  render() {
    return cE('section', {id: 'sensor'}, [
      cE('label', null, 'sensor'),
      cE('span', null, 'connected'),
      !this._sensorRecording ? [
        button('record', () => this._startSensorRecording())
      ] : [
        button('stop', () => this._stopSensorRecording()),
        cE('span', null, this._sensorRecording.recording.durationSec.toFixed(1) + 's')
      ]
    ]);
  }

  _startSensorRecording() {
    assert(!this._sensorRecording);
    const sensorRecording = new Recording.Builder();
    this._sensorRecordingOnData = this._sensorSignal.onData(point => {
      const [timestamp, value] = point;
      sensorRecording.addPoint(timestamp, value);
      this.forceUpdate();  // Update rendered recording duration.
    });
    this.setState({sensorRecording});
  }

  _stopSensorRecording() {
    this._sensorSignal.removeOnData(this._sensorRecordingOnData);
    this._recordingDatabase.addRecording(
      null /* name */, this._sensorRecording.recording);
    this.setState({sensorRecording: undefined});
    delete this._sensorRecordingOnData;
  }
}


class SignalPlot extends React.Component {

  constructor(props) {
    super(props);
    this._graph = new Graph({
      width: 600,
      axes: {x: {axisLabelFormatter: (d, gran, opts) => {
        if (!this._xAxisStart) {
          this._xAxisStart = d;
        }
        return Dates.differenceSeconds(d, this._xAxisStart) + 's';
      }}}
    });
    this._graph.yAxis.setRange(-.1, 1.1);  // TODO
    this._signals = new Map();
    props.signals.forEach((signal, i) => {
      this._addSignal(signal, props.signalOptions[i]);
    });
    this._updateWindow();
    this._refEl = null;
  }

  render() {
    return fragment(
      cE('div', {ref: el => this._refEl = el}),
      button('reset time', () => {delete this._xAxisStart;})
    );
  }

  componentDidMount() {
    this._graph.render(this._refEl);
    this._updateWindowIntervalId =
      window.setInterval(() => this._updateWindow(), 30);
  }

  componentWillUnmount() {
    for (const [signal, {onData}] of this._signals.entries()) {
      signal.removeOnData(onData);
    }
    window.clearInterval(this._updateWindowIntervalId);
    this._graph.destroy();
  }

  componentDidUpdate(prevProps) {
    const signals = new Set(this.props.signals);
    const prevSignals = new Set(prevProps.signals);

    const removed = Sets.difference(prevSignals, signals);
    for (const signal of removed) {
      this._removeSignal(signal);
    }

    const added = Sets.difference(signals, prevSignals);
    for (const signal of added) {
      const signalId = this.props.signals.findIndex(s => Object.is(s, signal));
      this._addSignal(signal, this.props.signalOptions[signalId]);
    }
  }

  _addSignal(signal, options) {
    const plot = this._graph.addPlot(options.name, Objects.without(options, 'name'));
    const onData = signal.onData(([timestamp, value]) => {
      plot.addPoint(timestamp, value);
    });
    this._signals.set(signal, {plot, onData});
  }

  _removeSignal(signal) {
    const {plot, onData} = this._signals.get(signal);
    signal.removeOnData(onData);
    plot.remove();
    this._signals.delete(signal);
  }

  _updateWindow() {
    const now = Dates.now();
    const start = Dates.addSeconds(now, this.constructor._WINDOW_START_OFFSET_SEC);
    const stop = Dates.addSeconds(now, this.constructor._WINDOW_STOP_OFFSET_SEC);
    this._graph.xAxis.setRange(start, stop);
    this._graph.xAxis.clipPoints(start);
  }
}

SignalPlot._WINDOW_START_OFFSET_SEC = -2;
SignalPlot._WINDOW_STOP_OFFSET_SEC = 8;
SignalPlot._WINDOW_SECONDS =
  SignalPlot._WINDOW_STOP_OFFSET_SEC - SignalPlot._WINDOW_START_OFFSET_SEC;


class RecordingEditor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
    this._graph = new Graph({width: 600});
    this._graph.yAxis.setRange(-.1, 1.1);  // TODO
    const plot = this._graph.addPlot(this._recordingName);
    for (const [offsetMsec, value] of this._recording.points) {
      plot.addPoint(offsetMsec, value);
    }
    this._graph.xAxis.onSelectRange(range => {
      this.setState({selectedRange: range ? range : undefined});
    });
    this._graphEl = null;
  }

  get _recording() { return this.props.recording; }
  get _recordingName() { return this.props.recordingName; }
  get _recordingDatabase() { return this.props.recordingDatabase; }
  get _selectedRange() { return this.state.selectedRange; }

  render() {
    return cE('div', null, fragment(
      cE(TextInput, {
        value: this._recordingName, submitButton: 'rename',
        onSubmit: name => {
          this._recordingDatabase.renameRecording(this._recordingName, name);
        }
      }),
      button('remove', () => this._removeRecording()),
      button('copy', () => this._copyRecording()),
      cE('span', null, 'selection:'),
      this._selectedRange ? fragment(
        button('clip', () => this._clipRecording()),
        button('cut', () => this._cutRecording()),
        cE('span', null, `[${this._selectedRange[0].toFixed()}, ${this._selectedRange[1].toFixed()}]`))
      : cE('span', null, 'click + move'),
      cE('div', {ref: el => this._graphEl = el})
    ));
  }

  componentDidMount() {
    this._graph.render(this._graphEl);
  }

  componentWillUnmount() {
    this._graph.destroy();
  }

  _removeRecording() {
    this._recordingDatabase.removeRecording(this._recordingName);
  }

  _copyRecording() {
    this._recordingDatabase.addRecording(null /* name */, this._recording);
  }

  _clipRecording() {
    const clippedRecording = this._recording.clip(...this._selectedRange);
    this._recordingDatabase.updateRecording(this._recordingName, clippedRecording);
    this.setState({selectedRange: undefined});
  }
}


class Recording {

  constructor(points) {
    this._points = points || [];
  }

  get points() {
    return this._points;
  }

  get durationSec() {
    return this._points.length ? Arrays.last(this._points)[0] / 1000 : 0;
  }

  toPlaybackSignal() {
    const signal = new Stream();

    const startTimestampAsyncGenerator = this._generateStartTimestamps();
    (async () => {
      for await (const startTimestamp of startTimestampAsyncGenerator) {
        let timestamp;
        for (const [offsetMsec, value] of this._points) {
          timestamp = Dates.addMilliseconds(startTimestamp, offsetMsec);
          signal._put([timestamp, value]);
        }
        signal._put([Dates.addMilliseconds(timestamp, 1), NaN]);  // TODO
      }
    })();

    signal.cancel = () => {startTimestampAsyncGenerator.return();};

    return signal;
  }

  async *_generateStartTimestamps() {
    let startTimestamp = Dates.addSeconds(Dates.now(), 2);
    while (true) {
      const windowEnd = Dates.addSeconds(Dates.now(), SignalPlot._WINDOW_SECONDS);
      if (startTimestamp >= windowEnd) {
        await Promises.tick(Dates.differenceMilliseconds(startTimestamp, windowEnd));
      }
      yield startTimestamp;
      startTimestamp = Dates.addSeconds(startTimestamp, this.durationSec + 2);
    }
  }

  // toPlaybackSignal() {
  //   const signal = new Stream();

  //   let timestamp = Dates.now();  // of last point put into in stream.
  //   putSignalThenRepeat();

  //   function putSignalThenRepeat() {
  //     const startTimestamp = Dates.addSeconds(timestamp, 2);
  //     if (startTimestamp < windowEnd) {
  //       x();
  //     } else {
  //       window.setTimeout(x, timeToWindowEnd);
  //     }
      
  //     for (const [offsetMsec, value] of this._points) {
  //       timestamp = Dates.addMilliseconds(startTimestamp, offsetMsec);
  //       signal._put([timestamp, value]);
  //     }
  //     signal._put([Dates.addMilliseconds(timestamp, 1), NaN]);  // TODO

  //     putSignalThenRepeat();
  //   }

  //     // const startTimestamp = Dates.addSeconds(timestamp, 2);  // TODO
  //     // if (startTimestamp < windowEnd) {
  //     // } else {
  //     //   window.setTimeout(putSignalRepeatedly, timeToWindowEnd);
  //     // }

  //   // TODO: cancel()

  //   return signal;
  // }

  // toPlaybackSignal() {
  //   const signal = new Pipe();

  //   let timestamp = Dates.now();  // of last point put into in stream.
  //   const putIntoStream = () => {
  //     const now_plus_2_windows = Dates.addSeconds(Dates.now(), SignalPlot._WINDOW_SECONDS * 2);
  //     while (timestamp < now_plus_2_windows) {
  //       const startTimestamp = Dates.addSeconds(timestamp, 2);  // TODO
  //       for (const [offsetMsec, value] of this._points) {
  //         timestamp = Dates.addMilliseconds(startTimestamp, offsetMsec);
  //         signal._put([timestamp, value]);
  //       }
  //       signal._put([Dates.addMilliseconds(timestamp, 1), NaN]);  // TODO
  //     }

  //     signal._timeoutId = window.setTimeout(
  //       putIntoStream, SignalPlot._WINDOW_SECONDS * 1000);
  //   };

  //   signal.onReader(putIntoStream);

  //   signal.cancel = function cancel() {
  //     // TODO: assert Object.is(this, signal).
  //     if (Types.isDefined(this._timeoutId)) {
  //       window.clearTimeout(this._timeoutId);
  //       delete this._timeoutId;
  //     }
  //   };
      
  //   return signal;
  // }

  clip(start, stop) {
    const idStart = Entries.bisectRight(this._points, start)[0];
    const idStop = Entries.bisectRight(this._points, stop)[0];
    const clippedPoints = this._points.slice(idStart, idStop);

    if (clippedPoints.length) {
      const firstOffset = clippedPoints[0][0];
      clippedPoints.forEach(point => point[0] -= firstOffset);
    }

    return new this.constructor(clippedPoints);
  }
}

Recording.Builder = class Builder {

  constructor() {
    this._recording = new Recording();
    this._firstTimestamp = null;
  }

  get recording() { return this._recording; }
  
  addPoint(timestamp, value) {
    this._firstTimestamp = this._firstTimestamp || timestamp;
    const offsetMsec = Dates.differenceMilliseconds(timestamp, this._firstTimestamp);
    this._recording._points.push([offsetMsec, value]);
  }
};


// class RecordingDatabase {

//   static create() {
//     return new this();
//   }

//   getRecordingNames() {}
  
//   getRecording(recordingName) {}
// }


class FakeRecordingDatabase {

  static create() {
    return new this();
  }

  constructor() {
    this._recordings = [['cos', new Recording(
      range(0, 200).map(i => [i * 10, (Math.cos(Math.PI * i / 100) + 1) / 2]))]];
    this._recordingNames = new Set(Entries.keys(this._recordings));
    this._update = new EventSource();
  }

  getRecordings() { return this._recordings; }
  
  get update() { return this._update; }

  addRecording(recordingName, recording) {
    if (recordingName) {
      assert(!this._recordingNames.has(recordingName));
    } else {
      // Generate a unique name rec-N.
      for (let i = 1; ; ++i) {
        recordingName = 'rec-' + i;
        if (!this._recordingNames.has(recordingName)) {
          break;
        }
      }
    }

    this._recordings.push([recordingName, recording]);
    this._recordingNames.add(recordingName);
    this._update._emit();
  }

  renameRecording(recordingName, newName) {
    Entries.get(this._recordings, recordingName)[0] = newName;
    this._update._emit();
  }

  updateRecording(recordingName, newRecording) {
    Entries.get(this._recordings, recordingName)[1] = newRecording;
    this._update._emit();
  }

  removeRecording(recordingName) {
    Entries.remove(this._recordings, recordingName);
    this._update._emit();
  }
}

const RecordingDatabase = FakeRecordingDatabase;


class FakeSignalSource {

  static create() {
    return new this();
  }

  constructor() {
    const origin = Dates.now();
    const originMsec = performance.now();
    this._signal = new Stream((put, end, throw_) => {
      window.setInterval(() => {
        const nowMsec = performance.now();  // msec
        const deltaMsec = nowMsec - originMsec;
        const now = new Date(origin.getTime() + deltaMsec);
        const value = (Math.sin(Math.PI * deltaMsec / 1000) + 1) / 2;
        put([now, value]);
      }, 10);
    });
  }

  get signal() { return this._signal; }
}

const SignalSource = FakeSignalSource;


main();
