import { useState, useEffect } from "react";

interface DeviceSupport {
  auto: boolean;
  wasm: boolean;
  webgpu: boolean;
  gpu: boolean;
  webnn: boolean;
  "webnn-gpu": boolean;
  "webnn-npu": boolean;
  "webnn-cpu": boolean;
}

export const useDeviceSupport = () => {
  const [deviceSupported, setDeviceSupported] = useState<DeviceSupport>({
    auto: true,
    wasm: true,
    webgpu: false,
    gpu: false,
    webnn: false,
    "webnn-gpu": false,
    "webnn-npu": false,
    "webnn-cpu": false,
  });

  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectDeviceSupport = async () => {
      setIsDetecting(true);
      const support: DeviceSupport = {
        auto: true,
        wasm: true,
        webgpu: false,
        gpu: false,
        webnn: false,
        "webnn-gpu": false,
        "webnn-npu": false,
        "webnn-cpu": false,
      };

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

        // Check WebNN (CoreML on Apple) support
        if ('ml' in navigator && (navigator as any).ml.createContext) {
            try {
                support.webnn = true; // If the API exists, we'll consider the general option available
                support['webnn-gpu'] = !!(await (navigator as any).ml.createContext({ deviceType: 'gpu' }));
                support['webnn-npu'] = !!(await (navigator as any).ml.createContext({ deviceType: 'npu' }));
                support['webnn-cpu'] = !!(await (navigator as any).ml.createContext({ deviceType: 'cpu' }));
            } catch (e) {
                console.warn("WebNN context creation failed, disabling options.", e);
                support.webnn = false;
                support['webnn-gpu'] = false;
                support['webnn-npu'] = false;
                support['webnn-cpu'] = false;
            }
        }


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
