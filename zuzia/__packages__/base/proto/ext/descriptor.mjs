
import assert from '/zuzia/__packages__/base/assert.mjs';
import Types from '/zuzia/__packages__/base/types.mjs';


export default class MessageExtDescriptor {

  static createAllFromFileDescriptorSetJson(json) {
    assert(json.file.length == 1);
    const namePrefix = '.' + (json.file[0].package ? json.file[0].package + '.' : '');
    const descriptors = {};
    json.file[0].messageType.forEach(descriptorJson => {
      this.fromJsonWithNested(descriptorJson, namePrefix, descriptors);
    });
    assert(Object.values(descriptors).every(
      descriptor => !this._isPending(descriptor)));
    return descriptors;
  }

  static fromJsonWithNested(json, namePrefix, descriptorsOut) {
    (json.nestedType || []).forEach(nestedJson => {
      this.fromJsonWithNested(
        nestedJson, namePrefix + json.name + '.', descriptorsOut);
    });
    const descriptor = this.fromJson(json, namePrefix);
    this._register(descriptor, descriptorsOut);
    return descriptor;
  }

  static fromJson(json, namePrefix) {
    const qualifiedName = namePrefix + json.name;
    const fields = {};
    json.field.forEach(fieldJson => {
      const fieldDescriptor =
        FieldExtDescriptor.fromJson(fieldJson, qualifiedName + '.', this);
      fields[fieldDescriptor.nameJson] = fieldDescriptor;
    });
    const isMapEntry = !!(json.options || {}).mapEntry;
    return new this(json.name, qualifiedName, fields, isMapEntry);
  }

  static _register(descriptor, descriptorsOut) {
    if (!this._registry[descriptor.qualifiedName]) {
      this._registry[descriptor.qualifiedName] = descriptor;
    } else {
      const descriptorPending = this._registry[descriptor.qualifiedName];
      assert(this._isPending(descriptorPending));
      _constructInPlaceFrom(descriptorPending, descriptor);
    }

    if (descriptorsOut) {
      descriptorsOut[descriptor.qualifiedName] =
        this._registry[descriptor.qualifiedName];
    }
  }

  static getByName(qualifiedName) {
    const descriptor = this._registry[qualifiedName];
    assert(!this._isPending(descriptor));
    return descriptor;
  }

  constructor(name, qualifiedName, fields, isMapEntry) {
    this._name = name;
    this._qualifiedName = qualifiedName;
    this._fields = fields;
    this._isMapEntry = isMapEntry;
  }

  get name() { return this._name; }
  get qualifiedName() { return this._qualifiedName; }
  get fields() { return this._fields; }

  messageExtClass;          // Set by MessageExtClassFactory.

  static _getOrCreatePending(qualifiedName) {
    const descriptor = this._registry[qualifiedName];
    if (descriptor) {
      return descriptor;
    } else {
      return this._registry[qualifiedName] = Object.create(null);
    }
  };

  static _isPending(descriptor) {
    return !descriptor.constructor;
  }
}

MessageExtDescriptor._registry = {};


class FieldExtDescriptor {

  static fromJson(json, namePrefix, messageExtDescriptorClass) {   
    const mapFieldInfo = this._getMapFieldInfo(json, messageExtDescriptorClass);
    const isReference =
      !!((json.options || {})['[protoExt.field]'] || {}).reference;
    const type =
      json.type != 'TYPE_MESSAGE' ? ScalarType._instances[json.type] :
      mapFieldInfo ? mapFieldInfo.valueType :
      !isReference ?
        messageExtDescriptorClass._getOrCreatePending(json.typeName) : 
      new ReferenceType(
        messageExtDescriptorClass._getOrCreatePending(json.typeName));
    const constructorArgs = [json.name, json.jsonName, type, isReference];
    if (json.label == 'LABEL_OPTIONAL') {
      return new UnaryFieldExtDescriptor(...constructorArgs);
    } else if (json.label == 'LABEL_REPEATED') {
      if (!mapFieldInfo) {
        return new RepeatedFieldExtDescriptor(...constructorArgs);
      } else {
        return new MapFieldExtDescriptor(
          ...constructorArgs, mapFieldInfo.keyType);
      }
    } else {
      throw Error('unknown label: ' + JSON.stringify(json));
    }
  }

