
import Arrays from '/zuzia/v0.2/__packages__/base/arrays.mjs';
import assert from '/zuzia/v0.2/__packages__/base/assert.mjs';
import Classes from '/zuzia/v0.2/__packages__/base/classes.mjs';
import EventSource from '/zuzia/v0.2/__packages__/base/event-source.mjs';
import Maps from '/zuzia/v0.2/__packages__/base/maps.mjs';
import Objects from '/zuzia/v0.2/__packages__/base/objects.mjs';
import Types from '/zuzia/v0.2/__packages__/base/types.mjs';

import MessageExtDescriptor from '/zuzia/v0.2/__packages__/base/proto/ext/descriptor.mjs';


class CompositeField {

  constructor(parent, parentEntryKey, context) {
    assert(Types.isNullOrUndefined(parent) ==
           Types.isNullOrUndefined(parentEntryKey));
    this._parent = parent;
    this._parentEntryKey = parentEntryKey;  // Message field name is json name.
    this._context = context || {};
    [this._ownChange, this._ownChangeEmitter] = EventSource.withEmitter();
    [this._subtreeChange, this._subtreeChangeEmitter] = EventSource.withEmitter();
  }

  get isEmpty() {}

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

  resolve(path) {
    if (path.startsWith('.')) {
      path = path.slice(1);
    }
    if (!path) {
      return this;
    }
    const [entryKey, pathTail] = this._splitPath(path);
    return this._getEntryOrUndefined(entryKey).resolve(pathTail);
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
    const [entry, firstCreatedEntry] = pathJson ?
      this._getOrCreatePath(pathJson) : [this, null];
    if (fieldDataJson !== null) {
      entry._setFromObject(fieldDataJson);
      (firstCreatedEntry ? firstCreatedEntry._parent : entry)._notifyChange(true);
    } else {
      assert(!firstCreatedEntry);
      entry._parent._deleteEntry(entry._parentEntryKey);
      entry._parent._notifyChange(true);
    }
  }

