
import { useState, useEffect, useCallback } from "react";
import {
  depthToImageData,
  depthToColoredImageData,
  getDepthAtCoordinate,
  upscaleDepthData,
  enhanceDepthData,
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
    [],
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
        return;
      }

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

  const toggleHighQuality = useCallback(() => {
    setHighQuality((prev) => !prev);
  }, []);

  return {
    depthImages,
    mousePosition,
    depthAtMouse,
    highQuality,
    updateDepthImages,
    handleMouseMove,
    handleMouseLeave,
    toggleHighQuality,
  };
};
