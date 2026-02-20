import * as tf from "@tensorflow/tfjs";

async function Run_inference(model, inputTensor) {
  try {
    const predictions = model.predict(inputTensor);
    const data = await predictions.data();
    predictions.dispose();
    console.log("Predictions:", data)   ;
    console.log("model shape "+model.layers)
    return data;
  } catch (e) {
    console.error("failed while inference :", e);
  }
}

async function Run_inference_layerwise(model, inputTensor, onLayerResult) {
  let currentInput = inputTensor;

  for (let i = 0; i < model.layers.length; i++) {
    const layer = model.layers[i];

    const intermediateModel = tf.model({
      inputs: model.inputs,
      outputs: layer.output
    });

    const output = intermediateModel.predict(currentInput);
    const data = await output.data();
    const shape = output.shape;

    await onLayerResult({
      layerName: layer.name,
      layerType: layer.getClassName(),
      shape: shape,
      data: data
    });

    output.dispose();
  }
}

export {Run_inference};
export {Run_inference_layerwise};