import { useEffect, useState } from "react";
import { Load_model } from "./model/load_model";
import { runInferenceLayerwise } from "./model/inference";
import { Grid } from "./vis/Grid";
import "./App.css";
import * as tf from "@tensorflow/tfjs";
import { AnimLayer } from "./vis/NetworkScene";

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
  //grid -> tensor
  function gridToTensor(grid) {
    const flat = grid.flat().map((v) => Number(v));

    return tf.tensor4d(flat, [1, 28, 28, 1], "float32");
  }
  //normalize array
  function normalizeArray(arr) {
    // cche min and max values to calculate once not again again for each element
    const min = Math.min(...arr);
    const max = Math.max(...arr);

    if (max === min) return arr.map(() => 0); // avoid divide by zero

    const range = max - min;
    return arr.map((v) => (v - min) / range);
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
    const allLayers = await runInferenceLayerwise(model, inputTensor);
    setCurrentLayer(allLayers);
    inputTensor.dispose();
  }
  // const dataFinal = handleAnimate();

  if (loading) return <div>Loading model...</div>;

  return (
    <div className="app">
      <header className="header">
        <h1>Convolutional Neural Network Visualizer.</h1>
      </header>

      <main className="main">
        <section className="grid">
          <Grid key={gridKey} onGridChange={setGridData} />
          <div className="buttons">
            <button className="animate-btn" onClick={handleAnimate}>
              animate.
            </button>
            <button className="animate-btn" onClick={handleReset}>
              reset.
            </button>
          </div>
        </section>
      </main>
      <AnimLayer
        layers={currentLayer}
        gridData={gridData}
        prediction={prediction}
      />

      <footer className="output-panel">
        {prediction !== null && <h2>{prediction}</h2>}
      </footer>
    </div>
  );
}

export default App;
