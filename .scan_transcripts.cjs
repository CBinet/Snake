const fs = require('fs');
const path = require('path');
const os = require('os');

const projectsDir = path.join(os.homedir(), '.claude', 'projects');
const dirs = fs.readdirSync(projectsDir).filter(d => fs.statSync(path.join(projectsDir, d)).isDirectory());

let files = [];
for (const d of dirs) {
  const full = path.join(projectsDir, d);
  for (const f of fs.readdirSync(full)) {
    if (f.endsWith('.jsonl')) {
      const fp = path.join(full, f);
      files.push({ fp, mtime: fs.statSync(fp).mtimeMs });
    }
  }
}
files.sort((a, b) => b.mtime - a.mtime);
files = files.slice(0, 50);

const bashCounts = new Map();
const mcpCounts = new Map();

for (const { fp } of files) {
  let lines;
  try {
    lines = fs.readFileSync(fp, 'utf-8').split('\n');
  } catch (e) {
    continue;
  }
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let obj;
    try {
      obj = JSON.parse(trimmed);
    } catch (e) {
      continue;
    }
    const msg = obj && obj.message;
    if (!msg || !Array.isArray(msg.content)) continue;
    for (const item of msg.content) {
      if (!item || item.type !== 'tool_use') continue;
      const name = item.name || '';
      const input = item.input || {};
      if (name === 'Bash') {
        const cmd = input.command;
        if (!cmd) continue;
        bashCounts.set(cmd, (bashCounts.get(cmd) || 0) + 1);
      } else if (name.startsWith('mcp__')) {
        mcpCounts.set(name, (mcpCounts.get(name) || 0) + 1);
      }
    }
  }
}

console.log('=== BASH COMMANDS (count | command) ===');
const bashSorted = [...bashCounts.entries()].sort((a, b) => b[1] - a[1]);
for (const [cmd, c] of bashSorted) {
  console.log(c, '|', cmd.replace(/\n/g, '\\n').slice(0, 200));
}

console.log('\n=== MCP TOOLS (count | name) ===');
const mcpSorted = [...mcpCounts.entries()].sort((a, b) => b[1] - a[1]);
for (const [name, c] of mcpSorted) {
  console.log(c, '|', name);
}

console.log('\nFiles scanned:', files.length);
