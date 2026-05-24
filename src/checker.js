// NEW (top of checker.js):
const path = require('path');
const supportDB = require(path.join(__dirname, '..', 'data', 'email-css-support.json'));
const { getFixSuggestion } = require('./ai-fixes');
const { isMostlySafeProperty } = require('./fixes');
const CLIENT_MAP = {
  'outlook-windows': 'outlook_windows',
  'outlook-mac': 'outlook_mac',
  'outlook-web': 'outlook_web',
  'gmail-web': 'gmail_web',
  'gmail-ios': 'gmail_ios',
  'gmail-android': 'gmail_android',
  'apple-mail-macos': 'apple_mail_macos',
  'apple-mail-ios': 'apple_mail_ios',
  'yahoo-web': 'yahoo_web',
  'samsung-android': 'samsung_android',
};

const CLIENT_LABELS = {
  'outlook-windows': 'Outlook (Windows)',
  'outlook-mac': 'Outlook (macOS)',
  'outlook-web': 'Outlook (Web)',
  'gmail-web': 'Gmail (Web)',
  'gmail-ios': 'Gmail (iOS)',
  'gmail-android': 'Gmail (Android)',
  'apple-mail-macos': 'Apple Mail (macOS)',
  'apple-mail-ios': 'Apple Mail (iOS)',
  'yahoo-web': 'Yahoo Mail (Web)',
  'samsung-android': 'Samsung Email (Android)',
};

function checkProperty(property, targetClients, options = {}) {
  const { strict = false } = options;
  
  let entry = supportDB[property];
  if (!entry) entry = supportDB[`css-${property}`];
  if (!entry) entry = supportDB[`html-${property}`];

  if (!entry) {
    return {
      property,
      status: 'unknown',
      message: `No compatibility data available for "${property}".`,
      hasIssues: false
    };
  }

  const results = {};
  let hasIssues = false;

  for (const client of targetClients) {
    const dbKey = CLIENT_MAP[client];
    if (!dbKey) continue;

    const support = entry.clients?.[dbKey] || 'unknown';

    if (support === 'supported') {
      results[client] = { status: 'pass', label: '✅ Supported' };
    } else if (support === 'not_supported') {
      hasIssues = true;
      //OLD:
    //const fix = getFixSuggestion(property, dbKey, CLIENT_LABELS[client]);
// NEW:
const fixResult = getFixSuggestion(property, dbKey, CLIENT_LABELS[client]);
const fix = fixResult ? fixResult.fix : null;
const fixSource = fixResult ? fixResult.source : 'unknown';
      results[client] = {
        status: 'fail',
        label: '❌ Not Supported',
        message: `${property} is NOT supported in ${CLIENT_LABELS[client]}.`,
        fix,
        fixSource
      };
    } else if (support === 'partial') {
      // In non-strict mode, suppress warnings for "mostly safe" properties
      if (!strict && isMostlySafeProperty(property)) {
        results[client] = { status: 'pass', label: '✅ Supported (minor quirks)' };
      } else {
        hasIssues = true;
        //OLD:
        //const fix = getFixSuggestion(property, dbKey, CLIENT_LABELS[client]);
    // NEW: 
const fixResult = getFixSuggestion(property, dbKey, CLIENT_LABELS[client]);
const fix = fixResult ? fixResult.fix : null;
const fixSource = fixResult ? fixResult.source : 'unknown';
        results[client] = {
          status: 'warn',
          label: '⚠️ Partial',
          message: `${property} has PARTIAL support in ${CLIENT_LABELS[client]}. Test thoroughly.`,
          fix,
          fixSource

        };
      }
    } else if (support === 'unknown') {
      hasIssues = true;
      results[client] = {
        status: 'warn',
        label: '❓ Untested',
        message: `${property} has NOT BEEN TESTED in ${CLIENT_LABELS[client]}. Verify manually.`
      };
    }
  }

  return {
    property,
    title: entry.title || property,
    category: entry.category || 'unknown',
    results,
    hasIssues
  };
}

function checkEmail(filePath, targetClients, options = {}) {
  const { parseEmailHTML } = require('./parser');
  const parsed = parseEmailHTML(filePath);

  const propertyResults = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const { property } of parsed.allProperties) {
    const result = checkProperty(property, targetClients, options);
    propertyResults.push(result);

    if (result.hasIssues) {
      for (const client of Object.keys(result.results)) {
        const r = result.results[client];
        if (r.status === 'fail') totalErrors++;
        if (r.status === 'warn') totalWarnings++;
      }
    }
  }

  return {
    file: filePath,
    properties: parsed.allProperties.map(p => p.property),
    htmlElements: parsed.htmlElements,
    emailSize: parsed.emailSize,
    structuralIssues: parsed.issues,
    propertyResults,
    summary: {
      totalProperties: parsed.allProperties.length,
      totalErrors,
      totalWarnings,
      totalClients: targetClients.length
    }
  };
}

module.exports = { checkProperty, checkEmail, CLIENT_LABELS };