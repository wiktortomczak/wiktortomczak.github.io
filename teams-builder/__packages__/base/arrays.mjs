
import assert from 'base/assert.mjs';
import Types from 'base/types.mjs';


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

  static copy(arr) {
    return Array.from(arr);
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
  static bisectRight(arr, elem, compareFunc=_defaultCompare) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      // TODO: 1-argument compare? (elem is implied / superfluous)
      const compareResult = compareFunc(elem, arr[mid]);
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

  static bisectRightByKey(arr, elem, keyFunc) {
    const compareFunc = _createCompareFuncFromKeyFunc(keyFunc);
    return this.bisectRight(arr, elem, compareFunc);
  }

  static binarySearch(arr, elem, compareFunc=_defaultCompare) {
    const [i, found] = this.bisectRight(arr, elem, compareFunc);
    return found ? i : null;
  }

  static binarySearchByKey(arr, elem, keyFunc) {
    const compareFunc = _createCompareFuncFromKeyFunc(keyFunc);
    return this.binarySearch(arr, elem, compareFunc);
  }

  static enumerate(arr) {
    const result = Array(arr.length);
    for (let i = 0; i < arr.length; ++i) {
      result[i] = [i, arr[i]];
    }
    return result;
  }

  static findUnique(arr, predicate) {
    let found;
    let element;
    for (const e of arr) {
      if (predicate(e)) {
        if (!found) {
          element = e;
          found = true;
        } else {
          throw Error(arr);
        }
      }
    }
    if (found) {
      return element;
    } else {
      throw Error(arr);
    }
  }

  static insertAt(arr, i, elem) {
    arr.splice(i, 0, elem);
  }

  static insertSorted(arr, e, compareFunc=_defaultCompare) {
    const i = this.bisectRight(arr, e, compareFunc)[0];
    this.insertAt(arr, i, e);
  }

  static insertSortedByKey(arr, e, keyFunc) {
    const compareFunc = _createCompareFuncFromKeyFunc(keyFunc);
    return this.insertSorted(arr, e, compareFunc);
  }

  static last(arr) {
    return arr[arr.length - 1];
  }

  static min(arr) {
    assert(arr.length);
    let min = arr[0];
    for (let i = 1; i < arr.length; ++i) {
      const e = arr[i];
      if (e < min) {
        min = e;
      }
    }
    return min;
  }

  static minKey(arr, keyFunc) {
    assert(arr.length);
    let min = arr[0];
    let keyMin = keyFunc(arr[0]);
    for (let i = 1; i < arr.length; ++i) {
      const e = arr[i];
      const key = keyFunc(e);
      if (key < keyMin) {
        min = e;
        keyMin = key;
      }
    }
    return min;
  }

  static max(arr) {
    assert(arr.length);
    let max = arr[0];
    for (let i = 1; i < arr.length; ++i) {
      const e = arr[i];
      if (e > max) {
        max = e;
      }
    }
    return max;
  }

  static maxKey(arr, keyFunc) {
    return this.minKey(arr, e => -keyFunc(e));
  }

  static minmax(arr) {
    return [this.min(arr), this.max(arr)];  // TODO
  }

  static pop(arr, i) {
    const element = arr[i];
    arr.splice(i, 1);
    return element;
  }

  static  range(start, stop) {
    const arr = new Array(stop - start);
    for (let i = start; i < stop; ++i) {
      arr[i] = i;
    }
    return arr;
  }
  
  static remove(arr, element) {
    const i = arr.indexOf(element);
    assert(i != -1);
    arr.splice(i, 1);
  }

  static removeAt(arr, i) {
    arr.splice(i, 1);
  }

  static repeat(elementOrFunc, count) {
    const arr = Array(count);
    if (!Types.isFunction(elementOrFunc)) {
      for (let i = count; --i >= 0; ) {
        arr[i] = elementOrFunc;
      }
    } else {
      for (let i = count; --i >= 0; ) {
        arr[i] = elementOrFunc(i);
      }
    }
    return arr;
  }

  static set(arr, elements) {
    // stackoverflow.com/a/41004427/2131969
    arr.length = 0;
    arr.push(...elements);
  }

  static setSlice(arr, start, stop, elements) {
    arr.splice(start, stop - start, ...elements);
  }

  static sortByKey(arr, keyFunc, order='ascending') {
    const compareFunc = _createCompareFuncFromKeyFunc(keyFunc, order);
    arr.sort(compareFunc);
  }

  static sort(arr, compareFunc=_defaultCompare) {
    arr.sort(compareFunc);
  }

  static mapFiltered(arr, mapFunc, filterFunc) {
    return arr.filter(filterFunc).map(mapFunc);
  }
}


function _defaultCompare(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
}


export function compareSecond(a, b, compareFunc=_defaultCompare) {
  return compareFunc(a[1], b[1]);
}


function _createCompareFuncFromKeyFunc(keyFunc, order='ascending') {
  if (order == 'ascending') {
    return function compare(a, b) {
      const aKey = keyFunc(a);
      const bKey = keyFunc(b);
      return aKey > bKey ? 1 : aKey < bKey ? -1 : 0;
    };
  } else if (order == 'descending') {
    return function compare(a, b) {
      const aKey = keyFunc(a);
      const bKey = keyFunc(b);
      return aKey > bKey ? -1 : aKey < bKey ? 1 : 0;
    };
  } else {
    throw Error(order);
  }
}
