import { useEffect } from "react";
import { useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import { Grid } from "./Grid";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";


export function AnimLayer({ data }) {
  <Grid></Grid>
  const canvasRef = useRef();
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

export default AnimLayer;