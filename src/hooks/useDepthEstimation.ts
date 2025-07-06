"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { pipeline } from "@huggingface/transformers";

// ===== TYPES & INTERFACES =====

/** Výsledek depth estimation operace */
interface DepthEstimationResult {
  depth: any;
  predicted_depth: Float32Array;
  width: number;
  height: number;
}

/** Pipeline pro depth estimation */
interface DepthEstimationPipeline {
  (input: string | File): Promise<any>;
}

/** Podporované typy zařízení */
type DeviceType = "wasm" | "webgpu" | "gpu" | "cuda" | "auto" | "cpu" | "dml" | "webnn" | "webnn-npu" | "webnn-gpu" | "webnn-cpu";

/** Podporované velikosti modelů */
type ModelSize = "fp32" | "fp16" | "q8" | "q4" | "int8" | "bnb4" | "bnb8";

/** Stavy modelu */
type ModelStatus = "idle" | "loading" | "loaded" | "error";

/** Progress callback data */
interface ProgressData {
  status: string;
  loaded?: number;
  total?: number;
  file?: string;
  progress?: number;
}

/** Realtime progress data */
interface RealtimeProgressData {
  percentage: number;
  loaded: number;
  total: number;
  speed?: number;
  eta?: number;
  file?: string;
}

/** Return type hooku */
interface UseDepthEstimationReturn {
  estimateDepth: (imageUrl: string | File) => Promise<DepthEstimationResult | null>;
  loadModel: (modelPath: string, device?: string, modelSize?: ModelSize) => Promise<void>;
  releaseModel: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  progress: number;
  modelStatus: ModelStatus;
  currentModel: string | null;
  modelLoadingProgress: number;
  realtimeProgress: RealtimeProgressData | null;
  availableModelSizes: ModelSize[];
  currentModelSize: ModelSize | null;
}

// ===== CONSTANTS =====

/** Mapování progress stavů na procenta */
const PROGRESS_MAPPING = {
  INIT: 5,
  INITIATE: 10,
  DOWNLOAD_START: 10,
  DOWNLOAD_END: 80,
  LOADING: 85,
  READY: 95,
  FINALIZE: 98,
  COMPLETE: 100,
} as const;

/** Timeouty pro různé operace */
const TIMEOUTS = {
  FINALIZE_DELAY: 200,
  PROGRESS_CLEAR_DELAY: 2000,
  ESTIMATION_CLEAR_DELAY: 1000,
} as const;

/** Progress kroky pro depth estimation */
const ESTIMATION_PROGRESS = {
  START: 0,
  IMAGE_LOADED: 10,
  DIMENSIONS_ACQUIRED: 25,
  ESTIMATION_COMPLETE: 75,
  PROCESSING_COMPLETE: 100,
} as const;

// ===== UTILITY FUNCTIONS =====

/**
 * Formátuje velikost souboru do čitelné podoby
 * @param bytes - Velikost v bytech
 * @returns Formátovaná velikost
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Formátuje rychlost stahování
 * @param bytesPerSecond - Rychlost v bytech za sekundu
 * @returns Formátovaná rychlost
 */
export const formatSpeed = (bytesPerSecond: number): string => {
  return formatFileSize(bytesPerSecond) + "/s";
};

/**
 * Formátuje čas do čitelné podoby
 * @param seconds - Čas v sekundách
 * @returns Formátovaný čas
 */
export const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * Vytvoří progress callback pro načítání modelu s realtime daty
 * @param setProgress - Funkce pro nastavení progress hodnoty
 * @param setRealtimeProgress - Funkce pro nastavení realtime progress dat
 * @returns Progress callback funkce
 */
