# AGENTS.md - AIOM Mobile Application Architecture

> Comprehensive system documentation for AI agents and developers

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Core Features](#core-features)
- [Design Patterns](#design-patterns)
- [API Integration](#api-integration)
- [Type System](#type-system)
- [Development Guidelines](#development-guidelines)
- [Key Components Reference](#key-components-reference)
- [Troubleshooting](#troubleshooting)

---

## System Overview

**AIOM (All-In-One System) Mobile** is a comprehensive cross-platform inventory and order management system built as a Progressive Web App with native mobile capabilities.

### Purpose

A mobile-first business management solution enabling:
- Real-time product and inventory tracking
- Customer order processing with VAT support
- Multi-type receipt management (import, check, debt)
- Barcode scanning for quick product lookup
- Supplier relationship management
- Financial reporting and analytics

### Application Type

- Progressive Web App (PWA)
- Native iOS/Android via Capacitor
- Offline-capable with local storage
- RESTful API integration

### Target Platforms

- iOS 13+
- Android 8.0+
- Modern web browsers (Chrome, Safari, Firefox, Edge)

---

## Technology Stack

### Core Framework

```yaml
Frontend:
  - React: 18.2 (Functional components, hooks)
  - TypeScript: 5.1 (Strict mode)
  - Ionic Framework: 8.6 (UI components)
  - React Router: 5.3 (Navigation)

Mobile Bridge:
  - Capacitor: 7.0 (Native API access)

Build Tools:
  - Vite: 5.2 (Bundler, dev server)
  - PostCSS: (CSS processing)
  - Autoprefixer: (Browser compatibility)

Styling:
  - TailwindCSS: 3.4 (Utility-first CSS)
  - Ionic CSS Variables: (Theme customization)
```

### State Management

**Pattern**: Local state + Custom hooks (No Redux/MobX)

```typescript
// State hierarchy:
1. Component state (useState, useReducer)
2. Custom hooks for shared logic
3. Ionic Storage for persistence
4. API hooks for server state
```

### Key Libraries

```yaml
HTTP & Data:
  - axios: HTTP client with interceptors
  - react-hook-form: Form validation
  - dayjs: Date manipulation

Native Capabilities:
  - @capacitor/camera: Photo capture
  - @capacitor-mlkit/barcode-scanning: Barcode/QR scanning
  - @capacitor/toast: Native notifications
  - @capacitor/push-notifications: Push notifications
  - @capacitor/haptics: Tactile feedback

UI & Media:
  - swiper: Carousels/sliders
  - lucide-react: Icon library
  - browser-image-compression: Image optimization

Utilities:
  - vietqr: Vietnamese QR payment
  - posthog-js: Analytics & error tracking
```

---

## Project Architecture

### Directory Structure

```
mobile-app/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Counter/            # Quantity input with +/- buttons
│   │   ├── DatePicker/         # Date selection component
│   │   ├── EmptyPage/          # Empty state placeholder
│   │   ├── ErrorMessage/       # Error display component
│   │   ├── FallbackError/      # Error boundary fallback
│   │   ├── ImagePreview/       # Image carousel viewer
│   │   ├── Layout/             # Page layout wrapper
│   │   ├── Loading/            # Loading spinner
│   │   ├── MenuBar/            # Top menu navigation
│   │   ├── Modal/              # Base modal wrapper
│   │   ├── ModalSelectCategory/    # Category picker modal
│   │   ├── ModalSelectCustomer/    # Customer picker modal
│   │   ├── ModalSelectProduct/     # Product picker modal
│   │   ├── ModalSelectSupplier/    # Supplier picker modal
│   │   ├── PaymentModal/           # Payment QR modal
│   │   ├── Refresher/              # Pull-to-refresh component
│   │   ├── TabBar/                 # Bottom tab navigation
│   │   └── Toast/                  # Toast notification system
│   │
│   ├── pages/                  # Application pages
│   │   ├── Auth/
│   │   │   └── Login/          # Authentication page
│   │   ├── Error/
│   │   │   └── NotFound/       # 404 error page
│   │   ├── Home/               # Dashboard with statistics
│   │   ├── Inventory/          # Inventory overview
│   │   ├── Order/
│   │   │   ├── OrderCreate/    # Create new order
│   │   │   ├── OrderDetail/    # View order details
│   │   │   ├── OrderList/      # Browse orders
│   │   │   ├── OrderUpdate/    # Edit existing order
│   │   │   └── ReceiptDebtList/    # Outstanding debts
│   │   ├── Product/
│   │   │   ├── ProductCreate/  # Add new product
│   │   │   ├── ProductDetail/  # View/edit product
│   │   │   └── ProductList/    # Browse products
│   │   ├── Receipt/
│   │   │   ├── ReceiptCheck/   # Stock checking receipts
│   │   │   ├── ReceiptDebt/    # Debt/payment receipts
│   │   │   └── ReceiptImport/  # Import receipts
│   │   └── Transaction/        # Transaction history
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── apis/              # API integration hooks
│   │   │   ├── useAggregate.ts       # Dashboard statistics
│   │   │   ├── useCustomer.ts        # Customer CRUD
│   │   │   ├── useInventory.ts       # Inventory operations
│   │   │   ├── useOrder.ts           # Order CRUD
│   │   │   ├── useProduct.ts         # Product CRUD
│   │   │   ├── useReceiptCheck.ts    # Stock check receipts
│   │   │   ├── useReceiptDebt.ts     # Debt receipts
│   │   │   ├── useReceiptImport.ts   # Import receipts
│   │   │   ├── useReceiptItem.ts     # Receipt items
│   │   │   ├── useSupplier.ts        # Supplier CRUD
│   │   │   └── useUser.ts            # User management
│   │   ├── useAuth.ts         # Authentication logic
│   │   ├── useBarcodeScanner.ts  # Barcode scanning
│   │   ├── useCamera.ts       # Camera functionality
│   │   ├── useLoading.ts      # Loading state management
│   │   ├── useStorage.ts      # Local storage abstraction
│   │   └── useUploadFile.ts   # File upload handling
│   │
│   ├── helpers/               # Utility functions
│   │   ├── axios.ts          # HTTP client configuration
│   │   ├── common.ts         # Common utilities
│   │   ├── date.ts           # Date utilities
│   │   ├── debounce.ts       # Debounce utility
│   │   ├── fileHelper.ts     # File operations
│   │   ├── formatters.ts     # Currency, date formatting
│   │   ├── paymentHelpers.ts # Payment utilities
│   │   ├── posthogHelper.ts  # Analytics helpers
│   │   └── printerService.ts # Print functionality
│   │
│   ├── types/                # TypeScript definitions
│   │   ├── index.d.ts       # Global type definitions
│   │   ├── order.type.ts    # Order-related types
│   │   ├── product.type.ts  # Product-related types
│   │   ├── receipt.type.ts  # Receipt-related types
│   │   ├── payment.type.ts  # Payment-related types
│   │   └── transaction.type.ts  # Transaction types
│   │
│   ├── common/
│   │   ├── constants/       # Application constants
│   │   └── enums/          # Enumerations
│   │
│   ├── services/           # Service layer
│   │   └── localNetworkService.ts  # Network utilities
│   │
│   ├── routes/             # Routing configuration
│   │   ├── index.tsx       # Route definitions
│   │   ├── PrivateRoute.tsx    # Protected route wrapper
│   │   └── PublicRoute.tsx     # Public route wrapper
│   │
│   ├── theme/              # Styling
│   │   ├── variables.css   # Ionic CSS variables
│   │   ├── tailwind.css    # TailwindCSS imports
│   │   └── common.css      # Common styles
│   │
│   ├── App.tsx             # Root application component
│   └── main.tsx            # Application entry point
│
├── public/                 # Static assets
├── capacitor.config.ts    # Capacitor configuration
├── vite.config.ts         # Vite build configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # TailwindCSS configuration
├── package.json           # Dependencies and scripts
├── CLAUDE.md              # Development guidelines
├── AGENTS.md              # This file
└── README.md              # Project documentation
```

### Application Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Entry Point (main.tsx)              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              PostHog Error Boundary (App.tsx)           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  React Router (routes/)                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Public Routes: /login, /auth/login              │  │
│  │  Private Routes: /tabs/* (authenticated only)    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Layout Component (components/Layout)        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  MenuBar (top navigation)                         │  │
│  │  Page Content                                     │  │
│  │  TabBar (bottom navigation)                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Page Components                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │  API Hooks → HTTP Request → Backend API          │  │
│  │  Custom Hooks → Local Logic                      │  │
│  │  Storage → Ionic Storage + SQLite                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. Authentication & Authorization

**Location**: `/src/pages/Auth/`, `/src/hooks/useAuth.ts`

**Capabilities**:
- JWT-based authentication
- Role-based access control (ADMIN, MANAGER, EMPLOYEE, DEVELOPER)
- Persistent sessions via Ionic Storage
- Auto-redirect on auth state changes
- Token refresh handling

**Implementation Example**:

```typescript
// useAuth hook provides:
const {
  login,           // (username, password) => Promise<void>
  logout,          // () => Promise<void>
  isAuthenticated, // boolean
  user,            // User | null
  isLoading,       // boolean
  getToken,        // () => Promise<string | null>
  isSessionValid   // () => Promise<boolean>
} = useAuth();

// Usage in component:
const handleLogin = async () => {
  await login(username, password);
  // Auto-redirects to /tabs/home on success
};
```

**Protected Routes**:
```typescript
// PrivateRoute component checks auth before rendering
<PrivateRoute exact path="/tabs/home" component={Home} />

// PublicRoute redirects authenticated users
<PublicRoute exact path="/login" component={Login} />
```

**Authorization Levels**:
```typescript
enum UserRole {
  ADMIN = 'ADMIN',           // Full access
  MANAGER = 'MANAGER',       // Management access
  EMPLOYEE = 'EMPLOYEE',     // Limited access
  DEVELOPER = 'DEVELOPER'    // Dev/testing access
}
```

---

### 2. Product Management

**Location**: `/src/pages/Product/`

**Capabilities**:
- Create, read, update, delete products
- Multi-image upload with compression
- Barcode generation and scanning
- Category assignment
- Multiple suppliers with different cost prices
- Inventory level tracking
- Low stock alerts
- Product history/audit log

**Data Model**:

```typescript
interface IProduct {
  id: string;
  code: string;              // System code
  productCode: number;       // Display code
  productName: string;
  costPrice: number;         // Base cost price
  sellingPrice: number;
  status: string;            // active, inactive
  category: string;
  inventory: number;         // Current stock level
  unit: string;              // Unit of measure (e.g., 'piece', 'kg')
  description: string;
  images?: Array<{
    id: string;
    path: string;
  }>;
  suppliers: Array<{
    id: string;
    name: string;
    costPrice: number;       // Supplier-specific cost
  }>;
}
```

**API Operations** (`useProduct` hook):

```typescript
const {
  getList,                   // (filters, page, limit) => Promise<IProduct[]>
  getDetail,                 // (id) => Promise<IProduct>
  create,                    // (data) => Promise<IProduct>
  update,                    // (id, data) => Promise<IProduct>
  remove,                    // (id) => Promise<void>
  getTotalProductAndInventory, // () => Promise<{ total, inventory }>
  getCategories,             // () => Promise<string[]>
  getHistory                 // () => Promise<HistoryItem[]>
} = useProduct();
```

**Key Components**:

- **ProductList** (`/tabs/products`): Grid view with filters, search, categories
- **ProductCreate** (`/tabs/products/create`): Multi-step creation flow
- **ProductDetail** (`/tabs/products/detail/:id`): View/edit with image carousel
- **ProductCard**: Reusable card component with image, price, stock

**Image Handling**:

```typescript
// Image compression before upload
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
};
const compressedFile = await imageCompression(file, options);
```

---

### 3. Order Management

**Location**: `/src/pages/Order/`

**Capabilities**:
- Customer order creation and editing
- Multiple order items with quantity/price
- Discounts (fixed amount or percentage)
- VAT invoice support with company details
- Multiple payment methods
- Order status workflow
- Order history with filtering
- Receipt printing

**Data Model**:

```typescript
interface IOrder {
  id: string;
  code: string;              // Order number
  customer: ICustomer | null;
  paymentMethod: string;     // CASH, BANK_TRANSFER, CREDIT_CARD
  totalAmount: number;
  discountAmount: number;
  status: string;            // DRAFT, PENDING, COMPLETED, CANCELLED
  note: string;
  vatInfo: IVatInfo;         // VAT invoice details
  items: IOrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface IOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;             // Selling price at time of order
  totalPrice: number;        // quantity * price
}

interface IVatInfo {
  companyName: string;
  taxCode: string;
  address: string;
  email: string;
}
```

**Order Workflow**:

```
DRAFT → PENDING → COMPLETED
  ↓         ↓
CANCELLED ←─┘
```

**API Operations** (`useOrder` hook):

```typescript
const {
  getList,                   // (filters, page, limit) => Promise<IOrder[]>
  getDetail,                 // (id) => Promise<IOrder>
  create,                    // (data) => Promise<IOrder>
  update,                    // (id, data) => Promise<IOrder>
  getTotalOrderByDateRange   // (params) => Promise<{ total, count }>
} = useOrder();
```

**Key Components**:

- **OrderCreate** (`/tabs/orders/create`): Multi-item order form
- **OrderUpdate** (`/tabs/orders/update/:id`): Edit existing order
- **OrderDetail** (`/tabs/orders/detail/:id`): View with all details
- **OrderList** (`/tabs/orders`): Filterable list with search
- **ReceiptDebtList** (`/tabs/orders/receipt-debt`): Outstanding debts

**Discount Calculation**:

```typescript
enum DiscountType {
  FIXED = 'FIXED',           // Fixed amount (e.g., 10,000 VND)
  PERCENTAGE = 'PERCENTAGE'  // Percentage (e.g., 10%)
}

// Calculation:
const finalAmount = totalAmount - (
  discountType === 'FIXED'
    ? discountAmount
    : (totalAmount * discountAmount / 100)
);
```

---

### 4. Inventory Management

**Location**: `/src/pages/Inventory/`, `/src/pages/Receipt/`

The system uses three receipt types to manage inventory:

#### A. Receipt Import (Nhập hàng)

**Purpose**: Record incoming inventory from suppliers

**Status Flow**:
```
DRAFT → PROCESSING → WAITING → COMPLETED
  ↓         ↓          ↓
CANCELLED ←─┴──────────┴─→ SHORT_RECEIVED / OVER_RECEIVED
```

**Data Model**:

```typescript
interface IReceiptImport {
  id: string;
  code: string;
  supplierId: string;
  status: ReceiptImportStatus;
  totalAmount: number;
  note: string;
  items: IReceiptItem[];
  createdAt: string;
}

interface IReceiptItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  totalPrice: number;
}
```

**Features**:
- Quick import with barcode scanning
- Bulk product import
- Cost price tracking per supplier
- Discrepancy handling (short/over received)

#### B. Receipt Check (Kiểm kho)

**Purpose**: Inventory auditing and stock taking

**Status Flow**:
```
PENDING → PROCESSING → BALANCING_REQUIRED → BALANCED
```

**Data Model**:

```typescript
interface IReceiptCheck {
  id: string;
  code: string;
  status: ReceiptCheckStatus;
  systemInventory: number;   // System count
  actualInventory: number;   // Physical count
  difference: number;        // actualInventory - systemInventory
  reason: string;            // EXPIRY, DAMAGE, THEFT, ERROR, etc.
  note: string;
  items: IReceiptCheckItem[];
  createdAt: string;
}

interface IReceiptCheckItem {
  productId: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
}
```

**Features**:
- Compare system vs physical inventory
- Balance discrepancies
- Track adjustment reasons
- Audit trail

#### C. Receipt Debt (Công nợ)

**Purpose**: Track supplier debts and payment installments

**Data Model**:

```typescript
interface IReceiptDebt {
  id: string;
  code: string;
  supplierId: string;
  totalDebt: number;
  paidAmount: number;
  remainingDebt: number;
  status: string;            // PENDING, PARTIAL_PAID, PAID, CANCELLED
  note: string;
  periods: IDebtPeriod[];    // Payment installments
  createdAt: string;
}

interface IDebtPeriod {
  id: string;
  periodNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;            // PENDING, PAID, OVERDUE
}
```

**Features**:
- Payment installment tracking
- QR code payment integration (VietQR)
- Payment history
- Overdue tracking
- Cancel with notes

**API Operations** (hooks):

```typescript
// useReceiptImport
const { getList, getDetail, create, update, updateStatus } = useReceiptImport();

// useReceiptCheck
const { getList, getDetail, create, balance } = useReceiptCheck();

// useReceiptDebt
const { getList, getDetail, create, addPayment, cancel } = useReceiptDebt();
```

---

### 5. Barcode Scanning

**Location**: `/src/hooks/useBarcodeScanner.ts`

**Capabilities**:
- Native scanning via ML Kit (iOS/Android)
- Web scanning via BarcodeDetector API + polyfill
- Multiple format support
- Torch/flashlight control
- Zoom capability
- Duplicate detection with throttling
- Haptic feedback on scan

**Supported Formats**:

```typescript
const SUPPORTED_FORMATS = [
  'Code128',
  'QrCode',
  'Ean13',
  'Code39',
  'DataMatrix',
  'Pdf417'
];
```

**Usage Example**:

```typescript
const {
  startScanning,     // (onScan, onError) => Promise<void>
  stopScanning,      // () => Promise<void>
  isScanning,        // boolean
  toggleTorch,       // () => Promise<void>
  isTorchAvailable   // boolean
} = useBarcodeScanner();

// In component:
const handleScan = async () => {
  await startScanning(
    (barcode) => {
      console.log('Scanned:', barcode);
      // Look up product by barcode
    },
    (error) => {
      console.error('Scan error:', error);
    }
  );
};
```

**Platform Detection**:

```typescript
// Native (iOS/Android)
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

// Web (PWA)
import { BarcodeDetectorPolyfill } from '@undecaf/barcode-detector-polyfill';
```

---

### 6. Camera & Image Management

**Location**: `/src/hooks/useCamera.ts`, `/src/components/ImagePreview/`

**Capabilities**:
- Native camera capture (iOS/Android)
- PWA camera stream (web)
- Gallery selection
- Image compression
- Multiple image upload
- Image preview carousel
- Front/rear camera switching
- Flash/torch control
- Zoom support

**Usage Example**:

```typescript
const {
  captureImage,      // (options) => Promise<string>  // Returns data URL
  selectFromGallery, // () => Promise<string>
  openCamera,        // () => Promise<void>
  closeCamera,       // () => Promise<void>
  isCameraOpen       // boolean
} = useCamera();

// Capture image
const imageDataUrl = await captureImage({
  quality: 90,
  resultType: 'dataUrl',
  source: 'camera'
});

// Compress before upload
const compressed = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920
});
```

**Image Preview Component**:

```typescript
import { ImagePreview } from '@/components/ImagePreview';

<ImagePreview
  images={[
    { id: '1', path: 'https://...' },
    { id: '2', path: 'data:image/jpeg;base64,...' }
  ]}
  initialIndex={0}
  onClose={() => setShowPreview(false)}
/>
```

---

### 7. Dashboard & Analytics

**Location**: `/src/pages/Home/`

**Displayed Metrics**:

```typescript
interface DashboardMetrics {
  dailyRevenue: number;      // Today's revenue
  totalOrders: number;       // Total order count
  pendingOrders: number;     // Orders awaiting processing
  totalProducts: number;     // Product count
  inventoryCount: number;    // Total inventory quantity
  importTotal: number;       // Total import value
  profit: number;            // Revenue - Cost
}
```

**Components**:

- **StatisticCards**: Key metrics display
- **QuickActions**: Shortcuts to common tasks (Create Order, Add Product, etc.)
- **RecentActivities**: Activity feed
- **ImportantUpdates**: Alerts and notifications

**API Integration** (`useAggregate` hook):

```typescript
const {
  getDailyRevenue,           // () => Promise<number>
  getOrderStatistics,        // () => Promise<OrderStats>
  getProductStatistics       // () => Promise<ProductStats>
} = useAggregate();
```

---

### 8. Payment Integration

**Location**: `/src/components/PaymentModal/`, `/src/types/payment.type.ts`

**VietQR Integration**:

```typescript
import { generateQR } from 'vietqr';

const qrData = {
  bankCode: user.bankCode,
  accountNumber: user.bankAccountNumber,
  accountName: user.bankAccountName,
  amount: totalAmount,
  description: `Thanh toan don hang ${orderCode}`
};

const qrCodeUrl = await generateQR(qrData);
```

**Payment Methods**:

```typescript
enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD'
}
```

---

## Design Patterns

### 1. API Hook Pattern

**Purpose**: Encapsulate API calls in custom hooks

**Implementation**:

```typescript
// /src/hooks/apis/useProduct.ts
export const useProduct = () => {
  const getList = async (filters: any, page: number, limit: number) => {
    const queryString = new URLSearchParams({
      ...filters,
      page: page.toString(),
      limit: limit.toString()
    }).toString();

    const response = await request.get(`/products?${queryString}`);
    return response.data;
  };

  const create = async (data: IProductCreate) => {
    const response = await request.post('/products', data);
    return response.data;
  };

  // ... more methods

  return { getList, getDetail, create, update, remove };
};
```

**Usage in Component**:

```typescript
const ProductList = () => {
  const { getList, remove } = useProduct();
  const [products, setProducts] = useState<IProduct[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getList({}, 1, 20);
    setProducts(data);
  };

  return (
    // ... JSX
  );
};
```

**Benefits**:
- Centralized API logic
- Reusable across components
- Easy to test
- Type-safe with TypeScript

---

### 2. Loading State Pattern

**Purpose**: Consistent loading and error handling

**Implementation**:

```typescript
// /src/hooks/useLoading.ts
export const useLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withLoading = async <T>(
    fn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      const message = errorMessage || 'An error occurred';
      setError(message);
      Toast.show({ text: message, duration: 'long' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, withLoading };
};
```

**Usage**:

```typescript
const ProductList = () => {
  const { getList } = useProduct();
  const { isLoading, withLoading } = useLoading();

  const loadProducts = () => {
    withLoading(
      () => getList({}, 1, 20),
      'Failed to load products'
    ).then(data => {
      if (data) setProducts(data);
    });
  };

  if (isLoading) return <Loading />;

  return (
    // ... JSX
  );
};
```

---

### 3. Storage Abstraction Pattern

**Purpose**: Platform-agnostic local storage

**Implementation**:

```typescript
// /src/hooks/useStorage.ts
import { Storage } from '@ionic/storage';

export const useStorage = () => {
  const storage = new Storage({
    name: 'aiom_db',
    driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
  });

  const addItem = async (key: string, value: any) => {
    await storage.set(key, JSON.stringify(value));
  };

  const getItem = async <T>(key: string): Promise<T | null> => {
    const value = await storage.get(key);
    return value ? JSON.parse(value) : null;
  };

  const removeItem = async (key: string) => {
    await storage.remove(key);
  };

  const clear = async () => {
    await storage.clear();
  };

  return { addItem, getItem, removeItem, clear };
};
```

**Usage**:

```typescript
// Store token
const { addItem, getItem } = useStorage();
await addItem('token', jwtToken);

// Retrieve token
const token = await getItem<string>('token');
```

---

### 4. Route Protection Pattern

**Purpose**: Authentication-based access control

**Implementation**:

```typescript
// /src/routes/PrivateRoute.tsx
export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loading />;

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};
```

**Route Configuration**:

```typescript
// /src/routes/index.tsx
<IonReactRouter>
  <IonRouterOutlet>
    {/* Public routes */}
    <PublicRoute exact path="/login" component={Login} />

    {/* Protected routes */}
    <PrivateRoute exact path="/tabs/home" component={Home} />
    <PrivateRoute exact path="/tabs/products" component={ProductList} />

    {/* Default redirects */}
    <Route exact path="/">
      <Redirect to="/tabs/home" />
    </Route>

    {/* 404 */}
    <Route component={NotFound} />
  </IonRouterOutlet>
</IonReactRouter>
```

---

### 5. Modal Pattern

**Purpose**: Reusable modal dialogs

**Implementation**:

```typescript
// Component with modal
const ProductList = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);

  return (
    <>
      <IonButton onClick={() => setShowModal(true)}>
        Select Product
      </IonButton>

      <IonModal
        isOpen={showModal}
        onDidDismiss={() => setShowModal(false)}
      >
        <ModalSelectProduct
          onSelect={(product) => {
            setSelectedProduct(product);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      </IonModal>
    </>
  );
};
```

**Modal Components**:
- `ModalSelectProduct` - Product picker
- `ModalSelectCustomer` - Customer picker
- `ModalSelectSupplier` - Supplier picker
- `ModalSelectCategory` - Category picker
- `PaymentModal` - Payment QR code

---

### 6. Pull-to-Refresh Pattern

**Purpose**: Manual data refresh on mobile

**Implementation**:

```typescript
import { Refresher } from '@/components/Refresher';

const ProductList = () => {
  const loadProducts = async () => {
    // Fetch data
  };

  return (
    <IonContent>
      <Refresher onRefresh={loadProducts} />

      {/* List content */}
    </IonContent>
  );
};
```

---

### 7. Infinite Scroll Pattern

**Purpose**: Load more items on demand

**Implementation**:

```typescript
const ProductList = () => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    const nextPage = page + 1;
    const data = await getList({}, nextPage, 20);

    if (data.length < 20) setHasMore(false);

    setProducts([...products, ...data]);
    setPage(nextPage);
  };

  return (
    <>
      {/* Product list */}

      {hasMore && (
        <IonButton expand="block" onClick={loadMore}>
          Load More
        </IonButton>
      )}
    </>
  );
};
```

---

## API Integration

### HTTP Client Configuration

**Location**: `/src/helpers/axios.ts`

**Environment-Based URLs**:

```typescript
const apiUrl = {
  DEVELOPMENT: 'http://localhost:3000/api',
  STAGING: 'https://staging-api.aiom.com/api',
  PRODUCTION: 'https://api.aiom.com/api'
};

export const defaultConfig = {
  server: {
    api: apiUrl[import.meta.env.VITE_ENV],
    baseUrl: serverUrl[import.meta.env.VITE_ENV],
    version: import.meta.env.VITE_API_VERSION,
    headers: {
      "Content-Type": "application/json"
    }
  }
};
```

**Axios Instance**:

```typescript
export const request = axios.create({
  baseURL: `${defaultConfig.server.api}/${defaultConfig.server.version}`,
  timeout: 20000,
  headers: defaultConfig.server.headers
});
```

### Request Interceptor

**Purpose**: Attach JWT token to all requests

```typescript
request.interceptors.request.use(
  async (config) => {
    const storage = new Storage();
    await storage.create();
    const token = await storage.get('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

### Response Interceptor

**Purpose**: Handle errors and auto-logout

```typescript
request.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect
      const storage = new Storage();
      await storage.create();
      await storage.remove('token');
      await storage.remove('user');

      window.location.href = '/login';
    }

    // Show error toast
    const message = error.response?.data?.message || 'An error occurred';
    Toast.show({ text: message, duration: 'long' });

    return Promise.reject(error);
  }
);
```

### Response Format

**Standard API Response**:

```typescript
interface IHttpResponse<T = any> {
  statusCode: number;
  data: T | null;
  success: boolean;
  message: string;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

**Example Response**:

```json
{
  "statusCode": 200,
  "data": [
    { "id": "1", "name": "Product 1" },
    { "id": "2", "name": "Product 2" }
  ],
  "success": true,
  "message": "Products retrieved successfully",
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### API Endpoints

**Authentication**:
```
POST   /auth/login           # Login
POST   /auth/logout          # Logout
POST   /auth/refresh         # Refresh token
GET    /auth/me              # Get current user
```

**Products**:
```
GET    /products             # List products
GET    /products/:id         # Get product detail
POST   /products             # Create product
PUT    /products/:id         # Update product
DELETE /products/:id         # Delete product
GET    /products/categories  # Get categories
GET    /products/history     # Get product history
```

**Orders**:
```
GET    /orders               # List orders
GET    /orders/:id           # Get order detail
POST   /orders               # Create order
PUT    /orders/:id           # Update order
GET    /orders/statistics    # Get order statistics
```

**Receipts**:
```
# Import receipts
GET    /receipts/import      # List import receipts
GET    /receipts/import/:id  # Get import receipt
POST   /receipts/import      # Create import receipt
PUT    /receipts/import/:id  # Update import receipt

# Check receipts
GET    /receipts/check       # List check receipts
GET    /receipts/check/:id   # Get check receipt
POST   /receipts/check       # Create check receipt
PUT    /receipts/check/:id/balance  # Balance receipt

# Debt receipts
GET    /receipts/debt        # List debt receipts
GET    /receipts/debt/:id    # Get debt receipt
POST   /receipts/debt        # Create debt receipt
POST   /receipts/debt/:id/payment  # Add payment
PUT    /receipts/debt/:id/cancel   # Cancel debt
```

**Customers**:
```
GET    /customers            # List customers
GET    /customers/:id        # Get customer detail
POST   /customers            # Create customer
PUT    /customers/:id        # Update customer
DELETE /customers/:id        # Delete customer
```

**Suppliers**:
```
GET    /suppliers            # List suppliers
GET    /suppliers/:id        # Get supplier detail
POST   /suppliers            # Create supplier
PUT    /suppliers/:id        # Update supplier
DELETE /suppliers/:id        # Delete supplier
```

**Inventory**:
```
GET    /inventory            # List inventory
GET    /inventory/:id        # Get inventory detail
PUT    /inventory/:id        # Update inventory
```

**Aggregates**:
```
GET    /aggregates/dashboard      # Dashboard statistics
GET    /aggregates/daily-revenue  # Daily revenue
GET    /aggregates/order-stats    # Order statistics
```

---

## Type System

### Core Types

**Location**: `/src/types/`

### User Types

```typescript
interface User {
  id: string;
  username: string;
  fullname: string;
  role: UserRole;
  storeCode: string;
  phone?: string;
  email?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankCode?: string;
  createdAt: string;
  updatedAt: string;
}

enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  DEVELOPER = 'DEVELOPER'
}
```

### Product Types

```typescript
interface IProduct {
  id: string;
  code: string;
  productCode: number;
  productName: string;
  costPrice: number;
  sellingPrice: number;
  status: string;
  category: string;
  inventory: number;
  unit: string;
  description: string;
  images?: IProductImage[];
  suppliers: IProductSupplier[];
  createdAt: string;
  updatedAt: string;
}

interface IProductImage {
  id: string;
  path: string;
  url: string;
}

interface IProductSupplier {
  id: string;
  name: string;
  costPrice: number;
}

interface IProductCreate {
  productName: string;
  costPrice: number;
  sellingPrice: number;
  category: string;
  unit: string;
  description?: string;
  supplierIds?: string[];
  images?: string[];  // Data URLs
}
```

### Order Types

```typescript
interface IOrder {
  id: string;
  code: string;
  customer: ICustomer | null;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  discountAmount: number;
  discountType: DiscountType;
  finalAmount: number;
  status: OrderStatus;
  note: string;
  vatInfo: IVatInfo;
  items: IOrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface IOrderItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

interface ICustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface IVatInfo {
  companyName: string;
  taxCode: string;
  address: string;
  email: string;
}

enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD'
}

enum DiscountType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE'
}
```

### Receipt Types

```typescript
interface IReceiptImport {
  id: string;
  code: string;
  supplierId: string;
  supplier: ISupplier;
  status: ReceiptImportStatus;
  totalAmount: number;
  note: string;
  items: IReceiptItem[];
  createdAt: string;
  updatedAt: string;
}

interface IReceiptCheck {
  id: string;
  code: string;
  status: ReceiptCheckStatus;
  systemInventory: number;
  actualInventory: number;
  difference: number;
  reason: string;
  note: string;
  items: IReceiptCheckItem[];
  createdAt: string;
  updatedAt: string;
}

interface IReceiptDebt {
  id: string;
  code: string;
  supplierId: string;
  supplier: ISupplier;
  totalDebt: number;
  paidAmount: number;
  remainingDebt: number;
  status: string;
  note: string;
  periods: IDebtPeriod[];
  createdAt: string;
  updatedAt: string;
}

interface IReceiptItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  totalPrice: number;
}

interface IReceiptCheckItem {
  id: string;
  productId: string;
  productName: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
}

interface IDebtPeriod {
  id: string;
  periodNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
  note?: string;
}

enum ReceiptImportStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  WAITING = 'WAITING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SHORT_RECEIVED = 'SHORT_RECEIVED',
  OVER_RECEIVED = 'OVER_RECEIVED'
}

enum ReceiptCheckStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  BALANCING_REQUIRED = 'BALANCING_REQUIRED',
  BALANCED = 'BALANCED'
}
```

### Supplier Types

```typescript
interface ISupplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  taxCode?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankCode?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
```

### HTTP Response Types

```typescript
interface IHttpResponse<T = any> {
  statusCode: number;
  data: T | null;
  success: boolean;
  message: string;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
}
```

---

## Development Guidelines

### Code Style

**Import Order**:

```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';

// 2. Internal components
import { Layout } from '@/components/Layout';
import { Loading } from '@/components/Loading';

// 3. Hooks
import { useProduct } from '@/hooks/apis/useProduct';
import { useLoading } from '@/hooks/useLoading';

// 4. Helpers
import { formatCurrency } from '@/helpers/formatters';

// 5. Types
import { IProduct } from '@/types/product.type';

// 6. Styles (if any)
import './ProductList.css';
```

**Component Structure**:

```typescript
interface ProductCardProps {
  product: IProduct;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete
}) => {
  // 1. Hooks
  const history = useHistory();
  const { isLoading, withLoading } = useLoading();

  // 2. State
  const [showActions, setShowActions] = useState(false);

  // 3. Effects
  useEffect(() => {
    // Side effects
  }, []);

  // 4. Event handlers
  const handleEdit = () => {
    onEdit(product.id);
  };

  const handleDelete = async () => {
    await withLoading(
      () => onDelete(product.id),
      'Failed to delete product'
    );
  };

  // 5. Render helpers
  const renderPrice = () => {
    return formatCurrency(product.sellingPrice);
  };

  // 6. Return JSX
  return (
    <div className="product-card">
      {/* JSX content */}
    </div>
  );
};
```

**Naming Conventions**:

```typescript
// Components: PascalCase
export const ProductList = () => {};

// Interfaces: PascalCase with 'I' prefix for common types
interface IProduct {}
interface ProductCardProps {}

// Functions: camelCase
const loadProducts = async () => {};

// Constants: SCREAMING_SNAKE_CASE
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

// Enums: PascalCase for enum, SCREAMING_SNAKE_CASE for values
enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER'
}

// Files: PascalCase for components, camelCase for utilities
ProductList.tsx
formatters.ts
```

### Error Handling

**Try-Catch with Toast**:

```typescript
const handleSubmit = async () => {
  try {
    await createProduct(data);
    Toast.show({ text: 'Product created successfully', duration: 'short' });
    history.push('/tabs/products');
  } catch (error) {
    console.error('Failed to create product:', error);
    Toast.show({ text: 'Failed to create product', duration: 'long' });
  }
};
```

**Using useLoading Hook**:

```typescript
const { isLoading, withLoading } = useLoading();

const handleSubmit = async () => {
  const result = await withLoading(
    () => createProduct(data),
    'Failed to create product'
  );

  if (result) {
    history.push('/tabs/products');
  }
};
```

### TypeScript Best Practices

**Strict Typing**:

```typescript
// Good: Explicit types
const products: IProduct[] = [];
const handleSelect = (product: IProduct): void => {};

// Bad: Implicit any
const products = [];
const handleSelect = (product) => {};
```

**Interface vs Type**:

```typescript
// Use interface for objects
interface IProduct {
  id: string;
  name: string;
}

// Use type for unions, primitives, utilities
type Status = 'active' | 'inactive';
type ProductWithSupplier = IProduct & { supplier: ISupplier };
```

**Optional Chaining**:

```typescript
// Good: Safe access
const imagePath = product?.images?.[0]?.path;

// Bad: Multiple checks
const imagePath = product && product.images && product.images[0]
  ? product.images[0].path
  : undefined;
```

### Performance Optimization

**Memoization**:

```typescript
import { useMemo, useCallback } from 'react';

const ProductList = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [filter, setFilter] = useState('');

  // Memoize expensive computations
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.productName.toLowerCase().includes(filter.toLowerCase())
    );
  }, [products, filter]);

  // Memoize callbacks passed to child components
  const handleDelete = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <div>
      {filteredProducts.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};
```

**Lazy Loading**:

```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const ProductDetail = lazy(() => import('./pages/Product/ProductDetail'));

const App = () => (
  <Suspense fallback={<Loading />}>
    <Route path="/products/:id" component={ProductDetail} />
  </Suspense>
);
```

### Testing

**Unit Tests** (Vitest):

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const mockProduct: IProduct = {
    id: '1',
    productName: 'Test Product',
    sellingPrice: 100000,
    // ... other fields
  };

  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const handleEdit = vi.fn();
    render(<ProductCard product={mockProduct} onEdit={handleEdit} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(handleEdit).toHaveBeenCalledWith('1');
  });
});
```

**E2E Tests** (Cypress):

```typescript
// cypress/e2e/product-list.cy.ts
describe('Product List', () => {
  beforeEach(() => {
    cy.login(); // Custom command for authentication
    cy.visit('/tabs/products');
  });

  it('displays products', () => {
    cy.get('[data-testid="product-card"]').should('have.length.gt', 0);
  });

  it('can create new product', () => {
    cy.get('[data-testid="create-product-btn"]').click();
    cy.get('input[name="productName"]').type('New Product');
    cy.get('input[name="sellingPrice"]').type('50000');
    cy.get('button[type="submit"]').click();

    cy.contains('Product created successfully').should('be.visible');
  });
});
```

---

## Key Components Reference

### Layout Components

**Layout** (`/src/components/Layout/`):

```typescript
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showMenuBar?: boolean;
  showTabBar?: boolean;
}

<Layout title="Products" showMenuBar showTabBar>
  {/* Page content */}
</Layout>
```

**MenuBar** (`/src/components/MenuBar/`):

```typescript
// Top navigation bar with back button, title, actions
<MenuBar
  title="Product Details"
  showBackButton
  actions={[
    { icon: editOutline, onClick: handleEdit },
    { icon: trashOutline, onClick: handleDelete }
  ]}
/>
```

**TabBar** (`/src/components/TabBar/`):

```typescript
// Bottom tab navigation (4 tabs)
// Automatically shown on main pages
// Tabs: Home, Orders, Inventory, Products
```

### Modal Components

**ModalSelectProduct** (`/src/components/ModalSelectProduct/`):

```typescript
interface ModalSelectProductProps {
  onSelect: (product: IProduct) => void;
  onClose: () => void;
  excludeIds?: string[];
}

<ModalSelectProduct
  onSelect={(product) => {
    console.log('Selected:', product);
  }}
  onClose={() => setShowModal(false)}
  excludeIds={['id1', 'id2']}
/>
```

**ModalSelectCustomer** (`/src/components/ModalSelectCustomer/`):

```typescript
<ModalSelectCustomer
  onSelect={(customer) => setSelectedCustomer(customer)}
  onClose={() => setShowModal(false)}
/>
```

**PaymentModal** (`/src/components/PaymentModal/`):

```typescript
<PaymentModal
  isOpen={showPayment}
  amount={totalAmount}
  orderCode={orderCode}
  onClose={() => setShowPayment(false)}
  onComplete={handlePaymentComplete}
/>
```

### Form Components

**Counter** (`/src/components/Counter/`):

```typescript
interface CounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

<Counter
  value={quantity}
  onChange={(val) => setQuantity(val)}
  min={1}
  max={100}
  step={1}
/>
```

**DatePicker** (`/src/components/DatePicker/`):

```typescript
<DatePicker
  value={selectedDate}
  onChange={(date) => setSelectedDate(date)}
  min="2020-01-01"
  max="2025-12-31"
/>
```

### Utility Components

**Loading** (`/src/components/Loading/`):

```typescript
// Full-page loading spinner
<Loading />
```

**EmptyPage** (`/src/components/EmptyPage/`):

```typescript
<EmptyPage
  icon={cubeOutline}
  message="No products found"
  actionText="Create Product"
  onAction={() => history.push('/tabs/products/create')}
/>
```

**ErrorMessage** (`/src/components/ErrorMessage/`):

```typescript
<ErrorMessage
  message="Failed to load products"
  onRetry={loadProducts}
/>
```

**Refresher** (`/src/components/Refresher/`):

```typescript
<Refresher onRefresh={loadProducts} />
```

**Toast** (`/src/components/Toast/`):

```typescript
import { Toast } from '@/components/Toast';

Toast.show({
  text: 'Product created successfully',
  duration: 'short', // 'short' | 'long'
  position: 'bottom' // 'top' | 'center' | 'bottom'
});
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Token Not Persisting

**Problem**: User gets logged out after app restart

**Solution**: Ensure Ionic Storage is initialized before accessing token

```typescript
// In useAuth hook
const storage = new Storage();
await storage.create(); // MUST call create() first
const token = await storage.get('token');
```

#### 2. Barcode Scanner Not Working on Web

**Problem**: BarcodeDetector API not available

**Solution**: Ensure polyfill is loaded

```typescript
import { BarcodeDetectorPolyfill } from '@undecaf/barcode-detector-polyfill';

if (!('BarcodeDetector' in window)) {
  window.BarcodeDetector = BarcodeDetectorPolyfill;
}
```

#### 3. Camera Not Opening on iOS

**Problem**: Permission denied error

**Solution**: Add permissions to Info.plist

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to the camera to take photos</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to the photo library</string>
```

#### 4. Images Not Uploading

**Problem**: File size too large

**Solution**: Compress images before upload

```typescript
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
};
const compressedFile = await imageCompression(file, options);
```

#### 5. API Requests Failing with 401

**Problem**: Token expired or invalid

**Solution**: Response interceptor handles this automatically, but ensure token is attached

```typescript
// Check axios interceptor in helpers/axios.ts
// Should automatically redirect to /login on 401
```

#### 6. Build Fails on Legacy Browsers

**Problem**: ES6+ syntax not supported

**Solution**: Ensure Vite legacy plugin is configured

```typescript
// vite.config.ts
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ]
});
```

### Debugging Tools

**React DevTools**: Browser extension for component inspection

**Ionic DevApp**: Mobile app for testing on real devices

**PostHog**: Analytics and error tracking (configured in app)

**Chrome DevTools**:
- Network tab: Inspect API requests
- Application tab: Check local storage, IndexedDB
- Console: View logs and errors

**Capacitor CLI**:

```bash
# Open in native IDEs
npx cap open ios
npx cap open android

