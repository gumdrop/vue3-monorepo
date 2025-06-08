"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uppdateForFixture = uppdateForFixture;
exports.calculateStats = calculateStats;
var core_1 = require("@js-joda/core");
var shared_1 = require("@quizleague/shared");
var uuid_1 = require("uuid");
var Storage_1 = require("../storage/Storage");
function uppdateForFixture(fixture, season) {
    return __awaiter(this, void 0, void 0, function () {
        var fixtures, competition, tables, statistics, stats;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, Storage_1.load)((0, shared_1.parseParent)(fixture.path))];
                case 1:
                    fixtures = _a.sent();
                    return [4 /*yield*/, (0, Storage_1.load)((0, shared_1.parseParent)(fixtures.path))];
                case 2:
                    competition = _a.sent();
                    return [4 /*yield*/, (0, Storage_1.list)('leaguetable', competition.path)];
                case 3:
                    tables = _a.sent();
                    return [4 /*yield*/, seasonStats(season)];
                case 4:
                    statistics = _a.sent();
                    return [4 /*yield*/, updateStats(fixture, core_1.LocalDate.parse(fixtures.date), season, tables, statistics)];
                case 5:
                    stats = _a.sent();
                    (0, Storage_1.saveAll)(stats);
                    return [2 /*return*/];
            }
        });
    });
}
function updateStats(fixture, date, season, tables, statistics) {
    return __awaiter(this, void 0, void 0, function () {
        function find(team) {
            return __awaiter(this, void 0, void 0, function () {
                function seasonStats() {
                    return {
                        currentLeaguePosition: 0,
                        runningPointsAgainst: 0,
                        runningPointsDifference: 0,
                        runningPointsFor: 0,
                        headToHead: [],
                    };
                }
                var comp, exists, tables_2, table, id;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, leagueComp(season)];
                        case 1:
                            comp = _a.sent();
                            if (!comp) return [3 /*break*/, 3];
                            exists = cache.has(team.id);
                            if (!!exists) return [3 /*break*/, 3];
                            return [4 /*yield*/, (0, Storage_1.list)('leaguetable', comp.path)];
                        case 2:
                            tables_2 = _a.sent();
                            table = tables_2.find(function (t) { return t.rows.some(function (r) { return r.team.id === team.id; }); });
                            if (table) {
                                id = (0, uuid_1.v4)();
                                cache.set(team.id, {
                                    id: id,
                                    team: (0, Storage_1.docRef)(team),
                                    season: (0, Storage_1.docRef)(season.path),
                                    table: (0, Storage_1.docRef)(table.path),
                                    weekStats: {},
                                    path: (0, Storage_1.entityPath)('statistics', id),
                                    seasonStats: seasonStats(),
                                });
                            }
                            _a.label = 3;
                        case 3: return [2 /*return*/, cache.get(team.id)];
                    }
                });
            });
        }
        var cache, hs_1, as_1, allStats, _i, tables_1, t, _a, _b, row, _c, _d, homeStats, awayStats;
        var _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    cache = new Map(statistics.map(function (s) { return [s.team.id, s]; }));
                    if (!fixture.result) return [3 /*break*/, 9];
                    return [4 /*yield*/, find(fixture.home)];
                case 1:
                    hs_1 = _j.sent();
                    return [4 /*yield*/, find(fixture.away)];
                case 2:
                    as_1 = _j.sent();
                    allStats = [];
                    _i = 0, tables_1 = tables;
                    _j.label = 3;
                case 3:
                    if (!(_i < tables_1.length)) return [3 /*break*/, 8];
                    t = tables_1[_i];
                    _a = 0, _b = t.rows.filter(function (row) { return row.team.id != hs_1.team.id && row.team.id != as_1.team.id; });
                    _j.label = 4;
                case 4:
                    if (!(_a < _b.length)) return [3 /*break*/, 7];
                    row = _b[_a];
                    _d = (_c = allStats).push;
                    return [4 /*yield*/, find(row.team)];
                case 5:
                    _d.apply(_c, [_j.sent()]);
                    _j.label = 6;
                case 6:
                    _a++;
                    return [3 /*break*/, 4];
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8:
                    homeStats = addToHeadToHead(addWeekStats(hs_1, date, (_e = fixture.result) === null || _e === void 0 ? void 0 : _e.homeScore, (_f = fixture.result) === null || _f === void 0 ? void 0 : _f.awayScore), fixture);
                    awayStats = addToHeadToHead(addWeekStats(as_1, date, (_g = fixture.result) === null || _g === void 0 ? void 0 : _g.awayScore, (_h = fixture.result) === null || _h === void 0 ? void 0 : _h.homeScore), fixture);
                    return [2 /*return*/, __spreadArray([homeStats, awayStats], allStats, true)];
                case 9: return [2 /*return*/, statistics];
            }
        });
    });
}
function addWeekStats(stats, date, pointsFor, pointsAgainst) {
    var newStats = {
        date: date,
        pointsFor: pointsFor,
        pointsAgainst: pointsAgainst,
        pointsDifference: pointsFor - pointsAgainst,
        cumuPointsAgainst: 0,
        cumuPointsDifference: 0,
        cumuPointsFor: 0,
        leaguePosition: 0,
        ignorable: false,
    };
    return updateFromCurrent(stats, newStats, pointsFor, pointsAgainst);
}
function updateFromCurrent(statistics, stats, pointsFor, pointsAgainst) {
    var _a;
    var seasonStats = statistics.seasonStats;
    var week = __assign(__assign({}, stats), { cumuPointsFor: seasonStats.runningPointsFor + pointsFor, cumuPointsAgainst: seasonStats.runningPointsAgainst + pointsAgainst, cumuPointsDifference: seasonStats.runningPointsDifference + stats.pointsDifference });
    var season = __assign(__assign({}, seasonStats), { runningPointsFor: week.cumuPointsFor, runningPointsAgainst: week.cumuPointsAgainst, runningPointsDifference: week.cumuPointsDifference });
    return __assign(__assign({}, statistics), { seasonStats: season, weekStats: __assign(__assign({}, statistics.weekStats), (_a = {}, _a[week.date.toString()] = week, _a)) });
}
function addToHeadToHead(statistics, fixture) {
    if (fixture.result) {
        var r_1 = fixture.result;
        var otherTeam_1 = [fixture.home, fixture.away].filter(function (f) { return f.id !== statistics.team.id; })[0];
        function getWLD() {
            var normalisedScores = fixture.home.id === otherTeam_1.id ? [r_1.awayScore, r_1.homeScore] : [r_1.homeScore, r_1.awayScore];
            var win = normalisedScores[0] > normalisedScores[1] ? 1 : 0;
            var draw = normalisedScores[0] === normalisedScores[1] ? 1 : 0;
            var lose = (win + draw - 1) * -1;
            return { win: win, lose: lose, draw: draw };
        }
        var wld = getWLD();
        var headToHead = {
            team: (0, Storage_1.docRef)(otherTeam_1),
            win: wld.win,
            lose: wld.lose,
            draw: wld.draw,
        };
        var existing = statistics.seasonStats.headToHead.find(function (s) { return s.team.id === otherTeam_1.id; });
        var combined = !existing
            ? headToHead
            : {
                team: existing.team,
                win: headToHead.win + existing.win,
                lose: headToHead.lose + existing.lose,
                draw: headToHead.draw + existing.draw,
            };
        statistics.seasonStats.headToHead = __spreadArray(__spreadArray([], statistics.seasonStats.headToHead.filter(function (h) { return h.team.id !== otherTeam_1.id; }), true), [
            combined,
        ], false);
    }
    return statistics;
}
function leagueComp(season) {
    return __awaiter(this, void 0, void 0, function () {
        var comps;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, Storage_1.list)('competition', season.path)];
                case 1:
                    comps = _a.sent();
                    return [2 /*return*/, comps.find(function (c) { return c._name === 'league'; })];
            }
        });
    });
}
function seasonStats(season) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, Storage_1.list)('statistics')];
                case 1: return [2 /*return*/, (_a.sent()).filter(function (stats) { return stats.season.id === season.id; })];
            }
        });
    });
}
function calculateStats(season) {
    return __awaiter(this, void 0, void 0, function () {
        var ss, seasonStats, c, tables, dummyTables, startingStats, fixtures, _i, fixtures_1, f, fixtureList, _a, fixtureList_1, r;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, Storage_1.list)('season')];
                case 1:
                    ss = _b.sent();
                    seasonStats = ss.filter(function (s) { return s.season.id === season.id; });
                    return [4 /*yield*/, (0, Storage_1.deleteAll)(seasonStats)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, leagueComp(season)];
                case 3:
                    c = _b.sent();
                    return [4 /*yield*/, (0, Storage_1.list)('leaguetable', c === null || c === void 0 ? void 0 : c.path)];
                case 4:
                    tables = _b.sent();
                    dummyTables = tables.map(function (t) { return (__assign(__assign({}, t), { rows: t.rows.map(function (r) { return (__assign(__assign({}, r), { drawn: 0, leaguePoints: 0, lost: 0, matchPointsAgainst: 0, matchPointsFor: 0, played: 0, won: 0, position: '' })); }) })); });
                    startingStats = [];
                    return [4 /*yield*/, (0, Storage_1.list)('fixtures', c === null || c === void 0 ? void 0 : c.path)];
                case 5:
                    fixtures = (_b.sent()).sort(function (a, b) {
                        return a.date.localeCompare(b.date);
                    });
                    _i = 0, fixtures_1 = fixtures;
                    _b.label = 6;
                case 6:
                    if (!(_i < fixtures_1.length)) return [3 /*break*/, 13];
                    f = fixtures_1[_i];
                    return [4 /*yield*/, (0, Storage_1.list)('fixture', f.path)];
                case 7:
                    fixtureList = _b.sent();
                    _a = 0, fixtureList_1 = fixtureList;
                    _b.label = 8;
                case 8:
                    if (!(_a < fixtureList_1.length)) return [3 /*break*/, 11];
                    r = fixtureList_1[_a];
                    dummyTables = (0, shared_1.recalculateTables)(dummyTables, [r]);
                    return [4 /*yield*/, updateStats(r, core_1.LocalDate.parse(f.date), season, dummyTables, startingStats)];
                case 9:
                    startingStats = _b.sent();
                    _b.label = 10;
                case 10:
                    _a++;
                    return [3 /*break*/, 8];
                case 11:
                    (0, Storage_1.saveAll)(startingStats);
                    _b.label = 12;
                case 12:
                    _i++;
                    return [3 /*break*/, 6];
                case 13: return [2 /*return*/];
            }
        });
    });
}
