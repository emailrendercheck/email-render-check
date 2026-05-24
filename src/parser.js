const cheerio = require('cheerio');
const fs = require('fs');

/**
 * Parse an email HTML file and extract all CSS properties
 * @param {string} filePath - Path to the HTML file
 * @returns {Object} - Extracted CSS properties and metadata
 */
function parseEmailHTML(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html);

  const result = {
    file: filePath,
    inlineStyles: [],      // style="color: red; font-size: 14px"
    styleBlocks: [],       // <style> .button { color: red; } </style>
    allProperties: [],     // Every unique CSS property found
    htmlElements: [],      // All HTML elements used
    emailSize: Buffer.byteLength(html, 'utf8'),
    issues: []             // Structural issues found
  };

  // 1. Extract inline styles (style="...")
  $('[style]').each((i, el) => {
    const styleAttr = $(el).attr('style');
    const tag = el.tagName;
    const classes = $(el).attr('class') || '';
    
    const properties = parseStyleString(styleAttr);
    
    for (const prop of properties) {
      result.inlineStyles.push({
        tag,
        classes,
        property: prop.property,
        value: prop.value,
        line: html.substring(0, html.indexOf(styleAttr)).split('\n').length
      });
      
      // Add to unique properties list
      if (!result.allProperties.find(p => p.property === prop.property)) {
        result.allProperties.push({
          property: prop.property,
          source: 'inline'
        });
      }
    }
  });

  // 2. Extract <style> blocks
  $('style').each((i, el) => {
    const cssText = $(el).text();
    const rules = parseCSSRules(cssText);
    
    result.styleBlocks.push({
      index: i,
      rules: rules,
      location: el.tagName === 'style' && $(el).parent().length ? 
                ($(el).parent().get(0).tagName || 'head') : 'unknown'
    });
    
    for (const rule of rules) {
      for (const prop of rule.properties) {
        if (!result.allProperties.find(p => p.property === prop.property)) {
          result.allProperties.push({
            property: prop.property,
            source: 'style-block'
          });
        }
      }
    }
  });

  // 3. Extract all HTML elements used
  $('*').each((i, el) => {
    const tag = el.tagName;
    if (!result.htmlElements.includes(tag)) {
      result.htmlElements.push(tag);
    }
  });

  // 4. Check for structural issues
  checkStructuralIssues($, html, result);

  return result;
}

/**
 * Parse a CSS style string into property/value pairs
 * "color: red; font-size: 14px" → [{property: "color", value: "red"}, ...]
 */
function parseStyleString(styleString) {
  if (!styleString) return [];
  
  const properties = [];
  const declarations = styleString.split(';').filter(d => d.trim());
  
  for (const decl of declarations) {
    const colonIndex = decl.indexOf(':');
    if (colonIndex === -1) continue;
    
    const property = decl.substring(0, colonIndex).trim();
    const value = decl.substring(colonIndex + 1).trim();
    
    if (property && value) {
      properties.push({ property, value });
    }
  }
  
  return properties;
}

/**
 * Parse CSS rules from a <style> block
 * ".button { color: red; } h1 { font-size: 20px; }" → structured rules
 */
function parseCSSRules(cssText) {
  if (!cssText) return [];
  
  const rules = [];
  
  // Remove comments
  const cleanCSS = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Match selector + declaration blocks
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;
  
  while ((match = ruleRegex.exec(cleanCSS)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2].trim();
    const properties = parseStyleString(declarations);
    
    rules.push({
      selector,
      properties
    });
  }
  
  return rules;
}

/**
 * Check for common email HTML structural issues
 */
function checkStructuralIssues($, html, result) {
  // Check if <style> is in <head>
  $('style').each((i, el) => {
    const parent = $(el).parent().get(0);
    if (parent && parent.tagName !== 'head') {
      result.issues.push({
        type: 'warning',
        message: '<style> block found outside <head>. Gmail may strip it.'
      });
    }
  });

  // Check for <table> with role="presentation"
  $('table').each((i, el) => {
    const role = $(el).attr('role');
    if (!role || role !== 'presentation') {
      // Only flag layout tables (those without <th> or <caption>)
      const hasHeader = $(el).find('th').length > 0;
      const hasCaption = $(el).find('caption').length > 0;
      if (!hasHeader && !hasCaption) {
        result.issues.push({
          type: 'suggestion',
          message: 'Layout <table> missing role="presentation". Add for better accessibility.'
        });
      }
    }
  });

  // Check for <img> without alt
  $('img').each((i, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined || alt === '') {
      result.issues.push({
        type: 'warning',
        message: '<img> tag missing alt attribute. Required for accessibility (EAA compliance).'
      });
    }
  });

  // Check email size (Gmail clips at 102KB)
  if (result.emailSize > 102400) {
    result.issues.push({
      type: 'error',
      message: `Email size is ${(result.emailSize / 1024).toFixed(1)}KB. Gmail clips emails over 102KB.`
    });
  }

  // Check for <html> lang attribute
  const htmlTag = $('html');
  if (htmlTag.length && !htmlTag.attr('lang')) {
    result.issues.push({
      type: 'warning',
      message: '<html> tag missing lang attribute. Required for accessibility.'
    });
  }
}

module.exports = { parseEmailHTML, parseStyleString };