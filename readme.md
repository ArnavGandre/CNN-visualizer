# CNN Visualizer

A browser-based Convolutional Neural Network visualizer built with React and TensorFlow.js. Draw a digit (0–9) on a 28×28 canvas, hit **Animate**, and watch the forward pass travel through every layer of the network — rendered live in Three.js as a particle point cloud.

**Live demo:** [arnavgandre.github.io/CNN-visualizer](https://arnavgandre.github.io/CNN-visualizer/)

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [How the Pipeline Works](#how-the-pipeline-works)
3. [Layer-by-Layer Math and Code](#layer-by-layer-math-and-code)
   - [Input Layer](#1-input-layer)
   - [Conv Layer](#2-convolutional-layer)
   - [Batch Normalization](#3-batch-normalization)
   - [ReLU Activation](#4-relu-activation)
   - [MaxPooling](#5-maxpooling)
   - [Flatten](#6-flatten)
   - [Dense Layer](#7-dense-fully-connected)
   - [Output + Softmax](#8-output-layer--softmax)
4. [Visualizer Logic](#visualizer-logic)
5. [Model Architecture Summary](#model-architecture-summary)
6. [Running Locally](#running-locally)

---

## How the Pipeline Works

```
User draws digit
      ↓
Grid.jsx → 28×28 float array (0.0–1.0)
      ↓
gridToTensor() → tf.Tensor4D [1, 28, 28, 1]
      ↓
runInferenceLayerwise() → builds intermediate model per layer, collects all outputs
      ↓
setCurrentLayer(allLayers) → passes full layer array to NetworkScene
      ↓
AnimLayer (Three.js) → renders each layer as a point cloud, camera pans downward
```

All inference runs **entirely in the browser** using TensorFlow.js. No server, no API calls.

---

## Layer-by-Layer Math and Code

### 1. Input Layer

**Shape:** `[1, 28, 28, 1]`

The user's drawing is a 28×28 grid of values from the `Grid` component, where each cell is in the range `[0.0, 1.0]`:

```
0.0 = black (not drawn)
1.0 = white (fully drawn)
```

**Math:**

The grid is converted to a 4D tensor:

$$X \in \mathbb{R}^{1 \times 28 \times 28 \times 1}$$

The four dimensions are: `[batch, height, width, channels]`. For MNIST, batch = 1 (one image), channels = 1 (grayscale).

**In code** → [`src/App.js`](frontend/my-app/src/App.js):

```js
function gridToTensor(grid) {
  const flat = grid.flat().map((v) => Number(v));
  return tf.tensor4d(flat, [1, 28, 28, 1], "float32");
}
```

`grid.flat()` collapses the 2D array to 1D, then `tf.tensor4d` reshapes it.

**Visualizer brightness:** raw pixel value — how dark or light you drew each cell.

---

### 2. Convolutional Layer

**Shapes:** `[1, 26, 26, 32]` → `[1, 24, 24, 32]` → `[1, 10, 10, 64]` etc.

A conv layer slides a small **kernel** (filter) across the input and computes a dot product at each position. The kernel is a grid of learned weights — not defined by you, learned during training via backpropagation.

**Math:**

For an input $X$ of shape $(1, H, W, C_{in})$, a set of $C_{out}$ filters $W$ of shape $(k_h, k_w, C_{in}, C_{out})$, and biases $b$:

$$Y[n, y, x, k] = \sum_{i=0}^{k_h - 1} \sum_{j=0}^{k_w - 1} \sum_{c=0}^{C_{in} - 1} X[n,\ y+i,\ x+j,\ c] \cdot W[i, j, c, k] + b[k]$$

For a 3×3 kernel with no padding and stride 1:

$$H_{out} = H_{in} - 2 = 28 - 2 = 26$$

**Each of the 32 filters learns to detect a different pattern** — edges, curves, gradients. After training, these patterns are whatever helped the model distinguish digits most effectively.

**In code** → [`src/model/inference.js`](frontend/my-app/src/model/inference.js):

```js
// For each layer, build an intermediate model up to that layer
const intermediateModel = tf.model({
  inputs: model.inputs,
  outputs: layer.output,
});
const output = intermediateModel.predict(inputTensor);
```

TensorFlow.js handles the convolution math internally. The kernel weights are loaded from the saved model in `/public`.

**Visualizer brightness:** how strongly that filter detected its pattern at each spatial position. Bright = strong detection, dark = no detection.

---

### 3. Batch Normalization

**Shape:** same as preceding conv layer (e.g. `[1, 26, 26, 32]`)

Batch normalization rescales activations channel-wise so they have mean ≈ 0 and standard deviation ≈ 1. This stabilizes training and prevents activations from blowing up or vanishing.

**Math:**

For each channel $k$, compute the mean $\mu_k$ and variance $\sigma_k^2$ across the batch:

$$\hat{x} = \frac{x - \mu_k}{\sqrt{\sigma_k^2 + \varepsilon}}$$

Then apply learned scale $\gamma_k$ and shift $\beta_k$ (trained via backprop):

$$y = \gamma_k \hat{x} + \beta_k$$

$\varepsilon$ is a small constant (e.g. $10^{-5}$) to prevent division by zero.

**In code:** handled automatically by TF.js when the layer runs. The $\gamma$, $\beta$, $\mu$, $\sigma$ parameters are stored in the model weights file.

**Visualizer brightness:** same meaning as the preceding conv layer, just re-centered and rescaled. Visually similar to the conv output.

---

### 4. ReLU Activation

**Shape:** unchanged

ReLU (Rectified Linear Unit) introduces non-linearity. Without it, stacking layers would collapse to a single linear transformation and the network couldn't learn complex patterns.

**Math:**

$$y = \max(0,\ x)$$

Applied element-wise. All negative values become exactly 0.

**Why this matters:** a network without non-linearity is just:

$$output = W_3(W_2(W_1 x)) = Wx$$

No matter how many layers you add, it's still one matrix multiply. ReLU breaks this — after ReLU, the network can represent curved decision boundaries, not just hyperplanes.

**In code:** applied automatically by TF.js for `activation` layers.

**Visualizer brightness:** same as post-BN, but negative activations are now hard 0 (pure black). The "dead" dark pixels are truly zero, not just near-zero.

---

### 5. MaxPooling

**Shapes:** `[1, 26, 26, 32]` → `[1, 12, 12, 32]`, `[1, 24, 24, 32]` → `[1, 12, 12, 32]`

MaxPooling downsamples the spatial dimensions by keeping only the maximum value in each 2×2 window.

**Math:**

With pool size 2 and stride 2:

$$Z[n, y, x, k] = \max\bigl(\{Y[n,\ 2y+i,\ 2x+j,\ k]\ \mid\ i, j \in \{0, 1\}\}\bigr)$$

A 26×26 map becomes 13×13. Halved in both dimensions.

**Why this doesn't lose information that matters:**

By the time you reach MaxPool, you're no longer working with raw pixels — you're working with feature maps showing "where was this pattern detected?" MaxPool asks: "Was this pattern detected *anywhere* in this 2×2 region?" The exact pixel position within that region doesn't matter for recognition.

This gives the network **translation invariance** — a digit shifted 1–2 pixels still produces the same high-level features.

**In code:** handled automatically by TF.js for `MaxPooling2D` layers.

**Visualizer brightness:** strongest feature detection per 2×2 region. Sharper and more compressed than the layer above it.

---

### 6. Flatten

**Shape:** `[1, 4, 4, 64]` → `[1, 1024]`

Flattening just reshapes the 3D spatial tensor into a 1D vector so it can be fed into dense layers.

**Math:**

$$flat[c + C \cdot (x + W \cdot y)] = input[y, x, c]$$

Where $H=4$, $W=4$, $C=64$: $4 \times 4 \times 64 = 1024$ values.

**In code:** handled automatically by TF.js for `Flatten` layers.

**Visualizer:** displayed as a 32×32 grid (since $\sqrt{1024} = 32$). Same values, different shape.

---

### 7. Dense (Fully Connected)

**Shape:** `[1, 1024]` → `[1, 256]`

Every input neuron connects to every output neuron with a learned weight. This is where the network combines all the detected features globally to form high-level judgment.

**Math:**

For input $x \in \mathbb{R}^{1024}$, weights $W \in \mathbb{R}^{1024 \times 256}$, bias $b \in \mathbb{R}^{256}$:

$$z_j = \sum_{i=0}^{1023} x_i \cdot W_{i,j} + b_j \quad \text{for } j = 0 \ldots 255$$

Followed by ReLU:

$$a_j = \max(0, z_j)$$

**In code:** handled automatically by TF.js for `Dense` layers.

**Visualizer:** displayed as a 16×16 grid. Each cell = one neuron's activation — how strongly this combination of features fired.

---

### 8. Output Layer + Softmax

**Shape:** `[1, 256]` → `[1, 10]`

The final dense layer produces 10 raw scores (one per digit), then softmax converts them to probabilities.

**Math:**

Dense (same as above, with $W \in \mathbb{R}^{256 \times 10}$):

$$s_j = \sum_{i=0}^{255} a_i \cdot W_{i,j} + b_j \quad \text{for } j = 0 \ldots 9$$

Softmax (with numerical stability via subtracting max):

$$p_j = \frac{e^{s_j - \max(s)}}{\displaystyle\sum_{k=0}^{9} e^{s_k - \max(s)}}$$

All $p_j$ sum to exactly 1. The predicted digit is:

$$\hat{y} = \arg\max_j\ p_j$$

**In code** → [`src/App.js`](frontend/my-app/src/App.js):

```js
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
```

**Visualizer:** 10 points in a row. The predicted digit's point is highlighted red and larger. Digit labels 0–9 appear below. A `prediction: X` label appears at the bottom in red.

---

## Visualizer Logic

The Three.js visualization lives in [`src/vis/NetworkScene.jsx`](frontend/my-app/src/vis/NetworkScene.jsx).

**Data flow:**

```
App.js
  └── runInferenceLayerwise(model, tensor)
        └── returns allLayers[]  →  setCurrentLayer(allLayers)
              └── <AnimLayer layers={currentLayer} gridData={gridData} />
                    └── Three.js scene: BufferGeometry + Points per layer
                          └── camera lerps downward via setAnimationLoop
```

**Key decisions:**

| Layer type | Shape | Rendered as |
|---|---|---|
| Input | `[1,28,28,1]` | 28×28 grid |
| Conv/BN/ReLU/Pool | `[1,H,W,C]` | H×W grid (first channel) |
| flatten_1 | `[1,1024]` | 32×32 grid |
| fc1 / dropout_2 | `[1,256]` | 16×16 grid |
| fco | `[1,10]` | 1×10 row, prediction highlighted red |

**Brightness mapping:**

Each point's color is set from its normalized activation value:

```js
// normalizeArray maps all values to [0, 1]
colors.push(value, value, value); // R=G=B → greyscale brightness
```

For the `fco` layer the predicted digit overrides to red:

```js
if (c === prediction) {
  colors.push(1, 0.2, 0.2); // red highlight
}
```

**Camera animation:**

```js
// setInterval fires every 800ms, moves targetY to next layer
targetY = currentIndex * -spacing;

// animation loop lerps camera toward target each frame
camera.position.y += (targetY - camera.position.y) * 0.05;
```

The `0.05` lerp factor gives a smooth ease-in deceleration — moves fast then slows as it approaches.

---

## Model Architecture Summary

| # | Layer | Type | Output Shape | Parameters |
|---|---|---|---|---|
| 0 | input_1 | Input | `[1,28,28,1]` | 0 |
| 1 | conv0 | Conv2D (32 filters, 3×3) | `[1,26,26,32]` | 320 |
| 2 | bn0 | BatchNorm | `[1,26,26,32]` | 128 |
| 3 | activation_1 | ReLU | `[1,26,26,32]` | 0 |
| 4 | conv1 | Conv2D (32 filters, 3×3) | `[1,24,24,32]` | 9248 |
| 5 | bn1 | BatchNorm | `[1,24,24,32]` | 128 |
| 6 | activation_2 | ReLU | `[1,24,24,32]` | 0 |
| 7 | MP1 | MaxPool2D (2×2) | `[1,12,12,32]` | 0 |
| 8 | conv2 | Conv2D (64 filters, 3×3) | `[1,10,10,64]` | 18496 |
| 9 | bn2 | BatchNorm | `[1,10,10,64]` | 256 |
| 10 | activation_3 | ReLU | `[1,10,10,64]` | 0 |
| 11 | conv3 | Conv2D (64 filters, 3×3) | `[1,8,8,64]` | 36928 |
| 12 | bn3 | BatchNorm | `[1,8,8,64]` | 256 |
| 13 | activation_4 | ReLU | `[1,8,8,64]` | 0 |
| 14 | MP2 | MaxPool2D (2×2) | `[1,4,4,64]` | 0 |
| 15 | dropout_1 | Dropout | `[1,4,4,64]` | 0 |
| 16 | flatten_1 | Flatten | `[1,1024]` | 0 |
| 17 | fc1 | Dense (256) | `[1,256]` | 262400 |
| 18 | dropout_2 | Dropout | `[1,256]` | 0 |
| 19 | fco | Dense (10) + Softmax | `[1,10]` | 2570 |

---

## Running Locally

```bash
git clone https://github.com/ArnavGandre/CNN-visualizer.git
cd CNN-visualizer/frontend/my-app
npm install
npm start
```

To deploy to GitHub Pages:

```bash
npm run deploy
```