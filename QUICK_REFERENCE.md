# Quick Reference: Business Types

## 🛍️ Online Shop

**Trigger Keywords:** order, buy, purchase, price, delivery, payment

**AI Extracts:**
- product_code / product_name
- quantity
- delivery_address
- phone_number
- payment_method

**Creates:** Record in `orders` table

**Example Conversation:**
```
Customer: order
AI: What product would you like to order?
Customer: Blue T-shirt
AI: How many?
Customer: 2
AI: Delivery address?
Customer: 123 Main St
AI: Phone number?
Customer: 09123456789
AI: Payment method? (COD/Bank Transfer)
Customer: COD
AI: ✅ Order complete!
```

---

## 📦 Cargo/Shipping

**Trigger Keywords:** ship, track, rate, areas

**AI Extracts:**
- package_type
- weight
- pickup_address
- delivery_address
- phone_number
- delivery_urgency

**Creates:** Record in `shipments` table

**Example Conversation:**
```
Customer: ship
AI: What type of package? (document/parcel/box)
Customer: Box
AI: Weight in kg?
Customer: 5kg
AI: Pickup address?
Customer: 456 Business St
AI: Delivery address?
Customer: 789 Customer Ave
AI: Phone number?
Customer: 09987654321
AI: Delivery speed? (standard/express)
Customer: Express
AI: ✅ Shipment booked!
```

---

## 🔧 Configuration

### Create Flow via Database
```sql
INSERT INTO automation_flows (
  merchant_id,
  name,
  trigger_keyword,
  business_type,
  is_active
) VALUES (
  'your-merchant-id',
  'Product Orders',
  'order',
  'online_shop',  -- or 'cargo'
  true
);
```

### Business Types
- `online_shop` - For e-commerce
- `cargo` - For shipping/logistics
- `default` - Generic (falls back to original behavior)

---

## 📊 Database Tables

### automation_flows
- Added: `business_type VARCHAR(50) DEFAULT 'online_shop'`

### orders (existing)
- Used for online_shop business type
- Stores: product, quantity, address, phone, payment

### shipments (NEW)
- Used for cargo business type
- Stores: package_type, weight, addresses, phone, urgency, tracking

---

## 🚀 Quick Start Commands

```bash
# 1. Run migration (in Supabase SQL Editor)
# Copy/paste: src/scripts/add_business_type.sql

# 2. Build backend
cd backend
npm run build

# 3. Seed default flows
npx tsx src/scripts/seed_default_flows.ts YOUR_MERCHANT_ID

# 4. Start server
npm run dev
```

---

## 🧪 Testing

```bash
# Test online shop
# Send to Facebook page: "order"

# Test cargo
# Send to Facebook page: "ship"
```

Check database tables after completion:
- Online shop → `orders` table
- Cargo → `shipments` table
