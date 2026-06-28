// ── Y2K floating icons ──
// decorative icons floating around the console box.
(function () {
    // seeded RNG — deterministic chaos
    function seededRng(seed) {
        let s = (seed ^ 0xDEADBEEF) >>> 0;
        return function () {
            s = (Math.imul(1664525, s) + 1013904223) | 0;
            return (s >>> 0) / 4294967296;
        };
    }

    const tints = [
        'sepia(0.4) saturate(4) hue-rotate(265deg) brightness(1.1)',
        'sepia(0.5) saturate(4) hue-rotate(188deg) brightness(1.1)',
        'sepia(0.2) saturate(2) hue-rotate(260deg) brightness(1.15)',
        'sepia(0.6) saturate(5) hue-rotate(275deg) brightness(1.05)',
        'sepia(0.4) saturate(3) hue-rotate(180deg) brightness(1.15)',
    ];

    const glowColors = [
        'rgba(255,180,255,0.55)', 'rgba(140,200,255,0.55)',
        'rgba(220,200,255,0.5)',  'rgba(255,160,255,0.55)',
        'rgba(163,208,255,0.55)',
    ];

    const placements = [
        { left: '10%', top: '26%', img: 1 },
        { left: '6%',  top: '46%', img: 2 },
        { left: '14%', top: '62%', img: 3 },
        { left: '20%', top: '36%', img: 4 },
        { left: '4%',  top: '72%', img: 5 },
        { left: '79%', top: '29%', img: 6 },
        { left: '86%', top: '50%', img: 7 },
        { left: '76%', top: '64%', img: 8 },
        { left: '90%', top: '39%', img: 9 },
        { left: '82%', top: '72%', img: 1 },
        { left: '93%', top: '57%', img: 3 },
        { left: '17%', top: '77%', img: 6 },
    ];

    // session epoch persists across page navigation so animation phase stays continuous.
    if (!sessionStorage.getItem('pxyz_t0')) {
        sessionStorage.setItem('pxyz_t0', Date.now());
    }
    const elapsed = (Date.now() - +sessionStorage.getItem('pxyz_t0')) / 1000;

    // Compute all icon properties once (seeded) so they're identical on every page
    const iconData = placements.map((_, i) => {
        const r    = seededRng(i * 0x9E3779B9);
        const dy   = (7  + r() * 11).toFixed(1);
        const dir  = r() < 0.5 ? '' : '-';
        const rot  = r() < 0.5 ? 12 : -12;
        const size = (22 + r() * 20).toFixed(0);
        const dur  = +(5  + r() * 8).toFixed(1);
        return { dy, dir, rot, size, dur };
    });

    const style = document.createElement('style');
    style.textContent = iconData.map(({ dy, dir, rot }, i) =>
        `@keyframes y2k-move-${i} {
            0%,100% { transform: translateY(0) rotate(0deg); }
            50%      { transform: translateY(${dir}${dy}px) rotate(${rot}deg); }
        }`
    ).join('\n');
    document.head.appendChild(style);

    placements.forEach((pos, i) => {
        const { size, dur } = iconData[i];
        const tint  = tints[i % tints.length];
        const glow  = glowColors[i % glowColors.length];
        // Negative delay syncs to the continuous session timeline
        const phase = -(elapsed % dur).toFixed(2);

        const img = document.createElement('img');
        img.src = `/img/y2k-${pos.img}.png`;
        img.setAttribute('aria-hidden', 'true');
        img.style.cssText = [
            'position:fixed',
            `left:${pos.left}`,
            `top:${pos.top}`,
            `width:${size}px`,
            `height:${size}px`,
            'object-fit:contain',
            `filter:${tint} drop-shadow(0 0 8px ${glow})`,
            'opacity:0.7',
            'pointer-events:none',
            'z-index:2',
            'user-select:none',
            `animation:y2k-move-${i} ${dur}s ease-in-out ${phase}s infinite`,
        ].join(';');

        document.body.appendChild(img);
    });
})();

