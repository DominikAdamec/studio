export const AVAILABLE_MODELS = [
  {
    id: "depth-anything-v2-large",
    name: "Depth Anything V2 Large",
    description: "Best quality, slowest (~150MB)",
    modelPath: "onnx-community/depth-anything-v2-large",
  },
  {
    id: "depth-anything-v2-small",
    name: "Depth Anything V2 Small",
    description: "Fast, balanced quality (~25MB)",
    modelPath: "onnx-community/depth-anything-v2-small",
  },
  {
    id: "depth-anything-v2-base",
    name: "Depth Anything V2 Base",
    description: "Better quality, slower (~90MB)",
    modelPath: "onnx-community/depth-anything-v2-base",
  },
  {
    id: "dpt-hybrid-midas",
    name: "DPT Hybrid MiDaS",
    description: "Alternative model (~45MB)",
    modelPath: "Xenova/dpt-hybrid-midas",
  },
];

export const canModelBeLoaded = (modelId: string) => {
  return AVAILABLE_MODELS.some((model) => model.id === modelId);
};
