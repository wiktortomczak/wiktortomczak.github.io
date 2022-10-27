
import React from 'react';
import ReactDOM from 'react-dom'; 

import assert from 'base/assert.mjs';
import Classes from 'base/classes.mjs';
import {createAppendDiv, createStyle} from 'base/dom.mjs';
import MessageDescriptor from 'base/proto/ext/descriptor.mjs';
import {BoundaryMessage, BoundaryContainer, ContainerField, Message, RepeatedField, MapField, ScalarField, ReferenceField, Field} from 'base/proto/ext/message2.mjs';
import ObjectClient, {createRemoteMessageClassesFromFileDescriptorSetJson} from 'base/proto/object/client.mjs';
import {cE, fragment, AsyncStateComponent} from 'base/react.mjs';

import {messageFileDescriptorSetJson} from '/tgtgbot/tgtgbot.pbext.mjs';


MessageDescriptor._registry = {};
const remoteObjectClasses =
  createRemoteMessageClassesFromFileDescriptorSetJson(messageFileDescriptorSetJson);

// TODO: Compute automatically.
remoteObjectClasses['.TGTGBot'].partitionBoundary = {
  store: BoundaryContainer, user: BoundaryContainer, item: BoundaryContainer
};
remoteObjectClasses['.TGTGBot']._containerFieldClasses['item'].partitionBoundary = BoundaryContainer;
remoteObjectClasses['.Store'].partitionBoundary = {item: BoundaryContainer};
remoteObjectClasses['.Item'].partitionBoundary = {availability: BoundaryContainer};
remoteObjectClasses['.Item.Availability'].partitionBoundary = {numItems: BoundaryMessage};
remoteObjectClasses['.Timeseries'].partitionBoundary = {timestamp: BoundaryContainer, value: BoundaryContainer};


async function main() {
  const client = await ObjectClient.connect(
    'ws://127.0.0.1:8001/api',
    remoteObjectClasses['.TGTGBot']);
  const root = await client.rootPartition;
  ReactDOM.render(cE(ObjectBrowser, {root}), createAppendDiv());
}


class ObjectBrowser extends AsyncStateComponent {

  constructor(props) {
    super(props);
    this._partitions = [this._root];
    this._listenMessages();
  } 

  get _root() { return this.props.root; }

  render() {
    return this._partitions.map(partition => (
      cE(Partition, {key: partition.path().toString(), partition})));
  }

  _listenMessages() {
    this._root.context.messages.listen(message => {
      if (message.partition) {
        const partitions = this._partitions.push(message);
        this.forceUpdate();
      }
    });
  }
}


class Partition extends AsyncStateComponent {

  get _partition() { return this.props.partition; }

  render() {
    let className = 'partition';
    if (!this._partition.isUpToDate) {
      className += ' stale';
    }
    return cE('div', {className}, fragment(
      cE('label', {}, this._partition.path().toString()),
      cE('pre', {}, new ObjectRenderer().renderRoot(this._partition.partition.includeBoundary()))
    ));
  }

  componentDidMount() {
    super.componentDidMount();
    this._partitionListener =
      this._partition.postUpdates.listen(() => this.forceUpdate());
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this._partitionListener.remove();
    delete this._partitionListener;
  }
  
  UNSAFE_componentWillReceiveProps(nextProps) {
    assert(Object.is(nextProps.partition, this.props.partition));
  }
}


class ObjectRenderer {

  constructor() {
    this._indent = '';
    this._fragments = [];
  }

  renderRoot(object) {
    this._startLine();
    this._renderObject(object);
    return this._fragments;
  }

  _renderObject(object) {
    // builder.addLine();
    this._addToken('{');
    this._endLine();
    this._increaseIndent();
    for (const [fieldName, field] of object.entries()) {
      if (!ContainerField.isEmpty(field)) {
        this._startLine();
        this._addToken(fieldName);
        this._addToken(': ');
        this._renderField(field);
        this._endLine();
      }
    }
    this._decreaseIndent();
    this._addLine('}');
  }

  _renderRepeatedField(field) {
    this._addToken('[');
    this._endLine();
    this._increaseIndent();
    const renderValue = Classes.isSubclass(field.constructor._valueClass, ReferenceField) ?
      this._renderReference.bind(this) : this._renderFieldOrValue.bind(this);
    for (const value of field.values()) {
      this._startLine();
      renderValue(value);
      this._endLine();
    }
    this._decreaseIndent();
    this._addLine(']');
  }

  _renderMapField(field) {
    this._addToken('{');
    this._endLine();
    this._increaseIndent();
    const renderValue = Classes.isSubclass(field.constructor._valueClass, ReferenceField) ?
      this._renderReference.bind(this) : this._renderFieldOrValue.bind(this);
    for (const [key, value] of field.entries()) {
      this._addToken(JSON.stringify(key));
      this._addToken(': ');
      this._startLine();
      renderValue(value);
      this._endLine();
    }
    this._decreaseIndent();
    this._addLine('}');
  }

  _renderBoundary(boundary) {
    this._renderValue(boundary.toJso());
  }

  _renderValue(value) {
    this._addToken(JSON.stringify(value));
  }

  _renderReference(fieldOrUnresolvedReference) {
    this._addToken(fieldOrUnresolvedReference.path().toString());
  }

  _renderField(field) {
    if (field instanceof Message) {
      this._renderObject(field);
    } else if (field instanceof RepeatedField) {
      this._renderRepeatedField(field);
    } else if (field instanceof MapField) {
      this._renderMapField(field);
    } else if (field instanceof ScalarField) {
      this._renderValue(field.value);
    } else if (field instanceof ReferenceField) {
      this._renderReference(field.value);
    } else if (field instanceof BoundaryMessage ||
               field instanceof BoundaryContainer) {
      this._renderBoundary(field);
    }
  }

  _renderFieldOrValue(fieldOrValue) {
    if (fieldOrValue instanceof Field) {
      this._renderField(fieldOrValue);
    } else {
      this._renderValue(fieldOrValue);
    }
  }

  _increaseIndent() {
    this._indent += '  ';
  }

  _decreaseIndent() {
    this._indent = this._indent.slice(0, -2);
  }

  _addToken(token) {
    this._fragments.push(token);
  }
  
  _startLine() {
    this._fragments.push(this._indent);
  }

  _endLine() {
    this._fragments.push('\n');
  }

  _addLine(token) {
    this._startLine();
    this._addToken(token);
  }
}


createStyle(`
.partition {
  border: 1px solid black;
  padding: 4px;
  margin-bottom: 10px;
}

label {
  font-family: monospace;
  font-weight: bold;
  margin-bottom: 1px solid black;
}

.stale {
  background-color: #eee;
}
`);


main();
