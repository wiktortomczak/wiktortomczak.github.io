
import 'https://wiktortomczak.github.io/vb/__packages__/base/__packages__/react/umd/react.development.js';
const React = window.React;
import 'https://wiktortomczak.github.io/vb/__packages__/base/__packages__/react-dom/umd/react-dom.development.js';
const ReactDOM = window.ReactDOM;

import ObjectBrowser from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/object/browser.mjs';

import 'https://wiktortomczak.github.io/vb/__packages__/base/proto/object/testing/game_service.pbobj.mjs';
const protoObject = window.protoObject;


function main() {
  const gameService = protoObject.test.GameService.fromObject({
    player: {
      'A': {
        id: 'A',
        name: 'Alice'
      },
      'B': {
        id: 'B',
        name: 'Bob'
      },
      'C': {
        id: 'C',
        name: 'Charlie'
      },
      'D': {id: 'D', name: 'Ddd'},
      'E': {id: 'E', name: 'Eee'},
      'F': {id: 'F', name: 'Fff'},
      'G': {id: 'G', name: 'Ggg'},
      'H': {id: 'H', name: 'Hhh'},
      'I': {id: 'I', name: 'Iii'},
      'J': {id: 'J', name: 'Jjj'},
      'K': {id: 'K', name: 'Kkk'},
      'L': {id: 'L', name: 'Lll'},
      'M': {id: 'M', name: 'Mmm'},
      'N': {id: 'N', name: 'Nnn'},
      'O': {id: 'O', name: 'Ooo'},
      'P': {id: 'P', name: 'Ppp'},
      'Q': {id: 'Q', name: 'Qqq'},
      'R': {id: 'R', name: 'Rrr'},
      'S': {id: 'S', name: 'Sss'},
      'T': {id: 'T', name: 'Ttt'},
      'U': {id: 'U', name: 'Uuu'},
      'V': {id: 'V', name: 'Vvv'},
      'W': {id: 'W', name: 'Www'},
      'X': {id: 'X', name: 'Xxx'},
      'Y': {id: 'Y', name: 'Yyy'},
      'Z': {id: 'Z', name: 'Zzz'}
    },
    game: {
      '1': {
        id: '1',
        player1: '.player["A"]',
        player2: '.player["B"]',
        activePlayer: '.player["A"]'
      },
      '2': {
        id: '2',
        player1: '.player["A"]',
        player2: '.player["C"]',
        activePlayer: '.player["C"]'
      },
      '3': {
        id: '3',
        player1: '.player["B"]',
        player2: '.player["C"]',
        activePlayer: '.player["B"]'
      }
    }
  });
  const browser = ObjectBrowser.createElement(gameService);
  ReactDOM.render(browser, createDiv('browser'));
}


function createDiv(textContent) {
  const div = document.createElement('div');
  div.textContent = textContent;
  document.body.appendChild(div);
  return div;
}


main();
