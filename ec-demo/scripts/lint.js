// 依存ゼロの簡易 lint: 全 .js ファイルを `node --check` で構文チェックする
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOTS = ['src', 'test', 'scripts', '.claude/hooks'];

function* jsFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* jsFiles(p);
    else if (p.endsWith('.js')) yield p;
  }
}

let count = 0;
for (const root of ROOTS) {
  for (const file of jsFiles(root)) {
    execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
    count++;
  }
}
console.log(`lint ok: ${count} files`);
