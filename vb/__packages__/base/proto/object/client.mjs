
import assert from 'https://wiktortomczak.github.io/vb/__packages__/base/assert.mjs';
import Arrays from 'https://wiktortomczak.github.io/vb/__packages__/base/arrays.mjs';
import Classes from 'https://wiktortomczak.github.io/vb/__packages__/base/classes.mjs';
import Objects from 'https://wiktortomczak.github.io/vb/__packages__/base/objects.mjs';
import {PromiseExt} from 'https://wiktortomczak.github.io/vb/__packages__/base/promises.mjs';
import Types from 'https://wiktortomczak.github.io/vb/__packages__/base/types.mjs';

import {ContainerField, Field, FieldClassFactory, MapField, Message, RepeatedField, createMessageClassesFromFileDescriptorSetJson} from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/ext/message2.mjs';
import {TextDeserializer} from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/serializers/text.mjs';


export default class ObjectClient {

  // static async connect(serverAddress, remoteObjectPartitionStubClass) {
  //   const messageClient = await ...(serverAddress);
  //   return this.create(messageClient, remoteObjectPartitionStubClass);
  // }

  static create(messageClient, remoteObjectPartitionStubClass) {
    const rootPartition = remoteObjectPartitionStubClass.createRootClass().create();
    return new this(messageClient, rootPartition);
  }

  constructor(messageClient, rootPartition) {
    this._messageClient = messageClient;
    this._rootPartition = rootPartition;
    assert(!rootPartition._context._objectClient);
    rootPartition._context._objectClient = this;
    // this._serializer = new TextSerializer();
    this._deserializer = new TextDeserializer(this.constructor.messages);
    this._handleMessages();
    // this._listenObject([]);
  }

  get rootPartition() { return this._rootPartition; }

  _listenObject(path) {
    this._sendMessage(new this.constructor.messages.ListenObject(path));
  }

  _listenRepeatedFieldSlice(path, slice) {
    this._sendMessage(new this.constructor.messages.ListenObject(path));
  }

  async _call() {}  // TODO

  _sendMessage(message) {
    this._messageClient.sendMessage(this._serializer.serializeMessage(message));
  }

  _handleMessages() {
    const messages = this.constructor.messages;
    this._messageClient.onMessage(messageSerialized => {
      const message = this._deserializer.deserializeMessage(messageSerialized);
      if (message instanceof messages.PartitionUpdate) {
        this._handlePartitionUpdate(message);
      } else if (message instanceof messages.CallResult) {
        this._handleCallResult(message);
      } else {
        console.error(message);
      }
    });

  }

  _handlePartitionUpdate(update) {
    this._rootPartition._updatePartition(
      update.partitionPath, update.targetPath, update.op);
  }
}


class Partition {

  _updatePartition(partitionPath, targetPath, op) {
    throw Error('abstract method');
  }
}

Classes.interface(Partition);


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
    this._unresolvedReferences = {};
  }

  _getReference(path, referenceField) {
    try {
      var field = this._root._getFieldByPath(path);
    } catch (e) {
      return null;
    }
    if (field) {
      assert(field instanceof RemoteObject);
      return field;
    } else {
      const fieldPromise = new PromiseExt();
      Objects.setDefault(this._unresolvedReferences, path.toString(), [])
        .push({referenceField, fieldPromise});
      return fieldPromise;
    }
  }

  _resolveReferences(field) {
    const references = Objects.pop(this._unresolvedReferences, field.path().toString(), null);
    if (references) {
      assert(field instanceof RemoteObjectPartitionStub);
      for (const {referenceField, fieldPromise} of references) {
        fieldPromise.resolve(field);
        referenceField._value = field;  // TODO: Remove?
      }
    }
  }
};


export class RemoteObject extends Classes.mix(Partition, Message) {

  static *createSubclass(descriptor, fieldClassFactory) {
    for (let remoteObjectClass of super.createSubclass(descriptor, fieldClassFactory)) {
      if (descriptor.isPartitionRoot) {
        remoteObjectClass = RemoteObjectPartitionStub.createSubclass(remoteObjectClass);
      }
      yield remoteObjectClass;
    }
  }
  
  static create(parent, key, context, jso) {
    const remoteObject = super.create(parent, key, context, jso);
    context._resolveReferences(remoteObject);
    return remoteObject;
  }

  _updatePartition(partitionPath, targetPath, op) {
    assert(this.partition);  // TODO: Move to constructor.
    const subPartition = this._getFieldByPath(partitionPath);
    subPartition._partitionUpdate(targetPath, op);
  }

