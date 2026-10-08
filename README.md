# PEA KPI Dashboard (KPI_MASTER_NPN)

แดชบอร์ดสรุปผลการดำเนินงานตามตัวชี้วัด (KPIs) ของการไฟฟ้าส่วนภูมิภาค
ดึงข้อมูลสดจาก **Google Sheet**, แสดงผลเป็นแดชบอร์ดเชิงวิเคราะห์ และมี **โหมดนำเสนอ (Presentation Mode)** แบบเต็มจอสำหรับรายงานผู้บริหาร

> React 19 + Vite + Tailwind CSS v4 + Recharts · ล็อกอินผ่าน LINE LIFF หรือรหัสผ่าน · ข้อมูลและการบันทึกหมายเหตุผ่าน Google Apps Script

---

## ความสามารถหลัก

### แดชบอร์ด
- การ์ดสรุปภาพรวม, ตารางสรุปคะแนนรายหน่วยงาน/รายกลุ่ม
- ตัวกรองหลายชั้น: กลุ่ม (Group), หน่วยงาน (PEA), สถานะผ่าน/ไม่ผ่าน
- กราฟเปรียบเทียบและจัดอันดับ KPI (KpiChartRanking, ItemComparison)
- ตารางข้อมูลดิบ พร้อมแก้ไข **หมายเหตุ** รายแถว (บันทึกกลับเข้า Google Sheet คอลัมน์ K)

### โหมดนำเสนอ (Presentation Mode)
ชุดสไลด์เต็มจอ เรียงตามลำดับ: **ปก → ภาพรวม → Matrix → สไลด์ราย KPI → สรุป**
- เลือกหน่วยงานที่โฟกัส (ค่าเริ่มต้น: กฟส.นพ. / กฟส.ธพ. / กฟส.นก. / กฟส.บพง.)
- กรองสไลด์ที่จะนำเสนอ: ทั้งหมด / ข้อที่ผ่าน / ข้อที่ไม่ผ่าน / เลือกเองรายข้อ
- สไลด์ราย KPI แสดงแท่งผลดำเนินงาน + **เส้นเป้าหมาย 2 เส้น** (เป้าหมายระดับ 5 และเป้าหมายทั้งปี)
  และการ์ดรายหน่วยงานพร้อม **% ที่ทำได้เทียบเป้าหมายทั้งปี**
