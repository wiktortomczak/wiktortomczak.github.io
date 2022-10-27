
import Arrays from 'base/arrays.mjs';
import assert from 'base/assert.mjs';
import Classes from 'base/classes.mjs';
import EventSource from 'base/event-source.mjs';
import {SyncIterables} from 'base/iterables.mjs';
import Maps from 'base/maps.mjs';
import Objects from 'base/objects.mjs';
import Types from 'base/types.mjs';

import MessageExtDescriptor from 'base/proto/ext/descriptor.mjs';


class Field {

  /**
   *
   * @param {!CompositeField=} parent
   * @param {!String=} parentEntryKey
   */
  constructor(parent, parentEntryKey) {
    assert(Types.isNullOrUndefined(parent) ==
           Types.isNullOrUndefined(parentEntryKey));
    this._parent = parent;
    this._parentEntryKey = parentEntryKey;  // Message field name is json name.
  }

  get key() { return this._parentEntryKey;  }

  path() {
    return this.pathComponents().join('');
  }

  pathComponents() {
    const components = [];
    for (let field = this; field._parent; field = field._parent) {
      components.unshift(
        field._parent._entryKeyToPathComponent(field._parentEntryKey));
    }
    return components;
  }

  /**
   *
   * @param {!String} path All fields must exist except for last.
   */
  resolve(path, wrapUnaryField=false) {
    if (path.startsWith('.')) {
      path = path.slice(1);
    }
    let field = this, entryKey;
    while (path) {
      [entryKey, path] = field._splitPath(path);
      if (path) {
        field = field._getEntry(entryKey);
      }
    }

    if (Types.isUndefined(entryKey)) {  // empty path, field = this
      return field;  
    } else if (!wrapUnaryField) {  // path must be that of a composite field.}
      return field._getEntry(entryKey);
    } else {  // Wrap scalar / unset message. TODO: Wrap message even if exists?
      return field._getOrWrapEntry(entryKey);
    }
  }

  get descriptor() {
    // TODO: Handle no parent (root message).
    return this._parent._entryDescriptor(this._parentEntryKey);
  }

  _entryToField(descriptor, value) {
    if ((!descriptor.isUnary || descriptor.isMessage)) {
      return value;
    } else if (descriptor.isScalar) {
      return new Scalar(this, descriptor.nameJson, value);
    } else if (descriptor.isReference) {
      return new ObjectReference(this, descriptor.nameJson, value);
    } else {
      throw Error();
    }
  }

  _splitPath(pathJson) {}
}


class Scalar extends Field {

  constructor(parent, parentEntryKey, value) {
    super(parent, parentEntryKey);
    this._value = value;
  }

  get value() { return this._value; }
}


class ObjectReference extends Field {

  constructor(parent, parentEntryKey, objectRef) {
    super(parent, parentEntryKey);
    this._objectRef = objectRef;
  }

  get value() { return this._objectRef.deref(); }
}


class CompositeField extends Field {

  constructor(parent, parentEntryKey, context) {
    super(parent, parentEntryKey);
    this._context = context || {};
    [this._ownChange, this._ownChangeEmitter] = EventSource.withEmitter();
    [this._subtreeChange, this._subtreeChangeEmitter] = EventSource.withEmitter();
  }

  get isEmpty() {}

  subfields() {
    throw Error('not implemented');
  }

  forEachNestedEntry(func) {
    throw Error('not implemented');
  }

  // message: change of value of any unary field.
  // repeated/map: change in the set of entries (entry added / removed).
  get ownChange() {
    return this._ownChange;
  }

  get subtreeChange() {
    return this._subtreeChange;
  }

  updateJson(updateJson) {
    assert(updateJson.length == 2);
    const [pathJson, fieldDataJson] = updateJson;
    const field = this.resolve(pathJson, true /* wrapUnaryField */); 
    if (fieldDataJson !== null) {
      field._setFromObject(fieldDataJson);
    } else {
      field._delete();
    }
  }

  _notifyChange(isOwnChange) {
    if (isOwnChange) {
      // console.log(this.path() + ' ownChange');
      this._ownChangeEmitter();
    }
    this._subtreeChangeEmitter();
    if (this._parent) {
      this._parent._notifyChange(false);
    }
  }

