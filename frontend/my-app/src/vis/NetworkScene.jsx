import { useEffect } from "react";
import { useRef } from "react";

import { Layer } from "../engine/AnimatedLayers";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// import { createRoot } from 'react-dom/client'

export function AnimLayer({ data, label, shape, isLast }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(w, h);
  }, []);

  
  if(!data || data.length===0){
    return null;
  }


  return <canvas ref={canvasRef} />;
}
