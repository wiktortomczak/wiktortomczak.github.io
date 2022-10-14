
import {TextDeserializer} from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/serializers/text.mjs';

const {beforeEach, describe, it} = window.Mocha;
const chai = window.chai;


describe('TextDeserializer', function () {

  let deserializer;

  beforeEach(function() {
    deserializer = new TextDeserializer({PartitionUpdate: Array});
  });

  it('deserializeData', function () {
    _assertData('{}', {});
    _assertData('{"a": 1, "b": [2], "c": {"d": 3}}', {a: 1, b: [2], c: {d: 3}});
    _assertData('{"a": ., "b": [.a], "c": [.a.b, .a[1].b], "d": [.a[1]]}',
                {a: [], b: [['a']], c: [['a', 'b'], ['a', 1, 'b']], d: [['a', 1]]});
  });

  it('deserializePath', function () {
    _assertPath('', []);
    _assertPath('.a', ['a']);
    _assertPath('.a.b', ['a', 'b']);
    _assertPath('.a[1]', ['a', 1]);
    _assertPath('.a["b"]', ['a', 'b']);
    _assertPath('.a["1"].b[1]', ['a', '1', 'b', 1]);
  });

  function _assertData(dataStr, dataExpected) {
    const data = deserializer._deserializeData(dataStr);
    chai.assert.deepEqual(data, dataExpected);
  }

  function _assertPath(pathStr, pathExpected) {
    const path = deserializer._deserializePath(pathStr);
    chai.assert.deepEqual(path, pathExpected);
  }
});
