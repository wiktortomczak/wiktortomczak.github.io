
import Arrays from 'base/arrays.mjs';
import assert from 'base/assert.mjs';
import Classes from 'base/classes.mjs';
import EventSource from 'base/event-source.mjs';
import Iterables from 'base/iterables.mjs';
import Objects from 'base/objects.mjs';
import {PromiseExt} from 'base/promises.mjs';
import Slice from 'base/slice.mjs';
import Types from 'base/types.mjs';

import MessageDescriptor from 'base/proto/ext/descriptor.mjs';


class FieldLike {

  get parent() { throw Error('abstract method'); }
  get key() { throw Error('abstract method'); }

  path() {
    const path = new Path();
    let field = this;
    while (field.parent) {
      path.push(field.pathKey());
      field = field.parent;
    }
    return path.reverse();
  }

  // TODO: Fix multiple inheritance eg.
  // https://github.com/fasttime/Polytype
  // https://gist.github.com/kmdavis/4b93f5cb10f6c72209e1d7f705d46ed2
  //
  // toJso() {
  //   throw Error('abstract method');
  // }
}

Classes.interface(FieldLike);


export class Field extends FieldLike {

  constructor(parent, key) {
    super();
    this._parent = parent;
    this._key = key;
  }

  get parent() { return this._parent; }
  get key() { return this._key; }

  pathKey() { return new this._parent.constructor.Key(this._key); }

  _update(op) {
    const {method, data} = op;
    if (method == 'set') {
      this._set(data);
    } else if (method == 'update') {
      this._applyDiff(data);
    } else {
      throw Error(method);
    }
  }

  _setInParent() {
    this._parent._setField(this._key, this);
  }
}


class ScalarOrReferenceField extends Field {

  constructor(parent, key, value) {
    super(parent, key);
    this._value = value;
  }

  get value() { return this._value; }

  _applyDiff(diffJso) {
    throw Error('not implemented');
  }
}


export class ScalarField extends ScalarOrReferenceField {

  static create(parent, key, context, scalar) {
    return new this(parent, key, scalar);
  }

  toJso() { return this._value; }

  _set(scalar) {
    this._value = scalar;
  }
}

export class ReferenceField extends ScalarOrReferenceField {

  static create(parent, key, context, path) {
    const field = new this(parent, key, context);
    field._set(path);
    return field;
  }

  constructor(parent, key, context) {
    super(parent, key);
    this._context = context;
  }

  toJso() { return this.constructor._valueToJso(this._value); }

  _set(path) {
    this._value = this.constructor._valueFromPath(path, this._context);
    if (this._value.then) {
      this._value.then(message => this._value = message);
    }
  }

  static _valueFromPath(path, context) {
    assert(path !== undefined);
    try {
      return context._root._getFieldByPath(path);
    } catch (e) {
      if (e instanceof FieldNotFoundError) {
        return context._getOrCreateUnresolvedReference(path);
      } else {
        throw e;
      }
    }
  }

  static _valueToJso(messageOrUnresolvedReference) {
    return messageOrUnresolvedReference.path().toString();
  }
}

class UnresolvedReference {

  constructor(path) {
    this._path = path;
    this._messagePromise = new PromiseExt();
  }

  path() { return this._path; }

  then(resolve, reject) {
    this._messagePromise.then(resolve, reject);
  }

  resolve(message) {
    this._messagePromise.resolve(message);
  }
}


// class CompositeFieldLike extends FieldLike {
//
//   get isEmpty() {
//     throw Error('abstract method');
//   }
// }


class CompositeField extends Field {

  constructor(parent, key, context) {
    super(parent, key);
    this._context = context;
    this._PartitionRootMixin_constructor &&
      this._PartitionRootMixin_constructor();  // TODO
    // this._entries;
  }

  get context() { return this._context; }

  view(boundary) {
    return this.constructor._viewClass.create(this, boundary);
  }

  _updateField(key, op) {
    if (op.method == 'set') {
      this._getOrCreateSetField(key, op.data);
    } else if (op.method == 'delete') {
      this._deleteField(key);  // TOOD: Call from Field._delete().
    } else {
      throw Error('not implemented');
    }
  }

  _getFieldByPath(path) {
    let field = this;
    for (const {key} of path) {
      field = field._getField(key);
    }
    return field;
  }

