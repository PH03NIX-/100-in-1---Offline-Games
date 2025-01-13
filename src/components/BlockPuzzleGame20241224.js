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

const BlockPuzzleGame = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
  const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(null)));
  const [shapes, setShapes] = useState([]);
  const [score, setScore] = useState(0);
  
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
    let linesCleared = 0;

    // 1) Clear full rows
    for (let r = 0; r < 9; r++) {
      const rowFull = board[r].every(cell => cell !== null);
      if (rowFull) {
        linesCleared++;
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
        linesCleared++;
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
          linesCleared++;
          for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
            for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
              board[r][c] = null;
            }
          }
        }
      }
    }

    return { newBoard: board, linesCleared };
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
    return board.map((rowData, r) => {
      return (
        <div key={`row-${r}`} style={{ display: 'flex' }}>
          {rowData.map((cell, c) => {
            // Sub-grid borders
            const borderStyle = {
              border: '1px solid #888',
              width: 'calc(100% / 9)',
              aspectRatio: '1 / 1',
              boxSizing: 'border-box',
              position: 'relative'
            };
            if (c % 3 === 0) borderStyle.borderLeft = '2px solid #444';
            if (r % 3 === 0) borderStyle.borderTop = '2px solid #444';

            // Cell background
            let backgroundColor = '#fafafa';
            if (cell) {
              // Occupied
              backgroundColor = cell.color;
            } else if (selectedShape && isHighlightCell(r, c)) {
              // Show highlight if shape is selected
              backgroundColor = isHoverPlacementValid() ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)';
            }

            return (
              <div
                key={`cell-${r}-${c}`}
                style={{ ...borderStyle, backgroundColor }}
                onMouseEnter={() => setHoverCell({ row: r, col: c })}
                onClick={() => handleBoardCellClick(r, c)}
              />
            );
          })}
        </div>
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
    soundEffects.play('card');
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!draggedShape || !boardRef.current) return;

    const touch = e.touches[0];
    
    // Update the dragged shape position to follow the finger
    setDraggedShapePos({
      x: touch.clientX,
      y: touch.clientY
    });

    // Get board position and calculate grid coordinates
    const boardRect = boardRef.current.getBoundingClientRect();
    const cellSize = boardRect.width / 9;
    
    // Calculate which cell we're over
    const boardX = touch.clientX - boardRect.left;
    const boardY = touch.clientY - boardRect.top;
    
    const gridRow = Math.floor(boardY / cellSize);
    const gridCol = Math.floor(boardX / cellSize);

    // Calculate which cells would be affected by the shape placement
    const affectedCells = draggedShape.blocks.map(block => ({
      row: gridRow + block.row,
      col: gridCol + block.col
    }));

    // Update hover cells and validity
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
      setShapes(shapes.filter(s => s.id !== draggedShape.id));
      
      // Clear completed lines and add score
      clearCompletedLines(newBoard);

      // Generate new shapes if needed
      if (shapes.length <= 1) {
        generateNewShapes();
      }
    } else {
      soundEffects.play('badMove');
    }

    // Reset drag state
    setDraggedShape(null);
    setDraggedShapePos({ x: 0, y: 0 });
    setHoverCells([]);
  };

  const generateNewShapes = () => {
    const newShapes = Array(3).fill().map(() => ({
      id: Math.random().toString(36).substr(2, 9),
      blocks: SHAPE_LIBRARY[Math.floor(Math.random() * SHAPE_LIBRARY.length)],
      color: getRandomColor()
    }));
    setShapes(newShapes);
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

  return (
    <div className="preBlockPuzzleGame">
      <div className="game-info">
        <div>Score: {score}</div>
      </div>

      <div className="puzzle-board" ref={boardRef}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`board-cell 
                  ${cell ? 'filled' : ''} 
                  ${hoverCells.some(pos => pos.row === rowIndex && pos.col === colIndex)
                    ? isValidPlacement ? 'hover-valid' : 'hover-invalid'
                    : ''
                  }`}
                style={cell ? { backgroundColor: cell.color } : {}}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="shapes-area">
        {shapes.map(shape => (
          <div
            key={shape.id}
            className="shape-preview"
            onTouchStart={(e) => handleTouchStart(e, shape)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="shape-grid"
              style={{
                gridTemplateRows: `repeat(${Math.max(...shape.blocks.map(b => b.row)) + 1}, 20px)`,
                gridTemplateColumns: `repeat(${Math.max(...shape.blocks.map(b => b.col)) + 1}, 20px)`
              }}
            >
              {Array.from({ length: (Math.max(...shape.blocks.map(b => b.row)) + 1) * (Math.max(...shape.blocks.map(b => b.col)) + 1) }).map((_, index) => {
                const row = Math.floor(index / (Math.max(...shape.blocks.map(b => b.col)) + 1));
                const col = index % (Math.max(...shape.blocks.map(b => b.col)) + 1);
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
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div 
            className="shape-grid"
            style={{
              gridTemplateRows: `repeat(${Math.max(...draggedShape.blocks.map(b => b.row)) + 1}, 20px)`,
              gridTemplateColumns: `repeat(${Math.max(...draggedShape.blocks.map(b => b.col)) + 1}, 20px)`
            }}
          >
            {/* Render dragged shape */}
            {Array.from({ length: (Math.max(...draggedShape.blocks.map(b => b.row)) + 1) * (Math.max(...draggedShape.blocks.map(b => b.col)) + 1) }).map((_, index) => {
              const row = Math.floor(index / (Math.max(...draggedShape.blocks.map(b => b.col)) + 1));
              const col = index % (Math.max(...draggedShape.blocks.map(b => b.col)) + 1);
              const isFilled = draggedShape.blocks.some(block => block.row === row && block.col === col);
              return (
                <div
                  key={index}
                  className={`shape-cell ${isFilled ? 'filled' : ''}`}
                  style={isFilled ? { backgroundColor: draggedShape.color } : {}}
                />
              );
            })}
          </div>
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
