# Depth Estimation Feature

This document describes the depth estimation functionality added to the Prompty application using Xenova Transformers.js and the Depth-Anything-V2 model.

## Overview

The depth estimation feature allows users to upload images and generate depth maps using AI models that run entirely in the browser. The implementation uses WebAssembly for fast, client-side inference without requiring server-side processing.

## Features

- **Single Image Depth Estimation**: Upload any image to estimate depth information
- **Multiple Visualizations**: View depth maps in grayscale or colored formats
- **Interactive Depth Inspection**: Hover over pixels to see depth values
- **Export Functionality**: Download depth maps as PNG images
- **Multiple Color Maps**: Choose from Viridis, Plasma, Inferno, and Magma color schemes
- **Browser-Based Processing**: All computation happens locally using WebAssembly

## Technical Implementation

### Core Components

1. **useDepthEstimation Hook** (`src/hooks/useDepthEstimation.ts`)
   - Manages the Transformers.js pipeline
   - Handles model loading and inference
   - Provides loading states and error handling

2. **DepthEstimator Component** (`src/components/depth/DepthEstimator.tsx`)
   - Main UI component for depth estimation
   - File upload interface
   - Tabbed view for different visualizations
   - Interactive depth inspection

3. **Depth Utilities** (`src/utils/depthUtils.ts`)
   - Image processing functions
   - Color map implementations
   - Export functionality
   - Point cloud conversion utilities

### Model Details

- **Model**: Xenova/depth-anything-v2-small-hf
- **Type**: Monocular depth estimation
- **Input**: RGB images
- **Output**: Pixel-wise depth predictions as Float32Array

### Dependencies

- `@xenova/transformers`: Core ML inference library
- WebAssembly support for fast computation
- Canvas API for image processing and visualization

## Usage

### Basic Usage

1. Navigate to `/depth` in the application
2. Click "Choose File" to select an image
3. Click "Estimate Depth" to process the image
4. View results in the tabbed interface:
   - **Original**: The uploaded image
   - **Depth (Grayscale)**: Black and white depth map
   - **Depth (Colored)**: Colored depth visualization

### Advanced Features

#### Interactive Depth Inspection
- Hover over any pixel in the depth map to see:
  - Pixel coordinates (x, y)
  - Depth value at that location

#### Color Map Selection
- Choose from multiple color schemes:
  - **Viridis**: Blue to yellow gradient
  - **Plasma**: Purple to yellow gradient
  - **Inferno**: Black to yellow gradient
  - **Magma**: Black to white gradient

#### Export Options
- Download grayscale depth maps
- Download colored depth maps with selected color scheme
- Files are saved as PNG images

## Configuration

### Next.js Configuration

The following configuration is required in `next.config.ts`:

```typescript
webpack: (config, { isServer }) => {
  // Add support for WebAssembly
  config.experiments = {
    ...config.experiments,
    asyncWebAssembly: true,
  };

  // Add support for .wasm files
  config.module.rules.push({
    test: /\.wasm$/,
    type: "asset/resource",
  });

  // Handle worker files
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
  }

  return config;
},
// Headers for Cross-Origin-Embedder-Policy
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Cross-Origin-Embedder-Policy",
          value: "require-corp",
        },
        {
          key: "Cross-Origin-Opener-Policy",
          value: "same-origin",
        },
      ],
    },
  ];
},
```

## API Reference

### useDepthEstimation Hook

```typescript
interface UseDepthEstimationReturn {
  estimateDepth: (imageUrl: string | File) => Promise<DepthEstimationResult | null>;
  isLoading: boolean;
  error: string | null;
  progress: number;
}
```

#### Methods

- `estimateDepth(input)`: Process an image and return depth estimation results
  - `input`: String URL or File object
  - Returns: Promise with depth data or null if failed

#### State

- `isLoading`: Whether depth estimation is in progress
- `error`: Error message if processing failed
- `progress`: Loading progress percentage (0-100)

### Depth Utilities

#### Core Functions

- `depthToImageData(depthData, width, height)`: Convert depth data to grayscale ImageData
- `depthToColoredImageData(depthData, width, height, colormap)`: Convert depth data to colored ImageData
- `downloadDepthMap(depthData, width, height, filename, colored, colormap)`: Download depth map as image
- `getDepthAtCoordinate(depthData, width, height, x, y)`: Get depth value at specific coordinates

#### Advanced Functions

- `createDepthVisualization(depthData, width, height, options)`: Create canvas visualization
- `depthToPointCloud(depthData, width, height, focalLength, downsample)`: Convert to 3D point cloud

## Performance Considerations

### Model Loading
- The model is downloaded once and cached in the browser
- Initial load time: ~10-30 seconds depending on connection
- Subsequent usage is instant

### Memory Usage
- Model size: ~25MB
- Runtime memory: ~100-200MB during inference
- Depth data: Width × Height × 4 bytes

### Optimization Tips
- Use appropriately sized images (max 1024px recommended)
- Allow model to load completely before first use
- Consider implementing model preloading for better UX

## Browser Compatibility

### Requirements
- Modern browsers with WebAssembly support
- Canvas API support
- File API support for uploads

### Tested Browsers
- Chrome 88+
- Firefox 89+
- Safari 14+
- Edge 88+

## Troubleshooting

### Common Issues

1. **Model Loading Fails**
   - Check internet connection
   - Verify CORS headers are configured
   - Clear browser cache and reload

2. **Out of Memory Errors**
   - Reduce image size before processing
   - Close other browser tabs
   - Try on a device with more RAM

3. **Slow Performance**
   - Ensure WebAssembly is supported
   - Check if hardware acceleration is enabled
   - Consider using smaller images

### Debug Information

Enable detailed logging by adding to your browser console:
```javascript
// Enable Transformers.js debugging
window.TRANSFORMERS_DEBUG = true;
```

## Future Enhancements

### Planned Features
- Batch processing for multiple images
- 3D visualization of depth maps
- Integration with AR/VR applications
- Real-time video depth estimation
- Custom model support

### Performance Improvements
- Model quantization for smaller size
- WebGL acceleration
- Worker thread optimization
- Progressive loading for large images

## Contributing

When contributing to the depth estimation feature:

1. Test on multiple browsers and devices
2. Verify WebAssembly compatibility
3. Check memory usage with large images
4. Ensure proper error handling
5. Update documentation for new features

## License

This feature uses the Depth-Anything-V2 model which is licensed under Apache 2.0.