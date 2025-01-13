import React, { useState, useEffect, useRef } from 'react';
import './BlockPuzzleGame.css';

/** A library of shape definitions (block offsets) up to 5 blocks */
const SHAPE_LIBRARY = [
  // Single block (no rotations needed)
  [{ row: 0, col: 0 }],

  // Straight line of length 2 (2 rotations)
  [{ row: 0, col: 0 }, { row: 1, col: 0 }],  // Vertical
  [{ row: 0, col: 0 }, { row: 0, col: 1 }],  // Horizontal

  // Straight line of length 3 (2 rotations)
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],  // Vertical
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],  // Horizontal

  // Square 2x2 (no rotations needed - looks the same)
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],

  // "L" shape (4 rotations)
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }],  // Original L
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }],  // Rotated 90°
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: -1, col: 1 }], // Rotated 180°
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 0, col: -1 }], // Rotated 270°

  // "T" shape (4 rotations)
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 1 }],  // T down
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 1, col: 1 }],  // T right
  [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 0, col: 1 }],  // T up
  [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 1, col: 0 }],  // T left

  // "Z" shape (2 rotations)
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }],  // Normal Z
  [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 0 }, { row: 2, col: 0 }],  // Rotated Z

  // Extended "L" shape (4 rotations)
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }],  // Original
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 2, col: 0 }],  // Rotated 90°
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 2 }],  // Rotated 180°
  [{ row: 0, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 2 }, { row: 2, col: 1 }, { row: 2, col: 0 }],  // Rotated 270°
];

const getRandomColor = () => {
  const colors = {
    red: '#ff4136',     // red
    blue: '#0074d9',    // blue
    green: '#2ecc40',   // green
    yellow: '#ffdc00',  // yellow
    purple: '#b10dc9',  // purple
    orange: '#ff851b'   // orange
  };
  const colorKeys = Object.keys(colors);
  return colors[colorKeys[Math.floor(Math.random() * colorKeys.length)]];
};

