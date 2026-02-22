import * as tf from "@tensorflow/tfjs";
import { useEffect, useState } from 'react';


function Grid({onGridChange}) {

  const [isDrawing, setIsDrawing] = useState(false)

    // state for recognizing drawing or not


    // grid array to keep track of drawing
    const [grid, setGrid] = useState(
    Array.from({ length: 28 }, () =>
        Array(28).fill(0)
    )
    );
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
        })

        
        setGrid(newGrid);
        onGridChange?.(newGrid);
        console.log(newGrid)
    }

    // functions called to draw
    function handleMouseDown(row,col){
      setIsDrawing(true);
      drawCellClick(row,col);

    }
    function handleMouseEnter(row,col){
      if(isDrawing){
        drawCellClick(row,col);
      }
    }
    function handleMouseUp(){
      setIsDrawing(false);
    }

    // declaring array to draw
  const columns = Array.from({ length: 28 }, (_, i) => i);
  const rows = Array.from({ length: 28 }, (_, i) => i);

  return (

  <div>

    {grid.map((row, rowIndex) => (
      <div key={rowIndex} style={{ display: "flex" }}>

        {
        
          row.map((cell, colIndex) => (
            <div
              key={colIndex}
              onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
              onMouseEnter={() => handleMouseEnter(rowIndex,colIndex)}
              onMouseUp={()=>handleMouseUp()}

              onTouchStart={() => handleMouseDown(rowIndex, colIndex)}
              onTouchEnd={() => handleMouseEnter(rowIndex,colIndex)}
              onTouchMove={()=>handleMouseUp()}

              // onPointerDown={handleMouseDown(rowIndex, colIndex)}
              // onPointerEnter={handleMouseEnter(rowIndex, colIndex)}
              // onMouseUp={handleMouseUp()}

              style={{
                touchAction: "none",
                width: 15,
                height: 15,
                border: "1px solid gray",
                backgroundColor: `rgb(${cell*255}, ${cell*255}, ${cell*255})`,
                userSelect: "none"
              }}
          />
        ))}
      </div>
    ))}
  </div>
);
;
}






export {Grid}