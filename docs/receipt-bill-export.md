# Receipt Bill Export (PDF / Excel / Image)

## Purpose

Allow users to export a Phieu Thu (collection receipt) as a downloadable/shareable PDF, Excel, or PNG image from the mobile app. Users can select which collection periods (dot thu) to include in the export.

## Data Source

All data comes from the existing `GET /receipt-debt/:id` API which returns:
- `receipt` — header info (code, customer, amounts, status)
- `items` — product line items grouped by period date (`Record<string, IProductItem[]>`)
- `periods` — VAT amounts per period (`Record<string, { id, vatAmount }>`)

No new backend API is required.

## User Flow

1. **Entry points** — "In phieu" button on:
   - Receipt debt detail (action sheet)
   - Receipt debt list (swipe action)
   - Period management (toolbar icon)
   - Update page (toolbar icon)
   - Create page shows "Vui long luu phieu truoc khi in" toast
2. **Select periods** — Modal with checkboxes for each date, select all by default
3. **Choose format** — PDF / Excel / Image (PNG)
4. **Export** — File is generated client-side and shared (native) or downloaded (web)

## Bill Layout

```
CUA HANG KIM SANG
Dia chi: DS-02 - 104 Yersin, Phuong Ben Thanh, TPHCM

          PHIEU THU TIEN
Khach hang   <customer name>
Ma phieu     <receipt code>

Ten San pham    So luong    Don gia    Thanh tien
Ngay 01/01/2025                        Tong ngay: xxx d
  Product A         1      10,000 d      10,000 d
  Product B         2      20,000 d      40,000 d
...

                             Tong:        635,000 d
                             Thue         Tong VAT
                             Tong phai tra
                             Da Thanh toan
                             Con Lai
```

### Calculation Rules

- **Quantity** = `item.quantity - item.returnedQuantity` (accounts for returns)
- **Unit price** = `item.costPrice`
- **Period total** = sum of (qty * unitPrice) for all items in period
- **Subtotal** = sum of all period totals
- **Total VAT** = sum of `vatAmount` for selected periods
- **Grand total** = Subtotal + Total VAT
- **Paid / Remaining** = from receipt header (not per-period)

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/helpers/storeBillHeader.ts` | Store name/address lookup by storeCode |
| `src/helpers/receiptBill.ts` | Build bill data model from API response |
| `src/helpers/shareFile.ts` | Native share (Capacitor) or web download |
| `src/hooks/useExportReceiptBill.ts` | Export logic: html-to-image, jsPDF, xlsx |
| `src/pages/.../ExportReceiptBill/ReceiptBillDocument.tsx` | HTML bill template (off-screen) |
| `src/pages/.../ExportReceiptBill/ExportReceiptBillModal.tsx` | Period selection + format picker modal |

### Dependencies Added

- `html-to-image` — DOM to PNG capture
- `jspdf` — PDF generation from image (multi-page support)
- `xlsx` — Excel workbook generation
- `@capacitor/share@7.0.1` — Native share sheet
- `@capacitor/filesystem@7.0.1` — Write temp files for sharing

### Export Formats

- **Image (PNG)**: Captures the off-screen bill DOM at 2x pixel ratio
- **PDF**: Renders PNG then places it on A4 pages (auto-splits if too tall)
- **Excel**: Structured spreadsheet with header, grouped items, and summary rows

## Edge Cases

- **No periods selected**: Export button is disabled, validation message shown
- **Cancelled receipt**: Export still works (shows historical data)
- **Returned items**: Quantity is reduced by `returnedQuantity`; items with 0 remaining qty are excluded
- **Long bills**: PDF auto-paginates across multiple A4 pages
- **No VAT**: VAT row shows `0 d`
- **Web/PWA**: Falls back to blob download since native Share is unavailable
- **Multiple stores**: Header adapts based on `user.storeCode` (KS/KH)
