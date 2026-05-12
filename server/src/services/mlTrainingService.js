import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

const execFileAsync = promisify(execFile);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "..", "..", "..");
const exportScript = path.join(projectRoot, "server", "src", "scripts", "exportMlData.js");
const trainScript = path.join(projectRoot, "ml", "train_models.py");
const metricsPath = path.join(projectRoot, "ml", "artifacts", "metrics.json");

export async function retrainMlModels() {
  await execFileAsync("node", [exportScript], { cwd: projectRoot });
  const { stdout } = await execFileAsync("python", [trainScript], { cwd: projectRoot });
  return stdout;
}

export async function readMlMetrics() {
  const raw = await fs.readFile(metricsPath, "utf8");
  return JSON.parse(raw);
}

