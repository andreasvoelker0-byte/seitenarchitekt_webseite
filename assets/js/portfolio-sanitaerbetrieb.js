document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('siteHeader');
  const menuButton = document.getElementById('menuButton');
  const mobilePanel = document.getElementById('mobilePanel');
  const navLinks = Array.from(document.querySelectorAll('.desktop-nav a, .mobile-panel a[href^="#"]'));
  const revealItems = document.querySelectorAll('[data-reveal]');
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const galleryButtons = Array.from(document.querySelectorAll('.gallery-trigger'));
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const stickyContact = document.querySelector('.sticky-contact');
  const heroSection = document.getElementById('hero');
  const ctaSection = document.getElementById('abschluss');
  const contactForm = document.getElementById('contactForm');
  const formSubmit = document.getElementById('formSubmit');
  const formStatus = document.getElementById('contactFormStatus');

  let currentIndex = 0;
  const galleryItems = galleryButtons.map((button) => {
    const image = button.querySelector('img');
    return {
      src: image ? image.getAttribute('src') : '',
      alt: image ? image.getAttribute('alt') : ''
    };
  });

  const syncHeaderState = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 16);
  };

  const syncStickyState = () => {
    if (!stickyContact) return;
    const hideForHero = heroSection ? window.scrollY < Math.max(360, heroSection.offsetHeight * 0.58) : false;
    const hideForCta = ctaSection ? ctaSection.getBoundingClientRect().top < window.innerHeight * 0.82 : false;
    stickyContact.classList.toggle('is-hidden', hideForHero || hideForCta);
  };

  const closeMenu = () => {
    if (!menuButton || !mobilePanel) return;
    menuButton.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    mobilePanel.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  const openMenu = () => {
    if (!menuButton || !mobilePanel) return;
    menuButton.classList.add('is-open');
    menuButton.setAttribute('aria-expanded', 'true');
    mobilePanel.classList.add('is-open');
    document.body.classList.add('menu-open');
  };

  const setFieldError = (field, hasError) => {
    if (!field) return;
    field.classList.toggle('is-error', hasError);
  };

  const clearFieldErrors = () => {
    if (!contactForm) return;
    contactForm.querySelectorAll('input, select, textarea').forEach((field) => {
      field.classList.remove('is-error');
    });
  };

  const setStatus = (message, isError = false) => {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.classList.toggle('is-error', isError);
  };

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', () => {
      if (mobilePanel.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    mobilePanel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
      if (!mobilePanel.classList.contains('is-open')) return;
      if (mobilePanel.contains(event.target) || menuButton.contains(event.target)) return;
      closeMenu();
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href');
      const target = targetId ? document.querySelector(targetId) : null;
      if (!target) return;
      event.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 92;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = entry.target.getAttribute('data-delay');
        if (delay) {
          entry.target.style.setProperty('--reveal-delay', delay);
        }
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -64px 0px' });

    revealItems.forEach((item) => revealObserver.observe(item));

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
        });
      });
    }, { threshold: 0.55 });

    sections.forEach((section) => sectionObserver.observe(section));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const renderLightbox = (index) => {
    const item = galleryItems[index];
    if (!item || !lightbox || !lightboxImage || !lightboxCaption) return;
    currentIndex = index;
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    lightboxCaption.textContent = item.alt;
  };

  const openLightbox = (index) => {
    if (!lightbox) return;
    renderLightbox(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxImage) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImage.src = '';
    document.body.classList.remove('lightbox-open');
  };

  const stepLightbox = (direction) => {
    if (!galleryItems.length) return;
    const nextIndex = (currentIndex + direction + galleryItems.length) % galleryItems.length;
    renderLightbox(nextIndex);
  };

  galleryButtons.forEach((button, index) => {
    button.addEventListener('click', () => openLightbox(index));
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => stepLightbox(-1));
  if (lightboxNext) lightboxNext.addEventListener('click', () => stepLightbox(1));

  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  if (contactForm && formSubmit) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const firstName = document.getElementById('fname');
      const email = document.getElementById('email');
      const message = document.getElementById('msg');

      clearFieldErrors();
      setStatus('', false);

      let hasError = false;
      if (!firstName || !firstName.value.trim()) {
        setFieldError(firstName, true);
        hasError = true;
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        setFieldError(email, true);
        hasError = true;
      }

      if (message && message.value.trim().length > 0 && message.value.trim().length < 10) {
        setFieldError(message, true);
        hasError = true;
      }

      if (hasError) {
        setStatus('Bitte prüfe Vorname, E-Mail und gegebenenfalls den Projektkontext.', true);
        return;
      }

      formSubmit.disabled = true;
      formSubmit.textContent = 'Wird gesendet...';

      try {
        const response = await fetch(contactForm.getAttribute('action') || '../form-submit.php', {
          method: 'POST',
          body: new FormData(contactForm),
          headers: {
            Accept: 'application/json'
          }
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.ok === false) {
          throw new Error(payload.message || 'Senden fehlgeschlagen. Bitte versuche es erneut.');
        }

        setStatus(payload.message || 'Danke! Deine Anfrage wurde erfolgreich gesendet.');
        contactForm.reset();
      } catch (error) {
        setStatus(error.message || 'Senden fehlgeschlagen. Bitte versuche es erneut.', true);
      } finally {
        formSubmit.disabled = false;
        formSubmit.textContent = 'Ähnliches Projekt besprechen';
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      closeLightbox();
    }

    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    if (event.key === 'ArrowLeft') stepLightbox(-1);
    if (event.key === 'ArrowRight') stepLightbox(1);
  });

  syncHeaderState();
  syncStickyState();
  window.addEventListener('scroll', () => {
    syncHeaderState();
    syncStickyState();
  }, { passive: true });
});




