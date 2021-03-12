
import assert from '/zuzia/v0.2/__packages__/base/assert.mjs';


export default class Arrays {

  static create(length, createElemFunc) {
    const arr = new Array(length);
    for (let i = 0; i < length; ++i) {
      arr[i] = createElemFunc ? createElemFunc(i) : undefined;
    }
    return arr;
  }

  static concat(arrays) {
    return Array.prototype.concat(...arrays);
  }

  static chunks(arr, chunkSize) {
    const chunks = [];
    for (let offset = 0; offset < arr.length; offset += chunkSize) {
      chunks.push(arr.slice(offset, offset + chunkSize));
    }
    return chunks;
  }

  static *chunkIter(arr, chunkSize) {
    for (let offset = 0; offset < arr.length; offset += chunkSize) {
      yield arr.slice(offset, offset + chunkSize);
    }
  }

  // TODO: Remove. Replace with Array.find().
  static findByPredicate(arr, predicate) {
    for (const elem of arr) {
      if (predicate(elem)) {
        return elem;
      }
    }
    return null;
  }

  static has(arr, elem) {
    return arr.indexOf(elem) != -1;
  }

  // Adapted from
  // https://github.com/d3/d3-array/blob/v2.8.0/src/bisector.js.
  // closure-library/closure/goog/array/array.js.  // TODO: version.
  static bisectRight(arr, elem, compareOrKey) {
    let {compare, key} = compareOrKey || {};
    assert(!compare || !key);
    if (key) {
      compare = _createCompareByKey(key);
    } else if (!compare) {
      compare = _defaultCompare;
    }

    let lo = 0, hi = arr.length, compareResult;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      // TODO: 1-argument compare? (elem is implied / superfluous)
      compareResult = compare(elem, arr[mid]);
      if (compareResult > 0) {
        lo = mid + 1;
      } else if (compareResult < 0) {
        hi = mid;
      } else {
        return [mid, true];
      }
    }
    return [lo, false];
  }

  static binarySearch(arr, elem, compareOrKey) {
    const [i, found] = this.bisectRight(arr, elem, compareOrKey);
    return found ? i : null;
  }

  static insertAt(arr, elem, i) {
    arr.splice(i, 0, elem);
  }

  static last(arr) {
    return arr[arr.length - 1];
  }
  
  static remove(arr, element) {
    const index = arr.indexOf(element);
    assert(index != -1);
    arr.splice(index, 1);
  }

  static removeAt(arr, index) {
    arr.splice(index, 1);
  }

  static mean(arr) {
    let sum = 0;
    for (const e of arr) {
      sum += e;
    }
    return sum / arr.length;
  }

  static mapFiltered(arr, mapFunc, filterFunc) {
    return arr.filter(filterFunc).map(mapFunc);
  }
}


function _defaultCompare(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
}


function _createCompareByKey(key) {
  return function compare(a, b) {
    const aKey = key(a);
    const bKey = key(b);
    return aKey > bKey ? 1 : aKey < bKey ? -1 : 0;
  };
}
