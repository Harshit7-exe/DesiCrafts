import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";

const execFileAsync = promisify(execFile);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "..", "..", "..");
const recommendationScript = path.join(projectRoot, "ml", "recommend.py");

async function runRecommendation(args) {
  const { stdout } = await execFileAsync("python", [recommendationScript, ...args], {
    cwd: projectRoot
  });
  return JSON.parse(stdout);
}

export async function getRelatedMlRecommendations(mlProductId, topN = 4) {
  return runRecommendation(["--mode", "related", "--product-id", mlProductId, "--top-n", String(topN)]);
}

export async function getHistoryMlRecommendations(mlProductIds, topN = 6) {
  return runRecommendation([
    "--mode",
    "history",
    "--product-ids",
    mlProductIds.join(","),
    "--top-n",
    String(topN)
  ]);
}

export async function getTrainedUserRecommendations(userId, topN = 6) {
  return runRecommendation(["--mode", "user", "--user-id", userId, "--top-n", String(topN)]);
}

