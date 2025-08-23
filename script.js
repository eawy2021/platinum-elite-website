// Runs after the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  /* ===== HERO BACKGROUND SLIDESHOW ===== */
  const hero = document.getElementById('hero');
  if (hero) {
    const layerA = hero.querySelector('.hero-bg--a');
    const layerB = hero.querySelector('.hero-bg--b');

    // Curate your local-area images here (DC/MD/VA):
    const HERO_IMAGES = [
      'https://media.istockphoto.com/id/1706975421/photo/national-mall-washington-dc.jpg?s=612x612&w=0&k=20&c=mmri08U-YNCPQ4kUbMCt9zTKcQVGoANo9EmqhcHqu5s=',
      'https://upload.wikimedia.org/wikipedia/commons/9/9f/DC_monument_view_from_Lincoln_memorial.jpg',
      'https://chasfagan.com/wp-content/uploads/2019/01/ReaganAirport1-1024x730.jpg',
      'https://baltimore.org/wp-content/uploads/2020/03/reasons-to-love-baltimore-airport-header-1680x0-c-default.jpg',
      'https://assets.simpleviewinc.com/simpleview/image/upload/c_limit,h_1200,q_75,w_1200/v1/clients/fairfax/0d65f68312f082c669d9e1a296845f9941ae3648ca3d12de2b41e57ce37ade03_c69053aa-0131-416d-aecb-574e5cad37b3.jpg'
    ];

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let idx = 0, showingA = true, timer;

    const setBg = (el, url) => { if (el) el.style.backgroundImage = `url("${url}")`; };

    // Preload first two, show A
    if (layerA && layerB) {
      setBg(layerA, HERO_IMAGES[0]);
      layerA.classList.add('is-visible');
      setBg(layerB, HERO_IMAGES[1]);
    }

    function nextSlide(){
      idx = (idx + 1) % HERO_IMAGES.length;
      const nextUrl = HERO_IMAGES[idx];
      if (!layerA || !layerB) return;

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
    }

    function start(){ if (!prefersReducedMotion) { timer = setInterval(nextSlide, 8000); } }
    function stop(){ if (timer) clearInterval(timer); }

    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
    start();
  }

  // --- Footer year auto-update ---
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // --- Mobile nav toggle ---
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    // Close menu when a menu link is clicked (mobile UX)
    menu.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      if (menu.classList.contains('open')) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // --- Smooth scroll for in-page anchors ---
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  // --- Focus the Name field when any CTA is clicked ---
  const ctaIds = ['cta-header','cta-hero','cta-services','cta-contact'];
  const nameField = document.querySelector('form.contact-form input[name="name"]');
  for (const id of ctaIds) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        setTimeout(() => nameField && nameField.focus(), 300);
      });
    }
  }

  // --- Pre-select Service Type if a service-specific RFQ button is clicked ---
  const serviceSelect = document.getElementById('service_type');
  const rfqButtons = document.querySelectorAll('[data-service]');
  rfqButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const svc = btn.getAttribute('data-service');
      if (serviceSelect && svc) {
        const match = Array.from(serviceSelect.options).find(o => o.text === svc);
        if (match) serviceSelect.value = match.value;
        setTimeout(() => nameField && nameField.focus(), 300);
      }
    });
  });

  // --- Optional: Support #contact?service=Airport%20Transfers&pickup=... prefill via URL ---
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

  // --- Submit UX for RFQ form (Formspree path) ---
  const rfqForm = document.querySelector('form.contact-form');
  if (rfqForm) {
    rfqForm.addEventListener('submit', () => {
      const btn = rfqForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.dataset.originalText = btn.textContent || 'Submit';
        btn.textContent = 'Sending...';
        btn.disabled = true;
      }
    });
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        const btn = rfqForm.querySelector('button[type="submit"]');
        if (btn && btn.disabled) {
          btn.disabled = false;
          btn.textContent = btn.dataset.originalText || 'Request a Quote';
        }
      }
    });
  }

  // --- Optional: Back to Top button ---
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    });
  }

  // ===== SERVICE AREAS SLIDESHOW =====
  const wrap = document.querySelector('.areas-slideshow');
  if (wrap) {
    const slides = Array.from(wrap.querySelectorAll('.areas-slide'));
    const prevBtn = wrap.querySelector('.areas-ctrl.prev');
    const nextBtn = wrap.querySelector('.areas-ctrl.next');
    const dotsWrap = wrap.querySelector('.areas-dots');

    if (slides.length) {
      const dots = slides.map((_, i) => {
        const b = document.createElement('button');
        b.setAttribute('aria-label', `Go to slide ${i+1}`);
        dotsWrap && dotsWrap.appendChild(b);
        b.addEventListener('click', () => go(i, true));
        return b;
      });

      let i = 0;
      let timer = null;
      const prefersReduced2 = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function render(){
        slides.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
        dots.forEach((d, idx) => d.classList.toggle('is-active', idx === i));
      }
      function next(){ i = (i + 1) % slides.length; render(); }
      function go(idx, stopAuto=false){
        i = idx % slides.length; if (i < 0) i = 0; render();
        if (stopAuto) { stop(); start(); }
      }
      function start(){ if (!prefersReduced2 && !timer) timer = setInterval(next, 7000); }
      function stop(){ if (timer) { clearInterval(timer); timer = null; } }

      render(); start();
      prevBtn && prevBtn.addEventListener('click', () => go(i - 1, true));
      nextBtn && nextBtn.addEventListener('click', () => go(i + 1, true));
      document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
    }
  }

  // ===== REVIEWS: GET & RENDER =====
  (function(){
    const list = document.getElementById('reviewsList');
    if (!list) return;

    const esc = (s) => String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');

    function render(items){
      list.innerHTML = '';
      items.forEach(r => {
        const card = document.createElement('div');
        card.className = 'review';
        const stars = '★★★★★'.slice(0, Math.max(0, Math.min(5, r.stars || 5)));
        card.innerHTML = `
          <div class="stars">${esc(stars)}</div>
          <p>"${esc(r.text)}"</p>
          <strong>- ${esc(r.name)}</strong>
        `;
        list.appendChild(card);
      });
    }

    fetch('/.netlify/functions/reviews-get', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(render)
      .catch(() => { /* keep fallback content */ });
  })();

  // ===== REVIEWS: SUBMIT =====
  (function(){
    const form = document.getElementById('reviewForm');
    const msg = document.getElementById('reviewMsg');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (msg) msg.textContent = 'Submitting...';

      const fd = new FormData(form);
      const payload = {
        name: fd.get('name'),
        email: fd.get('email'),
        text: fd.get('text'),
        stars: Number(fd.get('stars')),
        _gotcha: fd.get('_gotcha') || ''
      };

      try {
        const res = await fetch('/.netlify/functions/reviews-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Bad response');

        form.reset();
        if (msg) msg.textContent = 'Thank you! Your review has been posted.';

        // Refresh the list
        const r2 = await fetch('/.netlify/functions/reviews-get', { cache: 'no-store' });
        if (r2.ok) {
          const items = await r2.json();
          const list = document.getElementById('reviewsList');
          if (list) {
            list.innerHTML = '';
            items.forEach(r => {
              const card = document.createElement('div');
              card.className = 'review';
              const stars = '★★★★★'.slice(0, Math.max(0, Math.min(5, r.stars || 5)));
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
        if (msg) msg.textContent = 'Sorry, something went wrong. Please try again later.';
      }
    });
  })();
});
