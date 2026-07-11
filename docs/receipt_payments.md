# Receipt Payment Feature Documentation & API Contracts

This document provides details on the implementation of the Receipt Payment (Phiếu chi) module in the AIOM Mobile App, detailing the client-side screens, business logic rules, and backend API contracts.

---

## 1. Feature Overview

The Receipt Payment module allows managers and administrators to record business expenses. There are two primary categories:
1. **Supplier Payments (`supplier_payment`):** Payments made for stock imports. These can be linked directly to unpaid Receipt Imports (`receipt-imports`) or designated as "Direct Export" (running goods directly without warehouse tracking).
2. **Other General Expenses:** Utilities, rent, transportation, labor, and custom/other costs.

### User Flow
1. **List view (`/tabs/extended/payment-receipts`):** Displays all receipt payments with quick filters (All, Paid, Draft, Cancelled), advanced filters (date ranges, expense types, payment methods), and search. Displays the "Total Expenses Today" card.
2. **Create view (`/tabs/extended/payment-receipts/create`):** Form to create a new receipt payment. Selects the date, expense type, recipient/supplier, payment method, amount, and notes.
3. **Detail view (`/tabs/extended/payment-receipts/detail/:id`):** View details of a receipt payment, including linked receipt imports and system information. Provides Delete and Edit links.
4. **Update view (`/tabs/extended/payment-receipts/update/:id`):** Standard update form populated with the receipt payment details to perform changes. *(Lưu ý: Màn hình chi tiết hiện tại hỗ trợ chỉnh sửa trực tiếp phần Ghi chú (inline edit) và lưu qua API thay vì chuyển hướng sang trang sửa này).*


---

## 2. Business Rules & Validations

- **Supplier Payments:**
  - If `isDirectExport` is `false` (default), the user **must** select at least one unpaid receipt import.
  - If multiple receipt imports are selected, the total `amount` is calculated as the sum of all selected imports and the input is marked as read-only.
  - If exactly one receipt import is selected, the amount is editable to allow partial payments.
- **Custom Expense Types:**
  - If `expenseType` is `other`, a custom text input `expenseTypeName` is displayed and is required.
- **Other Expenses:**
  - If the expense is not a supplier payment, the recipient name (`subjectName`) is required.

---

## 3. API Integration Details

The client communicates with the backend service using the following HTTP routes:

### 1. Create Receipt Payment
- **Endpoint:** `POST /api/v1/receipt-payments`
- **Request Body (CreateReceiptPaymentRequestDto):**
```typescript
interface CreateReceiptPaymentRequestDto {
  paymentDate: string;                    // ISO Date String or YYYY-MM-DD
  expenseType: ReceiptPaymentExpenseType; // Enum value
  expenseTypeName?: string;               // Required if expenseType = "other"
  paymentObject?: string;                 // Recipient name or supplier name
  amount: number;                         // Amount in VND
  paymentMethod: PaymentMethod;           // 1: CASH, 2: BANK_TRANSFER, 3: CREDIT_CARD
  notes?: string;                         // Additional note
  status?: ReceiptPaymentStatus;          // draft or paid. Default: draft
  supplierId?: string;                    // Required if expenseType = "supplier_payment"
  receiptImportIds?: string[];            // Required if supplier_payment and isDirectExport = false
  isDirectExport?: boolean;               // Default: false
}
```
- **Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "c1a6f3b0-13e2-45bb-b31c-6d9b9a6745f2"
  }
}
```

### 2. Update Receipt Payment
- **Endpoint:** `PUT /api/v1/receipt-payments/:id`
- **Request Body (UpdateReceiptPaymentRequestDto):** All fields are optional.
- **Response:**
```json
{
  "success": true,
  "statusCode": 200
}
```

### 3. Detail Info
- **Endpoint:** `GET /api/v1/receipt-payments/:id`
- **Response DTO:** Returns detailed record with populated linked receipt imports (`receiptImports` array).

### 4. Unpaid Receipt Imports
- **Endpoint:** `GET /api/v1/receipt-imports/unpaid?supplierId=<uuid>`
- **Response:** Returns a paginated list of unpaid receipt imports for the specified supplier.

### 5. Summary Info
- **Endpoint:** `GET /api/v1/receipt-payments/summary`
- **Query Filters:** Supports `paymentDate`, `startDate`, `endDate`, etc.
- **Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "totalCount": 10,
    "totalPaidAmount": 15000000.00,
    "totalPaidCount": 8,
    "totalDebtAmount": 2000000.00,
    "totalDebtCount": 2
  }
}
```

---

## 4. UI-to-API Mapping Strategy

Because the backend `GET /api/v1/receipt-payments` endpoint does not filter by `paymentMethod` or `isDirectExport`, the frontend client:
1. Queries the list using standard backend filters (`keyword`, `expenseType`, `status`, and date filters).
2. Performs secondary client-side post-filtering on the returned collection to match `paymentMethod` and `isDirectExport` advanced filter values.
3. Maps backend DTO values to the frontend model using `mapBackendToReceiptPayment` to decouple changes in the backend representation from the screen layouts.
