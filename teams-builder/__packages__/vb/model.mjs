
import assert from 'base/assert.mjs';
import Arrays, {compareSecond} from 'base/arrays.mjs';
import {StreamTask} from 'base/background-task.mjs';
import Classes from 'base/classes.mjs';
import EventSource from 'base/event-source.mjs';
import Iterables from 'base/iterables.mjs';
import Maps from 'base/maps.mjs';
import Random from 'base/random.mjs';
import {variance} from 'base/stats.mjs';
import StringBuilder from 'base/stringbuilder.mjs';


class Changes {
  
  constructor() {
    this._changes = new EventSource();
  }

  get changes() { return this._changes; }
}


export class Games extends Changes {

  constructor() {
    super();
    this._games = [];
    this._nextGameId = 1;
  }

  get games() { return this._games; }

  addGame(game) {
    game._id = this._nextGameId++;  // TODO: Clean up.
    this._games.push(game);
    this._changes._emit();
  }

  removeGame(game) {
    Arrays.remove(this._games, game);
    this._changes._emit();
  }
}


export class Game {

  static template(players, numTeams) {
    const playerTeams = Iterables.mapToArray(players, player => [player, null]);
    const teams = Arrays.repeat(i => new Team(i + 1), numTeams);
    return new this(undefined, playerTeams, teams);
  }

  constructor(id, playerTeams=undefined, teams=undefined) {
    this._id = id;
    this._playerTeams = playerTeams || [];
    this._teams = teams || [];
  }

  static fromGame(id, game, teamClass=undefined, target=undefined) {
    const teamCopies = new Map();
    for (const team of game.teams) {
      teamCopies.set(team, (teamClass || Team).fromTeam(team));
    }
    function getTeamCopy(team) { return teamCopies.get(team); }

    const playerTeams = [...Iterables.map(
      game.playerTeams(),
      ([player, team]) => [player, getTeamCopy(team)])];
    const teams = game.teams.map(getTeamCopy);

    if (!target) {
      return new this(id, playerTeams, teams);
    } else {
      target._playerTeams = playerTeams;
      target._teams = teams;
    }
  }
  
  get id() { return this._id; }
  players() { return this._playersGen(); }
  *_playersGen() { for (const [player, _] of this._playerTeams) yield player; }
  get numPlayers() { return this._playerTeams.length; }
  playerTeams() { return this._playerTeams[Symbol.iterator](); }
  get teams() { return this._teams; }

  get teamAverageRatingVariance() {
    if (this._teamAverageRatingVariance === undefined) {
      const ratings = [];
      for (const team of this._teams) {
        if (team.numPlayers) {
          ratings.push(team.averageRating());
        } else {
          return;
        }
      }
      this._teamAverageRatingVariance = variance(ratings);
    }
    return this._teamAverageRatingVariance;
  }

  *unassigned() {
    for (const [player, team] of this._playerTeams) {
      if (!team) {
        yield player;
      }
    }
  }

  allAssigned() {
    for (const _ of this.unassigned()) {
      return false;
    }
    return true;
  }
  
  allUnassigned() {
    for (const [player, team] of this._playerTeams) {
      if (team) {
        return false;
      }
    }
    return true;
  }

  toCSV() {
    const s = new StringBuilder();
    for (const [player, team] of this._playerTeams) {
      s.append(player.name);
      s.append(',');
      s.append(player.gender);
      s.append(',');
      s.append(player.rating);
      if (team) {
        s.append(',');
        s.append(team.id);
      }
      s.append('\n');
    }
    return s.build();
  }
}


class Team {

  static fromPlayers(id, players) {
    const playersPinned = Maps.fromKeys(players, false);
    return new this(id, playersPinned);
  }

  constructor(id, playersPinned=undefined, captain=null) {
    this._id = id;
    this._playersPinned = playersPinned || new Map();
    this._captain = captain;
    this._totalRating = 0;
    for (const player of this._playersPinned.keys()) {
      this._totalRating += player.rating;
    }
  }

  static fromTeam(team) {
    return new this(team._id, new Map(team._playersPinned), team._captain);
  }

  get id() { return this._id; }
  players() { return this._playersPinned.keys(); }
  playersPinned() { return this._playersPinned.entries(); }
  get numPlayers() { return this._playersPinned.size; }
  get captain() { return this._captain; }

  isPinned(player) {
    const isPinned = this._playersPinned.get(player);
    assert (isPinned === true || isPinned === false);
    return isPinned;
  }

