/**
 * Public API of `@loom/contracts`.
 *
 * Types and small shared utilities only. This package must never gain a
 * runtime dependency or import another Loom package.
 */

export type { Brand, Id } from "./ids";
export { toId } from "./ids";

export type { FieldIssue, LoomErrorCode, LoomProblem, ProblemDetails } from "./problem";
export { isProblemDetails, LOOM_ERROR_CODES } from "./problem";

export type {
  DbFieldMetadata,
  FieldAuthz,
  FieldIR,
  FieldUi,
  FieldValidation,
  IndexIR,
  LogicalType,
  ModelIR,
  RelationIR,
  RelationKind,
  TimestampsMetadata,
} from "./model";
export { MODEL_IR_VERSION } from "./model";

export type { CrudAction, ResourceDefinition } from "./resource";

export type {
  ColumnDescriptor,
  FormDescriptor,
  FormFieldDescriptor,
  TableDescriptor,
  WidgetType,
} from "./descriptor";
export { DESCRIPTOR_VERSION } from "./descriptor";

export type { Handler, HandlerArgs, PrincipalLike, RequestContextLike } from "./http";
