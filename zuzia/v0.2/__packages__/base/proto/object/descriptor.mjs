
import assert from '/zuzia/v0.2/__packages__/base/assert.mjs';
import Objects from '/zuzia/v0.2/__packages__/base/objects.mjs';

import MessageExtDescriptor from '/zuzia/v0.2/__packages__/base/proto/ext/descriptor.mjs';


export default class ObjectDescriptor extends MessageExtDescriptor {

  // static fromJsonWithNested(json, namePrefix, descriptorsOut) {
  //   const descriptorsOutInclNonObject = {};
  //   super.fromJsonWithNested(json, namePrefix, descriptorsOutInclNonObject);
  //   Objects.forEach(descriptorsOutInclNonObject, (descriptor, key) => {
  //     if (descriptor instanceof this) {
  //       descriptorsOut[key] = descriptor;
  //     }
  //   });
  // }

  static fromJson(json, parent) {
    const objectExtension = (json.options || {})['[protoObject.object]'];
    if (objectExtension) {
      const {name, parent, fields} = super.fromJson(...arguments);
      const rpcs = this._createRpcDescriptors(objectExtension);
      return new this(name, parent, fields, rpcs);
    } else {
      return MessageExtDescriptor.fromJson(...arguments);
    }
  }

  static _createRpcDescriptors(objectExtension) {
    const rpcs = {};
    ((objectExtension || {}).rpcMethod || []).map(rpcJson => {
      const rpcDescriptor = RpcDescriptor.fromJson(rpcJson);
      rpcs[rpcDescriptor.methodNameJson] = rpcDescriptor;
    });
    return rpcs;
  }

  constructor(name, parent, fields, rpcs) {
    super(name, parent, fields, false /* isMapEntry */);
    this._rpcs = rpcs;
  }

  get rpcs() { return this._rpcs; }
}


export class RpcDescriptor {

  static fromJson(json) {
    return new this(
      json['methodName'], json['methodNameJson'],
      json['requestTypeName']
        ? MessageExtDescriptor._getOrCreatePending(json['requestTypeName'])
        : null);
  }

  constructor(methodName, methodNameJson, requestDescriptor) {
    this._methodName = methodName;
    this._methodNameJson = methodNameJson;
    this._requestDescriptor = requestDescriptor;
  }

  get methodName() { return this._methodName; }
  get methodNameJson() { return this._methodNameJson; }
  get requestMessageExtClass() {
    if (this._requestDescriptor) {
      return this._requestDescriptor.messageExtClass
     }
  }
}