  _partitionUpdate(targetPath, op) {
    assert(this.partition);  // TODO: Move to constructor.

    if (!targetPath.length) {
      this._update(op);
    } else {
      const compositeField = this._getFieldByPath(targetPath.slice(0, -1));
      compositeField._updateField(Arrays.last(targetPath).key, op);
    }

    const update = {targetPath, op};
    this._postUpdates._emit(update);
    this._context._postUpdates._emit(update);
  }

  _call(method, ...args) {
    this._context._objectClient._call(this, method, ...args);  // TODO
  }
}


class RemoteObjectPartitionStub extends Classes.mix(Partition, RemoteField) {

  static createSubclass(remoteObjectClass) {
    return Classes.createClass(
      'Remote' + remoteObjectClass.name + 'PartitionStub', this, {},
      {_remoteObjectClass: remoteObjectClass});
  }

  static createRootClass() {
    return RemoteRootPartitionStub.createSubclass(this._remoteObjectClass);
  }

  static create(parent, key, context, jso) {
    assert(jso == 1);
    return new this(parent, key, context);
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

  get isUpToDate() {}
  
  _updatePartition(partitionPath, targetPath, op) {
    assert(!this._done);
    assert(!partitionPath.length);
    assert(!targetPath.length);
    assert(op.method == 'set');
    const field = this.constructor._remoteObjectClass.create(
      this._parent, this._key, this._context, op.data);
    this._setInParent(field);
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


class RemoteRootPartitionStub extends RemoteObjectPartitionStub {

  static create(objectClient) {
    const context = new RemoteField.Context(null, objectClient);
    return super.create(null, null, context, 1);
  }

  _setInParent(field) {
    field._context._root = field;
    const objectClient = this._context._objectClient;
    assert(Object.is(this, objectClient._rootPartition));
    objectClient._rootPartition = field;
  }
}


class RemoteContainerField extends ContainerField {
  
  static createSubclass(fieldType, fieldClassFactory) {
    assert(!fieldType.isPartitionRoot);  // TODO: Create RemoteRepeatedFieldPartition.
    if (fieldType.valueType.isMessage && fieldType.valueType.isPartitionRoot) {
      const containerClass = 
        fieldType.isRepeated || fieldType.isSet ? RemoteRepeatedObjectPartition :
        fieldType.isMap ? RemoteObjectPartitionMap :
        _error();
      return containerClass.createSubclass(
        fieldClassFactory.getOrCreateMessageClass(fieldType.valueType));
    } else {
      return super.createSubclass(fieldType, fieldClassFactory);
    }
  }
  
}


class RemoteRepeatedFieldPartition extends Classes.mix(Partition, RepeatedField) {

  static create(parent, key, context, size=0) {
    return new this(parent, key, context, size);
  }

  constructor(parent, key, context, size=0) {
    super(parent, key, context);
    assert(this.partition);
    this._entries = Array(size);
    this._slices = {};
  }

  values() { throw Error('deleted method'); }

  slice(start, stop) {
    const sliceStr = new Slice(start, stop).toString();
    let sliceOrPromise = this._slices[sliceStr];
    if (!sliceOrPromise) {
      sliceOrPromise = this._slices[sliceStr] = new PromiseExt();
      this._context._objectClient
        ._listenRepeatedFieldSlice(this.path(), start, stop);
    }
    return sliceOrPromise;
  }

  _partitionUpdate(targetPath, op) {
    if (targetPath.length == 1) {
      if (targetPath[0] instanceof ContainerField.Key) {
        this._updateField(targetPath, op);
    } else if (targetPath[0] instanceof Slice) {
        this._updateSlice(targetPath, op);
      } else {
        throw Error(targetPath[0]);
      }
    } else if (!targetPath.length) {
      // TODO
    } else {
      throw Error(targetPath);
    }

    // TODO: this._postUpdates._emit
  }

  _updateField(targetPath, op) {
    assert((targetPath.length == 1));
    const i = targetPath[0].key;

    super._updateField(i, op);

    const slicesToUpdate = 
      op.method == 'set' ? this._findSlicesContaining(i) :
      op.method == 'insert' ? this._findSlicesAtOrPast(i) :
      op.method == 'delete' ? this._findSlicesAtOrPast(i) :
     _error();
    let update;
    for (const slice of slicesToUpdate) {
      update = update || {targetPath, op};
      slice._postUpdates.emit(update);
    }
  }

  _updateSlice(targetPath, op) {
    assert((targetPath.length == 1));
    const sliceKey = targetPath[0];
    assert(op.method == 'set');

    Arrays.setSlice(this._entries, ...sliceKey, op.data);
    
    const sliceStr = sliceKey.toString();
    const sliceOrPromise = this._slices[sliceStr];
    if (!(sliceOrPromise instanceof this.constructor.Slice)) {
      const slice = this._slices[sliceStr] =
        new this.constructor.Slice(this, sliceKey);
      if (sliceOrPromise instanceof Promise) {
        sliceOrPromise.resolve(slice);
      }
    } else {
      sliceOrPromise._postUpdates.emit({targetPath, op});
    }
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
}


RemoteRepeatedFieldPartition.Slice = class Slice {

  constructor(field, slice) {
    this._field = field;
    this._slice = slice;
    this._postUpdates = new EventSource();
  }

  get array() { return this._field.slice(...this._slice); }
  get postUpdates() { return this._postUpdates; }
};



class RemoteObjectPartitionContainer extends RemoteContainerField {

  static createSubclass(remoteObjectPartitionStubClass) {
    assert(Classes.isSubclass(
      remoteObjectPartitionStubClass, RemoteObjectPartitionStub));
    const remoteObjectClass = remoteObjectPartitionStubClass._remoteObjectClass;
    return Classes.createClass(
      this._subclassName(remoteObjectClass.name), this, {},
      {_remoteObjectPartitionStubClass: remoteObjectPartitionStubClass});
  }

  static create(parent, key, context, size=0) {
    return new this(parent, key, context, size);
  }

  toJso() { return this.size; }
}

// TODO: Derive from RepeatedField / RepeatedFieldLike.
ContainerField.subclasses.push(RemoteContainerField);


// TODO: Derive from RepeatedField with valueClass = RemoteObjectPartitionStub.
class RemoteRepeatedObjectPartition extends RemoteObjectPartitionContainer {

  static _subclassName(objectClassName) {
    return 'RemoteRepeated' + objectClassName + 'Partition';
  }
  
  constructor(parent, key, context, size=0) {
    super(parent, key, context);
    this._entries = [];
    this._set(size);
  }

  get length() { return this._entries.length; }
  get size() { return this._entries.length; }
  get array() { return this._entries; }
  get isEmpty() { return !this._entries.length; }
  
  view(boundary) {
    return RepeatedField._viewClass.create(this, boundary);
  }

  _getField(i) {
    return this._entries[i];
  }

  _setField(i, field) {
    assert(Object.is(field._parent, this));
    assert(field._key == i);
    this._entries[i] = field;
  }

  _deleteField(i) {
    delete this._entries[i];
  }

  _set(size) {
    assert(Types.isNumber(size));
    if (this._entries.length && size != this._entries.length) {
      console.error('Size update should be sent via update not set');
    }
    if (this._entries.length > size) {
      this._entries.length = size;
    } else {
      const {_remoteObjectPartitionStubClass} = this.constructor;
      for (let i = this._entries.length; i < size; ++i) {
        const objectPartitionStub =
          _remoteObjectPartitionStubClass.create(this, i, this._context, 1);
        this._entries.push(objectPartitionStub);
      }
    }
  }

  _clear() {
    this._entries.length = 0;
  }
}

// TODO: Derive from MapField with valueClass = RemoteObjectPartitionStub.
class RemoteObjectPartitionMap extends RemoteObjectPartitionContainer {

  static _subclassName(objectClassName) {
    return 'Remote' + objectClassName + 'PartitionMap';
  }
  
  constructor(parent, key, context, size=0) {
    super(parent, key, context);
    this._entries = new Map();
    this._set(size);
  }

  get size() { return this._size; }
  get map() { return this._entries; }
  get isEmpty() { return !this._size; }

 
  view(boundary) {
    return MapField._viewClass.create(this, boundary);
  }

  _getField(key) {
    return this._entries.get(key);
  }

  _setField(key, field) {
    assert(Object.is(field._parent, this));
    assert(field._key == key);
    this._entries.set(key, field);
  }

  _deleteField(key) {
    this._entries.delete(key);
  }
  
  _set(size) {  // TODO
    assert(Types.isNumber(size));
    this._size = size;
  }

  _clear() {
    this._entries.clear();
  }
}


ObjectClient.messages = {
  
  PartitionUpdate: class PartitionUpdate {
    constructor(partitionPath, targetPath, op) {
      this.partitionPath = partitionPath;
      this.targetPath = targetPath;
      this.op = op;
    }
  },

  CallResult: class CallResult {
  },

  ListenObject: class ListenObject {
    constructor(path) {
      this.path = path;
    }
  }
};


export function createRemoteMessageClassesFromFileDescriptorSetJson(json) {
  return createMessageClassesFromFileDescriptorSetJson(
    json, new FieldClassFactory(RemoteObject, RemoteContainerField));
}
