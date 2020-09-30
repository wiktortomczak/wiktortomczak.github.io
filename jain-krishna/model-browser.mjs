
const d3 = window.d3;
const React = window.React;
const ReactDOM = window.ReactDOM;

import assert from 'https://tomczak.xyz/jain-krishna/__packages__/linux-service/client/assert.mjs';

import JainKrishnaModel from 'https://tomczak.xyz/jain-krishna/model.mjs';
import Plot from 'https://tomczak.xyz/jain-krishna/plot.mjs';


export default class JainKrishnaModelBrowser extends React.Component {

  static createAndRender(modelFactory) {
    const descriptionEl = document.getElementById('description');
    descriptionEl.remove();
    return ReactDOM.render(
      React.createElement(JainKrishnaModelBrowser, {modelFactory, descriptionEl}),
      document.getElementById('JainKrishnaModelBrowser'));
  }

  constructor(props) {
    super(props);
    this.state = {
      showsDescription: false,
      model: null,
      numStepsPerPlotUpdate: 1000
    };
  }

  get _modelFactory() { return this.props.modelFactory; } 
  get _descriptionEl() { return this.props.descriptionEl; }
  get _model() { return this.state.model; }
  get _numStepsPerPlotUpdate() { return this.state.numStepsPerPlotUpdate; }

  render() {
    return [
      this._renderHeader(),
      React.createElement('main', {id: 'browser'}, [
        this._renderModelGenerator(),
        this._renderBrowserControls(),
        this._model ? this._renderModel() : null
      ])
    ];
  }
  
  _renderHeader() {
    return React.createElement('header', null, [
      React.createElement(
        'h1', null, 'Model of Autocatalytic Sets'),
      React.createElement('a', {
        href: '#',
        onClick: e => {
          e.preventDefault();
          const nextShowsDescription = !this._showsDescription;
          this.setState({showsDescription: nextShowsDescription});
          nextShowsDescription
            ? insertAfter(this._descriptionEl, document.getElementsByTagName('header')[0])
            : this._descriptionEl.remove();
        }
      }, this._showsDescription ? 'Hide description' : 'Show description')
    ]);
  }

  _renderModelGenerator() {
    return React.createElement(ModelGenerator, {
      modelFactory: this._modelFactory,
      onNewModel: model => this._handleNewModel(model)
    });
  }

  _renderBrowserControls() {
    return React.createElement('form', {
      id: 'browser_controls',
      onSubmit: e => e.preventDefault()
    }, [
      Forms.renderInput(this, 'numStepsPerPlotUpdate', 'steps per plot update')
    ]);
  }

  _renderModel() {
    return React.createElement(Model, {
      model: this._model,
      numStepsPerPlotUpdate: this._numStepsPerPlotUpdate
    });
  }

  _handleNewModel(model) {
    this.setState({model});
  }
}


