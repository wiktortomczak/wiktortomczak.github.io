
import Stream from '/zuzia/__packages__/base/stream.mjs';

const {beforeEach, describe, it} = window.Mocha;
const chai = window.chai;


describe('Stream', function () {
  let stream, writer, streamOut = [];
  
  beforeEach(function() {
    writer = {};
    stream = new Stream((put, end, throw_) => {
      writer.put = put;
      writer.end = end;
      writer.throw_ = throw_;
    });
    stream.onData(data => streamOut.push({data}));
    stream.onEnd(() => streamOut.push({end: true}));
    stream.onError(error => streamOut.push({error}));
  });

  it('empty', async function () {
    await _assertStreamOut();

    writer.end();
    await _assertStreamOut({end: true});

    chai.assert.throws(() => writer.put(1), 'already ended');
    chai.assert.throws(() => writer.throw_(Error()), 'already ended');
  });

  function _assertStreamOut(expected) {
    expected = expected || {};
    const expectedOut = [];
    (expected.data || []).forEach(data => expectedOut.push({data}));
    if (expected.error)
      expectedOut.push({error: expected.error});
    if (expected.end)
      expectedOut.push({end: true});
    chai.assert.deepEqual(expectedOut, streamOut);
  }
});


