// ── PXYZ boot sequence ──
// Powers on the fantasy console: CRT snap, BIOS self-test, logo lock, hand-off.
// The overlay markup lives in index.html but is display:none until the inline
// head script flags <html class="pxyz-boot">, so no-JS visitors get the plain
// page and this file is the only thing that can ever put the overlay on screen.
//
// Two ways in: the cold-load play (the head script's session gate decides
// whether it happens) and the footer's PRESS START control, which re-runs the
// sequence on demand. The gate only suppresses the automatic play — asking for
// the boot by hand always works.
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
        // `cut` = user skipped or reduced motion: straight fade.
        // otherwise: CRT power-off collapse with a flash.
        function reveal(cut) {
            if (done) return;
            done = true;
            clearAll();
            unbindSkip();

            // Release the page's entrance animations at the same instant the
            // overlay starts clearing. The console frame's own 0.3s delay then
            // runs underneath the fade, so it's already materialising as the
            // boot screen collapses and the menu stagger follows straight on.
            root.classList.remove('pxyz-hold');
            bootEl.classList.add(cut ? 'boot-cut' : 'boot-out');

            setTimeout(function () {
                if (bootEl.parentNode) bootEl.parentNode.removeChild(bootEl);
                root.classList.remove('pxyz-boot');
                running = false;
            }, cut ? 320 : 720);
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

        // ── Reduced motion: show the wordmark for a beat, then fade ──
        if (reduced) {
            bootEl.classList.add('boot-reduced');
            bootEl.classList.add('phase-logo');
            at(420, function () { reveal(true); });
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
        var LINE_STEP  = 130;   // gap between self-test lines
        var LINE_START = 520;
        var STAMP_LAG  = 250;   // OK/SKIP lands after the line settles

        at(380, function () { bootEl.classList.add('phase-post'); });

        POST.forEach(function (row, i) {
            var t = LINE_START + i * LINE_STEP;
            at(t, function () { linesEl.children[i].classList.add('on'); });

            // The memory line withholds its stamp until the count finishes.
            if (row[1] !== null) {
                at(t + STAMP_LAG, function () { stats[i].classList.add('on'); });
            }
        });

        // Memory check counter — ticks up to 512K, then stamps OK.
        if (memLine > -1) {
            at(LINE_START + memLine * LINE_STEP + 90, function () {
                var value = 0;
                every(11, function (id) {
                    value = Math.min(MEM_TOTAL, value + 8);
                    memEl.textContent = pad(value, 6) + 'K';
                    if (value >= MEM_TOTAL) {
                        clearInterval(id);
                        stats[memLine].classList.add('on');
                    }
                });
            });
        }

        // Typed hand-off line under the self-test.
        var LOAD_TEXT = '> LOADING SYSTEM MENU';
        at(1700, function () {
            var i = 0;
            every(34, function (id) {
                i++;
                loadEl.textContent = LOAD_TEXT.slice(0, i);
                if (i >= LOAD_TEXT.length) clearInterval(id);
            });
        });

        // Wordmark takes the screen.
        at(2080, function () { bootEl.classList.add('phase-logo'); });

        // Power off into the site.
        at(3500, function () { reveal(false); });
    }

    // ── Entry points ──

    function start(bootEl) {
        if (running) return;
        running = true;
        root.classList.add('pxyz-boot');
        run(bootEl);
    }

    // Manual re-run from the footer control. Deliberately ignores the session
    // gate: that gate exists to stop the animation replaying on every
    // navigation, not to stop someone asking for it.
    function replay() {
        if (running) return;

        // Clear out whatever overlay is still in the document — the untouched
        // original if this load was gated, nothing once a run has torn its own
        // copy down — then work from a clean clone. Also keeps #bootscreen a
        // unique id at all times.
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

    // ── Cold load ──
    // Only the head script's gate flags the document. No flag means this
    // session already booted (or storage said so), so the page is up and we
    // just sit waiting for PRESS START.
    if (root.classList.contains('pxyz-boot')) {
        // We're alive, so the "boot.js never loaded" escape hatch isn't needed.
        clearTimeout(window.pxyzBootFailsafe);
        start(liveEl);
    }
})();