# View native logs
npx cap run ios --livereload
npx cap run android --livereload
```

### Performance Monitoring

**Bundle Size Analysis**:

```bash
# Build with analysis
npm run build -- --mode analyze

# Check chunk sizes
ls -lh dist/assets/
```

**Lighthouse Audit**:

```bash
# Run Lighthouse in Chrome DevTools
# Check: Performance, Accessibility, Best Practices, SEO, PWA
```

---

## Commands Reference

```bash
# Development
npm run dev                    # Start dev server (localhost:5173)
npm run start:ios             # Run on iOS with live reload
npm run start:android         # Run on Android with live reload

# Build
npm run build                 # Production web build
npm run build:ios             # iOS production build
npm run build:android         # Android production build
npm run preview               # Preview production build locally

# Testing
npm run test.unit             # Run Vitest unit tests
npm run test.e2e              # Run Cypress E2E tests
npm run test.e2e:headless     # Run Cypress headless

# Linting
npm run lint                  # Run ESLint
npm run lint:fix              # Fix ESLint errors

# Capacitor
npm run sync                  # Sync web assets to native projects
npx cap open ios              # Open iOS project in Xcode
npx cap open android          # Open Android project in Android Studio

# Type Checking
npx tsc --noEmit              # Check TypeScript types

# Dependencies
npm install                   # Install dependencies
npm update                    # Update dependencies
npm audit fix                 # Fix security vulnerabilities
```

---

## Environment Variables

**Location**: `.env`, `.env.local`

```bash
# API Configuration
VITE_ENV=DEVELOPMENT           # DEVELOPMENT | STAGING | PRODUCTION
VITE_API_VERSION=v1           # API version

