# 📚 คู่มือการสร้างระบบจัดการชั้นเรียน (Classroom Management System)

## 🎯 บทนำ
ระบบนี้ช่วยให้ครูสามารถ:
1. ✅ ตรวจสอบการเข้าเรียนของนักเรียน **เป็นรายวิชา**
2. ✅ บันทึกและติดตามงานที่มอบหมาย
3. ✅ ใช้งาน **ฟรี** บนเว็บ

---

## 📋 Step 1: สร้าง Google Sheet สำหรับเก็บข้อมูล

### 1.1 สร้าง Google Sheet ใหม่
1. ไปที่ https://sheets.google.com
2. คลิก **"+ สร้างสเปรดชีตใหม่"**
3. ตั้งชื่อ: **"Classroom Management"**

### 1.2 สร้าง Sheet ชื่อ "Attendance" (สำหรับการเข้าเรียน)

**ขั้นตอน:**
1. ที่ด้านล่าง ให้คลิก **"+" → "เพิ่มแผ่น"**
2. ตั้งชื่อ: **"Attendance"**

**สร้างคอลัมน์ (ตามที่แสดง):**

| Name | Subject | Date | Status |
|------|---------|------|--------|
| สมชาย | คณิตศาสตร์ | 2024-01-15 | present |
| สมหญิง | คณิตศาสตร์ | 2024-01-15 | absent |
| สมทรง | ภาษาไทย | 2024-01-15 | late |

**อธิบายคอลัมน์:**
- **Name**: ชื่อนักเรียน
- **Subject**: ชื่อวิชา (คณิตศาสตร์, ภาษาไทย, วิทยาศาสตร์, ฯลฯ)
- **Date**: วันที่ (เช่น 2024-01-15)
- **Status**: สถานะ (present, absent, late)

---

### 1.3 สร้าง Sheet ชื่อ "Assignments" (สำหรับงานนักเรียน)

**ขั้นตอน:**
1. ที่ด้านล่าง ให้คลิก **"+" → "เพิ่มแผ่น"**
2. ตั้งชื่อ: **"Assignments"**

**สร้างคอลัมน์:**

| Name | Subject | Assignment | DueDate | Status |
|------|---------|------------|---------|--------|
| สมชาย | คณิตศาสตร์ | การบ้านบทที่ 1 | 2024-01-20 | completed |
| สมหญิง | คณิตศาสตร์ | การบ้านบทที่ 1 | 2024-01-20 | pending |
| สมทรง | ภาษาไทย | ทำสารเวชสารสร้อย | 2024-01-18 | overdue |

**อธิบายคอลัมน์:**
- **Name**: ชื่อนักเรียน
- **Subject**: ชื่อวิชา
- **Assignment**: ชื่องาน/การบ้าน
- **DueDate**: วันกำหนดส่ง (เช่น 2024-01-20)
- **Status**: สถานะ (completed, pending, overdue)

---

### 1.4 แชร์ Google Sheet เพื่อให้ Webapp อ่านได้

**ขั้นตอน:**
1. ที่ Google Sheet ของคุณ คลิก **"แชร์"** (ด้านบนขวา)
2. ไปที่ **"การตั้งค่าลิงก์"**
3. เลือก **"ใครก็ได้ที่มีลิงก์"** → ให้สิทธิ์ **"ดู"** (มีความสำคัญ! อย่าให้แก้ไข)
4. คลิก **"คัดลอก"** เพื่อคัดลอก URL
5. **บันทึก URL นี้** เราจะใช้ต่อไป

---

## 🔧 Step 2: ตั้งค่า Google Sheets API Key (สำหรับอ่านข้อมูล)

### 2.1 สร้าง Google Cloud Project
1. ไปที่ https://console.cloud.google.com
2. คลิก **"Select a Project"** → **"NEW PROJECT"**
3. ตั้งชื่อ: **"Classroom Manager"** → **"CREATE"**
4. รอสักครู่ให้ project สร้างเสร็จ

### 2.2 Enable Google Sheets API
1. ค้นหา **"Google Sheets API"** ที่ search bar
2. คลิก → **"ENABLE"**

### 2.3 สร้าง API Key
1. ไปที่ **"Credentials"** (ด้านซ้าย)
2. คลิก **"+ CREATE CREDENTIALS"** → **"API Key"**
3. **คัดลอก API Key** (บันทึกไว้)

### 2.4 สำคัญ: ตั้งค่า API Key Restrictions
1. ไปที่ **"Credentials"** → เลือก API Key ของคุณ
2. ที่หัวข้อ **"Application restrictions"** เลือก **"HTTP referrers (web sites)"**
3. เพิ่ม domain ของคุณ (เช่น yourname.vercel.app)

---

## 🚀 Step 3: Deploy Web App แบบฟรี (ตัวเลือก 3 วิธี)

### ตัวเลือก A: ใช้ Vercel (แนะนำที่สุด - ง่ายที่สุด)

**ขั้นตอน:**

