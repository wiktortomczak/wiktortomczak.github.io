
import assert from 'https://wiktortomczak.github.io/vb/__packages__/base/assert.mjs';
import Arrays from 'https://wiktortomczak.github.io/vb/__packages__/base/arrays.mjs';
import EventSource from 'https://wiktortomczak.github.io/vb/__packages__/base/event-source.mjs';
import Iterables from 'https://wiktortomczak.github.io/vb/__packages__/base/iterables.mjs';
import Maps from 'https://wiktortomczak.github.io/vb/__packages__/base/maps.mjs';
import Random from 'https://wiktortomczak.github.io/vb/__packages__/base/random.mjs';
import {range} from 'https://wiktortomczak.github.io/vb/__packages__/base/stats.mjs';


class Changes {
  
  constructor() {
    this._changes = new EventSource();
  }

  get changes() { return this._changes; }
}


export class Player {

  constructor(name, rating) {
    this._name = name;
    this._rating = rating;
  }

  get name() { return this._name; }
  get rating() { return this._rating; }

  get stringKey() { return this._name; }
}


export class TeamsBuilder extends Changes {

  constructor(numTeams, players=undefined) {
    super();
    this._playerTeams = new Map();
    for (const player of players || []) {
      this._addPlayerNoEmit(player);
    }
    this._teams = [];
    for (let i = 1; i <= numTeams; ++i) {
      this._teams.push(new TeamBuilder(this, i));
    }
  }

  players() { return this._playerTeams.keys(); }
  playerTeams() { return this._playerTeams.entries(); }
  get teams() { return this._teams; }

  *unassigned() {
    for (const [player, team] of this._playerTeams.entries()) {
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

  addPlayers(players) {
    for (const player of players) {
      this._addPlayerNoEmit(player);
    }
    this._changes._emit();
  }

  _addPlayerNoEmit(player) {
    assert(!this._playerTeams.has(player));
    this._playerTeams.set(player, null);
  }
  
  removePlayer(player) {
    const team = Maps.pop(this._playerTeams, player);
    if (team) {
      team._removePlayerInternalNoEmit(player);
      team._changes._emit();
    }
    this._changes._emit();
  }

  fillTeamsRandom() {
    this._fillTeams(
      Random.shuffle([...this.unassigned()]),
      teamsFewest => Random.choice(teamsFewest));
  }

  fillTeamsGreedy() {
    this._fillTeams(
      Iterables.sortedByKey(this.unassigned(), player => -player.rating),
      teamsFewest => Arrays.minKey(teamsFewest, team => team.averageRating()));
  }

  _fillTeams(unassigned, selectTeamWithFewestPlayers) {
    for (const player of unassigned) {
      selectTeamWithFewestPlayers(this._teamsWithFewestPlayers())
        ._addPlayerNoEmit(player);
    }

    this._changes._emit();
    for (const team of this._teams) {
      team._changes._emit();
    }
  }

  _teamsWithFewestPlayers() {
    let teams;
    let numFewestPlayers;
    for (const team of this._teams) {
      if (numFewestPlayers === undefined || team.numPlayers < numFewestPlayers) {
        numFewestPlayers = team.numPlayers;
        teams = [team];
      } else if (team.numPlayers == numFewestPlayers) {
        teams.push(team);
      }
    }
    return teams;
  };

  balanceTeams() {
    const unpinned = [];
    for (const [player, team] of this.playerTeams()) {
      if (team && !team.isPinned(player)) {
        unpinned.push([player, team]);
      }
    }

    const averageRatings = this._teams.map(team => team.averageRating());
    const swap = (player1, ti1, player2, ti2) => {
      averageRatings[ti2] +=
        (player1.rating - player2.rating) / this._teams[ti2].numPlayers;
      averageRatings[ti1] +=
        (player2.rating - player1.rating)  / this._teams[ti1].numPlayers;
    }

    let range = _round(this.computeAverageRatingRange(averageRatings), 100);
    for (let i = 1000; i; --i) {
      const pt1 = Random.choice(unpinned);
      const pt2 = Random.choice(unpinned);
      const [player1, team1] = pt1;
      const [player2, team2] = pt2;
      if (!Object.is(team1, team2)) {
        const ti1 = team1.id - 1;
        const ti2 = team2.id - 1;
        swap(player1, ti1, player2, ti2);

        const rangeNew = _round(this.computeAverageRatingRange(averageRatings), 100);
        if (rangeNew < range) {
          range = rangeNew;
          pt1[1] = team2;
          pt2[1] = team1;
        } else {
          swap(player1, ti2, player2, ti1);
        }
      } else {
        continue;  // Do not decrease the loop counter.
      }
    }

    for (const [player, team] of unpinned) {
      if (!team._playersPinned.has(player)) {
        team._addPlayerNoEmit(player);
      }
    }

    this._changes._emit();
    for (const team of this._teams) {
      team._changes._emit();
    }
  }

  computeAverageRatingRange(averageRatings=undefined) {
    return range(averageRatings || this._teams.map(team => team.averageRating()));
  }
}


class TeamBuilder extends Changes {

  constructor(teamBuilder, id) {
    super();
    this._id = id;
    this._teamBuilder = teamBuilder;
    this._playersPinned = new Map();
    this._captain = null;
    this._totalRating = 0;
  }

  get id() { return this._id; }
  playersPinned() { return this._playersPinned.entries(); }
  get numPlayers() { return this._playersPinned.size; }
  get captain() { return this._captain; }

  addPlayer(player) {
    const otherTeam = this._teamBuilder._playerTeams.get(player);
    this._addPlayerNoEmit(player);
    this._changes._emit();
    if (otherTeam) {
      otherTeam._changes._emit();
    }
    this._teamBuilder._changes._emit();
  }

  _addPlayerNoEmit(player) {
    this._addPlayerInternalNoEmit(player);
    const playerTeams = this._teamBuilder._playerTeams;
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
    this._teamBuilder._changes._emit();    
  }
  
  _removePlayerNoEmit(player) {
    this._removePlayerInternalNoEmit(player);
    const playerTeams = this._teamBuilder._playerTeams;
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

  isPinned(player) {
    const isPinned = this._playersPinned.get(player);
    assert (isPinned === true || isPinned === false);
    return isPinned;
  }

  pinPlayer(player) {
    assert(this._playersPinned.get(player) === false);
    this._playersPinned.set(player, true);
    this._changes._emit();
  }

  unpinPlayer(player) {
    assert(this._playersPinned.get(player));
    assert(!Object.is(player, this._captain));
    this._playersPinned.set(player, false);
    this._changes._emit();
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
  }

  get totalRating() { return this._totalRating; }
  averageRating() { return this._totalRating / this.numPlayers; }
}


function _round(f, _10_exp_num_digits) {
  return Math.round(f * _10_exp_num_digits) / _10_exp_num_digits;
}
