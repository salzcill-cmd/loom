// UI foundation types for table and form rendering.
// These types are shared between server and client.

/** Logical field types, re-exported from @loom/model. */
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

/** Widget types supported by the UI layer. */
export type WidgetType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "password"
  | "date"
  | "datetime-local"
  | "boolean"
  | "select"
  | "multiselect"
  | "relation"
  | "file"
  | "image"
  | "hidden";

/** Widget size options. */
export type WidgetSize = "small" | "medium" | "large";

/** Widget error state. */
export type WidgetError = "none" | "invalid" | "required";

/** Dependency state for conditional fields. */
export type FieldDependencyState = "initial" | "pending" | "resolved" | "error";

/** Conditional show/hide rule for fields. */
export interface FieldShowIf {
  /** Field name that this depends on. */
  dependsOn: string;
  /** Value that triggers show/hide. */
  value: string | number | boolean;
  /** Operator for comparison. */
  operator: "equals" | "notEquals" | "contains" | "notContains";
}

/** Table column descriptor. */
export interface ColumnDescriptor {
  /** Column name. */
  name: string;
  /** Column label. */
  label: string;
  /** Logical type. */
  type: LogicalType;
  /** Whether column is sortable. */
  sortable: boolean;
  /** Whether column is filterable. */
  filterable: boolean;
}

/** Table column group for layout. */
export interface ColumnGroup {
  /** Group name. */
  name: string;
  /** Group label. */
  label: string;
  /** Column names in this group. */
  columns: readonly string[];
}

/** Table descriptor for server-side rendering. */
export interface TableDescriptor {
  /** Kind identifier. */
  kind: "table";
  /** Version number. */
  version: number;
  /** Resource name. */
  resource: string;
  /** Column descriptors. */
  columns: readonly ColumnDescriptor[];
}

/** Field UI metadata from FieldIR.ui. */
export interface FieldUi {
  /** Optional widget type. */
  widget?: WidgetType;
  /** Optional widget size. */
  widgetSize?: WidgetSize;
  /** Label text. */
  label?: string;
  /** Help text. */
  helpText?: string;
  /** Order within group. */
  order?: number;
  /** Group name. */
  group?: string;
  /** Whether field is hidden. */
  hidden?: boolean;
  /** Conditional show/hide rules. */
  showIf?: FieldShowIf[];
  /** Conditional hide rules. */
  hideIf?: FieldShowIf[];
}

/** Field authorization metadata from FieldIR.authz. */
export interface FieldAuthz {
  /** Whether field contains sensitive data. */
  sensitive?: boolean;
  /** Whether field is writable. */
  writable?: boolean;
}

/** Form field descriptor. */
export interface FormFieldDescriptor {
  /** Field name. */
  name: string;
  /** Label text. */
  label: string;
  /** Widget type. */
  widget: WidgetType;
  /** Optional widget size. */
  widgetSize?: WidgetSize;
  /** Whether field is required. */
  required: boolean;
  /** Whether field is disabled. */
  disabled?: boolean;
  /** Help text. */
  helpText?: string;
  /** Error state. */
  error?: WidgetError;
  /** Dependency state for conditional rendering. */
  dependencyState?: FieldDependencyState;
}

/** Form descriptor for server-side rendering. */
export interface FormDescriptor {
  /** Kind identifier. */
  kind: "form";
  /** Version number. */
  version: number;
  /** Resource name. */
  resource: string;
  /** Field descriptors. */
  fields: readonly FormFieldDescriptor[];
}

/** Generate a TableDescriptor from ModelIR fields and principal masks. */
export function generateTableDescriptor(_model?: {
  name: string;
  fields: readonly { name: string; logicalType: string }[];
  table: string;
}): TableDescriptor {
  const columns: ColumnDescriptor[] = [];

  if (_model?.fields) {
    for (const field of _model.fields) {
      columns.push({
        name: field.name,
        label: field.name,
        type: "string" as LogicalType,
        sortable: true,
        filterable: true,
      });
    }
  }

  return {
    kind: "table",
    version: 1,
    resource: _model?.name ?? "unknown",
    columns,
  };
}

