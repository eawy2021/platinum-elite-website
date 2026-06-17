// ===============================
// Platinum Elite Exec - script.js
// Uses /api/* endpoints routed by Netlify _redirects
// ===============================

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------------
   * 1) HERO BACKGROUND SLIDESHOW
   * --------------------------------- */
  const hero = document.getElementById('hero');
  if (hero) {
    const layerA = hero.querySelector('.hero-bg--a');
    const layerB = hero.querySelector('.hero-bg--b');

    const HERO_IMAGES = [
      'https://media.istockphoto.com/id/1706975421/photo/national-mall-washington-dc.jpg?s=612x612&w=0&k=20&c=mmri08U-YNCPQ4kUbMCt9zTKcQVGoANo9EmqhcHqu5s=',
      'https://upload.wikimedia.org/wikipedia/commons/9/9f/DC_monument_view_from_Lincoln_memorial.jpg',
      'https://chasfagan.com/wp-content/uploads/2019/01/ReaganAirport1-1024x730.jpg',
      'https://baltimore.org/wp-content/uploads/2020/03/reasons-to-love-baltimore-airport-header-1680x0-c-default.jpg',
      'https://assets.simpleviewinc.com/simpleview/image/upload/c_limit,h_1200,q_75,w_1200/v1/clients/fairfax/0d65f68312f082c669d9e1a296845f9941ae3648ca3d12de2b41e57ce37ade03_c69053aa-0131-416d-aecb-574e5cad37b3.jpg'
    ];

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let idx = 0, showingA = true, timer;

    const setBg = (el, url) => { if (el) el.style.backgroundImage = `url("${url}")`; };

    if (layerA && layerB) {
      setBg(layerA, HERO_IMAGES[0]);
      layerA.classList.add('is-visible');
      setBg(layerB, HERO_IMAGES[1]);

      const nextSlide = () => {
        idx = (idx + 1) % HERO_IMAGES.length;
        const nextUrl = HERO_IMAGES[idx];
        if (showingA) {
          setBg(layerB, nextUrl);
          layerB.classList.add('is-visible');
          layerA.classList.remove('is-visible');
        } else {
          setBg(layerA, nextUrl);
          layerA.classList.add('is-visible');
          layerB.classList.remove('is-visible');
        }
        showingA = !showingA;
      };

      const start = () => { if (!prefersReduced) timer = setInterval(nextSlide, 8000); };
      const stop = () => { if (timer) clearInterval(timer); };

      document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
      start();
    }
  }

  /* ---------------------------------
   * 2) FOOTER YEAR
   * --------------------------------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------------------------------
   * 3) MOBILE NAV TOGGLE
   * --------------------------------- */
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', (e) => {
      if (menu.classList.contains('open') && e.target.closest('a')) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------------------------
   * 4) SMOOTH SCROLL FOR HASH LINKS
   * --------------------------------- */
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#') return;

    const [hash, query] = href.split('?');
    const target = document.querySelector(hash);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      if (query) applyHashQueryParams(new URLSearchParams(query));
    }
  });

  /* ---------------------------------
   * 5) CTA FOCUS NAME
   * --------------------------------- */
  const ctaIds = ['cta-header','cta-hero','cta-services','cta-contact'];
  const nameField = document.querySelector('form.contact-form input[name="name"]');
  ctaIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => setTimeout(() => nameField?.focus(), 300));
  });

  /* ---------------------------------
   * 6) SERVICE PRESELECT VIA CARD BUTTONS
   * --------------------------------- */
  const serviceSelect = document.getElementById('service_type');
  const rfqButtons = document.querySelectorAll('[data-service]');
  rfqButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const svc = btn.getAttribute('data-service');
      if (!serviceSelect || !svc) return;
      const match = Array.from(serviceSelect.options).find(o => o.text.trim() === svc.trim());
      if (match) serviceSelect.value = match.value;
      setTimeout(() => nameField?.focus(), 300);
    });
  });

  /* ---------------------------------
   * 7) PREFILL VIA HASH QUERY (#contact?service=…)
   * --------------------------------- */
  function applyHashQueryParams(params) {
    if (!params) return;
    const svcParam = params.get('service');
    if (svcParam && serviceSelect) {
      const match = Array.from(serviceSelect.options).find(o => o.text.toLowerCase() === svcParam.toLowerCase());
      if (match) serviceSelect.value = match.value;
    }
    const setVal = (sel, val) => { const el = document.querySelector(sel); if (el && val) el.value = val; };
    setVal('input[name="pickup"]', params.get('pickup'));
    setVal('input[name="dropoff"]', params.get('dropoff'));
    setVal('input[name="pickup_date"]', params.get('date'));
    setVal('input[name="pickup_time"]', params.get('time'));
  }
  if (location.hash.includes('?')) {
    const [, query] = location.hash.split('?');
    if (query) applyHashQueryParams(new URLSearchParams(query));
  }

  /* ---------------------------------
   * 8) CONTACT FORM SUBMIT UX (FORMSPREE)
   * --------------------------------- */
  const quoteForm = document.querySelector('form.contact-form');
  if (quoteForm) {
    quoteForm.addEventListener('submit', () => {
      const btn = quoteForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.dataset.originalText = btn.textContent;
        btn.textContent = 'Sending...';
        btn.disabled = true;
      }
    });
    window.addEventListener('pageshow', () => {
      const btn = quoteForm.querySelector('button[type="submit"]');
      if (btn && btn.disabled) {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || 'Request a Quote';
      }
    });
  }

  /* ---------------------------------
   * 9) BACK TO TOP (if present)
   * --------------------------------- */
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 300);
    });
  }

  /* ---------------------------------
   * 10) SERVICE AREAS SLIDESHOW (if present)
   * --------------------------------- */
  const wrap = document.querySelector('.areas-slideshow');
  if (wrap) {
    const slides = Array.from(wrap.querySelectorAll('.areas-slide'));
    const prevBtn = wrap.querySelector('.areas-ctrl.prev');
    const nextBtn = wrap.querySelector('.areas-ctrl.next');
    const dotsWrap = wrap.querySelector('.areas-dots');

    if (slides.length) {
      const dots = slides.map((_, i) => {
        const b = document.createElement('button');
        b.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dotsWrap.appendChild(b);
        b.addEventListener('click', () => go(i, true));
        return b;
      });

      let i = 0;
      let timer = null;
      const prefersReduced2 = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      const render = () => {
        slides.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
        dots.forEach((d, idx) => d.classList.toggle('is-active', idx === i));
      };
      const next = () => { i = (i + 1) % slides.length; render(); };
      const go = (idx, restart = false) => {
        i = (idx + slides.length) % slides.length; render();
        if (restart) { stop(); start(); }
      };
      const start = () => { if (!prefersReduced2 && !timer) timer = setInterval(next, 7000); };
      const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

      render(); start();
      prevBtn?.addEventListener('click', () => go(i - 1, true));
      nextBtn?.addEventListener('click', () => go(i + 1, true));
      document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    }
  }

  /* ---------------------------------
   * 11) REVIEWS: FETCH & RENDER (uses /api/* via _redirects)
   * --------------------------------- */
  (function loadReviews() {
    const list = document.getElementById('reviewsList');
    if (!list) return;

    const esc = (s) => String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');

    const render = (items = []) => {
      list.innerHTML = '';
      items.forEach(r => {
        const card = document.createElement('div');
        card.className = 'review';
        const stars = '★★★★★'.slice(0, Math.max(0, Math.min(5, Number(r.stars) || 5)));
        card.innerHTML = `
          <div class="stars">${esc(stars)}</div>
          <p>"${esc(r.text)}"</p>
          <strong>- ${esc(r.name)}</strong>
        `;
        list.appendChild(card);
      });
    };

    fetch('/api/reviews-get', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.resolve([])))
      .then(render)
      .catch(() => { /* keep fallback content */ });
  })();

  /* ---------------------------------
   * 12) REVIEWS: SUBMIT (uses /api/* via _redirects)
   * --------------------------------- */
  (function wireReviewForm() {
    const form = document.getElementById('reviewForm');
    const msg  = document.getElementById('reviewMsg');
    if (!form || !msg) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.textContent = 'Submitting...';

      const fd = new FormData(form);
      const payload = {
        name: fd.get('name'),
        email: fd.get('email'),
        text: fd.get('text'),
        stars: Number(fd.get('stars')),
        _gotcha: fd.get('_gotcha') || ''
      };
      console.log('Review Payload:', payload);

      try {
        const res = await fetch('/api/reviews-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || 'Review submission failed');
        }

        form.reset();
        msg.textContent = 'Thank you! Your review has been posted.';

        // Refresh the list
        const r2 = await fetch('/api/reviews-get', { cache: 'no-store' });
        if (r2.ok) {
          const items = await r2.json();
          const list = document.getElementById('reviewsList');
          if (list) {
            list.innerHTML = '';
            items.forEach(r => {
              const card = document.createElement('div');
              card.className = 'review';
              const stars = '★★★★★'.slice(0, Math.max(0, Math.min(5, Number(r.stars) || 5)));
              const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
              card.innerHTML = `
                <div class="stars">${stars}</div>
                <p>"${esc(r.text)}"</p>
                <strong>- ${esc(r.name)}</strong>
              `;
              list.appendChild(card);
            });
          }
        }
      } catch (err) {
        console.error('Review submission failed:', err);
        msg.textContent = err.message;
      }
    });
  })();
});

