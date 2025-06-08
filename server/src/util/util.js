"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
function log(obj, message) {
    console.log("".concat(message, "\n").concat(JSON.stringify(obj)));
    return obj;
}
