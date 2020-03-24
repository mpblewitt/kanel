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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var _a = require('ramda'), forEach = _a.forEach, map = _a.map, filter = _a.filter, reject = _a.reject, propEq = _a.propEq, uniq = _a.uniq;
var generateFile_1 = __importDefault(require("./generateFile"));
var generateInterface_1 = __importDefault(require("./generateInterface"));
/**
 * @typedef { import('extract-pg-schema').Table } Table
 * @typedef { import('extract-pg-schema').Type } Type
 */
/**
 * @param {Table} tableOrView
 */
var generateModelFile = function (tableOrView, isView, typeMap, userTypes, modelDir, pc, cc, fc) {
    var lines = [];
    var comment = tableOrView.comment, tags = tableOrView.tags;
    var generateInitializer = !tags['fixed'] && !isView;
    var referencedIdTypes = uniq(map(function (p) { return p.parent.split('.')[0]; }, filter(function (p) { return !!p.parent; }, tableOrView.columns)));
    forEach(function (referencedIdType) {
        lines.push("import { " + pc(referencedIdType) + "Id } from './" + fc(referencedIdType) + "';");
    }, referencedIdTypes);
    if (referencedIdTypes.length) {
        lines.push('');
    }
    var appliedUserTypes = map(function (p) { return p.type; }, filter(function (p) { return userTypes.indexOf(p.type) !== -1; }, tableOrView.columns));
    forEach(function (importedType) {
        lines.push("import " + pc(importedType) + " from './" + fc(importedType) + "';");
    }, appliedUserTypes);
    if (appliedUserTypes.length) {
        lines.push('');
    }
    var overriddenTypes = map(function (p) { return p.tags.type; }, filter(function (p) { return !!p.tags.type; }, tableOrView.columns));
    forEach(function (importedType) {
        lines.push("import " + pc(importedType) + " from '../" + fc(importedType) + "';");
    }, overriddenTypes);
    if (overriddenTypes.length) {
        lines.push('');
    }
    // If there's one and only one primary key, that's the identifier.
    var hasIdentifier = filter(function (c) { return c.isPrimary; }, tableOrView.columns).length === 1;
    var columns = map(function (c) { return (__assign(__assign({}, c), { isIdentifier: hasIdentifier && c.isPrimary })); }, tableOrView.columns);
    if (hasIdentifier) {
        lines.push("export type " + pc(tableOrView.name) + "Id = number & { __flavor?: '" + tableOrView.name + "' };");
        lines.push('');
    }
    var interfaceLines = generateInterface_1.default({
        name: tableOrView.name,
        properties: columns,
        considerDefaultValues: false,
        comment: comment,
        exportAs: 'default',
    }, typeMap, pc, cc);
    lines.push.apply(lines, interfaceLines);
    if (generateInitializer) {
        lines.push('');
        var initializerInterfaceLines = generateInterface_1.default({
            name: pc(tableOrView.name) + "Initializer",
            modelName: tableOrView.name,
            properties: reject(propEq('name', 'createdAt'), columns),
            considerDefaultValues: true,
            comment: comment,
            exportAs: true,
        }, typeMap, pc, cc);
        lines.push.apply(lines, initializerInterfaceLines);
    }
    var filename = fc(tableOrView.name) + ".ts";
    var fullPath = path_1.default.join(modelDir, filename);
    generateFile_1.default({ fullPath: fullPath, lines: lines });
};
exports.default = generateModelFile;