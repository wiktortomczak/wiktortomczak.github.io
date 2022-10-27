
import React from 'react'; 
import ReactDOM from 'react-dom'; 

import Arrays, {createCompareFuncFromKeyFunc} from 'base/arrays.mjs';
import assert from 'base/assert.mjs';
import BackgroundTask from 'base/background-task.mjs';
import Classes from 'base/classes.mjs';
import {parseCSVLine} from 'base/csv.mjs';
import {createAppendDiv, createAppendStyle, Document} from 'base/dom.mjs';
import Fetch from 'base/fetch.mjs';
import Iterables from 'base/iterables.mjs';
import {AsyncStateComponent, cE, fragment} from 'base/react.mjs';
import {button, Select2} from 'base/react-forms.mjs';

import * as model from 'vb/model.mjs';

const VERSION = 0.2;


async function main() {
  const playersUrl = (new URL(window.location)).searchParams.get('players');
  const playersCsv = playersUrl && await Fetch.get(playersUrl).getText();
  ReactDOM.render(fragment(
    GamesBuilder.cE(playersCsv),
    BackgroundTasks.cE(),
  ), createAppendDiv({id: 'root'}));
}


class ModelChangesComponent extends React.Component {

  get _model() { return this.props.model; }

  componentDidMount() {
    this._listenModelChanges();
  }

  componentWillUnmount() {
    this._unlistenModelChanges();
  }

  componentDidUpdate(prevProps) {
    if (!Object.is(this.props.model, prevProps.model)) {
      this._unlistenModelChanges();
      this._listenModelChanges();
    }
  }

  _listenModelChanges() {
    assert(!this._modelChangesListener);
    this._modelChangesListener =
      this._model.changes.listen(() => this.forceUpdate());
  }

  _unlistenModelChanges() {
    this._modelChangesListener.remove();
    delete this._modelChangesListener;
  }
}



class GamesBuilder extends ModelChangesComponent {

  static cE(playersCsv=undefined) {
    const games = new model.Games();
    return cE(this, {model: games, playersCsv});
  }

  constructor(props) {
    super(props);
    this.state = {
      players: null,
      playerFilterFunc: null,
      playerSortSpec: null,
      game: null,
    };

    // TODO: this._setPlayers();
    const playersBuilder = model.PlayersBuilder.create();
    this.state.players = playersBuilder;
    if (props.playersCsv) {
      this._addPlayersFromCSV(props.playersCsv);
    }
    playersBuilder.changes.listen(() => this.forceUpdate());

    this._tasks = [];
    this._nextUniqueId = 1;
  }

  get _players() { return this.state.players; }
  get _game() { return this.state.game; }

  get _playersBuilder() {
    return this.state.players instanceof model.GameBuilder ?
      this.state.players : undefined;
  }

  get _gameBuilder() {
    return this.state.game instanceof model.GameBuilder ?
      this.state.game : undefined;
  }

  render() {
    return fragment(
      this._renderHeader(),
      cE('main', {}, fragment(
        this._renderPlayers(),
        this._renderTeams(),
        cE('div', {id: 'game_games_tasks'}, fragment(
          this._renderGame(),
          this._renderGames(),
          this._renderTasks()
        ))
      ))
    );
  }

  _renderHeader() {
    return cE('header', {}, fragment(
      cE('span', {}, 'Teams builder v' + VERSION)
      // cE('a', {href: 'instructions.html', target: '_blank'}, 'Instructions')
    ));
  }

