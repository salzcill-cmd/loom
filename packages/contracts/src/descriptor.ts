/**
 * Descriptor contract.
 *
 * The server produces descriptors; adapters render them. Descriptors are
 * serializable, filtered by the current principal before they leave the
 * server, and never carry data the user may not see.
 */
import type { LogicalType } from "./model";

/** Descriptor shape version carried by every descriptor. */
export const DESCRIPTOR_VERSION = 1;

/**
 * Widget registry keys a form field can request. The logical type supplies
 * the default; a resource or theme may override it.
 */
export type WidgetType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "password"
  | "date"
  | "datetime"
  | "boolean"
  | "select"
  | "multiselect"
  | "relation"
  | "file"
  | "image"
  | "hidden";

/** One field of a generated form. */
export interface FormFieldDescriptor {
  /** Field name on the resource payload. */
  name: string;
  /** Display label, already localized by the server. */
  label: string;
  widget: WidgetType;
  required: boolean;
  /** Rendered but not editable. */
  disabled?: boolean;
  helpText?: string;
}

/** A form the client renders for one resource. */
export interface FormDescriptor {
  kind: "form";
  version: typeof DESCRIPTOR_VERSION;
  /** Resource the form submits to. */
  resource: string;
  fields: readonly FormFieldDescriptor[];
}

/** One column of a generated table. */
export interface ColumnDescriptor {
  /** Field or relation path the column reads, e.g. `category.name`. */
  name: string;
  label: string;
  /** Logical type of the displayed value. */
  type: LogicalType;
  sortable: boolean;
  filterable: boolean;
}

/** A table the client renders for one resource. */
export interface TableDescriptor {
  kind: "table";
  version: typeof DESCRIPTOR_VERSION;
  resource: string;
  columns: readonly ColumnDescriptor[];
}
