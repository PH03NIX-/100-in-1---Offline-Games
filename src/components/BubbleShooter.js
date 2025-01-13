import React, { useState, useEffect, useRef } from 'react';
import './BubbleShooter.css';

const NUM_ROWS = 30; // includes blank rows for bubbles to stick
//const NUM_COLS =11;
const BUBBLE_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
//const INITIAL_ROWS = 18; // Initial filled rows
const BOMB_CHANCE = 0.1; // 10% chance to be a bomb
const ROWBOMB_CHANCE = 0.05; // 5% chance to be a RowBomb

const POINTS_PER_BUBBLE = 10;
const POINTS_PER_BOMB_EXPLOSION = 50;
const POINTS_PER_ROW_EXPLOSION = 100;
const POINTS_PER_FLOATING_BUBBLE = 20;

const BubbleShooter = ({ soundEffects }) => {
  const [grid, setGrid] = useState([]);
  const [currentBubble, setCurrentBubble] = useState(null);
  const [nextBubbles, setNextBubbles] = useState([]);
  const [shooting, setShooting] = useState(false);
  const [shootingBubble, setShootingBubble] = useState(null); // For rendering
  const [aimAngle, setAimAngle] = useState(0);
  const [aimDots, setAimDots] = useState([]);
  const [isAiming, setIsAiming] = useState(false);
  const gameBoardRef = useRef(null);
  const animationFrameRef = useRef(null);
  const shootingBubbleRef = useRef(null); // For animation
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('bubbleShooterHighScore');
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [level, setLevel] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);


  // New state variables for responsive sizing
  const [bubbleSize, setBubbleSize] = useState(40); // Default value
  const [rowHeight, setRowHeight] = useState(30); // Default value

  useEffect(() => {
    calculateBubbleSize();
    window.addEventListener('resize', calculateBubbleSize);
    initializeGame();
    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', calculateBubbleSize);
    };
  }, []);

  /*useEffect(() => {
    if (isLevelComplete) {
      setLevel(prevLevel => prevLevel + 1);
      setIsLevelComplete(false);
      initializeGame();
    }
  }, [isLevelComplete]);  */

  useEffect(() => {
    if (isLevelComplete) {
      setLevel(prevLevel => prevLevel + 1);
      setIsLevelComplete(false);
    }
  }, [isLevelComplete]);
  
  useEffect(() => {
    initializeGame();
  }, [level]);
  
  useEffect(() => {
    console.log('grid changed', grid);
    if(grid.length > 0 && isGridEmpty(grid)) {
      setScore(prevScore => prevScore + 500); // Award 500 points for clearing the level
      setTimeout(() => {
        console.log('Timeout completed, setting level complete');
        setIsLevelComplete(true);
      }, 300);
    }
  }, [grid]);

  
  const getNumCols = (level) => {
    return Math.min(8 + Math.floor((level - 1) / 2), 11);
  };
  
  const getInitialRows = (level) => {
    return Math.min(1 + Math.floor((level) / 2), 18);
  };  

  const resetGame = () => {
    setLevel(1);
    setScore(0);
    setIsGameOver(false);
    initializeGame();
  };  

  const isGridEmpty = (grid) => {
    console.log('grid2', NUM_ROWS,  getNumCols(level), grid);
    for (let row = 0; row < NUM_ROWS; row++) {
      for (let col = 0; col < getNumCols(level); col++) {
        console.log('grid', row, col, grid);
        if (grid[row][col]) {
          return false;
        }
      }
    }
    return true;
  };  

  const checkGameOver = (grid) => {
    const rect = gameBoardRef.current.getBoundingClientRect();
    const shooterY = rect.height - bubbleSize;
    for (let row = 0; row < NUM_ROWS; row++) {
      for (let col = 0; col < getNumCols(level); col++) {
        const bubble = grid[row][col];
        if (bubble) {
          const { y } = getBubblePosition(row, col);
          if (y + bubbleSize > shooterY) {
            return true; // Game over condition met
          }
        }
      }
    }
    if (isGameOver) {
      soundEffects.play('gameOver'); // Play gameOver sound when game ends
    }
    return isGameOver;
  };  

  const calculateBubbleSize = () => {
    const NUM_COLS = getNumCols(level);
    const screenWidth = window.innerWidth;
    const calculatedBubbleSize = screenWidth / (NUM_COLS + 0.5);
    setBubbleSize(calculatedBubbleSize);
    setRowHeight((calculatedBubbleSize * 3) / 4);
  };  

  const initializeGame = () => {
    const NUM_COLS = getNumCols(level);
    const INITIAL_ROWS = getInitialRows(level);
    const newGrid = [];
    const topRowBombCol = Math.floor(Math.random() * NUM_COLS); // Random column for top row RowBomb
    for (let row = 0; row < NUM_ROWS; row++) {
      const cols = [];
      for (let col = 0; col < NUM_COLS; col++) {
        if (row < INITIAL_ROWS) {
          const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
          let isBomb = false;
          let isRowBomb = false;
  
          if (row === 0 && col === topRowBombCol) {
            // Ensure top row has at least one RowBomb
            isRowBomb = true;
          } else if (Math.random() < BOMB_CHANCE) {
            isBomb = true;
          } else if (Math.random() < ROWBOMB_CHANCE) {
            isRowBomb = true;
          }
  
          cols.push({ id: `${row}-${col}`, color, row, col, isBomb, isRowBomb });
        } else {
          cols.push(null);
        }
      }
      newGrid.push(cols);
    }
    setGrid(newGrid);
    setCurrentBubble(generateRandomBubble());
    setNextBubbles([generateRandomBubble(), generateRandomBubble()]);
  };
  

  const generateRandomBubble = () => {
    const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    return { color };
  };

  const handleTouchStart = (e) => {
    if (shooting) return;
    const touch = e.touches[0];
    calculateAimAngle(touch.clientX, touch.clientY);
    setIsAiming(true);
  };

  const handleTouchMove = (e) => {
    if (!isAiming) return;
    const touch = e.touches[0];
    calculateAimAngle(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    if (!isAiming) return;
    setIsAiming(false);
    shootBubble();
  };

  const calculateAimAngle = (x, y) => {
    const rect = gameBoardRef.current.getBoundingClientRect();
    const shooterX = rect.width / 2;
    const shooterY = rect.height;
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    const angle = Math.atan2(relativeY - shooterY, relativeX - shooterX);

    const maxAngleOffset = (80 * Math.PI) / 180; // 80 degrees in radians
    const minAngle = -Math.PI / 2 - maxAngleOffset;
    const maxAngle = -Math.PI / 2 + maxAngleOffset;
    const clampedAngle = Math.max(minAngle, Math.min(maxAngle, angle));

    setAimAngle(clampedAngle);
    calculateAimDots(clampedAngle);
  };

  const calculateAimDots = (angle) => {
    const dots = [];
    const rect = gameBoardRef.current.getBoundingClientRect();
    const shooterX = rect.width / 2;
    const shooterY = rect.height;
    let x = shooterX;
    let y = shooterY;
    let dx = Math.cos(angle);
    let dy = Math.sin(angle);
    for (let i = 0; i < 20; i++) {
      x += dx * 15;
      y += dy * 15;
      if (x <= 0 || x >= rect.width) {
        dx = -dx;
        x = Math.max(0, Math.min(rect.width, x));
      }
      if (y <= 0) {
        y = 0;
        break;
      }
      dots.push({ x, y });
    }
    setAimDots(dots);
  };

  const shootBubble = () => {
    if (shooting || !currentBubble) return;
    setShooting(true);
    soundEffects.play('lazer'); // Play lazer sound when shooting
    setAimDots([]);
    setCurrentBubble(nextBubbles[0]);
    setNextBubbles([nextBubbles[1], generateRandomBubble()]);
    const rect = gameBoardRef.current.getBoundingClientRect();
    const shooterX = rect.width / 2 - bubbleSize / 2;
    const shooterY = rect.height - bubbleSize;
    const speed = 15;
    const dx = Math.cos(aimAngle) * speed;
    const dy = Math.sin(aimAngle) * speed;
    const bubble = { x: shooterX, y: shooterY, dx, dy, color: currentBubble.color };

    shootingBubbleRef.current = bubble;
    setShootingBubble(bubble); // For rendering
    animationFrameRef.current = requestAnimationFrame(updateShootingBubble);
  };

  const updateShootingBubble = () => {
    const bubble = shootingBubbleRef.current;
    if (!bubble) return;
  
    let { x, y, dx, dy, color } = bubble;
    x += dx;
    y += dy;
    const rect = gameBoardRef.current.getBoundingClientRect();
  
    // Handle wall collisions
    if (x <= 0 || x >= rect.width - bubbleSize) {
      dx = -dx;
      x = Math.max(0, Math.min(rect.width - bubbleSize, x));
      soundEffects.play('gameAction'); // Play sound on wall bounce
    }
  
    // Check for top collision
    if (y <= 0) {
      const { col } = getGridPosition(x, y);
      attachBubble(0, col, color);
      shootingBubbleRef.current = null;
      setShootingBubble(null);
      setShooting(false);
      return;
    }
  
    // Check for collision with existing bubbles
    const collision = checkCollision(x, y);
    if (collision) {
      const { row, col, bubble: collidedBubble } = collision;
      if (collidedBubble.isBomb) {
        // Handle bomb explosion
        handleBombExplosion(row, col);
      } else {
        const { row: targetRow, col: targetCol } = findNearestEmptyNeighbor(row, col, x, y);
        if (targetRow !== null && targetCol !== null) {
          attachBubble(targetRow, targetCol, color);
          const neighbors = getPotentialNeighborPositions(targetRow, targetCol);
    
          // Check for neighboring bombs
          const bombNeighbor = neighbors.find(([nRow, nCol]) => 
            nRow >= 0 && nRow < getNumCols(level) &&
            nCol >= 0 && nCol < getNumCols(level) &&
            grid[nRow][nCol] &&
            grid[nRow][nCol].isBomb
          );

          if (bombNeighbor) {
            const [bombRow, bombCol] = bombNeighbor;
            handleBombExplosion(bombRow, bombCol);
          }
        }
      }
      shootingBubbleRef.current = null;
      setShootingBubble(null);
      setShooting(false);
      soundEffects.play('gameAction'); // Play sound when bubble attaches
      return;
    }
  
    shootingBubbleRef.current = { x, y, dx, dy, color };
    setShootingBubble(shootingBubbleRef.current); // Update state for rendering
  
    animationFrameRef.current = requestAnimationFrame(updateShootingBubble);
  };
  
  

  const checkCollision = (x, y) => {
    for (let row = 0; row < NUM_ROWS; row++) {
      for (let col = 0; col < getNumCols(level); col++) {
        const bubble = grid[row][col];
        if (bubble) {
          const { x: bubbleX, y: bubbleY } = getBubblePosition(row, col);
          const dist = Math.hypot(
            x + bubbleSize / 2 - bubbleX - bubbleSize / 2,
            y + bubbleSize / 2 - bubbleY - bubbleSize / 2
          );
          if (dist < bubbleSize * 0.8) {
            return { row, col, bubble };
          }
        }
      }
    }
    return null;
  };

  const handleBombExplosion = (row, col) => {
    soundEffects.play('boom'); // Play boom sound for bomb explosion
    const newGrid = grid.map((rowArr) => rowArr.slice());
    const bubblesToRemove = [];
    let pointsEarned = POINTS_PER_BOMB_EXPLOSION;

    // Include the bomb bubble
    if (newGrid[row][col]) {
      newGrid[row][col].isExploding = true;
      bubblesToRemove.push([row, col]);
    }

    // Get neighboring bubbles
    const neighbors = getNeighbors(row, col);
    neighbors.forEach(([nRow, nCol]) => {
      if (newGrid[nRow][nCol]) {
        newGrid[nRow][nCol].isExploding = true;
        bubblesToRemove.push([nRow, nCol]);
        pointsEarned += POINTS_PER_BUBBLE;
      }
    });

    // Remove bubbles after animation
    setTimeout(() => {
      bubblesToRemove.forEach(([r, c]) => {
        newGrid[r][c] = null;
      });
      // Remove floating bubbles
      const { finalGrid, floatingBubbles } = removeFloatingBubbles(newGrid);
      pointsEarned += floatingBubbles.length * POINTS_PER_FLOATING_BUBBLE;
      
      // Update score and high score
      setScore(prevScore => {
        const newScore = prevScore + pointsEarned;
        setHighScore(prevHighScore => {
          const newHighScore = Math.max(prevHighScore, newScore);
          localStorage.setItem('bubbleShooterHighScore', newHighScore.toString());
          return newHighScore;
        });
        return newScore;
      });

      // Check if the grid is empty after all updates
      if (isGridEmpty(finalGrid)) {
        setScore(prevScore => prevScore + 500); // Award 500 points for clearing the level
        setIsLevelComplete(true);
      } else {
        setGrid(finalGrid);
      }
    }, 300); // Duration matches the explosion animation

    setGrid(newGrid); // Set the initial explosion state
  };

  const findNearestEmptyNeighbor = (row, col, x, y) => {
    const neighbors = getPotentialNeighborPositions(row, col);
    let minDist = Infinity;
    let targetRow = null;
    let targetCol = null;

    for (const [nRow, nCol] of neighbors) {
      if (
        nRow >= 0 &&
        nRow < NUM_ROWS &&
        nCol >= 0 &&
        nCol < getNumCols(level) &&
        !grid[nRow][nCol]
      ) {
        const { x: nx, y: ny } = getBubblePosition(nRow, nCol);
        const dist = Math.hypot(
          x + bubbleSize / 2 - nx - bubbleSize / 2,
          y + bubbleSize / 2 - ny - bubbleSize / 2
        );
        if (dist < minDist) {
          minDist = dist;
          targetRow = nRow;
          targetCol = nCol;
        }
      }
    }

    if (targetRow !== null && targetCol !== null) {
      return { row: targetRow, col: targetCol };
    } else {
      // No empty neighbor found, attach to the colliding bubble's position
      return { row, col };
    }
  };

  const getPotentialNeighborPositions = (row, col) => {
    const isEvenRow = row % 2 === 0;
    const directions = [
      [-1, 0], // Up
      [-1, isEvenRow ? -1 : 1], // Up-Left or Up-Right
      [0, -1], // Left
      [0, 1], // Right
      [1, 0], // Down
      [1, isEvenRow ? -1 : 1], // Down-Left or Down-Right
    ];
    const positions = [];
    for (const [dr, dc] of directions) {
      positions.push([row + dr, col + dc]);
    }
    return positions;
  };

  const attachBubble = (row, col, color) => {
    if (row >= NUM_ROWS || col < 0 || col >= getNumCols(level)) {
      // Bubble is out of bounds
      return;
    }
  
    const newGrid = grid.map((rowArr) => rowArr.slice());
    newGrid[row][col] = { id: `${row}-${col}-${Date.now()}`, color, row, col, isBomb: false, isRowBomb: false };
  
    // Now call checkForMatches with the newGrid
    checkForMatches(row, col, color, newGrid);
    if (checkGameOver(newGrid)) {
      setIsGameOver(true);
    } else {
      setGrid(newGrid);
    }    
  };
  
  

  const checkForMatches = (row, col, color, grid) => {
    const matches = findMatches(row, col, color, grid);
    if (matches.length >= 3) {
      // Play the goodMove sound effect
      soundEffects.play('goodMove');

      const bubblesToRemove = [];
      const rowsToExplode = new Set();
      let pointsEarned = 0;
  
      // Check for RowBombs in matches
      matches.forEach(([r, c]) => {
        const bubble = grid[r][c];
        if (bubble.isRowBomb) {
          rowsToExplode.add(r);
        }
        // Add points for each matched bubble
        pointsEarned += POINTS_PER_BUBBLE;
        bubblesToRemove.push([r, c]);
      });
  
      // Handle Row Explosions
      rowsToExplode.forEach((r) => {
        handleRowBombExplosion(r, grid, bubblesToRemove);
        pointsEarned += POINTS_PER_ROW_EXPLOSION;
      });
  
      // Mark bubbles for popping or exploding
      bubblesToRemove.forEach(([r, c]) => {
        const bubble = grid[r][c];
        if (bubble) {
          if (rowsToExplode.has(r)) {
            bubble.isExploding = true;
            bubble.isRowExplosion = true;
          } else {
            bubble.isPopping = true;
          }
        }
      });
  
      // Remove bubbles after animation
      setTimeout(() => {
        const newGrid = grid.map((rowArr) => rowArr.slice());
        bubblesToRemove.forEach(([r, c]) => {
          newGrid[r][c] = null;
        });
  
        // Remove floating bubbles
        const { finalGrid, floatingBubbles } = removeFloatingBubbles(newGrid);
        pointsEarned += floatingBubbles.length * POINTS_PER_FLOATING_BUBBLE;
  
        setGrid(finalGrid);
  
        // Update score
        setScore(prevScore => prevScore + pointsEarned);
  
        // Update high score if necessary
        setHighScore(prevHighScore => {
          const newHighScore = Math.max(prevHighScore, score + pointsEarned);
          localStorage.setItem('bubbleShooterHighScore', newHighScore.toString());
          return newHighScore;
        });
      }, 300); // Duration matches the animation
  
      // Update grid to reflect animations
      setGrid([...grid]);
      if (isGridEmpty(grid)) {
        setScore(prevScore => prevScore + 500); // Award 500 points
        setIsLevelComplete(true);
      } else {
        setGrid(grid);
      }      
    } else {
      // No matches found, update the grid with the new bubble attached
      setGrid(grid);
    }
  };
  

  const findMatches = (row, col, color, grid) => {
    const visited = new Set();
    const stack = [[row, col]];
    const matches = [];
  
    while (stack.length) {
      const [r, c] = stack.pop();
      const key = `${r}-${c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const bubble = grid[r] && grid[r][c];
      if (bubble && bubble.color === color && !bubble.isBomb) { // Removed !bubble.isRowBomb
        matches.push([r, c]);
        const neighbors = getNeighbors(r, c);
        neighbors.forEach(([nr, nc]) => {
          const neighborKey = `${nr}-${nc}`;
          if (!visited.has(neighborKey)) {
            const neighborBubble = grid[nr] && grid[nr][nc];
            if (neighborBubble && neighborBubble.color === color && !neighborBubble.isBomb) {
              stack.push([nr, nc]);
            }
          }
        });
      }
    }
  
    return matches;
  };
  

  const handleRowBombExplosion = (row, grid, bubblesToRemove) => {
    soundEffects.play('boom'); // Play boom sound for row bomb explosion
    for (let col = 0; col < getNumCols(level); col++) {
      const bubble = grid[row][col];
      if (bubble && !bubblesToRemove.some(([r, c]) => r === row && c === col)) {
        bubblesToRemove.push([row, col]);
      }
    }
  };

  const popBubbles = (matches, grid) => {
    const newGrid = grid.map((rowArr) => rowArr.slice());
    matches.forEach(([r, c]) => {
      if (newGrid[r][c]) {
        newGrid[r][c].isPopping = true;
      }
    });

    // Remove bubbles after animation
    setTimeout(() => {
      matches.forEach(([r, c]) => {
        newGrid[r][c] = null;
      });
      setGrid(newGrid);
    }, 300); // Duration matches the pop animation

    return newGrid;
  };

  const removeFloatingBubbles = (grid) => {
    const visited = new Set();
    const stack = [];
    for (let col = 0; col < getNumCols(level); col++) {
      if (grid[0][col]) {
        stack.push([0, col]);
      }
    }
    while (stack.length) {
      const [row, col] = stack.pop();
      const key = `${row}-${col}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const neighbors = getNeighbors(row, col);
      neighbors.forEach(([r, c]) => {
        if (grid[r][c]) {
          stack.push([r, c]);
        }
      });
    }
    // Remove unvisited bubbles
    const newGrid = grid.map((rowArr) => rowArr.slice());
    const fallingBubbles = [];
    for (let row = 0; row < NUM_ROWS; row++) {
      for (let col = 0; col < getNumCols(level); col++) {
        const key = `${row}-${col}`;
        if (grid[row][col] && !visited.has(key)) {
          fallingBubbles.push({...newGrid[row][col], row, col});
          newGrid[row][col] = null;
        }
      }
    }
    
    // Animate falling bubbles
    if (fallingBubbles.length > 0) {
      animateFallingBubbles(fallingBubbles);
    }
    
    return { finalGrid: newGrid, floatingBubbles: fallingBubbles };
  };

  const animateFallingBubbles = (fallingBubbles) => {
    // Create temporary elements for falling bubbles
    fallingBubbles.forEach(bubble => {
      const { x, y } = getBubblePosition(bubble.row, bubble.col);
      const element = document.createElement('div');
      element.className = `bubble ${bubble.color} falling`;
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.style.width = `${bubbleSize}px`;
      element.style.height = `${bubbleSize}px`;
      gameBoardRef.current.appendChild(element);
      
      // Remove the element after animation completes
      element.addEventListener('animationend', () => {
        element.remove();
      });
    });
  };

  const getNeighbors = (row, col) => {
    const isEvenRow = row % 2 === 0;
    const directions = [
      [-1, 0], // Up
      [-1, isEvenRow ? -1 : 1], // Up-Left or Up-Right
      [0, -1], // Left
      [0, 1], // Right
      [1, 0], // Down
      [1, isEvenRow ? -1 : 1], // Down-Left or Down-Right
    ];
    const neighbors = [];
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (
        newRow >= 0 &&
        newRow < NUM_ROWS &&
        newCol >= 0 &&
        newCol < getNumCols(level)
      ) {
        neighbors.push([newRow, newCol]);
      }
    }
    return neighbors;
  };

  const calculateScore = (poppedBubbles) => {
    // Simple scoring system: 10 points per bubble
    return poppedBubbles * 10;
  };

  const getBubblePosition = (row, col) => {
    const x = col * bubbleSize + (row % 2 === 0 ? 0 : bubbleSize / 2);
    const y = row * rowHeight;
    return { x, y };
  };

  const getGridPosition = (x, y) => {
    const row = Math.floor(y / rowHeight);
    const col = Math.floor((x - (row % 2 === 0 ? 0 : bubbleSize / 2)) / bubbleSize);
    return { row, col };
  };

  useEffect(() => {
    if (isLevelComplete) {
      soundEffects.play('gameWon'); // Play gameWon sound when advancing to next level
      // ... rest of level completion logic ...
    }
  }, [isLevelComplete]);

  return (
    <div className="bubble-shooter-container">
      <div
        className="game-board"
        ref={gameBoardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {grid.map((row, rowIndex) =>
          row.map((bubble, colIndex) => {
            if (bubble) {
              const { x, y } = getBubblePosition(rowIndex, colIndex);
              return (
                <div
                  key={bubble.id}
                  className={`bubble ${bubble.color} ${bubble.isExploding ? 'exploding' : ''} ${
                    bubble.isPopping ? 'popping' : ''
                  } ${bubble.isBomb ? 'bomb' : ''} ${bubble.isRowBomb ? 'rowbomb' : ''} ${
                    bubble.isRowExplosion ? 'same-row' : ''
                  }`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${bubbleSize}px`,
                    height: `${bubbleSize}px`,
                  }}
                ></div>

              );
            }
            return null;
          })
        )}
        {shootingBubble && (
          <div
            className={`bubble ${shootingBubble.color}`}
            style={{
              left: `${shootingBubble.x}px`,
              top: `${shootingBubble.y}px`,
              width: `${bubbleSize}px`,
              height: `${bubbleSize}px`,
            }}
          ></div>
        )}
        {aimDots.map((dot, index) => (
          <div
            key={index}
            className="aim-dot"
            style={{ left: `${dot.x}px`, top: `${dot.y}px` }}
          ></div>
        ))}
      </div>
      <div className="upcoming-bubbles">
        <div className="current-bubble">
          {currentBubble && (
            <div
              className={`bubble ${currentBubble.color}`}
              style={{
                width: `${bubbleSize}px`,
                height: `${bubbleSize}px`,
              }}
            ></div>
          )}
        </div>
        <div className="next-bubbles">
          {nextBubbles.map(
            (bubble, index) =>
              bubble && (
                <div
                  key={index}
                  className={`bubble small ${bubble.color}`}
                  style={{
                    width: `${bubbleSize / 2}px`,
                    height: `${bubbleSize / 2}px`,
                  }}
                ></div>
              )
          )}
        </div>
        <div className="score-container">
          <div className="score-box">
            <div className="score-label">SCORE</div>
            <div className="score-value">{score}</div>
          </div>
          <div className="score-box high-score">
            <div className="score-label">BEST</div>
            <div className="score-value">{highScore}</div>
          </div>
          <div className="score-box level">
            <div className="score-label">LEVEL</div>
            <div className="score-value">{level}</div>
          </div>
        </div>
      </div>
      {isGameOver && (
        <div className="game-over">
          <h1>Game Over</h1>
          <h1>Level: {level}</h1>
          <h1>Score: {score}</h1>
          <h1>Best: {highScore}</h1>
          <button onClick={resetGame}>Restart Game</button>
        </div>
      )}

    </div>
  );
};

export default BubbleShooter;
