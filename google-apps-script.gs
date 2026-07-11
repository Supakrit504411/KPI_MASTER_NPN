/**
 * ============================================================
 *  PEA Dashboard — Google Apps Script (Backend) v2
 * ============================================================
 *  1) รับคำสั่งบันทึก "หมายเหตุ" จากเว็บแอป → เขียนลงคอลัมน์ K
 *  2) เก็บ Log การกรอก/แก้ไข ลงชีต "NoteLogs" อัตโนมัติ
 *     (ใครกรอก, IP อะไร, เวลาไหน, สร้างใหม่หรือแก้ไข, ค่าเดิม→ค่าใหม่)
 * ============================================================
 *
 *  วิธีติดตั้ง (ไม่กระทบโค้ด import เดิมของคุณ):
 *  1. เปิด Google Sheet → Extensions → Apps Script
 *  2. ที่แถบ Files ด้านซ้าย กด + → Script → ตั้งชื่อ เช่น "NoteAPI"
 *     แล้ววางโค้ดนี้ทั้งหมดลงใน "ไฟล์ใหม่" นั้น (โค้ด import เดิมอยู่ไฟล์เดิม ไม่ต้องแตะ)
 *     ทุกฟังก์ชันในไฟล์นี้ตั้งชื่อไม่ให้ชนกับของเดิมแล้ว (ใช้ noteApi_ นำหน้า)
 *  3. Ctrl+S แล้วไปที่ Deploy → Manage deployments →
 *     ไอคอนดินสอ (Edit) → Version: "New version" → Deploy
 *     (URL เดิมไม่เปลี่ยน ไม่ต้องแก้ .env)
 *     ถ้ายังไม่เคย deploy: Deploy → New deployment → Web app →
 *     Execute as: Me / Who has access: Anyone
 *  4. ชีต "NoteLogs" จะถูกสร้างให้เองอัตโนมัติเมื่อมีการบันทึกครั้งแรก
 *
 *  หมายเหตุ: 1 โปรเจกต์มี doGet/doPost ได้ชุดเดียว — โค้ด import เดิมของคุณ
 *  ไม่มี doGet/doPost จึงไม่ชนกัน (ของเดิมเป็นฟังก์ชันกดรันเอง/ตั้ง trigger)
 * ============================================================
 */

// ID ของไฟล์สเปรดชีตที่มีชีต LMS (ไฟล์เดียวกับที่แดชบอร์ดดึงข้อมูล)
// สำคัญ: เปิดด้วย ID ตรงๆ ไม่ใช้ getActiveSpreadsheet() — วางโค้ดนี้ไว้ใน
// โปรเจกต์ Apps Script ไหนก็ได้ จะเขียนลงไฟล์ที่ถูกต้องเสมอ
var NOTE_API_SPREADSHEET_ID = '1P90pDKqos8bchlJRpr7GiQQJPEXdMIZvBps5BDVO1zE';
// ชื่อชีตข้อมูลหลัก (fallback กรณี body ไม่ส่ง sheet มา)
var NOTE_API_SHEET_NAME = 'LMS';
// ชื่อชีตเก็บ log
var NOTE_API_LOG_SHEET = 'NoteLogs';

