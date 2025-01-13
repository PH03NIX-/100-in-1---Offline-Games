import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import './WordleGame.css';

function WordleGame({ playtime, gamePaused, setIsTimerActive, soundEffects, wordList }) {
  const [wordLength, setWordLength] = useState(5);
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing');
  const [notInSolution, setNotInSolution] = useState(new Set());
  const [currentGuessNumber, setCurrentGuessNumber] = useState(1);
  const [timer, setTimer] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    // Load best scores for each word length from localStorage
    const saved = localStorage.getItem('wordleBestScores');
    return saved ? JSON.parse(saved) : {};
  });
  const [keyboardStatus, setKeyboardStatus] = useState({});
  
  const maxAttempts = 6;

  function getGuessEvaluation(guess, solution) {
    const solutionLetters = solution.split('');
    const guessLetters = guess.split('');
  
    const result = Array(wordLength).fill('absent');
    for (let i = 0; i < wordLength; i++) {
      if (guessLetters[i] === solutionLetters[i]) {
        result[i] = 'correct';
        solutionLetters[i] = null;
      }
    }
    for (let i = 0; i < wordLength; i++) {
      if (result[i] === 'correct') continue;
      const index = solutionLetters.indexOf(guessLetters[i]);
      if (index !== -1) {
        result[i] = 'present';
        solutionLetters[index] = null;
      }
    }
    return result;
  }

  const initializeGame = (length) => {
    const filteredWords = wordList.filter(word => word.length === length);
    console.log(`${length}-letter words:`, filteredWords);
    const sol = filteredWords[Math.floor(Math.random() * filteredWords.length)].toLowerCase();
    console.log(`solution: ${sol}`);
    setSolution(sol);
    setGuesses([]);
    setCurrentGuess('');
    setEvaluations([]);
    setGameStatus('playing');
    setNotInSolution(new Set());
    setIsTimerActive(true);
    setTimer(0);
    setCurrentGuessNumber(1);
    setKeyboardStatus({});
  };

  const handleWordLengthChange = (e) => {
    const newLength = parseInt(e.target.value);
    setWordLength(newLength);
    setKeyboardStatus({});
    initializeGame(newLength);
  };

  useEffect(() => {
    initializeGame(wordLength);
  }, [wordList]);

  useEffect(() => {
    if (gamePaused) {
      setIsTimerActive(false);
    } else if (gameStatus === 'playing') {
      setIsTimerActive(true);
    }
  }, [gamePaused, gameStatus, setIsTimerActive]);

  useEffect(() => {
    document.documentElement.style.setProperty('--word-length', wordLength);
  }, [wordLength]);

  useEffect(() => {
    let interval;
    if (gameStatus === 'playing' && !gamePaused) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus, gamePaused]);

  useEffect(() => {
    if (gameStatus !== 'won') {
      setCurrentGuessNumber(guesses.length + 1);
    }
  }, [guesses, gameStatus]);

  const checkAndUpdateBestScore = (guessCount, timeElapsed) => {
    const currentWordLength = wordLength.toString();
    const currentBest = bestScore[currentWordLength];
    
    let shouldUpdate = false;
    
    if (!currentBest) {
      shouldUpdate = true;
    } else {
      // If current guess count is better, or equal with better time
      if (guessCount < currentBest.guesses || 
          (guessCount === currentBest.guesses && timeElapsed < currentBest.time)) {
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      const newBestScore = {
        ...bestScore,
        [currentWordLength]: {
          guesses: guessCount,
          time: timeElapsed
        }
      };
      setBestScore(newBestScore);
      localStorage.setItem('wordleBestScores', JSON.stringify(newBestScore));
    }
  };

  const onKeyPress = (key) => {
    if (gamePaused || gameStatus !== 'playing') return;
    if (key === 'ENTER' && currentGuess.length === wordLength) {
      if (!wordList.includes(currentGuess.toLowerCase())) {
        soundEffects.play('badMove');
        setCurrentGuess(''); 
        return; 
      }
      soundEffects.play('goodMove');
      const evalResult = getGuessEvaluation(currentGuess.toLowerCase(), solution);
      
      const newNotInSolution = new Set(notInSolution);
      currentGuess.toLowerCase().split('').forEach((letter, index) => {
        if (evalResult[index] === 'absent' && !solution.includes(letter)) {
          newNotInSolution.add(letter);
        }
      });
      setNotInSolution(newNotInSolution);

      const newKeyboardStatus = { ...keyboardStatus };
      currentGuess.toLowerCase().split('').forEach((letter, index) => {
        const currentStatus = newKeyboardStatus[letter];
        const newStatus = evalResult[index];
        
        if (newStatus === 'correct' || 
            (newStatus === 'present' && currentStatus !== 'correct')) {
          newKeyboardStatus[letter] = newStatus;
        } else if (!currentStatus && newStatus === 'absent') {
          newKeyboardStatus[letter] = 'absent';
        }
      });
      setKeyboardStatus(newKeyboardStatus);

      if (evalResult.every(e => e === 'correct')) {
        setGameStatus('won');
        soundEffects.play('gameWon');
        setIsTimerActive(false);
        checkAndUpdateBestScore(currentGuessNumber, timer);
        setGuesses([...guesses, currentGuess]);
        setEvaluations([...evaluations, evalResult]);
        setCurrentGuess('');
      } else {
        setGuesses([...guesses, currentGuess]);
        setEvaluations([...evaluations, evalResult]);
        setCurrentGuess('');
        if (guesses.length + 1 === maxAttempts) {
          setGameStatus('lost');
          soundEffects.play('gameOver');
          setIsTimerActive(false);
        }
      }
    } else if (key === 'DEL') {
      setCurrentGuess(currentGuess.slice(0, -1));
      soundEffects.play('lazer');
    } else if (currentGuess.length < wordLength && /^[a-zA-Z]$/.test(key)) {
      setCurrentGuess(currentGuess + key.toLowerCase());
      soundEffects.play('gameAction');
    }
  };

  const rows = [];
  for (let i = 0; i < maxAttempts; i++) {
    const guess = guesses[i] || (i === guesses.length ? currentGuess : '');
    const rowEval = evaluations[i] || [];
    const cells = [];
    for (let c = 0; c < wordLength; c++) {
      const letter = guess[c] || '';
      let className = 'cell';
      
      if (i === guesses.length) {
        className = `cell current`;
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
    setKeyboardStatus({});
    initializeGame(wordLength);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <select value={wordLength} onChange={handleWordLengthChange}>
            <option value={3}>3 Letter Word</option>
            <option value={4}>4 Letter Word</option>
            <option value={5}>5 Letter Word</option>
            <option value={6}>6 Letter Word</option>
            <option value={7}>7 Letter Word</option>
            <option value={8}>8 Letter Word</option>
            <option value={9}>9 Letter Word</option>
            <option value={10}>10 Letter Word</option>
            <option value={11}>11 Letter Word</option>
            <option value={12}>12 Letter Word</option>
            <option value={13}>13 Letter Word</option>
          </select>
        </div>

        <div className="game-info">
          <div>
            Guess: <span className={
              bestScore[wordLength] && 
              (currentGuessNumber < bestScore[wordLength].guesses || 
               (currentGuessNumber === bestScore[wordLength].guesses && timer < bestScore[wordLength].time))
              ? 'better-score'
              : ''
            }>{currentGuessNumber}</span>
          </div>
          <div>
            Time: <span className={
              bestScore[wordLength] && 
              (currentGuessNumber < bestScore[wordLength].guesses || 
               (currentGuessNumber === bestScore[wordLength].guesses && timer < bestScore[wordLength].time))
              ? 'better-score'
              : ''
            }>{formatTime(timer)}</span>
          </div>
          <div>Best: {bestScore[wordLength] 
            ? `${bestScore[wordLength].guesses} in ${formatTime(bestScore[wordLength].time)}` 
            : 'N/A'}</div>
        </div>
        <div className="board">{rows}</div>
        {gameStatus === 'playing' && (
          <div className="keyboard">
            {keyboardRows.map((row, i) => (
              <div key={i} className="kbRow">
                {row.map((k) => {
                  const status = keyboardStatus[k.toLowerCase()];
                  return (
                    <div
                      key={k}
                      className={`kbKey ${
                        status === 'correct' ? 'correct' :
                        status === 'present' ? 'present' :
                        status === 'absent' ? 'notInSolution' : ''
                      } ${k === 'ENTER' ? 'wide-key' : ''}`}
                      onClick={() => onKeyPress(k === 'ENTER' ? 'ENTER' : k === 'DEL' ? 'DEL' : k)}
                    >
                      {k === 'DEL' ? '⌫' : k}
                    </div>
                  );
                })}
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
