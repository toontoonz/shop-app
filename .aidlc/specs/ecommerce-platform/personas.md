# Personas

## Summary
- **User Types**: 2 personas
- **Key Roles**: Buyer (anonymous shopper), Seller (authenticated marketplace vendor)
- **Design Implications**: Two separate UIs (public storefront + authenticated backend), no buyer-side auth, simple session-based seller auth, role distinction enforced server-side

## Overview
This feature serves 2 distinct user types: anonymous **Buyers** who browse and purchase products through a public storefront, and authenticated **Sellers** who log into a backend to manage their products, fulfill orders, and track sales analytics.

---

## Buyer (คุณนภา — ผู้ซื้อทั่วไป)

**Role**: Anonymous shopper visiting the storefront to browse and order products

**Goals**:
- ค้นหาและสั่งซื้อสินค้าที่ต้องการได้อย่างรวดเร็ว
- กรอกข้อมูลติดต่อขั้นต่ำ (ชื่อ, เบอร์โทร) โดยไม่ต้องสมัครสมาชิก
- เห็นการยืนยันคำสั่งซื้อทันทีหลัง submit เพื่อความมั่นใจว่าออเดอร์ถูกบันทึก

**Pain Points**:
- ไม่อยากกรอกฟอร์มยาวหรือสมัครสมาชิกแค่เพื่อซื้อของชิ้นเดียว
- ไม่ชอบเว็บที่บังคับให้ผูก credit card หรือใช้ payment ที่ไม่คุ้นเคย
- กังวลว่าออเดอร์จะหายหรือไม่ได้รับการดำเนินการหลังจากกดสั่งซื้อ

**User Journey**: เข้าหน้าร้าน → เลือกสินค้า → ใส่ตะกร้า → กรอกชื่อ/เบอร์/อีเมล (optional) + เลือกวิธีชำระเงิน → กด "ยืนยันคำสั่งซื้อ" → เห็นหน้ายืนยัน + เลขออเดอร์

**Implications**:
- ไม่ต้องมี login flow สำหรับฝั่งผู้ซื้อ
- Form validation ต้องชัดเจน (name + phone บังคับ, email optional)
- หน้ายืนยันออเดอร์ต้องแสดงเลข order, สรุปสินค้า, วิธีชำระเงิน, ข้อมูลติดต่อที่กรอก
- รองรับการ browse ทั้งบน desktop และ mobile (responsive)

---

## Seller (คุณภูมิ — เจ้าของร้านค้า)

**Role**: Authenticated marketplace vendor managing products and fulfilling orders through the backend

**Goals**:
- ดูรายการออเดอร์ของร้านตัวเอง แยกตามสถานะ (ordered / paid / packing / shipped / cancelled) ได้ทันทีหลัง login
- เปลี่ยนสถานะออเดอร์ไปตามขั้นตอน packing และ shipping ได้รวดเร็ว
- ดูภาพรวมยอดขายและเปรียบเทียบกับ seller รายอื่นเพื่อวัดผลงานตัวเอง

**Pain Points**:
- ต้องสลับไปสลับมาระหว่างหลายเครื่องมือเพื่อจัดการสินค้า ออเดอร์ และดูยอดขาย
- ไม่มีภาพรวม performance ที่เปรียบเทียบกับ seller คนอื่นในระบบ
- ระบบหลังบ้านส่วนใหญ่ซับซ้อนเกินไปสำหรับร้านค้าขนาดเล็ก

**User Journey**: เข้าหน้า login → ใส่ credentials ที่ admin ออกให้ → เห็น dashboard analytics → ไปหน้า orders → filter ตาม status → กดเปลี่ยนสถานะออเดอร์หรือ cancel → กลับมาดู analytics → logout

**Implications**:
- ต้องมี authenticated session (login/logout) สำหรับฝั่ง seller เท่านั้น
- ระบบต้อง enforce ว่า seller เห็นและจัดการได้เฉพาะออเดอร์/สินค้าของตัวเอง
- Dashboard ต้องแสดงทั้งข้อมูลของ seller คนนั้นและ leaderboard เปรียบเทียบทั้งระบบ
- หน้าจัดการออเดอร์ต้องโหลดเร็ว, filter by status ต้อง responsive
- การกดเปลี่ยน status ควรต้องการ confirmation step เพื่อป้องกันคลิกผิด

---

## Design Implications

- **Architecture**: ระบบต้องมี 2 ส่วนชัดเจน — public storefront (no auth) และ authenticated seller backend. Server-side ต้อง enforce authorization สำหรับทุก endpoint ฝั่ง seller โดยเช็คทั้ง authentication และ ownership (seller จัดการได้เฉพาะ resource ของตัวเอง)
- **UI/UX**: Storefront เน้นความเรียบง่ายและ form ขั้นต่ำ. Backend เน้น dense data view (table + chart) พร้อม filter ที่ใช้งานสะดวก. ทั้งสองส่วนต้อง responsive รองรับ mobile (storefront สำคัญกว่า)
- **Data & Privacy**: ข้อมูลผู้ซื้อ (ชื่อ, เบอร์, อีเมล) เก็บผูกกับ order. Seller เห็นข้อมูลผู้ซื้อได้เฉพาะ order ของตัวเอง. ไม่มี cross-seller data leakage
- **Authorization model**: Two roles — admin (creates seller accounts), seller (manages own products + orders). Buyer มี no role (anonymous). Admin role behavior is out of scope for this MVP except for the assumption that seller credentials exist
