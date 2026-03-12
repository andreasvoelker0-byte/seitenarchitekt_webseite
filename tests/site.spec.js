const { test, expect } = require('@playwright/test');

const CORE_PAGES = [
  '/index.html',
  '/ueber-mich.html',
  '/leistungen.html',
  '/portfolio.html',
  '/blog.html',
  '/impressum.html',
  '/datenschutz.html'
];

const RESPONSIVE_PAGES = [
  '/index.html',
  '/ueber-mich.html',
  '/leistungen.html',
  '/portfolio.html',
  '/blog.html',
  '/blog-artikel.html?slug=warum-viele-handwerker-websites-keine-anfragen-bringen',
  '/impressum.html',
  '/datenschutz.html'
];

const BREAKPOINTS = [
  { name: '320', width: 320, height: 780 },
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 900 },
  { name: '1440', width: 1440, height: 1000 }
];

async function assertNoHorizontalOverflow(page, contextLabel) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
  });

  expect(
    metrics.scrollWidth,
    `${contextLabel}: horizontal overflow detected (scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth})`
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function assertNoCriticalHorizontalClipping(page, contextLabel) {
  const issues = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const selectors = ['#navbar', '.hero', 'main', '.section', 'footer', '#mobileMenu'];
    const found = [];

    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes) {
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        if (rect.left < -1 || rect.right > viewportWidth + 1) {
          found.push({ selector, left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) });
        }
      }
    }

    return found.slice(0, 8);
  });

  expect(issues, `${contextLabel}: clipping/overlap candidate on major layout containers`).toEqual([]);
}

async function assertNavigationWorks(page, viewportWidth, contextLabel) {
  await expect(page.locator('#navbar'), `${contextLabel}: navbar missing`).toBeVisible();

  const hamburger = page.locator('#hamburger');

  if (viewportWidth <= 768) {
    await expect(hamburger, `${contextLabel}: hamburger should be visible`).toBeVisible();
    await hamburger.click();

    const mobileMenu = page.locator('#mobileMenu');
    await expect(mobileMenu, `${contextLabel}: mobile menu should open`).toBeVisible();

    const hrefs = await mobileMenu.locator('a').evaluateAll((links) =>
      links.map((a) => (a.getAttribute('href') || '').trim())
    );

    const requiredSuffixes = ['index.html', 'ueber-mich.html', 'leistungen.html', 'portfolio.html', 'blog.html'];
    for (const suffix of requiredSuffixes) {
      const hasLink = hrefs.some((href) => href.endsWith(suffix));
      expect(hasLink, `${contextLabel}: missing mobile nav link ending with ${suffix}`).toBeTruthy();
    }

    await page.keyboard.press('Escape');
  } else {
    await expect(hamburger, `${contextLabel}: hamburger should be hidden`).not.toBeVisible();
    const navLinks = page.locator('.nav-links a');
    await expect(navLinks.first(), `${contextLabel}: desktop nav not visible`).toBeVisible();
    await expect(navLinks, `${contextLabel}: desktop nav link count mismatch`).toHaveCount(6);
  }
}


async function assertNoAboutSectionOverlap(page, viewportWidth, pagePath, contextLabel) {
  if (pagePath !== '/ueber-mich.html' || viewportWidth > 1024) return;

  const info = await page.evaluate(() => {
    const photo = document.querySelector('.about-inner .about-photo');
    const content = document.querySelector('.about-inner .about-content');
    if (!photo || !content) return null;

    const p = photo.getBoundingClientRect();
    const c = content.getBoundingClientRect();
    const overlap = !(p.right <= c.left + 1 || c.right <= p.left + 1 || p.bottom <= c.top + 1 || c.bottom <= p.top + 1);

    return {
      overlap,
      photoBottom: Math.round(p.bottom),
      contentTop: Math.round(c.top)
    };
  });

  if (!info) return;
  expect(info.overlap, `${contextLabel}: about photo/content overlap detected (photoBottom=${info.photoBottom}, contentTop=${info.contentTop})`).toBeFalsy();
}
async function assertReadabilityBaseline(page, contextLabel) {
  const metrics = await page.evaluate(() => {
    function visible(el) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    }

    function pxValue(value, fontSizeFallback = 16) {
      if (!value || value === 'normal') return fontSizeFallback * 1.4;
      const num = Number.parseFloat(value);
      return Number.isFinite(num) ? num : fontSizeFallback * 1.4;
    }

    const h1 = Array.from(document.querySelectorAll('h1')).find(visible) || null;
    const para = Array.from(document.querySelectorAll('.hero-sub, .article-intro, main p, section p')).find(visible) || null;
    const meta = Array.from(document.querySelectorAll('.label, .blog-cat, .portfolio-cat, .footer-bottom')).find(visible) || null;

    const h1Size = h1 ? pxValue(getComputedStyle(h1).fontSize, 28) : 0;
    const pStyle = para ? getComputedStyle(para) : null;
    const pFontSize = pStyle ? pxValue(pStyle.fontSize, 14) : 0;
    const pLineHeight = pStyle ? pxValue(pStyle.lineHeight, pFontSize || 14) : 0;
    const metaSize = meta ? pxValue(getComputedStyle(meta).fontSize, 12) : 0;

    return { h1Size, pFontSize, pLineHeight, metaSize };
  });

  expect(metrics.h1Size, `${contextLabel}: H1 too small`).toBeGreaterThanOrEqual(28);
  expect(metrics.pFontSize, `${contextLabel}: body/support text too small`).toBeGreaterThanOrEqual(14);
  expect(metrics.pLineHeight, `${contextLabel}: line-height too tight`).toBeGreaterThanOrEqual(19);

  if (metrics.metaSize > 0) {
    expect(metrics.metaSize, `${contextLabel}: meta/label text too small`).toBeGreaterThanOrEqual(12);
  }
}

test('core pages are reachable and render a primary heading', async ({ page }) => {
  for (const p of CORE_PAGES) {
    await page.goto(p);
    await expect(page.locator('h1').first()).toBeVisible();
  }
});

test('footer legal links point to real legal pages', async ({ page }) => {
  await page.goto('/index.html');
  const legalLinks = page.locator('footer .footer-legal a');
  await expect(legalLinks).toHaveCount(2);
  await expect(legalLinks.nth(0)).toHaveAttribute('href', /\.?\/impressum\.html$/);
  await expect(legalLinks.nth(1)).toHaveAttribute('href', /\.?\/datenschutz\.html$/);
});

test('blog overview renders articles and article detail loads by slug', async ({ page }) => {
  await page.goto('/blog.html');
  await expect(page.locator('#blogList article').first()).toBeVisible();

  await page.goto('/blog-artikel.html?slug=warum-viele-handwerker-websites-keine-anfragen-bringen');
  await expect(page.locator('#articleContainer .article-layout')).toBeVisible();
});

test.describe('responsive regression QA checks', () => {
  for (const bp of BREAKPOINTS) {
    test(`breakpoint ${bp.name}px: overflow, layout, nav and readability`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });

      for (const pagePath of RESPONSIVE_PAGES) {
        const context = `${bp.width}px ${pagePath}`;

        await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1').first(), `${context}: missing H1`).toBeVisible();

        await assertNoHorizontalOverflow(page, context);
        await assertNoCriticalHorizontalClipping(page, context);
        await assertNoAboutSectionOverlap(page, bp.width, pagePath, context);
        await assertNavigationWorks(page, bp.width, context);
        await assertReadabilityBaseline(page, context);
      }
    });
  }
});
