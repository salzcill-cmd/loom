/**
 * Resource contract.
 *
 * A resource is a model exposed through generated CRUD, UI, and permissions.
 * Registration alone exposes nothing: an empty `actions` list denies every
 * operation until access rules exist.
 */

/** Operations a resource can expose. */
export type CrudAction = "list" | "read" | "create" | "update" | "delete";

/** How a model becomes an API resource. Extendable through resource files. */
export interface ResourceDefinition {
  /** Model name in the registry, for example `"product"`. */
  model: string;
  /** Route base under the API prefix, for example `products`. */
  routeBase: string;
  /**
   * Exposed operations. An empty or missing list is fully denied; this is the
   * deny-by-default contract and is not a mistake to fill in automatically.
   */
  actions?: readonly CrudAction[];
  /**
   * Fields accepted from requests. When absent, every field marked
   * `writable` in IR authz metadata is accepted.
   */
  writableFields?: readonly string[];
  /** Upper bound for `pageSize`. The framework default applies when absent. */
  pageSizeCap?: number;
}
