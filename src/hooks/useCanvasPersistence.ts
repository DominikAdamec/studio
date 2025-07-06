import { useEffect, RefObject } from "react";

interface UseCanvasPersistenceProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  coloredCanvasRef: RefObject<HTMLCanvasElement>;
}

export const useCanvasPersistence = ({
  canvasRef,
  coloredCanvasRef,
}: UseCanvasPersistenceProps) => {
  // Cleanup effect - ukládání canvas dat před odchodem
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Uložíme canvas data do sessionStorage před odchodem
      if (canvasRef.current) {
        const dataURL = canvasRef.current.toDataURL();
        sessionStorage.setItem("depth-grayscale-canvas", dataURL);
      }
      if (coloredCanvasRef.current) {
        const dataURL = coloredCanvasRef.current.toDataURL();
        sessionStorage.setItem("depth-colored-canvas", dataURL);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [canvasRef, coloredCanvasRef]);

  // Restoration effect - obnovování canvas při návratu
  useEffect(() => {
    const restoreCanvas = () => {
      const grayscaleData = sessionStorage.getItem("depth-grayscale-canvas");
      const coloredData = sessionStorage.getItem("depth-colored-canvas");

      if (grayscaleData && canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvasRef.current!.getContext("2d")!;
          canvasRef.current!.width = img.width;
          canvasRef.current!.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
        img.src = grayscaleData;
      }

      if (coloredData && coloredCanvasRef.current) {
        const img = new Image();
        img.onload = () => {
          const ctx = coloredCanvasRef.current!.getContext("2d")!;
          coloredCanvasRef.current!.width = img.width;
          coloredCanvasRef.current!.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
        img.src = coloredData;
      }
    };

    // Obnovíme canvas pokud máme uložená data
    if (sessionStorage.getItem("depth-canvas-ready") === "true") {
      restoreCanvas();
    }
  }, [canvasRef, coloredCanvasRef]);

  const markCanvasReady = () => {
    sessionStorage.setItem("depth-canvas-ready", "true");
  };

  const clearCanvasData = () => {
    sessionStorage.removeItem("depth-grayscale-canvas");
    sessionStorage.removeItem("depth-colored-canvas");
    sessionStorage.removeItem("depth-canvas-ready");
  };

  return {
    markCanvasReady,
    clearCanvasData,
  };
};