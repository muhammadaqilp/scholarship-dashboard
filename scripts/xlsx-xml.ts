// Minimal OOXML (.xlsx) reader used only by the build-time data pipeline.
// Shells out to the system `unzip` instead of pulling in an npm xlsx parser —
// every published xlsx-parsing package on npm currently carries an open,
// unpatched advisory (prototype pollution / ReDoS), and this only ever runs
// locally against our own trusted source file.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface WorkbookSheet {
  name: string;
  path: string;
}

export interface SheetRow {
  rowNumber: number;
  cells: Record<string, string>;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&");
}

export function extractXlsx(filePath: string): string {
  const dir = mkdtempSync(join(tmpdir(), "scholarship-xlsx-"));
  execFileSync("unzip", ["-o", filePath, "-d", dir], { stdio: "pipe" });
  return dir;
}

export function cleanupExtracted(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

export function parseSharedStrings(dir: string): string[] {
  const path = join(dir, "xl", "sharedStrings.xml");
  const xml = readFileSync(path, "utf-8");
  const items = xml.match(/<si>[\s\S]*?<\/si>/g) ?? [];
  return items.map((si) => {
    const texts = si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? [];
    return decodeXmlEntities(
      texts.map((t) => t.replace(/<t[^>]*>/, "").replace(/<\/t>/, "")).join(""),
    );
  });
}

export function parseWorkbookSheets(dir: string): WorkbookSheet[] {
  const workbookXml = readFileSync(join(dir, "xl", "workbook.xml"), "utf-8");
  const relsXml = readFileSync(join(dir, "xl", "_rels", "workbook.xml.rels"), "utf-8");

  const relTargets = new Map<string, string>();
  for (const m of relsXml.matchAll(/<Relationship\s+([^>]*)\/>/g)) {
    const attrs = Object.fromEntries(
      [...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((a) => [a[1], a[2]]),
    );
    if (attrs.Id && attrs.Target) {
      relTargets.set(attrs.Id, attrs.Target.replace(/^\//, ""));
    }
  }

  const sheets: WorkbookSheet[] = [];
  for (const m of workbookXml.matchAll(/<sheet\s+([^>]*)\/>/g)) {
    const attrs = Object.fromEntries(
      [...m[1].matchAll(/([\w:]+)="([^"]*)"/g)].map((a) => [a[1], a[2]]),
    );
    const rId = attrs["r:id"];
    const target = rId ? relTargets.get(rId) : undefined;
    if (attrs.name && target) {
      sheets.push({ name: decodeXmlEntities(attrs.name), path: join(dir, "xl", target) });
    }
  }
  return sheets;
}

export function parseSheetRows(sheetPath: string, sharedStrings: string[]): SheetRow[] {
  const xml = readFileSync(sheetPath, "utf-8");
  const rows: SheetRow[] = [];
  for (const rowMatch of xml.matchAll(/<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(rowMatch[1]);
    const cells: Record<string, string> = {};
    for (const cellMatch of rowMatch[2].matchAll(/<c ([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = Object.fromEntries(
        [...cellMatch[1].matchAll(/(\w+)="([^"]*)"/g)].map((a) => [a[1], a[2]]),
      );
      const colLetter = attrs.r?.match(/^[A-Z]+/)?.[0];
      if (!colLetter) continue;
      const valueMatch = cellMatch[2].match(/<v>([\s\S]*?)<\/v>/);
      if (!valueMatch) continue;
      const raw = valueMatch[1];
      cells[colLetter] = attrs.t === "s" ? (sharedStrings[Number(raw)] ?? "") : decodeXmlEntities(raw);
    }
    if (Object.keys(cells).length) rows.push({ rowNumber, cells });
  }
  return rows;
}
