
import assert from 'base/assert.mjs';
import Types from 'base/types.mjs';

// TODO: object/ files.

class ValueType {

  get isScalar() { return this instanceof ScalarType; }
  get isMessage() { return this instanceof MessageDescriptor; }
  get isReference() { return this instanceof ReferenceType; }

  get isPartitionRoot() { return !!this.partitionBoundary; }
  get partitionBoundary() { throw Error('not implemented'); }
}


export default class MessageDescriptor extends ValueType {

  static createAllFromFileDescriptorSetJson(json) {
    assert(json.file.length == 1);
    const fileDescriptor = FileDescriptor.fromJson(json.file[0]);
    const descriptors = {};
    json.file[0].messageType.forEach(descriptorJson => {
      this.fromJsonWithNested(descriptorJson, fileDescriptor, descriptors);
    });
    assert(Object.values(descriptors).every(
      descriptor => !(descriptor instanceof Pending)));
    return descriptors;
  }

  static fromJsonWithNested(json, parent, descriptorsOut) {
    const descriptor = this.fromJson(json, parent);
    descriptorsOut[descriptor.qualifiedName] = descriptor;

    (json.nestedType || []).forEach(nestedJson => {
      if (!(nestedJson.options || {}).mapEntry) {
        this.fromJsonWithNested(nestedJson, descriptor, descriptorsOut);
      }
    });
  }

  static fromJson(json, parent, ...ctorArgs) {
    const descriptor = this._getOrCreatePending(json.name, parent);
    assert(descriptor instanceof Pending);

    const mapEntries = {};
    (json.nestedType || []).forEach(nestedJson => {
      if ((nestedJson.options || {}).mapEntry) {
        const mapEntry = this.fromJson(nestedJson, descriptor);
        mapEntries[mapEntry.qualifiedName] = mapEntry;
      }
    });

    const fields = {};
    json.field.forEach(fieldJson => {
      const fieldDescriptor = FieldDescriptor.fromJson(fieldJson, this, mapEntries);
      fields[fieldDescriptor.nameJson] = fieldDescriptor;
    });

    const partitionBoundary = (json.options || {}).partitionRoot;  // TODO

    Object.setPrototypeOf(descriptor, this.prototype);
    descriptor._constructor(json.name, parent, fields, partitionBoundary, ...ctorArgs);
    return descriptor;
  }

  static getByName(qualifiedName) {
    const descriptor = this._registry[qualifiedName];
    assert(!(descriptor instanceof Pending));
    return descriptor;
  }

  constructor(name, parent, fields, partitionBoundary) {
    super();
    this._constructor(name, parent, fields, partitionBoundary);
  }
 
  _constructor(name, parent, fields, partitionBoundary) {
    // assert((parent instanceof this.constructor) ||
    //        (parent instanceof FileDescriptor));
    this._name = name;
    this._parent = parent;
    this._fields = fields;
    this._partitionBoundary = partitionBoundary;
  }

  get name() { return this._name; }
  get qualifiedName() { return this._parent.qualifiedName + '.' + this._name; }
  get parent() { return this._parent; }
  get isNested() { return this._parent instanceof this.constructor; }
  get fields() { return this._fields; }
  get isPartitionRoot() { return !!this._partitionBoundary; }
  get partitionBoundary() { return this._partitionBoundary; }

  static _getOrCreatePending(name, parent) {
    const qualifiedName = parent ? parent.qualifiedName + '.' + name : name;
    return this._registry[qualifiedName] ||
      (this._registry[qualifiedName] = new Pending(qualifiedName));
  }
}

MessageDescriptor._registry = {};


class FieldDescriptor {

  static fromJson(json, messageDescriptorClass, mapEntries) {
    const mapEntry = (json.label == 'LABEL_REPEATED') ?
      mapEntries[json.typeName] : null;
    const isReference =
      !!((json.options || {})['[protoExt.field]'] || {}).reference;
    let valueType;
    if (json.type != 'TYPE_MESSAGE') {
      valueType = ScalarType._instances[json.type];
      assert(!isReference);
    } else {
      if (mapEntry) {
        valueType = mapEntry.fields['value'].type.valueType;
      } else {
        valueType = messageDescriptorClass._getOrCreatePending(json.typeName);
      }
      if (isReference) {
        valueType = new ReferenceType(valueType);
      }
    }
    const keyType = mapEntry && mapEntry.fields['key'].type.valueType;
    const partitionBoundary = (json.options || {}).partitionRoot;  // TODO
    const type = 
      (json.label == 'LABEL_OPTIONAL') ? new UnaryFieldType(valueType) :
      (json.label == 'LABEL_REPEATED') && !mapEntry
        ? new RepeatedFieldType(valueType, partitionBoundary) : 
      (json.label == 'LABEL_REPEATED') && mapEntry
        ? new MapFieldType(keyType, valueType, partitionBoundary) : 
      (json.label == 'LABEL_SET')
        ? new SetFieldType(valueType, partitionBoundary) : 
      _error();
    return new this(json.name, json.jsonName, type);
  }

  constructor(name, nameJson, type) {
    this._name = name;
    this._nameJson = nameJson;
    this._type = type;
  }

  get name() { return this._name; }
  get nameJson() { return this._nameJson; }
  get type() { return this._type; }
}


class FieldType {

  constructor(valueType) {
    this._valueType = valueType;
  }

  get valueType() { return this._valueType; }

  get isUnary() { return this instanceof UnaryFieldType; }
  get isContainer() { return this instanceof ContainerFieldType; }
  get isRepeated() { return this instanceof RepeatedFieldType; }
  get isMap() { return this instanceof MapFieldType; }
  get isSet() { return this instanceof SetFieldType; }

  get isPartitionRoot() { return !!this.partitionBoundary; }
  get partitionBoundary() { throw Error('not implemented'); }
}


class UnaryFieldType extends FieldType {

  get partitionBoundary() { return this._valueType.partitionBoundary; }
}


class ContainerFieldType extends FieldType {

  constructor(valueType, partitionBoundary) {
    super(valueType);
    this._partitionBoundary = partitionBoundary;
  }

  get partitionBoundary() { return this._partitionBoundary; }
}


class RepeatedFieldType extends ContainerFieldType {
}


class MapFieldType extends ContainerFieldType {

  constructor(keyType, valueType, partitionBoundary) {
    super(valueType, partitionBoundary);
    this._keyType = keyType;
  }

  get keyType() { return this._keyType; }
}


class SetFieldType extends ContainerFieldType {}


class ScalarType extends ValueType {}
class BooleanType extends ScalarType {}
class FloatType extends ScalarType {}
class IntegerType extends ScalarType {}
class StringType extends ScalarType {}

ScalarType._instances = {
  'TYPE_BOOL': new BooleanType,
  'TYPE_FLOAT': new FloatType,
  'TYPE_INT64': new IntegerType,
  'TYPE_STRING': new StringType
};


class ReferenceType extends ValueType {

  constructor(messageDescriptor) {
    super();
    this._messageDescriptor = messageDescriptor;
  }

  get messageDescriptor() { return this._messageDescriptor; }
}


class FileDescriptor {

  static fromJson(json) {
    return new this(json.package);
  }

  constructor(packageName) {
    this._packageName = packageName;
  }

  get qualifiedName() {
    return this._packageName ? '.' + this._packageName : '';
  }
}


class Pending {

  constructor(qualifiedName) {
    this._qualifiedName = qualifiedName;  // TODO: Remove after becomes Descriptor.
  }

  get qualifiedName() { return this._qualifiedName; }
}
