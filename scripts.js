// Stars generator
(function () {
    const container = document.querySelector('.stars');
    if (!container) return;
    for (let i = 0; i < 65; i++) {
        const s = document.createElement('div');
        const size = Math.random() < 0.75 ? 1 : 2;
        const alpha = (0.2 + Math.random() * 0.65).toFixed(2);
        const dur = (2.5 + Math.random() * 4).toFixed(1);
        const delay = (Math.random() * 4).toFixed(1);
        s.style.cssText = [
            'position:absolute',
            `width:${size}px`,
            `height:${size}px`,
            `background:rgba(200,180,255,${alpha})`,
            'border-radius:50%',
            `left:${(Math.random() * 100).toFixed(2)}%`,
            `top:${(Math.random() * 100).toFixed(2)}%`,
            `animation:twinkle ${dur}s ease-in-out ${delay}s infinite`,
        ].join(';');
        container.appendChild(s);
    }
})();

// Status bar clock
function updateClock() {
    const el = document.getElementById('clock');
    if (el) el.textContent = new Date().toTimeString().slice(0, 8);
}
setInterval(updateClock, 1000);
updateClock();

// Clipboard links (preserved from original)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', e => {
            const text = e.currentTarget.getAttribute('data-copy');
            if (text) {
                e.preventDefault();
                navigator.clipboard.writeText(text).catch(() => {});
            }
        });
    });
});
