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

function splitChain(cmd) {
  // crude split on &&, ;, | at top level (not inside quotes/heredocs) - good enough for bucketing
  // First, only look at the first line to avoid heredoc bodies
  const firstLine = cmd.split('\n')[0];
  return firstLine.split(/&&|;|\|/).map(s => s.trim()).filter(Boolean);
}

function normalizeSegment(seg) {
  let s = seg.trim();
  // strip leading cd "..." (already split off as separate segment typically)
  // strip env var assignments: VAR=val VAR2=val2 cmd
  s = s.replace(/^([A-Za-z_][A-Za-z0-9_]*=("[^"]*"|'[^']*'|\S*)\s+)+/, '');
  // strip leading sudo/timeout N/nohup
  s = s.replace(/^(sudo|nohup)\s+/, '');
  s = s.replace(/^timeout\s+(-\w+\s+)*\d+\s+/, '');
  const tokens = s.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  let head = tokens[0];
  // strip path prefix from head if it's a path to an executable
  head = head.replace(/^.*[\\/]/, '');
  head = head.replace(/\.(exe|cmd)$/i, '');
  if (head === 'cd') return null; // skip pure cd segments
  // command+subcommand pairing for known multi-word commands
  const multiWord = new Set(['npm', 'git', 'gh', 'docker', 'npx', 'node', 'kubectl', 'flyctl', 'fly', 'taskkill', 'ps']);
  if (multiWord.has(head) && tokens.length > 1) {
    let sub = tokens[1];
    sub = sub.replace(/^-+/, '');
    return head + ' ' + sub;
  }
  return head;
}

const bucketCounts = new Map();
const bucketExamples = new Map();
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
        const segs = splitChain(cmd);
        const seen = new Set();
        for (const seg of segs) {
          const norm = normalizeSegment(seg);
          if (!norm) continue;
          if (seen.has(norm)) continue; // count once per command line
          seen.add(norm);
          bucketCounts.set(norm, (bucketCounts.get(norm) || 0) + 1);
          if (!bucketExamples.has(norm)) bucketExamples.set(norm, seg.slice(0, 100));
        }
      } else if (name.startsWith('mcp__')) {
        mcpCounts.set(name, (mcpCounts.get(name) || 0) + 1);
      }
    }
  }
}

console.log('=== BUCKETED COMMANDS (count | bucket | example) ===');
const sorted = [...bucketCounts.entries()].sort((a, b) => b[1] - a[1]);
for (const [bucket, c] of sorted) {
  console.log(c, '|', bucket, '|', bucketExamples.get(bucket));
}

console.log('\n=== MCP TOOLS ===');
for (const [name, c] of [...mcpCounts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(c, '|', name);
}
console.log('\nFiles scanned:', files.length);
