const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const SCHEME = 'app';
const HOST = 'pera';
const ROOT = path.join(__dirname, '../dist/Pera/browser');
const ICON = path.join(__dirname, '../build/icon.ico');
const IS_DEV = !app.isPackaged;

const csp = [
  "default-src 'self' app:",
  "script-src 'self' app:",
  "style-src 'self' 'unsafe-inline' app:",
  "img-src 'self' app: data: blob:",
  "font-src 'self' app: data:",
  "connect-src 'self' app: data: blob: https: http://localhost:*",
  "worker-src 'self' app: blob:",
  "media-src 'self' app: blob: data:",
  "object-src 'self' app: blob:",
  "frame-src 'self' app: blob: data:",
  "base-uri 'self' app:"
].join('; ');

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true
    }
  }
]);

function isInsideRoot(filePath) {
  const relative = path.relative(ROOT, filePath);

  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function resolveRequestPath(pathname) {
  const decoded = decodeURIComponent(pathname);

  return path.normalize(path.join(ROOT, decoded === '/' ? '/index.html' : decoded));
}

function withCsp(headers) {
  const next = new Headers(headers);

  next.set('Content-Security-Policy', csp);

  return next;
}

function normalizeHtml(html) {
  return html
    .replace(/ media="print" onload="this\.media='all'"/g, ' media="all"')
    .replace(/ rel="preload" as="style" onload="this\.rel='stylesheet'"/g, ' rel="stylesheet"');
}

async function serve(request) {
  const { pathname } = new URL(request.url);
  let filePath = resolveRequestPath(pathname);

  if (!isInsideRoot(filePath)) {
    filePath = path.join(ROOT, 'index.html');
  }

  let response;

  try {
    response = await net.fetch(pathToFileURL(filePath).toString());
  } catch {
    response = undefined;
  }

  if (!response || !response.ok) {
    filePath = path.join(ROOT, 'index.html');
    response = await net.fetch(pathToFileURL(filePath).toString());
  }

  if (path.extname(filePath) === '.html') {
    const html = normalizeHtml(await response.text());

    return new Response(html, {
      status: response.status,
      headers: withCsp({ 'Content-Type': 'text/html; charset=utf-8' })
    });
  }

  return new Response(response.body, {
    status: response.status,
    headers: withCsp(response.headers)
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: 'Pera - Finanzas personales',
    icon: ICON,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: IS_DEV
    }
  });

  win.loadURL(`${SCHEME}://${HOST}/index.html`);

  if (!IS_DEV) {
    win.removeMenu();
  } 
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.carlosjctdev.pera');
  protocol.handle(SCHEME, serve);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
