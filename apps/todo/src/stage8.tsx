// Stage 8: Dashboards and reporting components

import React from "react";
import {
  LogicalType,
  WidgetType,
  WidgetSize,
  WidgetError,
  FieldDependencyState,
  FieldShowIf,
  ColumnDescriptor,
  ColumnGroup,
  TableDescriptor,
  FieldUi,
  FieldAuthz,
  FormFieldDescriptor,
  FormDescriptor,
  generateTableDescriptor,
  generateFormDescriptor,
  defaultDesignTokens,
  unstyled,
} from "@loom/ui";

/** DataTable props interface. */
export interface DataTableProps {
  /** Table descriptor from Model IR. */
  tableDesc: TableDescriptor;
  /** Row data array. */
  rows: readonly { [key: string]: unknown }[];
  /** Column accessor function. */
  columnAccessor: (row: { [key: string]: unknown }, columnName: string) => unknown;
  /** On sort change handler. */
  onSort?: (columnName: string, direction: "asc" | "desc") => void;
  /** On filter change handler. */
  onFilter?: (columnName: string, value: string) => void;
  /** Current page number (1-indexed). */
  currentPage?: number;
  /** Number of rows per page. */
  pageSize?: number;
  /** Total number of rows (for pagination). */
  totalRows?: number;
  /** Class name for the table. */
  className?: string;
}

/** DataTable component - renders a table from descriptor and data. */
export function DataTable(props: DataTableProps) {
  const {
    tableDesc,
    rows,
    columnAccessor,
    onSort,
    onFilter,
    currentPage = 1,
    pageSize = 10,
    totalRows,
    className,
  } = props;

  const page = currentPage - 1; // Convert to 0-indexed
  const start = page * pageSize;
  const end = start + pageSize;
  const filteredRows = onFilter
    ? rows.filter((row) =>
        tableDesc.columns.some((column) =>
          String(columnAccessor(row, column.name))
            .toLowerCase()
            .includes(String(onFilter?.(column.name, "") ?? "").toLowerCase()),
        ),
      )
    : rows;
  const pageData = filteredRows.slice(start, end);
  const totalPages = Math.ceil(totalRows / pageSize) || 1;

  // Handle sorting state
  const [sortState, setSortState] = React.useState({
    column: tableDesc.columns[0]?.name ?? "",
    direction: "asc" as "asc" | "desc",
  });

  // Render table header with sorting
  const renderHeader = (column: ColumnDescriptor) => {
    const isSorted = sortState.column === column.name;
    const sortDir = isSorted && sortState.direction === "asc" ? "desc" : "asc";

    return (
      <th
        style={{ cursor: "pointer" }}
        onClick={() => {
          setSortState({ column: column.name, direction: sortDir });
          onSort?.(column.name, sortDir);
        }}
      >
        <span>{column.label}</span>
        <span>{isSorted ? sortState.direction : ""}</span>
      </th>
    );
  };

  // Render table row
  const renderRow = (row: { [key: string]: unknown }) => {
    const cells = tableDesc.columns.map((column) => {
      const value = columnAccessor(row, column.name);
      return (
        <td key={column.name} style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
          {String(value ?? "-")}
        </td>
      );
    });
    return <tr>{cells}</tr>;
  };

  // Render pagination
  const renderPagination = () => {
    if (!totalRows || totalPages <= 1) return null;

    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
        <span>
          Showing {start + 1}-{Math.min(end, totalRows)} of {totalRows}
        </span>
        <span style={{ margin: "0 16px" }}>|</span>
        <span>
          {page + 1} of {totalPages}
        </span>
      </div>
    );
  };

  return (
    <div style={{ className: className ?? "" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{tableDesc.columns.map((column) => renderHeader(column))}</tr>
        </thead>
        <tbody>{pageData.map((row, rowIndex) => renderRow(row, rowIndex))}</tbody>
      </table>
      {renderPagination()}
    </div>
  );
}

/** DashboardLayout props interface. */
export interface DashboardLayoutProps {
  /** Layout configuration - array of section names. */
  layout: readonly string[];
  /** Children components for each section. */
  children: React.ReactNode;
  /** Theme mode. */
  theme?: "light" | "dark" | "system";
  /** On theme change handler. */
  onThemeChange?: (mode: "light" | "dark" | "system") => void;
}

/** DashboardLayout component - responsive dashboard layout. */
export function DashboardLayout(props: DashboardLayoutProps) {
  const { layout, children, theme = "light", onThemeChange } = props;

  const sections = layout.map((section) => (
    <div
      key={section}
      style={{
        padding: "16px",
        borderRadius: "8px",
        marginBottom: "16px",
        background: theme === "dark" ? "#1e293b" : "#f8fafc",
        border: "1px solid #e2e8f0",
      }}
    >
      {children[section]}
    </div>
  ));

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "16px" }}>Dashboard</h1>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["light", "dark", "system"].map((mode) => (
          <button
            key={mode}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: mode === theme ? "2px solid #2563eb" : "1px solid #cbd5e1",
              background: mode === theme ? "#2563eb" : "transparent",
              color: mode === theme ? "#fff" : "#1e293b",
              cursor: "pointer",
            }}
            onClick={() => onThemeChange?.(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
      {sections}
    </div>
  );
}

