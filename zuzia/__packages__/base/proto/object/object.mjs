
import assert from '/zuzia/__packages__/base/assert.mjs';
import Classes from '/zuzia/__packages__/base/classes.mjs';
import Fetch from '/zuzia/__packages__/base/fetch.mjs';
import JSONDecoder from '/zuzia/__packages__/base/json-decoder.mjs';
import Objects from '/zuzia/__packages__/base/objects.mjs';

import MessageExt, {MessageExtClassFactory, createMessageExtClassesFromFileDescriptorSetJson} from '/zuzia/__packages__/base/proto/ext/message.mjs';
import ObjectDescriptor from '/zuzia/__packages__/base/proto/object/descriptor.mjs';


// Message interface:              needed by Object client code
// 
// M static fromObject             in remote(), to create a request, in MessageBuilder
// 
// C path                          in browser, to create a request
// C resolve                       -
// 
// C isEmpty                       yes
// M has                           yes
// M <getters / setters>           yes
// 
// M forEachField                  yes
// C forEachNestedEntry            yes
// M fieldEntries                  yes
// 
// C toJson                        to create a request, in MessageBuilder
// 
// M ownChange                     yes
// M subtreeChange                 yes
// 
// C updateJson                    in remote()

//                   ?
// Message           -> Object
//   | ok                 | ok
//   v               ?    v
// TimeseriesMessage -> TimeseriesObject
// 
// TimeseriesMessage = class(base=Message, prototype=<Timeseries descriptor, getters/setters>)
// TimeseriesObject = class(base=Object, prototype=<Timeseries descriptor, getters/setters>)
// 
// 
// MessageBase         -> ObjectBase
//   |                      |
//   v                      v
// Message<Timeseries> -> Object<Timeseries>

export default class ObjectView extends MessageExt {

  static get classFactory() { return new ObjectViewClassFactory; }

  static get descriptorClass() { return ObjectDescriptor; }

  static async remote(objectUrl, dataViewNameJson, dataViewRequest) {
    const objectClass = (this != ObjectView) ?
      this : await this._fetchAndCreateObjectClass(objectUrl);
    const objectView = objectClass.fromObject({}, {rootUrl: objectUrl});

    return new Promise((resolve, reject) => {
      objectView.streamDataView(dataViewNameJson, dataViewRequest).onData(() => {
        if (resolve) {
          resolve(objectView);
          resolve = null;
        }
      });
    });
  }

  static async _fetchAndCreateObjectClass(objectUrl) {
    const {typeName, fileDescriptorSet} =
      // TODO: Request json format via an http header?
      await Fetch.get(objectUrl + '/descriptor').getJson();
    const objectClass =
      createObjectClassesFromFileDescriptorSetJson(fileDescriptorSet)[typeName];
    return objectClass;
  }

  _rpc(rpcDescriptor, request, handler) {
    assert(!!rpcDescriptor.requestMessageExtClass == !!request);
    const rpcJson = {
      object: this.path(),
      method: rpcDescriptor.methodName
    };
    if (rpcDescriptor.requestMessageExtClass) {
      if (!(request instanceof rpcDescriptor.requestMessageExtClass)) {
        request = rpcDescriptor.requestMessageExtClass.fromObject(request);
      }
      rpcJson.request = request.toJson();
    }
    return Fetch.post(
      // TODO: Request json format via an http header?
      this._context.rootUrl + (handler || '/rpc'),
      JSON.stringify(rpcJson));
  }

  streamDataView(dataViewNameJson, request) {
    // TODO: _createDataViewMethod.
    if (!dataViewNameJson) {
      // TODO: Request json format via an http header?
      var fetchResponse = Fetch.get(this._context.rootUrl + '/data');
    } else {
      const rpcDescriptor = this.constructor.descriptor.rpcs[dataViewNameJson];
      fetchResponse = this._rpc(rpcDescriptor, request, '/data');
    }
    const jsonStream = fetchResponse.streamJson(
      'length-prefixed', JSONDecoder.parse.bind(JSONDecoder));
    jsonStream.onData(updateJson => this.updateJson(updateJson));
    return jsonStream;
  }
}


export class ObjectViewClassFactory extends MessageExtClassFactory {

  constructor() {
    super(ObjectView);
  }

  _createPrototype(descriptor) {
    return Objects.mergeAllProperties(
      this._createGettersAndSetters(descriptor),
      this._createRpcMethods(descriptor));
  }

  _createRpcMethods(descriptor) {
    return Objects.mapValues(descriptor.rpcs || {}, (
      rpcDescriptor => this._createRpcMethod(rpcDescriptor)));
  }

  _createRpcMethod(rpcDescriptor) {
    return function (request) { this._rpc(rpcDescriptor, request); };
  }
}


export function createObjectClassesFromFileDescriptorSetJson(json) {
  return createMessageExtClassesFromFileDescriptorSetJson(json, ObjectView);
}

  // return Objects.mapValues(
  //   // TODO: Return ObjectDescriptors only, not MessageExtDescriptors.
  //   ObjectDescriptor.createAllFromFileDescriptorSetJson(json),
  //   descriptor => (new ObjectViewClassFactory).createFromDescriptor(descriptor));
