import { useState, useEffect } from "react";

interface DeviceSupport {
  wasm: boolean;
  webgpu: boolean;
  gpu: boolean;
  cuda: boolean;
}

export const useDeviceSupport = () => {
  const [deviceSupported, setDeviceSupported] = useState<DeviceSupport>({
    wasm: true,
    webgpu: false,
    gpu: false,
    cuda: false,
  });

  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectDeviceSupport = async () => {
      setIsDetecting(true);
      const support = { ...deviceSupported };

      try {
        // Check WebGPU support
        if ("gpu" in navigator) {
          try {
            const adapter = await (navigator as any).gpu.requestAdapter();
            support.webgpu = !!adapter;
          } catch {
            support.webgpu = false;
          }
        }

        // Check WebGL support (proxy for GPU)
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl");
        support.gpu = !!gl;

        // CUDA is typically not available in browser
        support.cuda = false;

        setDeviceSupported(support);
      } catch (error) {
        console.warn("Error detecting device support:", error);
      } finally {
        setIsDetecting(false);
      }
    };

    detectDeviceSupport();
  }, []);

  return {
    deviceSupported,
    isDetecting,
  };
};