/**
 * AI fallback for fix suggestions.
 * 
 * HOW IT WORKS:
 * 1. If a fix exists in fixes.js, use that (100% trusted).
 * 2. If no fix exists, generate one using pattern matching + AI.
 * 3. AI-generated fixes are clearly flagged as unverified.
 * 
 * LATER: Replace the pattern-matching fallback with an actual LLM API call
 * using few-shot prompting with your manual fixes as examples.
 */

const { getFixSuggestion: getManualFix } = require('./fixes');

/**
 * Pattern-based fallback for properties not in the manual fixes database.
 * This is a rules engine that generates reasonable suggestions based on
 * property categories and client patterns.
 */
function generateAIFix(property, clientKey, clientLabel) {
  // Patterns for properties we haven't manually defined yet
  const patterns = [
    {
      // Any property ending in "-radius"
      match: (prop) => prop.endsWith('-radius'),
      generate: (prop, client) => 
        `${prop} is not fully supported in ${client}. Rounded corners will render as square. Accept the square fallback or use images with pre-rounded corners.`
    },
    {
      // Any property starting with "grid"
      match: (prop) => prop.startsWith('grid'),
      generate: (prop, client) =>
        `CSS Grid (${prop}) is not supported in ${client}. Use <table> layout instead.`
    },
    {
      // Flexbox-related
      match: (prop) => prop.includes('flex'),
      generate: (prop, client) =>
        `Flexbox properties like ${prop} are not supported in ${client}. Use <table> layout with inline-block fallback.`
    },
    {
      // Transition/animation
      match: (prop) => prop.startsWith('transition'),
      generate: (prop, client) =>
        `CSS transitions are not supported in ${client}. Elements will appear in their final state immediately. Design for the static state.`
    },
    {
      // 3D transforms
      match: (prop) => prop.includes('3d') || prop.includes('perspective'),
      generate: (prop, client) =>
        `3D CSS properties like ${prop} are not supported in any email client. Use pre-rendered images for 3D effects.`
    },
    {
      // Blend modes
      match: (prop) => prop.includes('blend'),
      generate: (prop, client) =>
        `CSS blend modes are not supported in ${client}. Use pre-composited images instead.`
    },
    {
      // Custom properties (CSS variables)
      match: (prop) => prop.startsWith('--'),
      generate: (prop, client) =>
        `CSS custom properties (variables) are not supported in ${client}. Use hardcoded values or preprocessor variables at build time.`
    },
    {
      // WebKit-specific properties
      match: (prop) => prop.startsWith('-webkit-'),
      generate: (prop, client) =>
        `${prop} is a WebKit-specific property. It may work in Apple Mail and some iOS clients but will fail in Outlook and Gmail. Provide a standard CSS fallback.`
    }
  ];

  // Try pattern matching first
  for (const pattern of patterns) {
    if (pattern.match(property)) {
      return {
        fix: pattern.generate(property, clientLabel),
        source: 'ai-pattern',
        verified: false
      };
    }
  }

  // Generic fallback
  return {
    fix: `"${property}" has compatibility issues in ${clientLabel}. Test with a real device screenshot before sending. Consider removing this property or providing a simpler fallback.`,
    source: 'ai-generic',
    verified: false
  };
}

/**
 * Get a fix suggestion — manual first, AI fallback second.
 * @param {string} property 
 * @param {string} clientKey 
 * @param {string} clientLabel 
 * @returns {Object} { fix: string, source: 'manual' | 'ai-pattern' | 'ai-generic', verified: boolean }
 */
function getFixSuggestion(property, clientKey, clientLabel) {
  // 1. Try manual fix first (your domain expertise)
  const manualFix = getManualFix(property, clientKey, clientLabel);
  
  if (manualFix) {
    return {
      fix: manualFix,
      source: 'manual',
      verified: true
    };
  }

  // 2. Fall back to AI-generated suggestion
  return generateAIFix(property, clientKey, clientLabel);
}

module.exports = { getFixSuggestion };