  _setFromObject(obj) {
    throw Error('not implemented');
  }

  _setEntryFromObj(entryKey, obj, fieldDescriptor) {
    // TODO: Move deferReferences up, to top-level update method(s).
    this._deferReferences(fieldDescriptor, () => {
      const entry = this._entryFromObj(obj, fieldDescriptor);
      this._setEntry(entryKey, entry);
    });
  }

  _entryFromObj(obj, fieldDescriptor) {
    throw Error('not implemented');
  }

  _entryDescriptor(entryKey) {
    throw Error('not implemented');
  }

  _deferReferences(fieldDescriptor, func) {
    const deferredReferences =
      this._context.update && this._context.update.deferredReferences;
    if (fieldDescriptor.isReference && deferredReferences) {
      deferredReferences.push(func);
    } else {
      func();
    }
  }

  _hasEntry(entryKey) {}
  _getEntry(entryKey) {}
  _getOrWrapEntry(entryKey) {}
  _setEntry(entryKey, entry) {}
  _deleteEntry(entryKey) {}
}


//       this, entry:
// m.i   Message, unary scalar/reference |
// li[x] RepeatedScalarField, unary scalar/reference |
// mi[x] ScalarMapField, unary scalar/reference
class ScalarEntriesMixin {

  _entryFromObj(obj, fieldDescriptor) {
    if (fieldDescriptor.isScalar) {
      return fieldDescriptor.type.valueFromObj(obj);
    } else if (fieldDescriptor.isReference) {
      const messageExtClass = fieldDescriptor.messageDescriptor.messageExtClass;
      let message;
      if (obj instanceof messageExtClass) {
        message = obj;
        // TODO: assert message is part of context.root tree.
      } else {
        message = this._context.root.resolve(obj);
        assert(message instanceof messageExtClass);
      }
      return new WeakRef(message);
    } else {
      throw Error();
    }
  }

  _valueToJson(value, fieldDescriptor) {
    if (fieldDescriptor.isScalar) {
      const scalar = value;
      return fieldDescriptor.type.valueToJson(scalar);
    } else if (fieldDescriptor.isReference) {
      const message = value;
      return message.path();
    } else {
      throw Error();
    }
  }
}


//       this, entry:
// m.m   Message, Message |
// m.li  Message, RepeatedScalarOrScalarMap |
// m.lm  Message, RepeatedMessageOrMessageMap |
// lm[x] RepeatedMessageField, Message |
// mm[x] MessageMapField, Message
class CompositeEntriesMixin {

  _createSubmessage(entryKey, obj) {}

  _valueToJson(value, fieldDescriptor) {
    return value.toJson();
  }
}


class MessageEntriesMixin extends CompositeEntriesMixin {

  _entryFromObj(obj, fieldDescriptor) {
    if (obj instanceof fieldDescriptor.type.messageExtClass) {
      assert(!obj._parent);
      assert(!obj._parentEntryKey);
      return obj;
    } else {
      return this._createSubmessageImpl(obj, fieldDescriptor);
    }
  }

  _createSubmessageImpl(obj, fieldDescriptor) {
    const messageExtClass = fieldDescriptor.type.messageExtClass;
    return messageExtClass.create(obj, this._context);
  }

  _setSubmessageParent(submessage, fieldDescriptor, parentEntryKey) {
    const submessageExtClass = fieldDescriptor.type.messageExtClass;
    assert(submessage instanceof submessageExtClass);
    assert(!submessage._parent);
    assert(!submessage._parentEntryKey);
    submessage._parent = this;
    submessage._parentEntryKey = parentEntryKey;
  }
}


class RepeatedScalarOrScalarMapMixin extends ScalarEntriesMixin {

  _getOrWrapEntry(entryKey) {
    const UnaryField = this.constructor.UnaryField;
    return new UnaryField(this, entryKey);
  }
}


class RepeatedMessageOrMessageMapMixin extends MessageEntriesMixin {

  _createSubmessage(entryKey, submessageObj) {
    return this._createSubmessageImpl(submessageObj, this._fieldDescriptor);
  }

