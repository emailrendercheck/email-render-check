// Fix suggestions based on real email development experience
// Each entry maps a CSS property to client-specific fixes

const FIXES = {
  // ── LAYOUT ──
  'min-width': {
    'outlook_windows': 'Use `width` property with a fixed pixel value instead. Outlook on Windows ignores min-width and max-width. Example: `width: 200px;`',
    'outlook_mac': null,
    default: 'Use `width` with a fixed value for Outlook compatibility.'
  },
  'max-width': {
    'outlook_windows': 'Use `width` with a fixed pixel value instead, or wrap content in a table with a fixed width. For responsive emails, use conditional MSO comments.',
    'apple_mail_ios': 'Apple Mail iOS sometimes ignores max-width on <img> tags. Add `width: 100%;` as fallback.',
    default: 'Use conditional MSO comments for Outlook, and `width: 100%` fallback for other clients.'
  },
  'display': {
    'outlook_windows': 'Outlook Windows only supports `display: none` for hiding elements. Values like `flex`, `grid`, `inline-block`, and `inline-flex` are not supported. Use `<table>` for layout, and `display: none !important;` with an MSO conditional to hide from Outlook.',
    'gmail_ios': 'Gmail iOS strips `display: flex` and `display: grid`. Use table-based layouts or accept graceful degradation.',
    'gmail_android': 'Gmail Android strips `display: flex` and `display: grid`. Use table-based layouts.',
    'yahoo_web': 'Yahoo Mail strips `display: flex`. Use inline-block or table fallbacks.',
    default: 'Avoid `display: flex` and `display: grid` in email. Use `<table>` layouts with `display: inline-block` for simpler layouts.'
  },

  // ── POSITIONING ──
  'position': {
    'outlook_windows': '`position` property is not supported in Outlook on Windows. All elements render as `position: static`. Use `<table>` with `padding` and `align` attributes for positioning.',
    'gmail_web': 'Gmail strips `position: relative`, `position: absolute`, and `position: fixed`. Elements will stack in document order.',
    'gmail_ios': 'Gmail iOS strips positioning. Use table-based layout instead.',
    'gmail_android': 'Gmail Android strips positioning. Use table-based layout instead.',
    'apple_mail_macos': 'Apple Mail supports basic positioning but may render inconsistently. Test with real content.',
    'apple_mail_ios': 'Apple Mail iOS supports positioning but may shift on different screen sizes. Use percentage-based offsets.',
    'yahoo_web': 'Yahoo Mail has inconsistent positioning support. Prefer table layouts.',
    'samsung_android': 'Samsung Email has inconsistent positioning. Test thoroughly.',
    'outlook_mac': 'Outlook on macOS supports positioning but may clip absolutely positioned elements. Add overflow: visible.',
    'outlook_web': 'Outlook Web supports basic positioning. Test in dark mode.',
    default: 'Avoid `position` in email. Use table-based layouts with `padding`, `margin`, and `align` attributes for positioning.'
  },
  'z-index': {
    'outlook_windows': '`z-index` has no effect in Outlook on Windows. Reorder elements in the HTML source order instead. Place visually "top" elements later in the DOM.',
    'gmail_web': 'Gmail strips `z-index`. Reorder elements in the HTML source order.',
    'gmail_ios': 'Gmail iOS strips `z-index`. Reorder elements in the HTML source.',
    'gmail_android': 'Gmail Android strips `z-index`. Reorder elements in the HTML source.',
    default: 'Avoid `z-index` in email. Reorder elements in the HTML source order to control stacking.'
  },
  'float': {
    'outlook_windows': '`float` has inconsistent support in Outlook on Windows. Use `<table>` with `align="left"` or `align="right"` on `<td>` elements instead.',
    'gmail_ios': 'Gmail iOS may collapse floated elements. Add `overflow: hidden` on the container or use table-based alignment.',
    'gmail_android': 'Gmail Android may ignore floats. Use table alignment instead.',
    'apple_mail_macos': 'Apple Mail supports float but may wrap unexpectedly. Add clearfix after floated elements.',
    'apple_mail_ios': 'Apple Mail iOS supports float. Use `clear: both` on following elements.',
    'yahoo_web': 'Yahoo Mail has inconsistent float support. Use table alignment.',
    default: 'Use `<table>` with `align` attribute or `display: inline-block` instead of float for email layout.'
  },

  // ── VISUAL EFFECTS ──
  'background-image': {
    'outlook_windows': 'Outlook on Windows (2007-2019) does not support CSS background-image. Use VML (Vector Markup Language) as a fallback. Add this inside the element: `<!--[if gte mso 9]><v:rect fill="true" stroke="false" style="width:600px;height:300px;"><v:fill type="frame" src="IMAGE_URL" /></v:rect><![endif]-->`',
    'gmail_web': 'Gmail sometimes strips background-image from `<style>` blocks. Use inline styles: `style="background-image: url(...);"` and always provide a solid background-color fallback.',
    'gmail_ios': 'Gmail iOS strips background-image in some cases. Apply inline and add `background-color` fallback.',
    'gmail_android': 'Gmail Android may strip background-image. Provide `background-color` fallback.',
    'yahoo_web': 'Yahoo Mail strips background-image in some configurations. Use inline style with fallback color.',
    'samsung_android': 'Samsung Email may not render background-image. Always set `background-color` as fallback.',
    default: 'Always pair `background-image` with a `background-color` fallback. For Outlook Windows, add a VML conditional fallback.'
  },
  'border-radius': {
    'outlook_windows': 'Outlook on Windows (2007-2019) ignores `border-radius`. Renders as square corners. Accept the square fallback, or use images for rounded corners.',
    'yahoo_web': 'Yahoo Mail may ignore border-radius on certain elements. Accept square corners as fallback.',
    default: '`border-radius` is not supported in older Outlook. Accept square corners as graceful degradation.'
  },
  'box-shadow': {
    'outlook_windows': '`box-shadow` is not supported in Outlook on Windows. Use a solid border instead: `border: 1px solid #ddd;` or use a background image for the shadow effect.',
    'outlook_web': 'Outlook Web strips `box-shadow` in some configurations. Add a border as visual fallback.',
    'gmail_web': 'Gmail strips `box-shadow`. Use `border` as fallback.',
    'gmail_ios': 'Gmail iOS partially strips box-shadow. Add border fallback.',
    'gmail_android': 'Gmail Android may strip box-shadow. Use border instead.',
    'yahoo_web': 'Yahoo Mail strips `box-shadow` entirely. Use `border` for visual separation.',
    default: 'Avoid `box-shadow` in email. Use `border` properties for visual depth. For essential shadows, use a repeating background image.'
  },
  'text-shadow': {
    'outlook_windows': '`text-shadow` is not supported in Outlook on Windows. Text will render flat. Use `color` and `font-weight` for emphasis instead.',
    'outlook_web': 'Outlook Web strips text-shadow. Text renders flat.',
    'outlook_mac': 'Outlook macOS has partial text-shadow support. Test with light/dark values.',
    'gmail_web': 'Gmail strips `text-shadow`. Use font styling for emphasis.',
    'gmail_ios': 'Gmail iOS strips text-shadow. Use color and bold for emphasis.',
    'gmail_android': 'Gmail Android strips text-shadow. Use color and bold instead.',
    default: 'Avoid `text-shadow` in email. Use `color`, `font-weight`, and `letter-spacing` for text emphasis.'
  },
  'opacity': {
    'outlook_windows': '`opacity` is not supported in Outlook on Windows. Use a semi-transparent PNG image instead, or use `rgba()` colors on backgrounds (with a solid fallback color for Outlook).',
    'yahoo_web': 'Yahoo Mail has inconsistent opacity support. Use rgba() or semi-transparent PNG.',
    default: 'Use `rgba()` color values with a solid color fallback, or semi-transparent PNG images instead of `opacity`.'
  },
  'filter': {
    'outlook_windows': 'CSS `filter` is completely unsupported in Outlook on Windows. Use pre-processed images for effects like blur, grayscale, or brightness.',
    'outlook_web': 'Outlook Web strips filter effects.',
    'outlook_mac': 'Outlook macOS has limited filter support. Test grayscale and blur specifically.',
    'gmail_web': 'Gmail strips all CSS filters.',
    'gmail_ios': 'Gmail iOS strips filter effects.',
    'gmail_android': 'Gmail Android strips filter effects.',
    'yahoo_web': 'Yahoo Mail strips filter effects.',
    default: 'Avoid CSS `filter` in email. Apply effects to images before embedding them.'
  },

  // ── ANIMATION / TRANSITIONS ──
  'animation': {
    'outlook_windows': 'CSS animations are not supported in Outlook on Windows. The first keyframe (or no animation state) will display. Design for the static state as the primary experience.',
    'outlook_mac': 'Outlook macOS has limited animation support. Only simple opacity and transform animations may work.',
    'outlook_web': 'Outlook Web strips CSS animations.',
    'gmail_web': 'Gmail strips all CSS animations. Email will render in its initial/static state.',
    'gmail_ios': 'Gmail iOS strips animations. Static state only.',
    'gmail_android': 'Gmail Android strips animations. Static state only.',
    'yahoo_web': 'Yahoo Mail strips animations. Static state only.',
    default: 'Avoid CSS animations in email. Only Apple Mail and Samsung Email support them reliably. Design the static state as the primary experience.'
  },
  'transform': {
    'outlook_windows': '`transform` is not supported in Outlook on Windows. Elements will render untransformed. Do not rely on rotation, scale, or skew for critical content.',
    'outlook_mac': 'Outlook macOS partially supports transform. Simple 2D transforms may work; 3D transforms will not.',
    'outlook_web': 'Outlook Web strips transform.',
    'gmail_web': 'Gmail strips all transform functions.',
    'gmail_ios': 'Gmail iOS strips transforms.',
    'gmail_android': 'Gmail Android strips transforms.',
    'yahoo_web': 'Yahoo Mail strips transforms.',
    default: 'Avoid CSS `transform` in email. Use pre-rotated/scaled images instead.'
  },

  // ── TYPOGRAPHY ──
  'white-space': {
    'outlook_windows': '`white-space` is not supported in Outlook on Windows. Use `&nbsp;` for non-breaking spaces and `<br>` tags for line breaks. Use `<table>` columns for text alignment.',
    'outlook_mac': 'Outlook macOS has partial white-space support. `nowrap` may work; test thoroughly.',
    'samsung_android': 'Samsung Email ignores white-space in some versions. Use `&nbsp;` and `<br>` for spacing control.',
    default: 'Use `&nbsp;` for non-breaking spaces, `<br>` for forced line breaks, and table cells for text layout control.'
  },
  'word-break': {
    'yahoo_web': 'Yahoo Mail strips `word-break`. Long words may overflow containers. Use `<wbr>` tags for optional break points or insert soft hyphens.',
    default: 'Use `&shy;` (soft hyphen) for long words, or wrap critical text in `<wbr>` tags for safe breaking points.'
  },
  'overflow': {
    'outlook_windows': '`overflow` is not supported in Outlook on Windows. Content will always be fully visible and may break layout. Trim long content server-side, or use `text-overflow: ellipsis` with fixed width (which also falls back to visible overflow in Outlook).',
    default: 'Avoid relying on `overflow: hidden` or `overflow: scroll` in email. Trim content to fit, or accept that overflow will be visible in unsupported clients.'
  },
  'visibility': {
    'outlook_windows': '`visibility: hidden` is not supported in Outlook on Windows. The element will remain visible. Use `display: none` instead to hide elements from Outlook. Wrap Outlook-targeted hide rules in MSO conditional comments.',
    'gmail_web': 'Gmail strips `visibility: hidden` in some configurations. Use `display: none` as a more reliable alternative.',
    'gmail_ios': 'Gmail iOS may ignore visibility. Use `display: none` for hiding.',
    'gmail_android': 'Gmail Android may ignore visibility. Use `display: none`.',
    default: 'Use `display: none` instead of `visibility: hidden` to hide elements in email. For Outlook, wrap in `<!--[if !mso]><!-->` conditional comments.'
  },

  // ── MISC ──
  'cursor': {
    'outlook_mac': '`cursor` is not supported in Outlook on macOS.',
    'outlook_web': '`cursor` is not supported in Outlook Web.',
    default: '`cursor` is decorative in email and not supported in many clients. This is safe to ignore for email.'
  },
  'resize': {
    'outlook_windows': '`resize` has no effect in Outlook on Windows. Textarea and input elements cannot be resized. Set a fixed height/width that fits the expected content.',
    'gmail_android': 'Gmail Android strips resize. Elements render at their default/fixed size.',
    'apple_mail_ios': 'Apple Mail iOS strips resize. Use fixed dimensions.',
    default: '`resize` is for form elements. In email, form support is already limited. Use fixed-size inputs.'
  },
  'outline': {
    'outlook_windows': '`outline` is not supported in Outlook on Windows. Use `border` instead for focus indicators or visual emphasis.',
    default: 'Use `border` instead of `outline` for visual emphasis on elements in email.'
  },
  'object-fit': {
    'outlook_windows': '`object-fit` is not supported in Outlook on Windows. Images will render at their natural aspect ratio. Crop or resize images to the exact dimensions before embedding.',
    'yahoo_web': 'Yahoo Mail strips object-fit. Images render at natural size.',
    default: 'Crop and resize images to the exact display dimensions before embedding. Do not rely on `object-fit` in email.'
  },
  'clip-path': {
    'outlook_windows': '`clip-path` is not supported in Outlook on Windows. Use pre-cropped images instead of CSS clipping.',
    'outlook_web': 'Outlook Web strips clip-path.',
    'gmail_web': 'Gmail strips clip-path.',
    'gmail_ios': 'Gmail iOS strips clip-path.',
    'gmail_android': 'Gmail Android strips clip-path.',
    'yahoo_web': 'Yahoo Mail strips clip-path.',
    default: 'Use pre-cropped images instead of `clip-path`. CSS clipping is unreliable in email.'
  },
  'cursor': {
    'outlook_windows': null, // Safe to ignore
    'outlook_web': null,
    'outlook_mac': null,
    default: '`cursor` has no functional impact in email. It can be safely ignored.'
  },
'margin': {
  'outlook_windows': 'Outlook Windows ignores margin on certain elements like `<td>` and `<li>`. Use `padding` on `<td>` elements or `cellspacing` on `<table>` instead.',
  'outlook_mac': 'Margin works in Outlook macOS. Partial flag is likely from older test data. Safe to use.',
  'outlook_web': 'Margin works in Outlook Web. Safe to use.',
  'gmail_web': 'Margin works in Gmail Web for most elements. For `<img>` tags, use `display: block` with margin.',
  'gmail_ios': 'Margin works in Gmail iOS. Safe to use on block elements.',
  'gmail_android': 'Margin works in Gmail Android. Safe to use on block elements.',
  'yahoo_web': 'Margin works in Yahoo Mail. Safe to use.',
  default: 'Margin is widely supported in email. Use `padding` on `<td>` elements for more consistent spacing in Outlook.'
},
'font-size': {
  'outlook_windows': 'Outlook Windows supports font-size but may render 1-2px larger than other clients due to different font rendering. Use web-safe fonts and test at multiple sizes.',
  'yahoo_web': 'Yahoo Mail supports font-size. Partial flag is from older test data.',
  'samsung_android': 'Samsung Email supports font-size but may scale text differently on high-DPI screens. Use `-webkit-text-size-adjust: 100%;` to prevent auto-scaling.',
  default: 'font-size is widely supported in email. Use `px` units for consistency across clients.'
},
'flex-direction': {
  'outlook_windows': 'Flexbox is not supported in Outlook on Windows. `flex-direction` will be ignored. Use `<table>` layout instead, or stack elements vertically (block-level) which is the default rendering in Outlook.',
  'outlook_web': 'Outlook Web strips flex-direction. Elements will stack vertically. Use table layouts for horizontal alignment.',
  'gmail_web': 'Gmail strips flex-direction. All flex children will stack vertically. Use `<table>` with `<td>` for side-by-side layouts.',
  'gmail_ios': 'Gmail iOS strips flex-direction. Use table-based layouts.',
  'gmail_android': 'Gmail Android strips flex-direction. Use table-based layouts.',
  'yahoo_web': 'Yahoo Mail strips flex-direction. Use inline-block or table layouts.',
  default: 'Flexbox properties like flex-direction are not supported in most email clients. Use `<table>` layouts for reliable horizontal and vertical alignment.'
},

'align-items': {
  'outlook_windows': 'Flexbox is not supported in Outlook on Windows. `align-items` will be ignored. Use `valign` attribute on `<td>` elements (`valign="top"`, `valign="middle"`, `valign="bottom"`) for vertical alignment.',
  'gmail_web': 'Gmail strips align-items. Use `valign` attribute on `<td>` elements for vertical alignment.',
  'gmail_ios': 'Gmail iOS strips align-items. Use `valign` on `<td>` elements.',
  'gmail_android': 'Gmail Android strips align-items. Use `valign` on `<td>` elements.',
  'yahoo_web': 'Yahoo Mail strips align-items. Use `valign` attribute on table cells.',
  default: 'Use `valign` attribute on `<td>` elements (`valign="top"`, `valign="middle"`, `valign="bottom"`) instead of `align-items` for email compatibility.'
},

'justify-content': {
  'outlook_windows': 'Flexbox is not supported in Outlook on Windows. `justify-content` will be ignored. Use `align` attribute on `<td>` or `<table>` elements (`align="center"`, `align="right"`) for horizontal alignment.',
  'gmail_web': 'Gmail strips justify-content. Use `align` attribute on `<td>` elements.',
  'gmail_ios': 'Gmail iOS strips justify-content. Use `align` attribute.',
  'gmail_android': 'Gmail Android strips justify-content. Use `align` attribute.',
  'yahoo_web': 'Yahoo Mail strips justify-content. Use `align` attribute on table cells.',
  default: 'Use `align` attribute on `<td>` elements (`align="center"`, `align="right"`) instead of `justify-content` for email compatibility.'
},

'flex-wrap': {
  'outlook_windows': 'Flexbox is not supported in Outlook on Windows. `flex-wrap` will be ignored. All elements will render on one line. Use multiple `<tr>` rows in a `<table>` to control wrapping.',
  'gmail_web': 'Gmail strips flex-wrap. Elements stay on one line. Use table rows for wrapping.',
  'gmail_ios': 'Gmail iOS strips flex-wrap. Use table rows.',
  'gmail_android': 'Gmail Android strips flex-wrap. Use table rows.',
  'yahoo_web': 'Yahoo Mail strips flex-wrap. Use table rows.',
  default: 'Use `<table>` with multiple `<tr>` rows instead of `flex-wrap` for wrapping elements in email.'
},

'gap': {
  'outlook_windows': '`gap` is not supported in Outlook on Windows. Use `padding` or `margin` on individual elements, or `cellpadding` and `cellspacing` attributes on `<table>` elements.',
  'gmail_web': 'Gmail strips gap property. Use margin or padding on individual elements.',
  'gmail_ios': 'Gmail iOS strips gap. Use margin/padding on individual elements.',
  'gmail_android': 'Gmail Android strips gap. Use margin/padding on individual elements.',
  'yahoo_web': 'Yahoo Mail strips gap. Use cellpadding on tables.',
  default: 'Use `cellpadding` on `<table>`, or `padding`/`margin` on individual elements instead of `gap` for email.'
},

};

