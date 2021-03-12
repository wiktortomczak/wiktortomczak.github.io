
import '/zuzia/v0.2/__packages__/react/umd/react.production.min.js';
const React = window.React;

import Arrays from '/zuzia/v0.2/__packages__/base/arrays.mjs';
import assert from '/zuzia/v0.2/__packages__/base/assert.mjs';
import {ObjectViewWrapperBase} from '/zuzia/v0.2/__packages__/base/proto/object/object.mjs';
import {cE, fragment, Components, button} from '/zuzia/v0.2/__packages__/base/react.mjs';
import Types from '/zuzia/v0.2/__packages__/base/types.mjs';

import '/zuzia/v0.2/sensorium.pbobj.mjs';
const protoObject = window.protoObject;


function main() {
  // const sensorium = protoObject.Sensorium.remote('https://localhost:9000');
  Components.createAndRender(SensoriumView, {sensorium});
}


class SensoriumView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      stage: Start.element()
    };
  }

  get _sensorium() { return this.props.sensorium; }
  get _stage() { return this.state.stage; }

  render() {
    return cE(SensoriumView.Context.Provider, {value: {
      patient: this._sensorium.patient,
      setStage: this._setStage.bind(this)
    }}, fragment(
      cE('section', {id: this._stage.type.name}, this._stage),
      this._renderFooter()
    ));
  }

  _renderFooter() {
    return cE('footer', null, fragment(
      // cE(SensorState, {sensor: this._sensorium.sensor}),  TODO
      SessionState({
        ...this._stage.props,
        setStage: this._setStage.bind(this)
      })
    ));
  }

  _setStage(stage) {
    this.setState({stage});
  }
};

SensoriumView.Context = React.createContext();


function SessionState({session, block, exerciseId, setStage}) {
  const elements = [];
  if (session) {
    if (block) {
      elements.push(
        cE('span', null, cE('label', null, 'blok'), cE('data', null, block.label)));
      if (Types.isDefined(exerciseId)) {
        const numExercises = session.numExercises(block);
        elements.push(
          cE('span', null,
             cE('label', null, sessionLabel(session)),
             cE('data', null, `${exerciseId + 1} / ${numExercises}`)));
      }
    }
    elements.push(
      button('przerwij ' + sessionLabel(session), () => setStage(Start.element())));
  }
  return fragment(...elements);
}


class Stage extends React.Component {

  get _setStage() { return this.context.setStage; }
}

Stage.contextType = SensoriumView.Context;


class Start extends Stage {

  static element() {
    return cE(this);
  }
  
  get _patient() { return this.context.patient; }

  render() {
    const nextStage = this._getNextStage();
    if (nextStage) {
      var buttonLabel =
        (!nextStage.props.session.isStarted ? 'rozpocznij' : 'wznów')
            + ' ' + sessionLabel(nextStage.props.session);  // TODO
    }
    return fragment(
      nextStage
        ? button(buttonLabel, () => this._setStage(nextStage))
        : cE('p', null, 'Ukończono dostępne dotąd sesje. Wróć jutro!'),
      this._patient.sessions.map(session => {
        const className =
          session.isCompleted ? 'completed' :
          session.isStarted ? 'started' : 'not_started';
        return cE('div', {className},
                  session.date.toString() + ' ' + sessionLabel(session));
      })
    );
  }

  _getNextStage() {
    const session = this._patient.findNextSession();  // TODO
    if (session) {
      assert(!session.isCompleted);
      return SessionSummary.element(session);
    }
  }
}


class SessionStage extends Stage {

  get _session() { return this.props.session; }
}


class SessionSummary extends SessionStage {

  static element(session) {
    return cE(this, {session});
  }

