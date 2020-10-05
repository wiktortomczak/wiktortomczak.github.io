
const React = window.React;
const ReactDOM = window.ReactDOM;

import Stream from 'https://tomczak.xyz/sensors/__packages__/base/stream.mjs';


function main() {
  const fakeSensorReadings = new FakeSensorReadings();
  SensorReadingsView.createAndRender(fakeSensorReadings.stream);
  FakeSensorReadingControls.createAndRender(fakeSensorReadings);
}


class SensorReadingsView extends React.Component {
  
  static createAndRender(sensorReadings) {
    const rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
    rootEl.id = 'sensor_readings';
    return ReactDOM.render(React.createElement(this, {sensorReadings}), rootEl);
  }

  constructor() {
    super();
    this.state = {sound: null, touch: null, ellipseRotation: 0};
  }

  get _sensorReadings() { return this.props.sensorReadings; }
  get _sound() { return this.state.sound; }
  get _touch() { return this.state.touch; }
  get _ellipseRotation() { return this.state.ellipseRotation; }

  componentDidMount() {
    this._sensorReadings.onData(reading => {
      this.setState(reading);
    });
    this._rotateSoundSensor();
  }

  render() {
    return [
      this._renderSoundSensor(),
      this._renderTouchSensor()
    ];
  }

  _renderSoundSensor() {
    return this._sound != null ? React.createElement('svg', {}, [
      React.createElement('ellipse', {
        rx: 80, ry: 40,
        transform: `translate(150, 100) rotate(${this._ellipseRotation})`
      }),
      React.createElement('circle', {
        cx: 150, cy: 1000, r: 700 + this._sound / 2
      })
    ]) : React.createElement('div', {}, 'waiting for sound sensor data');
  }

  _rotateSoundSensor() {
    window.setInterval(() => {
      this.setState({ellipseRotation: (
        this._ellipseRotation + (20 + this._sound || 0)/10) % 360});
    }, 60);
  }

  _renderTouchSensor() {
    return this._touch != null ? React.createElement('svg', {}, [
      React.createElement('circle', {cx: 150, cy: 150, r: 10 + this._touch / 2})
    ]) : React.createElement('div', {}, 'waiting for touch sensor data');
  }
}


class FakeSensorReadingControls extends React.Component {

  static createAndRender(fakeSensorReadings) {
    const rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
    rootEl.id = 'fake_sensor_readings';
    return ReactDOM.render(
      React.createElement(this, {fakeSensorReadings}), rootEl);
  }

  get _fakeSensorReadings() { return this.props.fakeSensorReadings; }

  render() {
    return [
      React.createElement('p', {}, [
        'sygnały (docelowo z czujników, tych suwaków nie będzie)',
      ]),
      React.createElement('div', {}, [
        React.createElement('p', {}, 'dźwięk'),
        React.createElement('input', {
          type: 'range', value: this._fakeSensorReadings._sound,
          min: 0, max: 255,
          onChange: e => {
            this._fakeSensorReadings.sound = parseInt(e.target.value);
            this.forceUpdate();
          }})
      ]),
      React.createElement('div', {}, [
        React.createElement('p', {}, 'nacisk'),
        React.createElement('input', {
          type: 'range', value: this._fakeSensorReadings._touch,
          min: 0, max: 255,
          onChange: e => {
            this._fakeSensorReadings.touch = parseInt(e.target.value);
            this.forceUpdate();
          }})
      ])
    ];      
  }
}


class FakeSensorReadings {

  constructor() {
    this._touch = 0;
    this._sound = 0;
    this._stream = new Stream();
    window.setInterval(() => {
      this._stream.put({sound: this._sound, touch: this._touch});
    }, 10);
  }

  get stream() {
    return this._stream;
  }

  get touch() {
    return this._touch;
  }

  set touch(value) {
    this._touch = value;
    this._stream.put({touch: this._touch});
  }

  get sound() {
    return this._sound;
  }

  set sound(value) {
    this._sound = value;
    this._stream.put({sound: this._sound});
  }
}


window.onload = main();
