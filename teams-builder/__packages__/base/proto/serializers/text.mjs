
import assert from 'base/assert.mjs';
import IntervalSet from 'base/interval-set.mjs';
import Objects from 'base/objects.mjs';
import Strings from 'base/strings.mjs';

import Slice from 'base/slice.mjs';
import {ContainerField, Message, Path} from 'base/proto/ext/message2.mjs';


export class TextSerializer {

  constructor(messageClasses) {
    this._messageClasses = messageClasses;
  }

  serializeMessage(message) {
    if (message instanceof this._messageClasses.ListenObject) {
      return this._serializeListenObject(message);
    }
  }

  _serializeListenObject({callId, path}) {
    return `${callId} ${path.toString()}`;
  }
}


export class TextDeserializer {

  constructor(messageClasses) {
    this._messageClasses = messageClasses;
  }
  
  deserializeMessage(callIdmessageStr) {
    const [callId, messageStr] = Strings.partition(callIdmessageStr, ' ');
    if (callId == '0') {
      if (messageStr.startsWith('$')) {
        return this._deserializeCompoundUpdate(messageStr);
      } else {
        if (!messageStr.endsWith('-')) {
          return this._deserializePartitionUpdate(messageStr);
        } else {
          return this._deserializeListenObjectEnd(messageStr);
        }
      }
    } else {
      return this._deserializeCallResult(+Number(callId), messageStr);
    }
  }

  _deserializePartitionUpdate(messageStr) {
    // TODO: Handle commas in paths.
    const i = messageStr.indexOf(',', messageStr.indexOf(',') + 1);
    const [partitionPathStr, targetPathStr] = messageStr.substring(0, i).split(',');
    const opStr = messageStr.substring(i + 1);
    let method, dataStr;
    if (!opStr) {
      method = 'delete';
    } else if (opStr.startsWith('update') || opStr.startsWith('insert')) {
      method = opStr.substring(0, 6);
      dataStr = opStr.substring(7);
    } else {
      method = 'set';
      dataStr = opStr;
    }
    return new this._messageClasses.PartitionUpdate(
      this._deserializePath(partitionPathStr),
      this._deserializePath(targetPathStr),
      {method, data: dataStr && this._deserializeData(dataStr)});
  }
  
  _deserializeCompoundUpdate(messageStr) {
    return new this._messageClasses.CompoundUpdate;  // TODO
  }

  _deserializeListenObjectEnd(messageStr) {
    const path = this._deserializePath(messageStr.slice(0, -2));
    return new this._messageClasses.ListenObjectEnd(path);
  }

  _deserializeCallResult(callId, resultStr) {
    return new this._messageClasses.CallResult;  // TODO
  }

  _deserializeData(dataStr) {
    let hasPath = false;
    const stringRanges = new IntervalSet(_findJSONStringRanges(dataStr));
    dataStr = dataStr.replaceAll(
      this.constructor._pathRegex,
      (match, offset) => {
        if (!stringRanges.find(offset)) {
          hasPath = true;
          return `{"__path__": ${JSON.stringify(match)}}`;
        } else {
          return match;
        }
      });
    return JSON.parse(dataStr, hasPath ? (key, value) => (
      Objects.hasOnlyKey(value, '__path__')
        ? this._deserializePath(value['__path__']) : value) : undefined);
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
          assert(keyStr.startsWith('[') && keyStr.endsWith(']'));
          const indexOrKeyOrSliceStr = keyStr.substring(1, keyStr.length - 1);
          const [start, stop] = indexOrKeyOrSliceStr.split(':');
          if (stop !== undefined) {
            path.push(ContainerField.SliceKey.create(+Number(start), +Number(stop)));
          } else {
            const key = JSON.parse(indexOrKeyOrSliceStr);
            path.push(new ContainerField.Key(key));
          }
        }
      }
      assert(i == pathStr.length);
    }
    return path;
  }
}


function* _findJSONStringRanges(s) {
  const len = s.length;
  let start;
  let escape = false;
  for (let i = 0; i < len; ++i) {
    const c = s[i];
    if (!escape) {
      if (c == '"') {
        if (start === undefined) {
          start = i;
        } else {
          if (!escape) {
            yield [start, i+1];
            start = undefined;
          }
        }
      } else if (c == '\\') {
        assert(start !== undefined);
        escape = true;
      }
    } else {
      escape = false;
    }
  }
  assert(start === undefined);
  assert(!escape);
}



TextDeserializer._pathRegex = /(?<![\w\]])(?:(?:\.\w+(?:(?:\.\w+)|(?:\[.*?\]))*)|\.)/g;
TextDeserializer._keyRegex = /(?:\.\w+)|(?:\[.*?\])/g;