  _getOrWrapEntry(entryKey) {
    const UnaryField = this.constructor.UnaryField;
    return this._hasEntry(entryKey) ?
      this._getEntry(entryKey) : new UnaryField(this, entryKey);
  }
 
  // TODO: Fix mixin so that super refers to preceeding sibling base classes.
  // _setEntry(entryKey, submessage) {
  //   this._setSubmessageParent(submessage, this._fieldDescriptor, `[${entryKey}]`);
  //   super._setEntry(entryKey, submessage);
  // }
}


class RepeatedOrMapFieldBase extends CompositeField {

  // TODO: Rename fieldDescriptor to entryDescriptor.
  constructor(fieldDescriptor, parent, parentEntryKey, context) {
    super(parent, parentEntryKey, context);
    this._fieldDescriptor = fieldDescriptor;
  }

  _entryDescriptor(fieldNameJson) {
    return this._fieldDescriptor;
  }

  _splitPath(path) {
    const brackets = path.split(/\./, 1)[0];
    assert(brackets.startsWith('[') && brackets.endsWith(']'));
    const entryKey = this._entryKeyFromPathComponent(brackets);
    return [entryKey, path.slice(brackets.length)];
  }

  _entryKeyToPathComponent(entryKey) {
    return `[${JSON.stringify(entryKey)}]`;
  }

  _setEntryFromObj(entryKey, obj) {
    super._setEntryFromObj(entryKey, obj, this._fieldDescriptor);
  }

  // TODO: Switch on fieldDescriptor one time only in constructor?
  _entryToField(entryKey, value) {
    if (this._fieldDescriptor.isUnary ||
        this._fieldDescriptor.isMessage) {
      return value;
    } else if (this._fieldDescriptor.isScalar) {
      return new Scalar(this, entryKey, value);
    } else if (this._fieldDescriptor.isReference) {
      return new ObjectReference(this, entryKey, value);
    } else {
      throw Error();
    }
  }
}

// TODO: Replace with Scalar class?
RepeatedOrMapFieldBase.UnaryField = class UnaryField {

  constructor(parent, parentEntryKey) {
    this._parent = parent;
    this._parentEntryKey = parentEntryKey;
  }

  _setFromObject(obj) {
    const hasEntry = this._parent._hasEntry(this._parentEntryKey);
    this._parent._setEntryFromObj(this._parentEntryKey, obj);
    this._parent._notifyChange(!hasEntry /* isOwnChange */);
  }

  _delete() {
    this._parent._deleteEntry(this._parentEntryKey);
    this._parent._notifyChange(true /* isOwnChange */);
  }
};



class RepeatedFieldBase extends RepeatedOrMapFieldBase {

  constructor(fieldDescriptor, parent, parentEntryKey, context) {
    super(fieldDescriptor, parent, parentEntryKey, context);
    this._array = [];
    this._array.field = this;
  }

  get value() { return this._array; }
  get isEmpty() { return this._array.length == 0; }
  get numEntries() { return this._array.length; }

  subfields(begin, end) {
    return this._array.slice(begin, end).map(
      (value, i) => this._entryToField(i, value));
  }

  forEachNestedEntry(func) {
    this._array.forEach((entry, i) => {
      func(entry, i, this._fieldDescriptor);
      if (entry.forEachNestedEntry) {
        entry.forEachNestedEntry(func);
      }
    });
  }

  _clear() {
    this._array.length = 0;
  }

  _setFromObject(entriesObj, clearAndNotify=true) {
    if (clearAndNotify) {
      this._clear();
    }
    entriesObj.forEach((entryObj, i) => (
      this._setEntryFromObj(i, entryObj)
    ));
    if (clearAndNotify) {
      this._notifyChange(true /* isOwnChange */);
    }
  }
  
  _hasEntry(entryKey) {
    return Types.isNumber(entryKey) && entryKey < this._array.length;
  }

  _getEntry(entryKey) {
    assert(this._hasEntry(entryKey));
    return this._array[entryKey];
  }

