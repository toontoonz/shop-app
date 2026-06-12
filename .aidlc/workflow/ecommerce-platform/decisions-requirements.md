# Requirements Decisions

## Context Summary
- **Type**: Greenfield e-commerce web app
- **Feature**: Buyer storefront (browse, select payment, submit info) + seller backend (orders by 4 statuses, sales analytics, top-seller chart)
- **Mock payment**: No real payment API integration
- **User types**: Buyer (anonymous), Seller (authenticated)
- **Required buyer fields**: name (required), phone (required), email (optional)
- **Order statuses**: ordered → paid → packing → shipped

---

## Decision Questions

### D1-1: Multi-Seller vs Single-Seller
**Question**: ระบบจะรองรับผู้ขายแบบไหน?
- 1) Single-seller — มีผู้ขายเดียว (เจ้าของร้าน) ดูแลสินค้าทั้งหมด
- 2) Multi-seller (marketplace) — ผู้ขายหลายคนแยกร้าน, ผู้ซื้อเลือกซื้อจากหลายร้านได้ **(Recommended — เพราะมีกราฟ "ใครขายเยอะสุด" ซึ่งสื่อว่ามีผู้ขายหลายคน)**
- 3) Multi-seller แต่ buyer สั่งจาก 1 seller ต่อออเดอร์ (no cross-seller cart)
- 4) Other: _______

**Answer**: 2 — Multi-seller (marketplace)

---

### D1-2: Seller Onboarding
**Question**: ผู้ขายเข้าระบบอย่างไร?
- 1) Self-signup — ผู้ขายลงทะเบียนเองได้ทันที
- 2) Admin invite-only — แอดมินสร้างบัญชีให้ ผู้ขายล็อกอินด้วย credentials ที่ได้รับ **(Recommended — control คุณภาพ seller, ลด edge case)**
- 3) Self-signup with admin approval — ลงทะเบียนเอง แต่รออนุมัติก่อน login
- 4) Other: _______

**Answer**: 2 — Admin invite-only

---

### D1-3: Buyer Account
**Question**: ผู้ซื้อต้องสมัครสมาชิกหรือไม่?
- 1) Anonymous checkout เท่านั้น — กรอกข้อมูลทุกครั้งที่สั่งซื้อ **(Recommended — ตรงกับคำอธิบายของคุณ "เก็บข้อมูลผู้ซื้อ" ในขั้นตอนสั่งซื้อ)**
- 2) Optional account — สมัครก็ได้ ไม่สมัครก็สั่งได้
- 3) Required account — ต้องสมัครก่อนจึงสั่งซื้อได้
- 4) Other: _______

**Answer**: 1 — Anonymous checkout only

---

### D1-4: Mock Payment Methods
**Question**: จะให้เลือกวิธีชำระเงินแบบ mock อะไรบ้าง?
- 1) Single option — แค่ "Cash on Delivery" หรือ "Bank Transfer" อย่างเดียว
- 2) Multiple options — Bank Transfer, Cash on Delivery, e-Wallet, Credit Card (ทั้งหมดเป็น mock ไม่ส่งไปไหน) **(Recommended — สะท้อนโลกจริง, ทดสอบ flow ได้หลากหลาย)**
- 3) เลือกได้หลายแบบ + อัปโหลดสลิปการโอนเงิน (mock confirmation)
- 4) Other: _______

**Answer**: 2 — Multiple options (Bank Transfer, COD, e-Wallet, Credit Card — all mock)

---

### D1-5: Order Status Transitions
**Question**: ใครเปลี่ยนสถานะออเดอร์ และเปลี่ยนอย่างไร?
- 1) Auto — ระบบเปลี่ยนสถานะอัตโนมัติตาม trigger
- 2) Manual โดย seller เท่านั้น — seller กดปุ่มเปลี่ยน status เองทุกขั้น **(Recommended — เรียบง่าย, ตรงกับ scope mock payment)**
- 3) Hybrid — บาง status auto, บาง status manual
- 4) Other: _______

**Answer**: 2 — Manual by seller only

---

### D1-6: Order Status Direction
**Question**: สถานะเดินหน้าได้อย่างเดียว หรือย้อนกลับ/ยกเลิกได้?
- 1) Forward-only — เดินหน้าเท่านั้น (1→2→3→4) ไม่ย้อนกลับ
- 2) Forward + Cancel — เดินหน้าหรือยกเลิกได้ทุกขั้น (มีสถานะ "cancelled" เพิ่ม) **(Recommended — รองรับ real-world, ไม่ซับซ้อนมาก)**
- 3) Free transitions — ย้อนกลับได้ทุกทิศ (เผื่อแก้ไข)
- 4) Other: _______

**Answer**: 2 — Forward + Cancel (cancelled is a 5th terminal status)

---

### D1-7: Analytics Charts
**Question**: หน้า dashboard analytics ต้องมีกราฟอะไรบ้าง?
- 1) Minimal — กราฟยอดขายรวมรายวัน + Top-seller leaderboard
- 2) Standard — ยอดขายรายวัน/รายเดือน, จำนวนออเดอร์แยกตาม status, Top-seller leaderboard, สินค้าขายดี **(Recommended — ครอบคลุมที่ผู้ใช้ต้องการ)**
- 3) Advanced — ทุกกราฟใน Standard + revenue forecast + customer retention
- 4) Other: _______

**Answer**: 2 — Standard (sales chart, orders-by-status, top-seller, top-products)

---

