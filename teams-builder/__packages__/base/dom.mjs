

export class Document {

  constructor(document=undefined) {
    this.document = document || window.document;
  }

  createAppendDiv(props) {
    return this.createAppendElement('div', props);
  }

  createAppendElement(tagName, props, ...childElements) {
    const el = this.createElement(tagName, props, ...childElements);
    this.document.body.appendChild(el);
    return el;
  }

  createElement(tagName, props, ...childElements) {
    const el = this.document.createElement(tagName);
    if (props) {
      Object.assign(el, props);     
      if (props.style) {
        Object.assign(el.style, props.style);
      }
    }
    for (const childEl of childElements) {
      if (typeof childEl == 'string') {
        el.appendChild(this.document.createTextNode(childEl));
      } else {
        el.appendChild(childEl);
      }
    }
    return el;
  }

  createAppendStyle(css) {
    const styleEl = this.document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.appendChild(this.document.createTextNode(css));
    this.document.head.appendChild(styleEl);
  }

  createAppendCSSStyleSheet(cssUrl) {
    this.document.head.appendChild(
      createElement('link', {
        type: 'text/css',
        rel: 'stylesheet',
        href: cssUrl})
    );
  }
}

const DOCUMENT = new Document();

export const createAppendDiv = DOCUMENT.createAppendDiv.bind(DOCUMENT);
export const createAppendElement = DOCUMENT.createAppendElement.bind(DOCUMENT);
export const createElement = DOCUMENT.createElement.bind(DOCUMENT);
// TODO: Replace with createAppendStyle.
export const createStyle = DOCUMENT.createAppendStyle.bind(DOCUMENT);
export const createAppendStyle = DOCUMENT.createAppendStyle.bind(DOCUMENT);
export const createAppendCSSStyleSheet = DOCUMENT.createAppendCSSStyleSheet.bind(DOCUMENT);
