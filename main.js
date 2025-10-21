const { app, BrowserWindow, ipcMain, dialog, Notification, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let tray = null;

function createWindow() {
  console.log('🚀 [MAIN] สร้าง window...');

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();
  console.log('✅ [MAIN] Window พร้อมแล้ว');

  // สร้าง tray หลัง window พร้อม
  createTray();

  // ปุ่ม X ซ่อนไป tray
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      new Notification({
        title: 'Agent Wallboard',
        body: 'แอปยังทำงานอยู่ใน system tray\nคลิกขวาที่ไอคอนเพื่อเปิดเมนู'
      }).show();
    }
  });
}

function createTray() {
  console.log('🖱️ [MAIN] สร้าง system tray...');

  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png'));
    if (trayIcon.isEmpty()) throw new Error('Icon not found');
  } catch {
    trayIcon = nativeImage.createEmpty();
  }
  if (process.platform === 'darwin') {
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
    trayIcon.setTemplateImage(true);
  }

  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '📊 แสดง Wallboard',
      click: () => { mainWindow.show(); mainWindow.focus(); }
    },
    {
      label: '🔄 เปลี่ยนสถานะ',
      submenu: [
        { label: '🟢 Available', click: () => changeAgentStatusFromTray('Available') },
        { label: '🔴 Busy',      click: () => changeAgentStatusFromTray('Busy') },
        { label: '🟡 Break',     click: () => changeAgentStatusFromTray('Break') }
      ]
    },
    { type: 'separator' },
    {
      label: '❌ ออกจากโปรแกรม',
      click: () => { app.isQuiting = true; app.quit(); }
    }
  ]);
  tray.setToolTip('Agent Wallboard - Desktop App');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow.isVisible()) mainWindow.hide();
    else { mainWindow.show(); mainWindow.focus(); }
  });
  console.log('✅ [MAIN] System tray พร้อมแล้ว');
}

function changeAgentStatusFromTray(status) {
  console.log('🔄 [TRAY] เปลี่ยนสถานะเป็น:', status);
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('status-changed-from-tray', {
      newStatus: status,
      timestamp: new Date().toISOString()
    });
  }
  new Notification({
    title: 'สถานะเปลี่ยนแล้ว',
    body: `เปลี่ยนสถานะเป็น ${status} แล้ว`,
    icon: path.join(__dirname, 'assets', 'notification.png')
  }).show();
}

// ===== FILE SYSTEM APIS =====
ipcMain.handle('open-file', async () => {
  console.log('📂 [MAIN] เปิด file dialog...');
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Text Files', extensions: ['txt', 'json', 'csv'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (!result.canceled && result.filePaths[0]) {
      const filePath = result.filePaths[0];
      const content = await fs.readFile(filePath, 'utf8');
      console.log('✅ [MAIN] อ่านไฟล์สำเร็จ:', path.basename(filePath));
      return { success: true, fileName: path.basename(filePath), filePath, content, size: content.length };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    console.error('❌ [MAIN] Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-file', async (event, { content, fileName = 'export.txt' }) => {
  console.log('💾 [MAIN] บันทึกไฟล์...');
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: fileName,
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });
    if (!result.canceled && result.filePath) {
      await fs.writeFile(result.filePath, content, 'utf8');
      console.log('✅ [MAIN] บันทึกสำเร็จ:', path.basename(result.filePath));
      return { success: true, fileName: path.basename(result.filePath), filePath: result.filePath };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    console.error('❌ [MAIN] Error:', error);
    return { success: false, error: error.message };
  }
});

// ===== NOTIFICATIONS =====
ipcMain.handle('show-notification', (event, { title, body, urgent = false }) => {
  console.log('🔔 [MAIN] แสดง notification:', title);
  try {
    const notification = new Notification({
      title, body,
      icon: path.join(__dirname, 'assets', 'notification.png'),
      urgency: urgent ? 'critical' : 'normal',
      timeoutType: urgent ? 'never' : 'default'
    });
    notification.show();
    notification.on('click', () => { mainWindow.show(); mainWindow.focus(); });
    return { success: true };
  } catch (error) {
    console.error('❌ [MAIN] Error notification:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('notify-agent-event', (event, { agentName, eventType, details = {} }) => {
  console.log('📢 [MAIN] Agent event notification:', agentName, eventType);
  const eventMessages = {
    'login':        `🟢 ${agentName} เข้าสู่ระบบแล้ว`,
    'logout':       `🔴 ${agentName} ออกจากระบบแล้ว`,
    'status_change':`🔄 ${agentName} เปลี่ยนสถานะเป็น ${details.newStatus || '-'}`,
    'call_received':`📞 ${agentName} รับสายใหม่`,
    'call_ended':   `📞 ${agentName} จบการโทร (${details.duration || '?'} วินาที)`
  };
  const notification = new Notification({
    title: 'Agent Wallboard Update',
    body: eventMessages[eventType] || `📊 ${agentName}: ${eventType}`,
    icon: path.join(__dirname, 'assets', 'notification.png')
  });
  notification.show();
  notification.on('click', () => { mainWindow.show(); mainWindow.focus(); });
  return { success: true };
});

// ===== TRAY IPC =====
ipcMain.on('hide-to-tray', () => {
  if (mainWindow) {
    mainWindow.hide();
    if (process.platform === 'win32') {
      new Notification({ title: 'Agent Wallboard', body: 'App is still running in the system tray' }).show();
    }
  }
});
ipcMain.on('show-app', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } });

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); else mainWindow.show(); });
});

app.on('window-all-closed', () => {
  // อย่าปิด เพื่อให้ทำงานใน tray ต่อ
});

app.on('before-quit', () => { app.isQuiting = true; });