  _setEntry(entryKey, entry) {
    assert(Types.isNumber(entryKey));
    const isNewEntry = this._array.length <= entryKey;
    while (this._array.length <= entryKey) {
      this._array.push(undefined);
    }
    this._array[entryKey] = entry;
  }

  _deleteEntry(entryKey) {
    assert(Types.isNumber(entryKey) && entryKey < this._array.length);
    delete this._array[entryKey];
    while (this._array.length && Types.isUndefined(Arrays.last(this._array))) {
      this._array.pop();  // TODO
    }
  }
  
  _entryKeyFromPathComponent(path) {
    return parseInt(path.slice(1, -1));
  }
}

class RepeatedScalarField extends
Classes.mix(RepeatedFieldBase, RepeatedScalarOrScalarMapMixin) {
  toJson() {
    return this._array.map(e => this._fieldDescriptor.type.valueToJson(e));
  }
}

class RepeatedMessageField extends
Classes.mix(RepeatedFieldBase, RepeatedMessageOrMessageMapMixin) {
  toJson() { return this._array.map(e => e.toJson()); }

  _setEntry(entryKey, submessage) {
    this._setSubmessageParent(submessage, this._fieldDescriptor, entryKey);
    super._setEntry(entryKey, submessage);
  }
}


class MapFieldBase extends RepeatedOrMapFieldBase {

  constructor(fieldDescriptor, parent, parentEntryKey, context) {
    super(fieldDescriptor, parent, parentEntryKey, context);
    this._map = new Map;
    this._map.field = this;
  }

  get value() { return this._map; }
  get isEmpty() { return this._map.size == 0; }
  get numEntries() { return this._map.size; }
  
  subfields(begin, end) {
    const valuesSlice = Types.isDefined(begin) || Types.isDefined(end) ?
      SyncIterables.slice(this._map.values(), begin, end) : this._map.values();
    return SyncIterables.mapToArray(
      valuesSlice, (value, key) => this._entryToField(key, value));
  }

  forEachNestedEntry(func) {
    this._map.forEach((entry, entryKey) => {
      func(entry, entryKey, this._fieldDescriptor);
      if (entry.forEachNestedEntry) {
        entry.forEachNestedEntry(func);
      }
    });
  }

  _clear() {
    this._map.clear();
  }

  _setFromObject(entriesObj, clearAndNotify=true) {
    if (clearAndNotify) {
      this._clear();
    }
    Objects.forEach(entriesObj, (entryObj, keyStr) => {
      const key = this._fieldDescriptor.keyType.valueFromString(keyStr);
      this._setEntryFromObj(key, entryObj);
    });
    if (clearAndNotify) {
      this._notifyChange(true /* isOwnChange */);
    }
  }

  _hasEntry(entryKey) {
    return this._map.has(entryKey);
  }

  _getEntry(entryKey) {
    const entry = this._map.get(entryKey);
    assert(Types.isDefined(entry));
    return entry;
  }

  _setEntry(entryKey, entry) {
    // TODO: Assert types.
    const isNewEntry = !this._map.has(entryKey);
    this._map.set(entryKey, entry);
  }

  _deleteEntry(entryKey) {
    assert(this._map.delete(entryKey));
  }

  _entryKeyFromPathComponent(path) {
    return this._fieldDescriptor.keyType.valueFromJsonString(path.slice(1, -1));
  }
}

class ScalarMapField extends
Classes.mix(MapFieldBase, RepeatedScalarOrScalarMapMixin) {
  toJson() {
    return Maps.toObject(this._map, {
      valueMapper: e => this._fieldDescriptor.type.valueToJson(e)
    });
  }
}

class MessageMapField extends
Classes.mix(MapFieldBase, RepeatedMessageOrMessageMapMixin) {

  toJson() { return Maps.toObject(this._map, {valueMapper: e => e.toJson()}); }

  _setEntry(entryKey, submessage) {
    this._setSubmessageParent(submessage, this._fieldDescriptor, entryKey);
    super._setEntry(entryKey, submessage);
  }
}


