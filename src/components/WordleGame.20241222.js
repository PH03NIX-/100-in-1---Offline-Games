import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import './WordleGame.css';

function getGuessEvaluation(guess, solution) {
  const solutionLetters = solution.split('');
  const guessLetters = guess.split('');

  const result = Array(5).fill('absent');
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === solutionLetters[i]) {
      result[i] = 'correct';
      solutionLetters[i] = null;
    }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    const index = solutionLetters.indexOf(guessLetters[i]);
    if (index !== -1) {
      result[i] = 'present';
      solutionLetters[index] = null;
    }
  }
  return result;
}

function WordleGame({ playtime, gamePaused, setIsTimerActive, soundEffects, wordList }) {
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing');
  const [notInSolution, setNotInSolution] = useState(new Set());
  
  const maxAttempts = 6;

  useEffect(() => {
    const fiveLetterWords = wordList.filter(word => word.length === 5);
    console.log(fiveLetterWords);
    const sol = fiveLetterWords[Math.floor(Math.random() * fiveLetterWords.length)].toLowerCase();
    setSolution(sol);
    setIsTimerActive(true);
  }, [setIsTimerActive, wordList]);

  useEffect(() => {
    if (gamePaused) {
      setIsTimerActive(false);
    } else if (gameStatus === 'playing') {
      setIsTimerActive(true);
    }
  }, [gamePaused, gameStatus, setIsTimerActive]);

  const onKeyPress = (key) => {
    if (gamePaused || gameStatus !== 'playing') return;
    if (key === 'ENTER' && currentGuess.length === 5) {
      if (!wordList.includes(currentGuess.toLowerCase())) {
        // Invalid word
        soundEffects.play('badMove');
        setCurrentGuess(''); 
        return; 
      }
      soundEffects.play('goodMove');
      console.log(`solution: ${solution}`);
      const evalResult = getGuessEvaluation(currentGuess.toLowerCase(), solution);
      
      const newNotInSolution = new Set(notInSolution);
      currentGuess.toLowerCase().split('').forEach((letter, index) => {
        if (evalResult[index] === 'absent' && !solution.includes(letter)) {
          newNotInSolution.add(letter);
        }
      });
      setNotInSolution(newNotInSolution);

      setGuesses([...guesses, currentGuess]);
      setEvaluations([...evaluations, evalResult]);
      setCurrentGuess('');
      if (evalResult.every(e => e === 'correct')) {
        setGameStatus('won');
        soundEffects.play('gameWon');
        setIsTimerActive(false);
      } else if (guesses.length + 1 === maxAttempts) {
        setGameStatus('lost');
        soundEffects.play('gameOver');
        setIsTimerActive(false);
      }
    } else if (key === 'DEL') {
      setCurrentGuess(currentGuess.slice(0, -1));
      soundEffects.play('lazer');
    } else if (currentGuess.length < 5 && /^[a-zA-Z]$/.test(key)) {
      setCurrentGuess(currentGuess + key.toLowerCase());
      soundEffects.play('gameAction');
    }
  };

  const rows = [];
  for (let i = 0; i < maxAttempts; i++) {
    const guess = guesses[i] || (i === guesses.length ? currentGuess : '');
    const rowEval = evaluations[i] || [];
    const cells = [];
    for (let c = 0; c < 5; c++) {
      const letter = guess[c] || '';
      let className = 'cell';
      
      // If this is the current row, use Memory game's face-down card color
      if (i === guesses.length) {
        className = `cell current`;  // Add 'current' class
      } else if (letter) {
        className = rowEval[c] === 'correct' ? 'cell correct' :
                   rowEval[c] === 'present' ? 'cell present' :
                   rowEval[c] === 'absent' ? 'cell absent' : 'cell';
      }

      cells.push(
        <div key={c} className={className}>
          {letter}
        </div>
      );
    }
    rows.push(<div key={i} className="row">{cells}</div>);
  }

  const keyboardRows = [
    'q w e r t y u i o p'.split(' '),
    'a s d f g h j k l'.split(' '),
    ['ENTER', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'DEL']
  ];

  const handlePlayAgain = () => {
    soundEffects.play('playButton');
    // Reset the game
    const fiveLetterWords = wordList.filter(word => word.length === 5);
    const sol = fiveLetterWords[Math.floor(Math.random() * fiveLetterWords.length)].toLowerCase();
    setSolution(sol);
    setGuesses([]);
    setCurrentGuess('');
    setEvaluations([]);
    setGameStatus('playing');
    setNotInSolution(new Set());
    setIsTimerActive(true);
  };

  return (
    <div className="pre-wordle-game">
      {gameStatus === 'won' && (
        <>
          <Confetti />
          <div className="win-message">YOU WIN!</div>
          <div className="game-message">
            <button className="restart-button" onClick={handlePlayAgain}>
              Play Again
            </button>
          </div>
        </>
      )}
      <div className="wordle-game">
        <div className="header">
          <select>
            <option>3 Letter Word</option>
            <option>4 Letter Word</option>
            <option>5 Letter Word</option>
            <option>6 Letter Word</option>
            <option>7 Letter Word</option>
            <option>8 Letter Word</option>
            <option>9 Letter Word</option>
            <option>10 Letter Word</option>
          </select>
        </div>

        <div className="game-info">
          <div>guess: {}</div>
          <div>Level: {}</div>
          <div>Best: {}</div>
        </div>
        <div className="board">{rows}</div>
        {gameStatus === 'playing' && (
          <div className="keyboard">
            {keyboardRows.map((row, i) => (
              <div key={i} className="kbRow">
                {row.map((k) => (
                  <div
                    key={k}
                    className={`kbKey ${
                      notInSolution.has(k.toLowerCase()) ? 'notInSolution' : ''
                    } ${k === 'ENTER' ? 'wide-key' : ''}`}
                    onClick={() => onKeyPress(k === 'ENTER' ? 'ENTER' : k === 'DEL' ? 'DEL' : k)}
                  >
                    {k === 'DEL' ? '⌫' : k}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      {gameStatus === 'lost' && (
        <div className="wordle-game-over">
          <h2>Game Over!</h2>
          <p>The word was "{solution}".</p>
          <button className="restart-button" onClick={handlePlayAgain}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default WordleGame;
