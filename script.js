/* script.js */
/*
  Valentine Proposal interactions

  - Yes: clickable, success state + confetti
  - No: never clickable, always escapes
  - Mobile: "No" jumps away on tap
  - "No" moves inside the card (larger chase area), not just inside the button row
*/

(function () {
  const card = document.getElementById('card');
  const arena = document.getElementById('arena');
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const headline = document.getElementById('headline');
  const confetti = document.getElementById('confetti');

  if (!card || !arena || !yesBtn || !noBtn || !headline || !confetti) return;

  const EDGE_PAD = 12;
  const MIN_DIST_FROM_YES = 130;
  const CHASE_TRIGGER_DIST = 130;

  // -------- YES: success state --------
  yesBtn.addEventListener('click', () => {
    headline.textContent = 'Yay! 💖';

    arena.style.display = 'none';
    noBtn.style.display = 'none';
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

  function getMoveBounds() {
    const cardRect = card.getBoundingClientRect();
    const hero = card.querySelector('.hero');
    const hint = card.querySelector('.hint');

    const heroBottom = hero ? hero.getBoundingClientRect().bottom - cardRect.top : 0;
    const hintTop = hint ? hint.getBoundingClientRect().top - cardRect.top : cardRect.height;

    const minLeft = EDGE_PAD;
    const maxLeft = cardRect.width - noBtn.offsetWidth - EDGE_PAD;
    const minTop = Math.max(heroBottom + 8, EDGE_PAD);
    const maxTop = Math.min(
      cardRect.height - noBtn.offsetHeight - EDGE_PAD,
      hintTop - noBtn.offsetHeight - 12
    );

    return {
      cardRect,
      minLeft,
      maxLeft,
      minTop,
      maxTop,
    };
  }

  function setNoPos(leftPx, topPx, instant) {
    if (instant) {
      noBtn.style.transitionDuration = '0ms';
      noBtn.style.left = `${leftPx}px`;
      noBtn.style.top = `${topPx}px`;
      noBtn.style.transform = 'translate(0, 0)';
      requestAnimationFrame(() => {
        noBtn.style.transitionDuration = '';
      });
      return;
    }

    noBtn.style.left = `${leftPx}px`;
    noBtn.style.top = `${topPx}px`;
    noBtn.style.transform = 'translate(0, 0)';
  }

  function positionNoNearRight() {
    const y = yesBtn.getBoundingClientRect();
    const b = getMoveBounds();

    if (b.maxLeft <= b.minLeft || b.maxTop <= b.minTop) return;

    const left = clamp(y.right - b.cardRect.left + 10, b.minLeft, b.maxLeft);
    const top = clamp(y.top - b.cardRect.top, b.minTop, b.maxTop);
    setNoPos(left, top, true);
  }

  function getEventPoint(e) {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches[0]) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
      return { x: e.clientX, y: e.clientY };
    }
    return null;
  }

  function escape(instant, point) {
    const y = yesBtn.getBoundingClientRect();
    const b = getMoveBounds();

    if (b.maxLeft <= b.minLeft || b.maxTop <= b.minTop) {
      positionNoNearRight();
      return;
    }

    const yesCenter = {
      x: (y.left + y.right) / 2,
      y: (y.top + y.bottom) / 2,
    };

    let best = null;
    let bestScore = -Infinity;

    for (let i = 0; i < 60; i++) {
      const left = randomBetween(b.minLeft, b.maxLeft);
      const top = randomBetween(b.minTop, b.maxTop);

      const cand = {
        left: b.cardRect.left + left,
        top: b.cardRect.top + top,
        right: b.cardRect.left + left + noBtn.offsetWidth,
        bottom: b.cardRect.top + top + noBtn.offsetHeight,
      };

      const candCenter = {
        x: (cand.left + cand.right) / 2,
        y: (cand.top + cand.bottom) / 2,
      };

      const distYes = distance(candCenter.x, candCenter.y, yesCenter.x, yesCenter.y);
      if (distYes < MIN_DIST_FROM_YES) continue;
      if (rectsOverlap(cand, y)) continue;

      const distPointer = point
        ? distance(candCenter.x, candCenter.y, point.x, point.y)
        : Math.random() * 60;
      const score = distPointer + distYes * 0.45;

      if (score > bestScore) {
        bestScore = score;
        best = { left, top };
      }
    }

    if (!best) {
      positionNoNearRight();
      return;
    }

    setNoPos(best.left, best.top, !!instant);
  }

  function nearNo(point, threshold) {
    const rect = noBtn.getBoundingClientRect();
    const cx = (rect.left + rect.right) / 2;
    const cy = (rect.top + rect.bottom) / 2;
    return distance(point.x, point.y, cx, cy) < threshold;
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

  function initPosition() {
    if (!noBtn.offsetWidth || !noBtn.offsetHeight) {
      requestAnimationFrame(initPosition);
      return;
    }
    positionNoNearRight();
    noBtn.style.opacity = '1';
  }

  // -------- NO: never clickable --------
  ['click', 'mousedown', 'mouseup'].forEach((evt) => {
    noBtn.addEventListener(
      evt,
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        escape(true, getEventPoint(e));
        return false;
      },
      { passive: false }
    );
  });

  // Button-target events
  noBtn.addEventListener('pointerenter', (e) => escape(false, getEventPoint(e)));
  noBtn.addEventListener('pointermove', (e) => escape(false, getEventPoint(e)));
  noBtn.addEventListener('focus', () => escape(true, null));

  noBtn.addEventListener(
    'pointerdown',
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      escape(true, getEventPoint(e));
    },
    { passive: false }
  );

  noBtn.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      escape(true, getEventPoint(e));
    },
    { passive: false }
  );

  // Card chase events: as your finger/mouse gets near "No", it runs away.
  card.addEventListener('pointermove', (e) => {
    const point = getEventPoint(e);
    if (!point) return;
    if (nearNo(point, CHASE_TRIGGER_DIST)) escape(false, point);
  });

  card.addEventListener(
    'touchstart',
    (e) => {
      const point = getEventPoint(e);
      if (!point) return;
      if (nearNo(point, CHASE_TRIGGER_DIST)) {
        e.preventDefault();
        escape(true, point);
      }
    },
    { passive: false }
  );

  card.addEventListener(
    'touchmove',
    (e) => {
      const point = getEventPoint(e);
      if (!point) return;
      if (nearNo(point, CHASE_TRIGGER_DIST)) {
        e.preventDefault();
        escape(false, point);
      }
    },
    { passive: false }
  );

  window.addEventListener('resize', () => positionNoNearRight());
  window.addEventListener('orientationchange', () => positionNoNearRight());

  requestAnimationFrame(() => requestAnimationFrame(initPosition));
})();
