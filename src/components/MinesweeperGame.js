import React, { useState, useEffect } from 'react';
import './MinesweeperGame.css';
import Confetti from 'react-confetti';

const DIFFICULTIES = {
  EASY: { rows: 6, cols: 6, bombs: 5, label: 'Easy 6x6' },
  NORMAL: { rows: 8, cols: 8, bombs: 10, label: 'Normal 8x8' },
  HARD: { rows: 14, cols: 10, bombs: 25, label: 'Hard 10x14' },
  EXPERT: { rows: 18, cols: 12, bombs: 40, label: 'Expert 12x18' },
};

function generateEmptyBoard(difficulty) {
  const board = [];
  for (let r = 0; r < difficulty.rows; r++) {
    const row = [];
    for (let c = 0; c < difficulty.cols; c++) {
      row.push({
        row: r,
        col: c,
        isBomb: false,
        isRevealed: false,
        isFlagged: false,
        adjacentBombs: 0,
      });
    }
    board.push(row);
  }
  return board;
}

function placeBombs(board, difficulty) {
  let placed = 0;
  while (placed < difficulty.bombs) {
    const r = Math.floor(Math.random() * difficulty.rows);
    const c = Math.floor(Math.random() * difficulty.cols);
    if (!board[r][c].isBomb) {
      board[r][c].isBomb = true;
      placed++;
    }
  }
  return board;
}

// Count bombs around each cell
function calculateAdjacentBombs(board, difficulty) {
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  for (let r = 0; r < difficulty.rows; r++) {
    for (let c = 0; c < difficulty.cols; c++) {
      if (board[r][c].isBomb) {
        board[r][c].adjacentBombs = -1;
      } else {
        let count = 0;
        directions.forEach(([dr, dc]) => {
          const rr = r + dr;
          const cc = c + dc;
          if (rr >= 0 && rr < difficulty.rows && cc >= 0 && cc < difficulty.cols) {
            if (board[rr][cc].isBomb) count++;
          }
        });
        board[r][c].adjacentBombs = count;
      }
    }
  }
  return board;
}

function cloneBoard(board) {
  return board.map(row => row.map(cell => ({ ...cell })));
}

/**
 * Reveal cell (flood fill if adjacentBombs=0).
 */
function revealCell(board, row, col, difficulty) {
  const cell = board[row][col];
  if (cell.isFlagged || cell.isRevealed) return;
  cell.isRevealed = true;

  if (cell.adjacentBombs === 0 && !cell.isBomb) {
    // Flood fill neighbors
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];
    directions.forEach(([dr, dc]) => {
      const rr = row + dr;
      const cc = col + dc;
      if (rr >= 0 && rr < difficulty.rows && cc >= 0 && cc < difficulty.cols) {
        const neighbor = board[rr][cc];
        if (!neighbor.isBomb && !neighbor.isRevealed) {
          revealCell(board, rr, cc, difficulty);
        }
      }
    });
  }
}

