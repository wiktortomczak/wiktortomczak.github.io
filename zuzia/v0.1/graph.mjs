
import '/zuzia/v0.1/__packages__/dygraphs/dygraph.js';
const Dygraph = window.Dygraph;

import Arrays from '/zuzia/v0.1/__packages__/base/arrays.mjs';
import assert from '/zuzia/v0.1/__packages__/base/assert.mjs';
import AsyncCall from '/zuzia/v0.1/__packages__/base/async-call.mjs';
import Entries from '/zuzia/v0.1/__packages__/base/entries.mjs';
import Objects from '/zuzia/v0.1/__packages__/base/objects.mjs';
import Types from '/zuzia/v0.1/__packages__/base/types.mjs';


export default class Graph {

  constructor(options) {
    this._dygraph = null;  // Set in render.
    this._points = [];
    // [
    //   [1, 10, 100],
    //   [2, 20, 80],
    //   [3, 50, 60],
    //   [4, 70, 80]
    // ],
    this._labels = [''];  // [ "x", "A", "B" ]
    this._series = {};
    this._xAxis = new Graph.XAxis(this);
    this._yAxis = new Graph.YAxis(this);
    this._interactionModel = {
      mousedown: () => {},
      mouseup: () => {},
      mousemove: () => {}
    };
    this._pendingOptions = options || {};
    this._commitPendingOptionsAsync = AsyncCall.inAnimationFrame();
  }

  get xAxis() { return this._xAxis; }
  get yAxis() { return this._yAxis; }

  render(el) {
    this._dygraph = new Dygraph(el, this._points, {...{
      width: 600,
      labels: this._labels,
      connectSeparatedPoints: true,
      interactionModel: {
        mousedown: (...args) => this._interactionModel.mousedown(...args),
        mouseup: (...args) => this._interactionModel.mouseup(...args),
        mousemove: (...args) => this._interactionModel.mousemove(...args)
      }
      // The options below are achieved by injecting a no-op mouseMove_().
      // drawHighlightPointCallback: () => {},
      // showLabelsOnHighlight: false
    }, ...this._pendingOptions});
    this._pendingOptions = {};
    this._dygraph.mouseMove_ = () => {};

    this._selectionCanvas = this._dygraph.createPlotKitCanvas_(this._dygraph.canvas_);
    this._selectionCtx = this._selectionCanvas.getContext('2d');
    this._selectionCtx.fillStyle = 'rgba(128,128,128,0.33)';
    this._dygraph.graphDiv.insertBefore(this._selectionCanvas, this._dygraph.hidden_.nextSibling);
  }

  destroy() {
    this._commitPendingOptionsAsync.cancelIfPending();
    this._dygraph.destroy();
    delete this._dygraph;
  }

  addPlot(name, options) {
    for (const row of this._points) {
      row.push(null);
    }
    this._labels.push(name);
    this._series[name] = options || {};
    this._updateOptions({
      file: this._points,
      labels: this._labels,
      series: this._series
    });
    return new Graph.Plot(this, this._labels.length - 2);
  }

  _updateOptions(options, pending) {
    Object.assign(this._pendingOptions, options);
    this._commitPendingOptionsAsync.scheduleIfNotPending(
      this._commitPendingOptions.bind(this));

    // Object.assign(this._pendingOptions, options);
    // if (this._dygraph && !this._commitPendingOptionsId) {
    //   // TODO: requestAnimationFrame() already used by dygraph?
    //   this._commitPendingOptionsId = window.requestAnimationFrame(() => {
    //     this._commitPendingOptions();
    //     delete this._commitPendingOptionsId;
    //   });
    // }
  }

  _commitPendingOptions() {
    if (!Objects.isEmpty(this._pendingOptions)) {
      this._dygraph.updateOptions(this._pendingOptions);
      this._pendingOptions = {};
    }
  }

  _findOrInsertRow(x) {
    const [i, found] = Entries.bisectRight(this._points, x);
    if (found) {
      return this._points[i];
    } else {
      const row = new Array(this._labels.length).fill(null);
      row[0] = x;
      Arrays.insertAt(this._points, row, i);
      return row;
    }
  }

