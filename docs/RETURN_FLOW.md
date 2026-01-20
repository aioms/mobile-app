# Return Flow Documentation

This document outlines the return flow processes for both Orders and Receipt
Debts within the AIOM mobile application.

## Overview

The return functionality allows users to create return receipts ("Phiếu trả
hàng") from existing Orders or Debt Receipts. This process involves selecting
items to return, specifying quantities, and choosing a refund method (if
applicable).

## 1. Order Return Flow

### Trigger Point

- **Location**: `src/pages/Order/OrderDetail/index.tsx`
- **Action**: User selects "Trả hàng" (Return) from the action sheet menu.

### Data Flow

When the return action is triggered, the app navigates to the `ReceiptReturn`
page with the following state:

- `refId`: ID of the Order.
- `refType`: `"order"`.
- `customerId`: ID of the customer associated with the order.
- `customerName`: Name of the customer.
- `orderProducts`: List of products from the order.

### Logic

1. **Navigation**: The `ReceiptReturn` page is initialized with the order data.
2. **Product Selection**: Users select products to return via
   `ModalSelectReturnProduct`.
3. **Creation**: A new return receipt is created linked to the original order.

---

## 2. Receipt Debt Return Flow

### Trigger Point

- **Location**: `src/pages/Receipt/ReceiptDebt/ReceiptDebtDetail/index.tsx`
- **Action**: User selects "Trả hàng" (Return) from the action sheet menu.

### Data Processing (Key Logic)

Before navigating to the creation page, the app processes the debt receipt
items:

1. **Flattening**: Items in a Debt Receipt are grouped by period (date). These
   are flattened into a single list.
2. **Returnable Quantity Calculation**: To support multiple return installments,
   the system calculates the quantity available for return:
   ```typescript
   returnableQty = quantity - (returnedQuantity || 0);
   ```
3. **Filtering**: Items with `returnableQty <= 0` (fully returned) are excluded
   from the list passed to the return page.

### Data Flow

Navigation to `ReceiptReturn` occurs with:

- `refId`: ID of the Receipt Debt.
- `refType`: `"debt"`.
- `customerId`: ID of the customer (extracted from `receipt.customer.id`).
- `customerName`: Name of the customer.
- `orderProducts`: The processed list of items with calculated `returnableQty`.

### Handling Returned Items in Debt Details

The Debt Receipt views have been updated to reflect return status:

- **Visual Badges**: Items that have been partially or fully returned display a
  "Đã trả: X" badge in the Detail view (`ReceiptDebtDetail`).
- **Editing Restrictions**:
  - In `ReceiptDebtUpdate`, items with any returned quantity cannot be edited.
  - In `ReceiptDebtPeriod`, quantity/price changes are blocked for returned
    items.
  - An explicit message "Không thể chỉnh sửa - sản phẩm đã trả hàng" is shown.
- **Payment Calculation**: Returned quantities are excluded from the total
  amount calculation during payment settlement logic `useReceiptCalculations`.

---

## 3. Receipt Return Page (`ReceiptReturn`)

**Location**: `src/pages/Receipt/ReceiptReturn/index.tsx`

This shared page handles the creation of the return slip for both flows.

### Features

1. **Initialization**:
   - Reads `refType` ("order" or "debt") from router state.
   - Pre-fills customer information.
   - Initializes the product selection modal with the passed `orderProducts`.

2. **Product Selection (`ModalSelectReturnProduct`)**:
   - Displays the list of returnable items.
   - Shows the "Quantity can return" (calculated previously).
   - If an item has been partially returned, it displays `(Đã trả: X)` for
     context.

3. **Payment Method**:
   - Users can select the refund method:
     - **Cash (Tiền mặt)**
     - **Bank Transfer (Chuyển khoản)**
   - This creates a `paymentMethod` field in the submission data.

4. **Submission**:
   - Validates the form.
   - Sends a request to `POST /receipt-return` with the payload including
     `refId`, `refType`, items, and payment details.
