import { AccessibilityIssue } from '../../config/types.js';

export class AccessibilityAuditor {
  public auditHtml(html: string, pageUrl: string = '/'): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // 1. Missing image alt attributes
    const imgRegex = /<img\s+([^>]*?)>/gi;
    let match: RegExpExecArray | null;
    while ((match = imgRegex.exec(html)) !== null) {
      const attributes = match[1];
      if (!/\balt\s*=/i.test(attributes)) {
        issues.push({
          id: 'A11Y-IMG-ALT',
          rule: 'image-alt',
          severity: 'medium',
          description: `Image tag on ${pageUrl} is missing an alt attribute.`,
          elementHtml: match[0].substring(0, 100),
          remediation: 'Add an informative alt attribute to describe image content: <img src="..." alt="Description" />.',
          wcagTags: ['WCAG-1.1.1', 'Level-A'],
        });
      }
    }

    // 2. Form inputs without label or aria-label
    const inputRegex = /<input\s+([^>]*?)>/gi;
    while ((match = inputRegex.exec(html)) !== null) {
      const attributes = match[1];
      const typeMatch = attributes.match(/\btype\s*=\s*['"]([^'"]+)['"]/i);
      const inputType = typeMatch ? typeMatch[1].toLowerCase() : 'text';

      // Skip hidden, submit, button, reset
      if (['hidden', 'submit', 'button', 'reset', 'image'].includes(inputType)) continue;

      const hasAriaLabel = /\baria-label\s*=/i.test(attributes) || /\baria-labelledby\s*=/i.test(attributes);
      const idMatch = attributes.match(/\bid\s*=\s*['"]([^'"]+)['"]/i);
      const idVal = idMatch ? idMatch[1] : null;

      let hasAssociatedLabel = false;
      if (idVal) {
        const labelRegex = new RegExp(`<label\\s+[^>]*for=["']${idVal}["']`, 'i');
        hasAssociatedLabel = labelRegex.test(html);
      }

      if (!hasAriaLabel && !hasAssociatedLabel) {
        issues.push({
          id: 'A11Y-INPUT-LABEL',
          rule: 'label-title-only',
          severity: 'high',
          description: `Form <input type="${inputType}"> on ${pageUrl} lacks an associated <label> or aria-label.`,
          elementHtml: match[0].substring(0, 100),
          remediation: `Add a corresponding <label for="${idVal || 'inputId'}"> or specify aria-label="Field Name".`,
          wcagTags: ['WCAG-1.3.1', 'WCAG-4.1.2', 'Level-A'],
        });
      }
    }

    // 3. Buttons without accessible text
    const buttonRegex = /<button\s*([^>]*)>([\s\S]*?)<\/button>/gi;
    while ((match = buttonRegex.exec(html)) !== null) {
      const attributes = match[1];
      const textContent = match[2].replace(/<[^>]+>/g, '').trim();
      const hasAriaLabel = /\baria-label\s*=/i.test(attributes) || /\baria-labelledby\s*=/i.test(attributes);

      if (!textContent && !hasAriaLabel) {
        issues.push({
          id: 'A11Y-BUTTON-NAME',
          rule: 'button-name',
          severity: 'high',
          description: `Button on ${pageUrl} contains no text content or aria-label for screen readers.`,
          elementHtml: match[0].substring(0, 100),
          remediation: 'Provide visible text inside the button or add an aria-label="Action Name" attribute.',
          wcagTags: ['WCAG-4.1.2', 'Level-A'],
        });
      }
    }

    // 4. Heading order hierarchy check (e.g. h1 followed by h3)
    const headingRegex = /<h([1-6])[^>]*>/gi;
    let lastHeadingLevel = 0;
    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1], 10);
      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        issues.push({
          id: 'A11Y-HEADING-ORDER',
          rule: 'heading-order',
          severity: 'low',
          description: `Skipped heading level on ${pageUrl}: <h${lastHeadingLevel}> was followed directly by <h${level}>.`,
          elementHtml: match[0],
          remediation: 'Structure headings sequentially (e.g. h1 -> h2 -> h3) without skipping levels to preserve document outline.',
          wcagTags: ['WCAG-1.3.1', 'Level-AA'],
        });
        break; // Only report once per page
      }
      lastHeadingLevel = level;
    }

    // 5. Check <html> lang attribute
    const htmlTagMatch = html.match(/<html\s+([^>]*?)>/i);
    if (htmlTagMatch && !/\blang\s*=/i.test(htmlTagMatch[1])) {
      issues.push({
        id: 'A11Y-HTML-LANG',
        rule: 'html-has-lang',
        severity: 'medium',
        description: `<html> root element on ${pageUrl} is missing a lang attribute.`,
        elementHtml: htmlTagMatch[0],
        remediation: 'Add a lang attribute to the <html> tag, e.g. <html lang="en">.',
        wcagTags: ['WCAG-3.1.1', 'Level-A'],
      });
    }

    return issues;
  }
}

