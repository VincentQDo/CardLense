import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { globSync } from 'node';

const failures = [];

const svelteFiles = globSync('src/**/*.svelte');

for (const file of svelteFiles) {
  const source = readFileSync(file, 'utf8');

  if (/<style(\s|>)/i.test(source)) {
    failures.push(`${file}: use daisyUI and Tailwind classes instead of component <style> blocks.`);
  }

  if (/\bstyle\s*=/.test(source)) {
    failures.push(`${file}: use Tailwind utilities instead of inline style attributes.`);
  }
}

const appCss = readFileSync('src/app.css', 'utf8').trim();
const allowedAppCss = `@import 'tailwindcss';
@plugin "daisyui" {
  themes:
    night --default,
    winter;
}`;

if (appCss !== allowedAppCss) {
  failures.push(
    `${relative(process.cwd(), 'src/app.css')}: keep global CSS limited to Tailwind and daisyUI setup unless the project standard is intentionally changed.`
  );
}

if (failures.length > 0) {
  console.error('Coding standard check failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}