// === Trip Type: toggle conditional blocks + dynamic multi-stops ===
(function () {
  const tripTypeInputs = document.querySelectorAll('input[name="trip_type"]');
  const multiStops = document.getElementById('multiStopsFields');
  const roundTrip = document.getElementById('roundTripFields');
  const addStopBtn = document.getElementById('addStopBtn');
  const stopsList = document.getElementById('stopsList');

  if (!tripTypeInputs.length) return;

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  function onTypeChange(value) {
    if (value === 'Multi-Stops') {
      show(multiStops); hide(roundTrip);
    } else if (value === 'Round Trip') {
      hide(multiStops); show(roundTrip);
    } else {
      hide(multiStops); hide(roundTrip);
    }
  }

  tripTypeInputs.forEach(inp => {
    inp.addEventListener('change', () => onTypeChange(inp.value));
    if (inp.checked) onTypeChange(inp.value); // initialize on load
  });

  // Create a new stop row
  function createStopRow(initialValue = '') {
    const div = document.createElement('div');
    div.className = 'stop-row';
    div.innerHTML = `
      <input type="text" name="extra_stops[]" placeholder="Stop address (in order)" value="${initialValue.replace(/"/g,'&quot;')}" />
      <button type="button" class="btn btn--ghost btn--small remove-stop">Remove</button>
    `;
    const removeBtn = div.querySelector('.remove-stop');
    removeBtn.addEventListener('click', () => div.remove());
    return div;
  }

  if (addStopBtn && stopsList) {
    addStopBtn.addEventListener('click', () => {
      stopsList.appendChild(createStopRow());
    });
  }
})();