  render() {
    const nextStage = this._getNextStage();
    const buttonLabel = nextStage.props.block
      ? (!nextStage.props.exerciseId ? 'rozpocznij' : 'wznów')
        + ' blok ' + nextStage.props.block.label
      : 'zakończ ' + sessionLabel(this._session);
    return fragment(
      cE('h3', null, sessionLabel(this._session) + ' ' + this._session.date.toString()),
      this._session.isStarted ?
        cE('p', null, fragment(
          cE('label', null, 'średni wynik ogółem'),
          cE('data', null, percentStr(this._session.getAverageScore())))) : null,
      _BLOCKS.map(block => this._renderBlockSummary(block)),
      cE('div', {style: {clear: 'both'}}),  // TODO: Remove, clear via CSS.
      button(buttonLabel, () => this._setStage(nextStage))
    );
  }

  _renderBlockSummary(block) {
    const completedExercises = this._session.getCompletedExercises(block);

    return cE('div', {className: 'block'}, fragment(
      cE('table', null, fragment(
        cE('thead', null, 'blok ' + block.label),
        cE('tr', null, cE('th', null, 'ćw.'), cE('th', null, 'wynik')),
        this._session.getExercises(block).map((exercise, i) => {
          return cE('tr', null,
                    cE('td', null, i+1), cE('td', null, percentStr(exercise.score)));
        })
      )),
      completedExercises.length
        ? cE('p', null, fragment(
          cE('label', null, 'średni wynik'),
          cE('data', null, percentStr(Arrays.mean(completedExercises.map(e => e.score))))))
        : null
    ));
  }

  _getNextStage() {
    if (!this._session.isCompleted) {
      const {block, exerciseId} = this._session.getNextBlockExerciseId();
      return !exerciseId
        ? BlockStart.element(this._session, block)
        : Exercise.element(this._session, block, exerciseId);
    } else {
      return Start.element();
    }
  }
}


class BlockStart extends SessionStage {

  static element(session, block) {
    return cE(this, {session, block});
  }

  get _block() { return this.props.block; }

  render() {
    return fragment(
      cE('h3', null, 'BLOK ' + this._block.label),
      cE('p', null, this._block.blockInstruction),
      button('rozpocznij blok ' + this._block.label, () => (
        this._setStage(Exercise.element(this._session, this._block, 0))))
    );
  }
}


class Exercise extends SessionStage {

  static element(session, block, exerciseId) {
    return cE(this, {session, block, exerciseId});
  }

  constructor(props) {
    super(props);
    this._exercise = this._session.getExercises(this._block)[this._exerciseId];
    assert(!this._exercise.hasResponse);
  }

  get _block() { return this.props.block; }
  get _exerciseId() { return this.props.exerciseId; }

  render() {
    return fragment(
      cE('p', null, this._block.exerciseInstruction),
      button('ukończ', () => {
        this._exercise.setScore(Math.random());  // TODO
        this._setStage(
          ExerciseEnd.element(this._session, this._block, this._exerciseId));
      })
    );
  }    
}


class ExerciseEnd extends SessionStage {

  static element(session, block, exerciseId) {
    return cE(this, {session, block, exerciseId});
  }

  constructor(props) {
    super(props);
    this._exercise = this._session.getExercises(this._block)[this._exerciseId];
    assert(this._exercise.hasResponse);
  }

  get _block() { return this.props.block; }
  get _exerciseId() { return this.props.exerciseId; }

  render() {
    return fragment(
      cE('p', null, fragment(
        cE('label', null, 'ukończono próbę'),
        cE('data', null,
           `${this._exerciseId + 1} / ${this._session.numExercises(this._block)}`))),
      cE('p', null,
         cE('label', null, 'wynik'),
         cE('data', null, percentStr(this._exercise.score))),
      button('przejdź dalej', () => this._setStage(this._getNextStage())),
      button('spróbuj ponownie', () => {
        this._exercise.reset();
        this._setStage(
          Exercise.element(this._session, this._block, this._exerciseId));
      })
    );
  }

  _getNextStage() {
    const {block, exerciseId} = this.props;
    return this._session.hasExercise(block, exerciseId + 1)
      ? Exercise.element(this._session, block, exerciseId + 1)
      : SessionSummary.element(this._session);
  }
}


