console.log('🎨 [RENDERER] Native APIs Demo โหลดแล้ว');

function showResult(elementId, message, type = 'info') {
  const el = document.getElementById(elementId);
  const ts = new Date().toLocaleTimeString('th-TH');
  el.innerHTML = `[${ts}] ${message}`;
  el.className = `result-box ${type}`;
}

async function openFile() {
  try {
    showResult('fileResult', 'กำลังเปิด file dialog...', 'loading');
    const result = await window.nativeAPI.openFile();
    if (result.success) {
      showResult('fileResult',
        `✅ เปิดไฟล์สำเร็จ!\n\n📄 ชื่อไฟล์: ${result.fileName}\n📁 ที่อยู่: ${result.filePath}\n📊 ขนาด: ${result.size} characters`,
        'success'
      );
      const contentDiv = document.getElementById('fileContent');
      contentDiv.style.display = 'block';
      contentDiv.textContent = `📄 เนื้อหาไฟล์ ${result.fileName}:\n\n${result.content}`;
      document.getElementById('textEditor').value = result.content;
    } else if (result.cancelled) {
      showResult('fileResult', '⏹️ ยกเลิกการเปิดไฟล์', 'info');
    } else {
      throw new Error(result.error);
    }
  } catch (e) {
    showResult('fileResult', `❌ Error: ${e.message}`, 'error');
  }
}

async function exportAgentData() {
  try {
    showResult('fileResult', 'กำลังสร้างรายงาน Agent...', 'loading');
    const agentData = [
      'Agent ID,Name,Status,Extension,Department,Total Calls,Avg Call Time',
      'AG001,Alice Johnson,Available,1001,Sales,15,245',
      'AG002,Bob Smith,Busy,1002,Support,8,312',
      'AG003,Carol Lee,Break,1003,Sales,12,198'
    ].join('\n');
    const fileName = `agent-report-${new Date().toISOString().split('T')[0]}.csv`;
    const r = await window.nativeAPI.saveFile(agentData, fileName);
    if (r.success) {
      showResult('fileResult',
        `📊 ส่งออกข้อมูล Agent สำเร็จ!\n\n📄 ชื่อไฟล์: ${r.fileName}\n📁 ตำแหน่ง: ${r.filePath}\n📈 ข้อมูล: 3 agents ใน CSV format`,
        'success'
      );
    } else if (r.cancelled) {
      showResult('fileResult', '⏹️ ยกเลิกการส่งออก', 'info');
    } else {
      throw new Error(r.error);
    }
  } catch (e) {
    showResult('fileResult', `❌ Error: ${e.message}`, 'error');
  }
}

async function saveCurrentContent() {
  const content = document.getElementById('textEditor').value;
  if (!content.trim()) {
    showResult('fileResult', '❌ ไม่มีเนื้อหาให้บันทึก', 'error');
    return;
  }
  try {
    showResult('fileResult', 'กำลังบันทึกไฟล์...', 'loading');
    const fileName = `my-document-${Date.now()}.txt`;
    const r = await window.nativeAPI.saveFile(content, fileName);
    if (r.success) {
      showResult('fileResult',
        `💾 บันทึกเนื้อหาสำเร็จ!\n\n📄 ชื่อไฟล์: ${r.fileName}\n📁 ตำแหน่ง: ${r.filePath}\n📊 ขนาด: ${content.length} characters`,
        'success'
      );
    } else if (r.cancelled) {
      showResult('fileResult', '⏹️ ยกเลิกการบันทึก', 'info');
    } else {
      throw new Error(r.error);
    }
  } catch (e) {
    showResult('fileResult', `❌ Error: ${e.message}`, 'error');
  }
}

async function testBasicNotification() {
  try {
    showResult('notificationResult', 'กำลังแสดง notification...', 'loading');
    const r = await window.nativeAPI.showNotification('Agent Wallboard', 'นี่คือ desktop notification ทดสอบ! 🎉');
    if (r.success) showResult('notificationResult', '✅ แสดง notification สำเร็จ\n\nดู notification ที่มุมจอของคุณ', 'success');
  } catch (e) {
    showResult('notificationResult', `❌ Error: ${e.message}`, 'error');
  }
}

