const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Compile an email template file to HTML based on its framework.
 * @param {string} filePath - Path to the template file
 * @param {string} framework - 'html', 'mjml', 'react-email', 'jsx'
 * @returns {string} - Compiled HTML
 */
function compileToHTML(filePath, framework = 'html') {
  switch (framework) {
    case 'html':
      return fs.readFileSync(filePath, 'utf8');

    case 'mjml':
      return compileMJML(filePath);

    case 'react-email':
      return compileReactEmail(filePath);

    case 'jsx':
      return compileJSX(filePath);

    default:
      throw new Error(`Unknown framework: ${framework}. Supported: html, mjml, react-email, jsx`);
  }
}

/**
 * Compile MJML to HTML.
 */
function compileMJML(filePath) {
  let mjml2html;
  try {
    mjml2html = require('mjml');
  } catch (e) {
    throw new Error(
      'MJML compiler not found. Install it in your project:\n' +
      '  npm install mjml\n' +
      'Then run again.'
    );
  }

  const mjmlContent = fs.readFileSync(filePath, 'utf8');
  const result = mjml2html(mjmlContent, {
    filePath,
    minify: false,
    validationLevel: 'strict'
  });

  if (result.errors && result.errors.length > 0) {
    console.warn('⚠️  MJML compilation warnings:');
    result.errors.forEach(e => console.warn(`   - ${e.message}`));
  }

  return result.html;
}

/**
 * Compile a React Email template to HTML.
 */
function compileReactEmail(filePath) {
  return compileJSXTemplate(filePath, 'react-email');
}

/**
 * Compile a raw JSX/TSX file to HTML.
 */
function compileJSX(filePath) {
  return compileJSXTemplate(filePath, 'jsx');
}

/**
 * Shared compilation logic for React-based templates.
 * Writes a temporary script to the OS temp directory,
 * imports the user's component, renders it, and returns the HTML.
 */
function compileJSXTemplate(filePath, framework) {
  const absolutePath = path.resolve(filePath);
  const sourceDir = path.dirname(absolutePath);
  const tempScriptPath = path.join(os.tmpdir(), `.email-check-compile-${Date.now()}.mjs`);

  // Build the render script with full paths to react packages
  const renderScript = `
import React from '${require.resolve('react').replace(/\\/g, '\\\\')}';
import { renderToStaticMarkup } from '${require.resolve('react-dom/server').replace(/\\/g, '\\\\')}';

const module = await import('${absolutePath.replace(/'/g, "\\'")}');
const Template = module.default || module;

const props = ${JSON.stringify(getSampleProps(filePath))};
const element = React.createElement(Template, props);
const bodyHTML = renderToStaticMarkup(element);

const fullHTML = '<!DOCTYPE html>\\n<html lang="en">\\n<head><meta charset="UTF-8"></head>\\n<body>' + bodyHTML + '</body>\\n</html>';
console.log(fullHTML);
`;

  try {
    fs.writeFileSync(tempScriptPath, renderScript);

    const result = execSync(`npx tsx ${tempScriptPath}`, {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
      cwd: sourceDir
    });

    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }

    return result;
  } catch (e) {
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }

    const stderr = e.stderr || e.message || '';

    if (stderr.includes('Cannot find module') || stderr.includes('ERR_MODULE_NOT_FOUND')) {
      throw new Error(
        `Missing dependencies. Install the required packages:\n` +
        `  npm install react react-dom\n` +
        `${framework === 'react-email' ? '  npm install @react-email/components\n' : ''}` +
        `  npm install --save-dev tsx\n\n` +
        `Original error: ${stderr}`
      );
    }

    if (stderr.includes('SyntaxError') || stderr.includes('Unexpected token')) {
      throw new Error(
        `Could not parse ${path.basename(filePath)}. Make sure:\n` +
        `  1. The file exports a default React component\n` +
        `  2. JSX syntax is valid\n` +
        `  3. Required imports are installed\n\n` +
        `Original error: ${stderr}`
      );
    }

    throw new Error(`Compilation failed: ${stderr}`);
  }
}

/**
 * Generate sample props for a template component.
 */
function getSampleProps(filePath) {
  return {
    name: 'Sample User',
    email: 'sample@example.com',
    ctaUrl: 'https://example.com',
    ctaText: 'Click Here',
    unsubscribeUrl: 'https://example.com/unsubscribe',
    companyName: 'Acme Inc.',
    year: new Date().getFullYear()
  };
}

module.exports = { compileToHTML };