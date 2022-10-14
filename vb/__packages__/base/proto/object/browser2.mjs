
import 'https://wiktortomczak.github.io/vb/__packages__/base/__packages__/react/umd/react.development.js';
const React = window.React;
import 'https://wiktortomczak.github.io/vb/__packages__/base/__packages__/react-dom/umd/react-dom.development.js';
const ReactDOM = window.ReactDOM;

import {cE, fragment, button, AsyncStateComponent} from 'https://wiktortomczak.github.io/vb/__packages__/base/react.mjs';



class ObjectBrowser extends React.Component {

  constructor(props) {
    super(props);
    this._displayedFields = new Map();    
    this._object.context.postUpdates.listen(field => {  // TODO: unlisten.
      if (!this._displayedFields.get(field)) {
        this._displayedFields.set(field, true);
        this.forceUpdate();
      }
    });
  }

  get _object() { return this.props.object; }

  render() {
    return this._displayedFields.keys().map(field => {
      return CompositeField.cE(field);
    });
  }
}


class CompositeField extends React.Component {

  static cE(field) {
    const fieldPartition = field.partition();
    return cE(this, {fieldPartition});
  }

  constructor(props) {
    super(props);
    // TODO: unlisten.
    this._fieldPartition.postUpdates.listen(() => this.forceUpdate());
  }

  get _fieldPartition() { return this.props.fieldPartition; }

  render() {
    // TODO: stale.
    return cE('div', {}, ...[
      cE('label', {}, this._fieldPartition.path().toString()),
      cE('data', {}, formatJso(this._fieldPartition.toJso()))
    ]);
  }
}


function formatJso() {
  throw Error('not implemented');
}
