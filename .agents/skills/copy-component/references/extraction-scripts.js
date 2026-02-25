// Structure extraction — use with browser_evaluate on target section element (Step 2)
// Pass as: (element) => { ... extractStructure code ... return extractStructure(element) }
function extractStructure(el, depth = 0, maxDepth = 10) {
  if (depth > maxDepth) return null

  const text =
    el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
      ? el.textContent.trim()
      : null

  return {
    tag: el.tagName.toLowerCase(),
    text,
    attrs: {
      href: el.getAttribute("href"),
      src: el.getAttribute("src"),
      alt: el.getAttribute("alt"),
      role: el.getAttribute("role"),
      type: el.getAttribute("type"),
    },
    childCount: el.children.length,
    children: Array.from(el.children)
      .map((c) => extractStructure(c, depth + 1, maxDepth))
      .filter(Boolean),
  }
}

// Style extraction — use with browser_evaluate on target section element (Steps 3-4)
// Run at desktop (1280x900) then mobile (375x812)
// Pass as: (element) => { ... extractStyles code ... return extractStyles(element) }
function extractStyles(el, depth = 0, maxDepth = 10) {
  if (depth > maxDepth) return null
  const s = window.getComputedStyle(el)

  const text =
    el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
      ? el.textContent.trim()
      : null

  return {
    tag: el.tagName.toLowerCase(),
    text,
    styles: {
      // Typography
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      fontFamily: s.fontFamily,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      textAlign: s.textAlign,
      textTransform: s.textTransform,
      color: s.color,
      // Layout
      display: s.display,
      flexDirection: s.flexDirection,
      flexWrap: s.flexWrap,
      alignItems: s.alignItems,
      justifyContent: s.justifyContent,
      gap: s.gap,
      gridTemplateColumns: s.gridTemplateColumns,
      // Spacing
      marginTop: s.marginTop,
      marginBottom: s.marginBottom,
      marginLeft: s.marginLeft,
      marginRight: s.marginRight,
      paddingTop: s.paddingTop,
      paddingBottom: s.paddingBottom,
      paddingLeft: s.paddingLeft,
      paddingRight: s.paddingRight,
      // Sizing
      width: s.width,
      maxWidth: s.maxWidth,
      height: s.height,
      minHeight: s.minHeight,
      // Visual
      backgroundColor: s.backgroundColor,
      borderRadius: s.borderRadius,
      boxShadow: s.boxShadow,
      border: s.border,
      opacity: s.opacity,
      overflow: s.overflow,
      position: s.position,
      // Background details
      backgroundImage: s.backgroundImage,
      background: s.background,
      // Transform & transitions
      transform: s.transform,
      transition: s.transition,
      // Text decoration
      textDecoration: s.textDecoration,
      textDecorationColor: s.textDecorationColor,
      // Object/aspect
      aspectRatio: s.aspectRatio,
      objectFit: s.objectFit,
      objectPosition: s.objectPosition,
    },
    children: Array.from(el.children)
      .map((c) => extractStyles(c, depth + 1, maxDepth))
      .filter(Boolean),
  }
}

// Cookie/modal dismissal — run via browser_evaluate before extraction if overlays are present
// Pass as: () => { ... dismissOverlays code ... }
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

// Scroll to section — run via browser_evaluate for lazy-loaded content before extracting
// Pass as: (element) => { element.scrollIntoView({ behavior: "instant" }) }
function scrollToElement(element) {
  element.scrollIntoView({ behavior: "instant" })
}
