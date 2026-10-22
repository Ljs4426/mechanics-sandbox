// Desktop wrapper (Electron): opens the sandbox page, app/index.html, in its own window.
// app/ is made by prepare.js from ../mechanics-sandbox.html with the libraries stored locally,
// so the desktop app works without internet.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    title: 'Mechanics Sandbox', backgroundColor: '#ffffff', show: false,
    // The page is plain HTML/JS: no access to Node or the file system beyond normal browser features.
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.once('ready-to-show', () => win.show());

  // The sandbox never navigates away. Any web link opens in the normal browser instead.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file:')) return;
    event.preventDefault();
    if (/^https?:/.test(url)) shell.openExternal(url);
  });
  // F12 opens the developer tools (there's no menu bar to find them in).
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') win.webContents.toggleDevTools();
  });
}

// No menu bar: its Ctrl+Z / Ctrl+Y shortcuts would grab the keys before the sandbox's own undo/redo.
Menu.setApplicationMenu(null);
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