/**
 * รับคำขอ GET (สำหรับ health check)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'PEA Dashboard API is running', version: 2 }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * รับคำขอ POST — บันทึกหมายเหตุไปยังคอลัมน์ K + เก็บ log
 *
 * Request body (JSON):
 *   {
 *     "row":    2,             // เลขแถวใน Sheet (เริ่มจาก 2)
 *     "note":   "ข้อความ",     // หมายเหตุใหม่
 *     "sheet":  "LMS",         // ชื่อชีต
 *     "column": "K",           // คอลัมน์เป้าหมาย
 *     "user":   "ชื่อผู้กรอก",  // (ใหม่) ชื่อที่ผู้ใช้กรอกในเว็บ
 *     "ip":     "1.2.3.4",     // (ใหม่) IP ฝั่ง client (จาก ipify)
 *     "userAgent": "...",      // (ใหม่) เบราว์เซอร์/เครื่องที่ใช้
 *     "pea":    "กฟส.นพ.",     // (ใหม่) หน่วยงานของแถวนั้น
 *     "item":   "1.1"          // (ใหม่) ข้อของแถวนั้น
 *   }
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // บันทึกประวัติเข้าใช้งาน (LINE Login)
    if (body.action === 'logAccess') {
      var ss = SpreadsheetApp.openById(NOTE_API_SPREADSHEET_ID);
      noteApi_appendAccessLog(ss, body);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'Access logged' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var row = parseInt(body.row, 10);
    var note = String(body.note == null ? '' : body.note);
    var sheetName = body.sheet || NOTE_API_SHEET_NAME;
    var column = body.column || 'K';

    if (isNaN(row) || row < 2) {
      return noteApi_jsonError('Invalid row number');
    }

    var ss = SpreadsheetApp.openById(NOTE_API_SPREADSHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return noteApi_jsonError('Sheet not found: ' + sheetName);
    }

    var colIndex = noteApi_columnToIndex(column);
    if (colIndex < 1) {
      return noteApi_jsonError('Invalid column: ' + column);
    }

    // อ่านค่าเดิมจากเซลล์ก่อนเขียนทับ (ความจริงฝั่ง server เชื่อถือได้กว่า client)
    var cell = sheet.getRange(row, colIndex);
    var oldNote = String(cell.getValue() == null ? '' : cell.getValue());

    // เขียนค่าใหม่
    cell.setValue(note);

    // ระบุประเภทการกระทำ
    var action;
    if (oldNote === note) {
      action = 'ไม่เปลี่ยนแปลง';
    } else if (oldNote === '' && note !== '') {
      action = 'สร้างใหม่';
    } else if (note === '') {
      action = 'ลบ';
    } else {
      action = 'แก้ไข';
    }

    // เก็บ log (ไม่ให้ log พังแล้วทำให้บันทึกหมายเหตุล้มเหลว)
    try {
      noteApi_appendLog(ss, {
        user: body.user || '(ไม่ระบุชื่อ)',
        ip: body.ip || '(ไม่ทราบ IP)',
        userAgent: body.userAgent || '',
        sheetName: sheetName,
        row: row,
        pea: body.pea || '',
        item: body.item || '',
        action: action,
        oldNote: oldNote,
        newNote: note,
      });
    } catch (logErr) {
      // log ล้มเหลวก็ยังถือว่าบันทึกหมายเหตุสำเร็จ
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Note saved to ' + column + row,
        row: row,
        column: column,
        note: note,
        action: action
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return noteApi_jsonError(err.toString());
  }
}

/**
 * เขียน log ลงชีต NoteLogs (สร้างชีต + หัวตารางให้อัตโนมัติถ้ายังไม่มี)
 */
function noteApi_appendLog(ss, info) {
  var logSheet = ss.getSheetByName(NOTE_API_LOG_SHEET);
  if (!logSheet) {
    logSheet = ss.insertSheet(NOTE_API_LOG_SHEET);
    logSheet.appendRow([
      'วันเวลา (เวลาไทย)', 'ผู้กรอก', 'IP', 'การกระทำ',
      'ชีต', 'แถว', 'หน่วยงาน (PEA)', 'ข้อ',
      'ค่าเดิม', 'ค่าใหม่', 'เบราว์เซอร์/เครื่อง'
    ]);
    logSheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#e8f0fe');
    logSheet.setFrozenRows(1);
  }

  var timestamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
  logSheet.appendRow([
    timestamp, info.user, info.ip, info.action,
    info.sheetName, info.row, info.pea, info.item,
    info.oldNote, info.newNote, info.userAgent
  ]);
}

/**
 * เขียน log เข้าใช้งาน (LINE Login) ลงชีต AccessLogs
 */
function noteApi_appendAccessLog(ss, info) {
  var sheetName = 'AccessLogs';
  var logSheet = ss.getSheetByName(sheetName);
  if (!logSheet) {
    logSheet = ss.insertSheet(sheetName);
    logSheet.appendRow(['วันเวลา (เวลาไทย)', 'ชื่อ LINE', 'LINE User ID', 'IP', 'เบราว์เซอร์/เครื่อง']);
    logSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#e8f0fe');
    logSheet.setFrozenRows(1);
  }
  var timestamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
  logSheet.appendRow([timestamp, info.user || '', info.lineUserId || '', info.ip || '', info.userAgent || '']);
}

/**
 * แปลงตัวอักษรคอลัมน์เป็น index (A → 1, K → 11)
 * ตั้งชื่อไม่ให้ชนกับ columnLetterToIndex ในโค้ด import เดิม
 */
function noteApi_columnToIndex(letter) {
  letter = String(letter).toUpperCase();
  var index = 0;
  for (var i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index;
}

/**
 * ส่ง error กลับเป็น JSON
 */
function noteApi_jsonError(message) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false,
      error: message
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