// TODO: Rename to Message.
export default class MessageExt extends
Classes.mix(CompositeField, ScalarEntriesMixin, MessageEntriesMixin) {

  static get classFactory() { return new MessageExtClassFactory; }

  static get descriptorClass() { return MessageExtDescriptor; }

  static create(obj, context) {
    context = context || {};
    const message = new this(null, null, context);
    context.root = context.root || message;

    if (obj) {
      message._setFromObject(obj, false /* clearAndNotify */);
    }

    return message;
  }

  constructor(parent, parentEntryKey, context) {
    super(parent, parentEntryKey, context);
    this._fields = {};
    this._createContainerFields();
  }

  _createContainerFields() {
    Object.values(this.constructor.descriptor.fields).forEach(fieldDescriptor => {
      const containerClass = this.constructor._getContainerFieldClass(fieldDescriptor);
      if (containerClass) {
        this._fields[fieldDescriptor.nameJson] = new containerClass(
          fieldDescriptor, this, fieldDescriptor.nameJson, this._context);
      }
    });
  }

  // TODO: Public in non-readonly.
  _clear() {
    const fieldsCleared = {};
    Objects.forEach(this._fields, (field, fieldNameJson) => {
      const fieldDescriptor = this.constructor.descriptor.fields[fieldNameJson];
      if (this.constructor._isCompositeField(fieldDescriptor)) {
        field._clear();
        fieldsCleared[fieldNameJson] = field;
      }
    });
    this._fields = fieldsCleared;
  }

  static _getContainerFieldClass(fieldDescriptor) {
    if (fieldDescriptor.isRepeated) {
      return fieldDescriptor.isMessage ?
        RepeatedMessageField : RepeatedScalarField;
    } else if (fieldDescriptor.isMap) {
      return fieldDescriptor.isMessage ?
        MessageMapField : ScalarMapField;
    } else {
      return null;
    }
  }

  static fromJson(json, context) {
    return this.create(json, context);
  }

  static fromObject(obj, context) {
    return this.create(obj, context);
  }

  get isEmpty() {
    return Object.values(this.constructor.descriptor.fields).every(
      fieldDescriptor => this._isUnsetOrEmpty(fieldDescriptor));
  }

  has(fieldNameJson) {
    assert(this.constructor.descriptor.fields[fieldNameJson].isUnary);
    return Types.isDefined(this._fields[fieldNameJson]);
  }

  fieldEntries(includeEmptyUndefined) {
    return this.mapFields((descriptor, value) => [descriptor, value],
                          includeEmptyUndefined);
  }

  subfields(includeEmptyUndefined) {
    return this.mapFields(
      (descriptor, value) => this._entryToField(descriptor, value),
      includeEmptyUndefined);
  }

  forEachField(func, includeUnsetOrEmpty) {
    // TODO: Iterate over this._fields in order not over descriptor.fields.
    Object.values(this.constructor.descriptor.fields).forEach(descriptor => {
      if (includeUnsetOrEmpty || !this._isUnsetOrEmpty(descriptor)) {
        func(descriptor, this._fields[descriptor.nameJson]);
      }
    });
  }

  mapFields(func, includeUnsetOrEmpty) {
    // TODO: Iterate over this._fields in order not over descriptor.fields.
    const fieldsMapped = [];
    Object.values(this.constructor.descriptor.fields).forEach(descriptor => {
      if (includeUnsetOrEmpty || !this._isUnsetOrEmpty(descriptor)) {
        fieldsMapped.push(func(descriptor, this._fields[descriptor.nameJson]));
      }
    });
    return fieldsMapped;
  }

  forEachNestedEntry(func) {
    Objects.forEach(this._fields, (field, fieldNameJson) => {
      const fieldDescriptor = this.constructor.descriptor.fields[fieldNameJson];
      func(field, fieldNameJson, fieldDescriptor);
      if (field.forEachNestedEntry && !field.isReference) {
        field.forEachNestedEntry(func);
      }
    });
  }

  _isUnsetOrEmpty(fieldDescriptor) {
    if (fieldDescriptor.isUnary) {
      return Types.isUndefined(this._fields[fieldDescriptor.nameJson]);
    } else {
      return this._fields[fieldDescriptor.nameJson].isEmpty;
    }
  }

  toJson() {
    const json = {};
    const fieldDescriptors = this.constructor.descriptor.fields;
    Objects.forEach(this._fields, (field, fieldNameJson) => {
      const fieldDescriptor = fieldDescriptors[fieldNameJson];
      const _valueToJson = this._getMixinMethod(fieldNameJson, '_valueToJson');
      json[fieldNameJson] = _valueToJson(field, fieldDescriptor);
    });
    return json;
  }

  _setFromObject(obj, clearAndNotify=true) {
    if (clearAndNotify) {
      this._clear();
    }
    this._inUpdateScope(() => {
      Objects.forEach(obj, (valueObj, fieldNameJson) => {
        this._setEntryFromObj(fieldNameJson, valueObj);
      });
    });
    if (clearAndNotify) {
      this._notifyChange(true /* isOwnChange */);
    }
  }

  _setEntryFromObj(fieldNameJson, obj) {
    const fieldDescriptor = this.constructor.descriptor.fields[fieldNameJson];
    assert(fieldDescriptor);
    if (fieldDescriptor.isUnary) {
      super._setEntryFromObj(fieldNameJson, obj, fieldDescriptor);
    } else {
      // Nested containers are recreated, so no update to notify about.
      const clearAndNotify = false;
      this._fields[fieldNameJson]._setFromObject(obj, clearAndNotify);
    }
  }

  _entryDescriptor(fieldNameJson) {
    return this.constructor.descriptor.fields[fieldNameJson];
  }

  _delete() {
    this._parent._deleteEntry(this._parentEntryKey);
    this._parent._notifyChange(true /* isOwnChange */);
  }

  _entryFromObj(obj, fieldDescriptor) {
    return this._getMixinMethod(fieldDescriptor.nameJson, '_entryFromObj')(
      obj, fieldDescriptor);
  }

  _inUpdateScope(updateFunc) {
    if (!this._context.update) {
      var isRootUpdate = true;
      this._context.update = {atEnd: []};
      
      this._context.update.deferredReferences = [];
      this._context.update.atEnd.push(() => {
        for (const func of Objects.pop(this._context.update, 'deferredReferences')) {
          func();
        }
      });
    }

    updateFunc();

    if (isRootUpdate) {
      for (const func of this._context.update.atEnd) {
        func();
      }
      delete this._context.update;
    }
  }

  _createSubmessage(fieldNameJson, obj) {
    const fieldDescriptor = this.constructor.descriptor.fields[fieldNameJson];
    return this._createSubmessageImpl(obj, fieldDescriptor);
  }

  _splitPath(path) {
    if (path.startsWith('.')) {
      path = path.slice(1);
    }
    const fieldNameJson = path.split(/\W/, 1)[0];
    return [fieldNameJson, path.slice(fieldNameJson.length)];
  }

  _entryKeyFromPathComponent(path) {
    return path.slice(1);
  }

  _entryKeyToPathComponent(fieldNameJson) {
    return '.' + fieldNameJson;
  }

  // TODO: Classes.cast.
  _getMixinMethod(fieldNameJson, methodName) {
    const fieldDescriptor = this.constructor.descriptor.fields[fieldNameJson];
    assert(fieldDescriptor);
    const mixinClass =
      !fieldDescriptor.isUnary ? CompositeEntriesMixin :
      fieldDescriptor.isMessage ? MessageEntriesMixin
      : ScalarEntriesMixin;
    return mixinClass.prototype[methodName].bind(this);
  }

  static _isCompositeField(fieldDescriptor) {
    return !fieldDescriptor.isUnary || fieldDescriptor.isMessage;
  }

  _hasEntry(fieldNameJson) {
    assert(this.constructor.descriptor.fields[fieldNameJson]);
    return !!this._fields[fieldNameJson];
  }

  _getEntry(fieldNameJson) {
    const entry = this._fields[fieldNameJson];
    assert(Types.isDefined(entry));
    return entry;
  }

  _getOrWrapEntry(fieldNameJson) {
    const fieldDescriptor = this.constructor.descriptor.fields[fieldNameJson];
    if (fieldDescriptor.isUnary
        && (!fieldDescriptor.isMessage || !this._hasEntry(fieldNameJson))) {
      const UnaryField = this.constructor.UnaryField;
      return new UnaryField(this, fieldNameJson);
    } else {
      return this._getEntry(fieldNameJson);
    }
  }

  _setEntry(fieldNameJson, entry) {
    const fieldDescriptor = this.constructor.descriptor.fields[fieldNameJson];
    assert(fieldDescriptor.isUnary);
    if (fieldDescriptor.isMessage) {
      this._setSubmessageParent(entry, fieldDescriptor, fieldNameJson);
    }
    // TODO: Assert entry type.
    this._fields[fieldNameJson] = entry;
  }

  _deleteEntry(fieldNameJson) {
    assert(fieldNameJson in this._fields);
    delete this._fields[fieldNameJson];
  }

  _getUnaryField(jsonName) {
    return this._fields[jsonName];
  }

  _getUnaryReferenceField(jsonName) {
    const field = this._fields[jsonName];
    return field && field.deref();
  }

  _getContainerField(jsonName) {
    return this._fields[jsonName].value;
  }

  _setField() {
    throw Error('not implemented');
  }
}

