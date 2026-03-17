export type Id = string;
export type UnitId = Id;
export type UnitInstanceId = Id;
export type SynergyId = Id;
export type ItemId = Id;
export type PlayerId = Id;

export type UnitCost = 1 | 2 | 3 | 4 | 5;
export type UnitStarLevel = 1 | 2 | 3;
export type PlayerKind = "human" | "bot" | "neutral";
export type GamePhase = "bootstrap" | "prep" | "combat" | "resolution" | "gameOver";
export type RoundKind = "pve" | "pvp" | "boss";
export type BoardShape = "square" | "hex";
export type BoardSide = "home" | "away";
export type SynergyKind = "family" | "trait";
export type ItemKind = "component" | "complete";
export type ItemPriority = "high" | "medium" | "low";
export type RoleArchetype =
  | "tank"
  | "bruiser"
  | "assassin"
  | "support"
  | "caster"
  | "marksman"
  | "hybrid";
export type TargetingRule =
  | "nearest"
  | "team-focus"
  | "lowest-health"
  | "largest-cluster"
  | "highest-mana-backline"
  | "nearest-backline"
  | "frontline-cluster"
  | "custom";
export type AbilityVisualStyle = "projectile" | "pulse" | "charge" | "buff" | "summon" | "zone";
export type StatKey =
  | "health"
  | "attackDamage"
  | "abilityPower"
  | "armor"
  | "magicResist"
  | "attackSpeed"
  | "critChance"
  | "startingMana"
  | "moveSpeed"
  | "range";
export type StatModifierMode = "flat" | "percent";
export type CombatEventKind =
  | "attack"
  | "cast"
  | "move"
  | "death"
  | "status"
  | "heal"
  | "spawn"
  | "round-end";
export type CombatStatusKind =
  | "stun"
  | "slow"
  | "poison"
  | "shield"
  | "attack-speed"
  | "damage-amp"
  | "regen"
  | "anti-heal";
export type LogTone = "info" | "success" | "warning" | "combat";

export interface ScriptBinding {
  key: string;
  description: string;
  params?: Record<string, number | string | boolean>;
}

export interface StatModifier {
  stat: StatKey;
  mode: StatModifierMode;
  value: number;
  sourceText: string;
}

export interface ScopeDecisionRecord {
  decision: string;
  selectedValue: string;
  reason: string;
}

export interface RawSynergySheetRow {
  type: string;
  name: string;
  tiers: string;
  tier1Effect: string;
  tier2Effect: string;
  tier3Effect: string;
  gameplayIdentity: string;
  status: string;
}

export interface RawUnitSheetRow {
  unit: string;
  cost: string;
  family: string;
  trait1: string;
  trait2: string;
  role: string;
  range: string;
  maxMana: string;
  targeting: string;
  spell: string;
  shortDescription: string;
}

export interface RawItemSheetRow {
  component: string;
  baseStat: string;
  notes: string;
  component1: string;
  component2: string;
  item: string;
  stats: string;
  simpleEffect: string;
  priority: string;
}

export interface UnitStats {
  maxHealth: number;
  attackDamage: number;
  abilityPower: number;
  armor: number;
  magicResist: number;
  attackSpeed: number;
  moveSpeed: number;
  critChance: number;
  manaGainPerAttack: number;
}

export interface ResolvedUnitStats extends UnitStats {
  range: number;
  maxMana: number;
  startingMana: number;
  critDamage: number;
}

export interface UnitAbilityTemplate {
  id: Id;
  name: string;
  manaCost: number;
  targeting: TargetingRule;
  description: string;
  script: ScriptBinding;
  visualStyle: AbilityVisualStyle;
}

export interface UnitPresentation {
  silhouetteKey: string;
  accentColor: string;
  iconText: string;
}

export interface UnitTemplate {
  id: UnitId;
  name: string;
  cost: UnitCost;
  familyId: SynergyId;
  traitIds: SynergyId[];
  familyLabel: string;
  traitLabels: string[];
  roleLabel: string;
  roleArchetype: RoleArchetype;
  range: number;
  maxMana: number;
  targetingLabel: string;
  ability: UnitAbilityTemplate;
  baseStats: UnitStats;
  ui: UnitPresentation;
}

export interface SynergyBreakpoint {
  tier: number;
  description: string;
  script: ScriptBinding;
}

export interface SynergyTemplate {
  id: SynergyId;
  name: string;
  kind: SynergyKind;
  gameplayIdentity: string;
  isEnabled: boolean;
  breakpoints: SynergyBreakpoint[];
  ui: {
    accentColor: string;
    iconText: string;
  };
}

export interface ItemComponentTemplate {
  id: ItemId;
  kind: "component";
  name: string;
  baseStat: string;
  notes: string;
  bonuses: StatModifier[];
}

export interface ItemRecipeTemplate {
  id: ItemId;
  kind: "complete";
  name: string;
  recipe: [ItemId, ItemId];
  statLine: string;
  effectDescription: string;
  priority: ItemPriority;
  bonuses: StatModifier[];
}

export type ItemTemplate = ItemComponentTemplate | ItemRecipeTemplate;

export interface BoardDefinition {
  shape: BoardShape;
  columns: number;
  homeRows: number;
  awayRows: number;
  benchSlots: number;
}

export interface PlayerBoardPosition {
  row: number;
  column: number;
}

export interface BoardPosition extends PlayerBoardPosition {
  side: BoardSide;
}

export interface BoardCellState extends PlayerBoardPosition {
  unitInstanceId: UnitInstanceId | null;
}

export interface StatusEffectState {
  id: Id;
  name: string;
  durationMs: number;
  stacks: number;
}