/**
 * Get a fix suggestion for a CSS property and client
 * @param {string} property - CSS property name (e.g., 'min-width')
 * @param {string} clientKey - Database client key (e.g., 'outlook_windows')
 * @param {string} clientLabel - Human-readable client name (e.g., 'Outlook (Windows)')
 * @returns {string|null} - Fix suggestion or null if none available
 */
function getFixSuggestion(property, clientKey, clientLabel) {
  // Try exact match
  const fixEntry = FIXES[property];
  if (!fixEntry) {
    // Return generic advice
    return `No specific fix available for "${property}" in ${clientLabel}. Test with real device screenshots before sending.`;
  }

  // Try client-specific fix
  if (fixEntry[clientKey]) {
    return fixEntry[clientKey];
  }

  // Try default fallback
  if (fixEntry.default) {
    return fixEntry.default;
  }

  return null;
}

/**
 * Check if a property is "mostly safe" — i.e., warnings about it are noise
 * These are properties where partial support only affects edge cases
 * @param {string} property - CSS property name
 * @returns {boolean}
 */
function isMostlySafeProperty(property) {
  const SAFE_PROPERTIES = [
    'font-size',
    'font-family',
    'color',
    'background-color',
    'margin',
    'padding',
    'border',
    'width',
    'height',
    'text-align',
    'line-height',
    'font-weight',
    'text-decoration',
    'border-collapse',
    'border-spacing',
  ];
  return SAFE_PROPERTIES.includes(property);
}

module.exports = { getFixSuggestion, isMostlySafeProperty };