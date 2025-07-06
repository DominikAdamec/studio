"use client";

import React from "react";
import { DepthEstimator } from "@/components/depth/DepthEstimator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Camera, Zap, Download } from "lucide-react";

export default function DepthPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Depth Estimation</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-4">
          Estimate depth from single images using AI
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary">Depth-Anything-V2</Badge>
          <Badge variant="secondary">Transformers.js</Badge>
          <Badge variant="secondary">WebAssembly</Badge>
        </div>
      </div>

      {/* Main Component */}
      <DepthEstimator className="mb-8" />

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>About Depth Estimation</CardTitle>
          <CardDescription>
            Understanding how depth estimation works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold">How it works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  • Uses the Depth-Anything-V2 model for monocular depth
                  estimation
                </li>
                <li>
                  • Processes images entirely in your browser using WebAssembly
                </li>
                <li>• Generates pixel-wise depth predictions</li>
                <li>• Supports multiple visualization modes</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Applications</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 3D scene reconstruction</li>
                <li>• Augmented reality applications</li>
                <li>• Autonomous navigation</li>
                <li>• Photography and visual effects</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold">Tips for best results</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • Use images with clear depth variations (foreground and
                background objects)
              </li>
              <li>• Avoid images with transparent or reflective surfaces</li>
              <li>
                • Better results with natural outdoor scenes and indoor
                environments
              </li>
              <li>• The model works best with RGB images</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
