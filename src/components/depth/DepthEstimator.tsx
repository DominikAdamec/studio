"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDepthEstimation } from "@/hooks/useDepthEstimation";
import { useDeviceSupport } from "@/hooks/useDeviceSupport";
import { useDepthImages } from "@/hooks/useDepthImages";
import { useCanvasPersistence } from "@/hooks/useCanvasPersistence";
import { downloadDepthMap } from "@/utils/depthUtils";
import { AVAILABLE_MODELS } from "@/utils/modelList";
import { ModelManagement } from "./ModelManagement";
import { ImageUpload } from "./ImageUpload";
import { DepthResults } from "./DepthResults";

interface DepthEstimatorProps {
  className?: string;
}

export const DepthEstimator: React.FC<DepthEstimatorProps> = ({
  className,
}) => {
  // Hooks pro depth estimation
  const {
    estimateDepth,
    isLoading,
    error,
    progress,
    loadModel,
    releaseModel, // Přidáno
    modelStatus,
    currentModel,
    modelLoadingProgress,
    realtimeProgress,
    currentModelSize,
  } = useDepthEstimation();

  // Hook pro detekci podpory zařízení
  const { deviceSupported } = useDeviceSupport();

  // Hook pro správu depth images
  const {
    depthImages,
    mousePosition,
    depthAtMouse,
    highQuality,
    updateDepthImages,
    updateColoredImage,
    handleMouseMove,
    handleMouseLeave,
    toggleHighQuality,
  } = useDepthImages();

  // State pro UI
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [selectedModelSize, setSelectedModelSize] = useState<"fp32" | "fp16" | "q8" | "q4" | "int8" | "bnb4" | "bnb8">("fp16");
  const [autoLoadModel, setAutoLoadModel] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("wasm");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [depthResult, setDepthResult] = useState<any>(null);
  const [colormap, setColormap] = useState<
    "viridis" | "plasma" | "inferno" | "magma"
  >("viridis");

  // Refs pro canvas persistence
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coloredCanvasRef = useRef<HTMLCanvasElement>(null);

  // Hook pro canvas persistence
  useCanvasPersistence({ canvasRef, coloredCanvasRef });

  // Handlers pro model management
  const handleLoadModel = useCallback(async () => {
    const selectedModelConfig = AVAILABLE_MODELS.find(
      (m) => m.id === selectedModel,
    );
    if (selectedModelConfig) {
      try {
        await loadModel(selectedModelConfig.modelPath, selectedDevice, selectedModelSize);
        setIsModelLoaded(true);
      } catch (error) {
        console.error("Failed to load model:", error);
        setIsModelLoaded(false);
      }
    }
  }, [selectedModel, selectedDevice, selectedModelSize, loadModel]);

  const handleModelChange = useCallback(
    async (modelId: string) => {
      await releaseModel();
      setSelectedModel(modelId);
      setIsModelLoaded(false);

      if (autoLoadModel) {
        const modelConfig = AVAILABLE_MODELS.find((m) => m.id === modelId);
        if (modelConfig) {
          loadModel(modelConfig.modelPath, selectedDevice, selectedModelSize);
        }
      }
    },
    [autoLoadModel, selectedDevice, selectedModelSize, loadModel, releaseModel],
  );

  const handleDeviceChange = useCallback(
    async (deviceId: string) => {
      await releaseModel();
      setSelectedDevice(deviceId);
      setIsModelLoaded(false);

      if (autoLoadModel && selectedModel) {
        const modelConfig = AVAILABLE_MODELS.find(
          (m) => m.id === selectedModel,
        );
        if (modelConfig) {
          loadModel(modelConfig.modelPath, deviceId, selectedModelSize);
        }
      }
    },
    [autoLoadModel, selectedModel, selectedModelSize, loadModel, releaseModel],
  );

  const handleModelSizeChange = useCallback(
    async (modelSize: "fp32" | "fp16" | "q8" | "q4" | "int8" | "bnb4" | "bnb8") => {
      await releaseModel();
      setSelectedModelSize(modelSize);
      setIsModelLoaded(false);

      if (autoLoadModel && selectedModel) {
        const modelConfig = AVAILABLE_MODELS.find(
          (m) => m.id === selectedModel,
        );
        if (modelConfig) {
          loadModel(modelConfig.modelPath, selectedDevice, modelSize);
        }
      }
    },
    [autoLoadModel, selectedModel, selectedDevice, loadModel, releaseModel],
  );

  // Handlers pro file upload a depth estimation
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        setSelectedFile(file);
        setOriginalImage(URL.createObjectURL(file));
        setDepthResult(null);
      }
    },
    [],
  );

  const handleEstimateDepth = useCallback(async () => {
    if (!selectedFile) return;

    const result = await estimateDepth(selectedFile);
    if (result) {
      console.log("Depth result:", result);
      setDepthResult(result);
    }
  }, [selectedFile, estimateDepth]);

  // Handlers pro depth visualization
  const handleColormapChange = useCallback(
    (newColormap: "viridis" | "plasma" | "inferno" | "magma") => {
      setColormap(newColormap);
      updateColoredImage(depthResult, newColormap);
    },
    [depthResult, updateColoredImage],
  );

  const handleDownloadDepthMap = useCallback(
    (colored: boolean = false) => {
      if (!depthResult) return;

      const filename = `depth_map_${Date.now()}.png`;
      downloadDepthMap(
        depthResult.predicted_depth,
        depthResult.width,
        depthResult.height,
        filename,
        colored,
        colormap,
      );
    },
    [depthResult, colormap],
  );

  const handleMouseMoveWrapper = useCallback(
    (x: number, y: number) => {
      handleMouseMove(x, y, depthResult);
    },
    [handleMouseMove, depthResult],
  );

  // Effects
  useEffect(() => {
    if (autoLoadModel && !isModelLoaded) {
      handleLoadModel();
    }
  }, [autoLoadModel, isModelLoaded, handleLoadModel]);

  useEffect(() => {
    setIsModelLoaded(modelStatus === "loaded");
  }, [modelStatus]);

  useEffect(() => {
    updateDepthImages(depthResult, colormap);
  }, [depthResult, colormap, updateDepthImages]);

  // Effect pro uvolnění modelu při odpojení komponenty
  useEffect(() => {
    return () => {
      releaseModel();
    };
  }, [releaseModel]);

  return (
    <div className={`space-y-6 ${className}`}>
      <ModelManagement
        selectedModel={selectedModel}
        selectedDevice={selectedDevice}
        selectedModelSize={selectedModelSize}
        autoLoadModel={autoLoadModel}
        deviceSupported={deviceSupported}
        modelStatus={modelStatus}
        modelLoadingProgress={modelLoadingProgress}
        realtimeProgress={realtimeProgress}
        currentModel={currentModel}
        error={error}
        onModelChange={handleModelChange}
        onDeviceChange={handleDeviceChange}
        onModelSizeChange={handleModelSizeChange}
        onAutoLoadChange={setAutoLoadModel}
        onLoadModel={handleLoadModel}
      />

      <ImageUpload
        selectedFile={selectedFile}
        isModelLoaded={isModelLoaded}
        isLoading={isLoading}
        error={error}
        progress={progress}
        onFileSelect={handleFileSelect}
        onEstimateDepth={handleEstimateDepth}
      />

      <DepthResults
        originalImage={originalImage}
        depthResult={depthResult}
        depthImages={depthImages}
        colormap={colormap}
        mousePosition={mousePosition}
        depthAtMouse={depthAtMouse}
        highQuality={highQuality}
        onColormapChange={handleColormapChange}
        onDownloadDepthMap={handleDownloadDepthMap}
        onMouseMove={handleMouseMoveWrapper}
        onMouseLeave={handleMouseLeave}
        onToggleHighQuality={toggleHighQuality}
      />
    </div>
  );
};
