
// TODO: Re-render on repeated / map field change.

import '/zuzia/__packages__/base/__packages__/react/umd/react.production.min.js';
const React = window.React;
import '/zuzia/__packages__/base/__packages__/react-dom/umd/react-dom.production.min.js';
const ReactDOM = window.ReactDOM;

import Iterables from '/zuzia/__packages__/base/iterables.mjs';
import Objects from '/zuzia/__packages__/base/objects.mjs';
import ObjectView from '/zuzia/__packages__/base/proto/object/object.mjs';
import {cE, fragment, AsyncStateComponent, Components} from '/zuzia/__packages__/base/react.mjs';
import Types from '/zuzia/__packages__/base/types.mjs';

import MessageParser from '/zuzia/__packages__/base/proto/util/message-parser.mjs';
import Messages from '/zuzia/__packages__/base/proto/util/messages.mjs';


function main() {
  const objectUrl = (new URL(window.location)).searchParams.get('object');
  const object = ObjectView.remote(objectUrl);
  ReactDOM.render(ObjectBrowser.render(object), createDiv('itrader'));
}


export default class ObjectBrowser extends AsyncStateComponent {

  static render(object, objectComponents) {
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


class CompositeField extends React.Component {

  get _isCollapsed() { return this.props.isCollapsed; }

  render() {
    return cE('ul', {}, this._renderEntries());
  }

  _renderEntries() {
    const entries = this._entryAccessor.entries(
      (this instanceof Object_) ? undefined : 3);
    return entries.map(entry => {
      const [key, _, fieldDescriptor] = entry;
      const isCollapsed =  // reference or Timeseries.
        fieldDescriptor.isUnary && fieldDescriptor.isScalar ? undefined :
        ((fieldDescriptor.isUnary && fieldDescriptor.isReference) ||
         (key == 'point'));  // TODO
      return cE(Entry, {key, entry, isCollapsed, parentField: this});
    });
  }

  _renderEntry(entry) {
    if (Types.isDefined(entry.isCollapsed) && !this._isCollapsed) {
      var liProps = {
        className: entry.isCollapsed ? 'collapsed' : 'expanded',
        onClick: e => {
          e.stopPropagation();
          entry.toggleIsCollapsed();
        }
      };
    }
    const [key, value, fieldDescriptor] = entry.entry;
    return cE('li', liProps, ...[
      this._renderKey(key),
      this._renderValue(value, fieldDescriptor, entry.isCollapsed)
    ]);
  }

  _renderValue(value, fieldDescriptor, isCollapsed) {
    // collapsed object: scalar value | reference path | map keys ...
    //                   | ... (object) | ... (array)
    // collapsed scalar array (key count): 1 2 3 ...
    // collapsed ref array (key count): .a .b .c ...
    // collapsed object array (key count): ...
    // collapsed scalar map (key count): a: 1 b: 2 c: 3 ...
    // collapsed ref map (key count): a: .a b: .b c: .c ...
    // collapsed object map (key count): a: ... b: ... c: ... ...
    if (fieldDescriptor.isUnary && fieldDescriptor.isScalar) {
      return cE(Scalar, {value, type: fieldDescriptor.type});
    } else if (fieldDescriptor.isUnary && fieldDescriptor.isMessage) {
      if (!this._isCollapsed) {
        return this.context.renderObjectComponent(value, {isCollapsed});
      } else {
        return _COLLAPSED;
      }
    } else if (fieldDescriptor.isUnary && fieldDescriptor.isReference) {
      const referencePath = cE(ReferencePath, {object: value});
      if (!this._isCollapsed) {
        return this.context.renderObjectComponent(value, {referencePath, isCollapsed});
      } else {
        return referencePath;
      }
    } else if (fieldDescriptor.isRepeated) {
      if (!this._isCollapsed) {
        return cE(RepeatedField, {array: value, fieldDescriptor, isCollapsed});
      } else {
        return _COLLAPSED;
      }
    } else if (fieldDescriptor.isMap) {
      if (!this._isCollapsed) {
        return cE(MapField, {map: value, fieldDescriptor, isCollapsed});
      } else {
        const mapField = new MapField({map: value, fieldDescriptor});
        return mapField._entryAccessor.keys().map(key => mapField._renderKey(key));
      }
    }
    throw Error('not reached');
  }

  _entryAccessor;
  _renderKey() {}
}

CompositeField.contextType = Context;


function _isEmpty(v) {
  if (v.constructor.descriptor) {  // message
    return v.isEmpty;
  } else if (v instanceof Array) {
    return !v.length;
  } else if (v instanceof Map) {
    return !v.size;
  }
  throw Error(v);
}


class Entry extends React.Component {

  // state = {isCollapsed: this.props.isCollapsed};

  constructor(props) {
    super(props);
    this.state = {isCollapsed: this.props.isCollapsed};
  }

  get entry() { return this.props.entry; }
  get isCollapsed() { return this.state.isCollapsed; }
  get _parentField() { return this.props.parentField; }

  render() {
    return this._parentField._renderEntry(this);
  }

  toggleIsCollapsed() {
    this.isCollapsed ? this.expand() : this.collapse();
  }

  collapse() {
    this.setState({isCollapsed: true});
  }

  expand() {
    this.setState({isCollapsed: false});
  }
}


class EntryAccessor {
  keys() {}
  value(key) {}
  fieldDescriptor(key) {}
}


export class Object_ extends CompositeField {

  state = {seqNum: 0};
  _entryAccessor = new ObjectEntryAccessor(this._object);

  get _object() { return this.props.object; }
  get _referencePath() { return this.props.referencePath; }
  get _seqNum() { return this.state.seqNum; }

  render() {
    // console.log(this._object.path() + ' render');
    return fragment(
      !this._isCollapsed ? this._renderType() : null,
      this._referencePath,
      cE('ul', {className: 'object'}, ...[
         this._renderEntries(),
         this._renderRpcs()
      ])
    );
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.object != this.props.object) {
      this._entryAccessor = new ObjectEntryAccessor(nextProps.object);
    }
    return nextState.seqNum != this.state.seqNum
      || nextProps.object != this.props.object
      || nextProps.isCollapsed != this.props.isCollapsed;
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

  _renderType() {
    let typeName = this._object.constructor.descriptor.name;
    if (this._referencePath) {
      typeName = typeName + '@';
    }
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
    if (!this._isCollapsed) {
      return cE('label', {key, className: 'entry_key'}, key);
    }
  }
}

class ObjectEntryAccessor extends EntryAccessor {

  constructor(object) {
    super();
    this._object = object;
  }

  keys() {
    return this._object.fieldEntries().map(
      ([fieldDescriptor]) => fieldDescriptor.name);
  }

  entries(max) {
    return this._object.fieldEntries().slice(0, max).map(
      ([fieldDescriptor, value]) =>
        [fieldDescriptor.name, value, fieldDescriptor]);
  }

  // value(key) {
  //   return this._object[this.fieldDescriptor(key).nameJson];
  // }

  // fieldDescriptor(key) {
  //   return Object.values(this._object.constructor.descriptor.fields).find(
  //     field => field.name == key);
  // }
}


class ReferencePath extends React.Component {

  get _object() { return this.props.object; }

  render() {
    return cE('a', {href: '#'}, cE('label', {}, (
      this._object.pathComponents().map(
        component => component.startsWith('[') ?
          ['[', cE('data', {}, component.slice(1, -1)), ']'] : component)
    )));
  }
}


class RepeatedOrMapField extends CompositeField {

  _unaryFieldDescriptor = new UnaryFieldDescriptor(this.props.fieldDescriptor);
  get _fieldDescriptor() { return this._unaryFieldDescriptor; }

  render() {
    return fragment(
      cE('span', {className: 'size'}, '(' + this.size, ')'),
      super.render()
    );
  }
}

// class RepeatedOrMapFieldAccessor extends EntryAccessor {

//   constructor(field, keys, fieldDescriptor) {
//     super();
//     this._field = field;
//     this._keys = keys;
//     this._fieldDescriptor = fieldDescriptor;
//   }

//   keys() { return this._keys; }
//   value(key) { return this._field[key]; }
//   fieldDescriptor(key) { return this._fieldDescriptor; }
// }

class RepeatedField extends RepeatedOrMapField {

  _entryAccessor = {
    keys: () => this.props.array.map((value, i) => i),
    entries: max => this.props.array.slice(0, max).map(
      (value, i) => [i, value, this._fieldDescriptor])
    // value: key => this.props.array[key],
    // fieldDescriptor: () => this._fieldDescriptor
  }

  get size() { return this.props.array.length; }

  _renderKey(key) {
    if (!this._isCollapsed) {
      return cE('data', {key, className: 'entry_key'}, key);
    }
  }
}

class MapField extends RepeatedOrMapField {

  _entryAccessor = {
    keys: () => Iterables.toArray(this.props.map.keys()),
    entries: max => {
      const entries = Iterables.slice(this.props.map.entries(), 0, max);
      return Iterables.toArray(entries).map(
        ([key, value]) => [key, value, this._fieldDescriptor]);
    }
    // value: key => this.props.map.get(key),
    // fieldDescriptor: () => this._fieldDescriptor
  }

  get size() { return this.props.map.size; }

  _renderKey(key) {
    return cE('data', {key, className: 'entry_key'}, JSON.stringify(key));
  }
}


function Scalar({value, type}) {
  return cE('data', {}, JSON.stringify(value));
}


const _COLLAPSED = '\u2026';


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
