// Structure extraction — standalone reference function (used inside mega-extract template)
// Can also be used with browser_evaluate: (element) => { ... extractStructure code ... return extractStructure(element) }
function extractStructure(el, depth = 0, maxDepth = 6) {
  if (depth > maxDepth) return null
  const tag = el.tagName.toLowerCase()

  // Skip junk elements
  if (["script", "style", "noscript", "template"].includes(tag)) return null

  const text =
    el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
      ? el.textContent.trim()
      : null

  // For SVGs: capture element itself but skip children (paths, circles, etc.)
  const skipChildren = tag === "svg"

  return {
    tag,
    text,
    attrs: {
      href: el.getAttribute("href"),
      src: el.getAttribute("src"),
      alt: el.getAttribute("alt"),
      role: el.getAttribute("role"),
      type: el.getAttribute("type"),
    },
    childCount: el.children.length,
    children: skipChildren
      ? []
      : Array.from(el.children)
          .map((c) => extractStructure(c, depth + 1, maxDepth))
          .filter(Boolean),
  }
}

// Style extraction — standalone reference function (used inside mega-extract template)
// Run at desktop (1280x900) then mobile (375x812)
// Can also be used with browser_evaluate: (element) => { ... extractStyles code ... return extractStyles(element) }
function extractStyles(el, depth = 0, maxDepth = 6) {
  if (depth > maxDepth) return null
  const tag = el.tagName.toLowerCase()

  // Skip junk elements
  if (["script", "style", "noscript", "template"].includes(tag)) return null

  const s = window.getComputedStyle(el)

  // Skip hidden elements
  if (s.display === "none") return null

  const text =
    el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
      ? el.textContent.trim()
      : null

  // For SVGs: capture dimensions only, skip children
  const skipChildren = tag === "svg"

  return {
    tag,
    text,
    styles: {
      fontSize: s.fontSize, fontWeight: s.fontWeight, fontFamily: s.fontFamily,
      lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, textAlign: s.textAlign,
      textTransform: s.textTransform, color: s.color,
      display: s.display, flexDirection: s.flexDirection, flexWrap: s.flexWrap,
      alignItems: s.alignItems, justifyContent: s.justifyContent, gap: s.gap,
      gridTemplateColumns: s.gridTemplateColumns,
      marginTop: s.marginTop, marginBottom: s.marginBottom,
      marginLeft: s.marginLeft, marginRight: s.marginRight,
      paddingTop: s.paddingTop, paddingBottom: s.paddingBottom,
      paddingLeft: s.paddingLeft, paddingRight: s.paddingRight,
      width: s.width, maxWidth: s.maxWidth, height: s.height, minHeight: s.minHeight,
      backgroundColor: s.backgroundColor, borderRadius: s.borderRadius,
      boxShadow: s.boxShadow, border: s.border, opacity: s.opacity,
      overflow: s.overflow, position: s.position,
      backgroundImage: s.backgroundImage, background: s.background,
      transform: s.transform, transition: s.transition,
      textDecoration: s.textDecoration, textDecorationColor: s.textDecorationColor,
      aspectRatio: s.aspectRatio, objectFit: s.objectFit, objectPosition: s.objectPosition,
    },
    children: skipChildren
      ? []
      : Array.from(el.children)
          .map((c) => extractStyles(c, depth + 1, maxDepth))
          .filter(Boolean),
  }
}

// Cookie/modal dismissal — standalone reference function (handled automatically in mega-extract template)
// Can also be used with browser_evaluate: () => { ... dismissOverlays code ... }
function dismissOverlays() {
  // Common cookie banner selectors
  const selectors = [
    '[class*="cookie"]',
    '[class*="consent"]',
    '[id*="cookie"]',
    '[class*="banner"]',
  ]
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => el.remove())
  })
}

// Scroll to section — standalone reference function (handled automatically in mega-extract template)
// Can also be used with browser_evaluate: (element) => { element.scrollIntoView({ behavior: "instant" }) }
function scrollToElement(element) {
  element.scrollIntoView({ behavior: "instant" })
}

