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
     5. CONTACT FORM – basic validation & submit handler
     ---------------------------------------------------------- */
  var formSubmitBtn = document.getElementById('formSubmit');

  if (formSubmitBtn) {
    formSubmitBtn.addEventListener('click', function () {
      var fname   = document.getElementById('fname').value.trim();
      var lname   = document.getElementById('lname').value.trim();
      var email   = document.getElementById('email').value.trim();
      var branche = document.getElementById('branche').value;
      var msg     = document.getElementById('msg').value.trim();

      // Simple validation
      if (!fname) {
        showFieldError('fname', 'Bitte gib deinen Vornamen ein.');
        return;
      }
      if (!email || !isValidEmail(email)) {
        showFieldError('email', 'Bitte gib eine gültige E-Mail-Adresse ein.');
        return;
      }

      // Success feedback
      formSubmitBtn.textContent = '✓ Nachricht gesendet!';
      formSubmitBtn.style.background = '#2e7d32';
      formSubmitBtn.style.borderColor = '#2e7d32';
      formSubmitBtn.disabled = true;

      console.log('Form data:', { fname, lname, email, branche, msg });

      // Reset after 4 seconds
      setTimeout(function () {
        formSubmitBtn.textContent = 'Nachricht senden →';
        formSubmitBtn.style.background = '';
        formSubmitBtn.style.borderColor = '';
        formSubmitBtn.disabled = false;

        // Clear fields
        ['fname', 'lname', 'email', 'branche', 'msg'].forEach(function (id) {
          document.getElementById(id).value = '';
        });
      }, 4000);
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showFieldError(fieldId, message) {
    var field = document.getElementById(fieldId);
    if (!field) return;

    field.style.borderColor = '#d4522a';
    field.focus();

    // Remove existing error message if any
    var existing = field.parentNode.querySelector('.field-error');
    if (existing) existing.remove();

    var error = document.createElement('p');
    error.className = 'field-error';
    error.style.cssText = 'font-size:12px;color:#d4522a;margin-top:6px;';
    error.textContent = message;
    field.parentNode.appendChild(error);

    // Remove error on next input
    field.addEventListener('input', function () {
      field.style.borderColor = '';
      if (error.parentNode) error.remove();
    }, { once: true });
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
  if (modalFormBtn) {
    modalFormBtn.addEventListener('click', function () {
      var fname = document.getElementById('m-fname').value.trim();
      var email = document.getElementById('m-email').value.trim();

      if (!fname) {
        var f = document.getElementById('m-fname');
        f.style.borderColor = '#d4522a';
        f.focus();
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        var em = document.getElementById('m-email');
        em.style.borderColor = '#d4522a';
        em.focus();
        return;
      }

      // Erfolg
      modalFormBtn.textContent   = '✓ Anfrage gesendet!';
      modalFormBtn.style.background  = '#2e7d32';
      modalFormBtn.style.borderColor = '#2e7d32';
      modalFormBtn.disabled = true;

      setTimeout(function () {
        closeModal();
        ['m-fname', 'm-email', 'm-url', 'm-branche'].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.value = '';
        });
        modalFormBtn.textContent   = 'Jetzt kostenlos anfragen →';
        modalFormBtn.style.background  = '';
        modalFormBtn.style.borderColor = '';
        modalFormBtn.disabled = false;
      }, 2000);
    });
  }

}); // end DOMContentLoaded