function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function generateEmptyBoard() {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

/** Creates a shape object from a random shape definition. */
function createRandomShape() {
  const shapeOffsets = SHAPE_LIBRARY[Math.floor(Math.random() * SHAPE_LIBRARY.length)];
  return {
    id: 'shape-' + Math.random().toString(36).substring(2, 9),
    blocks: shapeOffsets,
    color: getRandomColor()
  };
}

// Add this function to calculate shape's center offset
const getShapeCenterOffset = (shape) => {
  const blocks = shape.blocks;
  const minRow = Math.min(...blocks.map(b => b.row));
  const maxRow = Math.max(...blocks.map(b => b.row));
  const minCol = Math.min(...blocks.map(b => b.col));
  const maxCol = Math.max(...blocks.map(b => b.col));
  
  const height = maxRow - minRow + 1;
  const width = maxCol - minCol + 1;
  
  return {
    row: (maxRow + minRow) / 2 + (height % 2 === 0 ? -0.5 : 0),  // Add 0.5 for even heights
    col: (maxCol + minCol) / 2 + (width % 2 === 0 ? -0.5 : 0)    // Add 0.5 for even widths
  };
};

const BlockPuzzleGame = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
  const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(null)));
  const [shapes, setShapes] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('blockPuzzleHighScore');
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  
  // Drag and drop state
  const [draggedShape, setDraggedShape] = useState(null);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [draggedShapePos, setDraggedShapePos] = useState({ x: 0, y: 0 });
  const [hoverCells, setHoverCells] = useState([]);
  const [isValidPlacement, setIsValidPlacement] = useState(false);

  // Ref for board element
  const boardRef = useRef(null);

  // Initialize shapes on mount
  useEffect(() => {
    generateNewShapes();
  }, []);

  // The shape the user has currently selected, or null
  const [selectedShape, setSelectedShape] = useState(null);

  // For hovering highlight
  const [hoverCell, setHoverCell] = useState({ row: null, col: null });

  // Add new state to track which shape is being dragged
  const [draggingShapeId, setDraggingShapeId] = useState(null);

  // Add this state to store cell size
  const [gridCellSize, setGridCellSize] = useState(0);

  // Add new state
  const [isGameOver, setIsGameOver] = useState(false);

  // Add new state for tracking shape generation
  const [isGeneratingShapes, setIsGeneratingShapes] = useState(false);

  // Add new state for tracking the last check count
  const [lastCheckGameOverCount, setLastCheckGameOverCount] = useState(3);

  // Add this to calculate and update cell size when component mounts or window resizes
  useEffect(() => {
    const updateCellSize = () => {
      if (boardRef.current) {
        const boardWidth = boardRef.current.getBoundingClientRect().width;
        setGridCellSize(boardWidth / 9); // 9 is the number of cells in a row
      }
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  useEffect(() => {
    // Generate initial shapes once
    setShapes([createRandomShape(), createRandomShape(), createRandomShape()]);
  }, []);

  useEffect(() => {
    // Pause/Resume timer if needed
    setIsTimerActive(!gamePaused);
  }, [gamePaused, setIsTimerActive]);

  /** Check if shape can be placed at top-left anchor = (row, col). */
  const canPlaceShape = (shape, anchorRow, anchorCol) => {
    for (let b of shape.blocks) {
      const r = anchorRow + b.row;
      const c = anchorCol + b.col;
      if (r < 0 || r >= 9 || c < 0 || c >= 9) return false; // out of board
      if (board[r][c] !== null) return false;         // collision
    }
    return true;
  };

  /** Place shape on board if valid. Returns new board or null if invalid. */
  const placeShapeOnBoard = (shape, anchorRow, anchorCol) => {
    if (!canPlaceShape(shape, anchorRow, anchorCol)) {
      return null;
    }
    const newBoard = board.map((row) => row.slice());
    for (let b of shape.blocks) {
      const r = anchorRow + b.row;
      const c = anchorCol + b.col;
      newBoard[r][c] = { shapeID: shape.id, color: shape.color };
    }
    return newBoard;
  };

  /** Clear completed rows, columns, 3x3 boxes. */
  const clearCompletedLines = (board) => {
    let clearedCells = 0;
    let bonusPoints = 0;

    // 1) Clear full rows
    for (let r = 0; r < 9; r++) {
      const rowFull = board[r].every(cell => cell !== null);
      if (rowFull) {
        clearedCells += 9;  // Count cells cleared
        bonusPoints += 9;   // Add bonus points for full row
        for (let c = 0; c < 9; c++) board[r][c] = null;
      }
    }

    // 2) Clear full columns
    for (let c = 0; c < 9; c++) {
      let colFull = true;
      for (let r = 0; r < 9; r++) {
        if (board[r][c] === null) {
          colFull = false;
          break;
        }
      }
      if (colFull) {
        clearedCells += 9;  // Count cells cleared
        bonusPoints += 9;   // Add bonus points for full column
        for (let r = 0; r < 9; r++) board[r][c] = null;
      }
    }

    // 3) Clear full 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        let allFilled = true;
        for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
          for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
            if (board[r][c] === null) {
              allFilled = false;
              break;
            }
          }
          if (!allFilled) break;
        }
        if (allFilled) {
          clearedCells += 9;  // Count cells cleared
          bonusPoints += 9;   // Add bonus points for full 3x3
          for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
            for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
              board[r][c] = null;
            }
          }
        }
      }
    }

    // Add score for cleared cells and bonuses
    if (clearedCells > 0) {
      setScore(prev => {
        const newScore = prev + clearedCells + bonusPoints;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('blockPuzzleHighScore', newScore.toString());
        }
        return newScore;
      });
    }

    return { newBoard: board, linesCleared: clearedCells > 0 };
  };

  /** Called when the user clicks on a board cell. */
  const handleBoardCellClick = (r, c) => {
    if (gamePaused) return;
    if (!selectedShape) {
      // No shape selected, do nothing
      return;
    }
    // Attempt to place shape
    const newBoard = placeShapeOnBoard(selectedShape, r, c);
    if (!newBoard) {
      // Invalid
      soundEffects.play('badMove');
      return;
    }
    soundEffects.play('goodMove');
    // Clear completed lines
    const { newBoard: clearedBoard, linesCleared } = clearCompletedLines(newBoard);
    if (linesCleared > 0) {
      soundEffects.play('clearLine');
      setScore(score + linesCleared * 10);
    }
    setBoard(clearedBoard);
    // Remove shape from "hand"
    setShapes(shapes.filter(s => s.id !== selectedShape.id));
    setSelectedShape(null);
    setHoverCell({ row: null, col: null });

    // If that was the last shape, add new shapes
    if (shapes.length - 1 === 0) {
      setShapes([createRandomShape(), createRandomShape(), createRandomShape()]);
    }
  };

  /** For hover highlight: checks if (r,c) is a valid anchor for the selected shape. */
  const isHighlightCell = (r, c) => {
    if (!selectedShape || hoverCell.row === null || hoverCell.col === null) return false;
    // anchor is the hoverCell
    const anchorR = hoverCell.row;
    const anchorC = hoverCell.col;
    // check if (r,c) is one of the blocks
    return selectedShape.blocks.some(b => (anchorR + b.row === r) && (anchorC + b.col === c));
  };

  /** Returns true if the currently hovered anchor is a valid placement. */
  const isHoverPlacementValid = () => {
    if (!selectedShape || hoverCell.row === null || hoverCell.col === null) return false;
    return canPlaceShape(selectedShape, hoverCell.row, hoverCell.col);
  };

  /** Renders the 9x9 board with optional highlight. */
  const renderBoard = () => {
    return board.flat().map((cell, index) => {
      const r = Math.floor(index / 9);
      const c = index % 9;
      
      // Cell background
      let backgroundColor = '#fafafa';
      if (cell) {
        backgroundColor = cell.color;
      } else if (hoverCells.some(hc => hc.row === r && hc.col === c)) {
        backgroundColor = isValidPlacement ? 'rgb(127, 231, 127)' : 'rgb(255, 175, 171)';
      }

      return (
        <div
          key={`cell-${r}-${c}`}
          className="board-cell"
          style={{
            backgroundColor,
            borderTop: r % 3 === 0 ? '2px solid #000' : '1px solid #888',
            borderLeft: c % 3 === 0 ? '2px solid #000' : '1px solid #888',
            borderRight: c === 8 ? '2px solid #000' : 'none',
            borderBottom: r === 8 ? '2px solid #000' : 'none'
          }}
        />
      );
    });
  };

  /** Renders each shape in the “hand” area. Clicking a shape selects it. */
  const renderShapes = () => {
    return shapes.map((shape) => (
      <div
        key={shape.id}
        style={{
          display: 'inline-block',
          padding: '10px',
          cursor: 'pointer',
          backgroundColor: (selectedShape && selectedShape.id === shape.id) ? '#aaa' : '#eee',
          margin: '5px'
        }}
        onClick={() => {
          if (!gamePaused) {
            setSelectedShape(shape);
            soundEffects.play('selectShape');
          }
        }}
      >
        {renderShapePreview(shape)}
      </div>
    ));
  };

  /** Renders a small grid preview of a shape. */
  const renderShapePreview = (shape) => {
    const rows = shape.blocks.map(b => b.row);
    const cols = shape.blocks.map(b => b.col);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    const gridRows = maxRow - minRow + 1;
    const gridCols = maxCol - minCol + 1;

    const cells = [];
    for (let rr = 0; rr < gridRows; rr++) {
      const rowCells = [];
      for (let cc = 0; cc < gridCols; cc++) {
        const isBlock = shape.blocks.some(b => b.row === rr + minRow && b.col === cc + minCol);
        rowCells.push(
          <div
            key={`${rr}-${cc}`}
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: isBlock ? shape.color : '#bbb',
              border: '1px solid #999'
            }}
          />
        );
      }
      cells.push(<div key={`row-${rr}`} style={{ display: 'flex' }}>{rowCells}</div>);
    }

    return <div style={{ display: 'inline-block' }}>{cells}</div>;
  };

  const handleTouchStart = (e, shape) => {
    e.preventDefault();
    if (gamePaused) return;
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Set the initial touch position relative to the shape
    setTouchStartPos({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    
    // Set the initial dragged shape position
    setDraggedShapePos({
      x: touch.clientX,
      y: touch.clientY
    });
    
    setDraggedShape(shape);
    setDraggingShapeId(shape.id);  // Set the ID of shape being dragged
    soundEffects.play('gameAction');
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!draggedShape || !boardRef.current) return;

    const touch = e.touches[0];
    
    // Position the shape 100px above the touch point
    setDraggedShapePos({
      x: touch.clientX,
      y: touch.clientY - 80  // Offset by 100px upward
    });

    const boardRect = boardRef.current.getBoundingClientRect();
    const cellSize = boardRect.width / 9;
    
    const centerOffset = getShapeCenterOffset(draggedShape);
    
    // Adjust boardY calculation to match the visual offset
    const boardX = touch.clientX - boardRect.left;
    const boardY = (touch.clientY - 80) - boardRect.top;  // Subtract 100px to match shape position
    
    const gridRow = Math.floor(boardY / cellSize) - centerOffset.row;
    const gridCol = Math.floor(boardX / cellSize) - centerOffset.col;

    const affectedCells = draggedShape.blocks.map(block => ({
      row: Math.floor(gridRow + block.row),
      col: Math.floor(gridCol + block.col)
    }));

    const isValid = checkValidPlacement(affectedCells);
    setIsValidPlacement(isValid);
    setHoverCells(affectedCells);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (!draggedShape) return;

    if (isValidPlacement && hoverCells.length > 0) {
      // Place the shape on the board
      const newBoard = [...board];
      hoverCells.forEach(cell => {
        if (cell.row >= 0 && cell.row < 9 && cell.col >= 0 && cell.col < 9) {
          newBoard[cell.row][cell.col] = { color: draggedShape.color };
        }
      });
      
      setBoard(newBoard);
      soundEffects.play('goodMove');

      // Remove the used shape
      const newShapes = shapes.filter(s => s.id !== draggedShape.id);
      setShapes(newShapes);
      
      // Clear completed lines
      const { newBoard: clearedBoard } = clearCompletedLines(newBoard);
      setBoard(clearedBoard);

      // Generate new shapes if needed
      if (newShapes.length === 0) {
        setShapes([
          createRandomShape(),
          createRandomShape(),
          createRandomShape()
        ]);
      }

      // Check for game over after state updates
      setTimeout(() => {
        checkGameOver();
      }, 300);
    }

    // Reset all drag-related states
    setDraggedShape(null);
    setDraggedShapePos({ x: 0, y: 0 });
    setHoverCells([]);
    setDraggingShapeId(null);
  };

  const generateNewShapes = () => {
    setIsGeneratingShapes(true);
    
    const newShapes = Array(3 - shapes.length)
        .fill()
        .map(() => createRandomShape());
    
    setShapes(prevShapes => {
        setIsGeneratingShapes(false);
        return [...prevShapes, ...newShapes];
    });
    
    setTimeout(() => {
      checkGameOver();
    }, 300);
  };

  const checkValidPlacement = (cells) => {
    return cells.every(cell => 
      cell.row >= 0 && 
      cell.row < 9 && 
      cell.col >= 0 && 
      cell.col < 9 && 
      board[cell.row][cell.col] === null
    );
  };

  /** Check if any of the current shapes can be placed anywhere on the board */
  /*const checkForPossibleMoves = () => {
    if (!shapes || shapes.length === 0) return true;
    
    console.log('Checking for possible moves with shapes:', shapes);
    
    // For each shape
    for (let shape of shapes) {
        // Get the actual shape boundaries
        const minRow = Math.min(...shape.blocks.map(b => b.row));
        const maxRow = Math.max(...shape.blocks.map(b => b.row));
        const minCol = Math.min(...shape.blocks.map(b => b.col));
        const maxCol = Math.max(...shape.blocks.map(b => b.col));
        
        // Try every possible position on the board
        for (let baseRow = -minRow; baseRow < 9 - maxRow; baseRow++) {
            for (let baseCol = -minCol; baseCol < 9 - maxCol; baseCol++) {
                let canPlace = true;
                
                // Check each block of the shape
                for (let block of shape.blocks) {
                    const newRow = baseRow + block.row;
                    const newCol = baseCol + block.col;
                    
                    // Validate position
                    if (newRow < 0 || newRow >= 9 || 
                        newCol < 0 || newCol >= 9 || 
                        board[newRow][newCol] !== null) {
                        canPlace = false;
                        break;
                    }
                }
                
                if (canPlace) {
                    console.log('Found valid move for shape at position:', baseRow, baseCol);
                    return true;
                }
            }
        }
    }
    
    console.log('No valid moves found for any shape');
    return false;
  };*/

  const checkForPossibleMoves = () => {
    if (!shapes || shapes.length === 0) return true;
  
    // Iterate through each shape
    for (let shape of shapes) {
      // Check all potential placements on the board
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (canPlaceShape(shape, row, col)) {
            return true; // A valid move was found
          }
        }
      }
    }
  
    return false; // No valid moves found
  };  

  /*const checkGameOver = () => {
    console.log('Current board state:', board);
    console.log('Current shapes:', shapes);
    
    const noMovesPossible = !checkForPossibleMoves();
    console.log('No moves possible:', noMovesPossible);
    
    if (noMovesPossible) {
        console.log('Game Over triggered!');
        setIsGameOver(true);
        setIsTimerActive(false);
        soundEffects.play('gameOver');
    }
  };*/

  const checkGameOver = () => {
    // Validate the sequence of checks based on shapes length
    const isValidCheck = (
        (lastCheckGameOverCount === 3 && shapes.length === 2) ||
        (lastCheckGameOverCount === 2 && shapes.length === 1) ||
        (lastCheckGameOverCount === 1 && shapes.length === 3)
    );

    if (!isValidCheck) {
        return; // Exit if the check sequence is invalid
    }

    // Update the counter for next check
    setLastCheckGameOverCount(shapes.length);

    // Continue with existing game over logic
    const noMovesPossible = !checkForPossibleMoves();
  
    if (noMovesPossible) {
        console.log("Game Over triggered!");
        setIsGameOver(true);
        setIsTimerActive(false);
        soundEffects.play("gameOver");
    }
  };  

  // Make sure to call checkGameOver after every move and shape generation
  useEffect(() => {
    if (shapes && shapes.length > 0) {
      setTimeout(() => {
        checkGameOver();
      }, 300);
    }
  }, [board, shapes]); // Add dependency on both board and shapes

  // Add restart game function
  const restartGame = () => {
    setBoard(Array(9).fill().map(() => Array(9).fill(null)));
    setShapes([createRandomShape(), createRandomShape(), createRandomShape()]);
    setScore(0);
    setIsGameOver(false);
    setIsTimerActive(true);
    setLastCheckGameOverCount(3); // Reset the counter
    soundEffects.play('playButton');
  };

  // Initialize game
  useEffect(() => {
    setBoard(generateEmptyBoard());
    setShapes([createRandomShape(), createRandomShape(), createRandomShape()]);
    setIsGameOver(false);
    setScore(0);
  }, []);

  return (
    <div className="preBlockPuzzleGame">
      <div className="game-header">
        <div className="score-container">
          <div>
            <div className="score-label">Score</div>
            <div className="score-value">{score}</div>
          </div>
          <div>
            <div className="score-label">Best</div>
            <div className="score-value">{highScore}</div>
          </div>
        </div>
      </div>

      <div className="puzzle-board" ref={boardRef}>
        {renderBoard()}
      </div>

      <div className="shapes-area">
        {shapes.map(shape => (
          <div
            key={shape.id}
            className="shape-preview"
            style={{ 
              visibility: draggingShapeId === shape.id ? 'hidden' : 'visible' 
            }}
            onTouchStart={(e) => handleTouchStart(e, shape)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="shape-grid"
              style={{
                gridTemplateRows: `repeat(${Math.max(...shape.blocks.map(b => b.row)) - Math.min(...shape.blocks.map(b => b.row)) + 1}, 20px)`,
                gridTemplateColumns: `repeat(${Math.max(...shape.blocks.map(b => b.col)) - Math.min(...shape.blocks.map(b => b.col)) + 1}, 20px)`
              }}
            >
              {Array.from({ 
                length: (Math.max(...shape.blocks.map(b => b.row)) - Math.min(...shape.blocks.map(b => b.row)) + 1) * 
                        (Math.max(...shape.blocks.map(b => b.col)) - Math.min(...shape.blocks.map(b => b.col)) + 1) 
              }).map((_, index) => {
                const minRow = Math.min(...shape.blocks.map(b => b.row));
                const minCol = Math.min(...shape.blocks.map(b => b.col));
                const gridCols = Math.max(...shape.blocks.map(b => b.col)) - Math.min(...shape.blocks.map(b => b.col)) + 1;
                const row = Math.floor(index / gridCols) + minRow;
                const col = (index % gridCols) + minCol;
                const isFilled = shape.blocks.some(block => block.row === row && block.col === col);
                return (
                  <div
                    key={index}
                    className={`shape-cell ${isFilled ? 'filled' : ''}`}
                    style={isFilled ? { backgroundColor: shape.color } : {}}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating dragged shape */}
      {draggedShape && (
        <div
          style={{
            position: 'fixed',
            left: `${draggedShapePos.x}px`,
            top: `${draggedShapePos.y}px`,
            zIndex: 1000,
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div 
            className="shape-grid"
            style={{
              display: 'grid',
              gap: '1px',
              gridTemplateRows: `repeat(${Math.max(...draggedShape.blocks.map(b => b.row)) - Math.min(...draggedShape.blocks.map(b => b.row)) + 1}, ${gridCellSize}px)`,
              gridTemplateColumns: `repeat(${Math.max(...draggedShape.blocks.map(b => b.col)) - Math.min(...draggedShape.blocks.map(b => b.col)) + 1}, ${gridCellSize}px)`,
              // Calculate margins based on shape dimensions
              marginLeft: `${(Math.max(...draggedShape.blocks.map(b => b.col)) - Math.min(...draggedShape.blocks.map(b => b.col)) + 1) % 2 === 0 ? gridCellSize : 0}px`,
              marginTop: `${(Math.max(...draggedShape.blocks.map(b => b.row)) - Math.min(...draggedShape.blocks.map(b => b.row)) + 1) % 2 === 0 ? gridCellSize : 0}px`
            }}
          >
            {Array.from({ 
              length: (Math.max(...draggedShape.blocks.map(b => b.row)) - Math.min(...draggedShape.blocks.map(b => b.row)) + 1) * 
                      (Math.max(...draggedShape.blocks.map(b => b.col)) - Math.min(...draggedShape.blocks.map(b => b.col)) + 1) 
            }).map((_, index) => {
              const minRow = Math.min(...draggedShape.blocks.map(b => b.row));
              const minCol = Math.min(...draggedShape.blocks.map(b => b.col));
              const gridCols = Math.max(...draggedShape.blocks.map(b => b.col)) - Math.min(...draggedShape.blocks.map(b => b.col)) + 1;
              const row = Math.floor(index / gridCols) + minRow;
              const col = (index % gridCols) + minCol;
              const isFilled = draggedShape.blocks.some(block => block.row === row && block.col === col);
              return (
                <div
                  key={index}
                  className={`shape-cell ${isFilled ? 'filled' : ''}`}
                  style={{
                    width: `${gridCellSize}px`,
                    height: `${gridCellSize}px`,
                    backgroundColor: isFilled ? draggedShape.color : 'transparent',
                    border: 'none'
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="game-over">
          <h2>Game Over</h2>
          <p>Final Score: {score}</p>
          <p>High Score: {highScore}</p>
          <button onClick={restartGame}>Restart Game</button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    overflow: 'hidden'
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%',
    padding: '10px',
    fontSize: '1.2em',
    backgroundColor: '#ddd'
  },
  board: {
    width: '90vw',
    maxWidth: '600px',
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column'
  },
  shapesArea: {
    marginTop: 'auto',
    padding: '10px',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    backgroundColor: '#ccc',
    width: '100%'
  }
};

export default BlockPuzzleGame;