class ModelGenerator extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
      numSpecies: 100,
      catalysisProbability: 0.0025,
      numSteps: null,
      randomSeed: 5
    };
  }

  get _modelFactory() {
    return this.props.modelFactory;
  }

  get _onNewModel() {
    return this.props.onNewModel;
  }

  get _numSpecies() {
    return this.state.numSpecies;    
  }

  get _catalysisProbability() {
    return this.state.catalysisProbability;    
  }

  get _numSteps() {
    return this.state.numSteps;    
  }

  get _randomSeed() {
    return this.state.randomSeed;    
  }

  render() {
    return [
      React.createElement('form', {
        id: 'parameters',
        onSubmit: e => {this._generateModel(); e.preventDefault();}
      }, [
        this._renderInputs([{
          variableName: 'numSpecies',
          symbolName: 's',
          description: 'number of species',
          type: 'integer'
        }, {
          variableName: 'catalysisProbability',
          symbolName: 'p',
          description: 'probabilty of catalytic interactions',
          type: 'float'
        }, {
          variableName: 'numSteps',
          symbolName: 'n',
          description: 'number of simulation steps',
          type: 'integer',
          optional: true
        }, {
          variableName: 'randomSeed',
          symbolName: 'r',
          description: 'random seed',
          type: 'integer',
          optional: true
        }]),
        React.createElement(
          'input', {type: 'submit', value: 'Run simulation'}),
        this._modelFactory.activeRequest ? 
          React.createElement(
            'input', {type: 'button', value: 'Stop simulation', onClick: () => {
              this._modelFactory.activeRequest.cancel();
            }}) :
          null
      ])
      // TODO: reset?
    ];
  }

  _renderInputs(inputs) {
    return React.createElement('table', {}, [
      React.createElement('tbody', {}, inputs.map(input => {
        const {variableName, symbolName, description, type, optional} = input;
        const inputToValue = 
          (type == 'integer' && !optional) ? parseInt :
          (type == 'integer' && optional) ? parseIntOptional :
          (type == 'float') ? parseFloat : raiseExpr(Error(type));
        return React.createElement('tr', {}, [
          React.createElement('td', {}, [
            React.createElement('var', null, symbolName)
          ]),
          React.createElement('td', {}, ' = '),
          React.createElement('td', {}, [
            React.createElement('input', {
              value: this['_' + variableName] || '',
              type: 'number',
              onChange: e => this.setState({[variableName]: inputToValue(e.target.value)})
            }),          
          ]),
          React.createElement('td', {}, description)
        ]);
      }))
    ]);
  }

  _generateModel() {
    if (this._modelFactory.activeRequest)
      this._modelFactory.activeRequest.cancel();

    const model = this._modelFactory.create(
      this._numSpecies,
      this._catalysisProbability,
      this._numSteps,
      this._randomSeed);
    this._onNewModel(model);

    this._modelFactory.activeRequest.finally(() => this.forceUpdate());  // TODO
  }
}


class Model extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      stepId: null
    };
  }
  
  get _model() { return this.props.model; }
  get _numStepsPerPlotUpdate() { return this.props.numStepsPerPlotUpdate; }
  get _stepId() { return this.state.stepId; }

  componentDidMount() {
    this._setUpModel();
  }

  componentDidUpdate(prevProps) {
    if (this.props.model != prevProps.model) {
      this._setUpModel();
    }
  }

  render() {
    return React.createElement('section', {id: 'model'}, (
      this._model.numSteps ? [
        React.createElement(SpeciesGraph, {
          model: this._model, stepId: this._stepId}),
        React.createElement(ModelControls, {
          model: this._model,
          stepId: this._stepId,
          onStepIdChange: stepId => this._goToStep(stepId)
        }),
        this._renderPlots()
      ] : 'Loading simulation results...'
    ));
  }

  _renderPlots() {
    return React.createElement('section', {id: 'plots'}, [
      this._createPlot({
        lines: [{
          label: 's\u2081(n): ACS (cores + periphery)',
          stepValue: step => step.numCores + step.numPeriphery
        }, {
          label: 'cores',
          stepValue: step => step.numCores,
          class_: 'core'
        }, {
          label: 'periphery',
          stepValue: step => step.numPeriphery,
          class_: 'periphery'
        }],
        yLabel: 'number of species',
        yEndMin: this._model.numSpecies
      }),

      this._createPlot({
        lines: [{stepValue: step => step.numLinks}],
        yLabel: 'l(n): number of catalytic links',
        yEndMin: this._model.numSpecies
      })      
    ]);
  }

  _setUpModel() {
    if (this._model.numSteps) {
      this.setState({stepId: 0});
    } else {
      this.setState({stepId: null});
      const listener = this._model.onUpdate(() => {
        assert(this._model.numSteps);
        this.setState({stepId: 0});
        this._model.removeListener(listener);
      });
    }
  }

  _goToStep(stepId) {
    if (stepId < 0) {
      stepId = 0;
    } else if (stepId >= this._model.numSteps) {
      stepId = this._model.numSteps - 1;
    }
    this.setState({stepId});
  }

  _createPlot({lines, yLabel, yEndMin}) {
    return React.createElement(ModelPlot, {
      model: this._model, lines, yLabel, yEndMin,
      numStepsPerUpdate: this._numStepsPerPlotUpdate, vLine: this._stepId
    });
  }
}