### D1-8: Analytics Time Range
**Question**: ผู้ใช้ filter ช่วงเวลาดูยอดขายได้แค่ไหน?
- 1) Fixed — แสดง "30 วันล่าสุด" อย่างเดียว
- 2) Preset ranges — Today / 7 days / 30 days / This month / This year **(Recommended — ใช้งานสะดวก, implement ง่าย)**
- 3) Custom date picker — เลือกช่วงเวลาเอง + presets
- 4) Other: _______

**Answer**: 2 — Preset ranges (Today, 7d, 30d, This month, This year)

---

### D1-9: Analytics Scope (Top Seller)
**Question**: "Top seller" คำนวณจากอะไร?
- 1) จำนวน orders ที่ paid+ ขึ้นไป
- 2) มูลค่ายอดขายรวม (sum of order totals where status≥paid) **(Recommended — สื่อความหมาย "ขายเยอะสุด" ทางมูลค่าจริง)**
- 3) ทั้งสองแบบ — แสดง 2 leaderboard
- 4) Other: _______

**Answer**: 2 — Total revenue (sum of order totals where status ≥ paid)

---

### D1-10: Personas Document
**Question**: ต้องการให้สร้างเอกสาร personas (โปรไฟล์ผู้ใช้แบบละเอียด) หรือไม่?
- 1) Yes — สร้าง personas.md อธิบาย Buyer และ Seller แบบละเอียด (goals, pain points, journey) **(Recommended — มี 2 user types ที่มีพฤติกรรมต่างกันชัดเจน)**
- 2) No — user types ที่ระบุไปแล้วชัดเจนพอ
- 3) Other: _______

**Answer**: 1 — Yes, generate personas.md

---

### D1-11: Out of Scope
**Question**: features ใดต่อไปนี้ "ไม่ต้องทำ" ใน MVP นี้?
- 1) Out of scope: Real payment integration, Email notifications, Shipping label/tracking integration, Reviews/ratings, Advanced inventory (low-stock alerts, auto-reorder), Promotions/coupons, Refunds workflow **(Recommended — keep MVP focused)**
- 2) ไม่ทำเฉพาะ Real payment + Shipping integration (อย่างอื่นทำด้วย)
- 3) ทำทุกอย่าง (full e-commerce)
- 4) Other: _______

**Answer**: 1 — Out of scope: real payment, email/SMS notifications, shipping integration, reviews/ratings, advanced inventory, promotions/coupons, refund workflow

---

### D1-12: Localization
**Question**: UI ใช้ภาษาอะไร?
- 1) Thai เท่านั้น **(Recommended — ตรงกับ user request ที่เป็นภาษาไทย)**
- 2) English เท่านั้น
- 3) Bilingual (Thai/English) — มีปุ่ม switch
- 4) Other: _______

**Answer**: 1 — Thai only

---

### D1-13: Timeline & Priority
**Question**: timeline และระดับ priority ของโปรเจกต์เป็นอย่างไร?
- 1) MVP เร่งด่วน (1-2 สัปดาห์)
- 2) Standard MVP (1-2 เดือน) — ครบทุก functional area ตาม scope ที่ตกลงกัน **(Recommended — เหมาะกับ scope ที่อธิบายมา)**
- 3) Full product (3+ เดือน) — รวม polish, edge cases, NFRs ทั้งหมด
- 4) Other: _______

**Answer**: 2 — Standard MVP (1-2 months)

---

### D1-14: Team Size (Mandatory)
**Question**: มีคนพัฒนาโปรเจกต์นี้กี่คน?
- 1) Solo (1 developer) **(Recommended สำหรับ scope นี้)**
- 2) Small team (2–3 developers)
- 3) Medium team (4–8 developers)
- 4) Large team (9+ developers)

**Answer**: 1 — Solo (1 developer)

---

## Decisions Summary
<!-- Machine-readable compact summary. Downstream phases: read ONLY this section. -->
- D1-1 SellerModel: Multi-seller (marketplace), each seller has own products and orders
- D1-2 SellerOnboarding: Admin invite-only — admin creates seller accounts, sellers log in with provided credentials
- D1-3 BuyerAccount: Anonymous checkout only — no buyer accounts, info collected per order
- D1-4 PaymentMethods: Multiple mock methods — Bank Transfer, Cash on Delivery, e-Wallet, Credit Card (no real payment API calls)
- D1-5 StatusTransitionTrigger: Manual by seller — seller manually advances each order through statuses
- D1-6 StatusDirection: Forward + Cancel — forward-only progression with separate cancel action (cancelled = terminal status)
- D1-7 AnalyticsCharts: Standard — sales chart (daily/monthly), orders-by-status counts, top-seller leaderboard, top-selling products
- D1-8 AnalyticsTimeRange: Preset ranges — Today / 7 days / 30 days / This month / This year
- D1-9 TopSellerMetric: Total revenue — sum of order totals where status >= paid
- D1-10 Personas: Yes — generate personas.md for Buyer and Seller
- D1-11 OutOfScope: Real payment integration, email/SMS notifications, shipping integration, reviews/ratings, advanced inventory, promotions/coupons, refund workflow
- D1-12 Localization: Thai only
- D1-13 Timeline: Standard MVP (1-2 months)
- D1-14 TeamSize: Solo (1 developer)

---

**Validation Notes**: All answers checked against D1 validation rules. No conflicts detected — scope (Standard MVP), team size (solo), and timeline are aligned. No external integrations (mock payment), no compliance flags, no real-time requirements, single platform (web). Ready to generate requirements.
