function safeCell(value: unknown) {
  const text = String(value ?? "");
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${guarded.replaceAll('"','""')}"`;
}

export function createCsv(headers: string[], rows: unknown[][]) {
  return `\uFEFF${[headers,...rows].map(row=>row.map(safeCell).join(",")).join("\r\n")}`;
}
