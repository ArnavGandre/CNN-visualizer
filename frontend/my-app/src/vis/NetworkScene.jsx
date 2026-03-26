import { useEffect, useRef } from "react";
import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

// argMax function helper
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

export function AnimLayer({ layers, gridData }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!canvasRef.current || !gridData || !layers || layers.length === 0)
      return;

    // sett up three.js scene

    const w = window.innerWidth;
    const h = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(w, h);
    // add spaces
    let maxRows = 0;
    layers.forEach((layer) => {
      if (layer.shape.length === 4) maxRows = Math.max(maxRows, layer.shape[1]);
      else maxRows = Math.max(maxRows, 5);
    });

    const spacing = maxRows + 8;

    function getRowsCols(layer) {
      const shape = layer.shape;
      if (shape.length === 4) {
        return { rows: shape[1], cols: shape[2] };
      } else {
        const name = layer.layerName;
        if (name === "fco")
          return {
            rows: 1,
            cols: 10,
          };
        if (name === "fc1")
          return {
            rows: 16,
            cols: 16,
          };
        if (name === "flatten_1")
          return {
            rows: 32,
            cols: 32,
          };
        if (name === "dropout_2")
          return {
            rows: 16,
            cols: 16,
          };
        // fallback
        const total = shape[1];
        const cols = Math.ceil(Math.sqrt(total));
        const rows = Math.ceil(total / cols);
        return { rows, cols };
      }
    }

    // realize predcition from last layer
    const lastLayer = layers[layers.length - 1];
    const prediction = argMax(Array.from(lastLayer.data));

    // build points for each layer
    for (let i = 0; i < layers.length; i++) {
      const currlayer = layers[i];
      const { rows, cols } = getRowsCols(currlayer);
      const isFco = currlayer.layerName === "fco";

      const positions = [];
      const colors = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const value = currlayer.data[r * cols + c] ?? 0;
          const x = c - cols / 2;
          const y = -(r - rows / 2) + i * -spacing;
          positions.push(x, y, 0);

          if (isFco) {
            // fco: highlight predicted digit red
            if (c === prediction) {
              colors.push(1, 0.2, 0.2); // red
            } else {
              colors.push(value, value, value);
            }
          } else {
            colors.push(value, value, value);
          }
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3),
      );

      const material = new THREE.PointsMaterial({
        // bigger points for fco last layer sanswer layer
        size: isFco ? 2.0 : 0.8,
        vertexColors: true,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);
    }

    // text labels for each layer

    const loader = new FontLoader();

    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",

      (font) => {
        for (let i = 0; i < layers.length; i++) {
          const { cols } = getRowsCols(layers[i]);
          const isFco = layers[i].layerName === "fco";

          // layer name label
          const textGeo = new TextGeometry(layers[i].layerName, {
            font,
            size: 1.2,
            depth: 0.1,
          });

          const textMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
          const textMesh = new THREE.Mesh(textGeo, textMat);
          textMesh.position.set(cols / 2 + 2, i * -spacing, 0);
          scene.add(textMesh);

          // for fco layerad  digit labels and prediction text
          if (isFco) {
            for (let d = 0; d < 10; d++) {
              const digitGeo = new TextGeometry(String(d), {
                font,
                size: 0.8,
                depth: 0.1,
              });

              const digitMat = new THREE.MeshBasicMaterial({
                color: d === prediction ? 0xf3d9dc : 0x555555,
              });

              const digitMesh = new THREE.Mesh(digitGeo, digitMat);
              digitMesh.position.set(d - 5, i * -spacing - 2.5, 0);
              scene.add(digitMesh);
            }

            // big prediction text
            const predGeo = new TextGeometry(`prediction: ${prediction}`, {
              font,
              size: 2,
              depth: 0.2,
            });

            const predMat = new THREE.MeshBasicMaterial({ color: 0xf3d9dc });
            const predMesh = new THREE.Mesh(predGeo, predMat);

            predMesh.position.set(-10, i * -spacing - 6, 0);
            scene.add(predMesh);
          }
        }
      },
    );

    // anim loop to move camera down the network
    let targetY = 0;
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < layers.length) {
        targetY = currentIndex * -spacing;
      } else {
        clearInterval(interval);
      }
    }, 800);

    renderer.setAnimationLoop(() => {
      camera.position.y += (targetY - camera.position.y) * 0.05;
      renderer.render(scene, camera);
    });

    // cleanup on unmount
    return () => {
      clearInterval(interval);
      renderer.setAnimationLoop(null);
      renderer.dispose();
    };
  }, [layers, gridData]);

  return <canvas ref={canvasRef} />;
}

export default AnimLayer;