/** Generate a FormDescriptor from ModelIR fields and principal masks. */
export function generateFormDescriptor(_model?: {
  name: string;
  fields: readonly { name: string; logicalType: string }[];
  table: string;
}): FormDescriptor {
  const fields: FormFieldDescriptor[] = [];

  if (_model?.fields) {
    for (const field of _model.fields) {
      fields.push({
        name: field.name,
        label: field.name,
        widget: "text",
        required: false,
        disabled: false,
        helpText: "",
        error: "none" as WidgetError,
        dependencyState: "initial",
      });
    }
  }

  return {
    kind: "form",
    version: 1,
    resource: _model?.name ?? "unknown",
    fields,
  };
}

/** Generate a TableDescriptor from ModelIR fields and principal. */
export function generateTableDescriptorFromModelIR(model: {
  name: string;
  fields: readonly {
    name: string;
    logicalType: string;
    ui?: { label?: string; hidden?: boolean };
  }[];
  principal?: { id: string; roles: readonly string[] } | null;
}): TableDescriptor {
  const columns: ColumnDescriptor[] = [];

  for (const field of model.fields) {
    columns.push({
      name: field.name,
      label: field.ui?.label || field.name,
      type: field.logicalType as LogicalType,
      sortable: !field.ui?.hidden,
      filterable: true,
    });
  }

  return {
    kind: "table",
    version: 1,
    resource: model.name,
    columns,
  };
}

/** Generate a FormDescriptor from ModelIR fields and principal. */
export function generateFormDescriptorFromModelIR(model: {
  name: string;
  fields: readonly {
    name: string;
    logicalType: string;
    ui?: { label?: string; hidden?: boolean };
  }[];
  principal?: { id: string; roles: readonly string[] } | null;
}): FormDescriptor {
  const fields: FormFieldDescriptor[] = [];

  for (const field of model.fields) {
    fields.push({
      name: field.name,
      label: field.ui?.label || field.name,
      widget: "text" as WidgetType,
      required: false,
      disabled: false,
      helpText: "",
      error: "none" as WidgetError,
      dependencyState: "initial",
    });
  }

  return {
    kind: "form",
    version: 1,
    resource: model.name,
    fields,
  };
}

/** Design tokens - CSS custom properties under loom- prefix. */
export interface DesignTokens {
  /** Primary color */
  "--loom-primary": string;
  /** Secondary color */
  "--loom-secondary": string;
  /** Background color */
  "--loom-background": string;
  /** Text color */
  "--loom-text": string;
  /** Surface color */
  "--loom-surface": string;
  /** Error color */
  "--loom-error": string;
  /** Success color */
  "--loom-success": string;
  /** Warning color */
  "--loom-warning": string;
  /** Information color */
  "--loom-info": string;
  /** Border color */
  "--loom-border": string;
  /** Radius */
  "--loom-radius": string;
  /** Spacing scale unit */
  "--loom-spacing": string;
  /** Font family */
  "--loom-font-family": string;
  /** Font size */
  "--loom-font-size": string;
  /** Focus ring color */
  "--loom-focus-ring": string;
  /** Dark mode override */
  "--loom-dark-mode": string;
}

/** Default design tokens. */
export const defaultDesignTokens: DesignTokens = {
  "--loom-primary": "#2563eb",
  "--loom-secondary": "#64748b",
  "--loom-background": "#f8fafc",
  "--loom-text": "#1e293b",
  "--loom-surface": "#ffffff",
  "--loom-error": "#dc2626",
  "--loom-success": "#059669",
  "--loom-warning": "#d97706",
  "--loom-info": "#0891b2",
  "--loom-border": "#e2e8f0",
  "--loom-radius": "0.5rem",
  "--loom-spacing": "0.25rem",
  "--loom-font-family": "system-ui, -apple-system, sans-serif",
  "--loom-font-size": "1rem",
  "--loom-focus-ring": "3px solid #2563eb",
  "--loom-dark-mode": "(prefers-color-scheme: dark)",
};

/** Unstyled entry point for teams bringing their own components. */
export const unstyled: string = "";
