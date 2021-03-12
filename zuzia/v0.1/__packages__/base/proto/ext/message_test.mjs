
import Maps from '/zuzia/v0.1/__packages__/base/maps.mjs';

import '/zuzia/v0.1/__packages__/base/proto/ext/testing/message.pbext.mjs';
const protoExt = window.protoExt;

const {beforeEach, describe, it} = window.Mocha;
const chai = window.chai;


describe('MessageExt', function () {

  let m;

  beforeEach(function() {
    _fromJson();
  });

  it('empty', function () {
    _assertMessage({});
  });

  it('create from json', function () {
    _fromJson({i: 1});
    _assertMessage({i: 1});

    _fromJson({li: [2, 3]});
    _assertMessage({li: [2, 3]});

    _fromJson({mi: {a: 4, b: 5}});
    _assertMessage({mi: {a: 4, b: 5}});

    _fromJson({m: {}});
    _assertMessage({m: {}});

    _fromJson({m: {i: 6}});
    _assertMessage({m: {i: 6}});

    _fromJson({lm: [{}, {i: 7}]});
    _assertMessage({lm: [{}, {i: 7}]});

    _fromJson({mm: {a: {}, b: {i: 8}}});
    _assertMessage({mm: {a: {}, b: {i: 8}}});

    _fromJson({i: 9, m: {mm: {'a': {i: 10}}}});
    _assertMessage({i: 9, m: {mm: {'a': {i: 10}}}});

    // TODO: Make sure this passes even if rm comes before m in the json.
    _fromJson({rm: '.m', m: {i: 1}});  // m.rm = m.m; m.m.i = 1
    _assertMessage({m: {i: 1}, rm: m.m});

    // TODO: Make sure this passes even if rm comes before m in the json.
    // m.rm = m.m.lm[0]; m.m.lm[0].i = 1
    _fromJson({rm: '.m.lm[0]', m: {lm: [{i: 1}]}});
    _assertMessage({m: {lm: [{i: 1}]}, rm: m.m.lm[0]});

    _fromJson({m: {rm: '.m'}});  // m.m.rm = m.m
    _assertMessage({m: {rm: m.m}});
  });

  it('create from object', function () {
    function fromObject(obj) {
      return protoExt.test.Message.fromObject(obj);
    }

    _fromObject({i: 1});
    _assertMessage({i: 1});

    _fromObject({li: [2, 3]});
    _assertMessage({li: [2, 3]});

    _fromObject({mi: {a: 4, b: 5}});
    _assertMessage({mi: {a: 4, b: 5}});

    _fromObject({m: fromObject({})});
    _assertMessage({m: {}});

    _fromObject({m: fromObject({i: 6})});
    _assertMessage({m: {i: 6}});

    _fromObject({lm: [fromObject({}), fromObject({i: 7})]});
    _assertMessage({lm: [{}, {i: 7}]});

    _fromObject({mm: {a: fromObject({}), b: fromObject({i: 8})}});
    _assertMessage({mm: {a: {}, b: {i: 8}}});

    _fromObject({i: 9, m: fromObject({mm: {'a': fromObject({i: 10})}})});
    _assertMessage({i: 9, m: {mm: {'a': {i: 10}}}});
  });

  it('set & delete i', function () {
    m.updateJson(['.i', 1]);
    _assertMessage({i: 1}, {ownChanges: 1, subtreeChanges: 1});
    m.updateJson(['.i', 2]);
    _assertMessage({i: 2}, {ownChanges: 2, subtreeChanges: 2});
    m.updateJson(['.i', null]);
    _assertMessage({}, {ownChanges: 3, subtreeChanges: 3});
  });

  it('set & delete li', function () {
    m.updateJson(['.li[0]', 1]);
    _assertMessage({li: [1]}, {ownChanges: 1, subtreeChanges: 1});
    m.updateJson(['.li[1]', 2]);
    _assertMessage({li: [1, 2]}, {ownChanges: 2, subtreeChanges: 2});
    m.updateJson(['.li[0]', 3]);
    _assertMessage({li: [3, 2]}, {ownChanges: 3, subtreeChanges: 3});
    m.updateJson(['.li[1]', null]);
    _assertMessage({li: [3]}, {ownChanges: 4, subtreeChanges: 4});
    m.updateJson(['.li[0]', null]);
    _assertMessage({}, {ownChanges: 5, subtreeChanges: 5});
  });

  it('set & delete mi', function () {
    m.updateJson(['.mi["a"]', 1]);
    _assertMessage({mi: {'a': 1}}, {ownChanges: 1, subtreeChanges: 1});
    m.updateJson(['.mi["b"]', 2]);
    _assertMessage({mi: {'a': 1, 'b': 2}}, {ownChanges: 2, subtreeChanges: 2});
    m.updateJson(['.mi["a"]', 3]);
    _assertMessage({mi: {'a': 3, 'b': 2}}, {ownChanges: 3, subtreeChanges: 3});
    m.updateJson(['.mi["a"]', null]);
    _assertMessage({mi: {'b': 2}}, {ownChanges: 4, subtreeChanges: 4});
    m.updateJson(['.mi["b"]', null]);
    _assertMessage({}, {ownChanges: 5, subtreeChanges: 5});
  });

  it('set & delete m', function () { 
    m.updateJson(['.m', {}]);
    _assertMessage({m: {}}, {ownChanges: 1, subtreeChanges: 1});
    m.updateJson(['.m.i', 1]);
    _assertMessage({m: {i: 1}}, {ownChanges: 1, subtreeChanges: 2});
    m.updateJson(['.m.li[0]', 2]);
    _assertMessage({m: {i: 1, li: [2]}}, {ownChanges: 1, subtreeChanges: 3});
    m.updateJson(['.m.mi["a"]', 3]);
    _assertMessage({m: {i: 1, li: [2], mi: {'a': 3}}}, {ownChanges: 1, subtreeChanges: 4});
    m.updateJson(['.m.i', 5]);
    _assertMessage({m: {i: 5, li: [2], mi: {'a': 3}}}, {ownChanges: 1, subtreeChanges: 5});
    m.updateJson(['.m.li[1]', 6]);
    _assertMessage({m: {i: 5, li: [2, 6], mi: {'a': 3}}}, {ownChanges: 1, subtreeChanges: 6});
    m.updateJson(['.m.mi["b"]', 7]);
    _assertMessage({m: {i: 5, li: [2, 6], mi: {'a': 3, 'b': 7}}}, {ownChanges: 1, subtreeChanges: 7});
    m.updateJson(['.m.i', null]);
    _assertMessage({m: {li: [2, 6], mi: {'a': 3, 'b': 7}}}, {ownChanges: 1, subtreeChanges: 8});
    m.updateJson(['.m', null]);
    _assertMessage({}, {ownChanges: 2, subtreeChanges: 9});
  });

  it('set & delete lm', function () {
    m.updateJson(['.lm[0]', {}]);
    _assertMessage({lm: [{}]}, {ownChanges: 1, subtreeChanges: 1});
    m.updateJson(['.lm[0].i', 1]);
    _assertMessage({lm: [{i: 1}]}, {ownChanges: 1, subtreeChanges: 2});
    m.updateJson(['.lm[1].i', 2]);
    _assertMessage({lm: [{i: 1}, {i: 2}]}, {ownChanges: 2, subtreeChanges: 3});
    m.updateJson(['.lm[0].i', 3]);
    _assertMessage({lm: [{i: 3}, {i: 2}]}, {ownChanges: 2, subtreeChanges: 4});
    m.updateJson(['.lm[1]', null]);
    _assertMessage({lm: [{i: 3}]}, {ownChanges: 3, subtreeChanges: 5});
    m.updateJson(['.lm[0]', null]);
    _assertMessage({}, {ownChanges: 4, subtreeChanges: 6});
  });

  it('set & delete mm', function () {
    m.updateJson(['.mm["a"]', {}]);
    _assertMessage({mm: {a: {}}}, {ownChanges: 1, subtreeChanges: 1});
    m.updateJson(['.mm["a"].i', 1]);
    _assertMessage({mm: {a: {i: 1}}}, {ownChanges: 1, subtreeChanges: 2});
    m.updateJson(['.mm["b"].i', 2]);
    _assertMessage({mm: {a: {i: 1}, b: {i: 2}}}, {ownChanges: 2, subtreeChanges: 3});
    m.updateJson(['.mm["a"].i', 3]);
    _assertMessage({mm: {a: {i: 3}, b: {i: 2}}}, {ownChanges: 2, subtreeChanges: 4});
    m.updateJson(['.mm["a"]', null]);
    _assertMessage({mm: {b: {i: 2}}}, {ownChanges: 3, subtreeChanges: 5});
    m.updateJson(['.mm["b"]', null]);
    _assertMessage({}, {ownChanges: 4, subtreeChanges: 6});
  });

  it('set & delete rm', function () {
    m.updateJson(['', {m: {i: 1}, rm: '.m'}]);
    _assertMessage({m: {i: 1}, rm: m.m}, {ownChanges: 1, subtreeChanges: 1});
    chai.assert.equal(m.rm.i, 1);
    m.updateJson(['.m.i', 2]);
    _assertMessage({m: {i: 2}, rm: m.m}, {ownChanges: 1, subtreeChanges: 2});
    chai.assert.equal(m.rm.i, 2);
    m.updateJson(['.rm', null]);
    _assertMessage({m: {i: 2}}, {ownChanges: 2, subtreeChanges: 3});
  });

  it('set many', function () {
    m.updateJson(['', {
      i: 1,
      li: [2, 3],
      mi: {a: 4, b: 5},
      m: {i: 6},
      lm: [{}, {i: 7}],
      mm: {a: {i: 8}, b: {}}
    }]);
    _assertMessage({
      i: 1,
      li: [2, 3],
      mi: {a: 4, b: 5},
      m: {i: 6},
      lm: [{}, {i: 7}],
      mm: {a: {i: 8}, b: {}}
    }, {ownChanges: 1, subtreeChanges: 1});
  });

  function _fromJson(json) {
    m = protoExt.test.Message.fromJson(json);
    _listen();
  }

  function _fromObject(obj) {
    m = protoExt.test.Message.fromObject(obj);
    _listen();
  }

  function _listen() {
    m.ownChanges = m.subtreeChanges = 0;
    m.ownChange.listen(() => ++m.ownChanges);
    m.subtreeChange.listen(() => ++m.subtreeChanges);
  }

  function _assertMessage(expectedFields, expectedEvents) {
    chai.assert.deepEqual(_toObj(m), expectedFields);

    const actual = {};
    m.forEachField((fieldDescriptor, value) => {
      actual[fieldDescriptor.nameJson] =
        !fieldDescriptor.isReference ? _toObj(value) : value;
    });
    chai.assert.deepEqual(actual, expectedFields);

    if ('i' in expectedFields) {
      chai.assert.isTrue(m.has('i'));
      chai.assert.equal(m.i, expectedFields['i']);
    } else {
      chai.assert.isFalse(m.has('i'));
      chai.assert.isUndefined(m.i);
    }
    if ('m' in expectedFields) {
      chai.assert.isTrue(m.has('m'));
    } else {
      chai.assert.isFalse(m.has('m'));
      chai.assert.isUndefined(m.m);
    }
    if ('li' in expectedFields) {
      chai.assert.deepEqual(m.li, expectedFields['li']);
    } else {
      chai.assert.isEmpty(m.li);
    }
    if (!('mi' in expectedFields)) {
      chai.assert.equal(m.mi.size, 0);
    }
    if (!('lm' in expectedFields)) {
      chai.assert.isEmpty(m.lm);
    }
    if (!('mm' in expectedFields)) {
      chai.assert.equal(m.mm.size, 0);
    }

    expectedEvents = expectedEvents || {};
    chai.assert.equal(m.ownChanges, expectedEvents.ownChanges || 0);
    chai.assert.equal(m.subtreeChanges, expectedEvents.subtreeChanges || 0);
  }

  function _toObj(x) {
    if (x instanceof protoExt.test.Message) {
      const json = {};
      if (x.has('i')) {
        json['i'] = x.i;
      }
      if (x.li.length) {
        json['li'] = x.li;
      }
      if (x.mi.size) {
        json['mi'] = Maps.toObject(x.mi);
      }
      if (x.has('m')) {
        json['m'] = _toObj(x.m);
      }
      if (x.lm.length) {
        json['lm'] = x.lm.map(_toObj);
      }
      if (x.mm.size) {
        json['mm'] = Maps.toObject(x.mm, {valueMapper: _toObj});
      }
      if (x.has('rm')) {
        json['rm'] = x.rm;
      }
      return json;
    } else if (x instanceof Array) {
      return x.map(_toObj);
    } else if (x instanceof Map) {
      return Maps.toObject(x, {valueMapper: _toObj});
    } else {
      return x;
    }
  }
});