const MinesweeperGame = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
  const [board, setBoard] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES.NORMAL);
  const [remainingFlags, setRemainingFlags] = useState(difficulty.bombs);

  useEffect(() => {
    startGame();
  }, []);

  useEffect(() => {
    setIsTimerActive(!gamePaused && !gameOver && !win);
  }, [gamePaused, gameOver, win, setIsTimerActive]);

  const startGame = (newDifficulty = null) => {
    const difficultyToUse = newDifficulty || difficulty;
    let newBoard = generateEmptyBoard(difficultyToUse);
    newBoard = placeBombs(newBoard, difficultyToUse);
    newBoard = calculateAdjacentBombs(newBoard, difficultyToUse);
    setBoard(newBoard);
    setGameOver(false);
    setWin(false);
    setRemainingFlags(difficultyToUse.bombs);
  };

  // Check win: if all non-bomb cells are revealed
  const checkWinCondition = (updatedBoard) => {
    let revealedCount = 0;
    let totalSafeCells = difficulty.rows * difficulty.cols - difficulty.bombs;

    for (let r = 0; r < difficulty.rows; r++) {
      for (let c = 0; c < difficulty.cols; c++) {
        if (updatedBoard[r][c].isRevealed && !updatedBoard[r][c].isBomb) {
          revealedCount++;
        }
      }
    }
    if (revealedCount === totalSafeCells) {
      setWin(true);
      soundEffects.play('gameWon'); 
    }
  };

  const handleCellPress = (row, col) => {
    if (gamePaused || gameOver || win) return;

    const updatedBoard = cloneBoard(board);
    const cell = updatedBoard[row][col];

    // Flag mode
    if (flagMode) {
      if (!cell.isRevealed) {
        if (!cell.isFlagged && remainingFlags === 0) {
          soundEffects.play('badMove'); // Play bad move sound when trying to place flag with none remaining
          return;
        }
        
        cell.isFlagged = !cell.isFlagged;
        setRemainingFlags(prev => cell.isFlagged ? prev - 1 : prev + 1);
        soundEffects.play('lazer');
      }
    } else {
      // Reveal mode
      if (cell.isFlagged) return; // do nothing if flagged
      if (cell.isBomb) {
        // Game Over - reveal all bombs
        for (let r = 0; r < difficulty.rows; r++) {
          for (let c = 0; c < difficulty.cols; c++) {
            if (updatedBoard[r][c].isBomb) {
              updatedBoard[r][c].isRevealed = true;
            }
          }
        }
        // Mark the clicked bomb
        cell.isTriggered = true;  // Add this property to track which bomb was clicked
        setGameOver(true);
        soundEffects.play('boom');
        soundEffects.play('gameOver');
      } else {
        revealCell(updatedBoard, row, col, difficulty);
        checkWinCondition(updatedBoard);
        soundEffects.play('goodMove');
      }
    }
    setBoard(updatedBoard);
  };

  const renderCellContent = (cell) => {
    if (!cell.isRevealed && !gameOver) {
      // Hidden and game still going
      if (cell.isFlagged) {
        return '🚩'; // Flag
      } else {
        return '⬜'; // Hidden
      }
    } else {
      // Revealed or game over
      if (cell.isBomb) {
        // Show X behind bomb if it was correctly flagged
        return cell.isFlagged ? '❌💣' : '💣';
      } else if (cell.adjacentBombs === 0) {
        return ' '; // blank
      } else {
        return cell.adjacentBombs; // number
      }
    }
  };

  const toggleMode = (mode) => {
    if ((mode === 'flag') !== flagMode) {  // Only toggle if different
      setFlagMode(mode === 'flag');
      soundEffects.play('gameAction');
    }
  };

  const handleDifficultyChange = (e) => {
    const newDifficulty = Object.values(DIFFICULTIES).find(
      d => d.label === e.target.value
    );
    setDifficulty(newDifficulty);
    soundEffects.play('gameAction');
    startGame(newDifficulty);
  };

  return (
    <div className="preMinesweeperGame">
      {win && (
        <>
          <Confetti />
          <div className="win-message">YOU WIN!</div>
          <button 
            onClick={() => startGame()} 
            className="win-play-again"
          >
            Play Again
          </button>
        </>
      )}

      <div className="difficulty-selector">
        <select
          value={difficulty.label}
          onChange={handleDifficultyChange}
          className="difficulty-dropdown"
        >
          {Object.values(DIFFICULTIES).map(diff => (
            <option key={diff.label} value={diff.label}>
              {diff.label}
            </option>
          ))}
        </select>
      </div>

      <div className="minesweeper-board" style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${difficulty.cols}, 1fr)`,
        gap: '1px',
        width: '90vw',  // Use 90% of viewport width
        maxWidth: '90vh',  // Don't exceed viewport height
        margin: '96px auto'
      }}>
        {board.map((row, rIndex) => (
          row.map((cell, cIndex) => (
            <div 
              key={`cell-${rIndex}-${cIndex}`}
              className="board-cell"
              style={{
                backgroundColor: cell.isRevealed 
                  ? cell.isTriggered 
                    ? 'red'
                    : '#ccc'
                  : '#999',
                color: cell.isBomb && cell.isRevealed ? 'black' : '#000',
                aspectRatio: '1', // Maintain square shape
                width: '100%',    // Fill grid cell
                fontSize: `${90 / difficulty.cols}%`, // Scale font with cell size
              }}
              onClick={() => handleCellPress(rIndex, cIndex)}
            >
              {renderCellContent(cell)}
            </div>
          ))
        ))}
      </div>

      <div className="bottom-bar">
        <div className="emptyDiv"></div>
        <div className="mode-buttons">
          <button 
            onClick={() => toggleMode('reveal')}
            className={`mode-button ${!flagMode ? 'selected' : ''}`}
          >
            🔎 {!flagMode ? 'Revealing' : 'Reveal'}
          </button>
          <button 
            onClick={() => toggleMode('flag')}
            className={`mode-button ${flagMode ? 'selected' : ''}`}
          >
            🚩 {flagMode ? `Flagging (${remainingFlags})` : `Flag (${remainingFlags})`}
          </button>
        </div>
        <button onClick={() => startGame()} className="reset-button">↻ Reset</button>
      </div>

      {gameOver && !win && (
        <div className="game-over">
          <h2>Game Over</h2>
          <button onClick={() => startGame()}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default MinesweeperGame;
