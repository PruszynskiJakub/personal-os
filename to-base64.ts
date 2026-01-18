import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function convertToBase64(filePath: string) {
  try {
    const absolutePath = resolve(filePath);
    const fileBuffer = await readFile(absolutePath);
    const base64String = fileBuffer.toString("base64");
    console.log(base64String);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: bun to-base64.ts <file-path>");
  process.exit(1);
}

convertToBase64(filePath);
