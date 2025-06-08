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
exports.regenerateStats = regenerateStats;
exports.recalculateTable = recalculateTable;
var shared_1 = require("@quizleague/shared");
var Storage_1 = require("../storage/Storage");
var TaskFunctions_1 = require("./TaskFunctions");
function regenerateStats(seasonId) {
    (0, TaskFunctions_1.statsRegenerate)(seasonId);
}
function recalculateTable(path) {
    return __awaiter(this, void 0, void 0, function () {
        var table, fixtureSets, fixtureLists, _i, fixtureSets_1, fixtures, _a, blankTable, recalcTable;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, Storage_1.load)((0, Storage_1.entityPath)('leaguetable', path))];
                case 1:
                    table = _b.sent();
                    return [4 /*yield*/, (0, Storage_1.list)('fixtures', (0, shared_1.parseParent)(path))];
                case 2:
                    fixtureSets = _b.sent();
                    fixtureLists = [];
                    _i = 0, fixtureSets_1 = fixtureSets;
                    _b.label = 3;
                case 3:
                    if (!(_i < fixtureSets_1.length)) return [3 /*break*/, 6];
                    fixtures = fixtureSets_1[_i];
                    _a = [__spreadArray([], fixtureLists, true)];
                    return [4 /*yield*/, (0, Storage_1.list)('fixture', fixtures.path)];
                case 4:
                    fixtureLists = __spreadArray.apply(void 0, _a.concat([(_b.sent()), true]));
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    blankTable = __assign(__assign({}, table), { rows: table.rows.map(function (row) { return (__assign(__assign({}, row), { won: 0, drawn: 0, leaguePoints: 0, matchPointsFor: 0, matchPointsAgainst: 0, played: 0 })); }) });
                    recalcTable = (0, shared_1.recalculateTables)([blankTable], fixtureLists);
                    (0, Storage_1.saveAll)(recalcTable);
                    return [2 /*return*/];
            }
        });
    });
}
