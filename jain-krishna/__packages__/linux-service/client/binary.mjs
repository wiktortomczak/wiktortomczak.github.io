
import Stream from 'https://tomczak.xyz/jain-krishna/__packages__/linux-service/client/stream.mjs';


class Uint8MessageStream extends Stream {

  static fromUint8Stream(uint8Stream) {
    return new this(uint8Stream);
  }

  constructor(uint8Stream) {
    super();
    uint8Stream.onData(this._handleUint8Data.bind(this));
    this._partialData = null;
  }

  _handleUint8Data(data) {
    if (this._partialData) {
      data = concatUint8Arrays(this._partialData, data);
      this._partialData = null;
    }
    while (data.length >= 2) {
      const messageLength = new Uint16Array(data.buffer.slice(0, 2))[0];
      if (data.length >= messageLength) {
        const message = data.slice(0, messageLength);
        this.put(message);
        data = data.slice(messageLength);
      }
    }
    if (data.length) {
      this._partialData = data;
    }
  }
}


class BinaryReader {

  static fromTypedArray(arr) {
    return new this(arr.buffer);
  }

  constructor(buffer) {
    this._buffer = buffer;
    this._offset = 0;
  }

  readUint16() {
    const uint16 = new Uint16Array(this._buffer.slice(this._offset, this._offset + 2))[0];
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


function concatUint8Arrays(a, b) {
  const result = new Int8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
}


export {Uint8MessageStream, BinaryReader};
