"use client";

import React, { useRef } from "react";
import { Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImageUploadProps {
  selectedFile: File | null;
  isModelLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  progress?: number;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEstimateDepth: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = React.memo(
  ({
    selectedFile,
  isModelLoaded,
  isLoading,
  error,
  progress,
  onFileSelect,
  onEstimateDepth,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Depth Estimation
        </CardTitle>
        <CardDescription>
          Upload an image to estimate depth using the selected model
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select Image</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
              disabled={!isModelLoaded}
            >
              <Upload className="w-4 h-4" />
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileSelect}
              className="hidden"
            />
            {selectedFile && (
              <span className="text-sm text-muted-foreground">
                {selectedFile.name}
              </span>
            )}
          </div>
          {!isModelLoaded && (
            <p className="text-xs text-muted-foreground">
              Please load a model first before uploading an image
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress Bar pro estimate depth */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing image...</span>
              <span>{progress || 0}%</span>
            </div>
            <Progress value={progress || 0} className="w-full" />
          </div>
        )}

        {/* Estimate Button */}
        <Button
          onClick={onEstimateDepth}
          disabled={!selectedFile || isLoading || !isModelLoaded}
          className="w-full"
        >
          {isLoading ? "Estimating Depth..." : "Estimate Depth"}
        </Button>
      </CardContent>
    </Card>
  );
},
);