
import 'https://wiktortomczak.github.io/vb/__packages__/react/umd/react.development.js';
const React = window.React;
import 'https://wiktortomczak.github.io/vb/__packages__/react-dom/umd/react-dom.development.js';
const ReactDOM = window.ReactDOM;

import {parseCSVLine} from 'https://wiktortomczak.github.io/vb/__packages__/base/csv.mjs';
import {createDiv, createStyle} from 'https://wiktortomczak.github.io/vb/__packages__/base/dom.mjs';
import Iterables from 'https://wiktortomczak.github.io/vb/__packages__/base/iterables.mjs';
import {cE, fragment} from 'https://wiktortomczak.github.io/vb/__packages__/base/react.mjs';
import {button, Select} from 'https://wiktortomczak.github.io/vb/__packages__/base/react-forms.mjs';

import * as model from 'https://wiktortomczak.github.io/vb/model.mjs';


function main() {
  ReactDOM.render(
    fragment(
      cE('header', {}, fragment(
        cE('a', {href: 'instructions.html', target: '_blank'}, 'Instructions'))),
      TeamsBuilder.cE()),
    createDiv({id: 'root'})
  );
}


class ModelChangesComponent extends React.Component {

  state = {model: this.props.model};

  get _model() { return this.state.model; }

  componentDidMount() {
    this._listenModelChanges();
  }

  componentWillUnmount() {
    this._unlistenModelChanges();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!Object.is(nextProps.model, this.state.model)) {
      this._resetModel(nextProps.model);
    }
  }

  _listenModelChanges(model=undefined) {
    this._modelChangesListener =
      (model || this._model).changes.listen(() => this.forceUpdate());
  }

  _unlistenModelChanges() {
    this._modelChangesListener.remove();
    delete this._modelChangesListener;
  }

  _resetModel(model) {
    this._unlistenModelChanges();
    this.setState({model});
    this._listenModelChanges(model);
  }
}



class TeamsBuilder extends ModelChangesComponent {

  static cE() {
    return cE(this, {model: new model.TeamsBuilder(6)});
  }

  constructor(props) {
    super(props);
    this.state.playerSubset = 'all';
  }

  render() {
    return fragment(
      this._renderPlayers(),
      this._renderTeams()
    );
  }

  _renderPlayers() {
    return cE('section', {id: 'players'}, fragment(
      cE('label', {}, 'players'),
      cE(Select, {
        values: ['all', 'unassigned'],
        value: this.state.playerSubset,
        onChange: value => this.setState({playerSubset: value})
      }),
      cE('table', {}, ...Iterables.map(this._model.playerTeams(), ([player, team]) => {
        if (this.state.playerSubset == 'unassigned' && team) {
          return null;  // TODO
        }
        const teamProps = team ? {style: {backgroundColor: _color(team.id)}} : {};
        return cE('tbody', {key: player.stringKey, className: 'player'}, fragment(         
          cE('tr', {}, fragment(
            cE('td', {}, player.name),
            cE('td', {className: 'numeric'}, player.rating),
            cE('td', teamProps, team && team.id)
          )),
          cE('tr', {}, cE('td', {colSpan: 2}, fragment(
            'team: ', ...this._model.teams.map(otherTeam => {
              return !Object.is(team, otherTeam) ? 
                button(otherTeam.id, () => otherTeam.addPlayer(player)) :
                button(otherTeam.id, () => otherTeam.removePlayer(player), {className: 'revert'});
            }),
            cE('br'),
            button('remove', () => this._model.removePlayer(player))
          )))
        ));
      })),
      this._renderPlayersInputForm()
    ));
  }

  _renderPlayersInputForm() {
    let textAreaEl;
    return cE('form', {}, fragment(
      button('Add players from CSV', () => {
        const badLines = this._addPlayersFromCSVLines(_splitLines(textAreaEl.value));
        textAreaEl.value = badLines.join('\n');
      }),
      cE('textarea', {ref: el => textAreaEl = el})
    ));
  }

  _renderTeams() {
    const fillProps = this._model.allAssigned() ? {disabled: true} : {};
    const allTeamsNonEmpty = this._model.teams.every(t => t.numPlayers);
    return cE('section', {id: 'teams'}, fragment(
      this._renderTeamsRestart(),
      cE('div', {}, fragment(
        button('Fill teams randomly', () => this._model.fillTeamsRandom(), fillProps),
        button('Fill teams strongest first', () => this._model.fillTeamsGreedy(), fillProps)
      )),
      cE('div', {}, fragment(
        button('Balance teams', () => this._model.balanceTeams(),
               allTeamsNonEmpty ? {} : {disabled: true}),
        cE('span', {}, 'rating range: ', cE('data', {className: 'float'}, (
          allTeamsNonEmpty ? this._model.computeAverageRatingRange().toFixed(1) : '-')))
      )),
      this._model.teams.map(team => TeamBuilder.cE(team))
    ));
  }

  _renderTeamsRestart() {
    let numTeamsEl;
    return cE('div', {id: 'restart'}, fragment(
      button('Restart', () => this._reset(numTeamsEl.value)), 'with ',
      cE('select', {
        ref: el => numTeamsEl = el,
        defaultValue: this._model.teams.length
      }, ...[2, 3, 4, 5, 6].map(i => cE('option', {value: i}, i))),
      ' teams'));
  }

