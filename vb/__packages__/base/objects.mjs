
import assert from 'https://wiktortomczak.github.io/vb/__packages__/base/assert.mjs';
import Types from 'https://wiktortomczak.github.io/vb/__packages__/base/types.mjs';


export default class Objects {

  static isEmpty(obj) {
    for (const key in obj) {
      return false;
    }
    return true;
  }
  
  static isEmptyOrUndefined(obj) {
    return Types.isUndefined(obj) || this.isEmpty(obj);
  }

  static isDefinedAndNonEmpty(obj) {
    return obj && !this.isEmpty(obj);
  }

  static forEach(obj, func) {
    for (const key in obj) {
      func(obj[key], key);
    }
  }

  static fromKeys(keys, value) {
    const obj = {};
    for (const key of keys) {
      obj[key] = value;
    }
    return obj;
  }

  static fromEntries(entries) {
    const obj = {};
    for (const [key, value] of entries) {
      obj[key] = value;
    }
    return obj;
  }

  static hasOnlyKey(obj, keyExpected) {
    let found = false;
    for (const key in obj) {
      if (key == keyExpected) {
        found = true;
      } else {
        return false;
      }
    }
    return found;
  }

  static *iterValues(obj) {
    for (const key in obj) {
      yield obj[key];
    }
  }

  static mapValues(obj, func) {
    const mapped = {};
    for (const key in obj) {
      mapped[key] = func(obj[key]);
    }    
    return mapped;
  }

  static mergeEnumerableProperties(...objs) {
    const merged = {};
    return Object.assign(merged, ...objs);
  }

  static mergeAllProperties(...objs) {
    const merged = {};
    for (const obj of objs) {
      this.forEach(Object.getOwnPropertyDescriptors(obj), (descriptor, name) => {
        Object.defineProperty(merged, name, descriptor);
      });
    }
    return merged;
  }

  static find(obj, func) {
    for (const key in obj) {
      const value = obj[key];
      if (func(value)) {
        return value;
      }
    }
  }

  static pop(obj, key, defaultValue=undefined) {
    if (key in obj) {
      const value = obj[key];
      delete obj[key];
      return value;
    } else {
      assert(defaultValue !== undefined);
      return defaultValue;
    }
  }

  static setDefault(obj, key, value) {
    if (!(key in obj)) {
      return obj[key] = value;
    } else {
      return obj[key];
    }
  }

  static size(obj) {
    let size = 0;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        ++size;
      }
    }
    return size;
  }

  static without(obj, key) {
    const objWithoutKey = {};
    for (const key_ in obj) {
      if (key_ != key) {
        objWithoutKey[key_] = obj[key_];
      }
    }
    return objWithoutKey;
  }

  static copyOwnProperties(source, target, ...propertiesToExclude) {
    propertiesToExclude = new Set(propertiesToExclude);
    const descriptors = Object.getOwnPropertyDescriptors(source);
    for (const propertyName in descriptors) {
      if (!propertiesToExclude.has(propertyName)) {
        Object.defineProperty(target, propertyName, descriptors[propertyName]);
      }
    }
    return target;
  }
}
