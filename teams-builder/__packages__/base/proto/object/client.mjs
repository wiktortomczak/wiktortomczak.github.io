
import assert from 'base/assert.mjs';
import Arrays from 'base/arrays.mjs';
import Classes from 'base/classes.mjs';
import Connection from 'base/connection.mjs';
import Event from 'base/event.mjs';
import EventSource from 'base/event-source.mjs';
import Iterables from 'base/iterables.mjs';
import Objects from 'base/objects.mjs';
import {PromiseExt} from 'base/promises.mjs';
import Slice from 'base/slice.mjs';
import Types from 'base/types.mjs';

import {ContainerField, Field, FieldClassFactory, MapField, Message, RepeatedField, createMessageClassesFromFileDescriptorSetJson} from 'base/proto/ext/message2.mjs';
import {TextDeserializer, TextSerializer} from 'base/proto/serializers/text.mjs';


export default class ObjectClient {

  static async connect(serverAddress, remoteObjectClass) {
    const connection = await Connection.open(serverAddress);
    return this.create(connection, remoteObjectClass);
  }

  static create(connection, remoteObjectClass, serializer, deserializer) {
    const rootPartition = new remoteObjectClass.Stub();
    return new this(connection, rootPartition, serializer, deserializer);
  }

  constructor(connection, rootPartition, serializer, deserializer) {
    this._connection = connection;
    this._rootPartition = rootPartition;
    assert(!rootPartition._context._objectClient);
    rootPartition._context._objectClient = this;
    this._serializer = serializer || new TextSerializer(this.constructor.messages);
    this._deserializer = deserializer || new TextDeserializer(this.constructor.messages);
    this._nextCallId = 1;
    this._handleMessages();

    // Calls this._listenObject([]).
    rootPartition.then(remoteObject => this._rootPartition = remoteObject);
  }

  get rootPartition() { return this._rootPartition; }

  _listenObject(path) {
    this._sendMessage(
      new this.constructor.messages.ListenObject(this._nextCallId++, path));
  }

  async _call() {}  // TODO

  _sendMessage(message) {
    this._connection.sendMessage(this._serializer.serializeMessage(message));
  }

  _handleMessages() {
    const messages = this.constructor.messages;
    this._connection.onMessage(messageSerialized => {
      const message = this._deserializer.deserializeMessage(messageSerialized);
      if (message instanceof messages.PartitionUpdate) {
        this._handlePartitionUpdate(message);
      } else if (message instanceof messages.CompoundUpdate) {
        this._handleCompoundUpdate(message);
      } else if (message instanceof messages.CallResult) {
        this._handleCallResult(message);
      } else if (message instanceof messages.ListenObjectEnd) {
        this._handleListenObjectEnd(message);
      } else {
        console.error(message);
      }
    });
  }

  _handlePartitionUpdate(update) {
    const {partitionPath, targetPath, op} = update;
    const partition = this._getOrCreatePartition(partitionPath);
    partition._updatePartition({targetPath, op});
  }

  _getOrCreatePartition(path) {
    if (!path.length) {
      var partition = this._rootPartition;
    } else {
      const compositeField = this._rootPartition._getFieldByPath(path.slice(0, -1));
      const key = Arrays.last(path).key;
      try {
        partition = compositeField._getField(key);
      } catch (e) {
        // TODO: Assert compositeField.key is RemoteObject.
        partition = compositeField._createSetField(key, 1);
      }
    }
    assert(partition.partition || partition instanceof RemoteObjectPartition.Stub);
    return partition;
  }

  _handleCompoundUpdate(update) {
    // TODO
  }

  _handleCallResult(callResult) {
    // TODO
  }

  _handleListenObjectEnd({path}) {
    const partition = this._rootPartition._getFieldByPath(path);
    assert(partition.partition || partition instanceof RemoteObjectPartition.Stub);
    partition._setIsUpToDate(false);
  }
}


class RemoteField extends Field {

  constructor(parent, key, context) {
    super(parent, key);
    this._context = context;
  }
}


RemoteField.Context = class Context extends Message.Context {

  constructor(root, objectClient) {
    super(root);
    this._objectClient = objectClient;
  }
};


export class RemoteObject extends Message {

  static createSubclass(descriptor, fieldClassFactory) {  // Generator.
    if (descriptor.isPartitionRoot) {
      return RemoteObjectPartition.createSubclass(descriptor, fieldClassFactory);
    } else {
      return super.createSubclass(descriptor, fieldClassFactory);
    }
  }

  _call(method, ...args) {
    this._context._objectClient._call(this, method, ...args);  // TODO
  }
}


