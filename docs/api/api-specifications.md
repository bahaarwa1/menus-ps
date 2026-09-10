# Menus.ps — API Specifications & Contracts

## 1. Overview
The Menus.ps API provides endpoints for:
1. **Public/Customer Services**: QR resolution, menu catalog, cart submission, table waiter call.
2. **Kitchen/Staff Services**: Ticket streaming, status progression, undo safeguard.
3. **Manager/Admin Services**: Menu editing, table arrangement, analytics, settings.

Base Path: `/api/v1`

---

## 2. Endpoints Specification

### 2.1 Customer & QR Menu API

#### `GET /api/v1/menu/resolve-table`
Resolves table metadata and branch details from QR token.
- **Query Params**: `token` (string, required)
- **Response `200 OK`**:
```json
{
  "restaurant": {
    "name": "Burger House",
    "logo": "/logo.png",
    "currency": "₪"
  },
  "branch": {
    "id": "br_nablus_01",
    "name": "فرع نابلس الرئيسي"
  },
  "table": {
    "id": "tbl_12",
    "number": 12
  }
}
```

#### `GET /api/v1/menu/catalog`
Fetches available categories and active menu items.
- **Headers**: `X-Branch-Id` or query `branchId`
- **Response `200 OK`**:
```json
{
  "categories": [
    { "id": "burgers", "name": "برغر", "icon": "🍔" }
  ],
  "items": [
    {
      "id": "b1",
      "categoryId": "burgers",
      "name": "دبل سماش برغر",
      "description": "قطعتين لحم سماش مع جبنة ذائبة وصوص سماش الخاص",
      "price": 42,
      "imageUrl": "https://...",
      "popular": true,
      "isAvailable": true
    }
  ]
}
```

#### `POST /api/v1/orders/submit`
Submits a customer order to the kitchen.
- **Request Body**:
```json
{
  "tableId": "tbl_12",
  "customerNote": "بدون بصل في أحد البرغرين",
  "items": [
    {
      "itemId": "b1",
      "quantity": 2,
      "unitPrice": 42,
      "notes": "استواء ميديوم",
      "extras": ["جبنة شيدر إضافية"]
    }
  ]
}
```
- **Response `201 Created`**:
```json
{
  "orderId": "#ORD-1052",
  "status": "جديد",
  "totalAmount": 84,
  "createdAt": "2026-09-10T22:30:00Z"
}
```

#### `POST /api/v1/tables/call-waiter`
Sends an instant notification to staff that table X requested assistance.
- **Request Body**: `{ "tableId": "tbl_12" }`
- **Response `200 OK`**: `{ "success": true, "message": "تم تنبيه الويتر" }`

---

### 2.2 Kitchen & Staff API

#### `GET /api/v1/staff/orders/live`
Fetches active orders for the kitchen screen.
- **Headers**: `Authorization: Bearer <staff_jwt>`
- **Response `200 OK`**:
```json
[
  {
    "id": "#1048",
    "table": 4,
    "time": "14:30",
    "elapsedMinutes": 2,
    "status": "new",
    "customerNote": "بدون بصل، صوص خارجي حار",
    "items": [
      { "name": "دبل سماش برغر", "qty": 2, "notes": "لحم مستوي ميديوم" }
    ]
  }
]
```

#### `PATCH /api/v1/staff/orders/:id/status`
Updates ticket status with mandatory undo-token generation.
- **Request Body**: `{ "status": "cooking" | "ready" | "completed" }`
- **Response `200 OK`**:
```json
{
  "success": true,
  "orderId": "#1048",
  "previousStatus": "new",
  "newStatus": "cooking",
  "undoToken": "undo_token_991823"
}
```

#### `POST /api/v1/staff/orders/:id/undo`
Reverts status change if triggered within the 8-second safety window.
- **Request Body**: `{ "undoToken": "undo_token_991823" }`
- **Response `200 OK`**: `{ "revertedTo": "new" }`

---

### 2.3 Realtime Event Streaming

```
Channel: branch:<branch_id>:kitchen
Events:
  - "order:created"      -> Plays sound alert, pushes ticket to 'جديد' column.
  - "order:status_change"-> Synchronizes across all tablets/phones in kitchen.
  - "waiter:called"      -> Displays high-priority amber banner with table number.
```
