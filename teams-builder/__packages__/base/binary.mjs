
import Iterables from 'base/iterables.mjs';


export class Uint8Arrays {
  
  static concat(a, b) {
    const result = new Uint8Array(a.length + b.length);
    result.set(a);
    result.set(b, a.length);
    return result;
  }

  static unpackUint32(arr) {
    return new Uint32Array(arr.buffer.slice(0, 4))[0];
  }
}


export class BinaryMessage {

  static *fromUint8Arrays(out) {
    while (true) {
      let data = yield;
      if (partialData) {
        data = _concatUint8Arrays(partialData, data);
      }
      for (let message; message = BinaryMessage.readMessage(data); ) {
        out.put(message);
        data = data.slice(message.length);
      }
      var partialData = data.length ? data : null;
    }
    // assert(!partialData)  // TODO
  }

  static readMessage(data) {
    if (data.length >= 2) {
      const messageLength = _unpackUint16(data.buffer);
      if (data.length >= messageLength)
        return data.slice(0, messageLength);
    }
    return null;
  }

  // static fromUint8ArrayIter(uint8Iter) {
  //   let partialData = null;
  //   return Iterables.transform(uint8Iter, (data, sink) => {
  //     if (partialData) {
  //       data = _concatUint8Arrays(partialData, data);
  //       partialData = null;
  //     }
  //     for (let messageLength;
  //          messageLength = this._getMessageLengthIfComplete(data); ) {
  //       const message = data.slice(0, messageLength);
  //       sink.put(message);
  //       data = data.slice(messageLength);
  //     }
  //     if (data.length) {
  //       partialData = data;
  //     }
  //   });
  // }
}


export class BinaryReader {

  static fromTypedArray(arr) {
    return new this(arr.buffer);
  }

  constructor(buffer) {
    this._buffer = buffer;
    this._offset = 0;
  }

  readUint16() {
    const uint16 = _unpackUint16(this._buffer, this._offset);
    this._offset += 2;
    return uint16;
  }

  readUint8Array() {
    const numElements = this.readUint16() - 2;
    const array = new Uint8Array(
      this._buffer.slice(this._offset, this._offset + numElements));
    this._offset += numElements;
    return array;
  }
}


function _concatUint8Arrays(a, b) {
  const result = new Int8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
}


function _unpackUint16(buffer, offset=0) {
  return new Uint16Array(buffer.slice(offset, offset+2))[0];
};
