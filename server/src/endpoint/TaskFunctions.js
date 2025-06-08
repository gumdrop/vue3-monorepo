"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultSubmission = resultSubmission;
exports.statsRegenerate = statsRegenerate;
var shared_1 = require("@quizleague/shared");
var uuid_1 = require("uuid");
var Storage_1 = require("../storage/Storage");
var util_1 = require("./util");
var StatisticsUtils_1 = require("./StatisticsUtils");
function resultSubmission(result) {
    return __awaiter(this, void 0, void 0, function () {
        function haveResults() {
            return __awaiter(this, void 0, void 0, function () {
                var fixturesExist, _i, _a, fixture, f;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            fixturesExist = true;
                            _i = 0, _a = result.fixtures;
                            _b.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3 /*break*/, 4];
                            fixture = _a[_i];
                            return [4 /*yield*/, (0, Storage_1.load)(fixture.fixturePath)];
                        case 2:
                            f = _b.sent();
                            fixturesExist = fixturesExist && f !== null && f !== undefined;
                            _b.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/, fixturesExist];
                    }
                });
            });
        }
        function saveFixture(user, reportText, result) {
            return __awaiter(this, void 0, void 0, function () {
                function newText(reportText) {
                    return __awaiter(this, void 0, void 0, function () {
                        var id, text;
                        return __generator(this, function (_a) {
                            id = (0, uuid_1.v4)();
                            text = {
                                id: id,
                                text: reportText,
                                mimeType: 'text/markdown',
                                path: (0, Storage_1.entityPath)('text', id),
                            };
                            return [2 /*return*/, (0, Storage_1.save)(text)];
                        });
                    });
                }
                function newResult() {
                    return { homeScore: result.homeScore, awayScore: result.awayScore, submitter: (0, Storage_1.docRef)(user) };
                }
                function newReport(reportText) {
                    return __awaiter(this, void 0, void 0, function () {
                        var team, id;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, teamFromUser(user)];
                                case 1:
                                    team = _b.sent();
                                    id = (0, uuid_1.v4)();
                                    _a = {
                                        id: id,
                                        team: (0, Storage_1.docRef)(team)
                                    };
                                    return [4 /*yield*/, newText(reportText)];
                                case 2: return [2 /*return*/, (_a.text = _b.sent(),
                                        _a.path = "".concat(fixture.path, "/report/").concat(id),
                                        _a)];
                            }
                        });
                    });
                }
                function teamFromUser(user) {
                    return __awaiter(this, void 0, void 0, function () {
                        var teams, team;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, Storage_1.list)('team')];
                                case 1:
                                    teams = _a.sent();
                                    team = teams.filter(function (t) { return t.users.some(function (u) { return u.id == user.id; }); })[0];
                                    return [2 /*return*/, team];
                            }
                        });
                    });
                }
                var fixture, isSubsidiary, report, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, (0, Storage_1.load)(result.fixturePath)];
                        case 1:
                            fixture = _b.sent();
                            return [4 /*yield*/, subsidiary(fixture)];
                        case 2:
                            isSubsidiary = _b.sent();
                            report = isSubsidiary ? undefined : reportText && reportText.trim();
                            if (!fixture.result) {
                                fixture.result = newResult();
                            }
                            if (!report) return [3 /*break*/, 5];
                            _a = Storage_1.save;
                            return [4 /*yield*/, newReport(report)];
                        case 3: return [4 /*yield*/, _a.apply(void 0, [_b.sent()])];
                        case 4:
                            _b.sent();
                            _b.label = 5;
                        case 5: return [4 /*yield*/, (0, Storage_1.save)(fixture)];
                        case 6: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        }
        function subsidiary(fixture) {
            return __awaiter(this, void 0, void 0, function () {
                var path, competition;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            path = (0, shared_1.parseParent)((0, shared_1.parseParent)(fixture.path));
                            return [4 /*yield*/, (0, Storage_1.load)(path)];
                        case 1:
                            competition = _a.sent();
                            return [2 /*return*/, competition._name === 'subsidiary'];
                    }
                });
            });
        }
        function tables(fixture) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, Storage_1.list)('leaguetable', (0, shared_1.parseParent)((0, shared_1.parseParent)(fixture.path)))];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        }
        function updateTables(tables, fixture) {
            return __awaiter(this, void 0, void 0, function () {
                var newTables;
                return __generator(this, function (_a) {
                    newTables = (0, shared_1.recalculateTables)(tables, [fixture]);
                    (0, Storage_1.saveAll)(newTables);
                    return [2 /*return*/];
                });
            });
        }
        function fireStatsUpdate(fixture) {
            return __awaiter(this, void 0, void 0, function () {
                var season;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, util_1.currentSeason)()];
                        case 1:
                            season = _a.sent();
                            queueMicrotask(function () { return statsUpdate(season.id, [fixture]); });
                            return [2 /*return*/];
                    }
                });
            });
        }
        function statsUpdate(seasonId, fixtures) {
            return __awaiter(this, void 0, void 0, function () {
                var season;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, Storage_1.load)((0, Storage_1.entityPath)('season', seasonId))];
                        case 1:
                            season = _a.sent();
                            fixtures.forEach(function (f) { return (0, StatisticsUtils_1.uppdateForFixture)(f, season); });
                            return [2 /*return*/];
                    }
                });
            });
        }
        var hasResults, user, _i, _a, fixture, _b, _c, f, fixture, isSubsidiary, leagueTables;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, haveResults()];
                case 1:
                    hasResults = _d.sent();
                    return [4 /*yield*/, (0, Storage_1.load)((0, Storage_1.entityPath)('user', result.userID))];
                case 2:
                    user = _d.sent();
                    _i = 0, _a = result.fixtures;
                    _d.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    fixture = _a[_i];
                    return [4 /*yield*/, saveFixture(user, result.reportText, fixture)];
                case 4:
                    _d.sent();
                    _d.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    _b = 0, _c = result.fixtures;
                    _d.label = 7;
                case 7:
                    if (!(_b < _c.length)) return [3 /*break*/, 15];
                    f = _c[_b];
                    return [4 /*yield*/, (0, Storage_1.load)(f.fixturePath)];
                case 8:
                    fixture = _d.sent();
                    if (!!hasResults) return [3 /*break*/, 14];
                    return [4 /*yield*/, subsidiary(fixture)];
                case 9:
                    isSubsidiary = _d.sent();
                    return [4 /*yield*/, tables(fixture)];
                case 10:
                    leagueTables = _d.sent();
                    if (!(leagueTables.length > 0)) return [3 /*break*/, 13];
                    return [4 /*yield*/, updateTables(leagueTables, fixture)];
                case 11:
                    _d.sent();
                    if (!!isSubsidiary) return [3 /*break*/, 13];
                    return [4 /*yield*/, fireStatsUpdate(fixture)];
                case 12:
                    _d.sent();
                    _d.label = 13;
                case 13:
                    if (!isSubsidiary) {
                        // await fireNotifications(fixture)
                    }
                    _d.label = 14;
                case 14:
                    _b++;
                    return [3 /*break*/, 7];
                case 15: return [2 /*return*/];
            }
        });
    });
}
function statsRegenerate(seasonId) {
    return __awaiter(this, void 0, void 0, function () {
        var season;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, Storage_1.load)((0, Storage_1.entityPath)('season', seasonId))];
                case 1:
                    season = _a.sent();
                    queueMicrotask(function () { return (0, StatisticsUtils_1.calculateStats)(season); });
                    return [2 /*return*/];
            }
        });
    });
}
