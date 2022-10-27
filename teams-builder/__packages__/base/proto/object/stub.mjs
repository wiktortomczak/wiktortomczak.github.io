
import assert from 'base/assert.mjs';
import EventSource from 'base/event-source.mjs';
import {Connection, JsonFormatter} from 'base/remote-object.mjs';


export default class ObjectStub {

  static async connect(url) {
    const connection = await Connection.Open(url);
    return new this('', connection);
  }

  constructor(path, connection, formatter, root) {
    this._path = path;
    this._connection = connection;
    this._formatter = formatter || new JsonFormatter;
    this._root = root || this;
    this._json = null;
    this._change = new EventSource();

    if (Object.is(this._root, this)) {
      this._updateChannel = connection.openChannel();
      this._updateChannel.deref().send('');
      this._handleUpdates();
    }
  }

  get json() { return this._json; }
  get change() { return this._change; }

  async call(method, args) {
    return await this._call(this._path, method, args);
  }

  async callSubobject(path, method, args) {
    return await this._call(_joinPath(this._path, path), method, args);
  }

  async _call(path, method, args) {
    const channel = this._connection.openChannel();
    channel.deref().send(this._formatter.serializeCall(path, method, args));
    const responseData = await channel.deref().readNext();
    const response = this._formatter.deserializeResponse(responseData);
    if (!(response instanceof Error)) {
      return response;
    } else {
      throw response;
    }
  }

  subobject(path) {
    return SubobjectStub.create(this, path);
  }

  async authenticate(userName) {
    this.userName = userName;  // TODO
  }

  async deauthenticate() {
    delete this.userName;  // TODO
  }

  async _handleUpdates() {
    for await (const jsonData of this._updateChannel.deref().read()) {
      this._updateJson(this._formatter.deserializeResponse(jsonData));
    }    
  }

  _updateJson(json) {
    this._json = json;
    this._change._emit();
  }
}


class SubobjectStub extends ObjectStub {

  static create(parent, path) {
    assert(path);
    path = _joinPath(parent._path, path);
    const root = parent._root;
    const stub = new this(path, root._connection, root._formatter, root);
    stub._json = stub._getJsonFromRoot();
    root.change.listen(() => stub._updateJson(stub._getJsonFromRoot()));
    return stub;
  }

  _getJsonFromRoot() {
    return _getProperty(this._root.json, this._path);
  }
}


function _joinPath(parentPath, subPath) {
  return !parentPath
    ? subPath
    : subPath.startsWith('.')
      ? parentPath + subPath
      : parentPath + '.' + subPath;
}


function _getProperty(obj, path) {
  const expr = path.startsWith('.') ? 'obj' + path : 'obj.' + path;
  try {
    return eval(expr);
  } catch (e) {
  }
}
