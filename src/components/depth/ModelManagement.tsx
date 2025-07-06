"use client";

import React from "react";
import { Settings, RefreshCw, CheckCircle, AlertCircle, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize, formatSpeed, formatTime } from "@/hooks/useDepthEstimation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { AVAILABLE_MODELS } from "@/utils/modelList";

const AVAILABLE_DEVICES = [
  {
    id: "wasm",
    name: "WebAssembly",
    description: "CPU-based, works everywhere",
    icon: "🔧",
  },
  {
    id: "webgpu",
    name: "WebGPU",
    description: "GPU acceleration (modern browsers)",
    icon: "⚡",
  },
  {
    id: "gpu",
    name: "GPU",
    description: "GPU acceleration (if available)",
    icon: "🎮",
  },
  {
    id: "cuda",
    name: "CUDA",
    description: "NVIDIA GPU acceleration",
    icon: "🚀",
  },
];

type ModelSize = "fp32" | "fp16" | "q8" | "q4" | "int8" | "bnb4" | "bnb8";

const MODEL_SIZE_INFO: Record<ModelSize, { name: string; description: string; size: string }> = {
  fp32: { name: "FP32", description: "Full precision, best quality", size: "~100MB" },
  fp16: { name: "FP16", description: "Half precision, good quality", size: "~50MB" },
  q8: { name: "Q8", description: "8-bit quantized, smaller size", size: "~25MB" },
  q4: { name: "Q4", description: "4-bit quantized, fastest", size: "~12MB" },
  int8: { name: "INT8", description: "Integer 8-bit, optimized", size: "~25MB" },
  bnb4: { name: "BNB4", description: "4-bit BitsAndBytes", size: "~12MB" },
  bnb8: { name: "BNB8", description: "8-bit BitsAndBytes", size: "~25MB" },
};

interface RealtimeProgressData {
  percentage: number;
  loaded: number;
  total: number;
  speed?: number;
  eta?: number;
  file?: string;
}

interface ModelManagementProps {
  selectedModel: string;
  selectedDevice: string;
  selectedModelSize: ModelSize;
  autoLoadModel: boolean;
  deviceSupported: { [key: string]: boolean };
  modelStatus: string;
  modelLoadingProgress: number;
  currentModel: string | null;
  error: string | null;
  realtimeProgress: RealtimeProgressData | null;
  onModelChange: (modelId: string) => void;
  onDeviceChange: (deviceId: string) => void;
  onModelSizeChange: (size: ModelSize) => void;
  onAutoLoadChange: (autoLoad: boolean) => void;
  onLoadModel: () => void;
}

const getLoadingStateText = (progress: number): string => {
  if (progress < 10) return "Initializing pipeline...";
  if (progress < 30) return "Starting download...";
  if (progress < 60) return "Downloading model files...";
  if (progress < 80) return "Processing model data...";
  if (progress < 95) return "Loading model into memory...";
  if (progress < 100) return "Finalizing setup...";
  return "Model ready!";
};