export interface UnitInstance {
  id: UnitInstanceId;
  templateId: UnitId;
  ownerId: PlayerId;
  starLevel: UnitStarLevel;
  currentHealth: number;
  currentMana: number;
  items: ItemId[];
  position: BoardPosition | null;
  statusEffects: StatusEffectState[];
}

export interface BenchSlotState {
  slotIndex: number;
  unitInstanceId: UnitInstanceId | null;
}

export interface ShopOffer {
  slotIndex: number;
  unitId: UnitId;
  cost: UnitCost;
  isLocked: boolean;
  oddsBucket: UnitCost;
}

export interface ShopState {
  offers: ShopOffer[];
  isLocked: boolean;
  rerollCost: number;
  xpCost: number;
  xpPerPurchase: number;
}

export interface EconomyState {
  gold: number;
  interestCap: number;
  winStreak: number;
  lossStreak: number;
}

export interface ExperienceState {
  level: number;
  currentXp: number;
  xpToNext: number;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  kind: PlayerKind;
  avatar: string;
  health: number;
  economy: EconomyState;
  experience: ExperienceState;
  bench: BenchSlotState[];
  boardSlots: BoardCellState[];
  shop: ShopState;
  itemInventory: ItemId[];
  rosterUnitIds: UnitInstanceId[];
  isEliminated: boolean;
  focusSynergyId: SynergyId | null;
}

export interface HoverStatsSnapshot {
  maxHealth: number;
  maxMana: number;
  startingMana: number;
  attackDamage: number;
  abilityPower: number;
  armor: number;
  magicResist: number;
  attackSpeed: number;
  critChance: number;
  moveSpeed: number;
  range: number;
}

export interface AbilityTierPreview {
  starLevel: UnitStarLevel;
  lines: string[];
}

export interface AbilityHoverSnapshot {
  name: string;
  description: string;
  manaCost: number;
  targetingLabel: string;
  tiers: AbilityTierPreview[];
}

export interface BotSummary {
  id: PlayerId;
  name: string;
  health: number;
  level: number;
  gold: number;
  identity: string;
}

export interface ActiveSynergyState {
  synergyId: SynergyId;
  name: string;
  kind: SynergyKind;
  count: number;
  activeTier: number | null;
  nextTier: number | null;
  description: string;
}

export interface MatchupState {
  homePlayerId: PlayerId;
  awayPlayerId: PlayerId;
  awayLabel: string;
  kind: RoundKind;
}

export interface RoundState {
  index: number;
  stageLabel: string;
  kind: RoundKind;
  phaseTurn: number;
  enemyLabel: string;
  currentOpponentId: PlayerId;
  rewardGold: number;
  damageBase: number;
}

export interface MessageLogEntry {
  id: Id;
  tone: LogTone;
  text: string;
}

export interface CombatEvent {
  id: Id;
  kind: CombatEventKind;
  sourceUnitId?: UnitInstanceId;
  targetUnitId?: UnitInstanceId;
  description: string;
  timestampMs: number;
}

export interface CombatStatusEffect {
  id: Id;
  name: string;
  kind: CombatStatusKind;
  durationMs: number;
  remainingMs: number;
  stacks: number;
  value: number;
  sourceUnitId?: UnitInstanceId;
  tickRateMs?: number;
  tickTimerMs?: number;
}

export interface CombatUnitState {
  id: UnitInstanceId;
  instanceId: UnitInstanceId;
  templateId: UnitId;
  ownerId: PlayerId;
  displayName: string;
  familyId: SynergyId;
  traitIds: SynergyId[];
  side: BoardSide;
  starLevel: UnitStarLevel;
  position: BoardPosition;
  stats: ResolvedUnitStats;
  health: number;
  mana: number;
  shield: number;
  alive: boolean;
  targetId: UnitInstanceId | null;
  attackTimerMs: number;
  moveTimerMs: number;
  hasMovedSinceAttack: boolean;
  firstAttackDone: boolean;
  statuses: CombatStatusEffect[];
  items: ItemId[];
  attacksMade: number;
  kills: number;
  castsMade: number;
  isSummon: boolean;
  summonValue: number;
  hasRevived: boolean;
}

export interface CombatSnapshot {
  elapsedMs: number;
  winner: BoardSide | "pending" | "draw";
  events: CombatEvent[];
}

export interface CombatState extends CombatSnapshot {
  isFinished: boolean;
  units: CombatUnitState[];
  matchup: MatchupState;
  damageToHome: number;
  damageToAway: number;
}

export interface GameState {
  phase: GamePhase;
  board: BoardDefinition;
  round: RoundState;
  humanPlayerId: PlayerId;
  neutralPlayerId: PlayerId;
  playerOrder: PlayerId[];
  players: Record<PlayerId, PlayerState>;
  unitsById: Record<UnitInstanceId, UnitInstance>;
  activeSynergiesByPlayer: Record<PlayerId, ActiveSynergyState[]>;
  matchup: MatchupState | null;
  combat: CombatState | null;
  log: MessageLogEntry[];
  winnerId: PlayerId | null;
  nextUnitInstanceNumber: number;
}

export interface ShopOddsRow {
  level: number;
  odds: Record<UnitCost, number>;
}

export interface LevelProgressionRow {
  level: number;
  xpToNext: number;
  maxUnits: number;
}

export interface TargetingRequest {
  source: CombatUnitState;
  allies: CombatUnitState[];
  enemies: CombatUnitState[];
  rule: TargetingRule;
}

export interface MovementInstruction {
  unitId: UnitInstanceId;
  from: BoardPosition;
  to: BoardPosition;
  reason: string;
}

export type PlacementDestination =
  | {
      type: "board";
      row: number;
      column: number;
    }
  | {
      type: "bench";
      slotIndex: number;
    };
