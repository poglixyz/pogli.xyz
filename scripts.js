document.body.addEventListener("pointermove", ({ x, y }) => {
    document.documentElement.style.setProperty("--x", x.toFixed(2));
    document.documentElement.style.setProperty(
      "--xp",
      (x / window.innerWidth).toFixed(2)
    );
    document.documentElement.style.setProperty("--y", y.toFixed(2));
    document.documentElement.style.setProperty(
      "--yp",
      (y / window.innerHeight).toFixed(2)
    );
    
    console.log('x', x);
    console.log('xp', (x / window.innerWidth).toFixed(2));
    console.log(window.innerWidth);
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const textToCopy = e.target.getAttribute('data-copy');
            if (textToCopy) {
                e.preventDefault();
                navigator.clipboard.writeText(textToCopy).then(() => {
                    console.log(`Copied to clipboard: ${textToCopy}`);
                    alert(`Copied to clipboard: ${textToCopy}`);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        });
    });
});