MessageExt.UnaryField = class UnaryField {

  constructor(parent, parentEntryKey) {
    this._parent = parent;
    this._parentEntryKey = parentEntryKey;
  }

  _setFromObject(obj) {
    this._parent._setEntryFromObj(this._parentEntryKey, obj);
    this._parent._notifyChange(true /* isOwnChange */);
  }

  _delete() {
    this._parent._deleteEntry(this._parentEntryKey);
    this._parent._notifyChange(true /* isOwnChange */);
  }
};


// TODO: ReadOnlyMessageExt, ReadOnlyMessageExtClassFactory.
export class MessageExtClassFactory {

  constructor(baseMessageExtClass) {
    this._baseMessageExtClass = baseMessageExtClass || MessageExt;
  }

  /**
   * @param {!MessageExtDescriptor} descriptor
   * @return {!Object<!string, Class<MessageExt>>}
   */
  create(descriptor) {
    assert(!descriptor.messageExtClass);
    descriptor.messageExtClass = Classes.createClass(
      descriptor.name, this._baseMessageExtClass,
      this._createPrototype(descriptor), {descriptor});
    if (descriptor.isNested) {
      const parentMessageExtClass = descriptor.parent.messageExtClass;
      parentMessageExtClass[descriptor.name] = descriptor.messageExtClass;
    }
    return descriptor.messageExtClass;
  }

