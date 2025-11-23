# Receipt Constants Refactoring Guide

## Overview

The receipt constants have been separated from a single monolithic file (`receipt.ts`) into type-specific files for better organization, maintainability, and type safety.

## New File Structure

### 1. **receipt-import.constant.ts**
Contains constants, types, and status functions for import receipts:
- `RECEIPT_IMPORT_STATUS` - Status enum for import receipts
- `TReceiptImportStatus` - TypeScript type for import status
- `getStatusColor(status)` - Get Ionic color for import receipt status
- `getStatusLabel(status)` - Get Vietnamese label for import receipt status

### 2. **receipt-return.constant.ts**
Contains constants, types, and status functions for return receipts:
- `RECEIPT_RETURN_STATUS` - Status enum for return receipts
- `TReceiptReturnStatus` - TypeScript type for return status
- `getStatusColor(status)` - Get Ionic color for return receipt status
- `getStatusLabel(status)` - Get Vietnamese label for return receipt status

### 3. **receipt-check.constant.ts**
Contains constants, types, and status functions for check receipts:
- `RECEIPT_CHECK_STATUS` - Status enum for check receipts
- `TReceiptCheckStatus` - TypeScript type for check status
- `RECEIPT_CHECK_REASONS` - Array of reason options for check receipts
- `getStatusColor(status)` - Get Ionic color for check receipt status
- `getStatusLabel(status)` - Get Vietnamese label for check receipt status

### 4. **receipt-debt.constant.ts**
Contains constants, types, and status functions for debt receipts:
- `RECEIPT_DEBT_STATUS` - Status enum for debt receipts
- `TReceiptDebtStatus` - TypeScript type for debt status
- `getStatusColor(status)` - Get Ionic color for debt receipt status
- `getStatusLabel(status)` - Get Vietnamese label for debt receipt status

### 5. **receipt-status-helper.ts** (NEW)
Unified helper for components that handle multiple receipt types:
- `ReceiptStatus` - Union type of all receipt status types
- `getStatusColor(status)` - Unified status color function that handles all receipt types
- `getStatusLabel(status)` - Unified status label function that handles all receipt types

### 6. **receipt.ts** (DEPRECATED)
The original file is now deprecated but maintained for backward compatibility. It re-exports all constants and types from the new type-specific files.

## Migration Guide

### For Single Receipt Type Components

If your component only works with **one** receipt type, import from the specific constant file:

```typescript
// ✅ RECOMMENDED - Import receipts
import {
  RECEIPT_IMPORT_STATUS,
  TReceiptImportStatus,
  getStatusColor,
  getStatusLabel
} from '@/common/constants/receipt-import.constant';

// ✅ RECOMMENDED - Return receipts
import {
  RECEIPT_RETURN_STATUS,
  TReceiptReturnStatus,
  getStatusColor,
  getStatusLabel
} from '@/common/constants/receipt-return.constant';

// ✅ RECOMMENDED - Check receipts
import {
  RECEIPT_CHECK_STATUS,
  TReceiptCheckStatus,
  RECEIPT_CHECK_REASONS,
  getStatusColor,
  getStatusLabel
} from '@/common/constants/receipt-check.constant';

// ✅ RECOMMENDED - Debt receipts
import {
  RECEIPT_DEBT_STATUS,
  TReceiptDebtStatus,
  getStatusColor,
  getStatusLabel
} from '@/common/constants/receipt-debt.constant';
```

### For Multi-Type Receipt Components

If your component handles **multiple** receipt types (e.g., inventory history showing import, return, and check receipts):

```typescript
// ✅ RECOMMENDED - Use the unified helper
import {
  ReceiptStatus,
  getStatusColor,
  getStatusLabel
} from '@/common/constants/receipt-status-helper';

// The helper automatically detects the receipt type and returns the correct color/label
```

### Old Approach (Deprecated)

```typescript
// ❌ DEPRECATED - Will be removed in future version
import {
  RECEIPT_IMPORT_STATUS,
  getStatusColor,
  getStatusLabel,
  ReceiptStatus
} from '@/common/constants/receipt';
```

## Benefits of This Refactoring

1. **Better Organization**: Each receipt type has its own dedicated file
2. **Type Safety**: Type-specific functions prevent mixing incompatible status types
3. **Maintainability**: Easier to locate and update status logic for specific receipt types
4. **Tree Shaking**: Bundlers can better optimize imports (only import what you need)
5. **Code Clarity**: Clear separation of concerns makes code easier to understand
6. **Scalability**: Easy to add new receipt types without modifying existing files

## Updated Files

### Components Updated (12 files)
1. `/src/pages/Inventory/components/ReceiptCheck/ReceiptCheckList.tsx`
2. `/src/pages/Inventory/components/ReceiptCheck/components/ItemList.tsx`
3. `/src/pages/Inventory/components/ReceiptImport/components/ItemList.tsx`
4. `/src/pages/Order/ReceiptDebtList/index.tsx`
5. `/src/pages/Order/ReceiptDebtList/components/FilterModal.tsx`
6. `/src/pages/Order/ReceiptDebtList/components/ReceiptDebtItem.tsx`
7. `/src/pages/Product/ProductDetail/components/InventoryHistory.tsx`
8. `/src/pages/Receipt/ReceiptCheck/ReceiptCheckDetail/index.tsx`
9. `/src/pages/Receipt/ReceiptImport/ReceiptImportDetail/index.tsx`
10. `/src/pages/Receipt/ReceiptDebt/ReceiptDebtDetail/index.tsx`
11. `/src/pages/Receipt/ReceiptDebt/ReceiptDebtPeriod/index.tsx`
12. `/src/pages/Receipt/ReceiptDebt/ReceiptDebtUpdate/index.tsx`

### New Constant Files Created (4 files)
1. `/src/common/constants/receipt-import.constant.ts`
2. `/src/common/constants/receipt-return.constant.ts`
3. `/src/common/constants/receipt-check.constant.ts`
4. `/src/common/constants/receipt-status-helper.ts`

Note: `receipt-debt.constant.ts` was already created previously.

## Breaking Changes

⚠️ **None** - The old `receipt.ts` file still exists and re-exports everything for backward compatibility.

However, components should be migrated to use the new type-specific imports for better type safety.

## Future Cleanup

In a future major version update, the `receipt.ts` file will be removed. All components should migrate to the new imports before that time.

## Testing

All imports have been updated and verified with:
- ✅ No TypeScript compilation errors
- ✅ All type checks passing
- ✅ Import paths correctly resolved
- ✅ Backward compatibility maintained

## Questions?

If you have questions about this refactoring or need help migrating your code, please refer to this guide or consult with the development team.