const createProgressCallback = (
  setProgress: (value: number) => void,
  setRealtimeProgress: (data: RealtimeProgressData | null) => void
) => {
  let startTime = Date.now();
  let lastUpdate = Date.now();
  let lastLoaded = 0;

  return (progress: ProgressData) => {
    //console.log("Loading progress:", progress);
    const now = Date.now();

    switch (progress.status) {
      case "initiate":
        startTime = now;
        lastUpdate = now;
        lastLoaded = 0;
        setProgress(PROGRESS_MAPPING.INITIATE);
        setRealtimeProgress({
          percentage: PROGRESS_MAPPING.INITIATE,
          loaded: 0,
          total: 0,
          file: progress.file
        });
        break;
      case "downloading":
        if (progress.loaded && progress.total) {
          const downloadPercent = Math.round((progress.loaded / progress.total) * 100);
          const mappedProgress = PROGRESS_MAPPING.DOWNLOAD_START + downloadPercent * 0.7;
          setProgress(Math.min(mappedProgress, PROGRESS_MAPPING.DOWNLOAD_END));

          // Výpočet rychlosti a ETA
          const timeDiff = (now - lastUpdate) / 1000; // sekundy
          const bytesDiff = progress.loaded - lastLoaded;
          const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0; // bytes/sec
          const remaining = progress.total - progress.loaded;
          const eta = speed > 0 ? remaining / speed : 0; // sekundy

          setRealtimeProgress({
            percentage: downloadPercent,
            loaded: progress.loaded,
            total: progress.total,
            speed: speed,
            eta: eta,
            file: progress.file
          });

          lastUpdate = now;
          lastLoaded = progress.loaded;
        }
        break;
      case "loading":
        setProgress(PROGRESS_MAPPING.LOADING);
        setRealtimeProgress({
          percentage: PROGRESS_MAPPING.LOADING,
          loaded: 0,
          total: 0,
          file: progress.file
        });
        break;
      case "ready":
        setProgress(PROGRESS_MAPPING.READY);
        setRealtimeProgress({
          percentage: PROGRESS_MAPPING.READY,
          loaded: 0,
          total: 0,
          file: progress.file
        });
        break;
    }
  };
};

/**
 * Načte rozměry obrázku
 * @param imageUrl - URL obrázku
 * @returns Promise s rozměry obrázku
 */
const loadImageDimensions = async (imageUrl: string): Promise<{ width: number; height: number }> => {
  const img = new Image();
  img.crossOrigin = "anonymous";

  return new Promise((resolve, reject) => {
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = imageUrl;
  });
};

/**
 * Škáluje depth data pomocí bilineární interpolace
 * @param originalData - Původní depth data
 * @param originalWidth - Původní šířka
 * @param originalHeight - Původní výška
 * @param targetWidth - Cílová šířka
 * @param targetHeight - Cílová výška
 * @returns Škálovaná depth data
 */
const scaleDepthData = (
  originalData: Float32Array,
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number,
): Float32Array => {
  // Vytvoření dočasného canvasu pro škálování
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = originalWidth;
  tempCanvas.height = originalHeight;
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) {
    console.warn('Could not create 2D context for scaling, falling back to CPU.');
    // Fallback na původní CPU metodu, pokud selže kontext
    // (zde by byla původní implementace bilineární interpolace)
    return originalData; // Pro jednoduchost vracíme původní data
  }

  // Vytvoření ImageData z Float32Array
  // Normalizujeme data na 0-255 a uložíme do RGBA (stačí nám jeden kanál)
  const imageData = tempCtx.createImageData(originalWidth, originalHeight);
  for (let i = 0; i < originalData.length; i++) {
    const value = originalData[i] * 255;
    imageData.data[i * 4] = value;
    imageData.data[i * 4 + 1] = value;
    imageData.data[i * 4 + 2] = value;
    imageData.data[i * 4 + 3] = 255;
  }
  tempCtx.putImageData(imageData, 0, 0);

  // Vytvoření cílového canvasu
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetWidth;
  targetCanvas.height = targetHeight;
  const targetCtx = targetCanvas.getContext('2d');

  if (!targetCtx) {
    console.warn('Could not create target 2D context for scaling.');
    return originalData;
  }

  // Použití drawImage pro hardwarově akcelerované škálování
  targetCtx.imageSmoothingEnabled = true;
  (targetCtx as any).imageSmoothingQuality = 'high'; // 'high' je podporováno v Chrome/Opera
  targetCtx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);

  // Získání dat z cílového canvasu a převedení zpět na Float32Array
  const scaledImageData = targetCtx.getImageData(0, 0, targetWidth, targetHeight);
  const scaledData = new Float32Array(targetWidth * targetHeight);
  for (let i = 0; i < scaledData.length; i++) {
    // Bereme průměr RGB, protože jsme ukládali stejnou hodnotu do všech kanálů
    scaledData[i] = scaledImageData.data[i * 4] / 255;
  }

  return scaledData;
};

