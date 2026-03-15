import readline from "readline";
import { TaskQueue } from "./scheduler.js";

const queue = new TaskQueue();

const STATUS_ICON = {
  pending: "○",
  running: "◐",
  completed: "●",
  failed: "✗",
};

function printHelp() {
  console.log(`Commands:
    add "<name>" <priority> <delay>   — priority: high | medium | low
                                        delay: seconds before running
    list                              — show all tasks
    status                            — count by state
    clear                             — remove completed tasks
    help                              — show this message
    exit                              — quit

  Examples:
    add "backup database" high 5
    add "send report" medium 10
    add "cleanup logs" low 0
  `);
}

function printList(tasks) {
  if (tasks.length === 0) {
    console.log("No tasks found.\n");
    return;
  }

  console.log("");
  for (const t of tasks) {
    const icon = STATUS_ICON[t.status] || "?";
    const delay = t.delay > 0 ? ` (delay ${t.delay}s)` : "";
    console.log(`  ${icon} [${t.priority.padEnd(6)}] ${t.name}${delay}`);
  }
  console.log("");
}

function printStatus(counts) {
  console.log(`
  ○ Pending:   ${counts.pending || 0}
  ◐ Running:   ${counts.running || 0}
  ● Completed: ${counts.completed || 0}
  ✗ Failed:    ${counts.failed || 0}
  `);
}

function parseAdd(input) {
  const match = input.match(/^add\s+"([^"]+)"\s+(\w+)\s+(\d+)$/);
  if (!match) return null;

  const [, name, priority, delay] = match;

  if (!["high", "medium", "low"].includes(priority)) {
    return null;
  }

  return { name, priority, delay: parseInt(delay, 10) };
}

async function main() {
  console.log("  CLI Task Scheduler — Bloomberg Prep");
  console.log('  type "help" to see available commands\n');

  await queue.init();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    if (input === "help") {
      printHelp();
    } else if (input.startsWith("add ")) {
      const args = parseAdd(input);
      if (!args) {
        console.log('  ✗ Invalid format. Example: add "my task" high 5\n');
      } else {
        await queue.add(args);
        console.log("");
      }
    } else if (input === "list") {
      printList(queue.list());
    } else if (input === "status") {
      printStatus(queue.status());
    } else if (input === "clear") {
      const removed = await queue.clearCompleted();
      console.log(`  ✓ Removed ${removed} completed task(s)\n`);
    } else if (input === "exit") {
      console.log("  Bye!\n");
      rl.close();
      process.exit(0);
    } else {
      console.log(
        `  ✗ Unknown command: "${input}". Type "help" for options.\n`,
      );
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log("\n  Bye!\n");
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
