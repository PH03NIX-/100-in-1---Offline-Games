import React, { useState, useEffect, useCallback } from 'react';
import './FallingBlocksGame.css';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const BLOCK_SIZE = 30; // Size of each block in pixels

const shapes = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

// Generate a random shape
const getRandomShape = () => {
  const shapesArray = Object.keys(shapes);
  const randomShape = shapesArray[Math.floor(Math.random() * shapesArray.length)];
  return { shape: shapes[randomShape], type: randomShape };
};

const FallingBlocksGame = () => {
  const [grid, setGrid] = useState(Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0)));
  const [currentPiece, setCurrentPiece] = useState(getRandomShape());
  const [position, setPosition] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(1000); // Block falling speed in milliseconds

  // Check for collisions with walls or other blocks
  const isCollision = (xOffset = 0, yOffset = 0) => {
    const { shape } = currentPiece;
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] !== 0) {
          const newX = col + position.x + xOffset;
          const newY = row + position.y + yOffset;
          if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT || (newY >= 0 && grid[newY][newX] !== 0)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Merge the current piece into the grid
  const mergePiece = () => {
    const newGrid = [...grid];
    currentPiece.shape.forEach((row, rIndex) => {
      row.forEach((value, cIndex) => {
        if (value !== 0) {
          newGrid[rIndex + position.y][cIndex + position.x] = 1;
        }
      });
    });
    return newGrid;
  };

  // Handle movement and collision checks
  const movePiece = (xOffset, yOffset) => {
    if (!isCollision(xOffset, yOffset)) {
      setPosition((prev) => ({ x: prev.x + xOffset, y: prev.y + yOffset }));
    } else if (yOffset !== 0) {
      const newGrid = mergePiece();
      setGrid(newGrid);
      setCurrentPiece(getRandomShape());
      setPosition({ x: 3, y: 0 });

      if (isCollision(0, 0)) {
        setGameOver(true);
      }
    }
  };

  // Rotate the current piece
  const rotatePiece = () => {
    const { shape } = currentPiece;
    const newShape = shape[0].map((_, colIndex) => shape.map((row) => row[colIndex])).reverse();
    if (!isCollision(0, 0)) {
      setCurrentPiece((prev) => ({ ...prev, shape: newShape }));
    }
  };

  // Clear completed rows and update the score
  const clearRows = () => {
    let newGrid = grid.filter((row) => row.some((cell) => cell === 0));
    const clearedRows = GRID_HEIGHT - newGrid.length;
    newGrid = Array.from({ length: clearedRows }, () => Array(GRID_WIDTH).fill(0)).concat(newGrid);
    setScore((prev) => prev + clearedRows * 100);
    setGrid(newGrid);

    // Increase speed as more rows are cleared
    if (clearedRows > 0) {
      setSpeed((prev) => Math.max(prev - 50, 200));
    }
  };

  useEffect(() => {
    if (!gameOver) {
      const interval = setInterval(() => {
        movePiece(0, 1);
      }, speed);
      return () => clearInterval(interval);
    }
  }, [speed, gameOver]);

  useEffect(() => {
    if (!gameOver) {
      clearRows();
    }
  }, [grid, gameOver]);

  return (
    <div className="falling-blocks-container">
      <div className="game-info">
        <div>Score: {score}</div>
        {gameOver && <div className="game-over">Game Over!</div>}
      </div>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${GRID_WIDTH}, ${BLOCK_SIZE}px)` }}>
        {grid.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`grid-cell ${cell ? 'filled' : ''}`}
              style={{ width: BLOCK_SIZE, height: BLOCK_SIZE }}
            ></div>
          ))
        )}
      </div>
      <div className="controls">
        <button onClick={() => movePiece(-1, 0)}>Left</button>
        <button onClick={() => movePiece(1, 0)}>Right</button>
        <button onClick={() => movePiece(0, 1)}>Down</button>
        <button onClick={rotatePiece}>Rotate</button>
      </div>
    </div>
  );
};

export default FallingBlocksGame;
