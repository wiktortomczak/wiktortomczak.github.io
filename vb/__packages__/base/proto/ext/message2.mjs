
import Arrays from 'https://wiktortomczak.github.io/vb/__packages__/base/arrays.mjs';
import assert from 'https://wiktortomczak.github.io/vb/__packages__/base/assert.mjs';
import Classes from 'https://wiktortomczak.github.io/vb/__packages__/base/classes.mjs';
import EventSource from 'https://wiktortomczak.github.io/vb/__packages__/base/event-source.mjs';
import Iterables from 'https://wiktortomczak.github.io/vb/__packages__/base/iterables.mjs';
import Objects from 'https://wiktortomczak.github.io/vb/__packages__/base/objects.mjs';
import Types from 'https://wiktortomczak.github.io/vb/__packages__/base/types.mjs';

import MessageDescriptor from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/ext/descriptor.mjs';


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


class ScalarField extends ScalarOrReferenceField {

  static create(parent, key, context, scalar) {
    return new this(parent, key, scalar);
  }

  toJso() { return this._value; }

  _set(scalar) {
    this._value = scalar;
  }
}

class ReferenceField extends ScalarOrReferenceField {

  static create(parent, key, context, path) {
    const field = new this(parent, key, context);
    assert(path !== undefined);
    field._set(path);
    return field;
  }

  constructor(parent, key, context) {
    super(parent, key);
    this._context = context;
  }

  toJso() { return this._value.path().toString(); }

  _set(path) {
    this._value = this._context._getReference(path, this);
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
    for (const key of path) {
      field = field._getField(key.key);
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
  
  _deleteField(key) {
    throw Error('abstract method');
  }
}


class PartitionRootMixin {

  _PartitionRootMixin_constructor() {  // TODO
    const {_viewClass, partitionBoundary} = this.constructor;
    this._partition = _viewClass.create(this, partitionBoundary);
    this._postUpdates = new EventSource();
  }

  get partition() { return this._partition; }
  get postUpdates() { return this._postUpdates; }
}


class Context {

  constructor(root) {
    this._root = root;
    this._postUpdates = new EventSource();
  }

  get postUpdates() { return this._postUpdates; }

  _getReference(path, referenceField) {
    throw Error('not implemented');  // TODO
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
    if (newContext) {
      context._root = this;
    }
    this._entries = {};
    this._createContainerFields();
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
      if (field instanceof ContainerField) {
        containerEntries.push([fieldName, field]);
      }
    });

    this._entries = Object.fromEntries(containerEntries);
    Objects.mapValues(this._entries, container => container._clear());
  }

  _getOrCreateSetField(fieldName, jso) {
    let field;
    if (!(field = this._entries[fieldName])) {
      field = this._entries[fieldName] = this._createField(fieldName, jso);
    } else {
      field._set(jso);
    }
    return field;
  }

  _createField(fieldName, jso) {
    const fieldClass = this.constructor._unaryFieldClasses[fieldName];
    return super._createField(fieldName, fieldClass, jso);
  }

  _getField(fieldName) {
    const field = this._entries[fieldName];
    assert(field);
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
            type.valueType.isScalar || type.valueType.isReference) ?
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
    assert(!fieldType.isUnary);
    const classNameFormat =
       fieldType.isRepeated ? name => 'Repeated' + name :
       fieldType.isMap ? name => name + 'Map' :
       fieldType.isSet ? name => name + 'Set' :
       _error();
    let baseClassName =
      fieldType.valueType.isScalar ? 'Scalar' :
      fieldType.valueType.isReference ? 'Reference' :
      fieldType.valueType.isMessage ? 'Message' :
      _error();
    baseClassName = classNameFormat(baseClassName) + 'Field';
    const baseClass =
      Arrays.findUnique(this._registry, c => c.name == baseClassName);
    const _valueClass = fieldClassFactory.createUnaryFieldClass(fieldType.valueType);
    const className = classNameFormat(_valueClass.name.replace('Field', ''));
    const class_ = Classes.createClass(className, baseClass, {}, {_valueClass});
    if (fieldType.isPartitionRoot) {
      Classes.mixInto(PartitionRootMixin, class_);
    }
    return class_;
  }

  static isEmpty(container) {  // TODO: Move to ContainerFieldLike.
    return (container instanceof this || (
      this.subclasses.some(c => Classes.isSubclass(container.constructor, c))))
      && container.isEmpty;
  }

  _valueFromJso(jso, key) {
    return this._createField(key, jso);
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
    return this.values();
  }

  toJso() {
    return Iterables.map(this.values(), value => this._valueToJso(value));
  }

  values() {
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
  get array() { return this._entries; }
  get isEmpty() { return !this._entries.length; }

  values() { return this._entries; }

  _updateField(i, op) {
    if (op.method == 'insert') {
      this._insert(i, op.data);
    } else if (op.method == 'delete') {
      this._pop(i);
    } else {
      super._updateField(i, op);
    }
  }

  _set(jso) {
    this._clear();
    let i = 0;
    for (const valueJso of jso) {
      this._entries.push(this._valueFromJso(valueJso, i++));
    }
  }

  _setValue(i, jso) {
    const value = this._valueFromJso(jso, i);
    if (i < this._entries.length) {
      this._entries[i] = value;
    } else {
      assert(i == this._entries.length);
      this._entries.push(value);
    }
  }

  _insert(i, jso) {
    assert(i <= this._entries.length);
    Arrays.insertAt(this._entries, i, this._valueFromJso(jso, i));
    // TOOD: Update .key of all later messages.
  }

  _applyDiff(diffJso) {
    throw Error('not implemented');
  }
  
  _pop(i) {
    Arrays.removeAt(this._entries, i);
    // TOOD: Update .key of all later messages.
  }

  _clear() {
    this._entries.length = 0;
  }  

  _getField(i) {
    const field = this._entries[i];
    assert(field instanceof Field);
    return field;
  }

  _getOrCreateSetField(i, jso) {
    let field;
    if (i < this._entries.length) {
      field = this._getField(i);
      assert(field instanceof Field);
      field._set(jso);
    } else {
      assert(i == this._entries.length);
      const field = this._createField(i, jso);
      this._entries.push(field);
    }
    return field;
  }
}


