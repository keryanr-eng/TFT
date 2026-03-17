import rawScope from "./raw/scope.v1.json";
import { slugify } from "../utils/slugify";
const scopeRecords = rawScope;
export const scopeHighlights = scopeRecords.map((record) => ({
    ...record,
    id: slugify(record.decision),
}));
export const designMeta = {
    workbookSource: "AC_cleaned_v1.xlsx",
    importantSheets: ["Scope V1", "Synergies V1", "Unites V1", "Items V1"],
};
