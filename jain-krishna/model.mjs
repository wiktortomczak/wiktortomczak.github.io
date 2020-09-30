
const d3 = window.d3;
import LinuxServiceClient from 'https://tomczak.xyz/jain-krishna/__packages__/linux-service/client/linux-service-client.mjs';
import assert from 'https://tomczak.xyz/jain-krishna/__packages__/linux-service/client/assert.mjs';
import {Uint8MessageStream, BinaryReader} from 'https://tomczak.xyz/jain-krishna/__packages__/linux-service/client/binary.mjs';


class JainKrishnaModel {

  static fromJsonStream(numSpecies, modelJsonStream) {
    const species = d3.range(numSpecies).map(i => new this.Species(i));
    const model = new this(species);
    modelJsonStream.onData(stepJson => model._addStep(stepJson));
    return model;
  }

  static fromUint8Stream(numSpecies, modelUint8Stream) {
    const species = d3.range(numSpecies).map(i => new this.Species(i));
    const model = new this(species);
    Uint8MessageStream.fromUint8Stream(modelUint8Stream).onData(stepUint8 => {
      // console.log(stepUint8);
      const stepJson = this._stepUint8ToStepJson(stepUint8);
      if (model.numSteps > 2180) {
        console.log(model.numSteps, stepJson);
      };
      model._addStep(stepJson);
    });
    return model;
  }

  static _stepUint8ToStepJson(stepUint8) {
    const stepJson = {};
    const reader = BinaryReader.fromTypedArray(stepUint8);
    assert(reader.readUint16() == stepUint8.length);
    return {
      links: d3.map(arrayChunks(reader.readUint8Array(), 2),
                    ([source, target]) => ({source, target})),
      cores: d3.range(reader.readUint16()).map(
        () => reader.readUint8Array()),
      periphery: reader.readUint8Array()
    };
  }

  constructor(species) {
    this._species = species;
    this._steps = [];
    this._stepsJson = [];
    this._updateListeners = [];
  }

  get numSpecies() {
    return this._species.length;
  }

  get numSteps() {
    return this._steps.length;
  }

  step(stepId) {
    if (!this._steps[stepId]) {
      this._steps[stepId] = JainKrishnaModel.Step.fromJson(
        this._species, this._stepsJson[stepId]);
    }
    return this._steps[stepId];
  }

  onUpdate(listener) {
    this._updateListeners.push(listener);
    return listener;
  }

  removeListener(listener) {
    arrayRemove(this._updateListeners, listener);
  }

  removeListeners() {
    this._updateListeners.length = 0;
  }

  _addStep(stepJson) {
    this._stepsJson.push(stepJson);
    this._steps.push(null);
    this._updateListeners.forEach(listener => listener());
  }
}

JainKrishnaModel.Species = class Species {

  constructor(id) {
    this.id = id;
    this.type = undefined;
  }
};

JainKrishnaModel.Step = class Step {

  static fromJson(species, stepJson) {
    return new this(species, stepJson);
  }

  constructor(species, stepJson) {
    this._species = species;
    this._stepJson = stepJson;
  }

  // The result is only valid until another call to step.species() on another
  // Step instance.
  species() {
    this._species.forEach(species => {species.type = 'background';});
    for (const core of this._stepJson['cores']) {
      for (const speciesId of core) {
        this._species[speciesId].type = 'core';
      }
    }
    for (const speciesId of this._stepJson['periphery']) {
      this._species[speciesId].type = 'periphery';
    }
    return this._species;
  }
  
  get numLinks() {
    return this._stepJson['links'].length;
  }

  get numCores() {
    return this._stepJson['cores'].reduce((acc, val) => acc + val.length, 0);
  }

  get numPeriphery() {
    return this._stepJson['periphery'].length;
  }

  links() {
    return this._stepJson['links'].map(link => ({
      source: this._species[link['source']],
      target: this._species[link['target']]
    }));
  }
};


class JainKrishnaModelFactory {

  constructor() {
    this._activeRequest = null;
  }

  create(numSpecies, catalysisProbability, opt_numSteps, opt_randomSeed) {
    const args = [
      '--num_species=' + numSpecies,
      '--catalysis_proba=' + catalysisProbability,
      '--out=-',
      '--out_format=json',
      '--out_buffering=false',
    ];
    if (opt_numSteps) {
      args.push('--num_steps=' + opt_numSteps);
    }
    if (opt_randomSeed) {
      args.push('--random_seed=' + opt_randomSeed);
    }
    const fetchResponse = LinuxServiceClient.UploadAndExecute(
      ['./jain-krishna.py'].concat(args),
      ['./jain-krishna.py']
    );

    this._activeRequest = fetchResponse.cancelablePromise;
    this._activeRequest.finally(() => this._activeRequest = null);

    // const modelUint8Stream = fetchResponse.getUint8Stream();
    // return JainKrishnaModel.fromUint8Stream(numSpecies, modelUint8Stream);
    const modelJsonStream = fetchResponse.getJsonStream({framing: 'line-delimited'});
    return JainKrishnaModel.fromJsonStream(numSpecies, modelJsonStream);
  }

  get activeRequest() {
    return this._activeRequest;
  }
}


function arrayRemove(arr, element) {
  const index = arr.indexOf(element);
  assert(index != -1);
  arr.splice(index, 1);
}


// function* arrayChunks(arr, chunkSize) {
//   for (let offset = 0; offset < arr.length; offset += chunkSize) {
//     yield arr.slice(offset, offset + chunkSize);
//   }
// }

function arrayChunks(arr, chunkSize) {
  const chunks = [];
  for (let offset = 0; offset < arr.length; offset += chunkSize) {
    chunks.push(arr.slice(offset, offset + chunkSize));
  }
  return chunks;
}


export {JainKrishnaModel as default, JainKrishnaModelFactory};
