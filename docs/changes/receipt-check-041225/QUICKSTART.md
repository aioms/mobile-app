# Receipt Check Create Page - Quick Start Guide

## 📁 Files Created

1. **Main Component**
   - Path: `src/pages/Receipt/ReceiptCheck/ReceiptCheckCreate/index.tsx`
   - Size: ~16.4 KB
   - Purpose: Main page component for creating receipt checks

2. **Item Component**
   - Path:
     `src/pages/Receipt/ReceiptCheck/ReceiptCheckCreate/components/ReceiptCheckItem.tsx`
   - Size: ~4.2 KB
   - Purpose: Individual product item display with inventory tracking

3. **Documentation**
   - Path: `src/pages/Receipt/ReceiptCheck/ReceiptCheckCreate/README.md`
   - Purpose: Comprehensive implementation documentation

## ✅ Implementation Checklist

### UI Implementation

- ✅ Responsive layout matching design specification
- ✅ Clean, user-friendly interface
- ✅ Proper spacing and typography
- ✅ Ionic components integration

### Product Selection

- ✅ Modal integration with `ModalSelectProduct`
- ✅ Search functionality (via modal)
- ✅ Product display with name, code, inventory, price
- ✅ Selection with visual feedback
- ✅ Duplicate prevention

### User Data

- ✅ `useUser` hook integration
- ✅ Check staff list retrieval
- ✅ Loading states
- ✅ Error handling

### Store Selection

- ✅ Dropdown with 2 options: "Store KS" and "Store KH"
- ✅ Accessible implementation
- ✅ Change handlers

### Product List Display

- ✅ Table format with columns:
  - Product name/code
  - System inventory (Tồn kho)
  - Actual inventory (Thực tế)
  - Difference (Chênh lệch)
- ✅ Color-coded differences
- ✅ Row-level actions (remove)
- ✅ Real-time calculation

### Validation

- ✅ Required field validation
- ✅ Clear error messages
- ✅ Toast notifications

### State Management

- ✅ Form input state handling
- ✅ Product list state
- ✅ Error state
- ✅ Loading state

## 🎨 Design Features

### Color Coding

- **Yellow background**: Positive difference (surplus inventory)
- **Red background**: Negative difference (shortage)
- **Gray background**: No difference

### Layout Structure

```
┌─────────────────────────────┐
│  Header: "Mã phiếu kiểm"   │
├─────────────────────────────┤
│  📅 Check Date              │
│  🔍 Search Products         │
├─────────────────────────────┤
│  Product List (if any)      │
│  ┌─────────────────────┐   │
│  │ Product 1           │   │
│  │ Tồn | Thực | Chênh  │   │
│  └─────────────────────┘   │
├─────────────────────────────┤
│  👤 Check Staff             │
│  🏪 Warehouse               │
│  📝 Note (optional)         │
├─────────────────────────────┤
│  Footer: Total Difference   │
│  [Create Receipt Button]    │
└─────────────────────────────┘
```

## 🔧 How to Use

### For Users

1. **Select Check Date**: Tap the date field to choose when the check was
   performed
2. **Add Products**:
   - Tap the search bar
   - Search for products in the modal
   - Select products to add to the list
3. **Enter Actual Inventory**: For each product, enter the physical count in the
   "Thực tế" field
4. **Review Differences**: Check the color-coded differences
5. **Select Check Staff**: Choose who performed the inventory check
6. **Select Warehouse**: Choose "Store KS" or "Store KH"
7. **Add Notes** (optional): Enter any additional comments
8. **Submit**: Tap "Tạo phiếu" to create the receipt check

### For Developers

#### To Test the Page

```bash
# Navigate to the page in your app
# Route: /receipt/check/create (adjust based on your routing)
```

#### To Modify

```typescript
// Main component
import ReceiptCheckCreate from "@/pages/Receipt/ReceiptCheck/ReceiptCheckCreate";

// Item component
import ReceiptCheckItem from "@/pages/Receipt/ReceiptCheck/ReceiptCheckCreate/components/ReceiptCheckItem";
```

## 🔌 API Integration (TODO)

The page is ready for API integration. You need to:

1. **Create API Hook**

```typescript
// src/hooks/apis/useReceiptCheck.ts
const useReceiptCheck = () => {
    const create = async (data: any) => {
        const response = await request.post("/receipt-checks", data);
        return response.data;
    };

    return { create };
};
```

2. **Update Main Component**

```typescript
// In ReceiptCheckCreate/index.tsx
import useReceiptCheck from "@/hooks/apis/useReceiptCheck";

// In component
const { create: createReceiptCheck } = useReceiptCheck();

// In handleSubmit
const result = await createReceiptCheck(newFormData);
```

## 📊 Data Structure

### Form Data

```typescript
{
  checkDate: string,        // ISO datetime
  checkStaff: string,       // User ID
  warehouse: string,        // "Store KS" | "Store KH"
  note: string,            // Optional notes
  totalDifference: number, // Calculated total
  totalProduct: number,    // Count of products
  items: [
    {
      productId: string,
      productCode: string,
      productName: string,
      systemInventory: number,
      actualInventory: number,
      difference: number
    }
  ],
  status: "draft" | "processing"
}
```

## 🐛 Known Issues / Limitations

1. **API Integration**: Not yet connected to backend
2. **Navigation**: Return navigation commented out (uncomment when ready)
3. **Sorting**: Product list sorting not yet implemented
4. **Filtering**: No filtering within selected products
5. **Images**: Product images not displayed

## 🚀 Future Enhancements

- [ ] Add barcode scanning
- [ ] Implement sorting and filtering
- [ ] Add product images
- [ ] Export to PDF/Excel
- [ ] Print functionality
- [ ] Batch product import
- [ ] Approval workflow
- [ ] Audit trail/history

## 📝 Notes

- All text is in Vietnamese as per design requirements
- Uses Ionic React components for consistency
- Follows existing codebase patterns
- Responsive design for mobile-first approach
- Proper TypeScript typing throughout

## 🆘 Troubleshooting

### Products not appearing after selection

- Check that `ModalSelectProduct` is returning data correctly
- Verify the modal's `onWillDismiss` event handler

### Staff dropdown is empty

- Check network connection
- Verify `useUser` hook is working
- Check console for API errors

### Validation not working

- Ensure all required fields have values
- Check that at least one product is added
- Review error state in React DevTools

### Differences not calculating

- Verify `actualInventory` input is accepting numbers
- Check `useEffect` in `ReceiptCheckItem` component
- Ensure `onRowChange` callback is firing

## 📞 Support

For questions or issues, refer to:

- Main documentation: `README.md` in the same directory
- Existing receipt pages: `src/pages/Receipt/ReceiptImport/ReceiptImportCreate`
- Component library: Ionic React documentation