  _renderPlayers() {
    return cE('section', {id: 'players', className: 'box'}, fragment(
      cE('label', {}, 'players'),
      cE('div', {className: 'top_right'}, fragment(
        cE('data', {className: 'int'}, this._players.numPlayers), ' ',
        cE(Select2, {
          labelsValues: this.constructor._playerFilterLabelsValues,
          defaultValue: this.state.playerFilterFunc,
          onChange: playerFilterFunc => this.setState({playerFilterFunc})
        }),
        ' sort: ',
        cE(Select2, {
          labelsValues: this.constructor._playerSortLabelsValues,
          defaultValue: this.state.playerSortSpec,
          onChange: playerSortSpec => this.setState({playerSortSpec}),
        }),
      )),
      cE('table', {}, ...Iterables.map(this._filterSortPlayerTeams(), ([player, team]) => {
        const teamProps = team ? {style: {backgroundColor: _color(team.id)}} : {};
        return cE('tbody', {key: player.stringKey, className: 'player'}, fragment(         
          cE('tr', {}, fragment(
            cE('td', {}, player.name),
            cE('td', {}, player.gender),
            cE('td', {className: 'numeric'}, player.rating),
            cE('td', teamProps, team && team.id)
          )),
          this._playersBuilder && trtd({colSpan: 4}, fragment(
            this._gameBuilder && cE('div', {}, fragment(
              'team: ',
              button('-', () => team.removePlayer(player),
                     {disabled: !team}),
              ' ',
              ...this._gameBuilder.teams.map(otherTeam => (
                button(otherTeam.id, () => otherTeam.addPlayer(player),
                       {disabled: Object.is(team, otherTeam)})
              ))
            )),
            button('Remove', () => this._playersBuilder.removePlayer(player))
          ))
        ));
      })),
      this._playersBuilder && this._renderPlayersInputForm()
    ));
  }

  _filterSortPlayerTeams() {
    const {playerFilterFunc, playerSortSpec} = this.state;
    if (!playerSortSpec) {
      return playerFilterFunc
        ? Iterables.filter(this._players.playerTeams(), playerFilterFunc)
        : this._players.playerTeams();
    } else {
      const playerTeams = playerFilterFunc
        ? Iterables.filterToArray(this._players.playerTeams(), playerFilterFunc)
        : Iterables.toArray(this._players.playerTeams());
      const {keyFunc, order} = playerSortSpec;
      Arrays.sortByKey(playerTeams, keyFunc, order);
      return playerTeams;
    } 
  }

  _renderPlayersInputForm() {
    let textAreaEl;
    return cE('form', {}, fragment(
      button('Add players from CSV', () => {
        const badLines = this._addPlayersFromCSV(textAreaEl.value);
        textAreaEl.value = badLines.join('\n');
      }),
      cE('textarea', {ref: el => textAreaEl = el})
    ));
  }

  _renderTeams(print=false) {
    const teamComponentClass = this._gameBuilder ? TeamBuilder : Team;
    return cE('section', {id: 'teams'}, (
      this._game && this._game.teams.map(
        team => teamComponentClass.cE(team, this._game, print))
    ));
  }
  
  _renderGame() {
    if (this._game) {
      var variance = this._game.teamAverageRatingVariance;
      var allUnassigned = this._game.allUnassigned();
    }
    return cE('section', {id: 'game'}, (
      this._game && cE('div', {className: 'box'}, fragment(
        cE('label', {}, this._gameId(this._game)),
        cE('div', {}, !this._game.task ? fragment(
          button('Save', () => this._gameBuilder.save(),
                  {disabled: !this._gameBuilder.isChanged}),
          button('Restore', () => this._gameBuilder.restore(),
                 {disabled: !this._gameBuilder.isChanged}),
          button('Copy', () => this._copyGame(this._gameBuilder)),
          button('Remove', () => this._removeGame(this._gameBuilder))
        ) : button('Copy', () => this._copyGame(this._game))
        ),
        cE('div', {}, fragment(
          button('Export', () => this._exportGame(this._game)),
          button('Print', () => this._printGame(this._game))
        )),
        !this._game.task && cE('div', {}, fragment(
          button('Empty', () => this._emptyGame(this._gameBuilder),
                 {disabled: allUnassigned}),
          button('Keep pinned', () => this._emptyGame(this._gameBuilder, true),
                 {disabled: allUnassigned}),
          button('Fill balanced', () => this._fillGame(this._gameBuilder),
                 {disabled: this._gameBuilder.allAssigned()})
        )),
        cE('div', {}, fragment(
          cE('span', {}, 'team-average rating variance: ',
             cE('data', {className: 'float'},
                variance !== undefined ? variance.toFixed(4) : '-'))
        ))
      ))
    ));
  }         