function sessionLabel(session) {
  return session.isTraining ? 'ćwiczenie' : 'test';
}


function percentStr(value) {
  return Types.isDefined(value) ? (value * 100).toFixed(0) + '%' : '';
}


const _BLOCKS = [{
  id: 0, label: 'I',
  blockInstruction: 'instrukcja do bloku I',
  exerciseInstruction: 'instrukcja do ćwiczenia w bloku I'
}, {
  id: 1, label: 'II',
  blockInstruction: 'instrukcja do bloku II',
  exerciseInstruction: 'instrukcja do ćwiczenia w bloku II'
}, {
  id: 2, label: 'III',
  blockInstruction: 'instrukcja do bloku III',
  exerciseInstruction: 'instrukcja do ćwiczenia w bloku III'
}];


// protoObject.Sensorium.setDeriveWrapper(class Sensorium {

protoObject.Sensorium.setWrapper(class Sensorium extends ObjectViewWrapperBase {

  static get objectViewClass() { return protoObject.Sensorium; }

  get patient() { return this._obj.patient.wrapper; }
  get sensor() { return this._obj.sensor.wrapper; }
});


protoObject.Patient.setWrapper(class Patient extends ObjectViewWrapperBase {

  static get objectViewClass() { return protoObject.Patient; }

  get sessions() { return this._obj.sessions.map(_ => _.wrapper); }

  findNextSession() { return this.sessions.find(s => !s.isCompleted); }
});


protoObject.Session.setWrapper(class Session extends ObjectViewWrapperBase {

  static get objectViewClass() { return protoObject.Session; }

  constructor(obj) {
    super(obj);
    this._exerciseBlocks = [
      this._obj.exercisesConstantPress.map(_ => _.wrapper),
      this._obj.exercisesVariablePress.map(_ => _.wrapper),
      this._obj.exercisesUtterance.map(_ => _.wrapper)
    ];
  }

  get isStarted() {
    return this._exerciseBlocks[0][0].hasResponse;
  }

  get isCompleted() {
    return Arrays.last(Arrays.last(this._exerciseBlocks)).hasResponse;
  }

  get isTraining() { return this._obj.type == TRAINING; }
  get isTest() { return this._obj.type == TEST; }

  get date() { return this._obj.date.wrapper; }

  getNextBlockExerciseId() {
    assert(!this.isCompleted);
    for (const [i, exercises] of this._exerciseBlocks.entries()) {
      const exerciseId = exercises.findIndex(e => !e.hasResponse);
      if (exerciseId != -1) {
        return {block: _BLOCKS[i], exerciseId};
      }
    }
  }

  getExercises(block) {
    return this._exerciseBlocks[block.id];
  }

  getCompletedExercises(block) {
    return this._exerciseBlocks[block.id].filter(e => e.hasResponse);
  }

  hasExercise(block, exerciseId) {
    return exerciseId < this.numExercises(block);
  }

  numExercises(block) {
    return this.getExercises(block).length;
  }

  getAverageScore() {
    const scores = [];
    for (const exercises of this._exerciseBlocks) {
      for (const exercise of exercises) {
        if (!exercise.hasResponse) {
          break;
        }
        scores.push(exercise.score);
      }
    }
    return Arrays.mean(scores);
  }
});


[protoObject.ExerciseBlockConstantPress,
 protoObject.ExerciseBlockVariablePress,
 protoObject.ExerciseBlockUtterance].forEach(messageClass => {

   class ExerciseAndResponse extends ObjectViewWrapperBase {

     static get objectViewClass() { return messageClass.ExerciseAndResponse; }

     get hasResponse() { return this._obj.has('response'); }
     get score() { return this._obj.score; }

     setScore(score) {
       // TODO
       this._obj.updateJson(['.response', {}]);
       this._obj.updateJson(['.score', score]);
     }

     reset() {
       // TODO
       this._obj.updateJson(['.response', null]);
       this._obj.updateJson(['.score', null]);
     }
   }

   messageClass.ExerciseAndResponse.setWrapper(ExerciseAndResponse);
 });


