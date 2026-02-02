/*
  Valentine Proposal interactions

  - Yes: replaces content with success state + simple confetti
  - No: never clickable; runs an "escape" behavior on hover/mousemove/touch
*/

(function () {
  const card = document.querySelector('.card');
  const actions = document.getElementById('actions');
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const headline = document.getElementById('headline');
  const confetti = document.getElementById('confetti');

  if (!card || !actions || !yesBtn || !noBtn || !headline || !confetti) return;

  // --- YES button: success state + confetti ---
  yesBtn.addEventListener('click', () => {
    // Replace headline + actions with a cute confirmation.
    headline.textContent = 'Yay! 💖';

    // Hide buttons container entirely.
    actions.style.display = 'none';

    // Add a small success subtext.
    const success = document.createElement('div');
    success.className = 'success';
    success.innerHTML = `
      <p class="successText">Best decision ever. See you on our valentine date ✨</p>
    `;
    headline.insertAdjacentElement('afterend', success);

    popConfetti();
  });

  function popConfetti() {
    const colors = ['#ff3d8d', '#22d3ee', '#fbbf24', '#a78bfa', '#34d399'];
    const pieces = 40;

    for (let i = 0; i < pieces; i++) {
      const el = document.createElement('div');
      el.className = 'confettiPiece';
      el.style.left = Math.random() * 100 + '%';
      el.style.top = '-10px';
      el.style.background = colors[i % colors.length];
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
      el.style.animationDelay = (Math.random() * 120) + 'ms';
      el.style.width = (8 + Math.random() * 10) + 'px';
      el.style.height = (10 + Math.random() * 18) + 'px';
      confetti.appendChild(el);

      // Cleanup
      setTimeout(() => el.remove(), 1200);
    }
  }

  // --- NO button: never clickable and escapes ---

  // Hard-prevent clicks (even if somehow triggered).
  ['click', 'mousedown', 'mouseup'].forEach((evt) => {
    noBtn.addEventListener(
      evt,
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      },
      { passive: false }
    );
  });

  // Place the "No" button initially near the right side of the actions row.
  // We'll move it within the actions bounding box.
  positionNoButtonInitial();

  // Escape triggers
  noBtn.addEventListener('mouseenter', escape);
  actions.addEventListener('mousemove', (e) => {
    // If mouse gets close to the No button, escape.
    if (distanceToButton(e.clientX, e.clientY) < 90) escape();
  });

  // Touch support
  actions.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      if (distanceToButton(t.clientX, t.clientY) < 110) escape(true);
    },
    { passive: true }
  );

  function positionNoButtonInitial() {
    // Make it absolute inside the actions container.
    actions.style.position = 'relative';
    noBtn.style.position = 'absolute';

    // Put it roughly to the right of the yes button.
    const a = actions.getBoundingClientRect();
    const y = yesBtn.getBoundingClientRect();

    const left = clamp((y.left - a.left) + y.width + 16, 8, a.width - noBtn.offsetWidth - 8);
    const top = clamp((y.top - a.top), 6, a.height - noBtn.offsetHeight - 6);

    noBtn.style.left = `${left}px`;
    noBtn.style.top = `${top}px`;
  }

  function distanceToButton(x, y) {
    const b = noBtn.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function escape(isTouch) {
    // Choose a random position inside the actions container, clamped.
    const a = actions.getBoundingClientRect();
    const y = yesBtn.getBoundingClientRect();

    const pad = 8;
    const minDist = 80; // keep away from Yes

    let tries = 0;
    while (tries < 30) {
      tries++;

      const left = randomBetween(pad, a.width - noBtn.offsetWidth - pad);
      const top = randomBetween(pad, a.height - noBtn.offsetHeight - pad);

      // Candidate rect in viewport coordinates
      const cand = {
        left: a.left + left,
        top: a.top + top,
        width: noBtn.offsetWidth,
        height: noBtn.offsetHeight,
      };

      // Ensure it stays within viewport + card (actions is already within card)
      if (cand.left < 0 || cand.top < 0) continue;

      // Keep distance from Yes button
      const dx = (cand.left + cand.width / 2) - (y.left + y.width / 2);
      const dy = (cand.top + cand.height / 2) - (y.top + y.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) continue;

      noBtn.style.left = `${left}px`;
      noBtn.style.top = `${top}px`;

      // On touch, be instant; on mouse, smooth (CSS transition is already set)
      if (isTouch) {
        noBtn.style.transitionDuration = '0ms';
        requestAnimationFrame(() => {
          noBtn.style.transitionDuration = '180ms';
        });
      }

      return;
    }
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }
})();
