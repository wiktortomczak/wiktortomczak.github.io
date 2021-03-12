
import Graph from '/zuzia/v0.1/graph.mjs';

const {describe, it} = window.Mocha;
const chai = window.chai;


describe('Graph', function () {
  it('basic', function() {
    const g = new Graph();
    g.render(createDiv());
    g.yAxis.setRange(0, 4);
    const plot2 = g.addPlot('y=3', {color: 'blue'});
    plot2.addPoint(0, 3);
    plot2.addPoint(2, 3);
    const plot = g.addPlot('y=x^2', {color: 'green'});
    plot.addPoint(0, 0);
    plot.addPoint(1, 1);
    plot.addPoint(2, 2);
    plot.addPoint(3, 4);
  });  

  it('selectRange', function() {
    const g = new Graph();
    g.xAxis.setRange(0, 10);
    g.yAxis.setRange(0, 1);
    g.render(createDiv());
    g.xAxis.onSelectRange(range => {
      console.log(range);
    });
  });

  function createDiv() {
    const div = document.createElement('div');
    document.body.appendChild(div);
    return div;
  }
});
