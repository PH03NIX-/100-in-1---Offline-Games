import React, { useState, useEffect } from 'react';
import './CarGridGame.css';
import Confetti from 'react-confetti';

// Predefined difficulties (or sizes)
const DIFFICULTIES = {
  SMALL: { rows: 6, cols: 6, label: 'Easy' },
  MEDIUM: { rows: 8, cols: 8, label: 'Medium' },
  LARGE: { rows: 14, cols: 10, label: 'Hard' },
  XLARGE: { rows: 18, cols: 12, label: 'Extreme' },
  XXLARGE: { rows: 24, cols: 14, label: 'Rediculous' },
};

const CAR_SIZES = [2, 3, 4]; // length of the car in cells

// Four directions the car might face
const DIRECTIONS = [0, 90, 180, 270];

function CarGridGame({ playtime, gamePaused, setIsTimerActive, soundEffects }) {
  const [difficulty, setDifficulty] = useState(DIFFICULTIES.MEDIUM);
  const [grid, setGrid] = useState([]);    // 2D array: null or { carId, indexInCar }
  const [cars, setCars] = useState([]);    // Array of { id, row, col, length, orientation, cells: [...] }
  const [gameOver, setGameOver] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isWin, setIsWin] = useState(false);

  useEffect(() => {
    // Start new game on mount
    initializeGame();
  }, []);

  useEffect(() => {
    // If the game is not over, allow timer
    setIsTimerActive(!gamePaused && !gameOver);
  }, [gamePaused, gameOver, setIsTimerActive]);

  useEffect(() => {
    if (cars.length === 0 && grid.length > 0) {
      setIsWin(true);
      soundEffects.play('gameWon');
    }
  }, [cars, grid, soundEffects]);

  const initializeGame = (newDifficulty = null) => {
    const diff = newDifficulty || difficulty;
    // Create an empty grid
    const emptyGrid = Array.from({ length: diff.rows }, () => Array(diff.cols).fill(null));

    // Randomly place cars
    const { filledGrid, createdCars } = fillGridWithCars(emptyGrid, diff);
    setGrid(filledGrid);
    setCars(createdCars);
    setGameOver(false);
    setIsWin(false);
    // Optional sound
    if (soundEffects) soundEffects.play('gameAction');
  };

  // Fill the grid with random cars in random positions/orientations
  const fillGridWithCars = (emptyGrid, diff) => {
    const newGrid = emptyGrid.map(row => [...row]);
    const placedCars = [];
    let carIdCounter = 1;

    // Track directional constraints
    const rowDirections = Array(diff.rows).fill(null); // null=none, 'right'=→, 'left'=←
    const colDirections = Array(diff.cols).fill(null); // null=none, 'up'=↑, 'down'=↓

    let attempts = 0;
    const maxAttempts = diff.rows * diff.cols * 4;

    while (attempts < maxAttempts) {
        attempts++;
        const length = CAR_SIZES[Math.floor(Math.random() * CAR_SIZES.length)];
        const orientation = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

        // Check if orientation conflicts with existing cars
        const { success, row, col, occupiedCells } = tryPlaceCar(newGrid, diff, length, orientation);
        
        if (success) {
            // Check directional constraints
            let directionConflict = false;
            
            if (orientation === 90) { // Right arrow →
                if (rowDirections[row] === 'left') directionConflict = true;
            }
            else if (orientation === 270) { // Left arrow ←
                if (rowDirections[row] === 'right') directionConflict = true;
            }
            else if (orientation === 0) { // Up arrow ↑
                if (colDirections[col] === 'down') directionConflict = true;
            }
            else if (orientation === 180) { // Down arrow ↓
                if (colDirections[col] === 'up') directionConflict = true;
            }

            if (!directionConflict) {
                // Update direction constraints
                if (orientation === 90) rowDirections[row] = 'right';
                else if (orientation === 270) rowDirections[row] = 'left';
                else if (orientation === 0) colDirections[col] = 'up';
                else if (orientation === 180) colDirections[col] = 'down';

                // Place the car
                const carId = `car-${carIdCounter++}`;
                occupiedCells.forEach((cell, idx) => {
                    newGrid[cell.r][cell.c] = { carId, indexInCar: idx };
                });
                placedCars.push({
                    id: carId,
                    row,
                    col,
                    length,
                    orientation,
                    cells: occupiedCells,
                });
            }
        }
    }

    return { filledGrid: newGrid, createdCars: placedCars };
  };

  // Attempt to place a single linear car (1 x length) in the grid
  const tryPlaceCar = (grid, diff, length, orientation) => {
    const isVertical = (orientation === 0 || orientation === 180);
    const randomRow = Math.floor(Math.random() * diff.rows);
    const randomCol = Math.floor(Math.random() * diff.cols);

    const occupiedCells = [];
    if (isVertical) {
      if (orientation === 0) {
        // Up
        if (randomRow - (length - 1) < 0) return { success: false };
        for (let i = 0; i < length; i++) {
          const rr = randomRow - i;
          if (grid[rr][randomCol] !== null) return { success: false };
          occupiedCells.push({ r: rr, c: randomCol });
        }
      } else {
        // Down (orientation=180)
        if (randomRow + (length - 1) >= diff.rows) return { success: false };
        for (let i = 0; i < length; i++) {
          const rr = randomRow + i;
          if (grid[rr][randomCol] !== null) return { success: false };
          occupiedCells.push({ r: rr, c: randomCol });
        }
      }
    } else {
      // Horizontal
      if (orientation === 90) {
        // Right
        if (randomCol + (length - 1) >= diff.cols) return { success: false };
        for (let i = 0; i < length; i++) {
          const cc = randomCol + i;
          if (grid[randomRow][cc] !== null) return { success: false };
          occupiedCells.push({ r: randomRow, c: cc });
        }
      } else {
        // Left (270)
        if (randomCol - (length - 1) < 0) return { success: false };
        for (let i = 0; i < length; i++) {
          const cc = randomCol - i;
          if (grid[randomRow][cc] !== null) return { success: false };
          occupiedCells.push({ r: randomRow, c: cc });
        }
      }
    }
    return { success: true, row: randomRow, col: randomCol, occupiedCells };
  };

  // Add this helper function to check if a car can move
  const canCarMove = (grid, car, diff) => {
    const { row, col, length } = car;

    console.log(`Checking movement for car at (${row},${col}), orientation: ${car.orientation}`);

    switch (car.orientation) {
        case 0: // Up
            // Can move if either: at top edge OR space above is empty
            if (row - length < 0 || (row > 0 && grid[row - length][col] === null)) {
                console.log(`Can move UP`);
                return true;
            }
            break;
        case 180: // Down
            // Can move if either: at bottom edge OR space below is empty
            if (row + length=== diff.rows || (row + length < diff.rows && grid[row + length][col] === null)) {
                console.log(`Can move DOWN`);
                return true;
            }
            break;
        case 90: // Right
            // Can move if either: at right edge OR space to right is empty
            if (col + length === diff.cols || (col + length < diff.cols && grid[row][col + length] === null)) {
                console.log(`Can move RIGHT`);
                return true;
            }
            break;
        case 270: // Left
            // Can move if either: at left edge OR space to left is empty
            if (col - length < 0 || (col > 0 && grid[row][col - length] === null)) {
                console.log(`Can move LEFT`);
                return true;
            }
            break;
    }

    console.log(`No valid moves found for this car`);
    return false;
  };

  // Add checkGameOver function
  const checkGameOver = (grid, cars, diff) => {
    // If no cars left, it's a win, not game over
    if (cars.length === 0) return false;
    
    // Check each car's movement possibility
    for (const car of cars) {
        if (canCarMove(grid, car, diff)) {
            console.log(`Car ${car.id} at (${car.row},${car.col}) can still move`);
            return false; // If any car can move, game is not over
        } else {
            console.log(`Car ${car.id} at (${car.row},${car.col}) is stuck`);
        }
    }
    
    console.log("Game Over: No cars can move!");
    return true;
  };

  // Update handleCellClick to check for game over after each move
  const handleCellClick = async (row, col) => {
    if (gameOver || gamePaused || isMoving) return;
    const cellInfo = grid[row][col];
    if (!cellInfo) return;

    const car = cars.find(c => c.id === cellInfo.carId);
    if (!car) return;

    setIsMoving(true);
    
    const gridCopy = grid.map(row => [...row]);
    const result = await moveCarOffGrid(gridCopy, car, difficulty);
    
    if (result.success) {
        setGrid(result.updatedGrid);
        let updatedCars;
        
        if (!result.updatedCar) {
            // Car was removed
            updatedCars = cars.filter(c => c.id !== car.id);
            setCars(updatedCars);
            soundEffects.play('goodMove');
        } else {
            // Car was moved but stayed on grid
            updatedCars = cars.map(c => 
                c.id === result.updatedCar.id ? result.updatedCar : c
            );
            setCars(updatedCars);
            soundEffects.play('badMove');
            
            // Check for game over with updated cars array
            console.log("Checking for game over after move...");
            if (checkGameOver(result.updatedGrid, updatedCars, difficulty)) {
                console.log("Game Over detected!");
                setGameOver(true);
                setIsTimerActive(false);
                soundEffects.play('gameOver');
            }
        }
    }
    
    setIsMoving(false);
  };

  /**
   * Animate moving the car step by step in its orientation with a 100ms delay.
   * If it goes out of bounds => remove it (return updatedCar=null).
   * If it hits another car => revert to last valid spot.
   * Otherwise, keep going until collision/out-of-bounds.
   */
  const moveCarOffGrid = async (gridCopy, car, diff) => {
    let stepR = 0, stepC = 0;
    if (car.orientation === 0) stepR = -1;  // up
    if (car.orientation === 180) stepR = 1;  // down
    if (car.orientation === 90) stepC = 1;   // right
    if (car.orientation === 270) stepC = -1; // left
  
    // Remove car from its initial position on gridCopy
    car.cells.forEach(({ r, c }) => {
      gridCopy[r][c] = null;
    });
  
    // We'll track the "current" positions as we move
    let currentCells = car.cells.map(pos => ({ ...pos }));
    let lastValidCells = [...currentCells]; // Keep track of the last valid step
  
    while (true) {
      // Prepare the next step
      const nextCells = currentCells.map(({ r, c }) => ({ r: r + stepR, c: c + stepC }));
  
      // 1) Check out-of-bounds
      const outOfBounds = nextCells.some(({ r, c }) => r < 0 || r >= diff.rows || c < 0 || c >= diff.cols);
      if (outOfBounds) {
        // Car drives off the board => do NOT place it back
        return { success: true, updatedCar: null, updatedGrid: gridCopy };
      }
  
      // 2) Check collision
      const collision = nextCells.some(({ r, c }) => gridCopy[r][c] !== null);
      if (collision) {
        // Revert to last valid position
        lastValidCells.forEach((cell, idx) => {
          gridCopy[cell.r][cell.c] = { carId: car.id, indexInCar: idx };
        });
        // Return an updatedCar that has this final position
        const updatedCar = {
          ...car,
          cells: lastValidCells,
          row: lastValidCells[0].r,
          col: lastValidCells[0].c,
        };
        return { success: true, updatedCar, updatedGrid: gridCopy };
      }
  
      // 3) If no collision, place the car in nextCells
      //    This is so the user sees the step visually
      nextCells.forEach((cell, idx) => {
        gridCopy[cell.r][cell.c] = { carId: car.id, indexInCar: idx };
      });
  
      // Update the React state so user sees the step
      setGrid([...gridCopy]); // Force a re-render with new positions
  
      // 4) Wait 100ms for animation
      await new Promise(resolve => setTimeout(resolve, 50));
  
      // 5) Remove the car from that step
      nextCells.forEach(({ r, c }) => {
        gridCopy[r][c] = null;
      });
  
      // 6) Mark lastValidCells as nextCells, then continue
      lastValidCells = nextCells;
      currentCells = nextCells;
    }
  };
  // ...
  

  // Return inline CSS for cell border based on adjacency
  const getCarCellBorderStyle = (rIndex, cIndex, cell, grid) => {
    if (!cell) return {};
    const style = {};

    const carId = cell.carId;
    // top neighbor check
    if (rIndex === 0 || !grid[rIndex - 1][cIndex] || grid[rIndex - 1][cIndex].carId !== carId) {
      style.borderTop = '2px solid #333';
    }
    // bottom neighbor check
    if (rIndex === grid.length - 1 || !grid[rIndex + 1][cIndex] || grid[rIndex + 1][cIndex].carId !== carId) {
      style.borderBottom = '2px solid #333';
    }
    // left neighbor
    if (cIndex === 0 || !grid[rIndex][cIndex - 1] || grid[rIndex][cIndex - 1].carId !== carId) {
      style.borderLeft = '2px solid #333';
    }
    // right neighbor
    if (cIndex === grid[rIndex].length - 1 || !grid[rIndex][cIndex + 1] || grid[rIndex][cIndex + 1].carId !== carId) {
      style.borderRight = '2px solid #333';
    }
    return style;
  };

  const handleDifficultyChange = (e) => {
    const newDiff = Object.values(DIFFICULTIES).find(d => d.label === e.target.value);
    setDifficulty(newDiff);
    initializeGame(newDiff);
  };

  // Render
  return (
    <div className="car-grid-game">
      {isWin && (
        <>
          <Confetti />
          <div className="car-win-message">YOU WIN!</div>
          <button 
            onClick={() => initializeGame()} 
            className="car-win-play-again"
          >
            Play Again
          </button>
        </>
      )}

      {gameOver && !isWin && (
        <div className="car-game-over">
          <h2>Game Over</h2>
          <button onClick={() => initializeGame()}>Play Again</button>
        </div>
      )}

      {/* Difficulty Dropdown */}
      <div className="car-difficulty-select">
        <select
          value={difficulty.label}
          onChange={handleDifficultyChange}
          className="car-difficulty-dropdown"
        >
          {Object.values(DIFFICULTIES).map((diff) => (
            <option key={diff.label} value={diff.label}>
              {diff.label}
            </option>
          ))}
        </select>
      </div>

      {/* Board */}
      <div
        className={`car-board ${isWin ? 'win' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${difficulty.cols}, 1fr)`,
          width: '90vw',
          maxWidth: '600px',
          margin: '90px auto',
          opacity: isMoving ? 0.7 : 1, // Visual feedback during movement
        }}
      >
        {grid.map((row, rIndex) =>
          row.map((cell, cIndex) => {
            // Determine content and styling
            let content = ' ';
            let bg = '#eee';
            let color = '#333';

            if (cell) {
              const car = cars.find((c) => c.id === cell.carId);
              if (car) {
                content = getArrowForOrientation(car.orientation);
                bg = '#f0b27a';  // a nice orange for the car
                color = '#000';
              }
            }

            // Combine background color and border style
            const cellBorderStyle = getCarCellBorderStyle(rIndex, cIndex, cell, grid);

            return (
              <div
                key={`cell-${rIndex}-${cIndex}`}
                className="car-cell"
                style={{
                  backgroundColor: bg,
                  color,
                  aspectRatio: '1 / 1', // Make cell height equal to width
                  ...(difficulty === DIFFICULTIES.XXLARGE && { fontSize: '1em' }),
                  ...cellBorderStyle,
                }}
                onClick={() => handleCellClick(rIndex, cIndex)}
              >
                {content}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function getArrowForOrientation(orientation) {
  switch (orientation) {
    case 0: return '↑';
    case 90: return '→';
    case 180: return '↓';
    case 270: return '←';
    default: return '?';
  }
}

export default CarGridGame;
