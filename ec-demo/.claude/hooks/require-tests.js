#!/usr/bin/env node
// Stop hook (サンプル): エージェントが「完了」しようとした時に npm test を実行する
// 失敗していれば exit 2 → 完了をブロックし、stderr の内容が Claude に返る
// 「テスト通りました」という自己申告ではなく、exit code を完了条件にする
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
// 無限ループ防止: すでに Stop hook により継続中なら、それ以上はブロックしない (人に戻す)
if (input.stop_hook_active) process.exit(0);

const cwd = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const r = spawnSync('npm', ['test', '--silent'], { cwd, encoding: 'utf8' });
if (r.status !== 0) {
  const fails = (r.stdout + r.stderr).split('\n').filter((l) => /^not ok|✖|fail \d/.test(l.trim())).slice(0, 10).join('\n');
  console.error(`BLOCKED: npm test が失敗しています。完了できません。\n${fails}\n失敗を修正してから、もう一度完了してください。`);
  process.exit(2);
}
process.exit(0);
