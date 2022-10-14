
import Arrays from 'https://wiktortomczak.github.io/vb/__packages__/base/arrays.mjs';
import assert from 'https://wiktortomczak.github.io/vb/__packages__/base/assert.mjs';
import Objects from 'https://wiktortomczak.github.io/vb/__packages__/base/objects.mjs';

import 'https://wiktortomczak.github.io/vb/__packages__/base/proto/ext/testing/message.pbext.mjs';
import {ContainerField, Message, Path} from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/ext/message2.mjs';
const proto = window.proto;

const {beforeEach, describe, it} = window.Mocha;
const chai = window.chai;


describe('Message', function () {

  let m, message;

  beforeEach(function() {
    m = message = new proto.test.Message;
  });

  it('i', function () {
    m._set({i: 1});
    _assertMessageAndPartition({i: 1});
    _getFieldByPath(['i'])._set(2);
    _assertMessageAndPartition({i: 2});
    m._deleteField('i');
    _assertMessageAndPartition({});
  });

  it('li', function () {
    m._set({li: [1, 2]});
    _assertMessageAndPartition({li: [1, 2]});
    _getFieldByPath(['li'])._setValue(1, 3);
    _assertMessageAndPartition({li: [1, 3]});
    _getFieldByPath(['li'])._setValue(2, 4);
    _assertMessageAndPartition({li: [1, 3, 4]});
    _getFieldByPath(['li'])._pop(2);
    _assertMessageAndPartition({li: [1, 3]});
    _getFieldByPath(['li'])._pop(0);
    _assertMessageAndPartition({li: [3]});
    _getFieldByPath(['li'])._insert(0, 5);
    _assertMessageAndPartition({li: [5, 3]});
    _getFieldByPath(['li'])._set([]);
    _assertMessageAndPartition({});
  });

  it('mi', function () {
    m._set({mi: {a: 1, b: 2}});
    _assertMessageAndPartition({mi: {a: 1, b: 2}});
    _getFieldByPath(['mi'])._setValue('a', 3);
    _assertMessageAndPartition({mi: {a: 3, b: 2}});
    _getFieldByPath(['mi'])._setValue('c', 4);
    _assertMessageAndPartition({mi: {a: 3, b: 2, c: 4}});
    _getFieldByPath(['mi'])._deleteField('c');
    _assertMessageAndPartition({mi: {a: 3, b: 2}});
    _getFieldByPath(['mi'])._deleteField('a');
    _assertMessageAndPartition({mi: {b: 2}});
    _getFieldByPath(['mi'])._set({});
    _assertMessageAndPartition({});
  });

  it('m', function () {
    m._getOrCreateSetField('m', {i: 1});
    _assertMessage({m: {i: 1}});
    _assertPartition(m.m, {i: 1});
    _assertPartition({});
    _getFieldByPath(['m'])._set({li: [2, 3]});
    _assertMessage({m: {li: [2, 3]}});
    _assertPartition(m.m, {li: [2, 3]});
    _getFieldByPath(['m', 'li'])._setValue(0, 4);
    _assertMessage({m: {li: [4, 3]}});
    _assertPartition(m.m, {li: [4, 3]});
    _getFieldByPath(['m'])._getOrCreateSetField('m', {});
    _assertMessage({m: {li: [4, 3], m: {}}});
    _assertPartition(m.m.m, {});
    _assertPartition(m.m, {li: [4, 3]});
    _assertPartition({});
    _getFieldByPath(['m'])._set({});
    _assertMessage({m: {}});
    _assertPartition(m.m, {});
    _assertPartition({});
    m._deleteField('m');
    _assertMessage({});
    _assertPartition({});
  });

  it('lm', function () {
    _getFieldByPath(['lm'])._getOrCreateSetField(0, {i: 1});
    _assertMessage({lm: [{i: 1}]});
    _assertPartition(m.lm.array[0], {i: 1});
    _assertPartition({});
    _getFieldByPath(['lm', 0, 'lm'])._getOrCreateSetField(0, {i: 2});
    _assertMessage({lm: [{i: 1, lm: [{i: 2}]}]});
    _assertPartition(m.lm.array[0].lm.array[0], {i: 2});
    _assertPartition(m.lm.array[0], {i: 1});
    _assertPartition({});
    _getFieldByPath(['lm'])._pop(0);
    _assertMessage({});
    _assertPartition({});
  });

  it('mm', function () {
    _getFieldByPath(['mm'])._getOrCreateSetField('a', {i: 1});
    _assertMessage({mm: {a: {i: 1}}});
    _assertPartition(m.mm.map.get('a'), {i: 1});
    _assertPartition({});
    _getFieldByPath(['mm', 'a', 'mm'])._getOrCreateSetField('b', {i: 2});
    _assertMessage({mm: {a: {i: 1, mm: {b: {i: 2}}}}});
    _assertPartition(m.mm.map.get('a').mm.map.get('b'), {i: 2});
    _assertPartition(m.mm.map.get('a'), {i: 1});
    _assertPartition({});
    _getFieldByPath(['mm'])._deleteField('a');
    _assertMessage({});
    _assertPartition({});
  });

  // it('rm', function () {
  //   _updatePartition([], ['m'], {i: 1});
  //   _assertPartition({});
  //   _updatePartition([], ['rm'], _pathFromKeys(['m']));
  //   _assertPartition({rm: '.m'});
  //   chai.assert.isTrue(Object.is(m.rm, m.m));
  //   _updatePartition([], [], {rm: []});
  //   _assertPartition({rm: ''});
  //   chai.assert.isTrue(Object.is(m.rm, m));
  //   _updatePartition([], ['rm'], 'delete');
  //   _assertPartition({});
  //   _updatePartition([], ['rm'], _pathFromKeys(['lm', 0]));
  //   chai.assert.isTrue(m.rm instanceof UnresolvedReference);
  //   _assertPartition({rm: '.lm[0]'});
  //   _updatePartition([], ['lm', 0], {i: 2});
  //   _assertPartition({rm: '.lm[0]'});
  //   chai.assert.isTrue(Object.is(m.rm, m.lm.array[0]));
  // });

  function _updatePartition(partitionPath, targetPath, ...op) {
    if (op.length == 1) {
      if (typeof op[0] == 'string') {
        op = {method: op[0]};
      } else {
        op = {method: 'set', data: op[0]};
      }
    } else {
      op = {method: op[0], data: op[1]};
    }

    m._updatePartition(_pathFromKeys(partitionPath), _pathFromKeys(targetPath), op);
  }
  
  function _assertMessageAndPartition(...args) {
    _assertMessage(...args);
    _assertPartition(...args);
  }

  function _assertMessage(...args) {
    const m = args[0] instanceof Message ? Arrays.pop(args, 0) : message;
    const [jsoExpected] = args;

    chai.assert.deepEqual(m.toJso(), jsoExpected);

    if (Objects.isEmpty(jsoExpected)) {
      chai.assert.isTrue(m.isEmpty);
    }

    if ('i' in jsoExpected) {
      chai.assert.isTrue(m.has('i'));
      chai.assert.equal(m.i, jsoExpected['i']);
    } else {
      chai.assert.isFalse(m.has('i'));
      chai.assert.throws(() => m.i);
    }

    if ('li' in jsoExpected) {
      chai.assert.deepEqual(m.li.array, jsoExpected['li']);
    } else {
      chai.assert.equal(m.li.length, 0);
      chai.assert.equal(m.li.size, 0);
      chai.assert.isTrue(m.li.isEmpty);
    }

    if ('mi' in jsoExpected) {
      chai.assert.deepEqual(_mapToObject(m.mi.map), jsoExpected['mi']);
    } else {
      chai.assert.equal(m.mi.size, 0);
      chai.assert.isTrue(m.mi.isEmpty);
    }

    if ('m' in jsoExpected) {
      chai.assert.isTrue(m.has('m'));
      _assertMessage(m.m, jsoExpected['m']);
    } else {
      chai.assert.isFalse(m.has('m'));
      chai.assert.throws(() => m.m);
    }

    if ('lm' in jsoExpected) {
      chai.assert.equal(m.lm.length, jsoExpected['lm'].length);
      for (let i = 0; i < m.lm.length; ++i) {
        _assertMessage(m.lm.array[i], jsoExpected['lm'][i]);
      }
    } else {
      chai.assert.equal(m.lm.length, 0);
      chai.assert.equal(m.lm.size, 0);
      chai.assert.isTrue(m.lm.isEmpty);
    }

    if ('mm' in jsoExpected) {
      chai.assert.equal(m.mm.size, Objects.size(jsoExpected['mm']));
      for (const key in jsoExpected['mm']) {
        _assertMessage(m.mm.map.get(key), jsoExpected['mm'][key]);
      }
    } else {
      chai.assert.equal(m.mm.size, 0);
      chai.assert.isTrue(m.mm.isEmpty);
    }

    if ('rm' in jsoExpected) {
      chai.assert.isTrue(m.has('rm'));
      // chai.assert.isTrue(Object.is(m.rm, m._getFieldByPath(m.toJso()['rm'])));
    } else {
      chai.assert.isFalse(m.has('rm'));
      chai.assert.throws(() => m.rm);
    }
  }

  function _assertPartition(...args) {
    const m = args[0] instanceof Message ? Arrays.pop(args, 0) : message;
    const [jsoExpected, numUpdatesExpected] = args;

    chai.assert.deepEqual(m.partition.toJso(), jsoExpected);
  }

  function _getFieldByPath(keys) {
    return m._getFieldByPath(_pathFromKeys(keys));
  }

  function _pathFromKeys(keys) {
    const path = new Path();
    for (let key of keys) {
      if (key in proto.test.Message._unaryFieldClasses ||
          key in proto.test.Message._containerFieldClasses) {
        key = new Message.Key(key);
      } else {
        key = new ContainerField.Key(key);
      }
      path.push(key);
    }
    return path;
  }
});


function _mapToObject(m) {
  return Object.fromEntries(m.entries());
}
