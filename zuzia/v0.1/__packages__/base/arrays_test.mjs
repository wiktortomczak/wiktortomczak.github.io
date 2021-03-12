
import Arrays from '/zuzia/v0.1/__packages__/base/arrays.mjs';

const {describe, it} = window.Mocha;
const chai = window.chai;


describe('Arrays', function () {

  it('bisectRight default', function () {
    const arr = [1, 3];
    function bisectRight(key) {
      return Arrays.bisectRight(arr, key);
    }
    chai.assert.sameMembers(bisectRight(1), [0, true]);
    chai.assert.sameMembers(bisectRight(3), [1, true]);
    chai.assert.sameMembers(bisectRight(0), [0, false]);
    chai.assert.sameMembers(bisectRight(2), [1, false]);
    chai.assert.sameMembers(bisectRight(4), [2, false]);
  });

  it('bisectRight compare', function () {
    const arr = [{key: 1}, {key: 3}];
    function bisectRight(key) {
      return Arrays.bisectRight(arr, key, {compare: (a, b) => a.key - b.key});
    }
    chai.assert.sameMembers(bisectRight({key: 1}), [0, true]);
    chai.assert.sameMembers(bisectRight({key: 3}), [1, true]);
    chai.assert.sameMembers(bisectRight({key: 0}), [0, false]);
    chai.assert.sameMembers(bisectRight({key: 2}), [1, false]);
    chai.assert.sameMembers(bisectRight({key: 4}), [2, false]);
  });

  it('bisectRight key', function () {
    const arr = [{key: 1}, {key: 3}];
    function bisectRight(key) {
      return Arrays.bisectRight(arr, key, {key: elem => elem.key});
    }
    chai.assert.sameMembers(bisectRight({key: 1}), [0, true]);
    chai.assert.sameMembers(bisectRight({key: 3}), [1, true]);
    chai.assert.sameMembers(bisectRight({key: 0}), [0, false]);
    chai.assert.sameMembers(bisectRight({key: 2}), [1, false]);
    chai.assert.sameMembers(bisectRight({key: 4}), [2, false]);
  });

  it('insertAt', function () {
    const arr = [];

    Arrays.insertAt(arr, 'a', 0);
    chai.assert.sameMembers(arr, ['a']);

    Arrays.insertAt(arr, 'b', 0);
    chai.assert.sameMembers(arr, ['b', 'a']);

    Arrays.insertAt(arr, 'c', 2);
    chai.assert.sameMembers(arr, ['b', 'a', 'c']);

    Arrays.insertAt(arr, 'd', 1);
    chai.assert.sameMembers(arr, ['b', 'd', 'a', 'c']);
  });
});
