# ProductImageUpload Component

A comprehensive camera integration component for capturing and uploading product
images with automatic compression and optimization.

## Features

### 📸 Camera Functionality

- **Live Camera Preview**: Real-time camera stream with professional overlay
- **Camera Switching**: Toggle between front and rear cameras
- **Torch/Flash Control**: Enable/disable flash when supported by device
- **Zoom Control**: Adjustable zoom with visual slider (1x - 3x)
- **Focus Frame**: Visual guide for optimal product photo framing

### 🖼️ Image Management

- **Multiple Images**: Support for up to 5 product images (configurable)
- **Image Preview**: Full-screen gallery view with swipe navigation
- **Delete Confirmation**: Safe deletion with confirmation dialog
- **Responsive Grid**: 3-column layout that adapts to screen size

### 🗜️ Compression & Upload

- **Automatic Compression**: Reduces image size by up to 90%
- **Progress Tracking**: Real-time compression progress indicator
- **Quality Optimization**: Maintains visual quality while reducing file size
- **S3 Upload**: Seamless upload to cloud storage via signed URLs

### 🎨 User Experience

- **Empty State**: Clear call-to-action for first image
- **Loading States**: Visual feedback during compression and upload
- **Error Handling**: User-friendly error messages
- **Accessibility**: Keyboard navigation and screen reader support

## Usage

```tsx
import { ProductImageUpload } from "./components/ProductImageUpload";
import { ProductImage } from "./productCreate.d";

function ProductCreate() {
    const [images, setImages] = useState<ProductImage[]>([]);

    return (
        <ProductImageUpload
            images={images}
            onImagesChange={setImages}
            maxImages={5}
            disabled={false}
        />
    );
}
```

## Props

| Prop             | Type                               | Default  | Description                        |
| ---------------- | ---------------------------------- | -------- | ---------------------------------- |
| `images`         | `ProductImage[]`                   | `[]`     | Array of uploaded images           |
| `onImagesChange` | `(images: ProductImage[]) => void` | Required | Callback when images change        |
| `maxImages`      | `number`                           | `5`      | Maximum number of images allowed   |
| `disabled`       | `boolean`                          | `false`  | Disable image upload functionality |

## ProductImage Interface

```typescript
interface ProductImage {
    id: string; // File ID from upload service
    path: string; // S3 path to the image
}
```

## Camera Modal Controls

### Bottom Controls

- **Left Button**: Switch between front/rear cameras
- **Center Button**: Capture photo (large, primary action)
- **Right Button**: Toggle torch/flash (when available)

### Top Controls

- **Left Badge**: Current camera mode indicator
- **Right Panel**: Zoom control with slider (when available)

### Photo Preview

After capturing a photo:

- **Left Button**: Retake photo
- **Right Button**: Accept and upload photo

## Image Grid Layout

### Empty State

- Large clickable area (192px height)
- Camera icon in circular badge
- "Add product image" text
- "Click to take photo" subtext
- Compression info message

### With Images

- 3-column responsive grid
- Square aspect ratio thumbnails
- Delete button on each image (top-right)
- Add more button (when under limit)
- Image count indicator (e.g., "3/5 images")

## Compression Settings

Default compression options:

```typescript
{
  maxSizeMB: 1,              // Maximum file size: 1MB
  maxWidthOrHeight: 1920,    // Maximum dimension: 1920px
  preserveExif: true,        // Keep photo metadata
}
```

## Camera Settings

Default camera stream options:

```typescript
{
  facingMode: 'environment',  // Start with rear camera
  width: 1920,                // High resolution
  height: 1080,
  quality: 90                 // High quality
}
```

## Error Handling

The component handles various error scenarios:

1. **Camera Permission Denied**
   - Shows error toast with helpful message
   - Closes camera modal automatically

2. **Camera Initialization Failed**
   - Displays error notification
   - Provides retry option

3. **Compression Failed**
   - Falls back to original image
   - Continues with upload process

4. **Upload Failed**
   - Shows specific error message
   - Allows retry

## Styling

The component uses:

- **Tailwind CSS**: For layout and spacing
- **Ionic Components**: For consistent UI elements
- **Custom CSS**: Camera modal styles from `CameraModal.css`

### Key Classes

- `border-teal-300`: Teal border color
- `bg-teal-50`: Light teal background
- `text-teal-600`: Teal text color
- `aspect-square`: 1:1 aspect ratio

## Dependencies

### Hooks

- `useCamera`: Camera stream and capture functionality
- `useUploadFile`: Image compression and S3 upload
- `useIonToast`: User notifications

### Helpers

- `dataURLtoFile`: Convert data URL to File object
- `getDataURLFileSize`: Calculate file size from data URL
- `getS3ImageUrl`: Generate S3 image URL from path

### Components

- `ImagePreview`: Full-screen image gallery
- Ionic UI components (IonModal, IonButton, etc.)

## Browser Support

### Camera API

- Chrome/Edge: ✅ Full support
- Safari: ✅ Full support (iOS 11+)
- Firefox: ✅ Full support

### Features by Device

- **Torch/Flash**: Supported on most mobile devices
- **Zoom**: Supported on devices with zoom capability
- **Camera Switching**: Supported on devices with multiple cameras

## Performance

### Optimization Strategies

1. **Lazy Loading**: Images loaded on-demand
2. **Compression**: Reduces file size before upload
3. **Stream Cleanup**: Camera stream properly released
4. **Memory Management**: Canvas cleared after capture

### Typical Performance

- Image compression: 1-3 seconds
- Upload time: 2-5 seconds (depends on network)
- Total time per image: 3-8 seconds

## Accessibility

### Keyboard Navigation

- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals

### Screen Readers

- Descriptive button labels
- Image alt text
- Status announcements

### Visual Feedback

- Loading spinners
- Progress bars
- Color-coded messages

## Testing Checklist

- [ ] Camera permission flow
- [ ] Front camera capture
- [ ] Rear camera capture
- [ ] Camera switching
- [ ] Torch/flash toggle
- [ ] Zoom functionality
- [ ] Photo capture
- [ ] Photo retake
- [ ] Photo accept
- [ ] Image compression
- [ ] Upload success
- [ ] Upload failure
- [ ] Delete image
- [ ] Image preview
- [ ] Maximum images limit
- [ ] Responsive layout
- [ ] Error handling

## Troubleshooting

### Camera not starting

1. Check browser permissions
2. Ensure HTTPS connection (required for camera access)
3. Verify device has camera

### Compression taking too long

1. Check image size (very large images take longer)
2. Verify device performance
3. Consider adjusting compression settings

### Upload failing

1. Check network connection
2. Verify S3 configuration
3. Check file size limits

## Future Enhancements

Potential improvements:

- [ ] Image cropping
- [ ] Image rotation
- [ ] Filters and adjustments
- [ ] Batch upload from gallery
- [ ] Drag-and-drop support
- [ ] WebP format support
- [ ] Progressive upload
- [ ] Offline support

## License

Part of the AIOM System mobile application.