  get totalRating() { return this._totalRating; }
  averageRating() { return this._totalRating / this.numPlayers; }
}


export class GameBuilder extends Classes.mix(Game, Changes) {

  static create(id, players, numTeams) {
    const playerTeams = Maps.fromKeys(players, null);
    const teams = Arrays.repeat(i => new TeamBuilder(undefined, i + 1), numTeams);
    return new this(id, playerTeams, teams);
  }

  static fromGame(id, game, target=undefined) {
    if (!target) {
      return super.fromGame(id, game, {fromTeam});
    } else {
      super.fromGame(id, game, {fromTeam}, target);
      target._playerTeams = new Map(target._playerTeams);
      for (const team of target._teams) {
        team._gameBuilder = target;
      }
    }
    function fromTeam(team) { return TeamBuilder.fromTeam(undefined, team); }
  }

  constructor(id, playerTeams=undefined, teams=undefined) {
    if (playerTeams && !(playerTeams instanceof Map)) {
      playerTeams = new Map(playerTeams);  // TODO: Move to fromGame().
    }
    super(id, playerTeams || new Map(), teams);
    for (const team of this._teams) {
      team._gameBuilder = this;
    }
    this._changes = new EventSource();  // TODO
    this._isChanged = false;
    this.save();
  }

  players() { return this._playerTeams.keys(); }
  get numPlayers() { return this._playerTeams.size; }
  playerTeams() { return this._playerTeams.entries(); }

  setFromGame(game) {
    this.constructor.fromGame(game.id, game, this /* target */);
  }

  build(id) {
    return Game.fromGame(id, this);
  }

  get isChanged() { return this._isChanged; }

  save() {
    this._saved = Game.fromGame(this._id, this);
    this._setChanged(false);
  }

  restore() {
    assert(this._isChanged);
    this.setFromGame(this._saved);
    this._setChanged(false);
  }

  addPlayers(players) {
    for (const player of players) {
      assert(!this._playerTeams.has(player));
      this._playerTeams.set(player, null);
    }
    this._setChanged(true);
  }

  removePlayer(player) {
    const team = Maps.pop(this._playerTeams, player);
    if (team) {
      team._removePlayerInternalNoEmit(player);
      team._changes._emit();
    }
    this._setChanged(true);
  }
 
  removePlayersFromTeams(keepPinned=false) {
    for (const [player, team] of this._playerTeams) {
      if (team && (!keepPinned || !team.isPinned(player))) {
        team._removePlayerInternalNoEmit(player);
        this._playerTeams.set(player, null);
      }
    }
    for (const team of this._teams) {
      team._changes._emit();
    }
    this._setChanged(true);
  }

  _setChanged(isChanged) {
    this._isChanged = isChanged;
    delete this._teamAverageRatingVariance;
    this._changes._emit();
  }
}


export class TeamBuilder extends Classes.mix(Team, Changes) {

  static create(gameBuilder, id) {
    return new this(gameBuilder, id);
  }

  static fromTeam(gameBuilder, team) {
    const constructor = Classes.constructor(this, this.bind(this, gameBuilder));
    return Team.fromTeam.call(constructor, team);
  }

  constructor(gameBuilder, id, playersPinned=undefined, captain=null) {
    super(id, playersPinned, captain);
    this._changes = new EventSource();  // TODO
    this._gameBuilder = gameBuilder;
  }

  addPlayer(player) {
    const otherTeam = this._gameBuilder._playerTeams.get(player);
    this._addPlayerNoEmit(player);
    this._changes._emit();
    if (otherTeam) {
      otherTeam._changes._emit();
    }
    this._gameBuilder._setChanged(true);
  }

  _addPlayerNoEmit(player) {
    this._addPlayerInternalNoEmit(player);
    const playerTeams = this._gameBuilder._playerTeams;
    const otherTeam = playerTeams.get(player);
    if (otherTeam) {
      otherTeam._removePlayerNoEmit(player);
    }
    playerTeams.set(player, this);
  }

  _addPlayerInternalNoEmit(player) {
    assert(!this._playersPinned.has(player));
    this._playersPinned.set(player, false);
    this._totalRating += player.rating;
  }

  removePlayer(player) {
    this._removePlayerNoEmit(player);
    this._changes._emit();
    this._gameBuilder._setChanged(true);
  }
  
  _removePlayerNoEmit(player) {
    this._removePlayerInternalNoEmit(player);
    const playerTeams = this._gameBuilder._playerTeams;
    assert(Object.is(playerTeams.get(player), this));
    playerTeams.set(player, null);
  }

