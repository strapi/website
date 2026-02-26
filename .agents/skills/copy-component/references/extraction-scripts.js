// =============================================================================
// Token-Optimized Extraction Functions
// =============================================================================
// Optimizations vs original:
//   1. GSAP word-wrapper collapse — word-per-span animated text → single text string
//   2. Default style stripping — only non-default CSS values included (~88% reduction)
//   3. Merged structure+styles — one tree with tag, text, attrs, styles, children
//   4. Null-attr omission — only present attrs included
//
// Output shape: { desktop, mobile } — each is a tree node with:
//   { tag, styles, text?, attrs?, children? }
// =============================================================================

// Default CSS values to omit — these carry zero information
const STYLE_DEFAULTS = {
  flexDirection: "row", flexWrap: "nowrap",
  alignItems: "normal", justifyContent: "normal", gap: "normal",
  gridTemplateColumns: "none",
  marginTop: "0px", marginBottom: "0px", marginLeft: "0px", marginRight: "0px",
  paddingTop: "0px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px",
  minHeight: "0px", maxWidth: "none",
  backgroundColor: "rgba(0, 0, 0, 0)", borderRadius: "0px",
  boxShadow: "none", border: "0px none rgb(0, 0, 0)",
  opacity: "1", overflow: "visible", position: "static",
  backgroundImage: "none",
  transform: "none", transition: "all 0s ease 0s",
  textDecoration: "none", textDecorationColor: "rgb(0, 0, 0)",
  textTransform: "none", letterSpacing: "normal",
  aspectRatio: "auto", objectFit: "fill", objectPosition: "50% 50%",
}

// Detect GSAP SplitText word-wrappers: parent whose children are ALL single-text leaf divs/spans
function isGsapWordWrapper(domEl) {
  const kids = Array.from(domEl.children)
  if (kids.length < 2) return false
  return kids.every((c) => {
    const tag = c.tagName.toLowerCase()
    return (
      (tag === "div" || tag === "span") &&
      c.children.length === 0 &&
      c.childNodes.length === 1 &&
      c.childNodes[0].nodeType === 3
    )
  })
}

// Combined structure+style extraction — single pass, token-optimized
function extractOptimized(domEl, depth = 0, maxDepth = 6) {
  if (depth > maxDepth) return null
  const tag = domEl.tagName.toLowerCase()
  if (["script", "style", "noscript", "template"].includes(tag)) return null

  const s = window.getComputedStyle(domEl)
  if (s.display === "none") return null

  const skipChildren = tag === "svg"

  // Collapse GSAP word-wrappers: combine text, use parent styles only
  let text = null
  let children = []

  if (!skipChildren && isGsapWordWrapper(domEl)) {
    text = Array.from(domEl.children)
      .map((c) => c.textContent.trim())
      .join(" ")
  } else if (
    domEl.childNodes.length === 1 &&
    domEl.childNodes[0].nodeType === 3
  ) {
    text = domEl.textContent.trim()
  }

  if (!text && !skipChildren) {
    children = Array.from(domEl.children)
      .map((c) => extractOptimized(c, depth + 1, maxDepth))
      .filter(Boolean)
  }

  // Only include non-null attrs
  const attrs = {}
  const href = domEl.getAttribute("href")
  const src = domEl.getAttribute("src")
  const alt = domEl.getAttribute("alt")
  const role = domEl.getAttribute("role")
  const type = domEl.getAttribute("type")
  if (href) attrs.href = href
  if (src) attrs.src = src
  if (alt) attrs.alt = alt
  if (role) attrs.role = role
  if (type) attrs.type = type

  // Only include non-default style values
  const styles = {}
  const allProps = {
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
    backgroundImage: s.backgroundImage,
    transform: s.transform, transition: s.transition,
    textDecoration: s.textDecoration, textDecorationColor: s.textDecorationColor,
    aspectRatio: s.aspectRatio, objectFit: s.objectFit, objectPosition: s.objectPosition,
  }

  for (const [key, val] of Object.entries(allProps)) {
    if (STYLE_DEFAULTS[key] !== val) {
      styles[key] = val
    }
  }

  const node = { tag, styles }
  if (text) node.text = text
  if (Object.keys(attrs).length) node.attrs = attrs
  if (children.length) node.children = children

  return node
}

