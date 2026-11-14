import { describe, expect, test } from "bun:test";
import type { FormDescriptor, TableDescriptor, WidgetType } from "./descriptor";
import { DESCRIPTOR_VERSION } from "./descriptor";

const form: FormDescriptor = {
  kind: "form",
  version: DESCRIPTOR_VERSION,
  resource: "products",
  fields: [
    { name: "sku", label: "SKU", widget: "text", required: true },
    { name: "active", label: "Active", widget: "boolean", required: false },
  ],
};

const table: TableDescriptor = {
  kind: "table",
  version: DESCRIPTOR_VERSION,
  resource: "products",
  columns: [{ name: "sku", label: "SKU", type: "string", sortable: true, filterable: true }],
};

describe("descriptors", () => {
  test("forms carry the descriptor version", () => {
    expect(form.version).toBe(DESCRIPTOR_VERSION);
    expect(form.fields[0]?.widget).toBe<WidgetType>("text");
  });

  test("tables describe sortable and filterable columns", () => {
    expect(table.columns[0]?.sortable).toBe(true);
    expect(table.kind).toBe("table");
  });

  test("rejects an unregistered widget at the type level", () => {
    // @ts-expect-error "carousel" is not part of the WidgetType union
    const widget: WidgetType = "carousel";
    expect(widget).toBe("carousel" as WidgetType);
  });
});