class ModelPlot extends React.Component {

  constructor(props) {
    super(props);
    this._plot = null;
    this._numStepsPlotted = 0;
    this._numStepsNextPlotUpdate = 0;
  }

  get _model() { return this.props.model; }
  get _lines() { return this.props.lines; }
  get _yLabel() { return this.props.yLabel; }
  get _yEndMin() { return this.props.yEndMin; }
  get _numStepsPerUpdate() { return this.props.numStepsPerUpdate; }

  render() {
    return React.createElement(
      'svg', {ref: svgEl => this._svgEl = svgEl});
  }

  componentDidMount() {
    this._plot = new Plot(
      this._svgEl, 400, 300,
      'n: number of steps', this._yLabel);
    for (const {label, class_} of this._lines) {
      this._plot.addLine(label, class_);
    }
    this._plot.xAxis.setDomainAuto({endMin: 1000});
    this._plot.yAxis.setDomainAuto({endMin: this._yEndMin});
    this._updatePlot();
    this._model.onUpdate(() => this._updatePlot());
  }

  _updatePlot() {
    if (this._model.numSteps >= this._numStepsNextPlotUpdate) {
      const linesData = this._lines.map(() => ({x: [], y: []}));
      for (; this._numStepsPlotted < this._model.numSteps;
           ++this._numStepsPlotted) {
        const step = this._model.step(this._numStepsPlotted);
        d3.zip(this._lines, linesData).forEach(([{stepValue}, lineData]) => {
          lineData.x.push(this._numStepsPlotted);
          lineData.y.push(stepValue(step));
        });
      }
      d3.zip(this._plot.lines, linesData).forEach(([line, lineData]) => {
        line.addData(lineData.x, lineData.y);
      });
      this._plot.draw();

      do {
        this._numStepsNextPlotUpdate += this._numStepsPerUpdate;
      } while (this._model.numSteps >= this._numStepsNextPlotUpdate);
    }
  }
  
  // TODO: tear down.
}


class SpeciesGraph extends React.Component {

  constructor(props) {
    super(props);
    this._width = 600;  // TODO
    this._height = 600;  // TODO
    this._speciesMap = new Map();
    this._createGraphForce();
  }

  get _model() {
    return this.props.model;
  }

  get _stepId() {
    return this.props.stepId;
  }

  render() {
    return React.createElement('svg', {id: 'species_graph'}, [
      this._renderDefs(),
      this._renderLinks(),
      this._renderSpecies()
    ]);
  }

  _renderDefs() {
    return React.createElement('defs', null, [
      React.createElement('marker', {
        id: 'arrowhead',
        markerWidth: 6,
        markerHeight: 4,
        refX: 14,
        refY: 2,
        orient: 'auto'
      }, React.createElement('polygon', {points: '0 0, 6 2, 0 4'}))
    ]);
  }

  _renderSpecies() {
    return React.createElement('g', null, [
      this._species.map(species => [
        React.createElement(
          'circle', {cx: species.x, cy: species.y, className: species.type}),
        React.createElement(
          'text', {x: species.x, y: species.y, dy: '.3em'}, species.id)
      ])
    ]);
  }