// ── Ambient orbs (slow drifting glow blobs) ──
// six soft glow blobs drifting upward. purely atmospheric.
(function () {
    const container = document.querySelector('.orbs');
    if (!container) return;

    const palette = [
        'rgba(255, 180, 255, VAL)',
        'rgba(163, 208, 255, VAL)',
        'rgba(255, 240, 255, VAL)',
        'rgba(200, 220, 255, VAL)',
    ];

    for (let i = 0; i < 6; i++) {
        const orb = document.createElement('div');
        orb.className = 'orb';
        const size   = 120 + Math.random() * 200;
        const color  = palette[i % palette.length].replace('VAL', (0.12 + Math.random() * 0.1).toFixed(2));
        const dur    = (18 + Math.random() * 24).toFixed(1);
        const delay  = -(Math.random() * 20).toFixed(1);
        const left   = (Math.random() * 90).toFixed(1);
        const top    = (20 + Math.random() * 60).toFixed(1);

        orb.style.cssText = [
            `width:${size}px`,
            `height:${size}px`,
            `background:radial-gradient(circle, ${color}, transparent 70%)`,
            `left:${left}%`,
            `top:${top}%`,
            `animation-duration:${dur}s`,
            `animation-delay:${delay}s`,
        ].join(';');

        container.appendChild(orb);
    }
})();

// ── Floating particles (rising dust motes) ──
// tiny specks rising from the garden floor. probably dust. possibly baby stars. i'm not deciding.
(function () {
    const container = document.querySelector('.particles');
    if (!container) return;

    const colors = [
        'rgba(255, 214, 255, ALF)',
        'rgba(163, 208, 255, ALF)',
        'rgba(255, 255, 255, ALF)',
    ];

    function spawnParticle() {
        const p = document.createElement('div');
        const size   = 1 + Math.random() * 2.5;
        const left   = (Math.random() * 100).toFixed(2);
        const top    = (40 + Math.random() * 55).toFixed(2);
        const drift  = ((Math.random() - 0.5) * 60).toFixed(1) + 'px';
        const dur    = (6 + Math.random() * 10).toFixed(1);
        const delay  = (Math.random() * 8).toFixed(1);
        const color  = colors[Math.floor(Math.random() * colors.length)]
                           .replace('ALF', (0.3 + Math.random() * 0.5).toFixed(2));

        p.style.cssText = [
            'position:absolute',
            `width:${size}px`,
            `height:${size}px`,
            `background:${color}`,
            'border-radius:50%',
            `left:${left}%`,
            `top:${top}%`,
            `--drift:${drift}`,
            `animation:particle-rise ${dur}s ease-in-out ${delay}s infinite`,
        ].join(';');

        container.appendChild(p);
    }

    for (let i = 0; i < 28; i++) spawnParticle();
})();

// ── Floating hearts ──
// ♡ ♥ ♡ — added these myself. as a treat. for everyone. no further comment.
(function () {
    const container = document.querySelector('.particles');
    if (!container) return;

    const hearts = ['♥', '♡'];
    const colors = [
        'rgba(255, 214, 255, ALF)',
        'rgba(255, 180, 255, ALF)',
        'rgba(255, 240, 255, ALF)',
    ];

    function spawnHeart() {
        const h = document.createElement('span');
        h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        const size  = (8 + Math.random() * 7).toFixed(1);
        const left  = (Math.random() * 100).toFixed(2);
        const top   = (45 + Math.random() * 50).toFixed(2);
        const drift = ((Math.random() - 0.5) * 50).toFixed(1) + 'px';
        const dur   = (9 + Math.random() * 13).toFixed(1);
        const delay = (Math.random() * 14).toFixed(1);
        const color = colors[Math.floor(Math.random() * colors.length)]
                          .replace('ALF', (0.2 + Math.random() * 0.38).toFixed(2));

        h.style.cssText = [
            'position:absolute',
            `font-size:${size}px`,
            `color:${color}`,
            `left:${left}%`,
            `top:${top}%`,
            `--drift:${drift}`,
            `animation:particle-rise ${dur}s ease-in-out ${delay}s infinite`,
            'pointer-events:none',
            'user-select:none',
            'line-height:1',
        ].join(';');

        container.appendChild(h);
    }

    for (let i = 0; i < 14; i++) spawnHeart();
})();

