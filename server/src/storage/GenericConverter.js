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
exports.GenericConverter = void 0;
var shared_1 = require("@quizleague/shared");
var Storage_1 = require("./Storage");
var GenericConverter = /** @class */ (function () {
    function GenericConverter() {
    }
    GenericConverter.prototype.toFirestore = function (modelObject) {
        var copy = __assign({}, modelObject);
        delete copy.path;
        delete copy.key;
        return copy;
    };
    GenericConverter.prototype.fromFirestore = function (snapshot) {
        var _this = this;
        var data = snapshot.data();
        var path = snapshot.ref.path;
        var convert = function (object) {
            var copy = (0, shared_1.factorForLegacyCompetition)(__assign({}, object));
            for (var _i = 0, _a = Object.entries(object); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], val = _b[1];
                var value = val;
                if (value) {
                    if ((0, shared_1.isLegacyRef)(value)) {
                        copy[key] = makeDocumentRef(value, _this);
                    }
                    else if (Array.isArray(value)) {
                        copy[key] = __spreadArray([], value, true).map(function (item) { return convert(item); });
                    }
                    else if (typeof value === 'object') {
                        copy[key] = convert(value);
                    }
                }
            }
            return copy;
        };
        return __assign(__assign({}, convert(data)), { path: path });
    };
    return GenericConverter;
}());
exports.GenericConverter = GenericConverter;
function makeDocumentRef(value, converter) {
    if (!value)
        return null;
    var pathFromRef = function (ref) {
        var key = ref.key;
        var parentKey = key !== undefined && key !== null ? key.parentKey : undefined;
        var parent = parentKey ? "".concat(parentKey, "/") : '';
        return "".concat(parent).concat(ref.typeName, "/").concat(ref.id);
    };
    return 'id' in value && 'typeName' in value
        ? (0, Storage_1.db)().doc(pathFromRef(value)).withConverter(converter)
        : value.withConverter(converter);
}
