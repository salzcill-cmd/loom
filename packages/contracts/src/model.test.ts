import { describe, expect, test } from "bun:test";
import type { ModelIR } from "./model";
import { MODEL_IR_VERSION } from "./model";

// A complete IR fixture. Typechecked here so the type stays buildable by a
// plain object literal without function helpers.
const product: ModelIR = {
  version: MODEL_IR_VERSION,
  name: "Product",
  table: "products",
  fields: [
    {
      name: "id",
      logicalType: "uuid",
      db: { column: "id", primary: true },
    },
    {
      name: "sku",
      logicalType: "string",
      validation: { required: true, maxLength: 64 },
      ui: { label: "SKU", order: 1 },
      authz: { writable: true },
    },
    {
      name: "categoryId",
      logicalType: "relation",
      db: { column: "category_id", foreignKey: { model: "Category", field: "id" } },
    },
  ],
  relations: [
    { name: "category", kind: "belongsTo", target: "Category", foreignKey: "categoryId" },
  ],
  indexes: [{ name: "products_sku_idx", columns: ["sku"], unique: true }],
  timestamps: { created: "created_at", updated: "updated_at" },
};

describe("ModelIR", () => {
  test("carries the current version", () => {
    expect(MODEL_IR_VERSION).toBe(1);
    expect(product.version).toBe(MODEL_IR_VERSION);
  });

  test("keeps every metadata group readable", () => {
    expect(product.fields[0]?.db?.primary).toBe(true);
    expect(product.fields[1]?.validation?.required).toBe(true);
    expect(product.fields[1]?.ui?.label).toBe("SKU");
    expect(product.fields[1]?.authz?.writable).toBe(true);
    expect(product.relations?.[0]?.kind).toBe("belongsTo");
  });
});
