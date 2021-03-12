
import assert from '/zuzia/v0.1/__packages__/base/assert.mjs';
import Objects from '/zuzia/v0.1/__packages__/base/objects.mjs';
import Types from '/zuzia/v0.1/__packages__/base/types.mjs';


export default class JSONDecoder {

  static parse(u8arr) {
    return (new this(u8arr)).parse();
  }

  constructor(u8arr) {
    this._u8arr = u8arr;
    this._i = 0;
  }

  parse() {
    const json = this._consume();
    this._consumeWhitespace();
    assert(this._i == this._u8arr.length);
    return json;
  }

  _consume() {
    this._consumeWhitespace();
    const json =
      this._peek('{') ? this._consumeObject() :
      this._peek('[') ? this._consumeArray() :
      this._tryConsumeScalar();
    assert(Types.isDefined(json));
    return json;
  }

  _consumeObject() {
    const obj = {};
    ++this._i;  // this._consume('{')
    while (!this._tryConsumeChar('}')) {
      if (!Objects.isEmpty(obj)) {
        this._consumeChar(',');
        this._consumeWhitespace();
      }
      const key = this._consumeString();
      this._consumeChar(':');
      const value = this._consume();
      obj[key] = value;
    }
    return obj;
  }

  _consumeArray() {
    const arr = [];
    ++this._i;  // this._consume('[');
    while (!this._tryConsumeChar(']')) {
      if (arr.length) {
        this._consumeChar(',');
      }
      arr.push(this._consume());
    }
    return arr;
  }

  _tryConsumeScalar() {
    return (
      (this._u8arr[this._i+3] == 0) ? this._consumeBinary() :
      (this._u8arr[this._i] == _DOUBLE_QUOTES) ? this._consumeString() :
      this._tryConsumeNumberBooleanNull());
  }

  _consumeString() {
    const u8arr = this._u8arr;
    let i = this._i;
    assert(u8arr[i++] == _DOUBLE_QUOTES);

    const parts = [];
    let begin = i;
    while (true) {
      const ch = u8arr[i++];
      assert(Types.isDefined(ch));
      if (ch == _BACKSLASH) {
        parts.push(this._str(begin, i-1));
        begin = i++;
      } else if (ch == _DOUBLE_QUOTES) {
        parts.push(this._str(begin, i-1));
        break;
      }
    }
    this._i = i;
    return parts.join('');
  }

  _tryConsumeNumberBooleanNull() {
    const str = this._str(this._i);
    const scalarEnd = str.search(this.constructor._numberBooleanNullBoundary);
    const scalarStr = (scalarEnd != -1) ? str.slice(0, scalarEnd) : str;
    const scalar = 
      (scalarStr == 'true') ? true :
      (scalarStr == 'false') ? false :
      (scalarStr == 'null') ? null :
      this._tryParseNumber(scalarStr);
    if (Types.isDefined(scalar)) {
      this._i = (scalarEnd != -1) ? this._i + scalarEnd : this._u8arr.length;
      return scalar;
    }
  }

  _tryParseNumber(str) {
    const number = Number(str);
    if (!isNaN(number)) {
      return number;
    }
  }

  _consumeBinary() {
    const u8arr = this._u8arr;
    let i = this._i;
    const len = u8arr[i] | (u8arr[i+1] << 8) | (u8arr[i+2] << 16) | (u8arr[i+3] << 24);
    i += 4;
    this._i = i + len;
    return u8arr.slice(i, this._i);
  }

  _consumeChar(ch) {
    assert(this._tryConsumeChar(ch));
  }

  _tryConsumeChar(ch) {
    this._consumeWhitespace();
    if (this._peek(ch)) {
      ++this._i;
      return true;
    }
  }

  _consumeWhitespace() {
    while (this._peek(' ')) {
      ++this._i;
    }
  }

  _peek(ch) { return this._u8arr[this._i] == ch.charCodeAt(0); }

  _str(begin, end) {
    return String.fromCharCode.apply(null, this._u8arr.slice(begin, end));
  }
}

// int: digits, +-
// float: digits, letters, +-.
// bool, null: letters
JSONDecoder._numberBooleanNullBoundary = /[^a-z0-9.+-]/;


const _DOUBLE_QUOTES = '"'.charCodeAt(0);
const _BACKSLASH = '\\'.charCodeAt(0);
