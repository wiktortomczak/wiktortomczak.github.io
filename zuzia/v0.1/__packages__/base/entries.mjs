
import Arrays from '/zuzia/v0.1/__packages__/base/arrays.mjs';
import assert from '/zuzia/v0.1/__packages__/base/assert.mjs';


export default class Entries {

  static get(entries, key_) {
    return entries.find(([key, value]) => key == key_);
  }

  static getValue(entries, key_) {
    const entry = entries.find(([key, value]) => key == key_);
    return entry ? entry[1] : undefined;
  }

  static keys(entries) {
    const keys = [];
    for (const [key] of entries) {
      keys.push(key);
    }
    return keys;
  }

  static remove(entries, key_) {
    const id = entries.findIndex(([key, value]) => key == key_);
    assert(id != -1);
    entries.splice(id, 1);
  }

  static bisectRight(entries, key) {
    return Arrays.bisectRight(entries, key, {compare: (a, b) => a - b[0]});
  }
}
