import { loadTasks, saveTasks } from "./persistence.js";
import { PriorityQueue } from "./priority-queue.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry(fn, maxAttempts = 3) {
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt++;

      if (attempt >= maxAttempts) {
        throw new Error(
          `Failed after ${maxAttempts} attempts: ${error.message}`,
        );
      }
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(
        `  ↻ Attempt ${attempt} failed. Retrying in ${delay / 1000}s...`,
      );
      await sleep(delay);
    }
  }
}

const PRIORITY_VALUE = { high: 3, medium: 2, low: 1 };

export class TaskQueue {
  #queue = new PriorityQueue();

  async init() {
    const saved = await loadTasks();
    this.#queue.fromArray(saved);
    console.log(`  ✓ Loaded ${saved.length} task(s) from disk\n`);
  }

  async add({ name, priority = "medium", delay = 0 }) {
    const task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      priority,
      delay,
      status: "pending",
      attempts: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    this.#queue.push(task);
    await saveTasks(this.#queue);
    console.log(`  + Task added: "${name}" [${priority}] — runs in ${delay}s`);

    this.#run(task.id);
  }

  list() {
    return this.#queue.toArray();
  }

  status() {
    const counts = { pending: 0, running: 0, completed: 0, failed: 0 };
    for (const task of this.#queue.toArray()) {
      counts[task.status] = (counts[task.status] || 0) + 1;
    }

    return counts;
  }

  async clearCompleted() {
    const all = this.#queue.toArray();
    const remaining = all.filter((t) => t.status !== "completed");
    this.#queue.fromArray(remaining);
    await saveTasks(this.#queue);
    return all.length - remaining.length;
  }

  #updateTask(id, changes) {
    const task = this.#queue.toArray().find((t) => t.id === id);
    if (task) {
      Object.assign(task, changes);
    }
  }

  async #run(id) {
    const task = this.#queue.toArray().find((t) => t.id === id);
    if (!task) return;

    if (task.delay > 0) {
      await sleep(task.delay * 1000);
    }

    this.#updateTask(id, { status: "running" });
    await saveTasks(this.#queue.toArray());

    try {
      await retry(async () => {
        const fails = Math.random() < 0.3;
        if (fails) throw new Error("Simulated failure");
        await sleep(500);
      });

      this.#updateTask(id, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
      console.log(`\n  ✓ Task completed: "${task.name}"`);
    } catch {
      this.#updateTask(id, { status: "failed" });
      console.log(`\n  ✗ Task failed: "${task.name}" (3 attempts exhausted)`);
    }

    await saveTasks(this.#queue.toArray());
  }
}
