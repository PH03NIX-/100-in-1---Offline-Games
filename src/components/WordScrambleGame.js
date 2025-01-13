import React, { useState, useEffect, useCallback } from 'react';
import './WordScrambleGame.css';

let WORD_LIST = [];

const shuffleArray = (array) => {
  return array.sort(() => Math.random() - 0.5);
};

const WordScrambleGame = ({ setIsTimerActive, gamePaused, wordList }) => {
  const [currentWord, setCurrentWord] = useState('');
  const [scrambledWord, setScrambledWord] = useState('');
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('wordScrambleHighScore'), 10) || 0);

  WORD_LIST=wordList;

  useEffect(() => {
    startNewLevel();
  }, []);

  const startNewLevel = useCallback(() => {
    const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setCurrentWord(word);
    setScrambledWord(shuffleArray(word.split('')).join(''));
    setGuess('');
  }, []);

  const handleLetterClick = (letter) => {
    if (!gamePaused) {
      setGuess((prevGuess) => prevGuess + letter);
    }
  };

  const handleSubmitGuess = () => {
    if (guess === currentWord) {
      const newScore = score + 10;
      setScore(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('wordScrambleHighScore', newScore.toString());
      }
      setTimeout(() => startNewLevel(), 500);
    } else {
      setGuess('');
    }
  };

  const resetGame = () => {
    setScore(0);
    setLevel(1);
    startNewLevel();
  };

  return (
    <div className="word-scramble-container">
      <div className="game-info">
        <div>Level: {level}</div>
        <div>Score: {score}</div>
        <div>High Score: {highScore}</div>
      </div>
      <div className="scrambled-word">
        {scrambledWord.split('').map((letter, index) => (
          <button key={index} className="letter" onClick={() => handleLetterClick(letter)}>
            {letter}
          </button>
        ))}
      </div>
      <div className="guess">
        {guess.split('').map((letter, index) => (
          <span key={index} className="guess-letter">
            {letter}
          </span>
        ))}
      </div>
      <button className="submit-button" onClick={handleSubmitGuess} disabled={guess.length === 0}>
        Submit
      </button>
      <button className="reset-button" onClick={resetGame}>
        Reset Game
      </button>
    </div>
  );
};

export default WordScrambleGame;