  _set(jso) {
    throw Error('abstract method');
  }

  _applyDiff(diffJso) {
    throw Error('abstract method');
  }

  _clear() {
    throw Error('abstract method');
  }  

  _createField(key, fieldClass, jso) {
    return fieldClass.create(this, key, this._context, jso);
  }

  _getField(key) {
    throw Error('abstract method');
  }

  _getOrCreateSetField(key, jso) {
    throw Error('abstract method');
  }

  _createSetField(key, jso) {
    throw Error('abstract method');
  }

  _deleteField(key) {
    throw Error('abstract method');
  }
}


class PartitionRootMixin {

  static createSubclass(fieldType) {
    const {partitionBoundary} = fieldType;
    return Classes.createClass(this.name, this, {}, {partitionBoundary});
  }

  _PartitionRootMixin_constructor() {  // TODO
    const {_viewClass, partitionBoundary} = this.constructor;
    this._partition = _viewClass.create(this, partitionBoundary);
    this._postUpdates = new EventSource();
  }

  get partition() { return this._partition; }
  get postUpdates() { return this._postUpdates; }

  _updatePartition(update) {
    const {targetPath, op} = update;

    if (!targetPath.length) {
      this._update(op);
    } else {
      const compositeField = targetPath.length > 1 ?
        this._getFieldByPath(targetPath.slice(0, -1)) : this;
      compositeField._updateField(Arrays.last(targetPath).key, op);
    }

    // TODO
    // assert(this._context._unresolvedReferences.isEmpty);

    this._postUpdates._emit(update);
    this._context._postUpdates._emit(this, update);
  }
}


class Context {

  constructor(root) {
    this._root = root;
    this._postUpdates = new EventSource();
    this._messages = new EventSource();
    this._unresolvedReferences = new PathMap(path => new UnresolvedReference(path));
  }

  get postUpdates() { return this._postUpdates; }
  get messages() { return this._messages; }

  _getOrCreateUnresolvedReference(path) {
    return this._unresolvedReferences.setDefault(path);
  }

  _notifyMessage(message) {
    this._tryResolveReference(message);
    this._messages._emit(message);
  }

  _tryResolveReference(message) {
    const unresolvedReference = this._unresolvedReferences.pop(message.path());
    unresolvedReference && unresolvedReference.resolve(message);
  }
}


class MessageLike extends FieldLike {

  toJso() {
    const jso = {};
    for (const [fieldName, field] of this.entries()) {
      if (!ContainerField.isEmpty(field)) {
        jso[fieldName] = field.toJso();
      }
    }
    return jso;
  }

  get isEmpty() {
    for (const [_, field] of this.entries()) {
      if (!ContainerField.isEmpty(field)) {
        return false;
      }
    }
    return true;
  }

  entries() {
    throw Error('abstract method');
  }
}

Classes.interface(MessageLike);


export class Message extends Classes.mix(MessageLike, CompositeField) {

  static *createSubclass(descriptor, fieldClassFactory) {
    const messageClass = Classes.createClass(descriptor.name, this, {}, {});
    yield messageClass;

    messageClass._createFieldProperties(descriptor);
    messageClass._createFieldClasses(descriptor, fieldClassFactory);
    if (descriptor.isPartitionRoot) {
      const mixinClass = MessagePartitionRootMixin.createSubclass(descriptor);
      Classes.mixInto(mixinClass, messageClass);
    }
  }

  static create(parent, key, context, jso) {
    const message = new this(parent, key, context);
    message._setCleared(jso);
    return message;
  }

  constructor(parent, key, context) {
    if (!context) {
      var newContext = context = new new.target.Context;
    }
    super(parent, key, context);
    if (!context._root) {
      context._root = this;
    }
    this._entries = {};
    this._createContainerFields();
    this._context._notifyMessage(this);
  }

  _createContainerFields() {
    Objects.forEach(
      this.constructor._containerFieldClasses, (containerClass, fieldName) => {
        this._entries[fieldName] =
          new containerClass(this, fieldName, this._context);
    });
  }

  entries() {
    return Object.entries(this._entries);  // TODO: Iterator.
  }

  has(fieldName) {
    assert(this.constructor._unaryFieldClasses[fieldName]);
    return fieldName in this._entries;
  }

  _set(jso) {
    this._clear();
    this._setCleared(jso);
  }

