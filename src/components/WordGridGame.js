import React, { useState, useEffect, useCallback } from 'react';
import './WordGridGame.css';

const GRID_SIZE = 10;  // Size of the grid (10x10)

const generateRandomLetter = () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  return alphabet[Math.floor(Math.random() * alphabet.length)];
};

const createLetterGrid = () => {
  // Create a 10x10 grid filled with random letters
  const grid = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    const newRow = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      newRow.push(generateRandomLetter());
    }
    grid.push(newRow);
  }
  return grid;
};

const WordGridGame = ({ wordListFull, setIsTimerActive, gamePaused }) => {
  const [grid, setGrid] = useState([]);
  const [selectedWord, setSelectedWord] = useState('');
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    setGrid(createLetterGrid());
    setIsTimerActive(true);
  }, [setIsTimerActive]);

  useEffect(() => {
    if (timeLeft > 0 && !gamePaused) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
      setIsTimerActive(false);
    }
  }, [timeLeft, gamePaused, setIsTimerActive]);

  const handleLetterClick = (row, col) => {
    if (!gameOver) {
      const selectedLetter = grid[row][col];
      setSelectedWord((prev) => prev + selectedLetter);
    }
  };

  const handleWordSubmit = () => {
    if (wordListFull.includes(selectedWord.toLowerCase()) && !foundWords.includes(selectedWord)) {
      setFoundWords([...foundWords, selectedWord]);
      setScore((prevScore) => prevScore + selectedWord.length * 10);  // Scoring: 10 points per letter
      setSelectedWord('');
    } else {
      setSelectedWord('');
    }
  };

  return (
    <div className="word-grid-container">
      <div className="game-info">
        <div>Score: {score}</div>
        <div>Time Left: {timeLeft}s</div>
      </div>
      <div className="grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            {row.map((letter, colIndex) => (
              <div
                key={colIndex}
                className="grid-cell"
                onClick={() => handleLetterClick(rowIndex, colIndex)}
              >
                {letter.toUpperCase()}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="current-word">
        <h2>{selectedWord.toUpperCase()}</h2>
      </div>
      <button className="submit-button" onClick={handleWordSubmit} disabled={selectedWord.length === 0 || gameOver}>
        Submit Word
      </button>
      <div className="found-words">
        {foundWords.length > 0 && <h3>Found Words:</h3>}
        <div className="word-list">
          {foundWords.map((word, index) => (
            <span key={index} className="word-item">
              {word}
            </span>
          ))}
        </div>
      </div>
      {gameOver && (
        <div className="game-over-message">
          <h2>Game Over!</h2>
          <p>Your final score is: {score}</p>
          <button onClick={() => setGrid(createLetterGrid()) && setGameOver(false) && setTimeLeft(60) && setFoundWords([])}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default WordGridGame;