/**
 * Zpracuje výsledek depth estimation
 * @param result - Raw výsledek z pipeline
 * @param originalWidth - Původní šířka obrázku
 * @param originalHeight - Původní výška obrázku
 * @returns Zpracovaný výsledek
 */
const processDepthResult = (
  result: any,
  originalWidth: number,
  originalHeight: number,
): DepthEstimationResult => {
  const tensor = result.predicted_depth;
  const height = tensor.dims[0];
  const width = tensor.dims[1];
  const depthData = tensor.data;

  // Škálování na původní rozměry pokud je potřeba
  const scaledDepthData =
    width !== originalWidth || height !== originalHeight
      ? scaleDepthData(depthData, width, height, originalWidth, originalHeight)
      : depthData;

  return {
    depth: result.depth,
    predicted_depth: scaledDepthData,
    width: originalWidth,
    height: originalHeight,
  };
};

// ===== MAIN HOOK =====

/**
 * Hook pro depth estimation s podporou různých modelů a zařízení
 * 
 * Funkce:
 * - Načítání modelů s progress tracking
 * - Depth estimation s progress tracking
 * - Správa stavu modelu
 * - Error handling
 * - Automatické škálování výsledků
 * 
 * @returns Objekt s funkcemi a stavy pro depth estimation
 */
