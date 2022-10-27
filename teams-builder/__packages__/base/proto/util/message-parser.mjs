
import Objects from 'base/objects.mjs';


export default class MessageParser {

  constructor(descriptor) {
    this._descriptor = descriptor;
  }

  parseMessage(messageStr) {
    const fieldNameValues = [];
    const tokens = this._tokenize(messageStr);
    while (tokens.length) {
      const fieldNameValue = this._parseFieldNameValue(tokens);
      if (fieldNameValue) {
        fieldNameValues.push(fieldNameValue);
      } else {
        return null;
      }
    }
    const messageObj = fieldNameValues.reduce(
      (obj, fieldName) => ({...obj, ...fieldName}), {});
    return (this._descriptor.messageExtClass  // TODO
            || this._descriptor.messageExtClassReadOnly).fromObject(messageObj);
  }

  _parseFieldNameValue(tokens) {
    const fieldDescriptor = Objects.find(
      this._descriptor.fields, d => d.name == tokens[0]);
    if (fieldDescriptor) {
      tokens.shift();
    } else {
      return null;
    }

    if (tokens[0] == ':' || tokens[0] == '=') {
      tokens.shift();
    } else {
      return null;
    }

    try {
      var value = fieldDescriptor.type.valueFromJsonString(tokens[0]);
    } catch (e) {
      return null;
    }
    tokens.shift();

    return {[fieldDescriptor.nameJson]: value};
  }

  _tokenize(str) {
    const tokens = [];
    for (const token of this._iterTokens(str)) {
      if (token.charAt(0) != ' ') {
        tokens.push(token);
      }
    }
    return tokens;
  }

  *_iterTokens(str) {
    let tokenStart = null;
    let charClass = null;
    let inQuotes = false;
    for (let i = 0; i <= str.length; ++i) {
      const nextCharClass = i < str.length ? _charClass(str.charAt(i)) : null;
      if (nextCharClass != charClass) {
        if (tokenStart !== null) {
          yield str.slice(tokenStart, i);
        }
        tokenStart = i;
      }
      charClass = nextCharClass;
    }

    function _charClass(c) {
      if (((c == ' ') || (c == ',')) && !inQuotes) {
        return ' ';
      } else if (((c == ':') || (c == '=')) && !inQuotes) {
        return ':';
      } else {
        if (c == '"') {
          inQuotes = !inQuotes;
        }
        return 'w';
      }
    }
  }
}
