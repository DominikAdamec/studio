"use client";

import React from "react";
import { Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { getDepthAtCoordinate } from "@/utils/depthUtils";

interface DepthResultsProps {
  originalImage: string | null;
  depthResult: any;
  depthImages: {
    grayscale: string | null;
    colored: string | null;
  };
  colormap: "viridis" | "plasma" | "inferno" | "magma";
  mousePosition: { x: number; y: number } | null;
  depthAtMouse: number | null;
  highQuality: boolean;
  onColormapChange: (colormap: "viridis" | "plasma" | "inferno" | "magma") => void;
  onDownloadDepthMap: (colored: boolean) => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseLeave: () => void;
  onToggleHighQuality: () => void;
  brightness: number;
  onBrightnessChange: (value: number) => void;
  exposure: number;
  onExposureChange: (value: number) => void;
  // Add similar props for exposure and shadows
}

export const DepthResults: React.FC<DepthResultsProps> = React.memo(
  ({
    originalImage,
  depthResult,
  depthImages,
  colormap,
  mousePosition,
  depthAtMouse,
  highQuality,
  onColormapChange,
  onDownloadDepthMap,
  onMouseMove,
  onMouseLeave,
  onToggleHighQuality,
    brightness,
    onBrightnessChange,
    exposure,
    onExposureChange,
    // Add handlers for exposure and shadows
}) => {
  const handleImageMouseMove = (
    event: React.MouseEvent<HTMLImageElement>,
    imageType: 'grayscale' | 'colored'
  ) => {
    if (!depthResult) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(
      (event.clientX - rect.left) * (depthResult.width / rect.width)
    );
    const y = Math.floor(
      (event.clientY - rect.top) * (depthResult.height / rect.height)
    );

    onMouseMove(x, y);
  };

  if (!originalImage && !depthResult) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Results</CardTitle>
        <CardDescription>
          Original image and depth estimation results
        </CardDescription>

        {/* High Quality Toggle */}
        {depthResult && (
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="high-quality"
              checked={highQuality}
 onCheckedChange={onToggleHighQuality}
            />
            <Label htmlFor="high-quality" className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4" />
              High Quality Mode
              {highQuality && <span className="text-xs text-muted-foreground">(2x upscaled + enhanced)</span>}
            </Label>
          </div>
        )}

        {/* Image Adjustment Sliders */}
        {depthResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="brightness">Brightness ({brightness?.toFixed(2)})</Label>
              <Slider
                id="brightness"
                min={0}
                max={2}
                step={0.01}
                value={[brightness]}
                onValueChange={([value]) => onBrightnessChange(value)}
                disabled={!highQuality}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exposure">Exposure ({exposure?.toFixed(2)})</Label>
              <Slider
                id="exposure"
                min={0}
                max={2}
                step={0.01}
                value={[exposure]}
                onValueChange={([value]) => onExposureChange(value)}
                disabled={!highQuality}
              />
            </div>
            {/* Add similar div for Shadows slider */}
          </div>
        )}

      </CardHeader>
      <CardContent>
        <Tabs defaultValue="depth" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="depth" disabled={!depthResult}>
              Depth (Grayscale)
            </TabsTrigger>
            <TabsTrigger value="colored" disabled={!depthResult}>
              Depth (Colored)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="original" className="space-y-4">
            {originalImage && (
              <div className="flex justify-center">
                <img
                  src={originalImage}
                  alt="Original"
                  className="max-w-full max-h-96 object-contain border rounded"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="depth" className="space-y-4">
            {depthImages.grayscale && (
              <>
                <div className="flex justify-center">
                  <img
                    src={depthImages.grayscale}
                    alt="Depth Map (Grayscale)"
                    className="max-w-full max-h-96 object-contain border rounded cursor-crosshair"
                    onMouseMove={(event) => handleImageMouseMove(event, 'grayscale')}
                    onMouseLeave={onMouseLeave}
                  />
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={() => onDownloadDepthMap(false)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {highQuality ? 'Download Grayscale (Upscaled)' : 'Download Grayscale'}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="colored" className="space-y-4">
            {depthImages.colored && (
              <>
                <div className="space-y-2">
                  <Label>Colormap</Label>
                  <Select value={colormap} onValueChange={onColormapChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viridis">Viridis</SelectItem>
                      <SelectItem value="plasma">Plasma</SelectItem>
                      <SelectItem value="inferno">Inferno</SelectItem>
                      <SelectItem value="magma">Magma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-center">
                  <img
                    src={depthImages.colored}
                    alt="Depth Map (Colored)"
                    className="max-w-full max-h-96 object-contain border rounded cursor-crosshair"
                    onMouseMove={(event) => handleImageMouseMove(event, 'colored')}
                    onMouseLeave={onMouseLeave}
                  />
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={() => onDownloadDepthMap(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Colored
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Depth Info */}
        {mousePosition && depthAtMouse !== null && (
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Position:</span> (
                  {mousePosition.x}, {mousePosition.y})
                </div>
                <div>
                  <span className="font-medium">Depth Value:</span>{" "}
                  {depthAtMouse.toFixed(4)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
});
