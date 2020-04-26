// TODO: Replace goog.style.getSize() with something simpler,
// eg. el.getBoundingClientRect().

import 'goog:goog.style';


function replaceTexWithMathJaxInGraphVizObjects() {
  GraphVizObject.find().forEach(gvo => gvo.replaceTextWithMaxJax());
};

// TODO: Only after MathJax loaded. <script async> DOMContentLoaded?
window.onload = replaceTexWithMathJaxInGraphVizObjects;

    
class GraphVizObject {

  static find() {
    return toArray(document.getElementsByClassName('graphviz'))
      .filter(el => { return el.tagName == 'OBJECT'; })
      .map(el => new GraphVizObject(el));
  }

  constructor(objectEl) {
    this._objectEl = objectEl;
  }

  replaceTextWithMaxJax() {
    this._addMathJaxContainer().then(() => {
      findTexElements(this._objectEl.contentDocument).forEach(texEl => {
        const tex = texEl.textContent.replace(/^\$(.*)\$$/, '$1');
        createMathJaxElement(tex).then(mathJaxEl => {
          this._replaceTextElementWithMathJaxElement(texEl, mathJaxEl);
        });
      });
    });
  }

  // insert <div class='__graphviz_svg__' style='position: relative' />
  // before this._objectEl, then move this._objectEl inside.
  _addMathJaxContainer() {
    const mathJaxContainer = document.createElement('div');
    mathJaxContainer.setAttribute('class', '__graphviz_svg__');
    mathJaxContainer.style.position = 'relative';
    const objectSize = goog.style.getSize(this._objectEl);
    mathJaxContainer.style.width = objectSize.width + 'px';
    mathJaxContainer.style.height = objectSize.height + 'px';
    this._objectEl.insertAdjacentElement('beforebegin', mathJaxContainer);
    mathJaxContainer.appendChild(this._objectEl);

    return new Promise((resolve, reject) => {
      window.setTimeout(resolve, 1000);  // TODO: after object/svg rendered.
    }).then(() => {
      this._mathJaxContainer = mathJaxContainer;
    });
  }

  _replaceTextElementWithMathJaxElement(texEl, mathJaxEl) {
    const texElPos = goog.style.getRelativePosition(
      texEl, this._objectEl.contentDocument.firstChild);
    const texElSize = goog.style.getSize(texEl);
    
    this._mathJaxContainer.insertAdjacentElement('beforeend', mathJaxEl);
    mathJaxEl.style.position = 'absolute';
    const x = texElPos.x + texElSize.width / 2;
    const y = texElPos.y;  //  + texElSize.height / 2;
    const mathJaxContainerSize = goog.style.getSize(this._mathJaxContainer);
    mathJaxEl.style.left = (100 * x / mathJaxContainerSize.width) + '%';
    mathJaxEl.style.top = (100 * y / mathJaxContainerSize.height) + '%';
    mathJaxEl.style.fontSize = texElSize.height + 'px';

    texEl.parentNode.removeChild(texEl);
  }
}


function findTexElements(docEl) {
  return toArray(docEl.getElementsByTagName('text')).filter(textEl => {
    return textEl.textContent.match(_TEX_RE);
  });
}

const _TEX_RE = /^\s*([LlRrCc]?)(\\\(.*\\\)|\$.*\$)\s*$/;


function createMathJaxElement(tex) {
  assert(!tex.startsWith('$'));
  assert(!tex.endsWith('$'));
  assert(!tex.startsWith('\\('));
  assert(!tex.endsWith('\\)'));

  const texEl = document.createElement('div');
  texEl.appendChild(document.createTextNode('\\(' + tex + '\\)'));

  const [mathJaxEl, mathJaxElResolver] = Promises.createWithResolver();
  MathJax.Hub.Queue(["Typeset", MathJax.Hub, texEl, () => {
    mathJaxElResolver.resolve(texEl);
  }]);

  return mathJaxEl;
}


class Elements {
  static getOnlyElementByTagName(el, tagName) {
    var els = el.getElementsByTagName(tagName);
    assert(els.length == 1);
    return els[0];
  }
}


class Promises {
  static createWithResolver() {
    var resolver = {};
    var promise = new Promise((resolve, reject) => {
      resolver.resolve = resolve;
      resolver.reject = reject;
    });
    return [promise, resolver];
  }
}


function assert(condition) {
  if (!condition) {
    throw Error();
  }
}


function toArray(arrayLike) {
  return Array.prototype.slice.call(arrayLike);
}