// =============================================================================
// Mega-Extract Template — use with browser_run_code (Step 1)
// =============================================================================
// Ready-to-use Playwright snippet. Replace __SOURCE_URL__ and __SELECTOR__
// with actual values, then pass the entire string to browser_run_code.
//
// Returns: { structure, desktopStyles, mobileStyles }
// On selector failure: { error: "selector_not_found", availableSections: [...] }
//
// Usage in skill:
//   1. Read this file
//   2. Copy the megaExtractTemplate string
//   3. Replace __SOURCE_URL__ and __SELECTOR__
//   4. Pass to browser_run_code as the `code` parameter
// =============================================================================
const megaExtractTemplate = `async (page) => {
  await page.goto("__SOURCE_URL__", { waitUntil: "domcontentloaded" });

  await page.evaluate(() => {
    const selectors = ['[class*="cookie"]', '[class*="consent"]', '[id*="cookie"]', '[class*="banner"]'];
    selectors.forEach(sel => document.querySelectorAll(sel).forEach(el => el.remove()));
  });

  const el = page.locator("__SELECTOR__");
  const count = await el.count();

  if (count === 0) {
    const sections = await page.evaluate(() =>
      Array.from(document.querySelectorAll("section, [role='region'], main > div"))
        .slice(0, 10)
        .map((s, i) => ({
          index: i,
          tag: s.tagName,
          id: s.id,
          classes: s.className.toString().slice(0, 80),
          textPreview: s.textContent?.trim().slice(0, 100),
        }))
    );
    return { error: "selector_not_found", availableSections: sections };
  }

  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await page.setViewportSize({ width: 1280, height: 900 });
  const desktop = await el.evaluate((el) => {
    function _extractStructure(el, depth = 0, maxDepth = 6) {
      if (depth > maxDepth) return null;
      const tag = el.tagName.toLowerCase();
      if (["script", "style", "noscript", "template"].includes(tag)) return null;
      const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
        ? el.textContent.trim() : null;
      const skipChildren = tag === "svg";
      return {
        tag, text,
        attrs: { href: el.getAttribute("href"), src: el.getAttribute("src"), alt: el.getAttribute("alt"), role: el.getAttribute("role"), type: el.getAttribute("type") },
        childCount: el.children.length,
        children: skipChildren ? [] : Array.from(el.children).map(c => _extractStructure(c, depth + 1, maxDepth)).filter(Boolean),
      };
    }
    function _extractStyles(el, depth = 0, maxDepth = 6) {
      if (depth > maxDepth) return null;
      const tag = el.tagName.toLowerCase();
      if (["script", "style", "noscript", "template"].includes(tag)) return null;
      const s = window.getComputedStyle(el);
      if (s.display === "none") return null;
      const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
        ? el.textContent.trim() : null;
      const skipChildren = tag === "svg";
      return {
        tag, text,
        styles: {
          fontSize: s.fontSize, fontWeight: s.fontWeight, fontFamily: s.fontFamily,
          lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, textAlign: s.textAlign,
          textTransform: s.textTransform, color: s.color,
          display: s.display, flexDirection: s.flexDirection, flexWrap: s.flexWrap,
          alignItems: s.alignItems, justifyContent: s.justifyContent, gap: s.gap,
          gridTemplateColumns: s.gridTemplateColumns,
          marginTop: s.marginTop, marginBottom: s.marginBottom,
          marginLeft: s.marginLeft, marginRight: s.marginRight,
          paddingTop: s.paddingTop, paddingBottom: s.paddingBottom,
          paddingLeft: s.paddingLeft, paddingRight: s.paddingRight,
          width: s.width, maxWidth: s.maxWidth, height: s.height, minHeight: s.minHeight,
          backgroundColor: s.backgroundColor, borderRadius: s.borderRadius,
          boxShadow: s.boxShadow, border: s.border, opacity: s.opacity,
          overflow: s.overflow, position: s.position,
          backgroundImage: s.backgroundImage, background: s.background,
          transform: s.transform, transition: s.transition,
          textDecoration: s.textDecoration, textDecorationColor: s.textDecorationColor,
          aspectRatio: s.aspectRatio, objectFit: s.objectFit, objectPosition: s.objectPosition,
        },
        children: skipChildren ? [] : Array.from(el.children).map(c => _extractStyles(c, depth + 1, maxDepth)).filter(Boolean),
      };
    }
    return { structure: _extractStructure(el), styles: _extractStyles(el) };
  });

  await page.setViewportSize({ width: 375, height: 812 });
  const mobileStyles = await el.evaluate((el) => {
    function _extractStyles(el, depth = 0, maxDepth = 6) {
      if (depth > maxDepth) return null;
      const tag = el.tagName.toLowerCase();
      if (["script", "style", "noscript", "template"].includes(tag)) return null;
      const s = window.getComputedStyle(el);
      if (s.display === "none") return null;
      const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
        ? el.textContent.trim() : null;
      const skipChildren = tag === "svg";
      return {
        tag, text,
        styles: {
          fontSize: s.fontSize, fontWeight: s.fontWeight, fontFamily: s.fontFamily,
          lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, textAlign: s.textAlign,
          textTransform: s.textTransform, color: s.color,
          display: s.display, flexDirection: s.flexDirection, flexWrap: s.flexWrap,
          alignItems: s.alignItems, justifyContent: s.justifyContent, gap: s.gap,
          gridTemplateColumns: s.gridTemplateColumns,
          marginTop: s.marginTop, marginBottom: s.marginBottom,
          marginLeft: s.marginLeft, marginRight: s.marginRight,
          paddingTop: s.paddingTop, paddingBottom: s.paddingBottom,
          paddingLeft: s.paddingLeft, paddingRight: s.paddingRight,
          width: s.width, maxWidth: s.maxWidth, height: s.height, minHeight: s.minHeight,
          backgroundColor: s.backgroundColor, borderRadius: s.borderRadius,
          boxShadow: s.boxShadow, border: s.border, opacity: s.opacity,
          overflow: s.overflow, position: s.position,
          backgroundImage: s.backgroundImage, background: s.background,
          transform: s.transform, transition: s.transition,
          textDecoration: s.textDecoration, textDecorationColor: s.textDecorationColor,
          aspectRatio: s.aspectRatio, objectFit: s.objectFit, objectPosition: s.objectPosition,
        },
        children: skipChildren ? [] : Array.from(el.children).map(c => _extractStyles(c, depth + 1, maxDepth)).filter(Boolean),
      };
    }
    return _extractStyles(el);
  });

  await page.setViewportSize({ width: 1280, height: 900 });

  return { structure: desktop.structure, desktopStyles: desktop.styles, mobileStyles };
}`;