  _setCleared(jso) {
    assert(this.isEmpty);
    Objects.forEach(jso, (fieldJso, fieldName) => {
      this._getOrCreateSetField(fieldName, fieldJso);
    });
  }

  _applyDiff(diffJso) {
    Objects.forEach(diffJso, (fieldDiffJso, fieldName) => {
      if (fieldDiffJso !== null) {
        // TODO: If field does not exist, set value in create.
        this._getOrCreateSetField(fieldName)._applyDiff(fieldDiffJso);
      } else {
        this._deleteField(fieldName);
      }
    });
  }

  _clear() {
    const containerEntries = [];
    Objects.forEach(this._entries, (field, fieldName) => {
      if (field instanceof ContainerField) {  // TODO: ContainerField.isInstance?
        containerEntries.push([fieldName, field]);
      }
    });

    this._entries = Object.fromEntries(containerEntries);
    Objects.mapValues(this._entries, container => container._clear());
  }

  _getOrCreateSetField(fieldName, jso) {
    const field = this._entries[fieldName];
    if (field) {
      field._set(jso);
    } else {
      this._createSetField(fieldName, jso);
    }
  }

  _createSetField(fieldName, jso) {
    return this._entries[fieldName] = this._createField(fieldName, jso);
  }

  _createField(fieldName, jso) {
    const fieldClass = this.constructor._unaryFieldClasses[fieldName];
    return super._createField(fieldName, fieldClass, jso);
  }

  _getField(fieldName) {
    const field = this._entries[fieldName];
    if (!field) {
      throw new FieldNotFoundError();
    }
    return field;
  }

  _setField(fieldName, field) {
    assert(Object.is(field._parent, this));
    assert(field._key == fieldName);
    this._entries[fieldName] = field;
  }
  
  _deleteField(fieldName) {
    assert(this._entries[fieldName]);
    delete this._entries[fieldName];
  }

  static _createFieldProperties(descriptor) {
    // Define field getters and setters.
    Objects.forEach(descriptor.fields, fieldDescriptor => {
      Object.defineProperty(this.prototype, fieldDescriptor.nameJson, {
        get: this._createGetter(fieldDescriptor)
      });
    });
  }

  static _createGetter(fieldDescriptor) {
    const {nameJson, type} = fieldDescriptor;
    return (type.isUnary && 
            (type.valueType.isScalar || type.valueType.isReference)) ?
      function () { return this._getField(nameJson).value; } :
      function () { return this._getField(nameJson); };
  }

  static _createFieldClasses(descriptor, fieldClassFactory) {
    this._unaryFieldClasses = {};
    this._containerFieldClasses = {};
    Objects.forEach(descriptor.fields, ({type}, fieldName) => {
      (type.isUnary
       ? this._unaryFieldClasses
       : this._containerFieldClasses)[fieldName] =
        fieldClassFactory.createFieldClass(type);
    });
  }

  static _createPending(descriptor) {
    return Classes.createClass(descriptor.name, this, {}, {pending: true});
  }
}

Message.Context = Context;
Message._registry = {};


class MessagePartitionRootMixin extends PartitionRootMixin {

  static createSubclass(messageDescriptor) {
    const className = messageDescriptor.name + 'PartitionRootMixin';
    const {partitionBoundary} = messageDescriptor;
    return Classes.createClass(className, this, {}, {partitionBoundary});
  }
}


// class ContainerFieldLike extends FieldLike {
//
//   get size() {
//     throw Error('abstract method');
//   }
// }


export class ContainerField extends CompositeField {

  static createSubclass(fieldType, fieldClassFactory) {
    const baseClass = this._getBaseClass(fieldType);
    const mixinClass =
      fieldType.valueType.isScalar ? ScalarEntriesMixin : 
      fieldType.valueType.isReference ? ReferenceEntriesMixin :
      fieldType.valueType.isMessage ? MessageEntriesMixin :
      _error();
    const _valueClass = fieldClassFactory.createUnaryFieldClass(fieldType.valueType);
    const classNameFormat =
       fieldType.isRepeated ? name => 'Repeated' + name :
       fieldType.isMap ? name => name + 'Map' :
       fieldType.isSet ? name => name + 'Set' :
       _error();
    const className = classNameFormat(_valueClass.name.replace('Field', ''));
    const class_ = Classes.createClass(className, [baseClass, mixinClass], {}, {_valueClass});
    if (fieldType.isPartitionRoot) {
      Classes.mixInto(PartitionRootMixin.createSubclass(fieldType), class_);
    }
    return class_;
  }

