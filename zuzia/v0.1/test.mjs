
import '/zuzia/v0.1/__packages__/dygraphs/dygraph.js';
const Dygraph = window.Dygraph;

import assert from '/zuzia/v0.1/__packages__/base/assert.mjs';
import Arrays from '/zuzia/v0.1/__packages__/base/arrays.mjs';


function main() {
  const g = new Graph(createDiv());

  const start = new Date('2020/01/01 12:00');
  const t0 = new Date();

  function updateRange() {
    const msecSinceT0 = new Date() - t0;
    g.xAxisSetRange(
      new Date(start.getTime() + msecSinceT0),
      new Date(start.getTime() + msecSinceT0 + 10000));
  }
  updateRange();
  setInterval(updateRange, 30);

  const plot = g.addPlot('signal', 'green');
  const points = generatePoints();
  for (let i = 0; i <= 20; ++i) {
    g.plotAddPoint(plot, ...points.next().value);
  }
  createButton('Add point', {onClick: () => {
    g.plotAddPoint(plot, ...points.next().value);
  }});

  function *generatePoints() {
    for (let i = 0; ; ++i) {
      yield [new Date(start.getTime() + i * 1000), Math.random()];
    }
  }
}


class Graph {

  constructor(roolEl) {
    this._plotPoints = [];
    // [
    //   [1, 10, 100],
    //   [2, 20, 80],
    //   [3, 50, 60],
    //   [4, 70, 80]
    // ],
    this._plotLabels = [];  // [ "x", "A", "B" ]
    this._dygraph = new Dygraph(roolEl, this._plotPoints, {labels: this._plotLabels});
  }

  render(el) {
    TODO
  }

  xAxisSetRange(start, stop) {
    this._dygraph.updateOptions({dateWindow: [start, stop]});

    const firstToKeep = this._points.find(
      ([timestamp, _]) => this._pointsStart <= timestamp);
    this._points = this._points[firstToKeep-1:];  // TODO
  }

  addPlot(name, color) {
    this._plotLabels.push('x');
    this._plotLabels.push(name);
    // this._plotPoints;  // TODO
    // this._dygraph.updateOptions({file: this._plotPoints, labels: this._plotLabels});
    this._dygraph.updateOptions({labels: this._plotLabels});
  }

  plotAddPoint(plot, x, y) {
    assert(!this._plotPloint || x > Arrays.last(this._plotPoints)[0]);
    this._plotPoints.push([x, y]);
    this._dygraph.updateOptions({file: this._plotPoints});
  }
}


function createDiv() {
  const div = document.createElement('div');
  document.body.appendChild(div);
  return div;
}


function createButton(textContent, {onClick}) {
  const button = document.createElement('button');
  button.textContent = textContent;
  button.onclick = onClick;
  document.body.appendChild(button);
  return button;
}


main();


function x() {

$(document).ready(function() {
      var data = [];
      var t = new Date();
      for (var i = 10; i >= 0; i--) {
        var x = new Date(t.getTime() - i * 1000);
        data.push([x, Math.random()]);
      }

      var g = new Dygraph(document.getElementById("div_g"), data,
                          {
                            drawPoints: true,
                            showRoller: true,
                            valueRange: [0.0, 1.2],
                            labels: ['Time', 'Random']
                          });
      // It sucks that these things aren't objects, and we need to store state in window.
      window.intervalId = setInterval(function() {
        var x = new Date();  // current time
        var y = Math.random();
        data.push([x, y]);
        g.updateOptions( { 'file': data } );
      }, 1000);
    }
);

}
