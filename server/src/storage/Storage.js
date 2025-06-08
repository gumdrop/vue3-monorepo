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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.entityPath = void 0;
exports.save = save;
exports.saveAll = saveAll;
exports.load = load;
exports.docRef = docRef;
exports.docRefById = docRefById;
exports.collection = collection;
exports.list = list;
exports.runQuery = runQuery;
exports.delete1 = delete1;
exports.deleteAll = deleteAll;
var firestore_1 = require("@google-cloud/firestore");
var shared_1 = require("@quizleague/shared");
var __1 = require("..");
var GenericConverter_1 = require("./GenericConverter");
var lodash_1 = __importDefault(require("lodash"));
var _db;
var db = function () {
    if (!_db) {
        _db = new firestore_1.Firestore();
        if ((0, __1.isLocal)()) {
            _db.settings({ host: (0, __1.emulatorAddr)(), ssl: false });
        }
    }
    return _db;
};
exports.db = db;
var _converter = new GenericConverter_1.GenericConverter();
function converter() {
    return _converter;
}
function save(entity) {
    return __awaiter(this, void 0, void 0, function () {
        var ref;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ref = docRef(entity.path).withConverter(converter());
                    return [4 /*yield*/, ref.set(entity)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, ref];
            }
        });
    });
}
function saveAll(entities) {
    return __awaiter(this, void 0, void 0, function () {
        var batchSets, _i, batchSets_1, set, batch, _a, set_1, obj;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    batchSets = lodash_1.default.chunk(entities, 400);
                    _i = 0, batchSets_1 = batchSets;
                    _b.label = 1;
                case 1:
                    if (!(_i < batchSets_1.length)) return [3 /*break*/, 4];
                    set = batchSets_1[_i];
                    batch = db().batch();
                    for (_a = 0, set_1 = set; _a < set_1.length; _a++) {
                        obj = set_1[_a];
                        batch.set(docRef(obj.path), obj);
                    }
                    return [4 /*yield*/, batch.commit()];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getData(doc) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, doc.withConverter(converter()).get()];
                case 1: return [2 /*return*/, (_a.sent()).data()];
            }
        });
    });
}
function load(pathish) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, getData(docRef(pathish))];
        });
    });
}
function docRef(pathish) {
    return db().doc((0, shared_1.toPath)(pathish)).withConverter(converter());
}
var entityPath = function (path, id) { return "".concat(path, "/").concat(id); };
exports.entityPath = entityPath;
function docRefById(path, id) {
    return docRef((0, exports.entityPath)(path, id));
}
function collection(entityType, parent) {
    return db().collection((0, shared_1.toPath)(entityType, parent)).withConverter(converter());
}
function list(entityType, parent) {
    return runQuery(collection(entityType, parent));
}
function runQuery(query) {
    return __awaiter(this, void 0, void 0, function () {
        var docs, retval, _i, docs_1, doc, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, query.get()];
                case 1:
                    docs = (_c.sent()).docs;
                    retval = [];
                    _i = 0, docs_1 = docs;
                    _c.label = 2;
                case 2:
                    if (!(_i < docs_1.length)) return [3 /*break*/, 5];
                    doc = docs_1[_i];
                    _b = (_a = retval).push;
                    return [4 /*yield*/, getData(doc.ref)];
                case 3:
                    _b.apply(_a, [_c.sent()]);
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, retval];
            }
        });
    });
}
function delete1(entity) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            deleteAll([entity]);
            return [2 /*return*/];
        });
    });
}
function deleteAll(entities) {
    return __awaiter(this, void 0, void 0, function () {
        var batchSets, _i, batchSets_2, set, batch, _a, set_2, obj;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    batchSets = lodash_1.default.chunk(entities, 400);
                    _i = 0, batchSets_2 = batchSets;
                    _b.label = 1;
                case 1:
                    if (!(_i < batchSets_2.length)) return [3 /*break*/, 4];
                    set = batchSets_2[_i];
                    batch = db().batch();
                    for (_a = 0, set_2 = set; _a < set_2.length; _a++) {
                        obj = set_2[_a];
                        batch.delete(docRef(obj.path));
                    }
                    return [4 /*yield*/, batch.commit()];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
