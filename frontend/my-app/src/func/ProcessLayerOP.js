import * as tf from "@tensorflow/tfjs";


export function processLayerOutput(layerResult) {
  const flat = Array.from(layerResult.data);
  const shape = layerResult.shape;

  // normalize
  const normalized = normalizeArray(flat);

  // reshape depending on layer
  if (shape.length === 4) {
    const [, h, w] = shape;
    return reshapeTo2D(normalized, h, w);
  }

  if (shape.length === 2) {
    return normalized;
  }

  return normalized;
}

function normalizeArray(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);

  if (max === min) return arr.map(() => 0);

  return arr.map(v => (v - min) / (max - min));
}

function reshapeTo2D(flat, rows, cols) {
  const result = [];

  for (let r = 0; r < rows; r++) {
    result.push(flat.slice(r * cols, (r + 1) * cols));
  }

  return result;
}