// Cookie/modal dismissal — standalone reference function (handled automatically in mega-extract template)
function dismissOverlays() {
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
function scrollToElement(element) {
  element.scrollIntoView({ behavior: "instant" })
}

// =============================================================================
// Mega-Extract Template — use with browser_run_code (Step 1)
// =============================================================================
// Ready-to-use Playwright snippet. Replace __SOURCE_URL__ and __SELECTOR__
// with actual values, then pass the entire string to browser_run_code.
//
// Returns: { desktop, mobile }
//   - desktop: merged structure+styles tree (tag, styles, text?, attrs?, children?)
//   - mobile: styles-only tree at 375px width (same shape, no attrs)
// On selector failure: { error: "selector_not_found", availableSections: [...] }
//
// Token optimizations (88% smaller than v1):
//   - GSAP word-wrapper spans collapsed into parent text
//   - Default CSS values omitted (only non-default styles included)
//   - Structure merged into desktop tree (no separate structure key)
//   - Null attrs omitted
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

  const DEFAULTS = {
    flexDirection: "row", flexWrap: "nowrap",
    alignItems: "normal", justifyContent: "normal", gap: "normal",
    gridTemplateColumns: "none",
    marginTop: "0px", marginBottom: "0px", marginLeft: "0px", marginRight: "0px",
    paddingTop: "0px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px",
    minHeight: "0px", maxWidth: "none",
    backgroundColor: "rgba(0, 0, 0, 0)", borderRadius: "0px",
    boxShadow: "none", border: "0px none rgb(0, 0, 0)",
    opacity: "1", overflow: "visible", position: "static",
    backgroundImage: "none",
    transform: "none", transition: "all 0s ease 0s",
    textDecoration: "none", textDecorationColor: "rgb(0, 0, 0)",
    textTransform: "none", letterSpacing: "normal",
    aspectRatio: "auto", objectFit: "fill", objectPosition: "50% 50%",
  };

  await page.setViewportSize({ width: 1280, height: 900 });
  const desktop = await el.evaluate((el, DEFAULTS) => {
    function _isGsapWordWrapper(domEl) {
      const kids = Array.from(domEl.children);
      if (kids.length < 2) return false;
      return kids.every(c => {
        const t = c.tagName.toLowerCase();
        return (t === "div" || t === "span") && c.children.length === 0 && c.childNodes.length === 1 && c.childNodes[0].nodeType === 3;
      });
    }
    function _extract(domEl, depth, maxDepth) {
      if (depth > maxDepth) return null;
      const tag = domEl.tagName.toLowerCase();
      if (["script", "style", "noscript", "template"].includes(tag)) return null;
      const s = window.getComputedStyle(domEl);
      if (s.display === "none") return null;
      const skipChildren = tag === "svg";
      let text = null, children = [];
      if (!skipChildren && _isGsapWordWrapper(domEl)) {
        text = Array.from(domEl.children).map(c => c.textContent.trim()).join(" ");
      } else if (domEl.childNodes.length === 1 && domEl.childNodes[0].nodeType === 3) {
        text = domEl.textContent.trim();
      }
      if (!text && !skipChildren) {
        children = Array.from(domEl.children).map(c => _extract(c, depth + 1, maxDepth)).filter(Boolean);
      }
      const attrs = {};
      const href = domEl.getAttribute("href"), src = domEl.getAttribute("src"), alt = domEl.getAttribute("alt"), role = domEl.getAttribute("role"), type = domEl.getAttribute("type");
      if (href) attrs.href = href; if (src) attrs.src = src; if (alt) attrs.alt = alt; if (role) attrs.role = role; if (type) attrs.type = type;
      const styles = {};
      const allProps = {
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
        backgroundImage: s.backgroundImage,
        transform: s.transform, transition: s.transition,
        textDecoration: s.textDecoration, textDecorationColor: s.textDecorationColor,
        aspectRatio: s.aspectRatio, objectFit: s.objectFit, objectPosition: s.objectPosition,
      };
      for (const [key, val] of Object.entries(allProps)) { if (DEFAULTS[key] !== val) styles[key] = val; }
      const node = { tag, styles };
      if (text) node.text = text;
      if (Object.keys(attrs).length) node.attrs = attrs;
      if (children.length) node.children = children;
      return node;
    }
    return _extract(el, 0, 6);
  }, DEFAULTS);

  await page.setViewportSize({ width: 375, height: 812 });
  const mobile = await el.evaluate((el, DEFAULTS) => {
    function _isGsapWordWrapper(domEl) {
      const kids = Array.from(domEl.children);
      if (kids.length < 2) return false;
      return kids.every(c => {
        const t = c.tagName.toLowerCase();
        return (t === "div" || t === "span") && c.children.length === 0 && c.childNodes.length === 1 && c.childNodes[0].nodeType === 3;
      });
    }
    function _extract(domEl, depth, maxDepth) {
      if (depth > maxDepth) return null;
      const tag = domEl.tagName.toLowerCase();
      if (["script", "style", "noscript", "template"].includes(tag)) return null;
      const s = window.getComputedStyle(domEl);
      if (s.display === "none") return null;
      const skipChildren = tag === "svg";
      let text = null, children = [];
      if (!skipChildren && _isGsapWordWrapper(domEl)) {
        text = Array.from(domEl.children).map(c => c.textContent.trim()).join(" ");
      } else if (domEl.childNodes.length === 1 && domEl.childNodes[0].nodeType === 3) {
        text = domEl.textContent.trim();
      }
      if (!text && !skipChildren) {
        children = Array.from(domEl.children).map(c => _extract(c, depth + 1, maxDepth)).filter(Boolean);
      }
      const styles = {};
      const allProps = {
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
        backgroundImage: s.backgroundImage,
        transform: s.transform, transition: s.transition,
        textDecoration: s.textDecoration, textDecorationColor: s.textDecorationColor,
        aspectRatio: s.aspectRatio, objectFit: s.objectFit, objectPosition: s.objectPosition,
      };
      for (const [key, val] of Object.entries(allProps)) { if (DEFAULTS[key] !== val) styles[key] = val; }
      const node = { tag, styles };
      if (text) node.text = text;
      if (children.length) node.children = children;
      return node;
    }
    return _extract(el, 0, 6);
  }, DEFAULTS);

  await page.setViewportSize({ width: 1280, height: 900 });

  return { desktop, mobile };
}`;
