import React, { useState, useEffect, useCallback } from 'react';
import './WordLadderGame.css';

const WordLadderGame = ({ wordListFull, setIsTimerActive, gamePaused }) => {
  const [startWord, setStartWord] = useState('');
  const [targetWord, setTargetWord] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [inputWord, setInputWord] = useState('');
  const [steps, setSteps] = useState([]);
  const [score, setScore] = useState(100); // Start with a maximum score of 100
  const [timeLeft, setTimeLeft] = useState(120); // 120 seconds to complete the ladder
  const [gameOver, setGameOver] = useState(false);

  // Select a random pair of words from the word list of the same length
  const getRandomWordPair = useCallback(() => {
    const words = wordListFull.filter((word) => word.length === 5); // Use 5-letter words for the ladder game
    const start = words[Math.floor(Math.random() * words.length)];
    let target;
    do {
      target = words[Math.floor(Math.random() * words.length)];
    } while (target === start);
    return [start, target];
  }, [wordListFull]);

  useEffect(() => {
    if (wordListFull.length) {
      const [start, target] = getRandomWordPair();
      setStartWord(start);
      setTargetWord(target);
      setCurrentWord(start);
      setSteps([start]); // Initialize steps with the starting word
      setIsTimerActive(true);
    }
  }, [wordListFull, getRandomWordPair, setIsTimerActive]);

  useEffect(() => {
    if (timeLeft > 0 && !gamePaused) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
      setIsTimerActive(false);
    }
  }, [timeLeft, gamePaused, setIsTimerActive]);

  const handleInputChange = (e) => {
    setInputWord(e.target.value.toLowerCase());
  };

  const handleSubmitWord = () => {
    if (isValidTransformation(currentWord, inputWord) && wordListFull.includes(inputWord)) {
      setCurrentWord(inputWord);
      setSteps([...steps, inputWord]);
      setInputWord('');

      if (inputWord === targetWord) {
        setGameOver(true);
        setIsTimerActive(false);
      }
    } else {
      setScore((prevScore) => Math.max(prevScore - 10, 0)); // Penalty for invalid words
      setInputWord('');
    }
  };

  const isValidTransformation = (word1, word2) => {
    if (word1.length !== word2.length) return false;
    let diffCount = 0;
    for (let i = 0; i < word1.length; i++) {
      if (word1[i] !== word2[i]) diffCount++;
    }
    return diffCount === 1;
  };

  return (
    <div className="word-ladder-container">
      <div className="game-info">
        <div>Start Word: <strong>{startWord.toUpperCase()}</strong></div>
        <div>Target Word: <strong>{targetWord.toUpperCase()}</strong></div>
        <div>Score: {score}</div>
        <div>Time Left: {timeLeft}s</div>
      </div>
      <div className="word-steps">
        {steps.map((step, index) => (
          <div key={index} className="word-step">{step.toUpperCase()}</div>
        ))}
      </div>
      <div className="word-input-section">
        <input
          type="text"
          value={inputWord}
          onChange={handleInputChange}
          maxLength={startWord.length}
          placeholder="Enter next word"
          disabled={gameOver}
        />
        <button onClick={handleSubmitWord} disabled={inputWord.length !== startWord.length || gameOver}>
          Submit
        </button>
      </div>
      {gameOver && (
        <div className="game-over-message">
          <h2>{currentWord === targetWord ? 'Congratulations!' : 'Game Over!'}</h2>
          <p>{currentWord === targetWord ? 'You completed the word ladder!' : `You didn't reach the target word.`}</p>
          <button onClick={() => window.location.reload()}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default WordLadderGame;
