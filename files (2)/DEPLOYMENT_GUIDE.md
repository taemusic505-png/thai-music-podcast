# ✅ Deployment Checklist & Configuration

## 📋 Checklist ก่อน Deploy

### Google Sheets Setup
- [ ] สร้าง Google Sheet
- [ ] สร้าง Sheet "Attendance" พร้อมคอลัมน์: Name, Subject, Date, Status
- [ ] สร้าง Sheet "Assignments" พร้อมคอลัมน์: Name, Subject, Assignment, DueDate, Status
- [ ] เพิ่มข้อมูลตัวอย่าง 5-10 แถว
- [ ] แชร์ Google Sheet เป็น "ใครก็ได้ดู"
- [ ] คัดลอก URL ของ Sheet

### Google Cloud Setup
- [ ] สร้าง Google Cloud Project
- [ ] Enable Google Sheets API
- [ ] สร้าง API Key
- [ ] ตั้งค่า API Key Restrictions (HTTP referrers)
- [ ] คัดลอก API Key

### Code Setup
- [ ] Clone/Download code
- [ ] ติดตั้ง Node.js
- [ ] รัน: `npm install`
- [ ] สร้าง .env.local พร้อมค่า:
  - `REACT_APP_GOOGLE_API_KEY=YOUR_API_KEY`
  - `REACT_APP_SHEET_ID=YOUR_SHEET_ID` (optional)
- [ ] ทดสอบในที่ localhost ได้ปกติ

### GitHub Setup (สำหรับ Vercel/GitHub Pages)
- [ ] สร้าง GitHub account
- [ ] สร้าง repository ใหม่
- [ ] Push code ขึ้น GitHub
- [ ] ตรวจสอบว่า .env.local ในไฟล์ .gitignore (ป้องกันรั่วไหล API Key)

### Vercel/Deployment
- [ ] สร้าง Vercel account (เชื่อมต่อ GitHub)
- [ ] Import project จาก GitHub
- [ ] ตั้งค่า Environment Variables:
  - `REACT_APP_GOOGLE_API_KEY`
  - `REACT_APP_SHEET_ID`
- [ ] Deploy
- [ ] ทดสอบ URL ที่ deploy

---

## 🔐 Security Checklist

### API Key Protection
- [ ] ไม่ได้ commit .env.local ขึ้น GitHub
- [ ] ใช้ Environment Variables ใน Vercel
- [ ] ตั้งค่า API Key Restrictions ที่ Google Cloud
- [ ] Restrict โดเมน (domain whitelist)

### Google Sheet Permission
- [ ] ไม่ให้ edit สำหรับคนทั่วไป
- [ ] เฉพาะ "ดู" (View only)
- [ ] ที่ต้องแก้ไข: ครู/แอดมิน เท่านั้น

### School Domain (ถ้าเป็นไปได้)
- [ ] แชร์เฉพาะ @school.ac.th domain
- [ ] ใช้ School Workspace หากมี

---

## 🚀 Configuration Files Reference

### .env.local (Local Development)
```
REACT_APP_GOOGLE_API_KEY=AIzaSyC1QeJqX_8fR9aBcDeFgHiJkLmNoPqRsTu
REACT_APP_SHEET_ID=1A9c_Qb1K2L3M4N5O6P7Q8R9S0T1U2V3W4
REACT_APP_API_BASE_URL=http://localhost:3000
```

### Vercel Environment Variables
ไป Vercel Dashboard → Project → Settings → Environment Variables

```
REACT_APP_GOOGLE_API_KEY = AIzaSyC1QeJqX_8fR9aBcDeFgHiJkLmNoPqRsTu
REACT_APP_SHEET_ID = 1A9c_Qb1K2L3M4N5O6P7Q8R9S0T1U2V3W4
REACT_APP_API_BASE_URL = https://yourapp.vercel.app
```

### .gitignore (ต้อง include)
```
node_modules/
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
build/
dist/
.DS_Store
```

---

## 📦 Package.json Dependencies

