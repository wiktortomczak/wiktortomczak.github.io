
import ObjectClient, {RemoteObject, createRemoteMessageClassesFromFileDescriptorSetJson} from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/object/client.mjs';

import Arrays from 'https://wiktortomczak.github.io/vb/__packages__/base/arrays.mjs';
import assert from 'https://wiktortomczak.github.io/vb/__packages__/base/assert.mjs';
import Objects from 'https://wiktortomczak.github.io/vb/__packages__/base/objects.mjs';
import Types from 'https://wiktortomczak.github.io/vb/__packages__/base/types.mjs';

import {PromiseExt} from 'https://wiktortomczak.github.io/vb/__packages__/base/promises.mjs';

import MessageDescriptor from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/ext/descriptor.mjs';
import {BoundaryMessage, BoundaryContainer, CompositeFieldView, ContainerField, Message, Path, createMessageClassesFromFileDescriptorSetJson} from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/ext/message2.mjs';
import {messageFileDescriptorSetJson} from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/ext/testing/message.pbext.mjs';

MessageDescriptor._registry = {};
const remoteObjectClasses =
  createRemoteMessageClassesFromFileDescriptorSetJson(messageFileDescriptorSetJson);
// TODO: Compute automatically.
remoteObjectClasses['.test.Message']._remoteObjectClass.partitionBoundary = {
  m: BoundaryMessage, lm: BoundaryContainer, mm: BoundaryContainer
};

const {beforeEach, describe, it} = window.Mocha;
const chai = window.chai;


