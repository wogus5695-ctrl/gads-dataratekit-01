import { spawn } from 'node:child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function measurePage(url) {
  const port = 9334;
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=390,844',
    '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await listRes.json();
    const tab = tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.onopen = resolve);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        function onMsg(event) {
          const data = JSON.parse(event.data);
          if (data.id === msgId) {
            ws.removeEventListener('message', onMsg);
            resolve(data.result);
          }
        }
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });

    await send('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, 2000));

    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 500));

    const evalResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const docEl = document.documentElement;
          const body = document.body;
          
          const overflowingElements = [];
          document.querySelectorAll('*').forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.right > docEl.clientWidth + 0.5 || el.scrollWidth > el.clientWidth + 0.5) {
              overflowingElements.push({
                tag: el.tagName,
                className: el.className,
                clientWidth: el.clientWidth,
                scrollWidth: el.scrollWidth,
                right: Math.round(rect.right),
                width: Math.round(rect.width)
              });
            }
          });

          return {
            windowInnerWidth: window.innerWidth,
            documentElement: {
              clientWidth: docEl.clientWidth,
              scrollWidth: docEl.scrollWidth,
            },
            body: {
              clientWidth: body.clientWidth,
              scrollWidth: body.scrollWidth,
            },
            hasHorizontalOverflow: docEl.scrollWidth > docEl.clientWidth || body.scrollWidth > body.clientWidth,
            overflowingElements: overflowingElements
          };
        })()
      `,
      returnByValue: true,
    });

    console.log('MEASUREMENT RESULT for ' + url + ':');
    console.log(JSON.stringify(evalResult.result.value, null, 2));

    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

async function run() {
  await measurePage('http://localhost:3000/file-transfer-time-calculator');
  console.log('-----------------------------------------');
  await measurePage('http://localhost:3000/upload-time-calculator');
  console.log('-----------------------------------------');
  await measurePage('http://localhost:3000/');
}

run().catch(console.error);