  _removePlayerInternalNoEmit(player) {
    assert(this._playersPinned.delete(player));
    if (Object.is(this._captain, player)) {
      this._captain = null;
    }
    this._totalRating -= player.rating;
  }

  pinPlayer(player) {
    assert(this._playersPinned.get(player) === false);
    this._playersPinned.set(player, true);
    this._changes._emit();
    this._gameBuilder._setChanged(true);
  }

  unpinPlayer(player) {
    assert(this._playersPinned.get(player));
    assert(!Object.is(player, this._captain));
    this._playersPinned.set(player, false);
    this._changes._emit();
    this._gameBuilder._setChanged(true);
  }

  setCaptain(player=null) {
    if (this._captain) {
      this._playersPinned.set(this._captain, false);
    }
    if (player) {
      assert(this._playersPinned.has(player));
      this._playersPinned.set(player, true);
    }
    this._captain = player;
    this._changes._emit();
    this._gameBuilder._setChanged(true);
  }
}


export class Player {

  constructor(name, gender, rating) {
    assert(typeof name == 'string');
    assert((gender == 'M' || gender == 'F'));
    assert(typeof rating == 'number' && !Number.isNaN(rating));
    this._name = name;
    this._gender = gender;
    this._rating = rating;
  }

  get name() { return this._name; }
  get gender() { return this._gender; }
  get isBoy() { return this._gender == 'M'; }
  get isGirl() { return this._gender == 'F'; }
  get rating() { return this._rating; }

  get stringKey() { return this._name; }
}


export class PlayersBuilder {

  static create() {
    return new GameBuilder;
  }

  static fromGame(game) {
    return GameBuilder.create(undefined, game.players(), 0);
  }
}

export class GenerateBalancedGamesTask {

  static create(gameTemplate) {
    const task = StreamTask.fromGenerator(
      gameTemplate.allUnassigned()
        ? this.genFromEmpty(gameTemplate)
        : this.genFromPrefilled(gameTemplate));
    task.gameTemplate = gameTemplate;
    return task;
  }

  static *genFromEmpty(gameTemplate) {
    const numTeams = gameTemplate.teams.length;
    const numPlayersPerTeam = this._balancedCounts(gameTemplate.numPlayers, numTeams);

    const boys = [...Iterables.filter(gameTemplate.players(), p => p.isBoy)];
    const girls = [...Iterables.filter(gameTemplate.players(), p => p.isGirl)];
    const numGirls = this._balancedCounts(girls.length, numTeams);

    while (true) {
      const game = GamePacked.create(
        gameTemplate.numPlayers, numPlayersPerTeam, gameTemplate);
      const players = game._players;

      Random.shuffle(boys);
      Random.shuffle(girls);
      Random.shuffle(numGirls);
      let p = 0, b = 0, g = 0;
      for (let t = 0; t < numTeams; ++t) {
        for (const gEnd = g + numGirls[t]; g < gEnd; ++g) {
          players[p++] = girls[g];
        }
        for (const bEnd = b + numPlayersPerTeam[t] - numGirls[t]; b < bEnd; ++b) {
          players[p++] = boys[b];
        }
      }

      yield game;
    }
  }

  static *genFromPrefilled(gameTemplate) {
    const boysToAdd = [];
    const girlsToAdd = [];
    for (const [player, team] of gameTemplate.playerTeams()) {
      if (!team) {
        (player.isBoy ? boysToAdd : girlsToAdd).push(player);
      }
    }
    const girlsPerTeam = gameTemplate.teams.map(this._numGirlsInTeam);

    const teamsTemplate = gameTemplate.teams.map(team => [...team.players()]);
    const maxTeamSize = Math.ceil(gameTemplate.numPlayers / teamsTemplate.length);

    while (true) {
      const teams = teamsTemplate.map(team => Arrays.copy(team));

      this._fillTeams(girlsToAdd, girlsPerTeam, teams, maxTeamSize);
      const playersPerTeam = teams.map(team => team.length);
      this._fillTeams(boysToAdd, playersPerTeam, teams, maxTeamSize);

      yield GamePacked.fromTeams(teams, gameTemplate);
    }
  }
  