export const ModelManagement: React.FC<ModelManagementProps> = React.memo(
  ({
    selectedModel,
  selectedDevice,
  selectedModelSize,
  autoLoadModel,
  deviceSupported,
  modelStatus,
  modelLoadingProgress,
  currentModel,
  error,
  realtimeProgress,
  onModelChange,
  onDeviceChange,
  onModelSizeChange,
  onAutoLoadChange,
  onLoadModel,
}) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Model Settings
        </CardTitle>
        <CardDescription>
          Configure device, model and loading preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Selection */}
        <div className="space-y-2">
          <Label>Compute Device</Label>
          <Select value={selectedDevice} onValueChange={onDeviceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a device" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_DEVICES.map((device) => (
                <SelectItem
                  key={device.id}
                  value={device.id}
                  disabled={!deviceSupported[device.id]}
                >
                  <div className="flex items-center gap-2">
                    <span>{device.icon}</span>
                    <div className="flex flex-row items-center content-center">
                      <span className="font-medium">{device.name}</span>
                      <span className="text-xs px-2 text-muted-foreground">
                        {device.description}
                        {!deviceSupported[device.id] && " (Not supported)"}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label>Select Model</Label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a model" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex justify-center items-center flex-row">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        

        {/* Auto-load Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="auto-load"
            checked={autoLoadModel}
            onCheckedChange={(checked) => onAutoLoadChange(checked === true)}
          />
          <Label htmlFor="auto-load" className="text-sm font-medium">
            Load model automatically
          </Label>
        </div>

        {/* Enhanced Model Status with Loading Details */}
        <div className="space-y-3">
          {/* Status Row */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Status:</span>
              <span
                className={`ml-2 flex items-center gap-1 ${
                  modelStatus === "loaded"
                    ? "text-green-600"
                    : modelStatus === "loading"
                      ? "text-blue-600"
                      : modelStatus === "error"
                        ? "text-red-600"
                        : "text-orange-600"
                }`}
              >
                {modelStatus === "loaded" ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Model Ready
                  </>
                ) : modelStatus === "loading" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading Model...
                  </>
                ) : modelStatus === "error" ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Loading Failed
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Not Loaded
                  </>
                )}
              </span>
            </div>

            {/* Progress Percentage */}
            {modelStatus === "loading" && modelLoadingProgress > 0 && (
              <div className="text-sm font-medium text-blue-600">
                {Math.round(modelLoadingProgress)}%
              </div>
            )}
          </div>

          {/* Detailed Loading State */}
          {modelStatus === "loading" && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{getLoadingStateText(modelLoadingProgress)}</span>
                <span>{Math.round(modelLoadingProgress)}% complete</span>
              </div>
              <Progress value={modelLoadingProgress} className="w-full h-2" />

              {/* Realtime Progress Data */}
              {realtimeProgress && realtimeProgress.total > 0 && (
                <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950 rounded border">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      <span className="font-medium">Stahování:</span>
                      <span>{formatFileSize(realtimeProgress.loaded)} / {formatFileSize(realtimeProgress.total)}</span>
                    </div>
                    <span className="font-medium text-blue-600">
                      {Math.round(realtimeProgress.percentage)}%
                    </span>
                  </div>
                  
                  {realtimeProgress.speed && realtimeProgress.speed > 0 && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>Rychlost:</span>
                        <span className="font-medium">{formatSpeed(realtimeProgress.speed)}</span>
                      </div>
                      {realtimeProgress.eta && realtimeProgress.eta > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>ETA: {formatTime(realtimeProgress.eta)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {realtimeProgress.file && (
                    <div className="text-xs text-muted-foreground truncate">
                      Soubor: {realtimeProgress.file}
                    </div>
                  )}
                </div>
              )}

              {/* Loading Steps Indicator */}
              <div className="flex justify-between text-xs">
                <span
                  className={
                    modelLoadingProgress >= 10
                      ? "text-blue-600"
                      : "text-muted-foreground"
                  }
                >
                  {modelLoadingProgress >= 10 ? "✓" : "○"} Initializing
                </span>
                <span
                  className={
                    modelLoadingProgress >= 30
                      ? "text-blue-600"
                      : "text-muted-foreground"
                  }
                >
                  {modelLoadingProgress >= 30 ? "✓" : "○"} Downloading
                </span>
                <span
                  className={
                    modelLoadingProgress >= 80
                      ? "text-blue-600"
                      : "text-muted-foreground"
                  }
                >
                  {modelLoadingProgress >= 80 ? "✓" : "○"} Loading
                </span>
                <span
                  className={
                    modelLoadingProgress >= 100
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }
                >
                  {modelLoadingProgress >= 100 ? "✓" : "○"} Ready
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Current Model Info */}
        {currentModel && modelStatus === "loaded" && (
          <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-950 p-3 rounded border-l-4 border-green-500">
            <div className="font-medium text-green-700 dark:text-green-300">
              Successfully Loaded:
            </div>
            <div className="mt-1">{currentModel}</div>
          </div>
        )}

        {/* Error Details */}
        {modelStatus === "error" && error && (
          <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950 p-3 rounded border-l-4 border-red-500">
            <div className="font-medium">Error Details:</div>
            <div className="mt-1">{error}</div>
          </div>
        )}

        {/* Load Model Button */}
        {!autoLoadModel && (
          <Button
            onClick={onLoadModel}
            disabled={modelStatus === "loading" || modelStatus === "loaded"}
            className="w-full"
            variant="outline"
          >
            {modelStatus === "loading" ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Loading Model...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Load Model
              </>
            )}
          </Button>
        )}

        {/* Device Support Warning */}
        {!deviceSupported[selectedDevice] && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Selected device may not be supported on this browser. Consider
              using WebAssembly for better compatibility.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
});
