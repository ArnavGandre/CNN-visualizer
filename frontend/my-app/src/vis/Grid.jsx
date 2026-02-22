import * as tf from "@tensorflow/tfjs";
import { useEffect, useState } from 'react';
import { useRef } from "react";

function Grid({onGridChange}) {

  // state for recognizing drawing or not
  const [isDrawing, setIsDrawing] = useState(false)
  
  // grid array to keep track of drawing
  const [grid, setGrid] = useState(
    Array.from({ length: 28 }, () =>
      Array(28).fill(0)
  )
);
  const containerRef = useRef(null);

    // brush define:

      const brush = [
        { dr: 0, dc: 0, value: 1 },     // center
        { dr: 1, dc: 0, value: 0.5 },
        { dr: -1, dc: 0, value: 0.5 },
        { dr: 0, dc: 1, value: 0.5 },
        { dr: 0, dc: -1, value: 0.5 },
        { dr: 1, dc: 1, value: 0.2 },
        { dr: 1, dc: -1, value: 0.2 },
        { dr: -1, dc: 1, value: 0.2 },
        { dr: -1, dc: -1, value: 0.2 },
  ];

    // function to draw
  function drawCellClick(row, col) {
      //copy grid
      const newGrid = grid.map(r => [...r]); 
      
      brush.forEach(({dr, dc, value})=>{
        const r = row + dr;
        const c = col + dc;

        //bounds check
      if (r < 0 || r >= 28 || c < 0 || c >= 28) return;
        newGrid[r][c]= Math.min(1, newGrid[r][c] + value);
      });        
      setGrid(newGrid);
      onGridChange?.(newGrid);
      console.log(newGrid)
    }

    // functions called to draw
    function handlePointerDown(e){
      setIsDrawing(true);
      handlePointerMove(e);
      console.log("is drawing now")

    }
    

    
    function handlePointerMove(e){
      if(!isDrawing || !containerRef.current)return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const col = Math.floor(x/15);
      const row = Math.floor(y / 15);

      if(row >=0 && row<28 && col >=0 && col<28){
        drawCellClick(row,col);
      }
    }
    function handlePointerUp(){
      setIsDrawing(false);
    }

  return (

  <div
  ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}>

    {grid.map((row, rowIndex) => (
      <div key={rowIndex} style={{ display: "flex",
        
       }}
      >

        {
          row.map((cell, colIndex) => (
            <div
              key={colIndex}
              style={{
                touchAction: "none",
                width: 15,
                height: 15,
                border: "1px solid gray",
                backgroundColor: `rgb(${cell*255}, ${cell*255}, ${cell*255})`,
                userSelect: "none"
              }}
          />
        )
                  )
        }
      </div>
    ))}
  </div>
);
;
}






export {Grid}