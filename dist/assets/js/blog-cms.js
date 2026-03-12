(function () {
  'use strict';

  var DATA_URL = 'assets/data/blog-articles.json';

  function escapeHtml(input) {
    return String(input || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(dateString) {
    var date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString || '';
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
  }

  function articleLink(slug) {
    var encoded = encodeURIComponent(slug);
    // Use rewrite-friendly route and keep hash fallback.
    return 'blog-artikel?slug=' + encoded + '#slug=' + encoded;
  }

  function getSlugFromCurrentUrl() {
    var slug = new URLSearchParams(window.location.search).get('slug');
    if (slug) return slug;

    if (window.location.hash) {
      var hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      slug = hashParams.get('slug');
      if (slug) return slug;
    }

    // If routing removed query/hash, try the referrer as a last signal.
    if (document.referrer) {
      try {
        var refUrl = new URL(document.referrer);
        slug = refUrl.searchParams.get('slug');
        if (!slug && refUrl.hash) {
          var refHashParams = new URLSearchParams(refUrl.hash.replace(/^#/, ''));
          slug = refHashParams.get('slug');
        }
        if (slug) return slug;
      } catch (err) {
        // Ignore malformed referrer and continue.
      }
    }

    // Support path-based slugs like /blog-artikel/my-slug
    var pathParts = window.location.pathname.split('/').filter(Boolean);
    var lastPart = pathParts[pathParts.length - 1] || '';
    if (lastPart && lastPart !== 'blog-artikel' && lastPart !== 'blog-artikel.html') {
      return decodeURIComponent(lastPart);
    }

    return '';
  }

  async function loadArticles() {
    var response = await fetch(DATA_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Blogdaten konnten nicht geladen werden.');
    }
    var payload = await response.json();
    if (!payload || !Array.isArray(payload.articles)) {
      throw new Error('Blogdaten sind unvollständig.');
    }
    return payload.articles.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  }

  function renderBlogIndex(articles) {
    var listEl = document.getElementById('blogList');
    var featuredWrap = document.getElementById('featuredWrap');
    if (!listEl) return;

    var featured = articles.find(function (article) { return article.featured; }) || null;
    var listArticles = featured ? articles.filter(function (a) { return a.slug !== featured.slug; }) : articles;

    if (featured && featuredWrap) {
      featuredWrap.innerHTML =
        '<article class="featured-article fade-up">' +
          '<div class="featured-label">Empfohlener Beitrag</div>' +
          '<h3>' + escapeHtml(featured.title) + '</h3>' +
          '<p class="featured-teaser">' + escapeHtml(featured.teaser) + '</p>' +
          '<div class="article-meta">' +
            '<span>' + escapeHtml(featured.category) + '</span>' +
            '<span>' + escapeHtml(formatDate(featured.date)) + '</span>' +
            '<span>' + escapeHtml(featured.readingTime || '') + '</span>' +
          '</div>' +
          '<a class="btn btn-primary" href="' + articleLink(featured.slug) + '">Beitrag lesen</a>' +
        '</article>';
    }

    if (!listArticles.length && featured) {
      listArticles = [featured];
    }

    listEl.innerHTML = listArticles.map(function (article) {
      return (
        '<article class="blog-dynamic-card fade-up">' +
          '<div class="blog-dynamic-head">' +
            '<span class="blog-dynamic-cat">' + escapeHtml(article.category) + '</span>' +
            '<span class="blog-dynamic-date">' + escapeHtml(formatDate(article.date)) + '</span>' +
          '</div>' +
          '<h3>' + escapeHtml(article.title) + '</h3>' +
          '<p>' + escapeHtml(article.teaser) + '</p>' +
          '<div class="blog-dynamic-foot">' +
            '<span>' + escapeHtml(article.readingTime || '') + '</span>' +
            '<a class="blog-link" href="' + articleLink(article.slug) + '">Weiterlesen →</a>' +
          '</div>' +
        '</article>'
      );
        }).join('');

    revealBlogBlocks();
  }

  function revealBlogBlocks() {
    var nodes = document.querySelectorAll('#featuredWrap .fade-up, #blogList .fade-up');
    if (!nodes.length) return;

    requestAnimationFrame(function () {
      nodes.forEach(function (node, index) {
        setTimeout(function () {
          node.classList.add('visible');
        }, index * 45);
      });
    });
  }

  function renderArticleDetail(articles) {
    var slug = getSlugFromCurrentUrl();
    var container = document.getElementById('articleContainer');
    if (!container) return;

    if (!slug) {
      container.innerHTML =
        '<div class="article-fallback">' +
          '<h2>Beitrag nicht gefunden</h2>' +
          '<p>Der aufgerufene Artikel enthält keinen gültigen Link.</p>' +
          '<a class="btn btn-primary" href="blog.html">Zur Blog-Übersicht</a>' +
        '</div>';
      return;
    }

    var article = articles.find(function (entry) { return entry.slug === slug; });
    if (!article) {
      container.innerHTML =
        '<div class="article-fallback">' +
          '<h2>Beitrag nicht gefunden</h2>' +
          '<p>Dieser Artikel ist nicht verfügbar oder wurde verschoben.</p>' +
          '<a class="btn btn-primary" href="blog.html">Zur Blog-Übersicht</a>' +
        '</div>';
      return;
    }

    document.title = article.metaTitle || article.title;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && article.metaDescription) {
      metaDesc.setAttribute('content', article.metaDescription);
    }

    var sectionsHtml = '';
    if (article.content && Array.isArray(article.content.sections)) {
      sectionsHtml = article.content.sections.map(function (section) {
        return (
          '<section class="article-section">' +
            '<h2>' + escapeHtml(section.heading) + '</h2>' +
            '<p>' + escapeHtml(section.text) + '</p>' +
          '</section>'
        );
      }).join('');
    }

    var imageBlock = article.image
      ? '<img class="article-cover" src="' + escapeHtml(article.image) + '" alt="Titelbild zu ' + escapeHtml(article.title) + '">'
      : '<div class="article-cover article-cover-placeholder"><span>Ratgeberbeitrag</span></div>';

    container.innerHTML =
      '<article class="article-layout">' +
        '<header class="article-header">' +
          '<div class="article-meta">' +
            '<span>' + escapeHtml(article.category) + '</span>' +
            '<span>' + escapeHtml(formatDate(article.date)) + '</span>' +
            '<span>' + escapeHtml(article.readingTime || '') + '</span>' +
            '<span>Autor: ' + escapeHtml(article.author || 'SeitenArchitekt') + '</span>' +
          '</div>' +
          '<h1>' + escapeHtml(article.title) + '</h1>' +
        '</header>' +
        imageBlock +
        '<p class="article-intro">' + escapeHtml((article.content && article.content.intro) || '') + '</p>' +
        sectionsHtml +
      '</article>';
  }

  document.addEventListener('DOMContentLoaded', async function () {
    try {
      var articles = await loadArticles();
      renderBlogIndex(articles);
      renderArticleDetail(articles);
    } catch (error) {
      var listEl = document.getElementById('blogList');
      var container = document.getElementById('articleContainer');
      var message = '<p class="article-error">' + escapeHtml(error.message) + '</p>';
      if (listEl) listEl.innerHTML = message;
      if (container) container.innerHTML = message;
    }
  });
})();




