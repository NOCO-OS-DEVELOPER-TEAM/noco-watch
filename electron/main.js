const { app, BrowserWindow, ipcMain, clipboard, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const isDev = process.argv.includes('--dev');
const ROOT = path.resolve(__dirname, '..');
const SERVER_PORT = Number(process.env.NOCO_PORT || 3000);

// Autoplay inside the desktop app without requiring a click first
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow = null;
let serverProcess = null;
let serverStartedByApp = false;
let quitting = false;

function waitForUrl(url, timeoutMs = 45000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve(true);
          return;
        }
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout waiting for ${url}`));
          return;
        }
        setTimeout(tryOnce, 400);
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout waiting for ${url}`));
          return;
        }
        setTimeout(tryOnce, 400);
      });
    };
    tryOnce();
  });
}

function isServerHealthy() {
  return new Promise((resolve) => {
    const req = http.get(
      `http://127.0.0.1:${SERVER_PORT}/api/health`,
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      }
    );
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function killProcessTree(child) {
  if (!child || !child.pid) return;
  if (process.platform === 'win32') {
    try {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      });
    } catch {
      try {
        child.kill();
      } catch {
        /* ignore */
      }
    }
    return;
  }
  try {
    child.kill('SIGTERM');
  } catch {
    /* ignore */
  }
}

async function startServer() {
  if (await isServerHealthy()) {
    return { running: true, startedByApp: serverStartedByApp };
  }

  if (serverProcess) {
    await waitForUrl(`http://127.0.0.1:${SERVER_PORT}/api/health`);
    return { running: true, startedByApp: serverStartedByApp };
  }

  const nodeBin = process.env.npm_node_execpath || 'node';
  serverProcess = spawn(nodeBin, [path.join(ROOT, 'server', 'index.js')], {
    cwd: ROOT,
    env: { ...process.env, NOCO_PORT: String(SERVER_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  serverStartedByApp = true;

  serverProcess.stdout.on('data', (d) => process.stdout.write(d));
  serverProcess.stderr.on('data', (d) => process.stderr.write(d));
  serverProcess.on('exit', () => {
    serverProcess = null;
    serverStartedByApp = false;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('server-changed', { running: false });
    }
  });

  await waitForUrl(`http://127.0.0.1:${SERVER_PORT}/api/health`);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('server-changed', { running: true });
  }
  return { running: true, startedByApp: true };
}

function stopServer() {
  return new Promise(async (resolve) => {
    if (!serverProcess) {
      // If we did not start it, do not kill an external server
      if (!serverStartedByApp) {
        resolve({ running: await isServerHealthy(), startedByApp: false });
        return;
      }
      resolve({ running: false, startedByApp: false });
      return;
    }

    const child = serverProcess;
    serverProcess = null;
    serverStartedByApp = false;

    let done = false;
    const finish = async () => {
      if (done) return;
      done = true;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('server-changed', { running: false });
      }
      resolve({ running: false, startedByApp: false });
    };

    child.once('exit', finish);
    killProcessTree(child);
    setTimeout(finish, 3000);
  });
}

function loadSplash(win) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>NOCO WATCH</title>
<style>
  html,body{margin:0;height:100%;background:#07090f;color:#f4f6fb;font-family:Segoe UI,Arial,sans-serif}
  .wrap{height:100%;display:grid;place-items:center;text-align:center;
    background:radial-gradient(800px 400px at 50% 20%,rgba(225,29,72,.2),transparent 60%),#07090f}
  h1{font-size:42px;letter-spacing:.08em;margin:0}
  h1 span{color:#e11d48}
  p{color:#9aa3b8;margin-top:14px}
  .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-right:8px;
    box-shadow:0 0 0 4px rgba(34,197,94,.15);animation:pulse 1.2s infinite}
  @keyframes pulse{50%{opacity:.45}}
</style></head>
<body><div class="wrap"><div>
  <h1>NOCO <span>WATCH</span></h1>
  <p><span class="dot"></span>Windows-App startet Server…</p>
</div></div></body></html>`;
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#07090f',
    title: 'NOCO WATCH',
    icon: path.join(ROOT, 'public', 'branding', 'noco-watch.ico'),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    await waitForUrl('http://127.0.0.1:5173');
    await mainWindow.loadURL('http://127.0.0.1:5173');
    return;
  }

  loadSplash(mainWindow);

  try {
    const distIndex = path.join(ROOT, 'client', 'dist', 'index.html');
    if (!fs.existsSync(distIndex)) {
      throw new Error(
        'UI-Build fehlt. Bitte einmal "npm run build" im Projektordner ausführen.'
      );
    }

    await startServer();
    // UI comes from local files so Steuerzentrale stays usable if server stops.
    // API/Streaming still goes to http://127.0.0.1:PORT via preload apiBase.
    await mainWindow.loadFile(distIndex);
  } catch (err) {
    const msg = String(err?.message || err);
    const fail = `<!DOCTYPE html><html><body style="margin:0;background:#07090f;color:#fff;font-family:Segoe UI,sans-serif;padding:48px">
      <h1>NOCO WATCH</h1>
      <p>Server konnte nicht gestartet werden.</p>
      <pre style="white-space:pre-wrap;color:#fda4af">${msg.replace(/[<>&]/g, '')}</pre>
      <p>Prüfe, ob Port ${SERVER_PORT} frei ist und Node.js installiert ist.</p>
    </body></html>`;
    await mainWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(fail)}`
    );
  }
}

ipcMain.handle('server:start', async () => startServer());
ipcMain.handle('server:stop', async () => stopServer());
ipcMain.handle('server:status', async () => ({
  running: await isServerHealthy(),
  startedByApp: serverStartedByApp,
  port: SERVER_PORT,
}));
ipcMain.handle('desktop:copyText', async (_e, text) => {
  clipboard.writeText(String(text || ''));
  return true;
});
ipcMain.handle('desktop:openExternal', async (_e, url) => {
  await shell.openExternal(String(url || ''));
  return true;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', async () => {
  if (process.platform === 'darwin') return;
  if (!quitting) {
    quitting = true;
    if (serverStartedByApp) await stopServer();
    app.quit();
  }
});

app.on('before-quit', async (e) => {
  if (quitting) return;
  if (serverStartedByApp && serverProcess) {
    e.preventDefault();
    quitting = true;
    await stopServer();
    app.exit(0);
  }
});