protoObject.Date.setWrapper(class Date extends ObjectViewWrapperBase {

  static get objectViewClass() { return protoObject.Date; }

  toString() { return this._obj.dateStr; }  // TODO
});


const TRAINING = 1;
const TEST = 2;

const sensorium = protoObject.Sensorium.fromJson({
  exerciseBlocks: {
    constantPress: {
      exercises: [
        {press: .1},
        {press: .5},
        {press: .9}
      ]
    },
    variablePress: {
      exercises: [
        {recording: {readings: [/* TODO */]}},
        {recording: {readings: [/* TODO */]}},
        {recording: {readings: [/* TODO */]}}
      ]
    },
    utterance: {
      exercises: [
        {recording: {readings: [/* TODO */]}, tags: [/* TODO */]},
        {recording: {readings: [/* TODO */]}, tags: [/* TODO */]},
        {recording: {readings: [/* TODO */]}, tags: [/* TODO */]}
      ]
    }
  },

  patient: {
    sessions: [
      {
        date: {dateStr: '2021-03-01'},
        type: TRAINING,
        exercisesConstantPress: [
          {exercise: '.exerciseBlocks.constantPress.exercises[0]'},
          {exercise: '.exerciseBlocks.constantPress.exercises[1]'},
          {exercise: '.exerciseBlocks.constantPress.exercises[2]'}
        ],
        exercisesVariablePress: [
          {exercise: '.exerciseBlocks.variablePress.exercises[0]'},
          {exercise: '.exerciseBlocks.variablePress.exercises[1]'},
          {exercise: '.exerciseBlocks.variablePress.exercises[2]'}
        ],
        exercisesUtterance: [
          {exercise: '.exerciseBlocks.utterance.exercises[0]'},
          {exercise: '.exerciseBlocks.utterance.exercises[1]'},
          {exercise: '.exerciseBlocks.utterance.exercises[2]'}
        ]
      },
      {
        date: {dateStr: '2021-03-02'},
        type: TRAINING,
        exercisesConstantPress: [
          {exercise: '.exerciseBlocks.constantPress.exercises[1]'},
          {exercise: '.exerciseBlocks.constantPress.exercises[2]'},
          {exercise: '.exerciseBlocks.constantPress.exercises[0]'}
        ],
        exercisesVariablePress: [
          {exercise: '.exerciseBlocks.variablePress.exercises[1]'},
          {exercise: '.exerciseBlocks.variablePress.exercises[2]'},
          {exercise: '.exerciseBlocks.variablePress.exercises[0]'}
        ],
        exercisesUtterance: [
          {exercise: '.exerciseBlocks.utterance.exercises[1]'},
          {exercise: '.exerciseBlocks.utterance.exercises[2]'},
          {exercise: '.exerciseBlocks.utterance.exercises[0]'}
        ]
      },
      {
        date: {dateStr: '2021-03-03'},
        type: TEST,
        exercisesConstantPress: [
          {exercise: '.exerciseBlocks.constantPress.exercises[2]'},
          {exercise: '.exerciseBlocks.constantPress.exercises[0]'},
          {exercise: '.exerciseBlocks.constantPress.exercises[1]'}
        ],
        exercisesVariablePress: [
          {exercise: '.exerciseBlocks.variablePress.exercises[2]'},
          {exercise: '.exerciseBlocks.variablePress.exercises[0]'},
          {exercise: '.exerciseBlocks.variablePress.exercises[1]'}
        ],
        exercisesUtterance: [
          {exercise: '.exerciseBlocks.utterance.exercises[2]'},
          {exercise: '.exerciseBlocks.utterance.exercises[0]'},
          {exercise: '.exerciseBlocks.utterance.exercises[1]'}
        ]
      }
    ]
  }
}).wrapper;


main();
