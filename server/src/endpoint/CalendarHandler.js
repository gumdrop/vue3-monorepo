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
exports.teamCalendar = teamCalendar;
var core_1 = require("@js-joda/core");
require("@js-joda/timezone");
var crypto_1 = require("crypto");
var Storage_1 = require("../storage/Storage");
var util_1 = require("./util");
var utc = core_1.ZoneOffset.UTC;
var local = core_1.ZoneId.of('Europe/London');
var dateFormat = core_1.DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
function teamCalendar(id) {
    return __awaiter(this, void 0, void 0, function () {
        function saveNewIcal() {
            return __awaiter(this, void 0, void 0, function () {
                var ical, _a, newid, cacheEntry;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = makeICal;
                            return [4 /*yield*/, (0, Storage_1.load)("team/".concat(id))];
                        case 1: return [4 /*yield*/, _a.apply(void 0, [_b.sent()])];
                        case 2:
                            ical = _b.sent();
                            newid = (0, crypto_1.randomUUID)();
                            cacheEntry = {
                                id: newid,
                                path: "calendarcache/".concat(id),
                                ical: ical,
                                updated: core_1.LocalDateTime.now().toString(),
                            };
                            return [4 /*yield*/, (0, Storage_1.save)(cacheEntry)];
                        case 3:
                            _b.sent();
                            return [2 /*return*/, cacheEntry.ical];
                    }
                });
            });
        }
        var dateTime, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dateTime = core_1.LocalDateTime.now().minusDays(1).toString();
                    return [4 /*yield*/, (0, Storage_1.runQuery)((0, Storage_1.collection)('calendarcache')
                            .where('id', '==', id)
                            .where('updated', '>', dateTime))];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results.length > 0 ? results[0].ical : saveNewIcal()];
            }
        });
    });
}
var toUtc = function (dateTime) {
    return core_1.ZonedDateTime.of(dateTime, local).withZoneSameInstant(utc).format(dateFormat);
};
function makeICal(team) {
    return __awaiter(this, void 0, void 0, function () {
        var header, builder, t, gap, currentSeason, teamFixtures, entries, _i, teamFixtures_1, fixture, competition, fixtures, fixtureList, _a, fixtureList_1, fix, _b, singletonComps, _c, singletonComps_1, c, _d, _e, teamFixtures_2, fixture, competition, fixtures, fixtureList, _f, _g, event_1;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    header = 'BEGIN:VCALENDAR\nVERSION:2.0\n';
                    builder = header;
                    t = team;
                    return [4 /*yield*/, (0, util_1.applicationContext)()];
                case 1:
                    gap = _h.sent();
                    return [4 /*yield*/, (0, util_1.currentSeason)()];
                case 2:
                    currentSeason = _h.sent();
                    builder += "X-WR-CALNAME:".concat(gap.leagueName, " calendar for ").concat(t.name, "\n");
                    return [4 /*yield*/, teamFixtureList(team, currentSeason)];
                case 3:
                    teamFixtures = _h.sent();
                    entries = '';
                    _i = 0, teamFixtures_1 = teamFixtures;
                    _h.label = 4;
                case 4:
                    if (!(_i < teamFixtures_1.length)) return [3 /*break*/, 9];
                    fixture = teamFixtures_1[_i];
                    competition = fixture.competition, fixtures = fixture.fixtures, fixtureList = fixture.fixtureList;
                    _a = 0, fixtureList_1 = fixtureList;
                    _h.label = 5;
                case 5:
                    if (!(_a < fixtureList_1.length)) return [3 /*break*/, 8];
                    fix = fixtureList_1[_a];
                    _b = entries;
                    return [4 /*yield*/, formatFixture(fix, fixtures, competition, "".concat(competition.name, " ").concat(fixtures.description))];
                case 6:
                    entries = _b + _h.sent();
                    _h.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8:
                    _i++;
                    return [3 /*break*/, 4];
                case 9:
                    builder += entries;
                    return [4 /*yield*/, singletonCompetitions(currentSeason)];
                case 10:
                    singletonComps = _h.sent();
                    _c = 0, singletonComps_1 = singletonComps;
                    _h.label = 11;
                case 11:
                    if (!(_c < singletonComps_1.length)) return [3 /*break*/, 14];
                    c = singletonComps_1[_c];
                    if (!c.event) return [3 /*break*/, 13];
                    _d = builder;
                    return [4 /*yield*/, formatEvent(c.event, "".concat(gap.leagueName, " ").concat(c.name))];
                case 12:
                    builder = _d + _h.sent();
                    _h.label = 13;
                case 13:
                    _c++;
                    return [3 /*break*/, 11];
                case 14:
                    for (_e = 0, teamFixtures_2 = teamFixtures; _e < teamFixtures_2.length; _e++) {
                        fixture = teamFixtures_2[_e];
                        competition = fixture.competition, fixtures = fixture.fixtures, fixtureList = fixture.fixtureList;
                        if (!fixtureList || fixtureList.length < 1) {
                            builder += formatBlankFixtures(fixtures, competition, competition.name);
                        }
                    }
                    for (_f = 0, _g = currentSeason.calendar; _f < _g.length; _f++) {
                        event_1 = _g[_f];
                        builder += formatEvent(event_1, event_1.description);
                    }
                    return [2 /*return*/, builder + 'END:VCALENDAR\n'];
            }
        });
    });
}
function formatEvent(event, text) {
    return __awaiter(this, void 0, void 0, function () {
        var now, uidPart, venue, _a, address, time, date, duration;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    now = toUtc(core_1.LocalDateTime.now());
                    uidPart = text.replace(/\s/g, '');
                    if (!event.venue) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, Storage_1.load)(event.venue)];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = undefined;
                    _b.label = 3;
                case 3:
                    venue = _a;
                    address = venue
                        ? venue.address.replace(/\n\r/g, ',').replace(/\n/g, ',').replace(/\r/g, ',')
                        : '';
                    time = core_1.LocalTime.parse(event.time, core_1.DateTimeFormatter.ISO_LOCAL_TIME);
                    date = core_1.LocalDate.parse(event.date, core_1.DateTimeFormatter.ISO_DATE);
                    duration = core_1.Duration.ofSeconds(event.duration);
                    return [2 /*return*/, "\nBEGIN:VEVENT\nDTSTAMP:".concat(now, "\nUID:").concat(event.date, ".").concat(uidPart, ".chilternquizleague.uk\nDESCRIPTION:").concat(text, "\nSUMMARY:").concat(text, "\nDTSTART:").concat(toUtc(date.atTime(time)), "\nDTEND:").concat(toUtc(date.atTime(time.plus(duration))), "\n").concat(venue ? "LOCATION:".concat(venue.name, ", ").concat(address) : '', "\nEND:VEVENT\n")];
            }
        });
    });
}
function formatFixture(fixture, fixtures, competition, description) {
    return __awaiter(this, void 0, void 0, function () {
        var home, away, venue, _a, uidPart, text, now, address, time, date;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, Storage_1.load)(fixture.home)];
                case 1:
                    home = _b.sent();
                    return [4 /*yield*/, (0, Storage_1.load)(fixture.away)];
                case 2:
                    away = _b.sent();
                    if (!fixture.venue) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, Storage_1.load)(fixture.venue)];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = undefined;
                    _b.label = 5;
                case 5:
                    venue = _a;
                    uidPart = home.shortName.replace(/\s/g, '');
                    text = "".concat(home.shortName, " - ").concat(away.shortName, " : ").concat(description);
                    now = toUtc(core_1.LocalDateTime.now());
                    address = venue
                        ? venue.address.replace(/\n\r/g, ',').replace(/\n/g, ',').replace(/\r/g, ',')
                        : '';
                    time = core_1.LocalTime.parse(fixtures.start, core_1.DateTimeFormatter.ISO_LOCAL_TIME);
                    date = core_1.LocalDate.parse(fixtures.date, core_1.DateTimeFormatter.ISO_DATE);
                    return [2 /*return*/, "\nBEGIN:VEVENT\nDTSTAMP:".concat(now, "\nUID:").concat(fixtures.date, ".").concat(uidPart, ".chilternquizleague.uk\nDESCRIPTION:").concat(text, "\nSUMMARY:").concat(text, "\nDTSTART:").concat(toUtc(date.atTime(time)), "\nDTEND:").concat(toUtc(date.atTime(time.plus(core_1.Duration.ofSeconds(competition.duration)))), "\n").concat(venue ? "LOCATION:".concat(venue.name, ", ").concat(address) : '', "\nEND:VEVENT\n")];
            }
        });
    });
}
function formatBlankFixtures(fixtures, competition, description) {
    var uidPart = (description + fixtures.description).replace(/\s/g, '');
    var now = toUtc(core_1.LocalDateTime.now());
    var time = core_1.LocalTime.parse(fixtures.start, core_1.DateTimeFormatter.ISO_LOCAL_TIME);
    var date = core_1.LocalDate.parse(fixtures.date, core_1.DateTimeFormatter.ISO_DATE);
    return "\nBEGIN:VEVENT\nDTSTAMP:".concat(now, "\nUID:").concat(fixtures.date, ".").concat(uidPart, ".chilternquizleague.uk\nDESCRIPTION:").concat(description, " ").concat(fixtures.description, "\nSUMMARY:").concat(description, " ").concat(fixtures.description, "\nDTSTART:").concat(toUtc(date.atTime(time)), "\nDTEND:").concat(toUtc(date.atTime(time.plus(core_1.Duration.ofSeconds(competition.duration)))), "\nEND:VEVENT\n");
}
function singletonCompetitions(season) {
    return __awaiter(this, void 0, void 0, function () {
        var competitions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, Storage_1.list)('competition', season.path)];
                case 1:
                    competitions = _a.sent();
                    return [2 /*return*/, competitions.filter(function (c) { return c._name === 'singleton'; })];
            }
        });
    });
}
function teamCompetitions(season) {
    return __awaiter(this, void 0, void 0, function () {
        var competitions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, Storage_1.list)('competition', season.path)];
                case 1:
                    competitions = _a.sent();
                    return [2 /*return*/, competitions.filter(function (c) { return c._name === 'league' || c._name === 'cup'; })];
            }
        });
    });
}
function teamFixtureList(team, currentSeason) {
    return __awaiter(this, void 0, void 0, function () {
        var teamFixtures, teamComps, _i, teamComps_1, competition, fixtures, _a, fixtures_1, fixs, fixtureList;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    teamFixtures = [];
                    return [4 /*yield*/, teamCompetitions(currentSeason)];
                case 1:
                    teamComps = _b.sent();
                    _i = 0, teamComps_1 = teamComps;
                    _b.label = 2;
                case 2:
                    if (!(_i < teamComps_1.length)) return [3 /*break*/, 8];
                    competition = teamComps_1[_i];
                    return [4 /*yield*/, (0, Storage_1.list)('fixtures', competition.path)];
                case 3:
                    fixtures = _b.sent();
                    _a = 0, fixtures_1 = fixtures;
                    _b.label = 4;
                case 4:
                    if (!(_a < fixtures_1.length)) return [3 /*break*/, 7];
                    fixs = fixtures_1[_a];
                    return [4 /*yield*/, (0, Storage_1.list)('fixture', fixs.path)];
                case 5:
                    fixtureList = _b.sent();
                    teamFixtures.push({ competition: competition, fixtures: fixs, fixtureList: fixtureList });
                    _b.label = 6;
                case 6:
                    _a++;
                    return [3 /*break*/, 4];
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: return [2 /*return*/, teamFixtures];
            }
        });
    });
}