- ตั้งหน้าปกเองได้ (ดูหัวข้อ [การตั้งหน้าปก](#การตั้งหน้าปก))
- กด `D` สลับมุมมองกราฟ, ปุ่มลูกศรเลื่อนสไลด์, รองรับ fullscreen

---

## โครงสร้างข้อมูล (Google Sheet)

ชีตข้อมูลหลัก (ค่าเริ่มต้นชื่อ `LMS`) อ่านตามลำดับคอลัมน์ (ไม่ใช่ตามชื่อหัวคอลัมน์):

| คอลัมน์ | ฟิลด์ | ความหมาย |
|---|---|---|
| A | item | ข้อ (เช่น `4`, `4.1`) |
| B | description | รายละเอียดตัวชี้วัด |
| C | pea | หน่วยงาน |
| D | targetYearly | เป้าหมายรายปี / ทั้งปี |
| E | targetLevel5 | เป้าหมายระดับ 5 |
| F | result | ผลดำเนินงาน |
| G | score | คะแนน KPI (≥ 5 = ผ่าน) |
| H | weight | น้ำหนัก |
| I | scoreNet | คะแนนสุทธิ |
| J | scoreFull | คะแนนเต็ม |
| K | note | หมายเหตุ (แก้ไขจากแอปได้) |
| L | percentage | คิดเป็น (%) |
| M | unit | หน่วย |
| N | group | กลุ่ม |

> นิยามสถานะ: `score ≥ 5` = ผ่าน, `4.8 ≤ score < 5` = ใกล้ผ่าน, อื่นๆ = ไม่ผ่าน, ว่าง = รอผล

นอกจากนี้ยังอ่านชีต **`Config`** (คอลัมน์ A = คีย์, B = ค่า) สำหรับลิงก์หน้าปก

---

## การตั้งค่า (Environment Variables)

สร้างไฟล์ `.env` (หรือตั้งค่าใน Vercel) — ทุกตัวมีค่า fallback ในโค้ด จึงรันได้แม้ไม่ตั้ง (ใช้ mock/ชีตสาธารณะ)

| ตัวแปร | จำเป็น | คำอธิบาย |
|---|---|---|
| `VITE_GOOGLE_SHEET_ID` | แนะนำ | ID ของ Google Sheet แหล่งข้อมูล |
| `VITE_GOOGLE_SHEET_NAME` | ไม่ | ชื่อชีต (ค่าเริ่มต้น `LMS`) |
| `VITE_APPS_SCRIPT_URL` | แนะนำ | URL ของ Google Apps Script Web App (บันทึกหมายเหตุ, ล็อกอินรหัสผ่าน, ตรวจสิทธิ์, log) |
| `VITE_LIFF_ID` | ถ้าใช้ LINE | LIFF ID สำหรับล็อกอินผ่าน LINE |

> ถ้าไม่ตั้ง `VITE_APPS_SCRIPT_URL` ระบบจะบันทึกหมายเหตุไว้เฉพาะเครื่อง และอนุญาตเข้าใช้งานแบบ fallback
> รายละเอียดฝั่ง backend ดูที่ [README-GAS.md](./README-GAS.md)

---

## การรันโปรเจกต์

```bash
npm install
npm run dev        # เปิด dev server (http://localhost:5173)
npm run build      # build สำหรับ production (โฟลเดอร์ dist)
npm run preview    # ดูตัวอย่าง build
npm run lint       # ตรวจโค้ดด้วย oxlint
```

---

## การตั้งหน้าปก

หน้าปกโหมดนำเสนอเลือกจาก 3 แหล่ง ตามลำดับความสำคัญ:

1. **รูปจากเครื่องนี้** — เปิดโหมดนำเสนอ → แผง *ตั้งค่า* → หัวข้อ *หน้าปก* → *เลือกไฟล์รูป*
   (ระบบย่อรูปไม่เกิน 1920×1080 เก็บใน localStorage, เห็นเฉพาะเครื่องนี้)
2. **ลิงก์ในชีต `Config`** — ใส่คอลัมน์ A = `coverImage`, คอลัมน์ B = ลิงก์รูป (ทุกคนเห็นเหมือนกัน)
   ลิงก์ Google Drive ต้องแชร์แบบ "ทุกคนที่มีลิงก์"
3. **ปกสำเร็จรูป** — ถ้าไม่ตั้งค่าใดเลย

---

## เทคโนโลยี

- **React 19** + **Vite** + **Tailwind CSS v4**
- **Recharts** — กราฟ
- **PapaParse** — แปลง CSV จาก Google Sheet
- **@line/liff** — ล็อกอินผ่าน LINE
- **lucide-react** (ไอคอน), **sonner** (toast), **html-to-image / html2canvas** (ส่งออกภาพ)
- **oxlint** — linter

## โครงสร้างไฟล์ (ย่อ)

```
src/
├── components/
│   ├── container/          # DashboardContainer, PresentationContainer
│   └── presentational/     # UI ส่วนแสดงผล
│       └── presentation/   # สไลด์โหมดนำเสนอ (Cover, Overview, Matrix, Kpi, Summary)
├── hooks/                  # useLiff, useNotes, useSheetData
├── services/               # googleSheet.js, liffAuth.js
└── utils/                  # parseCSV.js, presentation.js
```

## Deploy

ตั้งค่าสำหรับ **Vercel** (ดู `vercel.json` — SPA rewrite ทุก path → `index.html`)
ตั้ง environment variables ในหน้า Project Settings ของ Vercel ให้ตรงกับหัวข้อด้านบน
