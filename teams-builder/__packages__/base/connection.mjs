
import Event from 'base/event.mjs';
import createURL from 'base/url.mjs';


export default class Connection {

  static async open(urlStr) {
    const url = createURL(urlStr);
    if (url.protocol == 'ws:' || url.protocol == 'wss:') {
      return await WebsocketConnection.open(url);
      url.protocol = 'wss:';
    } else {
      throw Error('Unsupported protocol: ' + url.toString());
    }
  }

  onMessage(callback) {
    throw Error('abstract method');
  }

  sendMessage(message) {
    throw Error('abstract method');
  }
}


class WebsocketConnection extends Connection {

  static async open(url) {
    const websocket = new WebSocket(url.toString());  
    await Event.fromEventTarget(websocket, 'open');
    return new this(websocket);
  }

  constructor(websocket) {
    super();
    this._websocket = websocket;
    this._messageCallbacks = [];
    websocket.addEventListener('message', ({data}) => this._handleMessage(data));
  }
  
  onMessage(callback) {
    this._messageCallbacks.push(callback);
  }

  sendMessage(message) {
    this._websocket.send(message);
  }

  _handleMessage(message) {
    for (const callback of this._messageCallbacks) {
      callback(message);
    }
  }
}