# PostHog Analytics
VITE_POSTHOG_KEY=your_key_here
VITE_POSTHOG_HOST=https://app.posthog.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false
```

**Usage in Code**:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
const environment = import.meta.env.VITE_ENV;
```

---

## Additional Resources

**Official Documentation**:
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Ionic Framework](https://ionicframework.com/docs)
- [Capacitor](https://capacitorjs.com/docs)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)

**Project Documentation**:
- `CLAUDE.md` - Development guidelines for AI assistants
- `README.md` - Project overview and setup
- `/docs/` - Additional documentation (if available)

**Code Statistics**:
- Total Lines: ~32,249 (TypeScript + TSX)
- Components: 24+ reusable components
- Pages: 20+ page components
- Hooks: 18+ custom hooks
- Type Files: 19+ type definition files

---

## Conclusion

This AGENTS.md file provides a comprehensive guide to the AIOM Mobile Application architecture, patterns, and best practices. It serves as a reference for:

- AI agents (like Claude) working on the codebase
- New developers onboarding to the project
- Experienced developers needing quick reference
- Code reviewers understanding architectural decisions

**Key Takeaways**:

1. The app uses **custom hooks pattern** instead of global state management
2. **Ionic + Capacitor** provides cross-platform native capabilities
3. **TypeScript strict mode** ensures type safety throughout
4. **API hooks** encapsulate all backend communication
5. **Storage abstraction** enables offline-first functionality
6. **Route protection** handles authentication flows
7. **Modular architecture** promotes code reusability

For questions or issues, refer to:
- Project README.md
- CLAUDE.md for development guidelines
- Official documentation links above
- Code comments within the source files

---

**Document Version**: 1.0
**Last Updated**: 2025-12-11
**Codebase Version**: develop branch
**Total Codebase Size**: ~32,249 lines of TypeScript/TSX