  static _fillTeams(playersToAdd, playersPerTeam, teams, maxTeamSize) {
    Random.shuffle(playersToAdd);
    playersPerTeam = Arrays.enumerate(playersPerTeam).sort(compareSecond);

    let t = 0;
    let numPlayersMin = playersPerTeam[0][1];
    const teamsToAddTo = [];
    for (let p = playersToAdd.length; p; ) {
      while (true) {
        var numPlayersTarget = playersPerTeam[t] && playersPerTeam[t][1];
        if (numPlayersTarget !== numPlayersMin) break;
        Random.shuffleInto(teams[playersPerTeam[t++][0]], teamsToAddTo);
      }
      // Note: numPlayersTarget === undefined once teamsToAddTo is all teams.

      let tAdd = 0;
      while (p) {
        --p;
        const team = teamsToAddTo[tAdd];
        if (team.length < maxTeamSize) {
          team.push(playersToAdd[p]);
          ++tAdd;
        } else {
          Arrays.removeAt(teamsToAddTo, tAdd);
        }

        if (tAdd == teamsToAddTo.length) {
          if (++numPlayersMin == numPlayersTarget) break;
          tAdd = 0;
        }
      }
    }
  }

  static _balancedCounts(totalCount, numBuckets) {
    const countPerBucketFloor = Math.floor(totalCount / numBuckets);
    const countPerBucket = Arrays.repeat(countPerBucketFloor, numBuckets);
    for (let i = totalCount - countPerBucketFloor *  numBuckets; --i >= 0; ) {
      countPerBucket[i] += 1;
    }
    return countPerBucket;
  }

  static _numGirlsInTeam(team) {
    let numGirls = 0;
    for (const [player, _] of team.playersPinned()) {
      if (player.isGirl) {
        ++numGirls;
      }
    }
    return numGirls;
  }
}


class GamePacked {

  static create(numPlayers, numPlayersPerTeam, gameTemplate) {
    const players = Array(numPlayers);
    const teamIndices = Array(numPlayersPerTeam.length);
    teamIndices[0] = 0;
    for (let i = 1; i < numPlayersPerTeam.length; ++i) {
      teamIndices[i] = teamIndices[i-1] + numPlayersPerTeam[i-1];
    }
    return new this(players, teamIndices, gameTemplate);
  }

  static fromTeams(teams, gameTemplate) {
    const teamIndices = Array(teams.length);
    teamIndices[0] = 0;
    for (let i = 1; i < teams.length; ++i) {
      teamIndices[i] = teamIndices[i-1] + teams[i-1].length;
    }
    const numPlayers = Arrays.last(teamIndices) + Arrays.last(teams).length;

    const players = Arrays.concat(teams);
    return new this(players, teamIndices, gameTemplate);
  }

  constructor(players, teamIndices, gameTemplate) {
    this._players = players;
    this._teamIndices = teamIndices;
    this._gameTemplate = gameTemplate;
  }

  get numTeams() { return this._teamIndices.length; } 

  _teamPlayers(i) {
    return this._players.slice(this._teamIndices[i], this._teamIndices[i+1]);
  }

  // TODO: pinned / captain.
  unpack(id) {
    const playerTeams = new Map();
    const teams = [];
    for (let t = 0; t < this.numTeams; ++t) {
      const teamPlayers = this._teamPlayers(t);
      const team = Team.fromPlayers(t + 1, teamPlayers);
      // TODO: Clean up.
      team._captain = this._gameTemplate.teams[t]._captain;
      for (const [player, isPinned] of this._gameTemplate.teams[t].playersPinned()) {
        team._playersPinned.set(player, isPinned);
      }
      teams.push(team);
      for (const player of teamPlayers) {
        playerTeams.set(player, team);
      }
    }

    const gameTemplatePlayerTeams = Iterables.mapToArray(
      this._gameTemplate.players(),
      player => [player, playerTeams.get(player)]);
    return new Game(id, gameTemplatePlayerTeams, teams);
  }

  get teamAverageRatingVariance() {
    if (this._teamAverageRatingVariance === undefined) {
      const ratings = Array(this.numTeams);
      for (let i = this.numTeams; --i >= 0; ) {
        const rating = this.constructor._teamAverageRating(this._teamPlayers(i));
        if (rating === undefined) return;
        ratings[i] = rating;
      }
      this._teamAverageRatingVariance = variance(ratings);
    }
    return this._teamAverageRatingVariance;
  }

  static _teamAverageRating(teamPlayers) {
    if (teamPlayers.length) {
      let sum = 0;
      for (let i = 0; i < teamPlayers.length; ++i) {
        sum += teamPlayers[i].rating;
      }
      return sum / teamPlayers.length;
    }
  }
}


function _round(f, _10_exp_num_digits) {
  return Math.round(f * _10_exp_num_digits) / _10_exp_num_digits;
}