  _renderLinks() {
    return React.createElement('g', null, [
      this._links.map(
        link => React.createElement('line', {
          x1: link.source.x,
          y1: link.source.y,
          x2: link.target.x,
          y2: link.target.y,
          markerEnd: 'url(#arrowhead)'
        }))
    ]);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.model != this._model) {
      this._speciesMap.clear();
    }
    if (prevProps.model != this._model
        || prevProps.stepId != this._stepId) {
      this._updateGraphForce();
    }
  }

  _createGraphForce() {
    this._updateSpeciesLinks();
    this._graphForce =
      d3.forceSimulation(this._species)
      .force('charge', d3.forceManyBody().strength(-50).distanceMax(80).theta(0))
      .force('link', d3.forceLink(this._links))
      .force('x', d3.forceX(this._width / 2).strength(0.01))
      .force('y', d3.forceY(this._height / 2).strength(0.01))
      .on('tick', () => {
        // Each species's .x, .y have just been updated.
        this.forceUpdate();
      });
  }

  _updateGraphForce() {
    this._graphForce.stop();
    this._updateSpeciesLinks();
    this._graphForce.nodes(this._species);
    this._graphForce.force('link').links(this._links);
    this._graphForce.alpha(1);
    this._graphForce.restart();
  }

  _updateSpeciesLinks() {
    this._species = this._model.step(this._stepId).species().map(modelSpecies => {
      let graphSpecies = this._speciesMap.get(modelSpecies.id);
      if (!graphSpecies) {
        graphSpecies = {
          id: modelSpecies.id,
          x: randomInt(this._width),
          y: randomInt(this._height),
          type: modelSpecies.type
        };
        this._speciesMap.set(modelSpecies.id, graphSpecies);
      } else {
        graphSpecies['type'] = modelSpecies.type;
      }
      return graphSpecies;
    });

    this._links = this._model.step(this._stepId).links().map(link => ({
      source: this._speciesMap.get(link.source.id),
      target: this._speciesMap.get(link.target.id)
    }));
  }
}


class ModelControls extends React.Component {

  get _model() {
    return this.props.model;
  }

  get _stepId() {
    return this.props.stepId;
  }

  get _onStepIdChange() {
    return this.props.onStepIdChange;
  }

  render() {
    return React.createElement('form', {id: 'model_controls'}, [
      React.createElement('span', null, [
        'step',
        React.createElement(
          'input', {type: 'number', value: this._stepId, readOnly: true}),
        'of ' + this._model.numSteps,
      ]),     
      React.createElement(
        'input', {type: 'range', value: this._stepId,
                  min: 0, max: this._model.numSteps - 1, step: 1,
                  onInput: e => this._onStepIdChange(parseInt(e.target.value))}),
      React.createElement('span', null, [    
        React.createElement(
          'button', {onClick: () => this._onStepIdChange(this._stepId-100)}, '-100'),
        React.createElement(
          'button', {onClick: () => this._onStepIdChange(this._stepId-1)}, '-1'),
        React.createElement(
          'button', {onClick: () => this._onStepIdChange(this._stepId+1)}, '+1'),
        React.createElement(
          'button', {onClick: () => this._onStepIdChange(this._stepId+100)}, '+100')
      ])
    ]);
  }

  componentDidMount() {
    this._setUpModel();
  }

  componentDidUpdate(prevProps) {
    if (this.props.model != prevProps.model) {
      this._tearDownModel(prevProps.model);
      this._setUpModel();
    }
  }

  componentWillUnmount() {
    this._tearDownModel();
  }

  _setUpModel() {
    this._model.onUpdate(() => this.forceUpdate());
  }

  _tearDownModel(opt_model) {
    // TODO: Remove this specific listener only.
    (opt_model || this._model).removeListeners();
  }
}


class Forms {  // TODO: Mixin class.

  static renderInput(component, variableName, description,
                     inputToValue = parseInt) {
    return React.createElement('div', null, [
      React.createElement('input', {
        value: component.state[variableName] || '',
        type: 'number',
        onChange: e => component.setState({[variableName]: inputToValue(e.target.value)})
      }),
      description
    ]);
  }
}



function insertAfter(el, referenceEl) {
  referenceEl.parentNode.insertBefore(el, referenceEl.nextSibling);
}


function randomInt(n) {  // TODO: d3
  return Math.floor(Math.random() * n);
}


function parseIntOptional(s) {
  const value = parseInt(s);
  return !isNaN(value) ? value : null;
}
