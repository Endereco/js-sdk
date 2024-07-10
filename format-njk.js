const fs = require('fs');
const path = require('path');
const beautify = require('js-beautify').html;

function formatNjkFiles(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      formatNjkFiles(filePath);
    } else if (path.extname(file) === '.njk') {
      let content = fs.readFileSync(filePath, 'utf8');
      const nunjucksConstructs = [];
      content = content.replace(/\{\{.*?\}\}/g, match => {
        nunjucksConstructs.push(match);
        return `__NUNJUCKS_PLACEHOLDER_${nunjucksConstructs.length - 1}__`;
      });
      const formatted = beautify(content, {
        indent_size: 2,
        wrap_line_length: 100,
        max_preserve_newlines: 2,
        unformatted: ['pre', 'code'],
        content_unformatted: ['pre', 'code'],
        extra_liners: ['head', 'body', '/html']
      });
      let restoredContent = formatted.replace(/__NUNJUCKS_PLACEHOLDER_(\d+)__/g, (match, index) => {
        return nunjucksConstructs[parseInt(index)];
      });
      fs.writeFileSync(filePath, restoredContent);
      console.log(`Formatted: ${filePath}`);
    }
  });
}

formatNjkFiles('./demo');