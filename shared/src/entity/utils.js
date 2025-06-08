"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLegacyRef = isLegacyRef;
exports.parseParent = parseParent;
function isLegacyRef(obj) {
    return obj !== null && typeof obj === 'object' && 'id' in obj && 'typeName' in obj && true;
}
function parseParent(key) {
    var parts = key ? key.replace(/\/$/, '').split('/') : [];
    if (parts.length > 2) {
        return parts.slice(0, parts.length - 2).join('/');
    }
    return '';
}
