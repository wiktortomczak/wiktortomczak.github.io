
// TODO: Re-render on repeated/map field change.
// TODO: Repeated/map field page size.
// TODO: Repeated/map field table view.
// TODO: Expand all, collapse all, etc. Arrows./
// TOOD: Fix comma & spacing before ... (repeated/map elements past 3rd)

// TODO: Clean up:
// objectComponents

import 'https://wiktortomczak.github.io/vb/__packages__/base/__packages__/react/umd/react.development.js';
const React = window.React;
import 'https://wiktortomczak.github.io/vb/__packages__/base/__packages__/react-dom/umd/react-dom.development.js';
const ReactDOM = window.ReactDOM;

import Arrays from 'https://wiktortomczak.github.io/vb/__packages__/base/arrays.mjs';
import assert from 'https://wiktortomczak.github.io/vb/__packages__/base/assert.mjs';
import Objects from 'https://wiktortomczak.github.io/vb/__packages__/base/objects.mjs';
import ObjectView from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/object/object.mjs';
import {cE, fragment, button, AsyncStateComponent} from 'https://wiktortomczak.github.io/vb/__packages__/base/react.mjs';
import Types from 'https://wiktortomczak.github.io/vb/__packages__/base/types.mjs';

import MessageParser from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/util/message-parser.mjs';
import Messages from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/util/messages.mjs';


function main() {
  const objectUrl = (new URL(window.location)).searchParams.get('object');
  const object = ObjectView.remote(objectUrl);
  ReactDOM.render(ObjectBrowser.createElement(object), createDiv('itrader'));
}


export default class ObjectBrowser extends AsyncStateComponent {

  static createElement(object, objectComponents) {
    return cE(this, {object, objectComponents});
  }

  constructor(props) {
    super(props);
    this._objectComponents = new Map(props.objectComponents);
    (async () => {
      this.initOrSetState({object: await props.object});
    })();
  }

  get _object() { return this.state.object; }

  render() {
    return this._object instanceof ObjectView
      ? cE(Context.Provider, {value: {
          rootObject: this._object,
          renderObjectComponent: this._renderObjectComponent.bind(this)
      }}, (
        this._renderObjectComponent(this._object)
      ))
      : 'loading...';
  }

  _renderObjectComponent(object, props) {
    const objectComponentClass =
      // TODO: Non-object message.
      this._objectComponents.get(object.constructor) || Object_;
    return cE(objectComponentClass, {object, ...props});
  }
}


const Context = React.createContext();


// Field
// -- CompositeField
// ---- Object
// ---- RepeatedOrMapField
// ------ RepeatedField
// ------ MapField
// -- Scalar
// -- ObjectReference
class Field extends React.Component {

  get _parentFieldEl() { return this.props.parentFieldEl; }

  // TODO: Inline in createElement().
  static getSubclass(field) {
    if (field.descriptor.isUnary) {
      if (field.descriptor.isScalar) {
        return Scalar;
      } else if (field.descriptor.isMessage) {
        return Object_;
      } else if (field.descriptor.isReference) {
        return ObjectReference;
      }
    } else if (field.descriptor.isRepeated) {
      return RepeatedField;
    } else if (field.descriptor.isMap) {
      return MapField;
    }
    throw Error();
  }

  static createElement(field, parentFieldEl) {
    return this.getSubclass(field).createElement(field, parentFieldEl);
  }
}


class CompositeField extends Field {

  get _isCollapsed() { return this.state.isCollapsed; }
  get _isCollapsedRecursive() { return this.state.isCollapsedRecursive; }
  get _isCollapsedSeqNum() { return this.state.isCollapsedSeqNum; }

  constructor(props) {
    super(props);

    // TODO: loadState()
    this.state = {
      isCollapsed: false,
      isCollapsedRecursive: false
    };

    const isCollapsed = this._isCollapsedFromAncestor();
    if (Types.isDefined(isCollapsed)) {
      this.state.isCollapsed = isCollapsed;
    }
    
    if (!this.state.isCollapsedSeqNum) {
      // First time a Component is created for this field, not loaded.
      this.state.isCollapsedSeqNum = this.constructor._isCollapsedSeqNum;
    }
  }

