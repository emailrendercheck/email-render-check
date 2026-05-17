const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const FEATURES_DIR = './caniemail-data';
const OUTPUT_FILE = './data/email-css-support.json';

// Key clients we care about for email development
const TARGET_CLIENTS = [
  { family: 'outlook', platform: 'windows', key: 'outlook_windows' },
  { family: 'outlook', platform: 'macos', key: 'outlook_mac' },
  { family: 'outlook', platform: 'outlook-com', key: 'outlook_web' },
  { family: 'gmail', platform: 'desktop-webmail', key: 'gmail_web' },
  { family: 'gmail', platform: 'ios', key: 'gmail_ios' },
  { family: 'gmail', platform: 'android', key: 'gmail_android' },
  { family: 'apple-mail', platform: 'macos', key: 'apple_mail_macos' },
  { family: 'apple-mail', platform: 'ios', key: 'apple_mail_ios' },
  { family: 'yahoo', platform: 'desktop-webmail', key: 'yahoo_web' },
  { family: 'samsung-email', platform: 'android', key: 'samsung_android' },
];

function checkVersions(versionsObj) {
  const values = Object.values(versionsObj);
  if (values.length === 0) return 'unknown';
  
  const allY = values.every(v => v === 'y');
  const allN = values.every(v => v === 'n');
  const allU = values.every(v => v === 'u');
  
  if (allY) return 'supported';
  if (allN) return 'not_supported';
  if (allU) return 'unknown';          // ← Handle 'u'
  
  // Mixed values: check for any 'n' or 'a'
  const hasN = values.some(v => v === 'n');
  const hasA = values.some(v => v.startsWith('a'));
  const hasU = values.some(v => v === 'u');
  
  if (hasN && !hasA && !hasU) return 'not_supported';
  return 'partial';  // Any mix of y/n/a/u = partial support
}
function getClientSupport(stats, family, platform) {
  const familyData = stats?.[family];
  if (!familyData) return 'unknown';

  // Direct platform match
  if (familyData[platform]) {
    return checkVersions(familyData[platform]);
  }

  // Try to find the platform with a different key
  // e.g., 'gmail' might not have 'desktop-webmail' as a key
  for (const [plat, versions] of Object.entries(familyData)) {
    if (plat === platform) {
      return checkVersions(versions);
    }
  }

  return 'unknown';
}

function buildFullDatabase() {
  const database = {};
  let totalFiles = 0;
  let filesWithFailures = 0;
  let skippedFiles = 0;

  // Read all files in the features directory
  const files = fs.readdirSync(FEATURES_DIR).filter(f => f.endsWith('.md'));

  for (const filename of files) {
    totalFiles++;
    const filePath = path.join(FEATURES_DIR, filename);

    let raw;
    try {
      raw = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      console.warn(`⚠️  Cannot read: ${filename} — skipping`);
      skippedFiles++;
      continue;
    }

    let parsed;
    try {
      parsed = matter(raw);
    } catch (err) {
      console.warn(`⚠️  Failed to parse: ${filename} — skipping`);
      skippedFiles++;
      continue;
    }

    const stats = parsed.data.stats;
    if (!stats) {
      skippedFiles++;
      continue;
    }

    // Extract property name from filename
    // "css-min-width.md" → "min-width"
    // "html-img-alt.md" → "img-alt"
    let propertyName = filename.replace(/\.md$/, '');

    const clients = {};
    let hasAnyFailure = false;

    for (const client of TARGET_CLIENTS) {
      const support = getClientSupport(stats, client.family, client.platform);
      clients[client.key] = support;

      if (support === 'not_supported' || support === 'partial') {
        hasAnyFailure = true;
      }
    }

    // Store ALL properties, even fully supported ones
    // This gives you a complete reference
    database[propertyName] = {
      title: parsed.data.title || propertyName,
      category: parsed.data.category || 'unknown',
      description: parsed.data.description || '',
      last_test_date: parsed.data.last_test_date || null,
      clients: clients
    };

    if (hasAnyFailure) {
      filesWithFailures++;
    }
  }

  // Ensure output directory exists
  if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2));

  console.log(`\n📊 Summary:`);
  console.log(`   Total files found: ${files.length}`);
  console.log(`   Successfully parsed: ${totalFiles - skippedFiles}`);
  console.log(`   Skipped: ${skippedFiles}`);
  console.log(`   In database: ${Object.keys(database).length}`);
  console.log(`   Properties with issues: ${filesWithFailures}`);
  console.log(`   Fully supported everywhere: ${Object.keys(database).length - filesWithFailures}`);
  console.log(`\n✅ Full database written to: ${OUTPUT_FILE}`);
}

buildFullDatabase();