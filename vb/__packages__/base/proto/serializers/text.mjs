
import assert from 'https://wiktortomczak.github.io/vb/__packages__/base/assert.mjs';
import Objects from 'https://wiktortomczak.github.io/vb/__packages__/base/objects.mjs';

import {ContainerField, Message, Path} from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/ext/message2.mjs';


export class TextDeserializer {

  constructor(messageClasses) {
    this._messageClasses = messageClasses;
  }
  
  deserializeMessage(messageStr) {
    const i = messageStr.indexOf(',', messageStr.indexOf(',') + 1);
    const [partitionPathStr, targetPathStr] = messageStr.substring(0, i).split(',');
    const opStr = messageStr.substring(i + 1);
    let method, dataStr;
    if (!opStr) {
      method = 'delete';
    } else if (opStr.startsWith('update') || opStr.startsWith('insert')) {
      method = opStr.substring(0, 6);
      dataStr = this._deserializeData(opStr.substring(7));
    } else {
      method = 'set';
      dataStr = opStr;
    }
    return new this._messages.PartitionUpdate(
      this._deserializePath(partitionPathStr),
      this._deserializePath(targetPathStr),
      {method, data: dataStr && this._deserializeData(dataStr)});
  }

  _deserializeData(dataStr) {
    dataStr = dataStr.replaceAll(
      this.constructor._pathRegex,
      match => {
        return `{"__path__": ${JSON.stringify(match)}}`;
      });
    return JSON.parse(dataStr, (key, value) => (
      Objects.hasOnlyKey(value, '__path__')
        ? this._deserializePath(value['__path__']) : value));
  }

  _deserializePath(pathStr) {
    const path = new Path();
    if (pathStr != '.') {
      let i = 0;
      for (const match of pathStr.matchAll(this.constructor._keyRegex)) {
        assert(i == match.index);
        const keyStr = match[0];
        i += keyStr.length;
        if (keyStr.charAt(0) == '.') {
          path.push(new Message.FieldNameJson(keyStr.substring(1)));
        } else {
          const key = JSON.parse(keyStr.substring(1, keyStr.length - 1));
          path.push(new ContainerField.Key(key));
        }
      }
      assert(i == pathStr.length);
    }
    return path;
  }
}

TextDeserializer._pathRegex = /(?<![\w\]])(?:\.\w+(?:(?:\.\w+)|(?:\[.*?\]))*)|\./g;
TextDeserializer._keyRegex = /(?:\.\w+)|(?:\[.*?\])/g;
