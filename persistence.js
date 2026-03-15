import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TASKS_FILE = join(__dirname, "tasks.json");

export async function loadTasks() {
  try {
    const raw = await readFile(TASKS_FILE, "utf-8");

    if (!raw.trim()) return [];

    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw new Error(`Failed to load tasks: ${error.message}`);
  }
}

export async function saveTasks(tasks) {
  try {
    const data = JSON.stringify(tasks, null, 2);
    await writeFile(TASKS_FILE, data, "utf-8");
  } catch (error) {
    throw new Error(`Failed to save tasks: ${error.message}`);
  }
}