  UNSAFE_componentWillReceiveProps() {
    const isCollapsed = this._isCollapsedFromAncestor();
    if (Types.isDefined(isCollapsed)) {
      this.setState({isCollapsed});
    }
  }

  _renderEntry(subfield) {
    const liProps = {};
    liProps.onClick = this._onClick.bind(this);
    liProps.className = this._isCollapsed ? 'collapsed' : 'expanded';
    return cE('li', liProps, ...[
      this._renderKey(subfield.key),
      Field.createElement(subfield, this)
    ]);
  }

  _isCollapsedFromAncestor() {
    if (!this._isCollapsedRecursive) {
      for (let ancestor = this._parentFieldEl; ancestor;
           ancestor = ancestor._parentFieldEl) {
        if (ancestor._isCollapsedRecursive &&
            (!ancestor._isCollapsedSeqNum || 
             (ancestor._isCollapsedSeqNum >= this._isCollapsedSeqNum))) {
          return ancestor._isCollapsed;
        }
      }
    }
  }

  _onClick(e) {
    console.log(`onClick ${this._field.path()}`);
    e.stopPropagation();
    this.setState({
      isCollapsed: !this._isCollapsed,
      isCollapsedRecursive: e.ctrlKey,
      isCollapsedSeqNum: ++Object._isCollapsedSeqNum
    });
  }

  // Abstract methods:
  // _renderKey
}

CompositeField._isCollapsedSeqNum = 1;
CompositeField.contextType = Context;


// class Entry extends PersistentStateComponent {
 
//   static createElement(field, parentFieldEl) {
//     if (field.descriptor.isComposite) {
//       FieldState.setDefault(this._field, {isCollapsed: false});
//     }
//     return cE(this, {field, parentFieldEl, key: field.key});
//   }

//   constructor(props) {
//     super(props);
//     this.state = FieldState.get(this._field) || {};
//     this._fieldClass = Field.getSubclass(this._field);
//     this._fieldPath = this._field.path();
//   }

//   componentDidMount() {
//     FieldState.registerComponent(this._field, this);
//   }

//   componentWillUnmount() {
//     FieldState.unregisterComponent(this._field, this);
//   }

//   get _key() { return this._reactInternalFiber.key; }
//   get _persistentStoreKey() { return this._fieldPath; }  // TODO: persistentStore.
//   get _field() { return this.props.field; }
//   get _parentFieldEl() { return this.props.parentFieldEl; }
//   get _isCollapsed() { return this.state.isCollapsed; }
//   get _isCollapsible() { return Types.isDefined(this.state.isCollapsed); }
//   get _hasMouseHover() { return this.state.hasMouseHover; }

//   render() {
//     const liProps = {};
//     if (this._isCollapsible) {
//       liProps.onMouseEnter = this._onMouseEnter.bind(this);
//       liProps.onMouseLeave = this._onMouseLeave.bind(this);
//       if (!this._parentFieldEl._isCollapsed) {
//         liProps.onClick = this._onClick.bind(this);
//         liProps.className = this._isCollapsed ? 'collapsed' : 'expanded';
//       }
//     }
//     if (this._hasMouseHover) {  // TODO
//       liProps.className += ' hover';
//     }
//     return cE('li', liProps, ...[
//       this._parentFieldEl._renderKey(this._key),
//       this._renderField()
//     ]);
//   }

//   _renderField() {
//     const collapsedDepth =
//       this._parentFieldEl._isCollapsed ? this._parentFieldEl._collapsedDepth + 1 : 
//       this._isCollapsed ? 0 :
//       undefined;  // Not collapsed.
//     return this._fieldClass.createElement(this._field, collapsedDepth);
//   }

//   _onClick(e) {
//     e.stopPropagation();
//     FieldState.set(this._field, {isCollapsed: !this.state.isCollapsed}, e.ctrlKey /* setRecursively */);
//   }

//   _onMouseEnter() {
//     this._setHasMouseHoverInParentEntryState(undefined);
//     Entry._hasMouseHoverEntries.push(this);
//     this.setState({hasMouseHover: true});
//     // console.log(Entry._hasMouseHoverEntries.map(e => e._key));
//   }

