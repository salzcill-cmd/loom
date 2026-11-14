/**
 * Universal Model IR.
 *
 * One normalized, serializable description of a model. Every engine reads its
 * own metadata group from here; none of them writes back. The IR carries no
 * functions and survives a JSON round trip, with unknown properties preserved
 * so newer metadata does not break older readers.
 */

/** The IR shape version carried by every {@link ModelIR}. */
export const MODEL_IR_VERSION = 1;

/**
 * Logical field types. The set matches the widget set the form engine can
 * render; a logical type maps to dialect column types through a data table in
 * the database layer, never through inline branches.
 */
export type LogicalType =
  | "string"
  | "text"
  | "integer"
  | "decimal"
  | "money"
  | "boolean"
  | "date"
  | "timestamp"
  | "enum"
  | "uuid"
  | "json"
  | "file"
  | "image"
  | "relation";

/** Direction of a relation between two models. */
export type RelationKind = "belongsTo" | "hasOne" | "hasMany";

/** Database metadata for one field. */
export interface DbFieldMetadata {
  /** Physical column name. Defaults to the snake_case of the field name. */
  column: string;
  /** Marks the primary key. At most one field per model. */
  primary?: boolean;
  /** Unique constraint on the column. */
  unique?: boolean;
  /** Per-dialect column type overrides, keyed by dialect name. */
  dialectType?: Readonly<Record<string, string>>;
  /** For relation fields: the target model and column that owns the key. */
  foreignKey?: { model: string; field: string };
}

/** Validation metadata for one field, shared by server and client hints. */
export interface FieldValidation {
  /** Value must be present. `nullable` is a database property, not this. */
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  /** Regular expression source the value must match. */
  pattern?: string;
  /** Allowed values for `enum` fields. */
  enumValues?: readonly string[];
  /** Name of a refinement the application registers; the IR only references it. */
  custom?: string;
}

/** UI metadata for one field. Defaults come from the logical type. */
export interface FieldUi {
  /** Widget registry key. The logical type supplies the default widget. */
  widget?: string;
  label?: string;
  helpText?: string;
  /** Display order among fields of the same group. */
  order?: number;
  /** Form section the field belongs to. */
  group?: string;
  /** Present in the model but never rendered. */
  hidden?: boolean;
}

/** Authorization metadata for one field. */
export interface FieldAuthz {
  /** Excluded from serialization unless a field mask allows it. */
  sensitive?: boolean;
  /** Accepted from requests. Defaults to `true`; the resource may narrow it. */
  writable?: boolean;
}

/** One field of a model: domain identity plus its metadata groups. */
export interface FieldIR {
  name: string;
  logicalType: LogicalType;
  /** Nullability is a database property and belongs to the database group. */
  nullable?: boolean;
  /** JSON-safe default. Functions are not allowed in the IR. */
  default?: unknown;
  /** Database group. */
  db?: DbFieldMetadata;
  /** Validation group. */
  validation?: FieldValidation;
  /** UI group. */
  ui?: FieldUi;
  /** Authorization group. */
  authz?: FieldAuthz;
}

/** One named relation to another model. */
export interface RelationIR {
  name: string;
  kind: RelationKind;
  /** Model name of the other side. */
  target: string;
  /** Foreign key field on this model for `belongsTo` and `hasOne`. */
  foreignKey?: string;
  /** Key field on the target for `hasMany`. */
  targetKey?: string;
}

/** One table index. */
export interface IndexIR {
  name: string;
  columns: readonly string[];
  unique?: boolean;
}

/** Timestamp columns managed by the framework. */
export interface TimestampsMetadata {
  created?: string;
  updated?: string;
}

/** The complete, normalized description of one model. */
export interface ModelIR {
  version: typeof MODEL_IR_VERSION;
  /** Model name, singular, PascalCase in source but stored as-is. */
  name: string;
  /** Physical table name, snake_case plural by convention. */
  table: string;
  fields: readonly FieldIR[];
  relations?: readonly RelationIR[];
  indexes?: readonly IndexIR[];
  /** Soft delete column. When absent, deletes are hard deletes. */
  softDelete?: { field: string };
  timestamps?: TimestampsMetadata;
}
