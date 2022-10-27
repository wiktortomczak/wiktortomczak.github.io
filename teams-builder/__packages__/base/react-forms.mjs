
import React from 'react'; 
import ReactDOM from 'react-dom'; 

import {cE} from 'base/react.mjs';
import Types from 'base/types.mjs';


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


export class Select2 extends React.Component {

  // static forProperty(property, values, props) {
  //   return cE(this, {value: property.get(), onChange: property.setBind, values, props});
  // }

  render() {
    const defaultValue = this.props.values ?
      this.props.defaultValue :
      this._findLabel(this.props.defaultValue);
    const onChange = this.props.values ?
       e => this.props.onChange(e.target.value) :
       e => this.props.onChange(this._findValue(e.target.value));
    const labels = this.props.values
       ? this.props.values
       : this.props.labelsValues.map(([label, value]) => label);
    return cE('select', {defaultValue, onChange, ...this.props.props}, labels.map(
      label => cE('option', {value: label, key: label}, label)));
  }

  _findLabel(value) {
    return this.props.labelsValues.find(
      ([label, value_]) => Object.is(value, value_))[0];
  }

  _findValue(label) {
    return this.props.labelsValues.find(
      ([label_, value]) => label_ == label)[1];
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
