/**
 * Branded identifier types.
 *
 * Entity IDs are plain strings at runtime but branded at the type level so
 * that a `UserId` cannot be passed where a `ProductId` is expected.
 */

declare const brand: unique symbol;

/** A value of type `Value` carrying a compile-time brand `Name`. */
export type Brand<Value, Name extends string> = Value & {
  readonly [brand]: Name;
};

/** An identifier branded with the entity name, for example `Id<"user">`. */
export type Id<Name extends string> = Brand<string, Name>;

/**
 * Attach an entity brand to a raw string value.
 *
 * No runtime check happens here; validation of the identifier format is the
 * responsibility of the boundary that produced the value.
 */
export function toId<Name extends string>(value: string): Id<Name> {
  return value as Id<Name>;
}
