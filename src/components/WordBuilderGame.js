import React, { useState, useEffect, useCallback } from 'react';
import './WordBuilderGame.css';

const shuffleArray = (array) => {
  return array.sort(() => Math.random() - 0.5);
};

const WordBuilderGame = ({ wordListFull, setIsTimerActive, gamePaused }) => {
  const [letters, setLetters] = useState([]);
  const [guess, setGuess] = useState('');
  const [foundWords, setFoundWords] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    // Start a new game with random letters
    startNewGame();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !gamePaused) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
      setIsTimerActive(false);
    }
  }, [timeLeft, gamePaused]);

  const startNewGame = useCallback(() => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const randomLetters = shuffleArray(alphabet.split('')).slice(0, 7); // Get 7 random letters
    setLetters(randomLetters);
    setGuess('');
    setFoundWords([]);
    setScore(0);
    setTimeLeft(60);
    setGameOver(false);
    setIsTimerActive(true);
  }, [setIsTimerActive]);

  const handleLetterClick = (letter) => {
    if (!gameOver) {
      setGuess((prevGuess) => prevGuess + letter);
    }
  };

  const handleSubmitGuess = () => {
    if (wordListFull.includes(guess) && !foundWords.includes(guess)) {
      setFoundWords([...foundWords, guess]);
      setScore((prevScore) => prevScore + guess.length * 10); // Longer words get more points
      setGuess('');
    } else {
      setGuess('');
    }
  };

  return (
    <div className="word-builder-container">
      <div className="game-info">
        <div>Score: {score}</div>
        <div>Time Left: {timeLeft}s</div>
      </div>
      <div className="letters-container">
        {letters.map((letter, index) => (
          <button key={index} className="letter-button" onClick={() => handleLetterClick(letter)}>
            {letter.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="current-guess">
        <h2>{guess.toUpperCase()}</h2>
      </div>
      <button className="submit-button" onClick={handleSubmitGuess} disabled={guess.length === 0 || gameOver}>
        Submit
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
          <button onClick={startNewGame}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default WordBuilderGame;