async function testAgentLogin() {
  try {
    showResult('notificationResult', 'แจ้งเตือน Agent เข้าสู่ระบบ...', 'loading');
    const r = await window.nativeAPI.notifyAgentEvent('Alice Johnson', 'login', { time: new Date().toLocaleTimeString('th-TH') });
    if (r.success) showResult('notificationResult', '🟢 แจ้งเตือน Agent Login สำเร็จ\n\nAgent Alice Johnson เข้าสู่ระบบแล้ว', 'success');
  } catch (e) {
    showResult('notificationResult', `❌ Error: ${e.message}`, 'error');
  }
}

async function testCallReceived() {
  try {
    showResult('notificationResult', 'แจ้งเตือนสายเข้า...', 'loading');
    const r = await window.nativeAPI.notifyAgentEvent('Bob Smith', 'call_received', { callerNumber: '02-123-4567', queue: 'Support Queue' });
    if (r.success) showResult('notificationResult', '📞 แจ้งเตือนสายเข้าสำเร็จ\n\nAgent Bob Smith มีสายเข้าใหม่', 'success');
  } catch (e) {
    showResult('notificationResult', `❌ Error: ${e.message}`, 'error');
  }
}

async function testUrgentAlert() {
  try {
    showResult('notificationResult', 'แจ้งเตือนด่วน...', 'loading');
    const r = await window.nativeAPI.showNotification('🚨 แจ้งเตือนด่วน!', 'ระบบโทรศัพท์มีปัญหา กรุณาตรวจสอบด่วน!', true);
    if (r.success) showResult('notificationResult', '🚨 แจ้งเตือนด่วนสำเร็จ\n\nนี่คือ notification แบบ urgent', 'success');
  } catch (e) {
    showResult('notificationResult', `❌ Error: ${e.message}`, 'error');
  }
}

function testHideToTray() {
  showResult('trayResult', '👁️ กำลังซ่อนไป system tray...', 'loading');
  setTimeout(() => window.nativeAPI.hideToTray(), 800);
}

function testTrayNotification() {
  showResult('trayResult',
    '✅ ทดสอบ System Tray สำเร็จ!\n\n' +
    '🖱️ คลิกขวาที่ icon ใน taskbar/menubar\n' +
    '📋 ลองเลือกเมนูต่างๆ\n' +
    '🔄 ทดสอบเปลี่ยนสถานะจาก tray menu',
    'success'
  );
}

window.addEventListener('DOMContentLoaded', () => {
  // ตั้งค่า default text
  document.getElementById('textEditor').value = `# Agent Report
วันที่: ${new Date().toLocaleDateString('th-TH')}

## สรุปข้อมูล Agents
- Agent ID: AG001
- ชื่อ: Alice Johnson
- สถานะ: Available
- จำนวนสาย: 15 calls
- เวลาเฉลี่ย: 245 วินาที

## สถิติวันนี้
- Total Calls: 35
- Avg Wait Time: 45 วินาที
- Available Agents: 1 คน
- Busy Agents: 1 คน
`;

  // ผูกปุ่มทั้งหมดด้วย addEventListener แทน onclick
  document.getElementById('btnOpenFile').addEventListener('click', openFile);
  document.getElementById('btnExportAgents').addEventListener('click', exportAgentData);
  document.getElementById('btnSaveText').addEventListener('click', saveCurrentContent);

  document.getElementById('btnNotifBasic').addEventListener('click', testBasicNotification);
  document.getElementById('btnNotifLogin').addEventListener('click', testAgentLogin);
  document.getElementById('btnNotifCall').addEventListener('click', testCallReceived);
  document.getElementById('btnNotifUrgent').addEventListener('click', testUrgentAlert);

  document.getElementById('btnHideToTray').addEventListener('click', testHideToTray);
  document.getElementById('btnTrayInfo').addEventListener('click', testTrayNotification);

  showResult('fileResult', '✅ Native APIs Demo พร้อมใช้งาน\n\nกดปุ่มเพื่อทดสอบ file operations', 'success');
});

// รับอัปเดตจาก Tray → Renderer
if (window.nativeAPI?.onStatusChangedFromTray) {
  console.log('🖱️ [PRELOAD] ลงทะเบียน tray status listener');
  window.nativeAPI.onStatusChangedFromTray((data) => {
    showResult('trayResult',
      `🔄 เปลี่ยนสถานะจาก System Tray!\n\n` +
      `📊 สถานะใหม่: ${data.newStatus}\n` +
      `⏰ เวลา: ${new Date(data.timestamp).toLocaleString('th-TH')}\n\n` +
      `✅ นี่คือ communication จาก Main → Renderer`,
      'success'
    );
  });
}