```json
{
  "dependencies": {
    "react": "^18.x.x",
    "react-dom": "^18.x.x",
    "react-scripts": "5.0.x",
    "recharts": "^2.10.x",
    "lucide-react": "^0.x.x"
  }
}
```

---

## 🔄 Deployment Process (Step by Step)

### Step 1: Local Testing
```bash
npm install
npm start
# เปิด http://localhost:3000
# ทดสอบว่าสามารถอ่าน Google Sheet ได้
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Initial classroom manager setup"
git push origin main
```

### Step 3: Deploy to Vercel
1. ไปที่ https://vercel.com
2. Sign in ด้วย GitHub
3. New Project → เลือก repository
4. Framework: React
5. Build Settings (auto-detect ได้เอง)
6. Environment Variables: เพิ่ม REACT_APP_GOOGLE_API_KEY
7. Deploy!

### Step 4: Test Live Site
- คลิกลิงก์ที่ Vercel ให้
- ทดสอบ Attendance tab
- ทดสอบ Assignments tab
- ทดสอบการอ่านข้อมูล

---

## 🛠️ Troubleshooting

### ❌ Error: "Could not read Google Sheets API"
**สาเหตุ:** API Key ไม่ถูกต้อง หรือ API ยังไม่เปิด

**แก้ไข:**
1. ไปที่ Google Cloud Console
2. เช็ค Google Sheets API เปิดแล้ว
3. สร้าง API Key ใหม่
4. อัปเดต REACT_APP_GOOGLE_API_KEY

### ❌ Error: "403 Forbidden"
**สาเหตุ:** API Key ถูกจำกัด หรือ domain ไม่ถูกอนุญาต

**แก้ไข:**
1. ไปที่ Credentials → API Key
2. คลิก Edit
3. Application restrictions:
   - HTTP referrers
   - เพิ่ม `*.vercel.app` หรือ domain ของคุณ

### ❌ Error: "Not Found - 404"
**สาเหตุ:** Sheet ชื่อ "Attendance" หรือ "Assignments" ไม่มี

**แก้ไข:**
1. ไปที่ Google Sheet
2. ตรวจสอบชื่อ Sheet ตรงตามเดิม (Case-sensitive)
3. ตรวจสอบคอลัมน์ Headers ตรงตามที่คาดหวัง

### ❌ ข้อมูลโหลดช้า
**สาเหตุ:** Vercel cold start หรือ Google API slow response

**แก้ไข:**
- ครั้งแรก: ปกติจะช้า (5-10 วินาที)
- ครั้งต่อไป: เร็วกว่า
- เพิ่ม Caching ใน code หากต้อง

---

## 📊 Monitoring

### เช็ค API Usage
1. ไปที่ Google Cloud Console
2. APIs & Services → Usage & Quotas
3. เช็ค "Sheets API" quotas

### เช็ค Deployment Status
1. Vercel Dashboard → Deployments
2. เช็คความเป็น Live ของเวอร์ชันล่าสุด

---

## 🎯 URLs Reference

| Service | URL |
|---------|-----|
| Google Cloud Console | https://console.cloud.google.com |
| Google Sheets | https://sheets.google.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| GitHub | https://github.com |
| Google Sheets API Docs | https://developers.google.com/sheets/api |
| Vercel Docs | https://vercel.com/docs |

---

## 💡 Tips

### สำหรับการใช้งานยาวๆ
1. **Backup Sheet**: สร้าง copy ของ Sheet เก่า
2. **Monitor API**: ตรวจสอบ quota ของ API
3. **Update regularly**: เพิ่ม feature ใหม่ตามต้องการ

### สำหรับการใช้งานในชั้นเรียนจริง
1. **Train Teachers**: ให้ครูรู้วิธีใช้งาน
2. **Set Schedule**: กำหนดเวลา input ข้อมูล
3. **Backup Data**: ทำ backup Google Sheet อย่างน้อยเดือนละครั้ง

---

## 📞 Support Resources

- Google Sheets API: https://developers.google.com/sheets/api/guides/concepts
- Vercel Support: https://vercel.com/support
- React Docs: https://react.dev
- Stack Overflow: https://stackoverflow.com (tag: google-sheets-api, vercel)