  static _getMapFieldInfo(json, messageExtDescriptorClass) {
    if (json.label == 'LABEL_REPEATED' && json.typeName) {
      const messageDescriptor =
        messageExtDescriptorClass._getOrCreatePending(json.typeName);
      // If this is a map field, the Entry message descriptor has already been
      // created as the parent message's nested type, created before this field
      // descriptor.
      if (messageDescriptor._isMapEntry) {
        return {
          keyType: messageDescriptor.fields['key'].type,
          valueType: messageDescriptor.fields['value'].type
        };
      }
    }
    return null;
  }

  constructor(name, nameJson, type, isReference) {
    this._name = name;
    this._nameJson = nameJson;
    this._type = type;
    this._isReference = isReference;
  }

  get name() { return this._name; }
  get nameJson() { return this._nameJson; }
  get type() { return this._type; }

  get isUnary() { return this instanceof UnaryFieldExtDescriptor; }
  get isRepeated() { return this instanceof RepeatedFieldExtDescriptor; }
  get isMap() { return this instanceof MapFieldExtDescriptor; }
  get isScalar() { return !this.messageDescriptor; }
  get isMessage() { return !!this.messageDescriptor && !this._isReference; }
  get isReference() { return !!this.messageDescriptor && this._isReference; }
  get messageDescriptor() {
    return (
      this._type instanceof MessageExtDescriptor ? this._type :
      this._type instanceof ReferenceType ? this._type.messageDescriptor :
      undefined);
  }
  get messageExtClass() {
    if (this.messageDescriptor) {
      return this.messageDescriptor.messageExtClass;
    }
  }
}


class UnaryFieldExtDescriptor extends FieldExtDescriptor {
}


class RepeatedFieldExtDescriptor extends FieldExtDescriptor {
}


class MapFieldExtDescriptor extends FieldExtDescriptor {

  constructor(name, nameJson, valueType, isReference, keyType) {
    super(name, nameJson, valueType, isReference);
    this._keyType = keyType;
  }

  get valueType() { return this._type; }
  get keyType() { return this._keyType; }
}


class ScalarType {
  valueToJson(value) {}
  valueFromString(str) {}
  valueFromJsonString(jsonStr) {}
  valueFromObj(obj) {}
}

ScalarType._instances = {};


class BooleanType extends ScalarType {

  valueToJson(value) {
    return value;
  }

  valueFromString(str) {
    if (str == 'true') {
      return true;
    } else if (str == 'false') {
      return false;
    } else {
      throw Error(str);
    }
  }

  valueFromJsonString(jsonStr) {
    return this.valueFromString(jsonStr);
  }

  valueFromObj(obj) {
    assert(Types.isBoolean(obj));
    return obj;
  }
}

ScalarType._instances['TYPE_BOOL'] = new BooleanType;


class FloatType extends ScalarType {

  valueToJson(value) {
    return value;
  }

  valueFromString(str) {
    const value = parseFloat(str);
    assert(Types.isNumber(value));
    return value;
  }

  valueFromJsonString(jsonStr) {
    return this.valueFromString(jsonStr);
  }

  valueFromObj(obj) {
    assert(Types.isNumber(obj));
    return obj;
  }
}

ScalarType._instances['TYPE_FLOAT'] = new FloatType;


class IntegerType extends ScalarType {

  valueToJson(value) {
    return value;
  }

  valueFromString(str) {
    const value = parseInt(str);
    assert(Number.isInteger(value));
    return value;
  }

  valueFromJsonString(jsonStr) {
    return this.valueFromString(jsonStr);
  }

  valueFromObj(obj) {
    assert(Number.isInteger(obj));
    return obj;
  }
}

ScalarType._instances['TYPE_INT64'] = new IntegerType;


class StringType extends ScalarType {

  valueToJson(value) {
    return value;
  }

  valueFromString(str) {
    assert(Types.isString(str));
    return str;
  }

  valueFromJsonString(jsonStr) {
    const str = JSON.parse(jsonStr);
    assert(Types.isString(str));
    return str;
  }

  valueFromObj(obj) {
    assert(Types.isString(obj));
    return obj;
  }
}

ScalarType._instances['TYPE_STRING'] = new StringType;


class ReferenceType {

  constructor(messageDescriptor) {
    this._messageDescriptor = messageDescriptor;
  }

  get messageDescriptor() { return this._messageDescriptor; }
}


function _constructInPlaceFrom(target, source) {
  // TODO: Generalize.
  target._name = source._name;
  target._qualifiedName = source._qualifiedName;
  target._fields = source._fields;
  target._isMapEntry = source._isMapEntry; 
  target._rpcs = source._rpcs;
  Object.setPrototypeOf(target, Object.getPrototypeOf(source));
}