class RemoteObjectPartition extends RemoteObject {

  static *createSubclass(descriptor, fieldClassFactory) {
    for (let remoteObjectClass of Message.createSubclass.call(this, descriptor, fieldClassFactory)) {
      remoteObjectClass.Stub = this.Stub.createSubclass(remoteObjectClass);
      yield remoteObjectClass;
    }
  }

  static create(parent, key, context, jso) {
    if (jso == 1) {
      return new this.Stub(parent, key, context);
    } else if (Types.isObject(jso)) {
      return super.create(parent, key, context, jso);
    } else {
      throw Error(jso);
    }
  }

  constructor(parent, key, context, jso) {
    assert(jso === undefined);
    super(parent, key, context);
    this._isUpToDate = true;
  }

  get isUpToDate() { return this._isUpToDate; }

  _setIsUpToDate(isUpToDate) {
    assert(!isUpToDate);
    this._isUpToDate = false;
    this._postUpdates._emit();
    this._context._postUpdates._emit(this);
  }
}

RemoteObjectPartition.Stub = class Stub extends RemoteField {

  static createSubclass(remoteObjectClass) {
    return Classes.createClass(
      'Remote' + remoteObjectClass.name + 'PartitionStub', this, {},
      {_remoteObjectClass: remoteObjectClass});
  }

  constructor(parent, key, context) {
    if (!context) {
      context = new new.target.Context;
    }
    super(parent, key, context);
  }
  
  view(boundary) {
    return this.constructor._remoteObjectClass._viewClass.create(this, boundary);
  }
  
  then(resolve, reject) {
    assert(!this._done);
    if (!this._partitionPromise) {
      this._context._objectClient._listenObject(this.path());
      this._partitionPromise = new PromiseExt();
    }
    this._partitionPromise.then(resolve, reject);
  }

  toJso() { return 1; }

  _updatePartition({targetPath, op}) {
    assert(!targetPath.length);
    assert(op.method == 'set');
    this._set(op.data);
  } 

  _set(jso) {
    assert(!this._done);
    const field = this.constructor._remoteObjectClass.create(
      this._parent, this._key, this._context, jso);
    if (this._parent) {
      this._setInParent(field);
    }
    if (this._partitionPromise) {
      this._partitionPromise.resolve(field);
    }
    this._done = true;
  }

  _setInParent(field) {
    assert(Object.is(this._parent._getField(this._key), this));
    field._setInParent();
  }
}


class RemoteContainerField extends ContainerField {

  static _getBaseClass(fieldType) {
    if (fieldType.isPartitionRoot) {
      return fieldType.isRepeated ? RemoteRepeatedFieldPartition : 
             fieldType.isMap ? RemoteMapFieldPartition : 
             fieldType.isSet ? RemoteSetFieldPartition : 
             _error();
    } else if (fieldType.valueType.isMessage && fieldType.valueType.isPartitionRoot) {
      return fieldType.isRepeated ? RemoteRepeatedObjectPartition : 
             fieldType.isMap ? RemoteObjectPartitionMap : 
             _error();
    } else {
      return super._getBaseClass(fieldType);
    }
  }
}

class RemoteRepeatedFieldBase extends RepeatedField {

  static create(parent, key, context, size=0) {
    return new this(parent, key, context, size);
  }

  constructor(parent, key, context, size=0) {
    super(parent, key, context);
    this._entries = [];
    this._set(size);
    this._slices = {};
  }

  // TODO: Move to RemoteContainerField parent class.
  toJso() { return this._entries.length; }
  
  values() { throw Error('deleted method'); }

  slice(start, stop) {
    const slice = new Slice(start, stop);
    const sliceStr = slice.toString();
    let sliceOrPromise = this._slices[sliceStr];
    if (!sliceOrPromise) {
      sliceOrPromise = this._slices[sliceStr] = new PromiseExt();
      const path = this.path();
      path.push(new ContainerField.SliceKey(slice));
      this._context._objectClient._listenObject(path);
    }
    return sliceOrPromise;
  }

  _updateField(indexOrSlice, op) {
    if (indexOrSlice instanceof Slice) {
      this._updateSlice(indexOrSlice, op);
      return;
    }

    const i = indexOrSlice;
    super._updateField(i, op);

    const slicesToUpdate = 
      op.method == 'set' ? this._findSlicesContaining(i) :
      op.method == 'insert' ? this._findSlicesAtOrPast(i) :
      op.method == 'delete' ? this._findSlicesAtOrPast(i) :
     _error();
    let update;
    for (const slice of slicesToUpdate) {
      update = update || {i, op};
      slice._postUpdates._emit(update);
    }
  }