  static _getBaseClass(fieldType) {
    return fieldType.isRepeated ? RepeatedField : 
           fieldType.isMap ? MapField : 
           fieldType.isSet ? SetField : 
           _error();
  }

  static isEmpty(container) {  // TODO: Move to ContainerFieldLike.
    return (container instanceof this || (
      this.subclasses.some(c => Classes.isSubclass(container.constructor, c))))
      && container.isEmpty;
  }

  _valueToJso(value) {
    return value.toJso();
  }

  _createField(key, jso) {
    return super._createField(key, this.constructor._valueClass, jso);
  }
}

ContainerField.subclasses = [];  // TODO: Fix multiple inheritance.


class RepeatedFieldLike extends FieldLike {

  get length() {
    throw Error('abstract method');
  }

  toArray() {
    return Iterables.toArray(this.values());
  }

  toJso() {
    return Iterables.map(this.values(), value => this._valueToJso(value));
  }

  values() {  // Array or iterable.
    throw Error('abstract method');
  }
}

Classes.interface(RepeatedFieldLike);



export class RepeatedField extends Classes.mix(RepeatedFieldLike, ContainerField) {

  constructor(parent, key, context) {
    super(parent, key, context);
    this._entries = [];  // TODO: Init entries in create / constructor.
  }

  get length() { return this._entries.length; }
  get size() { return this._entries.length; }
  get isEmpty() { return !this._entries.length; }

  values() { return this._entries; }

  get(i) { return this._entries[i]; }

  _updateField(i, op) {
    if (op.method == 'insert') {
      this._insert(i, op.data);
    } else {
      super._updateField(i, op);
    }
  }

  _set(jso) {
    this._clear();
    let i = 0;
    for (const fieldJso of jso) {
      this._entries.push(this._createField(i++, fieldJso));
    }
  }

  _insert(i, jso) {
    assert(i <= this._entries.length);
    Arrays.insertAt(this._entries, i, this._createField(i, jso));
    // TOOD: Update .key of all later messages.
  }

  _pop(i) {
    this._deleteField(i);
  }

  _applyDiff(diffJso) {
    throw Error('not implemented');
  }

  _clear() {
    this._entries.length = 0;
  }  

  _getField(i) {
    const field = this._entries[i];
    if (field === undefined) {
      throw new FieldNotFoundError();
    }
    return field;
  }

  _getOrCreateSetField(i, jso) {
    if (i < this._entries.length) {
      this._setFieldValue(i, jso);
    } else {
      this._createSetField(i, jso);
    }
  }

  _createSetField(i, jso) {
    assert(i == this._entries.length);
    const field = this._createField(i, jso);
    this._entries.push(field);
    return field;
  }    

  _setField(i, field) {
    assert(i < this._entries.length);
    this._entries[i] = field;
  }

  _setFieldValue(i, jso) {
    const field = this._getField(i);
    field._set(jso);
  }

  _deleteField(i) {
    assert(i <= this._entries.length); 
    Arrays.removeAt(this._entries, i);
    // TOOD: Update .key of all later messages.
  }
}


class MapFieldLike extends FieldLike {

  get length() {
    throw Error('abstract method');
  }

  toMap() {
    return Iterables.toMap(this.entries());
  }

  toJso() {
    const jso = {};
    for (const [key, value] of this.entries()) {
      jso[key] = this._valueToJso(value);
    };
    return jso;
  }

  entries() {  // Iterable.
    throw Error('abstract method');
  }
}

Classes.interface(MapFieldLike);



export class MapField extends Classes.mix(MapFieldLike, ContainerField) {

  constructor(parent, key, context) {
    super(parent, key, context);
    this._entries = new Map();  // TODO: Init entries in create / constructor.
  }

  get size() { return this._entries.size; }
  get isEmpty() { return !this._entries.size; }
  entries() { return this._entries.entries(); }

  toMap() { return this._entries; }

  get(key) { return this._entries.get(key); }

  _set(jso) {
    this._clear();
    Objects.forEach(jso, (fieldJso, key) => (
      this._entries.set(key, this._createField(key, fieldJso))));
  }

