// ── PXYZ boot sequence — take 2: the PS2 void as a soft memory ──
// No self-test this time. The dark comes into focus, a quiet sil.via ♡
// pre-title holds for a beat (the SCE screen, remembered), towers of light
// drift up out of the deep — memory card data, reinterpreted — and the
// wordmark surfaces into all that space before the whole thing dissolves
// into the page. Pacing and easings live in boot.css.
//
// The overlay markup lives in index.html but is display:none (see boot.css)
// until this file flags <html class="pxyz-boot">, so no-JS visitors — and
// everyone on a normal page load — just get the plain page.
//
// The only way in is the footer's PRESS START control, which runs the
// sequence on demand via replay().
(function () {
    'use strict';

    var root   = document.documentElement;
    var liveEl = document.getElementById('bootscreen');

    // No overlay markup at all — nothing to play and nothing to replay.
    if (!liveEl) return;

    // Pristine copy taken up front, so every replay starts from exactly the
    // markup the first run got.
    var template = liveEl.cloneNode(true);

    // One sequence at a time. Stays true through the teardown fade as well, so
    // a second press mid-exit can't stack two overlays on top of each other.
    var running = false;

    // Hard backstop. If the timeline somehow never reaches its own hand-off —
    // a throttled background tab, a handler that threw part-way through — the
    // overlay still gets out of the way rather than sitting over the page.
    // Set well past the end of the sequence so a normal run never trips it.
    var FAILSAFE_MS = 14000;

    // ── One run of the sequence ──
    // Everything with a lifetime — timers, the skip binding, the done latch —
    // lives inside here, so a replay can never inherit the last run's state.
    // `bootEl` is the overlay copy this run owns and tears down when it ends.
    function run(bootEl) {
        var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        var timers  = [];
        var done    = false;

        function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

        function clearAll() {
            for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
            timers = [];
        }

        // ── Reveal / hand-off ──
        // `cut` = user skipped or reduced motion: quick soft fade.
        // otherwise: the slow dissolve — the void softens and the page is
        // simply there underneath.
        function reveal(cut) {
            if (done) return;
            done = true;
            clearAll();
            unbindSkip();

            // Release the page's entrance animations at the same instant the
            // overlay starts clearing, so the console frame is materialising
            // as the void softens away and the menu stagger follows on.
            root.classList.remove('pxyz-hold');
            bootEl.classList.add(cut ? 'boot-cut' : 'boot-out');

            // Long enough to outlast the exit animation in boot.css: the
            // dissolve runs 1.15s, the cut 0.34s.
            setTimeout(function () {
                if (bootEl.parentNode) bootEl.parentNode.removeChild(bootEl);
                root.classList.remove('pxyz-boot');
                running = false;
            }, cut ? 380 : 1200);
        }

        // ── Skip on any input ──
        function onSkip(e) {
            // Let people still use browser chrome shortcuts without eating the key.
            if (e.type === 'keydown' && (e.metaKey || e.ctrlKey)) return;
            reveal(true);
        }

        function bindSkip() {
            document.addEventListener('keydown',     onSkip, true);
            document.addEventListener('pointerdown', onSkip, true);
            document.addEventListener('touchstart',  onSkip, true);
        }

        function unbindSkip() {
            document.removeEventListener('keydown',     onSkip, true);
            document.removeEventListener('pointerdown', onSkip, true);
            document.removeEventListener('touchstart',  onSkip, true);
        }

        // Bound one tick late so the click or keypress that asked for a replay
        // doesn't land on these listeners and skip the sequence it just
        // started. Going through `at` means an early reveal cancels the bind
        // instead of racing it.
        at(0, bindSkip);

        // Deliberately outside `timers`, so clearAll() can't take the backstop
        // with it. reveal() is idempotent, so on any normal finish this is a
        // no-op that fires into an already-done run.
        setTimeout(function () { reveal(true); }, FAILSAFE_MS);

        // ── Reduced motion: show the wordmark for a beat, then fade ──
        // Stays short on purpose — the point is to not sit through motion.
        if (reduced) {
            bootEl.classList.add('boot-reduced');
            bootEl.classList.add('phase-logo');
            at(700, function () { reveal(true); });
            return;
        }

        // ── Timeline ──
        // Phase classes accumulate rather than replace each other, so the
        // towers keep drifting under the wordmark once they're up. Roughly:
        //   0.0s  the void comes into focus (CSS, runs on display)
        //   1.0s  sil.via ♡ pre-title surfaces, holds
        //   3.4s  pre-title lets go; the light towers start rising
        //   4.8s  wordmark surfaces out of the deep, licence strip lands last
        //   8.6s  dissolve into the page (~9.7s door to door)
        // Skippable throughout.
        at(1000, function () { bootEl.classList.add('phase-sce');  });
        at(3400, function () { bootEl.classList.add('phase-rise'); });
        at(4800, function () { bootEl.classList.add('phase-logo'); });
        at(8600, function () { reveal(false); });
    }

    // ── Entry points ──

    function start(bootEl) {
        if (running) return;
        running = true;
        root.classList.add('pxyz-boot');
        run(bootEl);
    }

    // Manual re-run from the footer control — the only way the sequence ever
    // plays now that there's no automatic cold-load boot.
    function replay() {
        if (running) return;

        // Clear out whatever overlay copy is still in the document — nothing,
        // on a first press, since the original markup was never armed — then
        // work from a clean clone. Also keeps #bootscreen a unique id at all
        // times across repeated presses.
        var stale = document.getElementById('bootscreen');
        if (stale && stale.parentNode) stale.parentNode.removeChild(stale);

        var fresh = template.cloneNode(true);
        document.body.appendChild(fresh);

        // Rewind the page's own entrance animations so the hand-off lands the
        // way it does on a cold load. .pxyz-hold alone can't do it: pausing an
        // animation that already finished just holds it at the end, so the
        // animation is dropped for a frame and re-applied from zero — paused,
        // because .pxyz-hold is already on by the time it comes back.
        root.classList.add('pxyz-rewind');
        root.classList.add('pxyz-hold');
        void root.offsetWidth;
        root.classList.remove('pxyz-rewind');

        start(fresh);
    }

    // ── Footer control ──
    // A real <button> in the markup, so Enter/Space activation, focus order
    // and the accessible role all come for free.
    var replayBtn = document.querySelector('.press-start');
    if (replayBtn) replayBtn.addEventListener('click', replay);
})();
