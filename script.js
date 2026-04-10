/* ═══════════════════════════════════════════════════════
   THE PIZZA SHOP — script.js
   No external libraries. Vanilla JS, ES6+.
   ═══════════════════════════════════════════════════════ */

(() => {
  "use strict";

  /* ─────────────────────────────────────────────────────
     HELPERS
     ───────────────────────────────────────────────────── */
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  /* ─────────────────────────────────────────────────────
     1. INJECT CONFIG VALUES
        Reads window.CONFIG and populates dynamic links/text
     ───────────────────────────────────────────────────── */
  function applyConfig() {
    const C = window.CONFIG;
    if (!C) return;

    const telHref = `tel:${C.phone}`;
    const waHref  = `https://wa.me/${C.whatsapp}?text=Hi!%20I%27d%20like%20to%20order%20a%20pizza%20from%20The%20Pizza%20Shop.`;
    const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(C.mapQuery)}`;

    // CTA links — Call
    $$("[id$='call-btn'], #contact-call-btn").forEach(el => {
      el.href = telHref;
    });

    // CTA links — WhatsApp
    $$("[id$='wa-btn'], #header-whatsapp-btn, #contact-wa-btn, #menu-wa-btn").forEach(el => {
      el.href = waHref;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    });

    // Directions
    const dirsBtn = $("#directions-btn");
    if (dirsBtn) {
      dirsBtn.href = mapsUrl;
      dirsBtn.target = "_blank";
      dirsBtn.rel = "noopener noreferrer";
    }

    // Phone display text
    const phoneDisplay = $("#phone-display");
    if (phoneDisplay) phoneDisplay.textContent = C.phoneDisplay;

    // "Order" buttons on menu cards (small WhatsApp CTAs)
    $$(".btn-order-small").forEach(el => {
      el.href = waHref;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    });

    // Social links
    const ig = $("#footer-instagram");
    const fb = $("#footer-facebook");
    const tw = $("#footer-twitter");
    if (ig && C.instagram) ig.href = C.instagram;
    if (fb && C.facebook)  fb.href = C.facebook;
    if (tw && C.twitter)   tw.href = C.twitter;

    // Footer year
    const fy = $("#footer-year");
    if (fy) fy.textContent = new Date().getFullYear();
  }

  /* ─────────────────────────────────────────────────────
     2. STICKY HEADER — add 'scrolled' class on scroll
     ───────────────────────────────────────────────────── */
  function initStickyHeader() {
    const header = $("#site-header");
    if (!header) return;

    const handler = () => {
      header.classList.toggle("scrolled", window.scrollY > 10);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler(); // run once on load
  }

  /* ─────────────────────────────────────────────────────
     3. MOBILE NAV TOGGLE
     ───────────────────────────────────────────────────── */
  function initMobileNav() {
    const hamburger = $("#hamburger");
    const nav = $("#main-nav");
    if (!hamburger || !nav) return;

    hamburger.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });

    // Close nav when a link is clicked
    $$(".nav-link", nav).forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });

    // Close nav on Escape
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        hamburger.setAttribute("aria-expanded", "false");
        hamburger.focus();
      }
    });
  }

  /* ─────────────────────────────────────────────────────
     4. SCROLL REVEAL
        Uses IntersectionObserver for performance
     ───────────────────────────────────────────────────── */
  function initScrollReveal() {
    const els = $$(".reveal");
    if (!els.length) return;

    // If browser doesn't support IO, just reveal everything
    if (!("IntersectionObserver" in window)) {
      els.forEach(el => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target); // animate once
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach(el => observer.observe(el));
  }

  /* ─────────────────────────────────────────────────────
     5. FAQ ACCORDION
     ───────────────────────────────────────────────────── */
  function initFAQ() {
    const questions = $$(".faq-question");

    questions.forEach(btn => {
      btn.addEventListener("click", () => {
        const answerId = btn.getAttribute("aria-controls");
        const answer   = $("#" + answerId);
        const isOpen   = btn.getAttribute("aria-expanded") === "true";

        // Close all
        questions.forEach(q => {
          q.setAttribute("aria-expanded", "false");
          const a = $("#" + q.getAttribute("aria-controls"));
          if (a) a.hidden = true;
        });

        // Open current if it was closed
        if (!isOpen) {
          btn.setAttribute("aria-expanded", "true");
          if (answer) answer.hidden = false;
        }
      });
    });
  }

  /* ─────────────────────────────────────────────────────
     6. TOAST NOTIFICATION
     ───────────────────────────────────────────────────── */
  function showToast(message, duration = 3500) {
    const toast   = $("#toast");
    const msgEl   = $("#toast-message");
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    toast.hidden = false;

    // Force reflow before adding class (ensures transition fires)
    void toast.offsetWidth;
    toast.classList.add("is-visible");

    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => { toast.hidden = true; }, 450);
    }, duration);
  }

  /* ─────────────────────────────────────────────────────
     7. FORM VALIDATION UTILITY
     ───────────────────────────────────────────────────── */
  function validateField(field, errorEl, rules) {
    let message = "";

    if (rules.required && !field.value.trim()) {
      message = "This field is required.";
    } else if (rules.minLength && field.value.trim().length < rules.minLength) {
      message = `Please enter at least ${rules.minLength} characters.`;
    } else if (rules.pattern && !rules.pattern.test(field.value.trim())) {
      message = rules.patternMsg || "Invalid format.";
    }

    errorEl.textContent = message;
    field.classList.toggle("is-invalid", !!message);
    field.setAttribute("aria-invalid", message ? "true" : "false");

    return !message;
  }

  /* ─────────────────────────────────────────────────────
     8. CONTACT FORM
     ───────────────────────────────────────────────────── */
  function initContactForm() {
    const form = $("#contact-form");
    if (!form) return;

    const nameField    = $("#cf-name");
    const phoneField   = $("#cf-phone");
    const messageField = $("#cf-message");

    const nameError    = $("#cf-name-error");
    const phoneError   = $("#cf-phone-error");
    const messageError = $("#cf-message-error");

    // Inline validation on blur
    nameField.addEventListener("blur", () =>
      validateField(nameField, nameError, {
        required: true, minLength: 2
      })
    );

    phoneField.addEventListener("blur", () =>
      validateField(phoneField, phoneError, {
        required: true,
        pattern: /^[0-9]{10}$/,
        patternMsg: "Enter a valid 10-digit phone number."
      })
    );

    messageField.addEventListener("blur", () =>
      validateField(messageField, messageError, {
        required: true, minLength: 10
      })
    );

    form.addEventListener("submit", e => {
      e.preventDefault();

      const v1 = validateField(nameField, nameError, { required: true, minLength: 2 });
      const v2 = validateField(phoneField, phoneError, {
        required: true,
        pattern: /^[0-9]{10}$/,
        patternMsg: "Enter a valid 10-digit phone number."
      });
      const v3 = validateField(messageField, messageError, { required: true, minLength: 10 });

      if (!v1 || !v2 || !v3) {
        // Focus the first invalid field
        [nameField, phoneField, messageField].find(f => f.classList.contains("is-invalid"))?.focus();
        return;
      }

      // Simulate success (no backend)
      const submitBtn = form.querySelector("[type='submit']");
      submitBtn.textContent = "Sending…";
      submitBtn.disabled = true;

      setTimeout(() => {
        form.reset();
        [nameField, phoneField, messageField].forEach(f => {
          f.classList.remove("is-invalid");
          f.removeAttribute("aria-invalid");
        });
        [nameError, phoneError, messageError].forEach(e => (e.textContent = ""));
        submitBtn.textContent = "Send Message";
        submitBtn.disabled = false;
        showToast("✅ Message received! We'll get back to you soon.");
      }, 1000);
    });
  }

  /* ─────────────────────────────────────────────────────
     9. REVIEW MODAL
        Full focus trap for accessibility
     ───────────────────────────────────────────────────── */
  function initReviewModal() {
    const overlay   = $("#review-modal");
    const openBtn   = $("#open-review-modal");
    const closeBtn  = $("#modal-close-btn");
    const reviewForm = $("#review-form");
    if (!overlay || !openBtn || !closeBtn) return;

    const FOCUSABLE_SELECTORS =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function getFocusable() {
      return $$( FOCUSABLE_SELECTORS, overlay ).filter(
        el => !el.disabled && !el.closest("[hidden]")
      );
    }

    function openModal() {
      overlay.hidden = false;
      document.body.style.overflow = "hidden";
      setTimeout(() => closeBtn.focus(), 50);
    }

    function closeModal() {
      overlay.hidden = true;
      document.body.style.overflow = "";
      openBtn.focus();
    }

    openBtn.addEventListener("click", openModal);
    closeBtn.addEventListener("click", closeModal);

    // Click outside modal box to close
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeModal();
    });

    // Escape key
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !overlay.hidden) closeModal();
    });

    // Focus trap
    overlay.addEventListener("keydown", e => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Review form submission
    if (reviewForm) {
      const nameField   = $("#rv-name");
      const reviewField = $("#rv-review");
      const nameError   = $("#rv-name-error");
      const ratingError = $("#rv-rating-error");
      const reviewError = $("#rv-review-error");

      reviewForm.addEventListener("submit", e => {
        e.preventDefault();

        const v1 = validateField(nameField, nameError, { required: true, minLength: 2 });

        // Check rating
        const ratingSelected = reviewForm.querySelector("input[name='rating']:checked");
        let ratingValid = true;
        if (!ratingSelected) {
          ratingError.textContent = "Please select a star rating.";
          ratingValid = false;
        } else {
          ratingError.textContent = "";
        }

        const v3 = validateField(reviewField, reviewError, { required: true, minLength: 15 });

        if (!v1 || !ratingValid || !v3) return;

        const submitBtn = reviewForm.querySelector("[type='submit']");
        submitBtn.textContent = "Submitting…";
        submitBtn.disabled = true;

        setTimeout(() => {
          reviewForm.reset();
          $$(".star-label", reviewForm).forEach(l => (l.style.color = ""));
          [nameField, reviewField].forEach(f => {
            f.classList.remove("is-invalid");
            f.removeAttribute("aria-invalid");
          });
          [nameError, ratingError, reviewError].forEach(el => (el.textContent = ""));
          submitBtn.textContent = "Submit Review";
          submitBtn.disabled = false;
          closeModal();
          showToast("🌟 Thanks for your review! We appreciate it.");
        }, 1000);
      });
    }
  }

  /* ─────────────────────────────────────────────────────
     10. SMOOTH NAV SCROLL OFFSET
         Accounts for sticky header height
     ───────────────────────────────────────────────────── */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener("click", e => {
        const targetId = anchor.getAttribute("href");
        if (!targetId || targetId === "#") return;

        const target = $(targetId);
        if (!target) return;

        e.preventDefault();
        const headerH = $("#site-header")?.offsetHeight || 68;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;

        window.scrollTo({ top, behavior: "smooth" });
      });
    });
  }

  /* ─────────────────────────────────────────────────────
     11. ACTIVE NAV LINK (highlight on scroll)
     ───────────────────────────────────────────────────── */
  function initActiveNav() {
    const sections = $$("section[id]");
    const navLinks = $$(".nav-link");

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            navLinks.forEach(link => {
              link.classList.toggle(
                "active",
                link.getAttribute("href") === `#${entry.target.id}`
              );
            });
          }
        });
      },
      {
        rootMargin: "-30% 0px -60% 0px",
        threshold: 0
      }
    );

    sections.forEach(s => observer.observe(s));
  }

  /* ─────────────────────────────────────────────────────
     INIT — run everything when DOM is ready
     ───────────────────────────────────────────────────── */
  function init() {
    applyConfig();
    initStickyHeader();
    initMobileNav();
    initScrollReveal();
    initFAQ();
    initContactForm();
    initReviewModal();
    initSmoothScroll();
    initActiveNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();