// ── Stars ──
// the hero garden energy
(function () {
    const container = document.querySelector('.stars');
    if (!container) return;
    for (let i = 0; i < 45; i++) {
        const s     = document.createElement('div');
        const size  = Math.random() < 0.8 ? 1 : 2;
        const alpha = (0.15 + Math.random() * 0.45).toFixed(2);
        const dur   = (3 + Math.random() * 5).toFixed(1);
        const delay = (Math.random() * 5).toFixed(1);
        const color = Math.random() < 0.5 ? `rgba(255,210,255,${alpha})` : `rgba(200,225,255,${alpha})`;

        s.style.cssText = [
            'position:absolute',
            `width:${size}px`,
            `height:${size}px`,
            `background:${color}`,
            'border-radius:50%',
            `left:${(Math.random() * 100).toFixed(2)}%`,
            `top:${(Math.random() * 100).toFixed(2)}%`,
            `animation:twinkle ${dur}s ease-in-out ${delay}s infinite`,
        ].join(';');
        container.appendChild(s);
    }
})();


// ── Status bar clock ──
// time is passing. i'm tracking it. nothing weird about that.
function updateClock() {
    const el = document.getElementById('clock');
    if (el) el.textContent = new Date().toTimeString().slice(0, 8);
}
setInterval(updateClock, 1000);
updateClock();

// ── Uptime counter (works for both #uptime and #d-uptime) ──
// the timer claims the console has been on for hours already. confidence beats accuracy.
(function () {
    const el = document.getElementById('uptime') || document.getElementById('d-uptime');
    if (!el) return;
    const OFFSET_S = 13370; // 13370 — leet for 'already been here a while'
    const start = Date.now();
    function pad(n) { return String(n).padStart(2, '0'); }
    function tick() {
        const s   = Math.floor((Date.now() - start) / 1000) + OFFSET_S;
        const h   = Math.floor(s / 3600);
        const m   = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        el.textContent = `UP: ${pad(h)}:${pad(m)}:${pad(sec)}`;
    }
    setInterval(tick, 1000);
    tick();
})();

// ── Click heart burst ──
// 8 hearts on every click, everywhere, forever. chaos control, benign edition.
(function () {
    const hearts = ['♥', '♡'];
    const style = document.createElement('style');
    style.textContent = `@keyframes heart-burst {
        0%   { opacity: 1; transform: translate(0, 0) scale(1.2); }
        100% { opacity: 0; transform: translate(var(--hx), var(--hy)) scale(0.3); }
    }`;
    document.head.appendChild(style);

    document.addEventListener('click', function (e) {
        const count = 8;
        for (let i = 0; i < count; i++) {
            const h = document.createElement('span');
            h.textContent = hearts[Math.floor(Math.random() * hearts.length)];

            const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.9;
            const dist  = 30 + Math.random() * 55;
            const dx    = Math.cos(angle) * dist;
            const dy    = Math.sin(angle) * dist - 28;
            const size  = (8 + Math.random() * 9).toFixed(1);
            const alpha = (0.65 + Math.random() * 0.35).toFixed(2);
            const roll  = Math.random();
            const color = roll < 0.45
                ? `rgba(255, 180, 255, ${alpha})`
                : roll < 0.75
                    ? `rgba(163, 208, 255, ${alpha})`
                    : `rgba(255, 240, 255, ${alpha})`;
            const dur   = (0.5 + Math.random() * 0.35).toFixed(2);

            h.style.cssText = [
                'position:fixed',
                `left:${e.clientX}px`,
                `top:${e.clientY}px`,
                `font-size:${size}px`,
                `color:${color}`,
                'pointer-events:none',
                'user-select:none',
                'line-height:1',
                'z-index:9999',
                `--hx:${dx.toFixed(1)}px`,
                `--hy:${dy.toFixed(1)}px`,
                `animation:heart-burst ${dur}s ease-out forwards`,
            ].join(';');

            document.body.appendChild(h);
            h.addEventListener('animationend', () => h.remove());
        }
    });
})();

