"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.designMeta = exports.scopeHighlights = void 0;
const scope_v1_json_1 = __importDefault(require("./raw/scope.v1.json"));
const slugify_1 = require("../utils/slugify");
const scopeRecords = scope_v1_json_1.default;
exports.scopeHighlights = scopeRecords.map((record) => ({
    ...record,
    id: (0, slugify_1.slugify)(record.decision),
}));
exports.designMeta = {
    workbookSource: "AC_cleaned_v1.xlsx",
    importantSheets: ["Scope V1", "Synergies V1", "Unites V1", "Items V1"],
};
