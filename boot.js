// ── PXYZ boot sequence ──
// Remembers the fantasy console rather than powering it on: the dusk haze
// comes into focus, the self-test reads itself back, the wordmark surfaces,
// and the whole thing dissolves into the page. Everything is paced for long
// cross-fades — see boot.css for the matching easings.
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

    // Pristine copy, taken before the self-test writes into the readout, so
    // every replay starts from exactly the markup the first boot got.
    var template = liveEl.cloneNode(true);

    // One sequence at a time. Stays true through the teardown fade as well, so
    // a second press mid-exit can't stack two overlays on top of each other.
    var running = false;

    // ── Self-test table ──
    // value === null means the line owns a live counter instead of static text.
    var POST = [
        ['MAIN PROCESSOR',     'HEART-CORE 900MHZ', 'ok'],
        ['MAIN MEMORY',        null,                'ok'],
        ['VIDEO RAM',          '4096K NTSC-J',      'ok'],
        ['DISC DRIVE',         'NO DISC',           'skip'],
        ['CONTROLLER PORT 1',  'CONNECTED',         'ok'],
        ['MEMORY CARD SLOT 1', '8 BLOCKS FREE',     'ok'],
        ['CHAO GARDEN LINK',   'HERO / ONLINE',     'ok'],
        ['NETWORK UPLINK',     'POGLI.XYZ',         'ok']
    ];

    var MEM_TOTAL = 512;

    // Hard backstop. If the timeline somehow never reaches its own hand-off —
    // a throttled background tab, a handler that threw part-way through — the
    // overlay still gets out of the way rather than sitting over the page.
    // Set well past the end of the sequence so a normal run never trips it.
    var FAILSAFE_MS = 14000;

    function pad(n, width) {
        var s = String(n);
        while (s.length < width) s = '0' + s;
        return s;
    }

    // ── One run of the sequence ──
    // Everything with a lifetime — timers, the skip binding, the done latch —
    // lives inside here, so a replay can never inherit the last run's state.
    // `bootEl` is the overlay copy this run owns and tears down when it ends.
    function run(bootEl) {
        var reduced   = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        var timers    = [];
        var intervals = [];
        var done      = false;

        function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

        function every(ms, fn) {
            var id = setInterval(function () { fn(id); }, ms);
            intervals.push(id);
            return id;
        }

        function clearAll() {
            for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
            for (var j = 0; j < intervals.length; j++) clearInterval(intervals[j]);
            timers = [];
            intervals = [];
        }

        // ── Reveal / hand-off ──
        // `cut` = user skipped or reduced motion: quick soft fade.
        // otherwise: the slow dissolve — warm light up, picture out of focus,
        // page already sitting underneath.
        function reveal(cut) {
            if (done) return;
            done = true;
            clearAll();
            unbindSkip();

            // Release the page's entrance animations at the same instant the
            // overlay starts clearing. The console frame's own 0.3s delay then
            // runs underneath the fade, so it's already materialising as the
            // boot screen softens away and the menu stagger follows straight on.
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
            document.addEventListener('keydown',   onSkip, true);
            document.addEventListener('pointerdown', onSkip, true);
            document.addEventListener('touchstart', onSkip, true);
        }

        function unbindSkip() {
            document.removeEventListener('keydown',   onSkip, true);
            document.removeEventListener('pointerdown', onSkip, true);
            document.removeEventListener('touchstart', onSkip, true);
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

        // ── Build the POST readout ──
        // Scoped to this run's overlay rather than the document, so a replay
        // can never write into a copy that's still fading out.
        var linesEl = bootEl.querySelector('#boot-lines');
        var loadEl  = bootEl.querySelector('#boot-load');

        // Markup drifted out from under us — bail to the plain page rather than
        // sitting on a half-built boot screen.
        if (!linesEl || !loadEl) { reveal(true); return; }

        var memEl   = null;
        var memLine = -1;
        var stats   = [];

        POST.forEach(function (row, i) {
            var line = document.createElement('div');
            line.className = 'post-line';

            var label = document.createElement('span');
            label.className = 'pl-label';
            label.textContent = row[0];

            var dots = document.createElement('span');
            dots.className = 'pl-dots';

            var value = document.createElement('span');
            value.className = 'pl-value';
            if (row[1] === null) {
                value.textContent = pad(0, 6) + 'K';
                memEl   = value;
                memLine = i;
            } else {
                value.textContent = row[1];
            }

            var stat = document.createElement('span');
            stat.className = 'pl-stat ' + row[2];
            stat.textContent = row[2] === 'skip' ? 'SKIP' : 'OK';

            line.appendChild(label);
            line.appendChild(dots);
            line.appendChild(value);
            line.appendChild(stat);
            linesEl.appendChild(line);
            stats.push(stat);
        });

        // ── Timeline ──
        // Slow on purpose. Every phase overlaps the next rather than cutting
        // to it: the haze focuses to ~2.1s, the self-test drifts in through
        // ~4s, the hand-off line glows up at 3.6s, and the wordmark starts
        // surfacing at 4.6s while the self-test is still going soft. About
        // 9.5s door to door, skippable throughout.
        var LINE_STEP  = 250;   // gap between self-test lines
        var LINE_START = 1000;
        var STAMP_LAG  = 500;   // OK/SKIP settles well after the line does

        at(620, function () { bootEl.classList.add('phase-post'); });

        POST.forEach(function (row, i) {
            var t = LINE_START + i * LINE_STEP;
            at(t, function () { linesEl.children[i].classList.add('on'); });

            // The memory line withholds its stamp until the count finishes.
            if (row[1] !== null) {
                at(t + STAMP_LAG, function () { stats[i].classList.add('on'); });
            }
        });

        // Memory check counter — ticks up to 512K, then stamps OK. Unhurried:
        // a number being remembered, not a benchmark running.
        if (memLine > -1) {
            at(LINE_START + memLine * LINE_STEP + 320, function () {
                var value = 0;
                every(16, function (id) {
                    value = Math.min(MEM_TOTAL, value + 4);
                    memEl.textContent = pad(value, 6) + 'K';
                    if (value >= MEM_TOTAL) {
                        clearInterval(id);
                        stats[memLine].classList.add('on');
                    }
                });
            });
        }

        // Hand-off line under the self-test. Written in one go and glowed up
        // by CSS — the old character-by-character typing was the sharpest
        // thing on the screen, and this sequence isn't in a hurry.
        var LOAD_TEXT = '> LOADING sil.via ♡ v2.0';
        at(3600, function () {
            loadEl.textContent = LOAD_TEXT;
            loadEl.classList.add('on');
        });

        // Wordmark starts surfacing while the self-test is still blurring
        // away — the two overlap for well over a second. Its own animations
        // run ~3.15s from here, the licence strip landing last.
        at(4600, function () { bootEl.classList.add('phase-logo'); });

        // Dissolve into the site, ~700ms after the last line of the wordmark
        // settles. That pause is the console-logo moment, and it's the reason
        // the hand-off isn't simply chained off the logo phase.
        at(8450, function () { reveal(false); });
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
