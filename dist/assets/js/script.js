/* ============================================================
   SeitenArchitekt Berlin – script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ----------------------------------------------------------
     1. HAMBURGER / MOBILE MENU
     ---------------------------------------------------------- */
  const hamburger   = document.getElementById('hamburger');
  const mobileMenu  = document.getElementById('mobileMenu');

  function openMenu() {
    hamburger.classList.add('open');
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden'; // prevent scroll while menu open
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function (e) {
    e.stopPropagation();
    if (mobileMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close when a mobile menu link is clicked
  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close when clicking outside the menu
  document.addEventListener('click', function (e) {
    if (
      mobileMenu.classList.contains('open') &&
      !mobileMenu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      closeMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });


  /* ----------------------------------------------------------
     2. STICKY NAV – subtle border on scroll
     ---------------------------------------------------------- */
  var navbar = document.getElementById('navbar');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 60) {
      navbar.style.borderBottomColor = 'rgba(255,255,255,0.12)';
      navbar.style.background        = 'rgba(13,14,15,0.99)';
    } else {
      navbar.style.borderBottomColor = 'rgba(255,255,255,0.07)';
      navbar.style.background        = 'rgba(13,14,15,0.97)';
    }
  });


  /* ----------------------------------------------------------
     3. SCROLL ANIMATIONS  (IntersectionObserver)
     ---------------------------------------------------------- */
  var fadeElements = document.querySelectorAll('.fade-up');

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // animate once only
        }
      });
    },
    {
      threshold:   0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  fadeElements.forEach(function (el) {
    observer.observe(el);
  });


  /* ----------------------------------------------------------
     4. SMOOTH SCROLL for in-page anchor links
     ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 72; // account for fixed nav
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    });
  });


    /* ----------------------------------------------------------
     5. CONTACT FORM - real submission handler
     ---------------------------------------------------------- */
  var contactForm = document.getElementById('contactForm');
  var formSubmitBtn = document.getElementById('formSubmit');
  var contactFormStatus = document.getElementById('contactFormStatus');

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setSubmitState(button, submitting, idleText, busyText) {
    if (!button) return;
    button.disabled = submitting;
    button.textContent = submitting ? busyText : idleText;
  }

  function setStatusMessage(target, message, isError) {
    if (!target) return;
    target.textContent = message || '';
    target.style.color = isError ? '#d4522a' : '#2e7d32';
  }

  function clearFieldError(field) {
    if (!field || !field.parentNode) return;
    field.style.borderColor = '';
    var existing = field.parentNode.querySelector('.field-error');
    if (existing) existing.remove();
  }

  function showFieldError(fieldId, message) {
    var field = document.getElementById(fieldId);
    if (!field) return;

    field.style.borderColor = '#d4522a';
    field.focus();

    var existing = field.parentNode.querySelector('.field-error');
    if (existing) existing.remove();

    var error = document.createElement('p');
    error.className = 'field-error';
    error.style.cssText = 'font-size:12px;color:#d4522a;margin-top:6px;';
    error.textContent = message;
    field.parentNode.appendChild(error);

    field.addEventListener('input', function () {
      clearFieldError(field);
    }, { once: true });
  }

  async function postForm(form) {
    var response = await fetch(form.getAttribute('action') || '/form-submit.php', {
      method: 'POST',
      body: new FormData(form),
      headers: {
        'Accept': 'application/json'
      }
    });

    var payload = null;
    try {
      payload = await response.json();
    } catch (e) {
      payload = null;
    }

    if (!response.ok || !payload || payload.ok !== true) {
      var msg = (payload && payload.message) ? payload.message : 'Die Anfrage konnte nicht gesendet werden. Bitte versuche es erneut.';
      throw new Error(msg);
    }

    return payload;
  }

  if (contactForm && formSubmitBtn) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      var fnameField = document.getElementById('fname');
      var emailField = document.getElementById('email');
      var fname = fnameField ? fnameField.value.trim() : '';
      var email = emailField ? emailField.value.trim() : '';

      setStatusMessage(contactFormStatus, '', false);

      if (!fname) {
        showFieldError('fname', 'Bitte gib deinen Vornamen ein.');
        return;
      }
      if (!email || !isValidEmail(email)) {
        showFieldError('email', 'Bitte gib eine gültige E-Mail-Adresse ein.');
        return;
      }

      setSubmitState(formSubmitBtn, true, 'Nachricht senden →', 'Wird gesendet...');

      try {
        var result = await postForm(contactForm);
        setStatusMessage(contactFormStatus, result.message || 'Danke! Deine Anfrage wurde gesendet.', false);
        contactForm.reset();
      } catch (err) {
        setStatusMessage(contactFormStatus, err.message, true);
      } finally {
        setSubmitState(formSubmitBtn, false, 'Nachricht senden →', 'Wird gesendet...');
      }
    });
  }

  /* ----------------------------------------------------------
     6. ACTIVE NAV LINK on scroll (highlight current section)

     ---------------------------------------------------------- */
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', function () {
    var scrollPos = window.scrollY + 100;

    sections.forEach(function (section) {
      var top    = section.offsetTop;
      var bottom = top + section.offsetHeight;
      var id     = section.getAttribute('id');

      navLinks.forEach(function (link) {
        if (link.getAttribute('href') === '/' + id || link.getAttribute('href') === '#' + id) {
          if (scrollPos >= top && scrollPos < bottom) {
            link.style.color = '#ffffff';
          } else {
            link.style.color = '';
          }
        }
      });
    });
  });



  /* ----------------------------------------------------------
     7. MODAL – Lösung ansehen
     ---------------------------------------------------------- */
  var openModalBtn  = document.getElementById('openModal');
  var modalOverlay  = document.getElementById('modalOverlay');
  var modalCloseBtn = document.getElementById('modalClose');
  var modalFormBtn  = document.getElementById('modalFormSubmit');
  var modalForm = document.getElementById('modalContactForm');
  var modalFormStatus = document.getElementById('modalFormStatus');

  function openModal() {
    modalOverlay.classList.add('open');
    document.body.classList.add('modal-open');
    setTimeout(function () { if (modalCloseBtn) modalCloseBtn.focus(); }, 100);
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.classList.remove('modal-open');
    if (openModalBtn) openModalBtn.focus();
  }

  if (openModalBtn)  openModalBtn.addEventListener('click', openModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

  // Klick auf den dunklen Hintergrund
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Escape-Taste
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('open')) {
      closeModal();
    }
  });
  // Modal-Formular absenden
  if (modalForm && modalFormBtn) {
    modalForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      var fname = document.getElementById('m-fname').value.trim();
      var email = document.getElementById('m-email').value.trim();

      setStatusMessage(modalFormStatus, '', false);

      if (!fname) {
        showFieldError('m-fname', 'Bitte gib deinen Vornamen ein.');
        return;
      }
      if (!email || !isValidEmail(email)) {
        showFieldError('m-email', 'Bitte gib eine gültige E-Mail-Adresse ein.');
        return;
      }

      setSubmitState(modalFormBtn, true, 'Jetzt kostenlos anfragen →', 'Wird gesendet...');

      try {
        var result = await postForm(modalForm);
        setStatusMessage(modalFormStatus, result.message || 'Danke! Deine Anfrage wurde gesendet.', false);
        modalForm.reset();
        setTimeout(function () {
          closeModal();
          setStatusMessage(modalFormStatus, '', false);
        }, 900);
      } catch (err) {
        setStatusMessage(modalFormStatus, err.message, true);
      } finally {
        setSubmitState(modalFormBtn, false, 'Jetzt kostenlos anfragen →', 'Wird gesendet...');
      }
    });
  }
}); // end DOMContentLoaded