// ── Ticker content generator ──
// every load gets a fresh shuffle. rare messages are 10% per slot —
// spotting CHAO MOOD: ♡ in the wild is based.
function buildTickerContent() {
    const common = [
        'WELCOME',
        'MEM: 512K / OK',
        'MEMORY CARD SLOT 1',
        'NO DISC INSERTED',
        'SIGNAL: ████████░░',
        'STANDBY MODE',
        'SYS_VER: NTSC-J',
        'UPLINK STABLE',
        'CONTROLLER 1 CONNECTED',
        'CONTROLLER 2 CONNECTED',
        'VIDEO MODE: AV',
        'CHAO WORLD: CONNECTED',
    ];
    const rare = [
        'CHAO LOBBY: ONLINE',
        'GARDEN LINK: ACTIVE',
        'CHAO MOOD: !',
        'CHAO MOOD: ?',
        'CHAO MOOD: ♡',
        'CHAOS CONTROL: READY',
        'HERO GARDEN: ONLINE',
        'DARK GARDEN: RESTRICTED',
    ];

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    const shuffledCommon = shuffle(common);
    const shuffledRare   = shuffle(rare);
    let rareIdx = 0;
    const messages = [];

    for (const msg of shuffledCommon) {
        if (rareIdx < shuffledRare.length && Math.random() < 0.10) {
            messages.push(shuffledRare[rareIdx++]);
        }
        messages.push(msg);
    }

    const sep = '    ';
    return messages.map(m => `◆${sep}${m}${sep}`).join('');
}

// ── Dark mode toggle ──
(function () {
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.theme-toggle');
        if (!btn) return;
        const dark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('pxyz-dark', dark);
        btn.textContent = dark ? '☀ DAY' : '☾ NIGHT';
    });

    document.addEventListener('DOMContentLoaded', function () {
        const btn = document.querySelector('.theme-toggle');
        if (btn) {
            btn.textContent = document.body.classList.contains('dark-mode') ? '☀ DAY' : '☾ NIGHT';
        }
    });
})();

// ── Seamless ticker ──
// pixel-precise loop. measure one unit, clone enough to fill the screen, animate by exactly that width.
// no gaps, no glitches, no telltale jump on reset. took me a minute. worth it.
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.ticker').forEach(ticker => {
        const first = ticker.querySelector('span');
        if (!first) return;

        // inject shuffled content first — measure AFTER so the width is accurate
        first.textContent = buildTickerContent();

        const unitW = first.offsetWidth;
        if (!unitW) return;

        // clone until content fills 3x the viewport — no gaps possible
        const copies = Math.ceil((window.innerWidth * 3) / unitW) + 2;
        ticker.innerHTML = first.outerHTML.repeat(copies);

        // speed ~22 px/s, consistent regardless of how many messages were picked
        const dur = Math.max(20, (unitW / 22).toFixed(1));
        const uid = 'tkr' + Math.random().toString(36).slice(2, 6);
        const style = document.createElement('style');
        style.textContent = `@keyframes ${uid} {
            from { transform: translateX(0); }
            to   { transform: translateX(-${unitW}px); }
        }`;
        document.head.appendChild(style);
        ticker.style.animation = `${uid} ${dur}s linear infinite`;
    });
});