1. **ตั้งค่าโปรเจค:**
   ```bash
   npx create-react-app classroom-manager
   cd classroom-manager
   ```

2. **แทนที่ไฟล์ App.jsx** ด้วย code ที่ให้ไป (classroom-manager.jsx)

3. **สร้าง .env.local ไฟล์:**
   ```
   REACT_APP_GOOGLE_API_KEY=YOUR_API_KEY_HERE
   ```

4. **Push ขึ้น GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourname/classroom-manager.git
   git push -u origin main
   ```

5. **Deploy ที่ Vercel:**
   - ไปที่ https://vercel.com
   - Sign in ด้วย GitHub
   - คลิก **"New Project"** → เลือก repository ของคุณ
   - ตั้งค่า Environment Variables:
     ```
     REACT_APP_GOOGLE_API_KEY = YOUR_API_KEY
     ```
   - คลิก **"Deploy"**

6. **URL ที่ได้** จะเป็นแบบ: `https://classroom-manager-yourname.vercel.app`

---

### ตัวเลือก B: ใช้ GitHub Pages (ง่ายกว่า แต่ offline)

1. Push code ขึ้น GitHub
2. ไปที่ **Settings** → **Pages**
3. Source: เลือก **"main branch"**
4. ใช้ได้ที่ `https://yourname.github.io/classroom-manager`

---

### ตัวเลือก C: ใช้ Netlify

1. ไปที่ https://netlify.com
2. เลือก GitHub repository ของคุณ
3. ตั้งค่า Build Settings:
   - Build command: `npm run build`
   - Publish directory: `build`
4. ตั้งค่า Environment Variables
5. Deploy!

---

## 📱 Step 4: ใช้งาน Web App

### 4.1 เปิด Webapp
1. เปิด URL ที่ deploy ไป (เช่น vercel.app)
2. คลิก **"⚙️ ตั้งค่า"**
3. วาง **Google Sheet URL** ที่บันทึกไว้ก่อนหน้า
4. คลิก **"เชื่อมต่อ"**

### 4.2 ตรวจสอบการเข้าเรียน
1. ไปที่ Tab **"ตรวจสอบการเข้าเรียน"**
2. จะเห็น:
   - 📊 สถิติ (มาเรียน, ขาด, มาสาย)
   - ➕ ฟอร์มเพิ่มการเข้าเรียน
   - 📝 รายการเข้าเรียนทั้งหมด

### 4.3 ตรวจสอบงาน
1. ไปที่ Tab **"ตรวจสอบงาน"**
2. จะเห็น:
   - 📊 สถิติงาน (เสร็จ, อยู่ระหว่าง, เกินกำหนด)
   - 📖 รายการงานทั้งหมด

---

## 🔐 Step 5: ความปลอดภัยและสิทธิ์การใช้งาน

### สำหรับใช้ในโรงเรียนเท่านั้น:

1. **แชร์ลิงก์เฉพาะคนในโรงเรียน:**
   - ตั้งค่า Google Sheet: **"แชร์เฉพาะกับโดเมน @school.ac.th"**

2. **Protect API Key:**
   - ห้ามฝังเข้า GitHub publiclly
   - ใช้ Environment Variables เท่านั้น
   - ใน Vercel: ตั้งค่า API Key Restrictions → HTTP referrers

3. **สิทธิ์ Google Sheet:**
   - ครูทั่วไป: **"ดู"**
   - หัวหน้าสถานศึกษา: **"แก้ไข"**

---

## ⚡ Step 6: การปรับปรุงในอนาคต (Optional)

### เพิ่มฟีเจอร์:
- [ ] Login ด้วย Google Account
- [ ] Export เป็น PDF
- [ ] แจ้งเตือนอีเมล
- [ ] Mobile App
- [ ] Database แบบ Real-time

---

## 🆘 แก้ปัญหา

### Q: เข้าไม่ได้ข้อมูล Google Sheet?
**A:** 
- ✅ ตรวจสอบว่า API Key ถูกต้อง
- ✅ ตรวจสอบว่าเปิด Google Sheets API แล้ว
- ✅ ตรวจสอบ Browser console (F12) ดูข้อความผิดพลาด

### Q: API Key error?
**A:**
- อาจจำกัดโดเมน: ไปที่ Credentials → เลือก API Key → "Application restrictions"
- ปลดล็อก HTTP referrers ก่อน

### Q: เปิด webapp ช้า?
**A:**
- เป็นปกติครั้งแรก (Vercel cold start)
- ครั้งที่ 2 เร็วกว่า
- ใช้ Caching ใน code เพื่อเร็วขึ้น

---

## 📞 สอบถามเพิ่มเติม

- 📧 Google Sheets API Docs: https://developers.google.com/sheets/api
- 📧 Vercel Docs: https://vercel.com/docs
- 📧 React Docs: https://react.dev

---

**สร้างโดย**: AI Assistant
**ปี**: 2026
**ลิขสิทธิ์**: ใช้งานอย่างอิสระในสถานศึกษา