class MapFieldLike extends FieldLike {

  get length() {
    throw Error('abstract method');
  }

  toMap() {
    return this.entries();
  }

  toJso() {
    const jso = {};
    Iterables.forEach(this.entries(), ([key, value]) => {
      jso[key] = this._valueToJso(value);
    });
    return jso;
  }

  entries() {
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
  get map() { return this._entries; }
  entries() { return this._entries.entries(); }

  _set(jso) {
    this._clear();
    let i = 0;
    Objects.forEach(jso, (valueJso, key) => this._setValue(key, valueJso));
  }

  _setValue(key, jso) {
    this._entries.set(key, this._valueFromJso(jso, key));
  }

  _applyDiff(diffJso) {
    throw Error('not implemented');
  }
  
  _clear() {
    this._entries.clear();
  }

  _getField(key) {
    const field = this._entries.get(key);
    assert(field instanceof Field);
    return field;
  }

  _getOrCreateSetField(key, jso) {
    let field;
    if ((field = this._entries.get(key)) !== undefined) {
      assert(field instanceof Field);
      field._set(jso);
    } else {
      const field = this._createField(key, jso);
      this._entries.set(key, field);
      return field;
    }
    return field;
  }

  _deleteField(key) {
    assert(this._entries.delete(key));
  }
}


const SetField = RepeatedField;  // TODO


class ScalarEntriesMixin {

  _updateField(i, op) {
    if (op.method == 'set') {
      this._setValue(i, op.data);
    } else if (op.method == 'update') {
      throw Error('not implemented');
    } else {
      // TODO: Fix multiple inheritance.
      // super._updateField(i, op);
      const super_ = this.constructor.name.startsWith('Repeated') ?
        RepeatedField : MapField;
      super_.prototype._updateField.call(this, i, op);
    }
  }

  _valueFromJso(scalar) {
    return scalar;
  }

  _valueToJso(scalar) {
    return scalar;
  }

  _getField(key) {
    throw Error('deleted method');
  }
  
  _createField(key, jso) {
    throw Error('deleted method');
  }

  _getOrCreateSetField(key, jso) {
    throw Error('deleted method');
  }

  _getFieldByPath(path) {
    throw Error('deleted method');
  }
}

class ReferenceEntriesMixin { }

class MessageEntriesMixin { }


class RepeatedScalarField extends Classes.mix(RepeatedField, ScalarEntriesMixin) {}
class RepeatedReferenceField extends Classes.mix(RepeatedField, ReferenceEntriesMixin) {}
class RepeatedMessageField extends Classes.mix(RepeatedField, MessageEntriesMixin) {}

class ScalarMapField extends Classes.mix(MapField, ScalarEntriesMixin) {}
class ReferenceMapField extends Classes.mix(MapField, ReferenceEntriesMixin) {}
class MessageMapField extends Classes.mix(MapField, MessageEntriesMixin) {}

class ScalarSetField extends Classes.mix(SetField, ScalarEntriesMixin) {}
class ReferenceSetField extends Classes.mix(SetField, ReferenceEntriesMixin) {}
class MessageSetField extends Classes.mix(SetField, MessageEntriesMixin) {}

ContainerField._registry = [
  RepeatedScalarField,
  RepeatedReferenceField,
  RepeatedMessageField,
  ScalarMapField,
  ReferenceMapField,
  MessageMapField,
  ScalarSetField,
  ReferenceSetField,
  MessageSetField];


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
  toString() { return '[' + this.indexOrKey + ']'; }
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
