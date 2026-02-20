import * as tf from "@tensorflow/tfjs";

export function canvasToTensor(canvas) {
    const tmpCtx = tmpCanvas.getContext("2d");
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = 28;
    tmpCanvas.height = 28;

  // shrink 
  tmpCtx.drawImage(canvas, 0, 0, 28, 28);
  const imageData = tmpCtx.getImageData(0, 0, 28, 28);
  const pixels = [];

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i]; 
    pixels.push(r / 255);
  }

  return tf.tensor4d(pixels, [1, 28, 28, 1]);
}
