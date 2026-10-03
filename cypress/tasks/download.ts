import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import * as XLSX from "xlsx";
const execute = promisify(execFile);

async function runTool(command: string, args: string[]) {
  try { return await execute(command, args); }
  catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Missing ${command} on PATH. macOS: brew install poppler tesseract; Linux: install poppler-utils tesseract-ocr.`, { cause: error });
    }
    throw error;
  }
}

/** Confine parsing to Cypress downloads; raster PDFs require real OCR, not invented text. */
export async function inspectDownload(filename: string) {
  if (path.basename(filename) !== filename) throw new Error("Download filename required");
  const file = path.resolve("cypress/downloads", filename);
  const bytes = await readFile(file);
  if (filename.endsWith(".xlsx")) {
    const workbook = XLSX.read(bytes, { type: "buffer" });
    return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
  }
  if (!filename.endsWith(".pdf") || bytes.subarray(0, 5).toString() !== "%PDF-") {
    throw new Error("Expected a real PDF or XLSX download");
  }
  const temporary = await mkdtemp(path.join(tmpdir(), "aiom-pdf-"));
  try {
    await runTool("pdftoppm", ["-png", "-r", "150", file, path.join(temporary, "page")]);
    const pages = (await readdir(temporary)).filter((name) => name.endsWith(".png")).sort();
    if (!pages.length) throw new Error("PDF contains zero rendered pages");
    const text = [];
    for (const page of pages) {
      const result = await runTool("tesseract", [path.join(temporary, page), "stdout", "-l", "eng"]);
      text.push(result.stdout);
    }
    return { pages: pages.length, text: text.join("\n"), method: "raster OCR" };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