  _applyDiff(diffJso) {
    throw Error('not implemented');
  }
  
  _clear() {
    this._entries.clear();
  }

  _getField(key) {
    const field = this._entries.get(key);
    if (field === undefined) {
      throw new FieldNotFoundError();
    }
    return field;
  }

  _getOrCreateSetField(key, jso) {
    const field = this._entries.get(key);
    if (field !== undefined) {
      this._setFieldValue(key, jso, field);
    } else {
      this._createSetField(key, jso);
    }
  }

  _createSetField(key, jso) {
    const field = this._createField(key, jso);
    this._entries.set(key, field);
    return field;
  }

  _setField(key, field) {
    this._entries.set(key, field);
  }

  _setFieldValue(key, jso, field) {
    field._set(jso);
  }

  _deleteField(key) {
    assert(this._entries.delete(key));
  }
}


const SetField = RepeatedField;  // TODO


class ScalarOrReferenceEntriesMixin {

  _getField(key) {
    throw Error('deleted method');
  }

  _getFieldByPath(path) {
    throw Error('deleted method');
  }
}

class ScalarEntriesMixin extends ScalarOrReferenceEntriesMixin {

  _createField(key, scalar) {
    return scalar;
  }

  _setFieldValue(key, scalar) {
    this._setField(key, scalar);
  }

  _valueToJso(scalar) {
    return scalar;
  }
}

class ReferenceEntriesMixin extends ScalarOrReferenceEntriesMixin {

  _createField(key, path) {
    const value = ReferenceField._valueFromPath(path, this._context);
    if (value.then) {
      value.then(message => this._setField(key, message));
    }
    return value;
  }

  _setFieldValue(key, path) {
    const value = ReferenceField._valueFromPath(path, this._context);
    this._setField(key, value);
    if (value.then) {
      value.then(message => this._setField(key, message));
    }
  }

  _valueToJso(messageOrUnresolvedReference) {
    return ReferenceField._valueToJso(messageOrUnresolvedReference);
  }
}

class MessageEntriesMixin { }


export class Path extends Array {  // TODO

  toString() {
    return this.map(key => key.toString()).join('');
  }
}


class Key {
  get key() { throw Error('abstract method'); }
  toString() { throw Error('abstract method'); }
}


Message.Key = Message.FieldNameJson = class FieldNameJson extends Key {

  constructor(fieldName) {
    super();
    this.fieldName = fieldName;
  }

  get key() { return this.fieldName; }
  toString() { return '.' + this.fieldName; }
};


ContainerField.Key = class extends Key {

  constructor(indexOrKey) {
    super();
    this.indexOrKey = indexOrKey;
  }

  get key() { return this.indexOrKey; }
  toString() { return '[' + JSON.stringify(this.indexOrKey) + ']'; }
};


ContainerField.SliceKey = class extends Key {

  static create(start, stop) {
    return new this(new Slice(start, stop));
  }

  constructor(slice) {
    super();
    this.slice = slice;
  }

  get key() { return this.slice; }
  toString() { return this.slice.toString(); }
};


export class CompositeFieldView extends FieldLike {

  static create(field, boundary, includeBoundary=false) {
    return new this(field, boundary, includeBoundary);
  }

  constructor(field, boundary, includeBoundary) {
    super();
    this._field = field;
    this._boundary = boundary;
    this._includeBoundary = includeBoundary;
  }

  path() {return this._field.path(); }
  toJso() { return this.constructor._fieldClass.prototype.toJso.call(this); }
  get postUpdates() { return this._field.postUpdates; }

  includeBoundary() {
    return new this.constructor(this._field, this._boundary, true);
  }
}


class MessageView extends Classes.mix(MessageLike, CompositeFieldView) {

  static create(message, boundary, includeBoundary=false) {
    if (Object.is(boundary, BoundaryMessage)) {
      return new BoundaryMessage(message);
    } else {
      return super.create(message, boundary, includeBoundary);
    }
  }

  *entries() {
    for (const [fieldName, field] of this._field.entries()) {
      const fieldBoundary = this._boundary[fieldName];
      const fieldView = fieldBoundary ?
        field.view(fieldBoundary, this._includeBoundary) : field;
      if (this._includeBoundary || !(fieldView instanceof BoundaryField)) {
        yield [fieldName, fieldView];
      }
    }
  }
}

