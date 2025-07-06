/**
 * Utility functions for processing depth maps from depth estimation models
 */

export interface DepthMapData {
  data: Float32Array;
  width: number;
  height: number;
}

/**
 * Convert depth map to canvas ImageData for visualization
 */
export const depthToImageData = (
  depthData: Float32Array,
  width: number,
  height: number,
  options: {
    enhance?: boolean;
    contrast?: number;
    brightness?: number;
  } = {},
): ImageData => {
  const { enhance = true, contrast = 0.9, brightness = 0.1 } = options;

  console.log(
    `Processing depth data: ${depthData.length} values for ${width}x${height} image`,
  );

  if (depthData.length !== width * height) {
    throw new Error(
      `Data size mismatch: expected ${width * height}, got ${depthData.length}`,
    );
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = width;
  canvas.height = height;

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Najdeme min a max hodnoty
  let minDepth = Infinity;
  let maxDepth = -Infinity;
  for (let i = 0; i < depthData.length; i++) {
    minDepth = Math.min(minDepth, depthData[i]);
    maxDepth = Math.max(maxDepth, depthData[i]);
  }

  const depthRange = maxDepth - minDepth;

  if (depthRange === 0) {
    // Všechny hodnoty jsou stejné
    for (let i = 0; i < data.length; i += 4) {
      data[i] = data[i + 1] = data[i + 2] = 128;
      data[i + 3] = 255;
    }
  } else {
    // Normalizujeme a aplikujeme vylepšení
    for (let i = 0; i < depthData.length; i++) {
      let normalizedDepth = (depthData[i] - minDepth) / depthRange;

      if (enhance) {
        // Aplikujeme kontrast a jas
        normalizedDepth = Math.pow(normalizedDepth, 1 / contrast);
        normalizedDepth = Math.max(
          0,
          Math.min(1, normalizedDepth + brightness),
        );
      }

      const gray = Math.round(normalizedDepth * 255);

      const pixelIndex = i * 4;
      data[pixelIndex] = gray;
      data[pixelIndex + 1] = gray;
      data[pixelIndex + 2] = gray;
      data[pixelIndex + 3] = 255;
    }
  }

  return imageData;
};

/**
 * Convert depth map to colored visualization using a color palette
 */
export const depthToColoredImageData = (
  depthData: Float32Array,
  width: number,
  height: number,
  colormap: "viridis" | "plasma" | "inferno" | "magma" = "viridis",
): ImageData => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = width;
  canvas.height = height;

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Find min and max depth values for normalization
  let minDepth = Infinity;
  let maxDepth = -Infinity;
  for (let i = 0; i < depthData.length; i++) {
    minDepth = Math.min(minDepth, depthData[i]);
    maxDepth = Math.max(maxDepth, depthData[i]);
  }

  // Apply colormap
  for (let i = 0; i < depthData.length; i++) {
    const normalizedDepth = (depthData[i] - minDepth) / (maxDepth - minDepth);
    const color = getColormapColor(normalizedDepth, colormap);

    const pixelIndex = i * 4;
    data[pixelIndex] = color.r; // Red
    data[pixelIndex + 1] = color.g; // Green
    data[pixelIndex + 2] = color.b; // Blue
    data[pixelIndex + 3] = 255; // Alpha
  }

  return imageData;
};

/**
 * Get color from colormap based on normalized value (0-1)
 */
const getColormapColor = (
  value: number,
  colormap: "viridis" | "plasma" | "inferno" | "magma",
): { r: number; g: number; b: number } => {
  // Clamp value between 0 and 1
  value = Math.max(0, Math.min(1, value));

  switch (colormap) {
    case "viridis":
      return viridisColormap(value);
    case "plasma":
      return plasmaColormap(value);
    case "inferno":
      return infernoColormap(value);
    case "magma":
      return magmaColormap(value);
    default:
      return viridisColormap(value);
  }
};

/**
 * Viridis colormap implementation
 */
const viridisColormap = (t: number): { r: number; g: number; b: number } => {
  const r = Math.round(
    255 *
      Math.max(
        0,
        Math.min(1, 0.267 + 0.742 * t - 0.855 * t * t + 0.318 * t * t * t),
      ),
  );
  const g = Math.round(
    255 *
      Math.max(
        0,
        Math.min(1, 0.005 + 1.404 * t - 1.384 * t * t + 0.448 * t * t * t),
      ),
  );
  const b = Math.round(
    255 *
      Math.max(
        0,
        Math.min(1, 0.329 + 2.137 * t - 5.532 * t * t + 2.78 * t * t * t),
      ),
  );
  return { r, g, b };
};

/**
 * Plasma colormap implementation
 */