  _getOrCreatePath(path) {
    // TODO: Notify each entry unless just created.
    let entry = this;
    let firstCreatedEntry = null;
    while (path) {
      const [entryKey, pathTail] = entry._splitPath(path);
      const [subEntry, created] = entry._getOrCreateCompositeField(entryKey);
      if (created && !firstCreatedEntry) {
        firstCreatedEntry = subEntry;
      }
      entry = subEntry;
      path = pathTail;
    }
    return [entry, firstCreatedEntry];
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

  _setFromObject(obj, clear=true) {
    throw Error('not implemented');
  }

  _setEntryFromObj(entryKey, obj, fieldDescriptor) {
    this._deferReferences(fieldDescriptor, () => {
      const entry = this._entryFromObj(obj, fieldDescriptor);
      this._setEntry(entryKey, entry);
    });
  }

  _entryFromObj(obj, fieldDescriptor) {
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

  static isMessage(field) {
    return field instanceof MessageExt;
  }

  static isRepeated(field) {
    return field instanceof RepeatedFieldBase;
  }

  _getEntry(entryKey) {}
  _getEntryOrUndefined(entryKey) {}
  _setEntry(entryKey, entry) {}
  _deleteEntry(entryKey) {}
}


//       this, entry:
// m.i   Message, unary scalar/reference |
// li[x] RepeatedScalarField, unary scalar/reference |
// mi[x] ScalarMapField, unary scalar/reference
class ScalarEntriesMixin {

  _getOrCreateCompositeField(entryKey) {
    return [new UnaryField(this, entryKey), null];
  }

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


class UnaryField {

  constructor(parent, parentEntryKey) {
    // parent is CompositeField
    this._parent = parent;
    this._parentEntryKey = parentEntryKey;
  }
  
  _setFromObject(obj) {
    if (!CompositeField.isRepeated(this._parent)) {  // TODO: Clean up.
      this._parent._setFromObject(
        {[this._parentEntryKey]: obj}, false /* clear */);
    } else {
      this._parent._setEntryFromObj(
        this._parentEntryKey, obj, this._parent._fieldDescriptor);
    }
  }

  _notifyChange(isOwnChange) {
    this._parent._notifyChange(
      isOwnChange && CompositeField.isMessage(this._parent));
  }
}


//       this, entry:
// m.m   Message, Message |
// m.li  Message, RepeatedScalarOrScalarMap |
// m.lm  Message, RepeatedMessageOrMessageMap |
// lm[x] RepeatedMessageField, Message |
// mm[x] MessageMapField, Message
class CompositeEntriesMixin {

  _getOrCreateCompositeField(entryKey) {
    const entry = this._getEntryOrUndefined(entryKey);
    if (Types.isDefined(entry)) {
      return [entry, false];
    } else {
      const submessage = this._createSubmessage(entryKey);
      this._setEntry(entryKey, submessage);  // or attach
      return [submessage, true];
    }
  }

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
}


class RepeatedMessageOrMessageMapMixin extends MessageEntriesMixin {

  _createSubmessage(entryKey, submessageObj) {
    return this._createSubmessageImpl(submessageObj, this._fieldDescriptor);
  }
 
  // TODO: Fix mixin so that super refers to preceeding sibling base classes.
  // _setEntry(entryKey, submessage) {
  //   this._setSubmessageParent(submessage, this._fieldDescriptor, `[${entryKey}]`);
  //   super._setEntry(entryKey, submessage);
  // }
}


class RepeatedOrMapFieldBase extends CompositeField {

  _splitPath(path) {
    const brackets = path.split(/\./, 1)[0];
    assert(brackets.startsWith('[') && brackets.endsWith(']'));
    const entryKey = this._entryKeyFromPathComponent(brackets);
    return [entryKey, path.slice(brackets.length)];
  }

  _entryKeyToPathComponent(entryKey) {
    return `[${JSON.stringify(entryKey)}]`;
  }
}


class RepeatedFieldBase extends RepeatedOrMapFieldBase {

  constructor(fieldDescriptor, parent, parentEntryKey, context) {
    super(parent, parentEntryKey, context);
    this._fieldDescriptor = fieldDescriptor;
    this._array = [];
    this._array.field = this;
  }

  get value() { return this._array; }
  get isEmpty() { return this._array.length == 0; }

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

  _setFromObject(entriesObj, clear=true) {
    if (clear) {
      this._clear();
    }
    entriesObj.forEach((entryObj, i) => (
      this._setEntryFromObj(i, entryObj, this._fieldDescriptor)
    ));
  }
  
  _getEntry(entryKey) {
    assert(Types.isNumber(entryKey) && entryKey < this._array.length);
    return this._array[entryKey];
  }

  _getEntryOrUndefined(entryKey) {
    assert(Types.isNumber(entryKey));
    return this._array[entryKey];
  }

  _setEntry(entryKey, entry) {
    assert(Types.isNumber(entryKey));
    while (this._array.length <= entryKey) {
      this._array.push(undefined);
    }
    this._array[entryKey] = entry;
  }

  _deleteEntry(entryKey) {
    assert(Types.isNumber(entryKey) && entryKey < this._array.length);
    delete this._array[entryKey];
    while (this._array.length && Types.isUndefined(Arrays.last(this._array))) {
      this._array.pop();
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
    super(parent, parentEntryKey, context);
    this._fieldDescriptor = fieldDescriptor;
    this._map = new Map;
    this._map.field = this;
  }

  get value() { return this._map; }
  get isEmpty() { return this._map.size == 0; }

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

  _setFromObject(entriesObj, clear=true) {
    if (clear) {
      this._clear();
    }
    Objects.forEach(entriesObj, (entryObj, keyStr) => {
      const key = this._fieldDescriptor.keyType.valueFromString(keyStr);
      this._setEntryFromObj(key, entryObj, this._fieldDescriptor);
    });
  }

  _getEntry(entryKey) {
    const entry = this._map.get(entryKey);
    assert(Types.isDefined(entry));
    return entry;
  }

  _getEntryOrUndefined(entryKey) {
    return this._map.get(entryKey);
  }

  _setEntry(entryKey, entry) {
    // TODO: Assert types.
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
      message._setFromObject(obj, false /* clear */);
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
    const entries = [];
    this.forEachField(
      (descriptor, value) => entries.push([descriptor, value]),
      includeEmptyUndefined);
    return entries;
  }

  forEachField(func, includeUnsetOrEmpty) {
    Object.values(this.constructor.descriptor.fields).forEach(descriptor => {
      if (includeUnsetOrEmpty || !this._isUnsetOrEmpty(descriptor)) {
        func(descriptor, this[descriptor.nameJson]);
      }
    });
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

  _setFromObject(obj, clear=true) {
    if (clear) {
      this._clear();
    }
    this._inUpdateScope(() => {
      Objects.forEach(obj, (valueObj, fieldNameJson) => {
        const fieldDescriptor = this.constructor.descriptor.fields[fieldNameJson];
        assert(fieldDescriptor);
        if (fieldDescriptor.isUnary) {
          this._setEntryFromObj(fieldNameJson, valueObj, fieldDescriptor);
        } else {
          this._fields[fieldNameJson]._setFromObject(valueObj, clear);
        }
      });
    });
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

  _getOrCreateCompositeField(fieldNameJson) {
    return this._getMixinMethod(fieldNameJson, '_getOrCreateCompositeField')(
      fieldNameJson);
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

  _getEntry(fieldNameJson) {
    const entry = this._fields[fieldNameJson];
    assert(Types.isDefined(entry));
    return entry;
  }

  _getEntryOrUndefined(fieldNameJson) {
    assert(this.constructor.descriptor.fields[fieldNameJson]);
    return this._fields[fieldNameJson];
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