//   _onMouseLeave() {
//     assert(Object.is(this, Entry._hasMouseHoverEntries.pop()));
//     this.setState({hasMouseHover: undefined});
//     this._setHasMouseHoverInParentEntryState(true);
//     // console.log(Entry._hasMouseHoverEntries.map(e => e._key));
//   }

//   _setHasMouseHoverInParentEntryState(hasMouseHover) {
//     const parentEntry = Arrays.last(Entry._hasMouseHoverEntries);
//     if (parentEntry) {
//       parentEntry.setState({hasMouseHover});
//     }
//   }
// }

// Entry._hasMouseHoverEntries = [];


export class Object_ extends CompositeField {

  static createElement(object, parentFieldEl) {
    return cE(this, {object, parentFieldEl});
  }

  constructor(props) {
    super(props);
    this.state.seqNum = 0;
  }

  get _object() { return this.props.object; }
  get _field() { return this.props.object; }  // TODO: Remove.
  get _seqNum() { return this.state.seqNum; }

  render(referencePath) {
    // if (!this._isCollapsed && !this._parentFieldEl._isCollapsed) {
    return !(this._parentFieldEl && this._parentFieldEl._isCollapsed) ? fragment(
      !this._isCollapsed ? this._renderType() : null,
      referencePath,  // Defined only when called from ObjectReference.
      this._isCollapsed ? '{' : null,
      cE('ul', {className: 'object'}, ...[
        this._object.subfields().map(
          subfield => this._renderEntry(subfield)),
        this._renderRpcs()
      ]),
      this._isCollapsed ? '}' : null
    ) : '...';
  }

  componentDidMount() {
    this._objectListener = this._object.ownChange.listen(() => {
      // console.log(`${this._object.path()} seqNum := ${this._seqNum + 1}`);
      this.setState({seqNum: this._seqNum + 1});
    });
  }

  componentWillUnmount() {
    this._objectListener.remove();
    delete this._objectListener;
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.seqNum != this.state.seqNum
      || !Object.is(nextProps.object, this.props.object);
  }

  _renderType() {
    const typeName = this._object.constructor.descriptor.name;
    return cE('span', {className: 'type'}, typeName);
  }

  _renderRpcs() {
    const rpcs = this._object.constructor.descriptor.rpcs;
    if (!Objects.isEmptyOrUndefined(rpcs)) {
      return !this._isCollapsed
        ? Object.values(rpcs).map((rpcDescriptor, i) => (
          cE(Rpc, {object: this._object, rpcDescriptor, key: i})))
        : cE('input', {type: 'button', value: '...', disabled: true});
    }
  }

  _renderKey(key) {
    assert(!(this._parentFieldEl && this._parentFieldEl._isCollapsed));  // TODO?
    return cE('label', {key, className: 'entry_key'}, key);
  }
}


// paging: ___ - ___ of ___ << < > >>   page ___
// TODO: table view?

class RepeatedOrMapField extends CompositeField {

  constructor(props) {
    super(props);
    Object.assign(this.state, this._page(0));
  }

  get _pageBegin() { return this.state.pageBegin; }
  get _pageEnd() { return this.state.pageEnd; }
  get _pageSize() { return this.state.pageSize; }

  _fieldDescriptor = new UnaryFieldDescriptor(this.props.fieldDescriptor);

  get _numEntries() { return this._field.numEntries; }

  render() {
    const subfields = !this._isCollapsed && this._numEntries
      ? this._field.subfields(this._pageBegin, this._pageEnd + 1)
      : this._field.subfields(0, 3);  // Empty list if no entries.
    return fragment(
      !this._isCollapsed
        ? this._renderPaging()
        : cE('span', {}, '(', this._numEntries, ')'),
      this._isCollapsed ? '[' : null,
      cE('ul', {}, 
        // TODO: const separator = this._isCollapsed ? ',' : undefined;
         subfields.map(subfield => this._renderEntry(subfield))
      ),
      this._isCollapsed && this._numEntries > 3 ? '...' : null,
      this._isCollapsed ? ']' : null
    );
  }

