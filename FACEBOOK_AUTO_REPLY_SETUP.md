# Facebook Auto-Reply Setup Guide

## Overview

Your Facebook auto-reply system now supports **two business types**:
- 🛍️ **Online Shop** - Product orders, pricing, delivery
- 📦 **Cargo/Shipping** - Package tracking, shipping rates, delivery areas

The system uses **AI (OpenAI)** to intelligently extract information and respond naturally to customers.

---

## Setup Steps

### 1. Run Database Migration

First, add the business_type support to your database:

```bash
# Connect to your Supabase database and run the migration
# You can use Supabase dashboard SQL Editor or psql command

# Copy the contents of: src/scripts/add_business_type.sql
# And run it in your Supabase SQL Editor
```

**What this does:**
- Adds `business_type` column to `automation_flows` table
- Creates `shipments` table for cargo business
- Sets up proper indexes and security policies

### 2. Build the Backend

Compile the TypeScript code:

```bash
cd backend
npm run build
```

### 3. Restart Your Server

```bash
npm run dev
# or for production:
npm start
```

---

## Creating Automation Flows

### Option A: Use Pre-configured Flows (Recommended)

Run the seed script to create default flows:

```bash
cd backend
npx tsx src/scripts/seed_default_flows.ts YOUR_MERCHANT_ID
```

This creates 8 pre-configured flows:

**Online Shop Flows:**
- `order` - Product ordering
- `price` - Pricing inquiries
- `delivery` - Delivery information
- `payment` - Payment methods

**Cargo Flows:**
- `ship` - New shipment
- `track` - Package tracking
- `rate` - Shipping rates
- `areas` - Coverage areas

### Option B: Create Flows Manually via API

**Online Shop Example:**
```bash
POST /api/auto-reply/flows
Authorization: Bearer YOUR_TOKEN

{
  "name": "Product Order Flow",
  "trigger_keyword": "order",
  "business_type": "online_shop",
  "is_active": true,
  "merchant_id": "your-merchant-id"
}
```

**Cargo Example:**
```bash
POST /api/auto-reply/flows
Authorization: Bearer YOUR_TOKEN

{
  "name": "New Shipment Flow",
  "trigger_keyword": "ship",
  "business_type": "cargo",
  "is_active": true,
  "merchant_id": "your-merchant-id"
}
```

---

## How It Works

### Online Shop Flow

1. Customer sends: **"order"**
2. AI responds: "Hello! I'd be happy to help you place an order. What product would you like to order?"
3. Customer: "Blue T-shirt"
4. AI: "Great! How many would you like?"
5. Customer: "2"
6. AI: "Perfect! Where should I deliver these?"
7. Customer: "123 Main St, Yangon"
8. AI: "What's your phone number?"
9. Customer: "09123456789"
10. AI: "How would you like to pay? (COD/Bank Transfer)"
11. Customer: "COD"
12. AI: "✅ Order complete! We'll contact you shortly."
13. **System creates order in database**

### Cargo Flow

1. Customer sends: **"ship"**
2. AI responds: "Hello! I can help you ship a package. What type of package? (document/parcel/box)"
3. Customer: "Box"
4. AI: "What's the weight in kg?"
5. Customer: "5kg"
6. AI: "Where should we pick it up?"
7. Customer: "456 Business St, Mandalay"
8. AI: "Where should we deliver it?"
9. Customer: "789 Customer Ave, Yangon"
10. AI: "Contact number?"
11. Customer: "09987654321"
12. AI: "Delivery speed? (standard/express)"
13. Customer: "Express"
14. AI: "✅ Shipment booked! Tracking number: SHIP123456"
15. **System creates shipment in database**

---

## Connecting Facebook Pages

### 1. Configure Your Facebook App

Make sure your `.env` has:
```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_WEBHOOK_VERIFY_TOKEN=my_verify_token_123
```

### 2. Set Up Webhook

In Facebook Developer Console:
- Webhook URL: `https://your-domain.com/api/webhook/facebook`
- Verify Token: `my_verify_token_123`
- Subscribe to: `messages` event

### 3. Connect a Page

Users connect their Facebook pages through your frontend OAuth flow:
1. Click "Connect Facebook Page"
2. Authorize with Facebook
3. Select which page to connect
4. System stores `page_access_token` in `platform_connections`

---

## Testing

### Test Online Shop Flow

Send a message to your Facebook page:
```
order
```

The AI should ask about:
- Product name/code
- Quantity
- Delivery address
- Phone number
- Payment method

### Test Cargo Flow

Send a message:
```
ship
```

The AI should ask about:
- Package type
- Weight
- Pickup address
- Delivery address
- Phone number
- Delivery urgency

---

## Customizing AI Prompts

You can override the default AI prompts per flow:

```javascript
// When creating a flow, add custom ai_prompt:
{
  "name": "Custom Order Flow",
  "trigger_keyword": "buy",
  "business_type": "online_shop",
  "ai_prompt": "You are a luxury fashion assistant. Ask about size preferences and style. Extract: product_name, size, color, delivery_address, phone_number. Return JSON with order_complete: true/false"
}
```

---

## Database Tables

### Orders (Online Shop)
```sql
- merchant_id
- conversation_id
- product_code / product_name
- quantity
- delivery_address
- phone_number
- payment_method
- status (pending/confirmed/delivered)
```

### Shipments (Cargo)
```sql
- merchant_id
- conversation_id
- package_type
- weight
- pickup_address
- delivery_address
- phone_number
- delivery_urgency
- tracking_number
- status (pending/in_transit/delivered)
```

---

## Troubleshooting

### Orders not creating?
- Check if `is_active: true` on your automation flow
- Verify OpenAI API key is valid in `.env`
- Check backend logs for errors

### AI not responding correctly?
- Test your OpenAI key with: `npx tsx -e "import('openai').then(m => new m.default({apiKey: process.env.OPENAI_API_KEY}).chat.completions.create({model: 'gpt-4o-mini', messages:[{role:'user',content:'hi'}]}))"`
- Check if business_type matches your flow config

### Webhook not receiving messages?
- Verify webhook URL is publicly accessible (use ngrok for local testing)
- Check Facebook webhook logs in Developer Console
- Ensure verify token matches

---

## Next Steps

1. **Frontend Dashboard** - Add UI to create/manage flows with business type selector
2. **Analytics** - Track conversion rates per business type
3. **Templates** - Add quick reply buttons for common questions
4. **Multilanguage** - Support Myanmar/Burmese responses

---

## API Reference

### Create Automation Flow
```
POST /api/auto-reply/flows
```

### Get All Flows
```
GET /api/auto-reply/flows
```

### Update Flow
```
PUT /api/auto-reply/flows/:id
```

### Delete Flow
```
DELETE /api/auto-reply/flows/:id
```

---

Need help? Check the implementation_plan.md for technical details!
