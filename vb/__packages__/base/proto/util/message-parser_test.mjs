
import MessageParser from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/util/message-parser.mjs';

import 'https://wiktortomczak.github.io/vb/__packages__/base/proto/ext/testing/message.pbext.mjs';
const protoExt = window.protoExt;

const {beforeEach, describe, it} = window.Mocha;
const chai = window.chai;


describe('MessageParser', function () {

  let parser;

  protoExt.test.Message.fromObject = messageObj => messageObj;

  beforeEach(function() {
    parser = new MessageParser(protoExt.test.Message.descriptor);
  });

  it('', function () {
    _assertParseMessage('', {});
    _assertParseMessage('i=1', {i: 1});
    _assertParseMessage('   i  =  1  ', {i: 1});
    _assertParseMessage('i:1', {i: 1});
    _assertParseMessage('   i  :  1  ', {i: 1});
    _assertParseMessage('s=""', {s: ''});
    _assertParseMessage('s="abc"', {s: 'abc'});
    _assertParseMessage('s=" "', {s: ' '});
    _assertParseMessage('s="="', {s: '='});
    _assertParseMessage('s=" = "', {s: ' = '});
    _assertParseMessage('i:1 s="i:2"', {i:1, s: 'i:2'});
    _assertParseMessage(' i = 1 s : "i:2 " ', {i:1, s: 'i:2 '});
    _assertParseMessage('i', null);
    _assertParseMessage('i=', null);
    _assertParseMessage('i==', null);
    _assertParseMessage('s=', null);
    _assertParseMessage('s==', null);
  });

  // it('create from json', function () {
  //   _fromJson({i: 1});
  //   _assertMessage({i: 1});

  //   _fromJson({li: [2, 3]});
  //   _assertMessage({li: [2, 3]});

  //   _fromJson({mi: {a: 4, b: 5}});
  //   _assertMessage({mi: {a: 4, b: 5}});

  //   _fromJson({m: {}});
  //   _assertMessage({m: {}});

  //   _fromJson({m: {i: 6}});
  //   _assertMessage({m: {i: 6}});

  //   _fromJson({lm: [{}, {i: 7}]});
  //   _assertMessage({lm: [{}, {i: 7}]});

  //   _fromJson({mm: {a: {}, b: {i: 8}}});
  //   _assertMessage({mm: {a: {}, b: {i: 8}}});

  //   _fromJson({i: 9, m: {mm: {'a': {i: 10}}}});
  //   _assertMessage({i: 9, m: {mm: {'a': {i: 10}}}});
  // });

  // it('create from object', function () {
  //   function fromObject(obj) {
  //     return protoExt.test.Message.fromObject(obj);
  //   }

  //   _fromObject({i: 1});
  //   _assertMessage({i: 1});

  //   _fromObject({li: [2, 3]});
  //   _assertMessage({li: [2, 3]});

  //   _fromObject({mi: {a: 4, b: 5}});
  //   _assertMessage({mi: {a: 4, b: 5}});

  //   _fromObject({m: fromObject({})});
  //   _assertMessage({m: {}});

  //   _fromObject({m: fromObject({i: 6})});
  //   _assertMessage({m: {i: 6}});

  //   _fromObject({lm: [fromObject({}), fromObject({i: 7})]});
  //   _assertMessage({lm: [{}, {i: 7}]});

  //   _fromObject({mm: {a: fromObject({}), b: fromObject({i: 8})}});
  //   _assertMessage({mm: {a: {}, b: {i: 8}}});

  //   _fromObject({i: 9, m: fromObject({mm: {'a': fromObject({i: 10})}})});
  //   _assertMessage({i: 9, m: {mm: {'a': {i: 10}}}});
  // });

  // it('merge i', function () {
  //   m.updateJson({merge: {i: 1}});
  //   _assertMessage({i: 1}, {ownChanges: 1, subtreeChanges: 1});
  //   m.updateJson({merge: {i: 2}});
  //   _assertMessage({i: 2}, {ownChanges: 2, subtreeChanges: 2});
  // });

  // it('merge li', function () {
  //   m.updateJson({merge: {li: {0: 1}}});
  //   _assertMessage({li: [1]}, {ownChanges: 1, subtreeChanges: 1});
  //   m.updateJson({merge: {li: {0: 2, 1: 3}}});
  //   _assertMessage({li: [2, 3]}, {ownChanges: 2, subtreeChanges: 2});
  // });

  // it('merge mi', function () {
  //   m.updateJson({merge: {mi: {'a': 1}}});
  //   _assertMessage({mi: {'a': 1}}, {ownChanges: 1, subtreeChanges: 1});
  //   m.updateJson({merge: {mi: {'a': 2, 'b': 3}}});
  //   _assertMessage({mi: {'a': 2, 'b': 3}}, {ownChanges: 2, subtreeChanges: 2});
  // });

  // it('merge m', function () {
  //   m.updateJson({merge: {m: {}}});
  //   _assertMessage({m: {}}, {ownChanges: 1, subtreeChanges: 1});
  //   m.updateJson({merge: {m: {i: 1}}});
  //   _assertMessage({m: {i: 1}}, {ownChanges: 1, subtreeChanges: 2});
  //   m.updateJson({merge: {m: {li: {0: 2}}}});
  //   _assertMessage({m: {i: 1, li: [2]}}, {ownChanges: 1, subtreeChanges: 3});
  //   m.updateJson({merge: {m: {mi: {'a': 3}}}});
  //   _assertMessage({m: {i: 1, li: [2], mi: {'a': 3}}}, {ownChanges: 1, subtreeChanges: 4});
  //   m.updateJson({merge: {m: {i: 5, li: {0: 6, 1: 7}, mi: {'a': 8, 'b': 9}}}});
  //   _assertMessage({m: {i: 5, li: [6, 7], mi: {'a': 8, 'b': 9}}}, {ownChanges: 1, subtreeChanges: 5});
  // });

  // it('merge lm', function () {
  //   m.updateJson({merge: {lm: {0: {}}}});
  //   _assertMessage({lm: [{}]}, {ownChanges: 1, subtreeChanges: 1});
  //   m.updateJson({merge: {lm: {0: {i: 1}}}});
  //   _assertMessage({lm: [{i: 1}]}, {ownChanges: 1, subtreeChanges: 2});
  //   m.updateJson({merge: {lm: {0: {i: 2}, 1: {i: 3}}}});
  //   _assertMessage({lm: [{i: 2}, {i: 3}]}, {ownChanges: 2, subtreeChanges: 3});
  // });

  // it('merge mm', function () {
  //   m.updateJson({merge: {mm: {'a': {}}}});
  //   _assertMessage({mm: {a: {}}}, {ownChanges: 1, subtreeChanges: 1});
  //   m.updateJson({merge: {mm: {'a': {i: 1}}}});
  //   _assertMessage({mm: {a: {i: 1}}}, {ownChanges: 1, subtreeChanges: 2});
  //   m.updateJson({merge: {mm: {a: {i: 2}, b: {i: 3}}}});
  //   _assertMessage({mm: {a: {i: 2}, b: {i: 3}}}, {ownChanges: 2, subtreeChanges: 3});
  // });

  // it('set at path', function () {
  //   m.updateJson({path: '.i', set: 1});
  //   _assertMessage({i: 1}, {ownChanges: 1, subtreeChanges: 1});
  //   m.updateJson({path: '.li[0]', set: 2});
  //   _assertMessage({i: 1, li: [2]}, {ownChanges: 2, subtreeChanges: 2});
  //   m.updateJson({path: '.m', set: {i: 3}});
  //   _assertMessage({i: 1, li: [2], m: {i: 3}},
  //                  {ownChanges: 3, subtreeChanges: 3});
  //   m.updateJson({path: '.lm[0].mm["a"]', set: {i: 4}});
  //   _assertMessage({i: 1, li: [2], m: {i: 3}, lm: [{mm: {'a': {i: 4}}}]},
  //                  {ownChanges: 4, subtreeChanges: 4});
  // });

  // it('merge at path', function () {
  //   m.updateJson({path: '.m', merge: {i: 1}});
  //   _assertMessage({m: {i: 1}}, {ownChanges: 1, subtreeChanges: 1});
  //   m.updateJson({path: '.lm[0].mm["a"]', merge: {i: 2}});
  //   _assertMessage({m: {i: 1}, lm: [{mm: {'a': {i: 2}}}]},
  //                  {ownChanges: 2, subtreeChanges: 2});
  // });

  // function _fromJson(json) {
  //   m = protoExt.test.Message.fromJson(json);
  //   _listen();
  // }

  // function _fromObject(obj) {
  //   m = protoExt.test.Message.fromObject(obj);
  //   _listen();
  // }

  // function _listen() {
  //   m.ownChanges = m.subtreeChanges = 0;
  //   m.ownChange.listen(() => ++m.ownChanges);
  //   m.subtreeChange.listen(() => ++m.subtreeChanges);
  // }

  function _assertParseMessage(messageStr, expectedJson) {
    const messageObj = parser.parseMessage(messageStr);
    chai.assert.deepEqual(messageObj, expectedJson);
  }
});