/** LoginPage props interface. */
export interface LoginPageProps {
  /** On submit handler with credentials. */
  onSubmit: (credentials: { email: string; password: string }) => Promise<boolean>;
  /** On cancel/close handler. */
  onCancel: () => void;
  /** Page title. */
  title?: string;
}

/** LoginPage component - authentication form. */
export function LoginPage(props: LoginPageProps) {
  const { onSubmit, onCancel, title = "Login" } = props;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const success = await onSubmit({ email, password });
    if (!success) {
      setError("Invalid email or password");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        padding: "32px",
        margin: "0 auto",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
      }}
    >
      <h2 style={{ marginBottom: "16px", textAlign: "center" }}>{title}</h2>
      {error && <p style={{ color: "#dc2626", marginBottom: "16px" }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #cbd5e1",
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #cbd5e1",
              borderRadius: "4px",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            width: "100%",
          }}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Sign In"}
        </button>
      </form>
      <p style={{ marginTop: "16px", textAlign: "center" }}>
        <button onClick={onCancel} style={{ cursor: "pointer" }}>
          {"Forgot password?"}
        </button>
      </p>
    </div>
  );
}

/** Access check result type. */
export type AccessCheckResult = {
  /** Whether access is allowed. */
  allowed: boolean;
  /** Error response if denied. */
  error?: {
    /** Error type. */
    type: string;
    /** Error title. */
    title: string;
    /** HTTP status code. */
    status: number;
    /** Error code. */
    code: string;
    /** Request ID. */
    requestId?: string;
  };
};

/** Check if principal has access to a resource. */
export function checkAccess(
  principal: { id: string; roles: readonly string[] } | null,
  requiredRoles: readonly string[],
): AccessCheckResult {
  if (!principal) {
    return {
      allowed: false,
      error: {
        type: "urn:loom:error:UNAUTHENTICATED",
        title: "Authentication required",
        status: 401,
        code: "UNAUTHENTICATED",
      },
    };
  }

  const hasRequiredRole = principal.roles.some((role) => requiredRoles.includes(role));

  if (!hasRequiredRole) {
    return {
      allowed: false,
      error: {
        type: "urn:loom:error:FORBIDDEN",
        title: "Forbidden - insufficient roles",
        status: 403,
        code: "FORBIDDEN",
        requestId: principal.id,
      },
    };
  }

  return { allowed: true };
}

/** Default export with all Stage 8 components. */
export default {
  DataTable,
  DashboardLayout,
  LoginPage,
  checkAccess,
  DataTableProps,
  DashboardLayoutProps,
  LoginPageProps,
  AccessCheckResult,
  FieldShowIf,
  FieldDependencyState,
  WidgetType,
  WidgetSize,
  WidgetError,
  LogicalType,
  ColumnDescriptor,
  ColumnGroup,
  TableDescriptor,
  FieldUi,
  FieldAuthz,
  FormFieldDescriptor,
  FormDescriptor,
  generateTableDescriptor,
  generateFormDescriptor,
  defaultDesignTokens,
  unstyled,
};