  _renderGames() {
    let numTeams = 6;
    return cE('section', {id: 'games', className: 'box'}, fragment(
      cE('label', {}, 'teams'),
      cE('div', {}, fragment(
        'new teams: ',
        button('Empty', () => this._addGameBuilder(numTeams)),
        button('Balanced', () => this._generateBalanced(numTeams),
               {disabled: this._players.numPlayers < numTeams}),
        ' ',
        cE(Select2, {
          values: [2, 3, 4, 5, 6],
          defaultValue: numTeams,
          onChange: value => numTeams = value
        }),
        ' teams'
      )),
      cE('table', {}, this._model.games.map(game => (
        cE('tbody', {
          key: game.id,
          className: Object.is(game, this._game) ? 'selected' : '',
          onClick: () => this._setGame(game)
        }, fragment(
          trtd({}, this._gameId(game)),
          trtd({}, button('Remove', e => {
            this._removeGame(game);
            e.stopPropagation();
          }))
        ))
      )))
    ));
  }

  _renderTasks() {
    return cE('section', {id: 'tasks'}, this._tasks.map(task => (
      cE(GenerateGamesTask, {
        key: task.id,  // TODO: Remove.
        gamesBuilder: this,
        task,
        gameSelected: this._game})
    )));
  }

  _gameId(game) {
    return game.id ? '#' + game.id + (game.isChanged ? '*' : '') : 'input';
  }

  _setPlayers(players=undefined) {
    if (!players) {
      players = new model.GameBuilder();
    }
    if (players instanceof model.GameBuilder) {
      players.changes.listen(() => this.forceUpdate());
    }
    this.setState({players, game: undefined});
  }

  _setGame(game) {
    if (game instanceof model.GameBuilder) {
      game.changes.listen(() => this.forceUpdate());
    }
    this.setState({game, players: game});
  }

  _resetGame() {
    assert(this._game);
    if (this._model.games[0]) {
      this._setGame(this._model.games[0]);
    } else {
      this._setPlayers(model.PlayersBuilder.fromGame(this._game));
    }
  }

  _addGameBuilder(numTeams) {
    const gameBuilder =
       model.GameBuilder.create(undefined, this._players.players(), numTeams);
    this._model.addGame(gameBuilder);
    this._setGame(gameBuilder);
  }

  _generateBalanced(numTeams) {
    const game = model.Game.template(this._players.players(), numTeams);
    const task = model.GenerateBalancedGamesTask.create(game);
    game.task = task;
    this._addTask(task);
  }

  _copyGame(game) {
    const gameBuilder = model.GameBuilder.fromGame(undefined, game);
    this._model.addGame(gameBuilder);
    this._setGame(gameBuilder);
  }

  _removeGame(game) {
    this._model.removeGame(game);
    this._resetGame();
  }

  _exportGame(game) {
    const childWindow = _createPopUp();
    (new Document(childWindow.document))
      .createAppendElement('pre', {}, this._game.toCSV());
  }

  _printGame(game) {
    const childWindow = _createPopUp();
    const document = new Document(childWindow.document);
    document.createAppendStyle(STYLE);
    const _game = game instanceof model.GameBuilder ?
      model.Game.fromGame(undefined, game) : game;
    ReactDOM.render(
      this._renderTeams.call({_game}, true /* print */),
      document.createAppendDiv());
  }

  _emptyGame(gameBuilder, keepPinned=false) {
    gameBuilder.removePlayersFromTeams(keepPinned);
  }

  _fillGame(gameBuilder) {
    const game = model.Game.fromGame(undefined, gameBuilder);
    const task = model.GenerateBalancedGamesTask.create(game);
    game.task = task;
    this._addTask(task);
  }

  _addTask(task) {
    task.id = this._nextUniqueId++;
    this._tasks.push(task);
    this.forceUpdate();
  }
  
  _removeTask(task) {
    Arrays.remove(this._tasks, task);
    if (this._game && Object.is(this._game.task, task)) {
      this._resetGame();
    } else {
      this.forceUpdate();
    }
  }

  _addPlayersFromCSV(csv) {
    const badLines = [];
    const players = [];
    for (const csvLine of _splitLines(csv)) {
      const row = parseCSVLine(csvLine);
      const name = row[0];
      const gender = row[1].toUpperCase();
      const rating = parseFloat(row[2]);
      try {
        var player = new model.Player(name, gender, rating);
      } catch (e) {
        badLines.push(csvLine);
        continue;
      }
      players.push(player);
    }
    this._playersBuilder.addPlayers(players);
    return badLines.join('\n');
  }
}

