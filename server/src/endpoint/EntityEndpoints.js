"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = configure;
var util_1 = require("./util");
var EntityFunctions_1 = require("./EntityFunctions");
var root = '/rest/entity';
function configure(app) {
    app
        .post("".concat(root, "/regenerate-stats/:seasonId"), regenStats)
        .post("".concat(root, "/recalculate-table"), recalcTable);
}
function regenStats(req, res) {
    return (0, util_1.send)((0, EntityFunctions_1.regenerateStats)((0, util_1.param)('seasonId', req)), res);
}
function recalcTable(req, res) {
    return (0, util_1.send)((0, EntityFunctions_1.recalculateTable)(req.body.toString()), res);
}
