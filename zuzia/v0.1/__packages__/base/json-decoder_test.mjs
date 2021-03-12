
import JSONDecoder from '/zuzia/v0.1/__packages__/base/json-decoder.mjs';

const {describe, it} = window.Mocha;
const chai = window.chai;


describe('JSONDecoder', function () {
  it('parse', function () {
    const r = String.raw;
    chai.assert.deepEqual(parse('null'), null);
    chai.assert.deepEqual(parse('true'), true);
    chai.assert.deepEqual(parse('false'), false);
    chai.assert.deepEqual(parse('0'), 0);
    chai.assert.deepEqual(parse('1'), 1);
    chai.assert.deepEqual(parse('-12'), -12);
    chai.assert.deepEqual(parse('1.0'), 1.0);
    chai.assert.deepEqual(parse('-1.2'), -1.2);
    chai.assert.deepEqual(parse('.1'), .1);
    chai.assert.deepEqual(parse('-.12'), -.12);
    chai.assert.deepEqual(parse('-0.12'), -.12);
    chai.assert.deepEqual(parse('""'), "");
    chai.assert.deepEqual(parse('"a"'), "a");
    chai.assert.deepEqual(parse('"abc"'), "abc");
    chai.assert.deepEqual(parse(r`"a\\c"`), r`a\c`);
    chai.assert.deepEqual(parse(r`"a\"c"`), 'a"c');
    chai.assert.deepEqual(parse('[]'), []);
    chai.assert.deepEqual(parse('[0]'), [0]);
    chai.assert.deepEqual(parse('["a0"]'), ["a0"]);
    chai.assert.deepEqual(parse('[0, 1]'), [0, 1]);
    chai.assert.deepEqual(parse('["a0", 1.]'), ["a0", 1.]);
    chai.assert.deepEqual(parse('{}'), {});
    chai.assert.deepEqual(parse('{"a": 1}'), {a: 1});
    chai.assert.deepEqual(parse(r`{"a\\c": -1.}`), {"a\\c": -1.});
    chai.assert.deepEqual(parse('{"a": 1, "b": 2}'), {a: 1, b: 2});
    chai.assert.deepEqual(parse('["a0", {}, 1.]'), ["a0", {}, 1.]);
    chai.assert.deepEqual(parse('[-1., {"a": 23.}, 4.]'), [-1, {'a': 23}, 4]);
    chai.assert.deepEqual(parse('{"a": [{}, []]}'), {a: [{}, []]});
    chai.assert.deepEqual(parse('\x00\x00\x00\x00'), new Uint8Array);
    chai.assert.deepEqual(parse('\x01\x00\x00\x00\x0f'), new Uint8Array([15]));
    chai.assert.deepEqual(
      parse('\x00\x01\x00\x00' + String.fromCharCode.apply(null, range(256))),
      new Uint8Array(range(256)));
    chai.assert.deepEqual(
      parse('[\x01\x00\x00\x00\x0f, "a"]'),
      [new Uint8Array([15]), "a"]);
  });

  function parse(jsonStr) {
    const u8arr = stringToUint8Array(jsonStr);
    return JSONDecoder.parse(u8arr);
  }
});


function range(end) {
  const arr = new Array(end);
  for (let i = 0; i < end; ++i) {
    arr[i] = i;
  }
  return arr;
}


function stringToUint8Array(str) {
  const u8arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; ++i) {
    u8arr[i] = str.charCodeAt(i);
  }
  return u8arr;
}