describe('ObjectClient', function () {

  let messageClient;
  let client;
  let m, message;
  let postUpdates;

  beforeEach(function() {
    messageClient = new FakeMessageClient();
    client = ObjectClient.create(messageClient, remoteObjectClasses['.test.Message']);
    client._serializer = {serializeMessage(x) {return x;}};
    client._deserializer = {deserializeMessage(x) {return x;}};
    postUpdates = new Map();
  });

  it('i', async function () {
    m = message = await _updatePartitionAwaitRoot([], [], {i: 1});
    _assertMessageAndPartition({i: 1});
    _listen(m);
    await _updatePartitionAwait([], ['i'], 2);
    _assertMessageAndPartition({i: 2});
    await _updatePartitionAwait([], ['i'], 'delete');
    _assertMessageAndPartition({});
  });

  it('li', async function () {
    m = message = await _updatePartitionAwaitRoot([], [], {li: [1, 2]});
    _assertMessageAndPartition({li: [1, 2]});
    _listen(m);
    await _updatePartitionAwait([], ['li', 1], 3);
    _assertMessageAndPartition({li: [1, 3]});
    await _updatePartitionAwait([], ['li', 2], 4);
    _assertMessageAndPartition({li: [1, 3, 4]});
    await _updatePartitionAwait([], ['li', 2], 'delete');
    _assertMessageAndPartition({li: [1, 3]});
    await _updatePartitionAwait([], ['li', 0], 'delete');
    _assertMessageAndPartition({li: [3]});
    await _updatePartitionAwait([], ['li', 0], 'insert', 5);
    _assertMessageAndPartition({li: [5, 3]});
    await _updatePartitionAwait([], ['li'], []);
    _assertMessageAndPartition({});
    _assertMessage({});
  });

  it('mi', async function () {
    m = message = await _updatePartitionAwaitRoot([], [], {mi: {a: 1, b: 2}});
    _assertMessageAndPartition({mi: {a: 1, b: 2}});
    _listen(m);
    await _updatePartitionAwait([], ['mi', 'a'], 3);
    _assertMessageAndPartition({mi: {a: 3, b: 2}});
    await _updatePartitionAwait([], ['mi', 'c'], 4);
    _assertMessageAndPartition({mi: {a: 3, b: 2, c: 4}});
    await _updatePartitionAwait([], ['mi', 'c'], 'delete');
    _assertMessageAndPartition({mi: {a: 3, b: 2}});
    await _updatePartitionAwait([], ['mi', 'a'], 'delete');
    _assertMessageAndPartition({mi: {b: 2}});
    await _updatePartitionAwait([], ['mi'], {});
    _assertMessageAndPartition({});
  });

  it('m', async function () {
    m = message = await _updatePartitionAwaitRoot([], [], {m: 1});
    _assertMessage({m: 1});
    _assertPartition(m.partition.includeBoundary(), {m: 1});

    let m_m;
    (async () => m_m = await m.m)();
    chai.assert.deepEqual(
      await messageClient.clientMessage(),
      new ObjectClient.messages.ListenObject(_pathFromKeys(['m'])));
    chai.assert.isUndefined(m_m);
    _updatePartition(['m'], [], {i: 1});
    chai.assert.isTrue(Object.is(await m.m, m.m));
    chai.assert.isTrue(Object.is(m_m, m.m));   
    _assertMessage({m: {i: 1}});
    _assertPartition(m.m, {i: 1});
    _assertPartition({});

    _listen(m);
    _listen(m.m);
    await _updatePartitionAwait(['m'], [], {li: [2, 3]}, m.m);
    _assertMessage({m: {li: [2, 3]}});
    _assertPartition(m.m, {li: [2, 3]});
    await _updatePartitionAwait(['m'], ['li', 0], 4, m.m);
    _assertMessage({m: {li: [4, 3]}});
    _assertPartition(m.m, {li: [4, 3]});
    await _updatePartitionAwait(['m'], ['m'], 1, m.m);
    _updatePartition(['m', 'm'], [], {});
    chai.assert.isTrue(Object.is(await m.m.m, m.m.m));
    _assertMessage({m: {li: [4, 3], m: {}}});
    _assertPartition(m.m.m, {});
    _assertPartition(m.m, {li: [4, 3]});
    _assertPartition({});
    await _updatePartitionAwait(['m'], [], {}, m.m);  // .m.clear().
    _assertMessage({m: {}});
    _assertPartition(m.m, {});
    _assertPartition({});
    await _updatePartitionAwait([], ['m'], 'delete');
    _assertMessage({});
    _assertPartition({});
  });

  it('lm', async function () {
    m = message = await _updatePartitionAwaitRoot([], [], {lm: 1});
    _assertMessage({lm: 1});
    _assertPartition(m.partition.includeBoundary(), {lm: 1});

    _updatePartition(['lm', 0], [], {i: 1});
    chai.assert.isTrue(Object.is(await m.lm.array[0], m.lm.array[0]));   
    // _assertMessage({lm: [{i: 1}]});
    _assertPartition(m.lm.array[0], {i: 1});
    _assertPartition({});

    _listen(m);
    _listen(m.lm.array[0]);
    await _updatePartitionAwait(['lm', 0], ['lm'], 2, m.lm.array[0]);
    _updatePartition(['lm', 0, 'lm', 0], [], {i: 2});
    chai.assert.isTrue(Object.is(await m.lm.array[0].lm.array[0], m.lm.array[0].lm.array[0]));
    // _assertMessage({lm: [{i: 1, lm: [{i: 2}]}]});
    _assertPartition(m.lm.array[0].lm.array[0], {i: 2});
    _assertPartition(m.lm.array[0], {i: 1});
    _assertPartition({});
    await _updatePartitionAwait([], ['lm', 0], 'delete');
    // _assertMessage({});
    _assertPartition({});
  });

  it('mm', async function () {
    m = message = await _updatePartitionAwaitRoot([], [], {mm: 1});
    _assertMessage({mm: 1});
    _assertPartition(m.partition.includeBoundary(), {mm: 1});

    _updatePartition(['mm', 'a'], [], {i: 1});
    chai.assert.isTrue(Object.is(await m.mm.map.get('a'), m.mm.map.get('a')));   
    // _assertMessage({mm: {a: {i: 1}}});
    _assertPartition(m.mm.map.get('a'), {i: 1});
    _assertPartition({});

    _listen(m);
    _listen(m.mm.map.get('a'));
    await _updatePartitionAwait(['mm', 'a'], ['mm'], 2, m.mm.map.get('a'));
    _updatePartition(['mm', 'a', 'mm', 'b'], [], {i: 2});
    chai.assert.isTrue(Object.is(
      await m.mm.map.get('a').mm.map.get('b'),
      m.mm.map.get('a').mm.map.get('b')));
    // _assertMessage({mm: {a: {i: 1, mm: {b: {i: 2}}}}});
    _assertPartition(m.mm.map.get('a').mm.map.get('b'), {i: 2});
    _assertPartition(m.mm.map.get('a'), {i: 1});
    _assertPartition({});
    await _updatePartitionAwait([], ['mm', 'a'], 'delete');
    // _assertMessage({});
    _assertPartition({});
  });

  // it('mm', function () {
  //   _updatePartition([], ['mm', 'a'], {i: 1});
  //   _assertMessage({mm: {a: {i: 1}}});
  //   _assertPartition(m.mm.map.get('a'), {i: 1});
  //   _assertPartition({});
  //   _listen(m.mm.map.get('a'));
  //   _updatePartition(['mm', 'a'], ['mm', 'b'], {i: 2});
  //   _assertMessage({mm: {a: {i: 1, mm: {b: {i: 2}}}}});
  //   _assertPartition(m.mm.map.get('a').mm.map.get('b'), {i: 2});
  //   _assertPartition(m.mm.map.get('a'), {i: 1});
  //   _assertPartition({});
  //   _updatePartition([], ['mm', 'a'], 'delete');
  //   _assertMessage({});
  //   _assertPartition({});
  // });

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
  async function _updatePartitionAwait(...args) {
    const m = Arrays.last(args) instanceof RemoteObject ? args.pop() : message;
    _updatePartition(...args);
    await _updated(m);
  }

  async function _updatePartitionAwaitRoot(...args) {
    _updatePartition(...args);
    return await client.rootPartition;
  }

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

    messageClient.serverSendMessage(
      new ObjectClient.messages.PartitionUpdate(
        _pathFromKeys(partitionPath), _pathFromKeys(targetPath), op));
  }

  function _listen(partitionRoot) {
    assert(!postUpdates.has(partitionRoot));
    const updates = [];
    postUpdates.set(partitionRoot, updates);
    partitionRoot.postUpdates.listen(() => {
      assert(updates.length == 1);
      updates.pop().resolve();
    });
  }

  function _updated(partitionRoot) {
    const updates = postUpdates.get(partitionRoot);
    assert(updates.length == 0);
    const update = new PromiseExt();
    updates.push(update);
    return update;
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
      if (jsoExpected['m'] != 1) {
        _assertMessage(m.m, jsoExpected['m']);
      }
    } else {
      chai.assert.isFalse(m.has('m'));
      chai.assert.throws(() => m.m);
    }

    if ('lm' in jsoExpected) {
      if (Types.isNumber(jsoExpected['lm'])) {
        chai.assert.equal(m.lm.length, jsoExpected['lm']);
      } else {
        chai.assert.equal(m.lm.length, jsoExpected['lm'].length);
        for (let i = 0; i < m.lm.length; ++i) {
          _assertMessage(m.lm.array[i], jsoExpected['lm'][i]);
        }
      }
    } else {
      chai.assert.equal(m.lm.length, 0);
      chai.assert.equal(m.lm.size, 0);
      chai.assert.isTrue(m.lm.isEmpty);
    }

    if ('mm' in jsoExpected) {
      if (Types.isNumber(jsoExpected['mm'])) {
        chai.assert.equal(m.mm.size, jsoExpected['mm']);
      } else {
        chai.assert.equal(m.mm.size, Objects.size(jsoExpected['mm']));
        for (const key in jsoExpected['mm']) {
          _assertMessage(m.mm.map.get(key), jsoExpected['mm'][key]);
        }
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
    const partition =
      args[0] instanceof Message ? Arrays.pop(args, 0).partition :
      args[0] instanceof CompositeFieldView ? Arrays.pop(args, 0) :
      message.partition;
    const [jsoExpected] = args;

    chai.assert.deepEqual(partition.toJso(), jsoExpected);
  }

  function _pathFromKeys(keys) {
    const path = new Path();
    for (let key of keys) {
      if (Arrays.has(['i', 'li', 'mi', 'm', 'lm', 'mm', 'rm', 'lrm', 'mrm'], key)) {
        key = new Message.Key(key);
      } else {
        key = new ContainerField.Key(key);
      }
      path.push(key);
    }
    return path;
  }
});


class FakeMessageClient {

  onMessage(serverMessageCallback) {
    assert(!this._serverMessageCallback);
    this._serverMessageCallback = serverMessageCallback;
  }

  sendMessage(message) {
    const clientMessage = Objects.pop(this, '_clientMessage', null);
    clientMessage && clientMessage.resolve(message);
  }

  serverSendMessage(message) {
    window.setTimeout(() => this._serverMessageCallback(message));
  }

  async clientMessage() {
    assert(!this._clientMessage);
    this._clientMessage = new PromiseExt();
    return await this._clientMessage;
  }
}


function _mapToObject(m) {
  return Object.fromEntries(m.entries());
}
