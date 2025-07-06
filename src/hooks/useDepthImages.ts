import { useState, useEffect, useCallback } from "react";
import {
  depthToImageData,
  depthToColoredImageData,
  getDepthAtCoordinate,
} from "@/utils/depthUtils";

interface DepthImages {
  grayscale: string | null;
  colored: string | null;
}

interface MousePosition {
  x: number;
  y: number;
}

export const useDepthImages = () => {
  const [depthImages, setDepthImages] = useState<DepthImages>({
    grayscale: null,
    colored: null,
  });

  const [mousePosition, setMousePosition] = useState<MousePosition | null>(
    null,
  );
  const [depthAtMouse, setDepthAtMouse] = useState<number | null>(null);
  const [highQuality, setHighQuality] = useState(false);
  const [lastDepthResult, setLastDepthResult] = useState<any>(null);
  const [lastColormap, setLastColormap] = useState<
    "viridis" | "plasma" | "inferno" | "magma"
  >("viridis");
  const [lastAdjustments, setLastAdjustments] = useState({
    brightness: 1,
    exposure: 1,
    contrast: 1,
    sharpness: 0,
  });

  const upscaleDepthData = useCallback(
    (
      depthData: Float32Array,
      width: number,
      height: number,
      scale: number = 2,
    ): {
      data: Float32Array;
      width: number;
      height: number;
    } => {
      const newWidth = width * scale;
      const newHeight = height * scale;
      const newData = new Float32Array(newWidth * newHeight);

      // Bilinear interpolation for upscaling
      for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
          const srcX = x / scale;
          const srcY = y / scale;

          const x1 = Math.floor(srcX);
          const y1 = Math.floor(srcY);
          const x2 = Math.min(x1 + 1, width - 1);
          const y2 = Math.min(y1 + 1, height - 1);

          const fx = srcX - x1;
          const fy = srcY - y1;

          const p1 = depthData[y1 * width + x1];
          const p2 = depthData[y1 * width + x2];
          const p3 = depthData[y2 * width + x1];
          const p4 = depthData[y2 * width + x2];

          const interpolated =
            p1 * (1 - fx) * (1 - fy) +
            p2 * fx * (1 - fy) +
            p3 * (1 - fx) * fy +
            p4 * fx * fy;

          newData[y * newWidth + x] = interpolated;
        }
      }

      return { data: newData, width: newWidth, height: newHeight };
    },
    [],
  );

  const enhanceDepthData = useCallback(
    (depthData: Float32Array, width: number, height: number): Float32Array => {
      const enhanced = new Float32Array(depthData.length);

      // Apply edge-preserving smoothing and detail enhancement
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;

          // Get neighboring values
          const center = depthData[idx];
          const neighbors = [
            depthData[(y - 1) * width + x], // top
            depthData[(y + 1) * width + x], // bottom
            depthData[y * width + (x - 1)], // left
            depthData[y * width + (x + 1)], // right
          ];

          // Calculate local variance
          const mean =
            neighbors.reduce((sum, val) => sum + val, center) / 5;
          const variance =
            neighbors.reduce(
              (sum, val) => sum + Math.pow(val - mean, 2),
              Math.pow(center - mean, 2),
            ) / 5;

          // Apply adaptive filtering based on local variance
          if (variance < 0.01) {
            // Smooth area - apply slight smoothing
            enhanced[idx] = mean;
          } else {
            // Edge area - preserve original value with slight sharpening
            const sharpened = center + 0.1 * (center - mean);
            enhanced[idx] = sharpened;
          }
        }
      }

      // Copy border pixels
      for (let x = 0; x < width; x++) {
        enhanced[x] = depthData[x]; // top row
        enhanced[(height - 1) * width + x] =
          depthData[(height - 1) * width + x]; // bottom row
      }
      for (let y = 0; y < height; y++) {
        enhanced[y * width] = depthData[y * width]; // left column
        enhanced[y * width + (width - 1)] =
          depthData[y * width + (width - 1)]; // right column
      }

      return enhanced;
    },
    [],
  );

  const createImageFromCanvas = useCallback(
    (
      depthData: Float32Array,
      width: number,
      height: number,
      colored: boolean = false,
      colormap: "viridis" | "plasma" | "inferno" | "magma" = "viridis",
      useHighQuality: boolean = false,
      brightness: number = 1,
      exposure: number = 1,
      contrast: number = 1,
      sharpness: number = 0,
    ): string | null => {
      let processedData = depthData;
      let processedWidth = width;
      let processedHeight = height;

      if (useHighQuality) {
        // First enhance the depth data
        const enhanced = enhanceDepthData(depthData, width, height);

        // Then upscale
        const upscaled = upscaleDepthData(enhanced, width, height, 2);
        processedData = upscaled.data;
        processedWidth = upscaled.width;
        processedHeight = upscaled.height;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = processedWidth;
      canvas.height = processedHeight;

      try {
        const imageData = colored
          ? depthToColoredImageData(
              processedData,
              processedWidth,
              processedHeight,
              colormap,
              { brightness, exposure, contrast, sharpness },
            )
          : depthToImageData(
              processedData,
              processedWidth,
              processedHeight,
              { brightness, exposure, contrast, sharpness },
            );

        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
      } catch (error) {
        console.error("Error creating image:", error);
        return null;
      }
    },
    [upscaleDepthData, enhanceDepthData],
  );

  const updateDepthImages = useCallback(
    (
      depthResult: any,
      colormap: "viridis" | "plasma" | "inferno" | "magma" = "viridis",
      brightness: number = 1,
      exposure: number = 1,
      contrast: number = 1,
      sharpness: number = 0,
    ) => {
      if (!depthResult) {
        setDepthImages({ grayscale: null, colored: null });
        setLastDepthResult(null);
        return;
      }

      // Store current state for re-rendering when quality changes
      setLastDepthResult(depthResult);
      setLastColormap(colormap);
      setLastAdjustments({ brightness, exposure, contrast, sharpness });

      const grayscaleImage = createImageFromCanvas(
        depthResult.predicted_depth,
        depthResult.width,
        depthResult.height,
        false,
        colormap,
        highQuality,
        brightness,
        exposure,
        contrast,
        sharpness
      );

      const coloredImage = createImageFromCanvas(
        depthResult.predicted_depth,
        depthResult.width,
        depthResult.height,
        true,
        colormap,
        highQuality,
        brightness,
        exposure,
        contrast,
        sharpness,
      );

      setDepthImages({
        grayscale: grayscaleImage,
        colored: coloredImage,
      });
    },
    [createImageFromCanvas, highQuality],
  );

  const handleMouseMove = useCallback(
    (x: number, y: number, depthResult: any) => {
      if (!depthResult) return;

      setMousePosition({ x, y });

      const depth = getDepthAtCoordinate(
        depthResult.predicted_depth,
        depthResult.width,
        depthResult.height,
        x,
        y,
      );
      setDepthAtMouse(depth);
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
    setDepthAtMouse(null);
  }, []);

  const updateColoredImage = useCallback(
    (
      depthResult: any,
      newColormap: "viridis" | "plasma" | "inferno" | "magma",
      brightness: number,
      exposure: number,
      contrast: number,
      sharpness: number,
    ) => {
      if (!depthResult) return;

      const coloredImage = createImageFromCanvas(
        depthResult.predicted_depth,
        depthResult.width,
        depthResult.height,
        true,
        newColormap,
        highQuality,
        brightness,
        exposure,
        contrast,
        sharpness,
      );

      setDepthImages((prev) => ({
        ...prev,
        colored: coloredImage,
      }));
    },
    [createImageFromCanvas, highQuality],
  );

  const toggleHighQuality = useCallback(() => {
    setHighQuality((prev) => !prev);
  }, []);

  // Effect to re-render images when quality mode changes
  useEffect(() => {
    if (lastDepthResult) {
      updateDepthImages(
        lastDepthResult,
        lastColormap,
        lastAdjustments.brightness,
        lastAdjustments.exposure,
        lastAdjustments.contrast,
        lastAdjustments.sharpness,
      );
    }
  }, [highQuality, lastDepthResult, lastColormap, lastAdjustments, updateDepthImages]);

  return {
    depthImages,
    mousePosition,
    depthAtMouse,
    highQuality,
    updateDepthImages,
    updateColoredImage,
    handleMouseMove,
    handleMouseLeave,
    toggleHighQuality,
  };
};
