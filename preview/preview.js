const scenario = new URLSearchParams(location.search).has('noboard') ? 'noboard' : new URLSearchParams(location.search).has('hold') ? 'hold' : 'mate';
document.querySelector(`[data-scenario="${scenario}"]`).setAttribute('aria-current', 'page');

    (async function () {
      // Pull the real panel markup so the preview can never drift from it.
      const html = await (await fetch('../sidepanel/sidepanel.html')).text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const host = document.getElementById('panel-host');
      host.textContent = '';
      // Move every body node except the script tags.
      Array.from(doc.body.childNodes).forEach((node) => {
        if (node.nodeType === 1 && node.tagName === 'SCRIPT') return;
        host.appendChild(document.importNode(node, true));
      });
      // Then boot the real controller.
      const script = document.createElement('script');
      script.src = '../sidepanel/sidepanel.js';
      document.body.appendChild(script);
    })().catch((err) => {
      document.getElementById('panel-host').textContent = 'Preview failed to load: ' + err;
    });
