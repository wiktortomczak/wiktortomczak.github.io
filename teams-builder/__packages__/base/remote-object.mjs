
import Arrays from 'base/arrays.mjs';
import {AsyncIterables} from 'base/iterables.mjs';
import Objects from 'base/objects.mjs';
import createURL from 'base/url.mjs';


export default class RemoteObjectClient {

  static async Connect(url) {
    const connection = await Connection.Open(url);
    return new this(connection);
  }

  constructor(connection) {
    this._connection = connection;
  }

  async createObject(objectPath) {
    return await RemoteObjectStub.Create(
      objectPath, this._connection, this._connection.openChannel());
  }
}


class RemoteObjectStub {

  static async Create(objectPath, connection, channel, formatter) {
    const stub = new this(objectPath, connection, channel, formatter);
    await stub.call('__create__', undefined, stub._defaultChannel);
    stub._handleEvents();
    return stub;
  }

  constructor(objectPath, connection, channel, formatter) {
    this._objectPath = objectPath;
    this._connection = connection;
    this._defaultChannel = channel;
    this._channels = [channel];
    this._formatter = formatter || new JsonFormatter;
    this._eventHandlers = {};
    // TODO: Uncomment.
    // this._handleEvents();
  }

  async call(method, args, channel) {
    channel = channel || this._openChannel();
    channel.deref().send(this._serializeCall(method, args));
    const responseData = await channel.deref().readNext();
    const response = this._formatter.deserializeResponse(responseData);
    if (!(response instanceof Error)) {
      return response;
    } else {
      throw response;
    }
  }

  callNoResult(method, args, channel)  {
    (channel || this._openChannel()).deref().send(
      this._serializeCall(method, args));
  }

  // async getSubobject(subobjectPath) {
  //   // TODO: send __get__ as/from subobject
  //   const channel = this._connection.openChannel();
  //   channel.deref().send(this._serializeCall('__get__'));
  //   await channel.deref().readNext();
  //   return new this.constructor(
  //     `${this._objectPath}.${subobjectPath}`,
  //     this._connection, this._formatter, channel);
  // }

  on(eventName, callback) {
    Objects.setDefault(this._eventHandlers, eventName, []).push(callback);
  }

  async delete() {
    // TODO: Separate __delete__ result from events in defaultChannel.
    await this.call('__delete__', undefined, this._defaultChannel);
    // TODO this._connection.closeIfNoChannels();
  }

  deleteNoWait() {
    this.callNoResult('__delete__', undefined, this._defaultChannel);
    // Stops all active calls and event handling.
    for (const channel of this._channels) {
      channel.deref().foreclose();
    }
    // TODO: Remove event handlers?
    // TODO this._connection.closeIfNoChannels();
  }

  // async reset() {
  //   await Promise.all([
  //     this.call('__delete__', undefined, this._defaultChannel),
  //     this.call('__create__', undefined, this._defaultChannel)
  //   ]);
  // }

  _openChannel() {
    const channel = this._connection.openChannel();
    this._channels.push(channel);
    channel.deref().onClose(() => Arrays.remove(this._channels, channel));
    return channel;
  }

  async _handleEvents() {
    for await (const eventData of this._defaultChannel.deref().read()) {
      const [eventName, data] = this._formatter.deserializeEvent(eventData);
      (this._eventHandlers[eventName] || []).forEach(handler => handler(data));
    }
  }

  _serializeCall(method, args) {
    return this._formatter.serializeCall(this._objectPath, method, args);
  }
}

export class JsonFormatter {

  serializeCall(objectPath, method, args) {
    return args
      ? objectPath + ' ' + method + ' ' + JSON.stringify(args)
      : objectPath + ' ' + method;
  }

  deserializeResponse(data) {
    const i = data.indexOf(' ');
    if (data.slice(0, i) != '__exception__') {
      return data ? JSON.parse(data) : undefined;
    } else {
      return Error(data.slice(i+1));
    }
  }
  
  deserializeEvent(data) {
    const i = data.indexOf(' ');
    if (i != -1) {
      const eventName = data.slice(0, i);
      return [eventName, JSON.parse(data.slice(i+1))];
    } else {
      const eventName = data;
      return [eventName];
    }
  }
}


export class Connection {

  static async Open(url, formatter) {
    return await WebsocketConnection.Open(createURL(url), formatter);
  }

  openChannel() {}
  close() {}  // TODO
}

class Channel {
  
  async readNext() {}
  read() {}
  send(data) {}
  close() {}
  onClose(callback) {}
}


class WebsocketConnection extends Connection {

  static async Open(url, formatter) {
    if (url.protocol == 'http:') {
      url.protocol = 'ws:';
    } else if (url.protocol == 'https:') {
      url.protocol = 'wss:';
    } else {
      throw Error('Unsupported protocol: ' + url.toString());
    }

    const websocket = new WebSocket(url.toString());  
    await EventPromise(websocket, 'open');  // TODO: timeout.
    return new this(websocket);
  }

  constructor(websocket, formatter) {
    super();
    this._websocket = websocket;
    this._formatter = formatter || this.constructor.defaultFormatter;

    this._channels = {};
    this._nextChannelId = 0;

    this._websocket.addEventListener('message', ({data}) => this._onMessage(data));
  }

  openChannel() {
    const channel = this._channels[this._nextChannelId] =
      new this.constructor.Channel(this._nextChannelId, this);
    ++this._nextChannelId;
    return new WeakRef(channel);
  }

  _forecloseChannel(channel) {
    channel._handleClose();
    this._channels[channel._id] = new this.constructor.ForeclosedChannel();
  }

  _send(channelId, data) {
    this._websocket.send(this._formatter.serializeMessage(channelId, data));
  }

  _onMessage(message) {
    const [channelId, data] = this._formatter.deserializeMessage(message);
    if (data != '__close__') {
      this._channels[channelId]._handleData(data);
    } else {
      this._channels[channelId]._handleClose();
      delete this._channels[channelId];
    }
  }
}

WebsocketConnection.Channel = class Channel {

  constructor(id, connection) {
    this._id = id;
    this._connection = connection;
    this._dataReceived = new AsyncIterables.Sink();
    this._closeCallbacks = [];
  }

  async readNext() {
    const {value} = await this._dataReceived.next();
    return value;
  }

  read() {
    return this._dataReceived;
  }

  send(data) {
    this._connection._send(this._id, data);
  }

  onClose(callback) {
    this._closeCallbacks.push(callback);
  }

  _handleData(data) {
    this._dataReceived.put(data);
  }

  _handleClose() {
    this._dataReceived.end();
    for (const callback of this._closeCallbacks) {
      callback();
    }
  }

  // Anticipate the remote peer closing the cannel.
  foreclose() {
    this._connection._forecloseChannel(this);
  }
};

WebsocketConnection.ForeclosedChannel = class ForeclosedChannel {
  _handleData(data) {}
  _handleClose() {}
}

WebsocketConnection.defaultFormatter = {
  serializeMessage: (channelId, data) => {
    return channelId.toString() + ' ' + data;
  },
  deserializeMessage: data => {
    let i = data.indexOf(' ');
    if (i == -1) { i = data.length; }
    const channelId = parseInt(data.slice(0, i));
    return [channelId, data.slice(i+1)];
  }
};


function EventPromise(eventEmitter, eventName) {
  return new Promise(resolve => {
    eventEmitter.addEventListener(eventName, () => resolve());
  });
}
