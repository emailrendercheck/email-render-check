# email-render-check

**Catch email rendering bugs before they hit the inbox.**

A CLI tool that checks your email HTML against 308 CSS/HTML properties across 10 email clients — and tells you exactly what will break and how to fix it.

```bash
npx email-render-check ./emails/welcome.html --all --fixes

What it does?
Feature	
📧 CSS compatibility	Checks 308 properties against Outlook, Gmail, Apple Mail, Yahoo, Samsung Email
🔧 Framework support	Plain HTML, MJML, React Email (TSX/JSX), raw JSX
💡 Fix suggestions	Every issue comes with a specific, actionable fix
♿ Accessibility checks	Detects missing alt text, lang attributes, role attributes
📊 Compatibility score	0-100 score with 🟢🟡🔴 rating
🤖 CI/CD ready	JSON output mode for GitHub Actions, GitLab CI, etc.
Quick start
bash
# Run directly (no install needed)
npx email-render-check ./your-email.html --all --fixes

# Or install globally
npm install -g email-render-check
email-render-check ./your-email.html --all --fixes
Supported frameworks
Framework	File extension	Flag
Plain HTML	.html	(auto-detected)
MJML	.mjml	(auto-detected)
React Email	.tsx, .jsx	(auto-detected)
Raw JSX	.jsx	--framework=jsx
bash
# Auto-detects framework from file extension
email-render-check newsletter.mjml --all --fixes
email-render-check welcome.tsx --all --fixes

# Or specify explicitly
email-render-check template.jsx --framework=jsx --all --fixes
Example output
bash
$ email-render-check welcome-email.html --all --fixes

📊 EMAIL COMPATIBILITY REPORT
Source: welcome-email.html
Size: 3.2 KB
CSS Properties found: 15
Errors: 22
Warnings: 10
Clients checked: 10

── Passed (8 properties) ──
  ✅ background-color, padding, font-size, line-height, margin, text-decoration

── Issues Found (7 properties) ──

📌 border-radius
   ⚠️ Partial
   border-radius has PARTIAL support in Outlook (Windows). Test thoroughly.
   💡 Fix ✅: Outlook on Windows (2007-2019) ignores `border-radius`. Renders as square corners. Accept the square fallback, or use images for rounded corners.

📌 animation
   ❌ Not Supported
   animation is NOT supported in Outlook (Windows).
   💡 Fix ✅: CSS animations are not supported in Outlook on Windows. The first keyframe (or no animation state) will display. Design for the static state as the primary experience.

📌 box-shadow
   ❌ Not Supported
   box-shadow is NOT supported in Gmail (Web).
   💡 Fix ✅: Gmail strips `box-shadow`. Use `border` as fallback.

📊 Compatibility Score: 79/100 🟡 Needs Review
Options
Flag	Description
--all	Check against all 10 email clients
--clients=outlook-windows,gmail-web	Check specific clients
--fixes	Show fix suggestions for each issue
--strict	Show ALL warnings (including minor quirks)
--json	Output as JSON (for CI/CD pipelines)
--framework=react-email	Specify framework explicitly
--help	Show help
Available email clients
Client	Flag
Outlook (Windows)	outlook-windows
Outlook (macOS)	outlook-mac
Outlook (Web)	outlook-web
Gmail (Web)	gmail-web
Gmail (iOS)	gmail-ios
Gmail (Android)	gmail-android
Apple Mail (macOS)	apple-mail-macos
Apple Mail (iOS)	apple-mail-ios
Yahoo Mail (Web)	yahoo-web
Samsung Email (Android)	samsung-android
CI/CD integration
bash
# JSON output for automated pipelines
email-render-check ./email.html --all --json > report.json

# Check specific clients
email-render-check ./email.html --clients=outlook-windows,gmail-web --json
Requirements
Node.js >= 18

For MJML files: mjml package installed in your project

For TSX/JSX files: react and react-dom installed in your project

For TypeScript files: tsx package (auto-installed via npx if needed)

Why this exists
Email client rendering is broken. Outlook uses Microsoft Word's HTML engine. Gmail strips embedded CSS. Dark mode breaks layouts. Teams spend hours manually testing emails across clients.

Existing tools (Litmus, Email on Acid) cost $500+/month and aren't built for developers. They lack CI/CD integration, CLI access, and fix suggestions.

email-render-check puts email compatibility checking where it belongs — in your terminal, in your CI/CD pipeline, and in your workflow.

License
MIT