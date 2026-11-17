#!/usr/bin/env node
// PreToolUse hook (サンプル): 保護対象ファイルへの Edit/Write をブロックする
// stdin: Claude Code の hook JSON ({ tool_name, tool_input: { file_path }, cwd, ... })
// exit 0 = 許可 / exit 2 = ブロック (stderr のメッセージが Claude に返る)
import { readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

const PROTECTED = [
  { prefix: 'src/payment/', reason: '決済コード (src/payment/)' },
  { exact: 'docs/business-rules.md', reason: '業務ルール (docs/business-rules.md)' },
];

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const rel = relative(projectDir, resolve(input.cwd || projectDir, filePath)).split(sep).join('/');

const hit = PROTECTED.find((p) => (p.exact ? rel === p.exact : rel.startsWith(p.prefix)));
if (hit) {
  console.error(
    `BLOCKED: ${hit.reason} は人間の承認なしに変更できません (${rel})。` +
      '変更が必要な理由と差分案をユーザーに提示し、承認を求めてください。',
  );
  process.exit(2);
}
process.exit(0);