  _addPlayersFromCSVLines(csvLines) {
    const badLines = [];
    const players = [];
    for (const csvLine of csvLines) {
      const row = parseCSVLine(csvLine);
      const name = row[0];
      const rating = parseFloat(row[1]);
      if (name && !Number.isNaN(rating)) {
        players.push(new model.Player(name, rating));
      } else {
        badLines.push(csvLine);
      }
    }
    this._model.addPlayers(players);
    return badLines;
  }

  _reset(numTeams) {
    const players = this._model.players();
    this._resetModel(new model.TeamsBuilder(numTeams, players));
  }
}


class TeamBuilder extends ModelChangesComponent {

  static cE(team) {
    return cE(this, {model: team});
  }

  render() {
    const team = this._model;
    return cE('div', {className: 'team'}, fragment(
      cE('label', {style: {backgroundColor: _color(team.id)}}, 'team ' + team.id),
      cE('div', {}, fragment(
        cE('span', {}, 'players:'),
        cE('data', {className: 'int'}, team.numPlayers),
        cE('span', {}, 'avg rating:'),
        cE('data', {className: 'float'}, team.numPlayers ? team.averageRating().toFixed(1) : '-'))),
      cE('table', {}, ...Iterables.map(team.playersPinned(), ([player, isPinned]) => {
        const isCaptain = Object.is(player, team.captain);
        return cE('tbody', {
          key: player.stringKey,
          className: 'player' +
            (isPinned ? ' pinned' : '') +
            (isCaptain ? ' captain' : '')
        }, fragment(
          cE('tr', {}, fragment(
            cE('td', {}, player.name),
            cE('td', {className: 'numeric'}, player.rating)
          )),
          cE('tr', {}, cE('td', {colSpan: 2}, fragment(
            'team: ', ...this._model._teamBuilder.teams.map(otherTeam => {
              return !Object.is(team, otherTeam) ? 
                button(otherTeam.id, () => otherTeam.addPlayer(player)) :
                button(otherTeam.id, () => otherTeam.removePlayer(player), {className: 'revert'});
            }),
            cE('br'),
            !isCaptain ?
              button('captain', () => team.setCaptain(player)) :
              button('captain', () => team.setCaptain(), {className: 'revert'}),
            !isPinned ?
              button('pin', () => team.pinPlayer(player)) :
              button('pin', () => team.unpinPlayer(player),
                     {className: 'revert', disabled: isCaptain}),
            button('remove', () => team._teamBuilder.removePlayer(player)),
          )))
        ));
      }))
    ));
  }
}


function _color(i) {
  return `hsl(${i * 60}, 100%, 80%)`;
}


function *_splitLines(text) {
  let iLineStart = 0;
  for (let i; (i = text.indexOf('\n', iLineStart)) != -1; ) {
    yield text.substring(iLineStart, i);
    iLineStart = i + 1;
  }
  if (iLineStart < text.length) {
    yield text.substring(iLineStart);
  }
}



createStyle(`
body {
  font-family: sans-serif;
  margin: 10px;
}

#root {
  position: relative;
  display: flex;
}

#root > * {
  margin-right: 10px;
}

header {
  position: absolute;
  top: 0;
  right: 0;
}

#players, .team {
  min-width: 20em;
  height: min-content;
  border: 1px solid black;
  position: relative;
}

#players > *, .team > * {
  margin: 2px;
}

#players > label, .team > label {
  display: block;
  background-color: #eee;
  margin: 0 0 4px 0;
  padding: 4px 4px 2px 4px;
  font-size: 12pt;
  font-weight: bold;
}

#players > label + div, .team > label + div, #players > label + select, .team > label + select {
  position: absolute;
  top: 0;
  right: 4px;
}

#players > label + div span, .team > label + div span {
  margin-left: 1em;
}

tr {  
  height: 1.5em;
  vertical-align: top;
}

td {
  padding-left: 4px;
}

td:last-child {
  padding-right: 4px;
}

#players > table, .team > table {
  margin: 0;
}

tbody:not(:hover) tr:nth-child(2) {
  display: none;
}

tr:nth-child(2) td {
  margin-top: 4px;
  font-size: smaller;
  border: none;
}

#players textarea {
  width: 100%;
  height: 10em;
  margin: 0;
}

#teams #restart {
  margin-bottom: 10px;
}

#teams .team {
  margin-top: 10px;
}

.team .player.captain tr:nth-child(1) td {
  font-weight: bold;
}

.team .player.pinned tr:nth-child(1) td {
  border: solid black;
  border-width: 2px 0 2px 0
}

.team .player.pinned tr:nth-child(1) td:first-child {
  border-left-width: 2px;
}

.team .player.pinned tr:nth-child(1) td:last-child {
  border-right-width: 2px;
}

button {
  margin-right: 4px;
  margin-bottom: 2px;
}

button.revert {
  text-decoration: line-through;
}

table {
  border-collapse: collapse;
  width: 100%;
}

td.numeric {
  text-align: right;
}

tbody:nth-child(even) {
  background-color: #eee;
}

tbody:hover, tbody:hover:nth-child(even) {  
  background-color: hsl(60, 100%, 95%);
}

data {
  display: inline-block;
  text-align: right;
}

data.int {
  width: 1em;
}

data.float {
  width: 2em;
}
`);


main();
