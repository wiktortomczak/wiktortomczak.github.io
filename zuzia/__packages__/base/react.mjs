
import '/zuzia/__packages__/base/__packages__/react/umd/react.production.min.js';
const React = window.React;
import '/zuzia/__packages__/base/__packages__/react-dom/umd/react-dom.production.min.js';
const ReactDOM = window.ReactDOM;

import Arrays from '/zuzia/__packages__/base/arrays.mjs';
import Types from '/zuzia/__packages__/base/types.mjs';


export function cE(...args) {
  return React.createElement(...args);
}

export function fragment(...args) {
  return React.createElement(React.Fragment, null, ...args);
}


export class Components {

  static createAndRender(componentClass, props, rootEl) {
    if (!rootEl) {
      rootEl = document.createElement('div');
      document.body.appendChild(rootEl);
    }
    const element = cE(componentClass, props);
    return ReactDOM.render(element, rootEl);
  }
}


export class AsyncStateComponent extends React.Component {

  state = {};

  initOrSetState(state) {
    this._isMounted ? this.setState(state) : this._initState(state);
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    delete this._isMounted;
  }

  _initState(state) {
    this.state = {...this.state, ...state};
  }
}


export function button(textContent, onClick) {
  return cE('button', {onClick}, textContent);
}


export class Dropdown extends React.Component {

  constructor(props) {
    super(props);
    this.state = this.constructor.getDerivedStateFromProps(props);
  }

  static getDerivedStateFromProps(props, state) {
    const values = [...props.values];
    if (props.allowUndefined) {
      Arrays.insertAt(values, undefined, 0);
    }
    const value =
      !state || !Arrays.has(state.values, state.value) ? values[0] : state.value;
    // TODO: Trigger onChange if value changed.
    return {values, value};
  }

  render() {
    return cE('select', {
      value: this.state.value,
      onChange: e => {
        const value = e.target.value;
        this.setState({value});
        this.props.onChange(value);
      }
    }, this.state.values.map(value => cE('option', {value}, value)));
  }
}


export class TextInput extends React.Component {

  constructor(props) {
    super(props);
    this.state = {value: props.value || ''};
  }

  render() {
    return cE('form', {
      onSubmit: e => this._onSubmit(e),
      onBlur: e => this._onBlur(),
      onFocus: e => this._onFocus()
    }, [
      cE('input', {
        value: Types.isDefined(this.state.pendingValue) ?
          this.state.pendingValue : this.state.value,
        onChange: e => this._onChange(e),
        ref: el => this._inputEl = el
      }),
      this.props.submitButton ?
        cE('input', {type: 'submit', value: this.props.submitButton,
                     disabled: !Types.isDefined(this.state.pendingValue)
                               || this.state.pendingValue == this.state.value})
        : null
    ]);
  }

  _onChange(event) {
    this.setState({pendingValue: event.target.value});
  }

  _onSubmit(event) {
    if (Types.isDefined(this.state.pendingValue)) {
      const value = this.state.pendingValue;
      this.setState({value, pendingValue: undefined});
      this._inputEl.blur();
      this.props.onSubmit(value);
    }
    event.preventDefault();
  }

  _onBlur() {
    // medium.com/@jessebeach/dealing-with-focus-and-blur-in-a-composite-widget-in-react-90d3c3b49a9b
    this._blurTimeoutId = window.setTimeout(() => {
      this.setState({pendingValue: undefined});
    }, 0);
  }

  _onFocus() {
    window.clearTimeout(this._blurTimeoutId);
  }
}
