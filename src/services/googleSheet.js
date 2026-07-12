const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID || '1P90pDKqos8bchlJRpr7GiQQJPEXdMIZvBps5BDVO1zE';
const SHEET_NAME = import.meta.env.VITE_GOOGLE_SHEET_NAME || 'LMS';
const BASE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;

/**
 * Mock data สำหรับ development/testing เมื่อ Google Sheets API ไม่ว่าง
 */
const MOCK_CSV = `ข้อ,รายละเอียด,PEA,เป้าหมายรายปี,เป้าหมายระดับ 5,ผลการดำเนินงาน,คะแนน,น้ำหนัก,คะแนนสุทธิ,คะแนนเต็ม,หมายเหตุ,%,หน่วย,กลุ่ม
1.1,รายงานผลการติดตามและประเมินผล,กฟจ.นพ.,100,95,98,5.00,10,50.00,50.00,,100,%,NE1
1.1,รายงานผลการติดตามและประเมินผล,กฟส.ธพ.,100,95,92,4.85,10,48.50,50.00,,97,%,S
1.1,รายงานผลการติดตามและประเมินผล,กฟส.นก.,100,95,88,4.50,10,45.00,50.00,,88,%,S
1.1,รายงานผลการติดตามและประเมินผล,กฟส.บพง.,100,95,90,4.70,10,47.00,50.00,,90,%,S
1.2,จัดทำแผนปฏิบัติการประจำปี,กฟจ.นพ.,50,48,47,4.95,8,39.60,40.00,,99,%,NE1
1.2,จัดทำแผนปฏิบัติการประจำปี,กฟส.ธพ.,50,48,45,4.50,8,36.00,40.00,,90,%,S
1.2,จัดทำแผนปฏิบัติการประจำปี,กฟส.นก.,50,48,40,4.00,8,32.00,40.00,,80,%,S
1.2,จัดทำแผนปฏิบัติการประจำปี,กฟส.บพง.,50,48,46,4.60,8,36.80,40.00,,92,%,S
2.1,ปรับปรุงระบบบริการไฟฟ้า,กฟจ.นพ.,200,190,195,5.00,12,60.00,60.00,,100,%,NE1
2.1,ปรับปรุงระบบบริการไฟฟ้า,กฟส.ธพ.,200,190,180,4.50,12,54.00,60.00,,90,%,S
2.1,ปรับปรุงระบบบริการไฟฟ้า,กฟส.นก.,200,190,170,4.25,12,51.00,60.00,,85,%,S
2.1,ปรับปรุงระบบบริการไฟฟ้า,กฟส.บพง.,200,190,185,4.63,12,55.50,60.00,,92.5,%,S
2.2,ลดระยะเวลาการให้บริการ,กฟจ.นพ.,10,8,7,5.00,10,50.00,50.00,,100,%,NE1
2.2,ลดระยะเวลาการให้บริการ,กฟส.ธพ.,10,8,9,4.50,10,45.00,50.00,,90,%,S
2.2,ลดระยะเวลาการให้บริการ,กฟส.นก.,10,8,10,4.00,10,40.00,50.00,,80,%,S
2.2,ลดระยะเวลาการให้บริการ,กฟส.บพง.,10,8,8,4.50,10,45.00,50.00,,90,%,S
3.1,พัฒนาระบบสารสนเทศ,กฟจ.นพ.,30,28,27,4.50,15,67.50,75.00,,90,%,NE1
3.1,พัฒนาระบบสารสนเทศ,กฟส.ธพ.,30,28,25,4.17,15,62.50,75.00,,83.3,%,S
3.1,พัฒนาระบบสารสนเทศ,กฟส.นก.,30,28,22,3.67,15,55.00,75.00,,73.3,%,S
3.1,พัฒนาระบบสารสนเทศ,กฟส.บพง.,30,28,26,4.33,15,65.00,75.00,,86.7,%,S
3.2,เพิ่มความปลอดภัยทางไซเบอร์,กฟจ.นพ.,20,18,18,5.00,10,50.00,50.00,,100,%,NE1
3.2,เพิ่มความปลอดภัยทางไซเบอร์,กฟส.ธพ.,20,18,16,4.00,10,40.00,50.00,,80,%,S
3.2,เพิ่มความปลอดภัยทางไซเบอร์,กฟส.นก.,20,18,15,3.75,10,37.50,50.00,,75,%,S
3.2,เพิ่มความปลอดภัยทางไซเบอร์,กฟส.บพง.,20,18,17,4.25,10,42.50,50.00,,85,%,S
4.1,ลดอัตราความสูญเสียพลังงาน,กฟจ.นพ.,5,4.5,4.3,5.00,20,100.00,100.00,,86,%,NE1
4.1,ลดอัตราความสูญเสียพลังงาน,กฟส.ธพ.,5,4.5,4.7,4.50,20,90.00,100.00,,94,%,S
4.1,ลดอัตราความสูญเสียพลังงาน,กฟส.นก.,5,4.5,5.0,4.00,20,80.00,100.00,,100,%,S
4.1,ลดอัตราความสูญเสียพลังงาน,กฟส.บพง.,5,4.5,4.6,4.60,20,92.00,100.00,,92,%,S
4.2,เพิ่มประสิทธิภาพการใช้พลังงาน,กฟจ.นพ.,100,95,98,5.00,15,75.00,75.00,,98,%,NE1
4.2,เพิ่มประสิทธิภาพการใช้พลังงาน,กฟส.ธพ.,100,95,90,4.75,15,71.25,75.00,,90,%,S
4.2,เพิ่มประสิทธิภาพการใช้พลังงาน,กฟส.นก.,100,95,85,4.25,15,63.75,75.00,,85,%,S
4.2,เพิ่มประสิทธิภาพการใช้พลังงาน,กฟส.บพง.,100,95,92,4.83,15,72.50,75.00,,92,%,S`;

