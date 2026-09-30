import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const stages = JSON.parse(readFileSync(new URL('../docs/course-tags.json', import.meta.url), 'utf8'));
const tags = new Set(execFileSync('git', ['tag', '--list'], { encoding: 'utf8' }).trim().split('\n'));
const [command = 'list', tag] = process.argv.slice(2);

if (command === 'list') {
  for (const stage of stages) {
    const completed = tags.has(`course/${stage.tag}/stop`);
    console.log(`${completed ? 'done   ' : 'pending'} ${stage.tag} — ${stage.description}`);
  }
} else if (command === 'diff' && tags.has(`course/${tag}/stop`)) {
  execFileSync('git', ['diff', `course/${tag}/start`, `course/${tag}/stop`], { stdio: 'inherit' });
} else {
  console.error('Usage: node scripts/course.mjs list | diff <completed-tag>');
  process.exitCode = 1;
}
