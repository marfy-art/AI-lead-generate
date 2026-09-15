import { describe, expect, it } from "vitest";
import { createCsv } from "./csv";

describe("CSV export", () => {
  it("quotes commas and double quotes", () => expect(createCsv(["Name"],[["Acme, \"Dhaka\""]])).toContain('"Acme, ""Dhaka"""'));
  it.each(["=1+1","+SUM(A1)","-2+3","@IMPORTDATA(x)"])("guards spreadsheet formula %s",value=>expect(createCsv(["Value"],[[value]])).toContain(`"'${value}"`));
});
