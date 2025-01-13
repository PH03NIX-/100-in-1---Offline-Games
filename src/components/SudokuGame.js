import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import './SudokuGame.css';

const generateEmptyBoard = () => Array(9).fill().map(() => Array(9).fill(null));

const SudokuGame = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
  const [board, setBoard] = useState(generateEmptyBoard());
  const [initialBoard, setInitialBoard] = useState(generateEmptyBoard());
  const [selectedCell, setSelectedCell] = useState(null);
  const [errors, setErrors] = useState(generateEmptyBoard());
  const [difficulty, setDifficulty] = useState('easy');
  const [mistakeCount, setMistakeCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);

  useEffect(() => {
    generatePuzzle();
  }, [difficulty]);

  useEffect(() => {
    if (board.every(row => row.every(cell => cell !== null))) {
      const hasErrors = errors.some(row => row.some(cell => cell));
      if (!hasErrors) {
        setIsWin(true);
        soundEffects.play('gameWon');
      }
    }
  }, [board, errors]);

  const generatePuzzle = () => {
    const emptyBoard = generateEmptyBoard();
    const solvedBoard = generateSolvedBoard(emptyBoard);
    const puzzle = removeNumbers(solvedBoard, difficulty);
    setBoard(puzzle);
    setInitialBoard(puzzle.map(row => [...row]));
    setErrors(generateEmptyBoard());
    setMistakeCount(0);
    setIsGameOver(false);
    setIsWin(false);
  };

  const generateSolvedBoard = (board) => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    const fillCell = (row, col) => {
      if (col === 9) {
        row++;
        col = 0;
        if (row === 9) return true; // Board is filled
      }
      
      if (board[row][col] !== null) return fillCell(row, col + 1);
      
      shuffleArray(numbers);
      
      for (let num of numbers) {
        if (isValidMove(board, row, col, num)) {
          board[row][col] = num;
          if (fillCell(row, col + 1)) return true;
          board[row][col] = null;
        }
      }
      
      return false;
    };
    
    fillCell(0, 0);
    return board;
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  const removeNumbers = (board, difficulty) => {
    const puzzle = board.map(row => [...row]);
    let cellsToRemove;
    
    switch(difficulty) {
      case 'easy':
        cellsToRemove = 35;
        break;
      case 'medium':
        cellsToRemove = 45;
        break;
      case 'hard':
        cellsToRemove = 55;
        break;
      default:
        cellsToRemove = 35;
    }
    
    while (cellsToRemove > 0) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      if (puzzle[row][col] !== null) {
        puzzle[row][col] = null;
        cellsToRemove--;
      }
    }
    
    return puzzle;
  };

  const solveSudoku = (board) => {
    const emptyCell = findEmptyCell(board);
    if (!emptyCell) return board;

    const [row, col] = emptyCell;
    for (let num = 1; num <= 9; num++) {
      if (isValidMove(board, row, col, num)) {
        board[row][col] = num;
        if (solveSudoku(board)) return board;
        board[row][col] = null;
      }
    }
    return false;
  };

  const findEmptyCell = (board) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === null) return [row, col];
      }
    }
    return null;
  };

  const isValidMove = (board, row, col, num) => {
    for (let x = 0; x < 9; x++) if (board[row][x] === num) return false;
    for (let x = 0; x < 9; x++) if (board[x][col] === num) return false;
    
    let boxRow = Math.floor(row / 3) * 3;
    let boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[boxRow + i][boxCol + j] === num) return false;
      }
    }
    
    return true;
  };

  const handleCellClick = (row, col) => {
    soundEffects.play('gameAction');
    setSelectedCell([row, col]);
  };

  const isSameBox = (row1, col1, row2, col2) => {
    const boxRow1 = Math.floor(row1 / 3);
    const boxCol1 = Math.floor(col1 / 3);
    const boxRow2 = Math.floor(row2 / 3);
    const boxCol2 = Math.floor(col2 / 3);
    return boxRow1 === boxRow2 && boxCol1 === boxCol2;
  };

  const findConflicts = (board, row, col, num) => {
    const conflicts = [];

    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num && x !== col) conflicts.push([row, x]);
      if (board[x][col] === num && x !== row) conflicts.push([x, col]);
    }
    
    let boxRow = Math.floor(row / 3) * 3;
    let boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[boxRow + i][boxCol + j] === num && (boxRow + i !== row || boxCol + j !== col)) {
          conflicts.push([boxRow + i, boxCol + j]);
        }
      }
    }
    
    return conflicts;
  };

  const handleNumberInput = (num) => {
    if (selectedCell && !isGameOver) {
      const [row, col] = selectedCell;
      if (initialBoard[row][col] === null) {
        const newBoard = board.map(row => [...row]);
        const oldNum = newBoard[row][col];
        newBoard[row][col] = num === 'clear' ? null : num;
        if (num === 'clear') {
          soundEffects.play('gameAction');
        }
        setBoard(newBoard);

        const newErrors = errors.map(row => [...row]);

        // Clear existing errors for the current cell and related cells
        newErrors[row][col] = false;
        for (let i = 0; i < 9; i++) {
          newErrors[row][i] = false;
          newErrors[i][col] = false;
        }
        let boxRow = Math.floor(row / 3) * 3;
        let boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            newErrors[boxRow + i][boxCol + j] = false;
          }
        }

        if (num !== 'clear') {
          const conflicts = findConflicts(newBoard, row, col, num);
          if (conflicts.length > 0) {
            soundEffects.play('badMove');
            setMistakeCount(prevCount => {
              const newCount = prevCount + 1;
              if (newCount >= 3) {
                setIsGameOver(true);
                soundEffects.play('gameOver');
              }
              return newCount;
            });
          }
          else {
            soundEffects.play('goodMove');
          }
          conflicts.forEach(([r, c]) => {
            newErrors[r][c] = true;
          });
          if (conflicts.length > 0) {
            newErrors[row][col] = true;
          }
        }

        // Recheck for errors in the affected row, column, and box
        for (let i = 0; i < 9; i++) {
          if (i !== col && newBoard[row][i] !== null) {
            const rowConflicts = findConflicts(newBoard, row, i, newBoard[row][i]);
            if (rowConflicts.length > 0) newErrors[row][i] = true;
          }
          if (i !== row && newBoard[i][col] !== null) {
            const colConflicts = findConflicts(newBoard, i, col, newBoard[i][col]);
            if (colConflicts.length > 0) newErrors[i][col] = true;
          }
        }
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if ((boxRow + i !== row || boxCol + j !== col) && newBoard[boxRow + i][boxCol + j] !== null) {
              const boxConflicts = findConflicts(newBoard, boxRow + i, boxCol + j, newBoard[boxRow + i][boxCol + j]);
              if (boxConflicts.length > 0) newErrors[boxRow + i][boxCol + j] = true;
            }
          }
        }

        setErrors(newErrors);
      }
    }
  };

  const resetGame = () => {
    setIsWin(false);
    setIsGameOver(false);
    setMistakeCount(0);
    setErrors(generateEmptyBoard());
    generatePuzzle();
    soundEffects.play('gameAction');
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    resetGame();
  };

  const handleRetry = () => {
    resetGame();
  };

  const isBoardComplete = (board) => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === null) return false;
      }
    }
    return true;
  };

  return (
    <div className="sudoku-game">
      {isWin && (
        <>
          <Confetti />
          <div className="win-message">YOU WIN!</div>
        </>
      )}
      <div className="game-controls">
        <select value={difficulty} onChange={handleDifficultyChange}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <div className={`mistake-counter ${mistakeCount >= 2 ? 'warning' : ''}`}>
          {mistakeCount}/3 mistakes
        </div>
      </div>
      {isGameOver && (
        <div className="game-over">
          <h2>Game Over</h2>
          <p>You've made 3 mistakes.</p>
          <button onClick={handleRetry}>Retry</button>
        </div>
      )} 
      <div className={`sudoku-board ${isWin ? 'win' : ''}`}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="sudoku-row">
            {row.map((cell, colIndex) => {
              const isSelected = selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex;
              const isInSameRowCol = selectedCell && (selectedCell[0] === rowIndex || selectedCell[1] === colIndex);
              const isInSameBox = selectedCell && isSameBox(selectedCell[0], selectedCell[1], rowIndex, colIndex);
              const isInitial = initialBoard[rowIndex][colIndex] !== null;

              return (
                <div
                  key={colIndex}
                  className={`sudoku-cell 
                    ${isSelected ? 'selected' : ''} 
                    ${isInSameRowCol || isInSameBox ? 'highlight' : ''}
                    ${cell !== null ? 'filled' : ''}
                    ${errors[rowIndex][colIndex] ? 'error' : ''}
                    ${isInitial ? 'initial' : ''}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell !== null ? cell : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="number-input">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} onClick={() => handleNumberInput(num)}>{num}</button>
        ))}
        <button className="clear-button" onClick={() => handleNumberInput('clear')}>Clear</button>
      </div>
    </div>
  );
};

export default SudokuGame;