  _renderPaging() {
    // TODO: add div.paging css, remove span.size css.
    if (this._numEntries) {
      return cE('nav', {className: 'paging'}, ...[
        cE('span', {}, this._pageBegin), '-', cE('span', {}, this._pageEnd),
        'of', cE('span', {}, this._numEntries),
        button('<<', e => {
          this._setPageState(0);
          e.stopPropagation();
        }),
        button('<', e => {
          const prevPageBegin = Math.max(0, this._pageBegin - this._pageSize);
          this._setPageState(prevPageBegin);
          e.stopPropagation();
        }),
        button('>', e => {
          const nextPageBegin =
            Math.min(this._pageBegin + this._pageSize, this._lastPageBegin());
          this._setPageState(nextPageBegin);
          e.stopPropagation();
        }),
        button('>>', e => {
          this._setPageState(this._lastPageBegin());
          e.stopPropagation();
        })
        // TODO: Page size.
      ]);
    }
  }

  componentDidMount() {
    this._fieldListener = this._field.ownChange.listen(() => {
      this._setPageState();
    });
  }

  componentWillUnmount() {
    this._fieldListener.remove();
    delete this._fieldListener;
  }

  _page(pageBegin) {
    const numEntries = this._numEntries;
    if (numEntries) {
      const pageSize = this.state && this.state.pageSize
        || this.constructor._DEFAULT_PAGE_SIZE;
      if (Types.isUndefined(pageBegin)) {
        pageBegin = (this.state && this.state.pageBegin) || 0;
      }
      const pageEnd = Math.min(pageBegin + pageSize, numEntries) - 1;
      assert(pageBegin < numEntries);
      return {pageBegin, pageEnd, pageSize};
    } else {
      return {};
    }
  }

  _lastPageBegin() {
    const lastEntryId = this._numEntries - 1;
    return lastEntryId - lastEntryId % this._pageSize;
  }

  _setPageState(pageBegin) {
    this.setState(this._page(pageBegin));
  }

  // TODO
  // _field;
}

RepeatedOrMapField._DEFAULT_PAGE_SIZE = 10;

class RepeatedField extends RepeatedOrMapField {

  static createElement(repeatedField, parentFieldEl) {
    return cE(this, {repeatedField, parentFieldEl});
  }
  
  get _field() { return this.props.repeatedField; }

  _renderKey(key) {
    return cE('data', {key, className: 'entry_key'}, key);
  }
}

class MapField extends RepeatedOrMapField {

  static createElement(mapField, parentFieldEl) {
    return cE(this, {mapField, parentFieldEl});
  }

  get _field() { return this.props.mapField; }

  _renderKey(key) {
    return cE('data', {key, className: 'entry_key'}, JSON.stringify(key));
  }
}


class Scalar extends Field {
  
  static createElement(scalar, parentFieldEl) {
    return cE(this, {scalar, parentFieldEl});
  }

  get _field() { return this.props.scalar; }  // TODO: Remove.

  render() {
    return cE('data', {}, JSON.stringify(this.props.scalar.value));
  }
}


class ObjectReference extends Field {

  static createElement(objectReference, parentFieldEl) {
    const object = objectReference.value;
    return cE(this, {object, parentFieldEl});
  }

  get _object() { return this.props.object; }
  get _field() { return this.props.object; }  // TODO: Remove.

  render() {
    this._objectEl = new Object_({
      object: this._object,
      parentFieldEl: this
    });
    return this._objectEl.render(this._referencePath());
  }

  _referencePath() {
    return fragment(
      '@', cE('a', {href: '#'}, cE('label', {}, (
        this._object.pathComponents().map(
          component => component.startsWith('[') ?
            ['[', cE('data', {}, component.slice(1, -1)), ']'] : component)
      ))));
  }
}


class UnaryFieldDescriptor {

  constructor(fieldDescriptor) {
    this._fieldDescriptor = fieldDescriptor;
  }

  get isUnary() { return true; }
  get isRepeated() { return false; }
  get isMap() { return false; }

  get isScalar() { return this._fieldDescriptor.isScalar; }
  get isMessage() { return this._fieldDescriptor.isMessage; }
  get isReference() { return this._fieldDescriptor.isReference; }

  get type() { return this._fieldDescriptor.type; }
}


// class FieldState {