GamesBuilder._playerSortLabelsValues = [
  ['', null],
  ['name \u2191', {keyFunc: ([player]) => player.name, order: 'ascending'}],
  ['name \u2193', {keyFunc: ([player]) => player.name, order: 'descending'}],
  ['rating \u2191', {keyFunc: ([player]) => player.rating, order: 'ascending'}],
  ['rating \u2193', {keyFunc: ([player]) => player.rating, order: 'descending'}]
];

GamesBuilder._playerFilterLabelsValues = [
  ['all', null],
  ['unassigned', ([player, team]) => !team]
];


class Team extends React.Component {

  static cE(team, game, print) {
    return cE(this, {team, game, print});
  }

  get _team() { return this.props.team; }
  get _game() { return this.props.game; }
  get _print() { return this.props.print; }

  render() {
    const team = this._team;
    return cE('div', {className: 'team box'}, fragment(
      cE('label', {style: {backgroundColor: _color(team.id)}}, 'team ' + team.id),
      cE('div', {className: 'top_right'}, fragment(
        cE('span', {}, 'players:'),
        cE('data', {className: 'int'}, team.numPlayers),
        !this._print && fragment(
          cE('span', {}, 'avg rating:'),
          cE('data', {className: 'float'}, team.numPlayers ? team.averageRating().toFixed(1) : '-')
        )
      )),
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
            !this._print && cE('td', {}, player.gender),
            !this._print && cE('td', {className: 'numeric'}, player.rating)
          )),
          (team instanceof model.TeamBuilder) &&
          cE('tr', {}, cE('td', {colSpan: 3}, fragment(
            'team: ',
            button('-', () => team.removePlayer(player)), ' ',
            ...this._game.teams.map(otherTeam => (
              button(otherTeam.id, () => otherTeam.addPlayer(player),
                     {disabled: Object.is(team, otherTeam)})
            )),
            cE('br'),
            !isCaptain ?
              button('Captain', () => team.setCaptain(player)) :
              button('Captain', () => team.setCaptain(), {className: 'revert'}),
            !isPinned ?
              button('Pin', () => team.pinPlayer(player)) :
              button('Pin', () => team.unpinPlayer(player),
                     {className: 'revert', disabled: isCaptain})
          )))
        ));
      }))
    ));
  }

  componentDidUpdate(prevProps) {
    if (!Object.is(prevProps.team, this.props.team)) {
      this.forceUpdate();
    }
  }
}

class TeamBuilder extends Classes.mix(Team, ModelChangesComponent) {

  static cE(team, game, print) {
    return cE(this, {model: team, team, game, print});
  }
}


class GenerateGamesTask extends AsyncStateComponent {

  constructor(props) {
    super(props);
    this.state = {
      task: this.props.task
    };
    this._gameTemplate = this.props.task.gameTemplate;
    this._label = this._gameTemplate.allUnassigned() ?
      'generating teams' : 'filling teams';
    this._games = [];
    this._numGames = 0;
    this._numGamesToKeep = 3;
    this._nextGameId = 1;
    this._task.result.onData(game => this._handleGame(game));
    this._task.result.onEnd(() => this.forceUpdate());
    this._task.result.onError(() => this.forceUpdate());
  }

  get _task() { return this.state.task; }
  get _gameSelected() { return this.props.gameSelected; }

  render() {
    return cE('div', {className: 'task box'}, fragment(
      cE('label', {}, this._label + (this._task.isRunning ? '...' : '')),
      cE('div', {className: 'top_right'}, fragment(
        button('Stop', () => this._task.cancel(),
                {disabled: !this._task.isRunning}),
        button('Remove', () => {
          this._task.isRunning && this._task.cancel();  // TODO
          this.props.gamesBuilder._removeTask(this._task);
        })
      )),
      cE('div', {}, fragment(
        'keep best ',
        cE(Select2, {
          values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          defaultValue: this._numGamesToKeep,
          onChange: numGamesToKeep => {
            this._numGamesToKeep = numGamesToKeep;
            if (numGamesToKeep < this._games.length) {
              this._games.length = numGamesToKeep;
              this.forceUpdate();
            }
          }
        }),
        ' of ', cE('data', {className: 'bigint'}, this._numGames), ' ',
      )),
      cE('table', {},
         cE('tbody', {
           className: Object.is(this._gameTemplate, this._gameSelected) ? 'selected' : '',
           onClick: () => this._setGame(this._gameTemplate)
         }, trtd({colSpan: 2}, 'input')),
         ...this._games.map((game, i) => (
           cE('tbody', {
             className: Object.is(game, this._gameSelected) ? 'selected' : '',
             onClick: () => this._setGame(game, i)
           }, fragment(
             cE('tr', {}, fragment(
               cE('td', {}, '#' + game.id),
               cE('td', {className: 'numeric'}, game.teamAverageRatingVariance.toFixed(4))
             )),
             trtd({colSpan: 2}, button('Copy', e => {
               this._copyGame(game, i);
               e.stopPropagation();
             }))
           ))
         ))
        )
    ));
  }

