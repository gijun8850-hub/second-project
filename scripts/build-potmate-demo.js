const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function escapeStyle(css) {
  return css.replace(/<\/style/gi, '<\\/style');
}

function escapeScript(js) {
  return js.replace(/<\/script/gi, '<\\/script');
}

const css = escapeStyle(readText('css/style.css'));
const scripts = [
  'js/potmate-data.js',
  'js/potmate-core.js',
  'js/app.js'
].map((file) => `/* ${file} */\n${escapeScript(readText(file))}`).join('\n\n');

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>팟메이트(PotMate) 데모</title>
  <style>
${css}
  </style>
</head>
<body>
  <main id="app" class="mobile-shell" aria-live="polite"></main>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>

  <script>
${scripts}
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'potmate_demo.html'), html, 'utf8');