const plasmaColormap = (t: number): { r: number; g: number; b: number } => {
  const r = Math.round(
    255 *
      Math.max(
        0,
        Math.min(1, 0.063 + 2.81 * t - 3.342 * t * t + 1.437 * t * t * t),
      ),
  );
  const g = Math.round(
    255 *
      Math.max(
        0,
        Math.min(1, 0.012 + 1.358 * t - 0.0 * t * t - 0.528 * t * t * t),
      ),
  );
  const b = Math.round(
    255 *
      Math.max(
        0,
        Math.min(1, 0.615 + 2.666 * t - 5.191 * t * t + 2.72 * t * t * t),
      ),
  );
  return { r, g, b };
};

/**
 * Inferno colormap implementation
 */
const infernoColormap = (t: number): { r: number; g: number; b: number } => {
  const r = Math.round(
    255 *
      Math.max(
        0,
        Math.min(1, 0.001 + 1.777 * t - 0.037 * t * t - 0.342 * t * t * t),
      ),
  );
  const g = Math.round(
    255 *
      Math.max(
        0,
        Math.min(1, 0.0 + 0.542 * t + 1.92 * t * t - 1.617 * t * t * t),
      ),
  );
  const b = Math.round(
    255 *
      Math.max(
        0,
        Math.min(1, 0.014 + 1.775 * t - 2.945 * t * t + 1.16 * t * t * t),
      ),
  );
  return { r, g, b };
};

/**
 * Magma colormap implementation
 */
const magmaColormap = (t: number): { r: number; g: number; b: number } => {
  const r = Math.round(
    255 *
      Math.max(
        0,
        Math.min(1, 0.001 + 1.596 * t + 0.112 * t * t - 0.71 * t * t * t),
      ),
  );
  const g = Math.round(
    255 *
      Math.max(
        0,
        Math.min(1, 0.0 + 0.639 * t + 1.729 * t * t - 1.355 * t * t * t),
      ),
  );
  const b = Math.round(
    255 *
      Math.max(
        0,
        Math.min(1, 0.014 + 1.657 * t - 2.25 * t * t + 0.581 * t * t * t),
      ),
  );
  return { r, g, b };
};

/**
 * Download depth map as image
 */
export const downloadDepthMap = (
  depthData: Float32Array,
  width: number,
  height: number,
  filename: string = "depth_map.png",
  colored: boolean = false,
  colormap: "viridis" | "plasma" | "inferno" | "magma" = "viridis",
): void => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = width;
  canvas.height = height;

  const imageData = colored
    ? depthToColoredImageData(depthData, width, height, colormap)
    : depthToImageData(depthData, width, height);

  ctx.putImageData(imageData, 0, 0);

  // Create download link
  canvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  });
};

/**
 * Get depth value at specific coordinates
 */
// Oprava pro depthUtils.ts - opravit indexování
export const getDepthAtCoordinate = (
  depthData: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
): number | null => {
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return null;
  }

  // Correct indexing: y * width + x (row-major order)
  const index = y * width + x;
  if (index >= depthData.length) {
    console.warn(
      `Index ${index} out of bounds for data length ${depthData.length}`,
    );
    return null;
  }

  return depthData[index];
};

/**
 * Create a depth map visualization canvas
 */
export const createDepthVisualization = (
  depthData: Float32Array,
  width: number,
  height: number,
  options: {
    colored?: boolean;
    colormap?: "viridis" | "plasma" | "inferno" | "magma";
    scale?: number;
  } = {},
): HTMLCanvasElement => {
  const { colored = false, colormap = "viridis", scale = 1 } = options;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = width * scale;
  canvas.height = height * scale;

  const imageData = colored
    ? depthToColoredImageData(depthData, width, height, colormap)
    : depthToImageData(depthData, width, height);

  // Create temporary canvas for scaling
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCanvas.width = width;
  tempCanvas.height = height;
  tempCtx.putImageData(imageData, 0, 0);

  // Scale to final canvas
  ctx.imageSmoothingEnabled = false; // For pixel-perfect scaling
  ctx.drawImage(tempCanvas, 0, 0, width * scale, height * scale);

  return canvas;
};

/**
 * Convert depth map to 3D point cloud data
 */
export const depthToPointCloud = (
  depthData: Float32Array,
  width: number,
  height: number,
  focalLength: number = 500,
  downsample: number = 1,
): Array<{ x: number; y: number; z: number }> => {
  const points: Array<{ x: number; y: number; z: number }> = [];

  const centerX = width / 2;
  const centerY = height / 2;

  for (let y = 0; y < height; y += downsample) {
    for (let x = 0; x < width; x += downsample) {
      const index = y * width + x;
      const depth = depthData[index];

      if (depth > 0) {
        const worldX = ((x - centerX) * depth) / focalLength;
        const worldY = ((y - centerY) * depth) / focalLength;
        const worldZ = depth;

        points.push({ x: worldX, y: worldY, z: worldZ });
      }
    }
  }

  return points;
};