Message._viewClass = MessageView;
MessageView._fieldClass = Message;


class ContainerFieldView extends CompositeFieldView {

  static create(container, boundary, includeBoundary=false) {
    if (Object.is(boundary, BoundaryContainer)) {
      return new BoundaryContainer(container);
    } else {
      throw Error('not implemented');
    }
  }   
}


class RepeatedFieldView extends Classes.mix(RepeatedFieldLike, ContainerFieldView) {
}

RepeatedField._viewClass = RepeatedFieldView;
RepeatedFieldView._fieldClass = RepeatedField;


class MapFieldView extends Classes.mix(MapFieldLike, ContainerFieldView) {
}


MapField._viewClass = MapFieldView;
MapFieldView._fieldClass = MapField;


class BoundaryField {

  constructor(field) {
    this._field = field;
  }
}

// TODO: Remove export.
export class BoundaryMessage extends BoundaryField {

  toJso() { return 1; }
}

// TODO: Remove export.
export class BoundaryContainer extends BoundaryField {

  get isEmpty() { return this._field.isEmpty; }

  toJso() { return this._field.size; }
}

ContainerField.subclasses.push(BoundaryContainer);


class PathMap {

  constructor(createDefaultValue) {
    this._createDefaultValue = createDefaultValue;
    this._root = {children: {}};
    // this._root = new PathMap.Node;
  }

  setDefault(path) {
    let node = this._root;
    for (const {key} of path) {
      node = node.children[key] || (node.children[key] = {children: {}});
    }
    return node.value || (node.value = this._createDefaultValue(path));
  }

  pop(path) {
    let node = this._root;
    const parents = [];
    for (const {key} of path) {
      parents.push(node);
      node = node.children[key];
      if (!node) { return; }
    }

    const value = node.value;
    if (!value) {
      return;
    }
    delete node.value;

    for (let i = path.length; --i >= 0; ) {
      if (Objects.isEmpty(node.children) && !node.value) {
        node = parents[i];
        delete node.children[path[i].key];
      } else {
        break;
      }
    }

    return value;
  }
}


class FieldNotFoundError extends Error {}


export class FieldClassFactory {

  static create() {
    return new this(Message, ContainerField);
  }

  constructor(messageClass, containerFieldClass) {
    this.messageClass = messageClass;
    this.containerFieldClass = containerFieldClass;
    this._messageClasses = {};
  }

  createMessageClasses(descriptors) {
    for (const descriptor of descriptors) {
      this.getOrCreateMessageClass(descriptor);
    }
    Objects.forEach(this._messageClasses, c => assert(!c.pending));
    return this._messageClasses;
  }

  getOrCreateMessageClass(descriptor) {
    const qualifiedName = descriptor.qualifiedName;
    let messageClass = this._messageClasses[qualifiedName];
    if (!messageClass) {
      for (messageClass of this.messageClass.createSubclass(descriptor, this)) {
        // createSubclass() generator should yield exactly once.
        assert(!this._messageClasses[qualifiedName]);
        this._messageClasses[qualifiedName] = messageClass;
      }
    }
    return messageClass;
  }
  
  createFieldClass(fieldType) {
    return fieldType.isUnary ?
      this.createUnaryFieldClass(fieldType.valueType) :
      this.createContainerFieldClass(fieldType);
  }

  createUnaryFieldClass(valueType) {
    if (valueType.isScalar) {
      return ScalarField;  // TODO: Subclass.
    } else if (valueType.isReference) {
      return ReferenceField;  // TODO: Subclass.
    } else if (valueType.isMessage) {
      return this.getOrCreateMessageClass(valueType);
    } else {
      throw Error(valueType);
    }
  }

  createContainerFieldClass(fieldType) {
    return this.containerFieldClass.createSubclass(fieldType, this);
  }
}


export function createMessageClassesFromFileDescriptorSetJson(
  json, fieldClassFactory=undefined, descriptorClass=undefined) {
  fieldClassFactory = fieldClassFactory || new FieldClassFactory(Message, ContainerField);
  descriptorClass = descriptorClass || MessageDescriptor;
  const descriptors = descriptorClass.createAllFromFileDescriptorSetJson(json); 
  return fieldClassFactory.createMessageClasses(Object.values(descriptors));
}
