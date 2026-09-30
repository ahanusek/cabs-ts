import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const stages = JSON.parse(readFileSync(new URL('../docs/course-tags.json', import.meta.url), 'utf8'));
const tags = new Set(git('tag', '--list').split('\n'));
const [command = 'list', tag] = process.argv.slice(2);

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}
function refs(stage) {
  return {
    start: stage.startRef ?? `course/${stage.tag}/start`,
    stop: stage.stopRef ?? `course/${stage.tag}/stop`,
  };
}
function complete(stage) {
  const { start, stop } = refs(stage);
  return tags.has(stage.tag) && tags.has(start) && tags.has(stop);
}
function verify() {
  const failures = [];
  for (const stage of stages) {
    const { start, stop } = refs(stage);
    if (!complete(stage)) { failures.push(`${stage.tag}: missing tags`); continue; }
    if (git('rev-parse', `${start}^{commit}`) === git('rev-parse', `${stop}^{commit}`))
      failures.push(`${stage.tag}: empty step`);
    if (!git('diff', '--name-only', start, stop)) failures.push(`${stage.tag}: no file changes`);
    const finalTag = stage.finalTag ?? stage.tag;
    if (git('rev-parse', `${finalTag}^{commit}`) !== git('rev-parse', `${stop}^{commit}`))
      failures.push(`${stage.tag}: end tag does not match ${finalTag}`);
    if (!/^[0-9a-f]{40}$/.test(stage.sourceCommit)) failures.push(`${stage.tag}: invalid Java source SHA`);
  }
  if (new Set(stages.map(stage => stage.tag)).size !== stages.length) failures.push('Duplicate source tags');
  if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
  else console.log(`Verified ${stages.length} source tags, start/stop references and non-empty changes.`);
}

if (command === 'list') {
  for (const stage of stages) {
    const track = stage.track ? ` [${stage.track}]` : '';
    console.log(`${complete(stage) ? 'done   ' : 'pending'} ${stage.tag}${track} — ${stage.description}`);
  }
} else if (command === 'verify') {
  verify();
} else if (command === 'diff' && stages.some(stage => stage.tag === tag && complete(stage))) {
  const { start, stop } = refs(stages.find(stage => stage.tag === tag));
  execFileSync('git', ['diff', start, stop], { stdio: 'inherit' });
} else {
  console.error('Usage: node scripts/course.mjs list | diff <tag> | verify');
  process.exitCode = 1;
}
