import React, { useState, useEffect } from 'react';
import './2048Game.css';

const size = 4; // Grid size for 2048

const initializeBoard = () => {
  const emptyBoard = Array(size).fill().map(() => Array(size).fill(null));
  return addRandomTile(addRandomTile(emptyBoard));
};

const getRandomTileValue = () => (Math.random() < 0.9 ? 2 : 4);

const addRandomTile = (board) => {
  const emptyCells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!board[r][c]) emptyCells.push([r, c]);
    }
  }
  if (emptyCells.length === 0) return board;
  const [randomRow, randomCol] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  board[randomRow][randomCol] = { value: getRandomTileValue(), isNew: true };
  return board;
};

const swipeLeft = (board) => {
  let newBoard = board.map(row => {
    let newRow = row.filter(cell => cell !== null);
    let score = 0;
    let merged = false;
    for (let i = 0; i < newRow.length - 1; i++) {
      if (newRow[i].value === newRow[i + 1].value) {
        newRow[i] = { value: newRow[i].value * 2, isNew: false };
        score += newRow[i].value;
        newRow[i + 1] = null;
        merged = true;
        i++;
      }
    }
    newRow = newRow.filter(cell => cell !== null);
    while (newRow.length < size) newRow.push(null);
    return { row: newRow, score, merged };
  });
  return {
    board: newBoard.map(item => item.row),
    score: newBoard.reduce((sum, item) => sum + item.score, 0),
    merged: newBoard.some(item => item.merged)
  };
};

const swipeRight = (board) => {
  let result = swipeLeft(board.map(row => row.reverse()));
  return {
    board: result.board.map(row => row.reverse()),
    score: result.score,
    merged: result.merged
  };
};

const swipeUp = (board) => {
  let transposed = transposeMatrix(board);
  let result = swipeLeft(transposed);
  return {
    board: transposeMatrix(result.board),
    score: result.score,
    merged: result.merged
  };
};

const swipeDown = (board) => {
  let transposed = transposeMatrix(board);
  let result = swipeRight(transposed);
  return {
    board: transposeMatrix(result.board),
    score: result.score,
    merged: result.merged
  };
};

const transposeMatrix = (matrix) => {
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
};

const isGameOver = (board, soundEffects) => {
  // Check for any empty cells
  if (board.flat().includes(null)) return false;

  // Check for possible merges horizontally and vertically
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - 1; j++) {
      if (board[i][j].value === board[i][j + 1].value || 
          board[j][i].value === board[j + 1][i].value) {
        return false;
      }
    }
  }
  soundEffects.play('gameOver');
  return true;
};

const _2048Game = ({ setView, setIsTimerActive, soundEffects }) => {
  const [board, setBoard] = useState(initializeBoard);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('2048HighScore');
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [touchStart, setTouchStart] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [newHighScoreReached, setNewHighScoreReached] = useState(false);

  useEffect(() => {
    const handleSwipe = (direction) => {
      if (gameOver) return;

      let newBoard = JSON.parse(JSON.stringify(board));
      let oldBoard = JSON.stringify(board);
      let moveScore = 0;
      let merged = false;

      switch (direction) {
        case 'left':
          ({ board: newBoard, score: moveScore, merged } = swipeLeft(newBoard));
          break;
        case 'right':
          ({ board: newBoard, score: moveScore, merged } = swipeRight(newBoard));
          break;
        case 'up':
          ({ board: newBoard, score: moveScore, merged } = swipeUp(newBoard));
          break;
        case 'down':
          ({ board: newBoard, score: moveScore, merged } = swipeDown(newBoard));
          break;
        default:
          return;
      }

      if (JSON.stringify(newBoard) !== oldBoard) {
        soundEffects.play('gameAction'); // Play sound when tiles move
        if (merged) {
          soundEffects.play('lazer'); // Play sound when tiles merge
        }
        const boardWithNewTile = addRandomTile(newBoard);
        setBoard(boardWithNewTile);
        
        // Delay the 'goodMove' sound to match the animation
        setTimeout(() => {
          soundEffects.play('goodMove');
        }, 150); // Adjust this value to match your animation duration
      
        setScore(prevScore => {
          const newScore = prevScore + moveScore;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('2048HighScore', newScore.toString());
            if(!newHighScoreReached) {  
              setNewHighScoreReached(true);
              soundEffects.play('gameWon');
            }
          }
          return newScore;
        });
      
        // Remove the 'isNew' flag after animation
        setTimeout(() => {
          setBoard(prevBoard => prevBoard.map(row => row.map(cell => 
            cell && cell.isNew ? { ...cell, isNew: false } : cell
          )));
        }, 300); // Adjust this value to match your animation duration
      
        if (isGameOver(boardWithNewTile, soundEffects)) {
          setGameOver(true);
          setIsTimerActive(false);
        }
      }
    };

    const handleTouchStart = (e) => {
      const touchStart = e.touches[0];
      setTouchStart({ x: touchStart.clientX, y: touchStart.clientY });
    };

    const handleTouchEnd = (e) => {
      if (!touchStart) return;
      const touchEnd = e.changedTouches[0];
      const deltaX = touchEnd.clientX - touchStart.x;
      const deltaY = touchEnd.clientY - touchStart.y;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) handleSwipe('right');
        else handleSwipe('left');
      } else {
        if (deltaY > 0) handleSwipe('down');
        else handleSwipe('up');
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [board, touchStart, highScore, gameOver, soundEffects, newHighScoreReached]);

  const resetGame = () => {
    setBoard(initializeBoard());
    setScore(0);
    setGameOver(false);
    setIsTimerActive(true);
    setNewHighScoreReached(false);
  };

  return (
    <div className="game-2048">
      {gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Score: {score}</p>
          <p>High Score: {highScore}</p>
          <button className="restart-btn" onClick={resetGame}>Restart</button>
        </div>
      )} 
      <div className="game-header">
        <div className="score-container">
          <div className="score-box">
            <div className="score-label">SCORE</div>
            <div className="score-value">{score}</div>
          </div>
          <div className="score-box">
            <div className="score-label">BEST</div>
            <div className="score-value">{highScore}</div>
          </div>
        </div>
      </div>
      <div className="board-2048">
        {board.flat().map((cell, index) => (
          <div 
            key={index}
            className={`board-cell ${cell ? `value-${cell.value}` : ''} ${cell && cell.isNew ? 'new-tile' : ''}`}
          >
            {cell && <div className="cell-content">{cell.value}</div>}
          </div>
        ))}
      </div>        
    </div>
  );
};

export default _2048Game;
