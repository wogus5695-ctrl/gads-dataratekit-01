import { spawn } from 'node:child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testMobileIframe(url) {
  const port = 9338;
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await listRes.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));

    let id = 1;
    function send(m, p = {}) {
      return new Promise((res) => {
        const i = id++;
        ws.addEventListener('message', function h(e) {
          const d = JSON.parse(e.data);
          if (d.id === i) {
            ws.removeEventListener('message', h);
            res(d.result);
          }
        });
        ws.send(JSON.stringify({ id: i, method: m, params: p }));
      });
    }

    await send('Page.enable');
    await send('Page.navigate', { url: 'about:blank' });

    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return new Promise((resolve) => {
            const frame = document.createElement('iframe');
            frame.style.width = '390px';
            frame.style.height = '844px';
            frame.style.border = 'none';
            frame.src = '${url}';
            document.body.appendChild(frame);

            frame.onload = () => {
              setTimeout(() => {
                const doc = frame.contentDocument;
                const docEl = doc.documentElement;
                const body = doc.body;

                const overflowing = [];
                doc.querySelectorAll('*').forEach((el) => {
                  const rect = el.getBoundingClientRect();
                  if (rect.right > docEl.clientWidth + 1 || el.scrollWidth > el.clientWidth + 1) {
                    overflowing.push({
                      tag: el.tagName,
                      className: el.className,
                      clientWidth: el.clientWidth,
                      scrollWidth: el.scrollWidth,
                      right: Math.round(rect.right),
                      width: Math.round(rect.width)
                    });
                  }
                });

                resolve({
                  innerWidth: frame.contentWindow.innerWidth,
                  docClientWidth: docEl.clientWidth,
                  docScrollWidth: docEl.scrollWidth,
                  bodyClientWidth: body.clientWidth,
                  bodyScrollWidth: body.scrollWidth,
                  overflowingElements: overflowing
                });
              }, 500);
            };
          });
        })()
      `,
      awaitPromise: true,
      returnByValue: true,
    });

    console.log('EXACT 390PX VIEWPORT RESULT FOR ' + url + ':');
    console.log(JSON.stringify(evalRes.result.value, null, 2));

    ws.close();
  } finally {
    chrome.kill();
  }
}

async function run() {
  await testMobileIframe('http://localhost:3000/file-transfer-time-calculator');
  console.log('-----------------------------------------');
  await testMobileIframe('http://localhost:3000/upload-time-calculator');
  console.log('-----------------------------------------');
  await testMobileIframe('http://localhost:3000/');
}

run().catch(console.error);
