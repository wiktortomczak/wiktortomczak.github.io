
import 'https://wiktortomczak.github.io/vb/__packages__/base/__packages__/react/umd/react.development.js';
const React = window.React;
import 'https://wiktortomczak.github.io/vb/__packages__/base/__packages__/react-dom/umd/react-dom.development.js';
const ReactDOM = window.ReactDOM;

import {cE} from 'https://wiktortomczak.github.io/vb/__packages__/base/react.mjs';


export function button(text, onClick, props) {
  return cE('button', {onClick, type: 'button', ...props}, text);
}


export class Checkbox extends React.Component {

  static forProperty(property, props) {
    return cE(this, {checked: property.get(), onChange: property.setBind, props});
  }

  state = {checked: this.props.checked}

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.checked != this.props.checked) {
      this.setState({checked: nextProps.checked});
    }
  }

  render() {
    return cE('input', {
      type: 'checkbox',
      checked: this.state.checked,
      onChange: e => {
        const checked = e.target.checked;
        this.setState({checked});
        this.props.onChange(checked);
      },
      ...this.props.props
    });
  }
}


export class Input extends React.Component {

  static forProperty(property, props) {
    return cE(this, {value: property.get(), onChange: property.setBind, props});
  }

  state = {value: this.props.value}

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.value != this.props.value) {
      this.setState({value: nextProps.value});
    }
  }

  render() {
    return cE('input', {
      value: this.state.value,
      onChange: e => {
        const value = e.target.value;
        this.setState({value});
        if (this.props.onChange) {
          this.props.onChange(value);
        }
      },
      // stackoverflow.com/questions/31272207to-call-onchange-event-after-pressing-enter-key
      onKeyDown: this.props.onSubmit ? e => {
        if (e.key == 'Enter') {
          this.props.onSubmit(this.state.value);
        }
      } : null,
      ...this.props.props
    });
  }
}


export class Select extends React.Component {

  static forProperty(property, values, props) {
    return cE(this, {value: property.get(), onChange: property.setBind, values, props});
  }

  state = {value: this.props.value}

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.value != this.props.value) {
      this.setState({value: nextProps.value});
    }
  }

  render() {
    return cE('select', {
      defaultValue: this.state.value,
      onChange: e => {
        const value = e.target.value;
        this.setState({value});
        this.props.onChange(value);
      },
      ...this.props.props
    }, this.props.values.map(value => (
      cE('option', {value: value, key: value}, value))));
  }
}


// TODO: dialog polyfill
export class ModalDialog extends React.Component {

  static createAndShow(props, ...children) {
    const dialogEl = document.createElement('dialog');
    document.body.appendChild(dialogEl);
    const el = ReactDOM.render(cE(this, {dialogEl, ...props}, ...children), dialogEl);
    dialogEl.showModal();
    return el;
  }

  render() {
    return this.props.children;
  }

  close() {
    this.props.dialogEl.close();
    this.props.dialogEl.remove();
  }
}