export const useDepthEstimation = (): UseDepthEstimationReturn => {
  // ===== STATE =====
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0);
  const [modelStatus, setModelStatus] = useState<ModelStatus>("idle");
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [realtimeProgress, setRealtimeProgress] = useState<RealtimeProgressData | null>(null);
  const [currentModelSize, setCurrentModelSize] = useState<ModelSize | null>(null);
  const pipelineRef = useRef<DepthEstimationPipeline | null>(null);

  const memoizedProcessDepthResult = useMemo(() => (result: any, originalWidth: number, originalHeight: number) => {
    if (!result) return null;
    return processDepthResult(result, originalWidth, originalHeight);
  }, []);

  // ===== MODEL RELEASE =====

  /**
   * Uvolní model a zdroje
   */
  const releaseModel = useCallback(async () => {
    if (pipelineRef.current) {
      // Některé verze transformers.js mohou mít dispose metodu
      if (typeof (pipelineRef.current as any).dispose === 'function') {
        await (pipelineRef.current as any).dispose();
      }
      pipelineRef.current = null;
    }
    setModelStatus("idle");
    setCurrentModel(null);
    setCurrentModelSize(null);
    setModelLoadingProgress(0);
    setRealtimeProgress(null);
    console.log("Model released.");
  }, []);

  // ===== MODEL LOADING =====

  /**
   * Načte model pro depth estimation
   * @param modelPath - Cesta k modelu
   * @param device - Zařízení pro spuštění modelu
   */
  const loadModel = useCallback(
    async (modelPath: string, device: string = "wasm", modelSize: ModelSize = "fp32") => {
      setModelStatus("loading");
      setError(null);
      setModelLoadingProgress(PROGRESS_MAPPING.INIT);
      setRealtimeProgress(null);

      try {
        console.log(`Loading model: ${modelPath} on device: ${device} with size: ${modelSize}`);

        // Vyčištění předchozího modelu
        if (pipelineRef.current) {
          pipelineRef.current = null;
        }

        // Určení dtype na základě velikosti modelu a zařízení
        let dtype: string;
        switch (modelSize) {
          case "fp16":
            dtype = "fp16";
            break;
          case "fp32":
            dtype = "fp32";
            break;
          case "q8":
          case "int8":
            dtype = "q8";
            break;
          case "q4":
            dtype = "q4";
            break;
          case "bnb4":
            dtype = "bnb4";
            break;
          case "bnb8":
            dtype = "bnb8";
            break;
          default:
            dtype = device === "webgpu" ? "fp16" : "fp32";
        }

        // Vytvoření nového pipeline
        pipelineRef.current = await pipeline("depth-estimation", modelPath, {
          device: device as DeviceType,
          dtype: dtype as any,
          progress_callback: createProgressCallback(setModelLoadingProgress, setRealtimeProgress),
        });

        // Finalizace
        setModelLoadingProgress(PROGRESS_MAPPING.FINALIZE);
        await new Promise((resolve) => setTimeout(resolve, TIMEOUTS.FINALIZE_DELAY));

        // Dokončení
        setCurrentModel(`${modelPath} (${device}, ${modelSize})`);
        setCurrentModelSize(modelSize);
        setModelStatus("loaded");
        setModelLoadingProgress(PROGRESS_MAPPING.COMPLETE);
        console.log(`Model loaded successfully: ${modelPath} on ${device} with ${modelSize}`);

        // Vyčištění progress po 2 sekundách
        setTimeout(() => {
          setModelLoadingProgress(0);
          setRealtimeProgress(null);
        }, TIMEOUTS.PROGRESS_CLEAR_DELAY);
      } catch (err) {
        console.error("Failed to load model:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load model on ${device}: ${errorMessage}`);
        setModelStatus("error");
        setModelLoadingProgress(0);
        setRealtimeProgress(null);
      }
    },
    [],
  );

  // ===== DEPTH ESTIMATION =====

  /**
   * Provede depth estimation na obrázku
   * @param input - Soubor nebo URL obrázku
   * @returns Promise s výsledkem depth estimation
   */
  const estimateDepth = useCallback(
    async (input: string | File): Promise<DepthEstimationResult | null> => {
      // Validace
      if (!pipelineRef.current) {
        setError("No model loaded. Please load a model first.");
        return null;
      }

      if (modelStatus !== "loaded") {
        setError("Model is not ready. Please wait for model to load.");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setProgress(ESTIMATION_PROGRESS.START);

      try {
        // Příprava URL obrázku
        const imageUrl = input instanceof File ? URL.createObjectURL(input) : input;
        setProgress(ESTIMATION_PROGRESS.IMAGE_LOADED);

        // Načtení rozměrů obrázku
        const { width: originalWidth, height: originalHeight } = await loadImageDimensions(imageUrl);
        setProgress(ESTIMATION_PROGRESS.DIMENSIONS_ACQUIRED);

        // Spuštění depth estimation
        const result = await pipelineRef.current(imageUrl);
        setProgress(ESTIMATION_PROGRESS.ESTIMATION_COMPLETE);

        // Zpracování výsledků
        const processedResult = memoizedProcessDepthResult(result, originalWidth, originalHeight);
        setProgress(ESTIMATION_PROGRESS.PROCESSING_COMPLETE);

        // Vyčištění URL pokud byl vytvořen
        if (input instanceof File) {
          URL.revokeObjectURL(imageUrl);
        }

        // Vyčištění progress po 1 sekundě
        setTimeout(() => setProgress(0), TIMEOUTS.ESTIMATION_CLEAR_DELAY);

        return processedResult;
      } catch (err) {
        console.error("Depth estimation failed:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [modelStatus],
  );

  // ===== RETURN =====
 return {
    estimateDepth,
    loadModel,
    releaseModel,
    isLoading,
    error,
    progress,
    modelStatus,
    availableModelSizes: ["fp32", "fp16", "q8", "q4", "int8", "bnb4", "bnb8"],

    currentModel,
    modelLoadingProgress,
    realtimeProgress,
    currentModelSize,
  };
};
    


