
const d3 = window.d3;

import assert from 'https://tomczak.xyz/jain-krishna/__packages__/linux-service/client/assert.mjs';


export default class Plot {

  constructor(svgEl, width, height, xLabel, yLabel) {
    this._svgEl = svgEl;
    this._chartWidth = width - Plot._margin.left - Plot._margin.right;
    this._chartHeight = height - Plot._margin.top - Plot._margin.bottom;
    this._createElements(width, height);

    this._xAxis = new Plot.XAxis(this);
    this._yAxis = new Plot.YAxis(this);
    this._lines = [];

    this._createLabels(xLabel, yLabel);

    this._newDataListeners = [];
  }

  _createElements(width, height) {
    const svg = d3.select(this._svgEl)
      .attr('width', width)
      .attr('height', height);
    this._chart = svg.append('g')
      .attr('transform', `translate(${Plot._margin.left}, ${Plot._margin.top})`);
  }

  _createLabels(xLabel, yLabel) {
    // TODO: Move to Axis class.
    this._chart.append('text')             
      .attr('transform', `translate(${this._chartWidth/2}, ${this._chartHeight + Plot._margin.top + 15})`)
      .style('text-anchor', 'middle')  // TODO
      .text(xLabel);
    this._chart.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - Plot._margin.left)
      .attr('x', 0 - (this._chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')  // TODO
      .text(yLabel);
  }

  get xAxis() { return this._xAxis; }
  get yAxis() { return this._yAxis; }
  get lines() { return this._lines; }

  draw() {
    for (const line of this._lines) {
      line.draw();
    }
    this._xAxis.draw();
    this._yAxis.draw();
  }

  addLine(label, class_) {
    this._lines.push(new Plot.Line(this, label, class_));
  }

  _onNewData(listener) {
    this._newDataListeners.push(listener);
  }
}

Plot._margin = {top: 20, right: 20, bottom: 40, left: 50};


Plot.Axis = class Axis {

  constructor(plot) {
    this._plot = plot;
    this._scale = null;
    this._d3 = null;
    this._pendingDraw = false;
  }

  draw() {
    if (this._pendingDraw) {
      if (this._d3) {
        this._d3.remove();
        this._d3 = null;
      }
      if (this._scale) {
        this._d3 = this._createD3();
      }

      this._pendingDraw = false;
    }
  }

  setDomain(start, end) {
    this._scale = this._createScale(start, end);
    this._pendingDraw = true;
    for (const line of this._plot._lines) {
      line._pendingDraws.data = true;
    }
  }

  setDomainAuto({endMin}) {
    for (const line of this._plot._lines) {
      assert(!line._dataLength);
    }
    this.setDomain(0, endMin);
    this._coordMax = -Infinity;
    this._plot._onNewData((x, y) => {
      this._coordMax = d3.max([this._coordMax, d3.max(this._getCoord(x, y))]);
      if (this._coordMax > this._scale.domain()[1]) {
        this.setDomain(0, Plot.Axis._findNextDomainEnd(this._coordMax));
      }
    });
  }

  _dataCoordToSVGCoord(dataCoord) {
    return this._scale(dataCoord);
  }
};

Plot.Axis._findNextDomainEnd = function(value) {
  let end;
  for (end of this._domainEnds) {
    if (end >= value) {
      break;
    }
  }
  return end;
};

Plot.Axis._domainEnds = [
  1, 2, 5, 10, 20, 50, 100, 200, 500,
  1000, 2000, 5000, 10000, 20000, 50000, 100000];

Plot.XAxis = class XAxis extends Plot.Axis {

  _createScale(start, end) {
    return d3.scaleLinear()
      .domain([start, end])
      .range([0, this._plot._chartWidth]);
  }

  _createD3() {
    return this._plot._chart.append('g')
      .call(d3.axisBottom(this._scale))
      .attr('transform', `translate(0, ${this._plot._chartHeight})`);
  }

  _getCoord(x, y) {
    return x;
  }
};

Plot.YAxis = class YAxis extends Plot.Axis {

  _createScale(start, end) {
    return d3.scaleLinear()
      .domain([start, end])
      .range([this._plot._chartHeight, 0]);
  }

  _createD3() {
    return this._plot._chart.append('g')
      .call(d3.axisLeft(this._scale));
  }

  _getCoord(x, y) {
    return y;
  }
};


Plot.Line = class Line {

  constructor(plot, label, class_) {
    this._plot = plot;
    this._label = label;

    this._data = {x: [], y: []};
    this._pendingDraws = {};

    class_ = 'line ' + (class_ || '');
    this._line = plot._chart.append('g').attr('class', class_);
  }

  addData(x, y) {
    this._data.x.push(...x);
    this._data.y.push(...y);
    this._pendingDraws.newData = true;
    this._plot._newDataListeners.forEach(listener => listener(x, y));
  }

  get _dataLength() {
    return this._data.x.length;
  }

  _dataSVG(i) {
    return [
      this._plot._xAxis._dataCoordToSVGCoord(this._data.x[i]),
      this._plot._yAxis._dataCoordToSVGCoord(this._data.y[i])
    ];
  }

  draw() {
    if (this._pendingDraws.data) {
      // TODO: this._paths?
      this._line.selectAll('path').attr('d', i => (
        d3.line()([this._dataSVG(i), this._dataSVG(i+1)])));
    }

    if (this._pendingDraws.newData) {
      // TODO: this._paths?
      this._line.selectAll('path').data(d3.range(this._dataLength - 1)).enter()
        .append('path').attr('d', i => (
          d3.line()([this._dataSVG(i), this._dataSVG(i+1)])));
    }

    this._pendingDraws = {};
  }
};