  _createPrototype(descriptor) {
    return this._createGettersAndSetters(descriptor);
  }

  _createGettersAndSetters(descriptor) {
    const prototype = {};
    // Define field getters and setters.
    Object.values(descriptor.fields).forEach(fieldDescriptor => {
      Object.defineProperty(prototype, fieldDescriptor.nameJson, {
        get: this._createGetter(fieldDescriptor),
        // TODO: If not read-only.
        set: this._createSetter(fieldDescriptor.jsonName)
      });
    });
    return prototype;
  }

  _createGetter(fieldDescriptor) {
    if (fieldDescriptor.isUnary) {
      return !fieldDescriptor.isReference
        ? this._createUnaryGetter(fieldDescriptor.nameJson)
        : this._createUnaryReferenceGetter(fieldDescriptor.nameJson);
    } else {
      return this._createContainerGetter(fieldDescriptor.nameJson);
    }
  }

  _createUnaryGetter(jsonName) {
    return function () { return this._getUnaryField(jsonName); };
  }

  _createUnaryReferenceGetter(jsonName) {
    return function () { return this._getUnaryReferenceField(jsonName); };
  }

  _createContainerGetter(jsonName) {
    return function () { return this._getContainerField(jsonName); };
  }

  _createSetter(jsonName) {
    return function (value) { return this._setField(jsonName, value); };
  }
}


export function createMessageExtClassesFromFileDescriptorSetJson(json, messageExtClass) {
  messageExtClass = messageExtClass || MessageExt;
  const descriptorClass = messageExtClass.descriptorClass;  // MessageExtDescriptor
  return Objects.mapValues(
    descriptorClass.createAllFromFileDescriptorSetJson(json),
    descriptor => messageExtClass.classFactory.create(descriptor));
}
