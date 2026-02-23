import { useEffect, useState } from "react";
import { Load_model } from "./model/load_model";
import { Run_inference_layerwise } from "./model/inference";
import { Grid } from "./vis/Grid";
import "./App.css";
import * as tf from "@tensorflow/tfjs";
import { processLayerOutput } from "./func/ProcessLayerOP";
import { Layer } from "./engine/AnimatedLayers";

function App() {
  //reset grid

  const [gridData, setGridData] = useState(null);
  const [gridKey, setGridKey] = useState(0);

  const [model, setModel] = useState(null);

  //store prediction states
  const [prediction, setPrediction] = useState(null);

  //loading screen
  const [loading, setLoading] = useState(true);

  function handleReset() {
    setGridData(null);
    setCurrentLayer([]);
    setPrediction(null);
    setGridKey((prev) => prev + 1);
    // force grid into remounting killing and clear
  }

  useEffect(() => {
    Load_model().then(async (loadedModel) => {
      setModel(loadedModel);
      setLoading(false);
    });
  }, []);

  //normalize array
  function normalizeArray(arr) {
    const min = Math.min(...arr);
    const max = Math.max(...arr);

    if (max === min) return arr.map(() => 0); // avoid divide by zero

    return arr.map((v) => (v - min) / (max - min));
  }

  //grid -> tensor
  function gridToTensor(grid) {
    const flat = grid.flat().map((v) => Number(v));

    return tf.tensor4d(flat, [1, 28, 28, 1], "float32");
  }

  //arg,max for cleaner visualization
  function argMax(arr) {
    let maxIndex = 0;
    let maxValue = arr[0];

    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > maxValue) {
        maxValue = arr[i];
        maxIndex = i;
      }
    }

    return maxIndex;
  }

  //handle animation

  const [currentLayer, setCurrentLayer] = useState([]);
  async function handleAnimate() {
    setCurrentLayer([]);

    const inputTensor = gridToTensor(gridData);

    await Run_inference_layerwise(model, inputTensor, async (layerResult) => {
      console.log(`Layer: ${layerResult.layerName}`, layerResult.shape);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const processed = processLayerOutput(layerResult);
      let flatData;

      if (Array.isArray(processed)) {
        flatData = processed.flat(Infinity);
      } else {
        flatData = Array.from(processed);
      }

      const normalized = normalizeArray(flatData);

      setCurrentLayer((prev) => [
        ...prev,
        {
          ...layerResult,
          activations: normalized,
        },
      ]);

      if (layerResult.shape.length === 2 && layerResult.shape[1] === 10) {
        const data = Array.from(layerResult.data);

        const predictedDigit = argMax(data);

        
        // keeping this console.log for later animation purposes.
        
        const visualProbs = normalizeArray(data);
        console.log("final probabilities ", visualProbs);
        console.log("predicted digi :", predictedDigit);
        
        setPrediction(predictedDigit);
        inputTensor.dispose();
      }
    });
  }

  if (loading) return <div>Loading model...</div>;

  return (
    <div className="app">
      <header className="header">
        <h1>Convolutional Neural Network Visualizer</h1>
      </header>

      <main className="main">
        <section className="input-panel">
          <Grid key={gridKey} onGridChange={setGridData} />
          <button className="animate-btn" onClick={handleAnimate}>
            Animate
          </button>
          <button className="animate-btn" onClick={handleReset}>
            Reset
          </button>
        </section>

        <section className="network-panel"></section>
      </main>
      <section className="network-panel">
        {currentLayer.map((layer, i) => (
          <Layer
            key={i}
            data={layer.activations}
            label={layer.layerName}
            shape={layer.shape}
            isLast={i === currentLayer.length - 1}
          />
        ))}
      </section>
      <footer className="output-panel">
        {prediction !== null && <h2>{prediction}</h2>}
      </footer>
    </div>
  );
}

export default App;
