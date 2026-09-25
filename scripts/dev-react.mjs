import { execSync } from "node:child_process";

const ports = [4331, 4332];

for (const port of ports) {
  let pids = [];

  try {
    const stdout = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    pids = stdout ? stdout.split("\n").filter(Boolean) : [];
  } catch {
    pids = [];
  }

  for (const pid of pids) {
    try {
      process.kill(Number(pid), "SIGTERM");
    } catch {}
  }
}
