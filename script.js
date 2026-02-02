/* script.js */
/*
  Valentine Proposal interactions

  Requirements:
  - Yes: clickable, success state + confetti
  - No: never clickable and always escapes
    - Desktop: pointerenter / pointermove triggers escape
    - Mobile: touchstart triggers instant escape
    - Also pointerdown triggers escape before click
  - No stays within .arena and never overlaps Yes (min distance)
*/

(function () {
  const card = document.getElementById('card');
  const arena = document.getElementById('arena');
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const headline = document.getElementById('headline');
  const confetti = document.getElementById('confetti');

  if (!card || !arena || !yesBtn || !noBtn || !headline || !confetti) return;

  const MIN_DIST = 90; // minimum distance from Yes (center-to-center)
  const MOBILE_NEAR_DIST = 110;

  // -------- YES: success state --------
  yesBtn.addEventListener('click', () => {
    headline.textContent = 'Yay! 💖';

    arena.style.display = 'none';
    const hints = card.querySelectorAll('.hint');
    hints.forEach((h) => (h.style.display = 'none'));

    const wrap = document.createElement('div');
    wrap.className = 'successWrap';
    wrap.innerHTML = `
      <p class="successText">Best decision ever. See you on our valentine date ✨</p>
    `;
    headline.insertAdjacentElement('afterend', wrap);

    popConfetti();
  });

  function popConfetti() {
    const colors = ['#ff3d8d', '#22d3ee', '#fbbf24', '#a78bfa', '#34d399'];
    const pieces = 42;

    for (let i = 0; i < pieces; i++) {
      const el = document.createElement('div');
      el.className = 'confettiPiece';
      el.style.left = Math.random() * 100 + '%';
      el.style.top = '-10px';
      el.style.background = colors[i % colors.length];
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
      el.style.animationDelay = Math.random() * 120 + 'ms';
      el.style.width = 8 + Math.random() * 10 + 'px';
      el.style.height = 10 + Math.random() * 18 + 'px';
      confetti.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
  }

  // -------- NO: never clickable --------
  ['click', 'mousedown', 'mouseup'].forEach((evt) => {
    noBtn.addEventListener(
      evt,
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        escape(true);
        return false;
      },
      { passive: false }
    );
  });

  // -------- Robust positioning --------
  function initPosition() {
    if (!noBtn.offsetWidth || !noBtn.offsetHeight) {
      requestAnimationFrame(initPosition);
      return;
    }
    positionNoNearRight();
    noBtn.style.opacity = '1';
  }

  function positionNoNearRight() {
    const a = arena.getBoundingClientRect();
    const y = yesBtn.getBoundingClientRect();

    const pad = 8;
    const left = clamp(
      (y.left - a.left) + y.width + 16,
      pad,
      a.width - noBtn.offsetWidth - pad
    );
    const top = clamp((y.top - a.top), pad, a.height - noBtn.offsetHeight - pad);

    setNoPos(left, top, true);
  }

  function setNoPos(leftPx, topPx, instant) {
    if (instant) {
      noBtn.style.transitionDuration = '0ms';
      noBtn.style.left = `${leftPx}px`;
      noBtn.style.top = `${topPx}px`;
      noBtn.style.transform = 'translateX(0)';
      requestAnimationFrame(() => {
        noBtn.style.transitionDuration = '';
      });
      return;
    }

    noBtn.style.left = `${leftPx}px`;
    noBtn.style.top = `${topPx}px`;
    noBtn.style.transform = 'translateX(0)';
  }

  function escape(instant) {
    const a = arena.getBoundingClientRect();
    const y = yesBtn.getBoundingClientRect();

    const pad = 8;
    const maxLeft = a.width - noBtn.offsetWidth - pad;
    const maxTop = a.height - noBtn.offsetHeight - pad;

    if (maxLeft <= pad || maxTop <= pad) {
      positionNoNearRight();
      return;
    }

    const yesCenter = {
      x: (y.left + y.right) / 2,
      y: (y.top + y.bottom) / 2,
    };

    for (let i = 0; i < 25; i++) {
      const left = randomBetween(pad, maxLeft);
      const top = randomBetween(pad, maxTop);

      const cand = {
        left: a.left + left,
        top: a.top + top,
        right: a.left + left + noBtn.offsetWidth,
        bottom: a.top + top + noBtn.offsetHeight,
      };

      const candCenter = {
        x: (cand.left + cand.right) / 2,
        y: (cand.top + cand.bottom) / 2,
      };

      const dist = distance(candCenter.x, candCenter.y, yesCenter.x, yesCenter.y);
      if (dist < MIN_DIST) continue;
      if (rectsOverlap(cand, y)) continue;

      setNoPos(left, top, !!instant);
      return;
    }

    positionNoNearRight();
  }

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function distance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  // -------- Event listeners for reliable escape --------
  noBtn.addEventListener('pointerenter', () => escape(false));
  noBtn.addEventListener('pointermove', () => escape(false));
  noBtn.addEventListener('focus', () => escape(true));

  arena.addEventListener('pointermove', (e) => {
    const b = noBtn.getBoundingClientRect();
    const cx = (b.left + b.right) / 2;
    const cy = (b.top + b.bottom) / 2;
    if (distance(e.clientX, e.clientY, cx, cy) < 90) escape(false);
  });

  // Mobile Safari can miss pointer events; this makes "No" jump away on tap.
  noBtn.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      escape(true);
    },
    { passive: false }
  );

  noBtn.addEventListener(
    'pointerdown',
    (e) => {
      e.preventDefault();
      escape(true);
    },
    { passive: false }
  );

  arena.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;

      const b = noBtn.getBoundingClientRect();
      const cx = (b.left + b.right) / 2;
      const cy = (b.top + b.bottom) / 2;
      const isNearNo = distance(t.clientX, t.clientY, cx, cy) < MOBILE_NEAR_DIST;
      const tappedNo = e.target === noBtn || noBtn.contains(e.target);

      if (isNearNo || tappedNo) {
        e.preventDefault();
        escape(true);
      }
    },
    { passive: false }
  );

  window.addEventListener('resize', () => positionNoNearRight());
  window.addEventListener('orientationchange', () => positionNoNearRight());

  requestAnimationFrame(() => requestAnimationFrame(initPosition));
})();
