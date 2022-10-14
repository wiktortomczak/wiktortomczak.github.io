
import 'https://wiktortomczak.github.io/vb/__packages__/base/__packages__/react/umd/react.development.js';
const React = window.React;
import 'https://wiktortomczak.github.io/vb/__packages__/base/__packages__/react-dom/umd/react-dom.development.js';
const ReactDOM = window.ReactDOM;

import assert from 'https://wiktortomczak.github.io/vb/__packages__/base/assert.mjs';
import Arrays from 'https://wiktortomczak.github.io/vb/__packages__/base/arrays.mjs';
import AsyncValue from 'https://wiktortomczak.github.io/vb/__packages__/base/async-value.mjs';
import Classes from 'https://wiktortomczak.github.io/vb/__packages__/base/classes.mjs';
import Types from 'https://wiktortomczak.github.io/vb/__packages__/base/types.mjs';


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

  initOrSetState(state, callback) {
    this._isMounted
      ? this.setState(state, callback)
      : this._initState(state, callback);
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    delete this._isMounted;
  }

  _initState(state, callback) {
    this.state = {...this.state, ...state};
    callback();
  }

  async _asyncSetStateFromProps(property) {
    try {
      const value = await this.props[property];
      this.initOrSetState({[property]: value});
    } catch (e) {
      this.initOrSetState({[property]: null});
      throw e;
    }
  }
}

export function renderAsyncValue(value, renderFunc) {
  if (AsyncValue.isResolved(value)) {
    return renderFunc(value);
  } else if (value instanceof Error) {
    return cE('div', {}, value.message);
  } else {
    return cE('div', {}, '...');
  }
}


export class DataComponent extends React.Component {

  componentDidMount() {
    this._dataOnChangeListener =
      this.data.onChange(() => this.forceUpdate());
  }

  componentWillUnmount() {
    this._dataOnChangeListener.remove();
  } 
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


// Remove. Use Input from react-forms.mjs.
export class TextInput extends React.Component {

  constructor(props) {
    super(props);
    this.state = {value: props.value || ''};
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.value != this.props.value) {
      this.setState({value: nextProps.value});
    }
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
        ref: el => this._inputEl = el,
        ...this.props.attr
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


export class PersistentStateParent extends React.Component {

  _elementState = {};
  _elementStateDefault = {};

  constructor(props) {
    super(props);
    this.state = {elements: this._bindElements(props.elements || [])};
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    console.log('componentWillReceiveProps');
    return {elements: this._bindElements(nextProps.elements || [])};
  }
  
  render() {
    return this.state.elements;
  }

  setElements(elements) {
    this.setState({elements: this._bindElements(elements)});
  }

  _bindElements(elements) {
    elements.forEach(e => {
      assert(Classes.isSubclass(e.type, PersistentStateComponent));
      assert(typeof e.key == 'string');
    });
    return elements.map(element => React.cloneElement(element, {
      loadState: this._loadElementState.bind(this, element.key),
      saveState: this._saveElementState.bind(this, element.key)
    }));
  }

  setStateAll(stateUpdate) {
    for (const elementState of Object.values(this._elementState)) {
      this.constructor._updateState(stateUpdate, elementState);
    }
    this.constructor._updateState(stateUpdate, this._elementStateDefault);
    // Have elements load their updated state.
    this.setState({elements: this.state.elements.map(
      element => React.cloneElement(element, {
        loadStateNeeded: (element.props.loadStateNeeded || 0) + 1
      })
    )});
  }

  _loadElementState(key) {
    return this._elementState[key] || this._elementStateDefault;
  }

  _saveElementState(key, state) {
    this._elementState[key] = state;
    // TODO: Remove key if state equals elementStateDefault.
  }

  static _updateState(update, state) {
    for (const [key, value] of Object.entries(update)) {
      if (Types.isDefined(value)) {
        state[key] = value;
      } else {
        delete state[key];
      }
    }
  }
}


export class PersistentStateComponent extends React.Component {

  constructor(props) {
    super(props);
    this._loadState();
  }

  // UNSAFE_componentWillReceiveProps(nextProps) {
  //   if (nextProps.loadStateNeeded != this.props.loadStateNeeded) {
  //     return this.props.loadState();
  //   }
  // }

  setStatePersistent(stateUpdate) {
    super.setState(stateUpdate, () => this._saveState());
  }

  _loadState() {
    const key = this._persistentStoreKey;
    this.state = this.constructor._persistentStore.load(key);
  }

  _saveState() {
    const key = this._persistentStoreKey;
    this.constructor._persistentStore.save(key, this.state);
  }

  get _persistentStoreKey() {}
}