  _updateSlice(sliceKey, op) {
    assert(op.method == 'set');

    if (op.data.length) {
      assert(sliceKey.start + op.data.length <= this._entries.length);
    }
    let i = sliceKey.start;
    for (const jso of op.data) {
      this._entries[i] = this._createField(i, jso);
      ++i;
    }
    
    const sliceStr = sliceKey.toString();
    const sliceOrPromise = this._slices[sliceStr];
    if (!(sliceOrPromise instanceof this.constructor.Slice)) {
      const slice = this._slices[sliceStr] =
        new this.constructor.Slice(this, sliceKey);
      if (sliceOrPromise instanceof Promise) {
        sliceOrPromise.resolve(slice);
      }
    } else {
      sliceOrPromise._postUpdates._emit({sliceKey, op});
    }
  }

  _set(size) {
    assert(Types.isNumber(size));
    if (this._entries.length && size != this._entries.length) {
      console.error('Size update should be sent via update not set');
    }
    this._entries.length = size;
  }

  _findSlicesContaining(i) {
    return Iterables.filter(
      Objects.iterValues(this._slices),
      slice => slice._slice.contains(i));
  }

  _findSlicesAtOrPast(i) {
    return Iterables.filter(
      Objects.iterValues(this._slices),
      slice => slice._slice.stop >= i);
  }

  _createSetField(i, jso) {
    assert(i < this._entries.length);
    const field = this._createField(i, jso);
    this._entries[i] = field;
    return field;
  }    
}

RemoteRepeatedFieldBase.Slice = class Slice {

  constructor(field, slice) {
    this._field = field;
    this._slice = slice;
    this._postUpdates = new EventSource();
  }

  toArray() { return this._field._entries.slice(...this._slice); }
  get(i) { return this._field.get(i + this._slice.start); }
  
  get postUpdates() { return this._postUpdates; }
};


class RemoteRepeatedFieldPartition extends RemoteRepeatedFieldBase {

  constructor(...args) {
    super(...args);
    assert(this.partition);
  }
}


class RemoteMapFieldBase extends MapField {

  constructor(parent, key, context, size=0) {
    super(parent, key, context);
    this._set(size);
  }

  get size() { return this._size; }
  get isEmpty() { return !this._size; }

  // TODO: Move to RemoteContainerField parent class.
  toJso() { return this._size; }
  
  _set(size) {
    assert(Types.isNumber(size));
    this._size = size;
  }

  _clear() {
    super._clear();
    this._size = 0;
  }
}


class RemoteMapFieldPartition extends RemoteMapFieldBase {

  constructor(...args) {
    super(...args);
    assert(this.partition);
  }
}


const RemoteSetFieldPartition = RemoteRepeatedFieldPartition;  // TODO


class RemoteRepeatedObjectPartition extends RemoteRepeatedFieldBase {

  constructor(...args) {
    super(...args);
    assert(Classes.isSubclass(
      this.constructor._valueClass,
      RemoteObjectPartition));
  }

  get(i) {
    return this._entries[i] || this._createSetField(i, 1);
  }

  // TODO
  // static _subclassName(objectClassName) {
  //   return 'RemoteRepeated' + objectClassName + 'Partition';
  // }
}


class RemoteObjectPartitionMap extends RemoteMapFieldBase {

  constructor(...args) {
    super(...args);
    assert(Classes.isSubclass(
      this.constructor._valueClass,
      RemoteObjectPartition));
  }

  get(key) {
    return this._entries.get(key) || this._createSetField(key, 1);
  }

  // TODO
  // static _subclassName(objectClassName) {
  //   return 'Remote' + objectClassName + 'PartitionMap';
  // }
}


ObjectClient.messages = {
  
  PartitionUpdate: class PartitionUpdate {
    constructor(partitionPath, targetPath, op) {
      this.partitionPath = partitionPath;
      this.targetPath = targetPath;
      this.op = op;
    }
  },

  CompoundUpdate: class CompoundUpdate {
  },

  CallResult: class CallResult {
  },

  ListenObject: class ListenObject {
    constructor(callId, path) {
      this.callId = callId;
      this.path = path;
    }
  },

  ListenObjectEnd: class ListenObjectEnd {
    constructor(path) {
      this.path = path;
    }
  }
};


export function createRemoteMessageClassesFromFileDescriptorSetJson(json) {
  return createMessageClassesFromFileDescriptorSetJson(
    json, new FieldClassFactory(RemoteObject, RemoteContainerField));
}
