import rawScope from "./raw/scope.v1.json";
import type { ScopeDecisionRecord } from "../types/gameTypes";
import { slugify } from "../utils/slugify";

export interface ScopeHighlight extends ScopeDecisionRecord {
  id: string;
}

const scopeRecords = rawScope as ScopeDecisionRecord[];

export const scopeHighlights: ScopeHighlight[] = scopeRecords.map((record) => ({
  ...record,
  id: slugify(record.decision),
}));

export const designMeta = {
  workbookSource: "AC_cleaned_v1.xlsx",
  importantSheets: ["Scope V1", "Synergies V1", "Unites V1", "Items V1"],
};