//   // String field path -> Object state
//   _state = {};
//   // String field path -> React.Component
//   _components = {};
//   // Keys are paths, not Field objects, because Field objects are not unique
//   // (given a scalar, a new Scalar instance is generated on every call to
//   // subfields()).
//   // TODO: Fields as keys ((parent Field, key) pairs for scalars).

//   get(field) {
//     return this._state[field.path()];
//   }

//   set(field, stateUpdate, setRecursively) {
//     const fieldPath = field.path();
//     const fieldState = Objects.setDefault(this._state, fieldPath, {});

//     // TODO: updateState(). Remove key if value undefined.
//     Object.assign(fieldState, stateUpdate);
//     const component = this._components[fieldPath];
//     if (component) {
//       component.setState(stateUpdate);
//     }

//     if (setRecursively) {
//       assert(component);
//       // for (const subfield of field.subfields()) {
//       for each (subfield with component) {
//         this.set(subfield, stateUpdate, true /* setRecursively */);
//       }
//     }
//   }

//   setDefault(field, state) {  // TODO: Per-key default?
//     const fieldPath = field.path();
//     if (!(fieldPath in this._state)) {
//       this._state[fieldPath] = state;
//       const component = this._components[fieldPath];
//       if (component) {
//         component.resetState(state);  // TODO
//       }
//     }
//   }

//   registerComponent(field, component) {
//     const fieldPath = field.path();
//     assert(!(fieldPath in this._components));
//     this._components[fieldPath] = component;
//     const fieldState = this._state[fieldPath];
//     if (fieldState) {
//       // TODO: Only if _state changed while there was no registered component.
//       component.resetState(fieldState);  // TODO
//     }
//   }

//   unregisterComponent(field, component) {
//     const fieldPath = field.path();
//     assert(Object.is(this._components[fieldPath], component));
//     delete this._components[fieldPath];
//   }
// }


// TODO: Collapsed view.
class Rpc extends React.Component {

  state = {request: null};  // request is read-only here, mutable in the builder.
  
  get _object() { return this.props.object; }
  get _rpcDescriptor() { return this.props.rpcDescriptor; }
  get _request() { return this.state.request; }
  get _rootObject() { return this.context.rootObject; }

  get _requestDescriptor() {
    return this._rpcDescriptor.requestMessageExtClass
      ? this._rpcDescriptor.requestMessageExtClass.descriptor : null;
  }

  render() {
    const methodName = this._rpcDescriptor.methodName;
    return cE('form', {className: 'rpc',
                       onSubmit: e => {e.preventDefault(); this._doRpc();}}, ...[
      cE('input', {type: 'submit', value: methodName,
                   disabled: this._requestDescriptor && !this._request,
                   onClick: e => e.stopPropagation()}),
      this._requestDescriptor ? cE(MessageBuilder, {
        name: 'request',
        descriptor: this._requestDescriptor,
        onMessage: request => this.setState({request}),
        referenceMessage: this._rootObject
      }) : null
    ]);
  }

  _doRpc() {
    if (!this._requestDescriptor) {
      this._object[this._rpcDescriptor.methodNameJson]();
    } else if (this._request) {
      this._object[this._rpcDescriptor.methodNameJson](this._request);
    } else {
      // TODO: mark error.
    }
  }
}

Rpc.contextType = Context;