  _handleGame(game) {
    ++this._numGames;
    const score = game.teamAverageRatingVariance;
    if (this._games.length < this._numGamesToKeep) {
      var keep = true;
    } else if (score < this._maxScore) {
      keep = true;
      this._games.pop();
      this._maxScore = this._games.length ?
        Arrays.last(this._games).teamAverageRatingVariance : undefined;
    }
    if (keep) {
      game.id = this._nextGameId++;  // TODO
      Arrays.insertSorted(this._games, game, this.constructor._compareGames);
      this._maxScore = this._maxScore !== undefined ?
        Math.max(this._maxScore, score) : score;
    }
    this.forceUpdate();
  }

  _setGame(game, i) {
    this.props.gamesBuilder._setGame(this._unpackGame(game, i));
  }

  _copyGame(game, i) {
    this.props.gamesBuilder._copyGame(this._unpackGame(game, i));
  }

  _unpackGame(game, i) {
    if (game.unpack) {
      game = this._games[i] = game.unpack(game.id);
      game.task = this._task;
    }
    return game;
  }
}

GenerateGamesTask._compareGames =
  createCompareFuncFromKeyFunc(game => game.teamAverageRatingVariance);



class BackgroundTasks extends React.Component {

  static cE() {
    return cE(this);
  }

  constructor(props) {
    super(props);
    BackgroundTask.changes.listen(() => {
      document.body.className = BackgroundTask.running.size ? 'background_tasks' : '';
    });
  }

  render() { return null; }
}


function trtd(props, ...children) {
  return cE('tr', {}, cE('td', props, ...children));
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


function _createPopUp() {
  // javascript.info/popup-windows
  return window.open('', '_blank', [
    'location=no',
    'menubar=no',
    'toolbar=no',
    'status=no',
    'left=100',
    'top=100',
    'width=600',
    'height=800'
  ].join('\n'));
}


const STYLE = `
body {
  font-family: sans-serif;
  margin: 10px;
}

body.background_tasks * {
  cursor: progress !important;
}

header {
  font-size: smaller;
  margin-bottom: 4px;
  display: flex;
  justify-content: flex-end;
}

main {
  display: flex;
}

main > * {
  margin-right: 10px;
}

section {
  min-width: 20em;
}

section > * {
  margin-bottom: 10px;
}

#game_games_tasks > * {
  margin-bottom: 20px;
}

#game {
  min-height: 8em;
}

#game:empty {
  visibility: hidden;
}

.box {
  min-width: 20em;
  height: min-content;
  border: 1px solid black;
  position: relative;
}

.box > * {
  margin: 2px;
}

.box > label {
  display: block;
  background-color: #ccc;
  margin: 0 0 4px 0;
  padding: 4px 4px 2px 4px;
  font-size: 12pt;
  font-weight: bold;
}

.box > label + .top_right {
  position: absolute;
  top: 0;
  right: 0;
}

.box > label + div span {
  margin-left: 1em;
}

.box > table {
  margin: 0;
}

tr {  
  height: 1.5em;
}

td {
  padding-left: 4px;
}

td:last-child {
  padding-right: 4px;
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
  margin-bottom: 2px;
}

button:not(:last-child) {
  margin-right: 4px;
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

tbody:nth-of-type(even) {
  background-color: #eee;
}

tbody:hover, tbody:hover:nth-child(even) {  
  background-color: hsl(60, 100%, 95%);
}

tbody.selected, tbody.selected:nth-child(even) {
  background-color: hsl(60, 100%, 80%);
}

data {
  display: inline-block;
  text-align: right;
}

data.int {
  width: 1em;
}

data.bigint {
  width: 3em;
}

data.float {
  width: 2em;
}
`;

createAppendStyle(STYLE);


main();
