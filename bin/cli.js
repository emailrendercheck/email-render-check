
const fs = require('fs');
const path = require('path');
const os = require('os');
const { checkEmail } = require('../src/checker');

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
📧 Email Compatibility Checker

Usage:
  email-render-check <file> [options]

Supported file types:
  .html          Plain HTML email (default)
  .mjml          MJML template (requires mjml package)
  .tsx, .jsx     React Email or raw JSX component (requires react, react-dom)
                 Use --framework=react-email for @react-email/components
                 Use --framework=jsx for raw React components

Options:
  --framework=...  html | mjml | react-email | jsx (default: auto-detect)
  --clients=...    Comma-separated list of email clients to check
  --all            Check against all 10 supported clients
  --strict         Show ALL warnings (including minor quirks)
  --json           Output results as JSON (for CI/CD pipelines)
  --fixes          Show fix suggestions for each issue

Available clients:
  outlook-windows, outlook-mac, outlook-web
  gmail-web, gmail-ios, gmail-android
  apple-mail-macos, apple-mail-ios
  yahoo-web, samsung-android

Examples:
  email-render-check email.html --all
  email-render-check newsletter.mjml --all
  email-render-check welcome.tsx --all --fixes
  email-render-check receipt.jsx --framework=jsx --all --strict
  email-render-check campaign.html --clients=outlook-windows,gmail-web --fixes
`);
  process.exit(0);
}

// ── EXTRACT FILE ARGUMENT ──
const fileArg = args.find(a => !a.startsWith('--'));
if (!fileArg) {
  console.error('❌ Error: No input file specified.');
  console.error('   Run: email-render-check --help');
  process.exit(1);
}

if (!fs.existsSync(fileArg)) {
  console.error(`❌ Error: File not found: ${fileArg}`);
  process.exit(1);
}

// ── PARSE FLAGS ──
const frameworkArg = args.find(a => a.startsWith('--framework='));
const clientsArg = args.find(a => a.startsWith('--clients='));
const allClients = args.includes('--all');
const jsonOutput = args.includes('--json');
const strictMode = args.includes('--strict');
const showFixes = args.includes('--fixes');

// ── AUTO-DETECT FRAMEWORK ──
let framework = 'html';
if (frameworkArg) {
  framework = frameworkArg.replace('--framework=', '');
} else {
  const ext = path.extname(fileArg).toLowerCase();
  if (ext === '.mjml') framework = 'mjml';
  else if (ext === '.tsx' || ext === '.jsx') framework = 'react-email';
}

let fileToCheck = fileArg;

// ── COMPILE IF NEEDED ──
if (framework !== 'html') {
  const { compileToHTML } = require('../src/compiler');

  try {
    const compiledHTML = compileToHTML(fileArg, framework);

    // Write compiled HTML to OS temp directory (NOT next to source file)
    const tempFile = path.join(
      os.tmpdir(),
      `email-check-${Date.now()}-${path.basename(fileArg).replace(/\.(tsx?|jsx?|mjml)$/i, '.html')}`
    );
    fs.writeFileSync(tempFile, compiledHTML);

    console.log(`🔧 Compiled ${framework} → HTML (${(compiledHTML.length / 1024).toFixed(1)} KB)\n`);

    fileToCheck = tempFile;
  } catch (e) {
    console.error(`❌ Compilation failed: ${e.message}`);
    process.exit(1);
  }
}

// ── PARSE CLIENTS ──
let clients;
if (allClients) {
  clients = Object.keys(require('../src/checker').CLIENT_LABELS);
} else if (clientsArg) {
  clients = clientsArg.replace('--clients=', '').split(',');
} else {
  clients = ['outlook-windows', 'gmail-web', 'apple-mail-ios'];
}

// ── RUN CHECK ──
console.log(`🔍 Checking ${fileArg}...\n`);
const result = checkEmail(fileToCheck, clients, { strict: strictMode });

// ── CLEAN UP TEMP FILE ──
if (framework !== 'html' && fileToCheck !== fileArg) {
  try {
    fs.unlinkSync(fileToCheck);
  } catch (e) {
    // Silently ignore — OS will clean temp files eventually
  }
}

// ── JSON OUTPUT ──
if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

// ── FORMATTED OUTPUT ──
console.log('═══════════════════════════════════════');
console.log('📊 EMAIL COMPATIBILITY REPORT');
console.log('═══════════════════════════════════════');
console.log(`Source: ${fileArg}${framework !== 'html' ? ` (${framework})` : ''}`);
console.log(`Size: ${(result.emailSize / 1024).toFixed(1)} KB`);
console.log(`CSS Properties found: ${result.summary.totalProperties}`);
console.log(`Errors: ${result.summary.totalErrors}`);
console.log(`Warnings: ${result.summary.totalWarnings}`);
console.log(`Clients checked: ${result.summary.totalClients}`);
if (!strictMode) {
  console.log(`Mode: Standard (use --strict for all warnings)`);
}
console.log('');

// Structural issues
if (result.structuralIssues.length > 0) {
  console.log('── Structural Issues ──');
  for (const issue of result.structuralIssues) {
    const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : '💡';
    console.log(`  ${icon} ${issue.message}`);
  }
  console.log('');
}

// Passed properties
const failedProperties = result.propertyResults.filter(p => p.hasIssues);
const passedCount = result.propertyResults.length - failedProperties.length;

if (passedCount > 0) {
  console.log(`── Passed (${passedCount} properties) ──`);
  const passedProps = result.propertyResults
    .filter(p => !p.hasIssues)
    .map(p => p.property);
  console.log(`  ✅ ${passedProps.join(', ')}`);
  console.log('');
}

// Failed properties
if (failedProperties.length > 0) {
  console.log(`── Issues Found (${failedProperties.length} properties) ──\n`);

  for (const prop of failedProperties) {
    console.log(`📌 ${prop.property}`);
    for (const [client, r] of Object.entries(prop.results)) {
      if (r.status !== 'pass') {
        console.log(`   ${r.label}`);
        console.log(`   ${r.message}`);
        if (showFixes && r.fix) {
          const verifiedBadge = r.fixSource === 'manual' ? '✅' : '🤖 (AI-generated — verify)';
          console.log(`   💡 Fix ${verifiedBadge}: ${r.fix}`);
        }
        console.log('');
      }
    }
  }
}

// Score
const totalChecks = result.summary.totalProperties * result.summary.totalClients;
const failedChecks = result.summary.totalErrors;
const warningChecks = result.summary.totalWarnings;
const passedChecks = totalChecks - failedChecks - warningChecks;
const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

let scoreLabel;
if (score >= 90) scoreLabel = '🟢 Production Ready';
else if (score >= 70) scoreLabel = '🟡 Needs Review';
else scoreLabel = '🔴 Significant Issues';

console.log('═══════════════════════════════════════');
console.log(`📊 Compatibility Score: ${score}/100 ${scoreLabel}`);
console.log('═══════════════════════════════════════');