  _getEventCanvasXY(event) {
    const graphPos = Dygraph.findPos(this._dygraph.graphDiv);
    const canvasx = Dygraph.pageX(event) - graphPos.x;
    const canvasy = Dygraph.pageY(event) - graphPos.y;
    return [canvasx, canvasy];
  }
}

Graph.XAxis = class XAxis {

  constructor(graph) {
    this._graph = graph;
  }

  setLabel(label) {
    this._graph._labels[0] = label;
    this._graph._updateOptions({labels: this._graph._labels});
  }

  setRange(start, stop) {
    this._graph._updateOptions({dateWindow: [start, stop]});
  }

  clipPoints(start, stop) {
    assert(Types.isNullOrUndefined(stop));
    const idFirstToKeep = Entries.bisectRight(this._graph._points, start)[0];
    this._graph._points.splice(0, idFirstToKeep);
    this._graph._updateOptions({file: this._graph._points});  // TODO?
  }

  onSelectRange(callback) {
    this._selectRangeCallback = callback;
    this._graph._interactionModel = this._selectRangeInteractionModel;
  }

  _selectRangeInteractionModel = {
    mousedown: this._handleMouseDown.bind(this),
    mouseup: this._handleMouseUp.bind(this),
    mousemove: this._handleMouseMove.bind(this)
  }

  _handleMouseDown(event) {
    event.preventDefault();
    if (this._selection) {
      const [[x0, _], [x1, __]] = this._selection;
      this._graph._selectionCtx.clearRect(...this._horizontalRectArgs(x0, x1));
    }
    this._selection = [this._graph._getEventCanvasXY(event)];
    this._isMouseDown = true;
  }

  _handleMouseMove(event) {
    event.preventDefault();
    if (this._isMouseDown) {
      assert(this._selection);
      const x1Prev = this._selection[1] && this._selection[1][0];
      this._selection[1] = this._graph._getEventCanvasXY(event);
      const [[x0, _], [x1, __]] = this._selection;

      if (x1Prev) {
        this._graph._selectionCtx.clearRect(
          ...this._horizontalRectArgs(x0, x1Prev));
      }
      this._graph._selectionCtx.fillRect(...this._horizontalRectArgs(x0, x1));
    }
  }

  _handleMouseUp(event) {
    event.preventDefault();
    if (this._isMouseDown) {  // Could be false if mouse was clicked outside.
      assert(this._selection);
      const range = (this._selection.length == 2) ? _minmax(
        this._graph._dygraph.toDataCoords(...this._selection[0])[0],
        this._graph._dygraph.toDataCoords(...this._selection[1])[0]) : null;
      this._selectRangeCallback(range);
      if (!range) {
        delete this._selection;
      }
      delete this._isMouseDown;
    }
  }

  _horizontalRectArgs(x0, x1) {
    return [
      Math.min(x0, x1), this._graph._dygraph.layout_.getPlotArea().y,
      Math.abs(x0 - x1), this._graph._dygraph.layout_.getPlotArea().h];
  }
};

Graph.YAxis = class YAxis {

  constructor(graph) {
    this._graph = graph;
  }

  // setLabel(label) {
  //   this._graph._labels[0] = label;
  // }

  setRange(start, stop) {
    this._graph._updateOptions({valueRange: [start, stop]});
  }
};

Graph.Plot = class Plot {

  constructor(graph, id) {
    this._graph = graph;
    this._id = id;
  }

  addPoint(x, y) {
    const row = this._graph._findOrInsertRow(x);
    row[this._id + 1] = y;
    this._graph._updateOptions({file: this._graph._points});
  }

  remove() {
    const id = this._id + 1;
    const label = this._graph._labels[id];
    this._graph._labels.splice(id, 1);
    delete this._graph._series[label];
    for (const row of this._graph._points) {
      row.splice(id, 1);
    }
    this._graph._updateOptions({
      file: this._graph._points,
      labels: this._graph._labels,
      series: this._graph._series
    });
  }
};


function _minmax(a, b) {
  return (a < b) ? [a, b] : [b, a];
}