/**
 * ดึงข้อมูลจาก Google Sheet ในรูปแบบ CSV
 */
export async function fetchSheetData() {
  try {
    const url = `${BASE_URL}?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const csvText = await response.text();
    // ตรวจสอบว่า CSV มีข้อมูลจริงหรือไม่
    if (!csvText || csvText.trim().length < 50) {
      throw new Error('Empty or invalid response');
    }
    return csvText;
  } catch (err) {
    console.warn('Failed to fetch from Google Sheets, using mock data:', err.message);
    return MOCK_CSV;
  }
}

// Cache IP ของเครื่องผู้ใช้ (ดึงครั้งเดียวต่อ session)
let cachedClientIP = null;

/**
 * ดึง public IP ของเครื่องผู้ใช้จาก ipify (ล้มเหลวได้โดยไม่กระทบการบันทึก)
 */
async function getClientIP() {
  if (cachedClientIP !== null) return cachedClientIP;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();
    cachedClientIP = data.ip || '';
  } catch {
    cachedClientIP = '';
  }
  return cachedClientIP;
}

/**
 * อัปเดตหมายเหตุใน Google Sheet ผ่าน Google Apps Script Web App
 * พร้อมส่งข้อมูลสำหรับเก็บ log: ชื่อผู้กรอก, IP, เบราว์เซอร์, หน่วยงาน, ข้อ
 *
 * @param {number} row เลขแถวในชีต (เริ่มจาก 2)
 * @param {string} note ข้อความหมายเหตุ
 * @param {{user?: string, pea?: string, item?: string}} meta ข้อมูลประกอบสำหรับ log
 */
export async function updateNote(row, note, meta = {}) {
  const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    console.warn('VITE_APPS_SCRIPT_URL is not set. Notes will be saved locally only.');
    return { success: true, local: true };
  }

  const ip = await getClientIP();

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      row,
      sheet: SHEET_NAME,
      note,
      column: 'K',
      user: meta.user || '',
      ip,
      userAgent: navigator.userAgent,
      pea: meta.pea || '',
      item: meta.item || '',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update note: ${response.status}`);
  }

  // Apps Script ตอบ HTTP 200 เสมอแม้ผิดพลาด — ต้องอ่านผลลัพธ์ข้างในจริงๆ
  let result = null;
  try {
    result = await response.json();
  } catch {
    // ตอบกลับไม่ใช่ JSON (เช่น หน้า error ของ Google) ถือว่าล้มเหลว
    throw new Error('Apps Script ตอบกลับผิดรูปแบบ — ตรวจสอบการ deploy');
  }
  if (result && result.success === false) {
    throw new Error(result.error || 'Apps Script บันทึกไม่สำเร็จ');
  }
  return { success: true, local: false, action: result?.action };
}

export async function passwordLogin(username, password) {
  const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (!scriptUrl) return { allowed: false, reason: 'ระบบยังไม่พร้อม' };
  const ip = await getClientIP();
  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'passwordLogin', username, password, ip, userAgent: navigator.userAgent }),
    });
    return await res.json();
  } catch {
    return { allowed: false, reason: 'เชื่อมต่อระบบไม่ได้' };
  }
}

export async function checkAccess(lineUserId) {
  const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (!scriptUrl) return { allowed: true, role: 'admin' };
  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'checkAccess', lineUserId }),
    });
    return await res.json();
  } catch {
    return { allowed: true, role: 'user' };
  }
}

export async function getDataStatus() {
  const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (!scriptUrl) return '';
  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'getDataStatus' }),
    });
    const data = await res.json();
    return data.value || '';
  } catch {
    return '';
  }
}

export async function updateDataStatus(value, lineUserId) {
  const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (!scriptUrl) return false;
  const res = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'updateDataStatus', value, lineUserId }),
  });
  const data = await res.json();
  if (data.success === false) throw new Error(data.error);
  return true;
}

export async function logAccess(profile) {
  const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (!scriptUrl) return;
  const ip = await getClientIP();
  try {
    await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'logAccess',
        user: profile?.displayName || '',
        lineUserId: profile?.userId || '',
        ip,
        userAgent: navigator.userAgent,
      }),
    });
  } catch {
    // ล็อกล้มเหลวไม่กระทบการใช้งาน
  }
}

export { SHEET_ID, SHEET_NAME };