class MessageBuilder extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      message: null,
      messageStr: ''
    };
    this._messageObj = null;
    this._messageParser = new MessageParser(this.props.descriptor);
  }

  get _name() { return this.props.name; }
  get _descriptor() { return this.props.descriptor; }
  get _onMessage() { return this.props.onMessage; }
  get _message() { return this.state.message; }
  get _messageStr() { return this.state.messageStr; }

  render() {
    // TODO: green / red.
    const fieldDescriptors = Object.values(this._descriptor.fields);
    return fragment(
      cE('input', {name: this._name, value: this._messageStr,
                   onChange: e => this._setMessageStr(e.target.value)}),
      cE('table', {}, cE('tbody', {}, fieldDescriptors.map(fieldDescriptor => (
        FieldBuilder.render(
          this._message, fieldDescriptor,
          value => { this._setField(fieldDescriptor, value); },
          this.props, fieldDescriptor.nameJson)
      ))))
    );
  }

  _setMessageStr(messageStr) {
    const message = this._messageParser.parseMessage(messageStr);
    this._onMessage(message);
    // console.log(`messageStr='${messageStr}'`);
    // console.log(message ? message.toJson() : null);
    // console.log(message);
    this.setState({message, messageStr});
    this._messageObj = null;
  }

  _setField(fieldDescriptor, value) {
    if (!this._messageObj) {
      this._messageObj = this._message ? this._message.toJson() : {};
    };                          
    if (Types.isDefined(value)) {
      this._messageObj[fieldDescriptor.nameJson] = value;
    } else {
      delete this._messageObj[fieldDescriptor.nameJson];
    }
    const message = this._createMessage(this._messageObj);
    const messageStr = JSON.stringify(message.toJson());
    this._onMessage(message);
    // console.log(`messageStr='${messageStr}'`);
    // console.log(message ? message.toJson() : null);
    // console.log(message);
    this.setState({message, messageStr});
  }

  _createMessage(messageObj) {
    return this._descriptor.messageExtClass.fromObject(messageObj);
  }
}


class FieldBuilder extends React.Component {

  static render(message, fieldDescriptor, setField, extraProps, key) {
    let subclass;
    if (fieldDescriptor.isUnary && fieldDescriptor.isScalar) {
      subclass = UnaryScalarFieldBuilder;
    } else if (fieldDescriptor.isUnary && fieldDescriptor.isReference) {
      subclass = UnaryReferenceFieldBuilder;
    } else {
      subclass = ReadOnlyFieldBuilder;
    }
    return cE(subclass, {message, fieldDescriptor, setField, extraProps, key});
  }

  constructor(props) {
    super(props);
    this._initOrUpdateState();
  }

  get _message() { return this.props.message; }
  get _fieldDescriptor() { return this.props.fieldDescriptor; }
  get _setField() { return this.props.setField; }
  get _valueStr() { return this.state.valueStr; }

  _initOrUpdateState() {
    let valueStr = '';
    if (this._message) {
      const value = this._message[this._fieldDescriptor.nameJson];
      if (value) {
        valueStr = value.toString();
      }
    }
    if (!this.state) {  // TODO: If is rendered.
      this.state = {valueStr};
    } else {
      this.setState({valueStr});
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.message != prevProps.message) {
      this._initOrUpdateState();
    }
  }

  render() {
    return cE('tr', {}, ...[
      cE('td', {}, this._fieldDescriptor.name),  // TODO: gray if unset !this._has(name)
      cE('td', {}, this._renderInput())
    ]);
  }
}

class UnaryScalarFieldBuilder extends FieldBuilder {

  _renderInput() {
    return cE('input', {name: this._fieldDescriptor.name,
                        value: this._valueStr,
                        onChange: e => {
      const valueStr = e.target.value;
      try {
        var value = this._fieldDescriptor.type.valueFromString(valueStr);
      } catch (e) { }
      this._setField(value);
      // This triggers componentDidUpdate() -> setState({valueStr}).
    }});
  }
}

class UnaryReferenceFieldBuilder extends FieldBuilder {

  get _referenceMessage() { return this.props.extraProps.referenceMessage; }
  get _selectedMessagePath() { return this.state.valueStr; }

  _renderInput() {
    this._pathToMessage = {};
    const options = this._findMessagesOfReferencedType().map(message => {
      const path = message.path();
      this._pathToMessage[path] = message;
      return cE('option', {name: path, key: path}, path);
    });
    return cE('select', {name: this._fieldDescriptor.name,
                         value: this._selectedMessagePath,
                         onChange: e => {
                           const message = this._pathToMessage[e.target.value];
                           this._setField(message);
                         }}, options);
  }

  _findMessagesOfReferencedType() {
    return Messages.findByType(
      this._referenceMessage, this._fieldDescriptor.messageExtClass);
  }
}

class ReadOnlyFieldBuilder extends FieldBuilder {

  _renderInput() {
    return cE('input', {name: this._fieldDescriptor.name,
                        value: this._valueStr,
                        readOnly: true});
  }
}


// TODO: Only if top-level, imported from html, not from another module.
// main();
