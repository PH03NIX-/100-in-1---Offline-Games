import React, { useState, useEffect, useRef } from 'react';
import './SimonGame.css';

const SimonGame = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
  const colors = ['green', 'red', 'yellow', 'blue'];
  const colorSounds = {
    red: 'gameAction',
    green: 'gameAction5',
    blue: 'gameAction8',
    yellow: 'gameAction12'
  };
  const [gameSequence, setGameSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [activeColor, setActiveColor] = useState(null);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting'); // 'waiting', 'playing', 'gameover'
  const [level, setLevel] = useState(0);
  const [bestLevel, setBestLevel] = useState(0);
  const [newBestLevel, setNewBestLevel] = useState(false);
  const [currentComputerStep, setCurrentComputerStep] = useState(0);
  const [currentUserStep, setCurrentUserStep] = useState(0);

  const timeoutRef = useRef(null);

  useEffect(() => {
    // Load best level from localStorage
    const savedBestLevel = localStorage.getItem('simonGameBestLevel') || 0;
    setBestLevel(parseInt(savedBestLevel, 10));
  }, []);

  useEffect(() => {
    // Update best level if current level is higher
    if (level > bestLevel) {
      setBestLevel(level);
      localStorage.setItem('simonGameBestLevel', level.toString());
      if(!newBestLevel) {
        soundEffects.play('gameWon');
        setNewBestLevel(true);
      }
    }
  }, [level, bestLevel]);

  const startGame = () => {
    // Reset all game-related states
    soundEffects.play('playButton');
    setGameSequence([]);
    setUserSequence([]);
    setActiveColor(null);
    setIsUserTurn(false);
    setGameStatus('playing');
    setLevel(0);
    setNewBestLevel(false);
    setCurrentComputerStep(0);
    setCurrentUserStep(0);

    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Start the first round after a short delay
    timeoutRef.current = setTimeout(() => {
      nextRound(true);  // Pass true to indicate it's a new game
    }, 500);
  };

  const nextRound = (isNewGame = false) => {
    const nextColor = colors[Math.floor(Math.random() * colors.length)];
    setGameSequence(prevSequence => isNewGame ? [nextColor] : [...prevSequence, nextColor]);
    setUserSequence([]);
    setCurrentUserStep(0);
    setLevel(prevLevel => prevLevel + 1);
    
    // Use the updated gameSequence
    setTimeout(() => {
      playSequence(isNewGame ? [nextColor] : [...gameSequence, nextColor]);
    }, 0);
  };

  const playColorSound = (color) => {
    soundEffects.play(colorSounds[color]);
  };

  const playSequence = (sequence) => {
    setIsUserTurn(false);
    setCurrentComputerStep(0);
    let i = 0;
    const interval = setInterval(() => {
      setCurrentComputerStep(i + 1);
      setActiveColor(sequence[i]);
      playColorSound(sequence[i]);
      setTimeout(() => {
        setActiveColor(null);
        i++;
        if (i >= sequence.length) {
          clearInterval(interval);
          setIsUserTurn(true);
          setCurrentComputerStep(0);
        }
      }, 300);
    }, 600);
  };

  const handleUserInput = (color) => {
    if (!isUserTurn || gameStatus !== 'playing') return;

    playColorSound(color);

    const newUserSequence = [...userSequence, color];
    setUserSequence(newUserSequence);
    setActiveColor(color);
    setCurrentUserStep(newUserSequence.length);
    setTimeout(() => {
      setActiveColor(null);
    }, 300);

    const currentIndex = newUserSequence.length - 1;
    if (newUserSequence[currentIndex] !== gameSequence[currentIndex]) {
      // Game Over
      setGameStatus('gameover');
      setIsUserTurn(false);
      setCurrentComputerStep(0);
      setCurrentUserStep(0);
      soundEffects.play('gameOver');
      return;
    }

    if (newUserSequence.length === gameSequence.length) {
      // Correct sequence
      setIsUserTurn(false);
      setCurrentUserStep(0);
      soundEffects.play('goodMove');
      setTimeout(() => {
        nextRound();
      }, 1000);
    }
  };

  return (
    <div className="pre-simon-game">
      <div className="simon-game">
        <div className="game-info">
          <div className="level">Level: {level}</div>
          <div className="best-level">Best: {bestLevel}</div>
        </div>
        <div className="game-area">
          <div className="info">
            {gameStatus === 'waiting' && (
              <button className="start-button" onClick={startGame}>
                Start Game
              </button>
            )}
            {gameStatus === 'playing' && !isUserTurn && currentComputerStep > 0 && (
              <div style={{ color: 'red' }}>
                Computer showing pattern {currentComputerStep}/{gameSequence.length}
                <div className="status-bar">
                  <div
                    className="status-bar-fill"
                    style={{ width: `${(currentComputerStep / gameSequence.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            {gameStatus === 'playing' && isUserTurn && (
              <div style={{ color: 'green' }}>
                Player's turn: repeat pattern {currentUserStep}/{gameSequence.length}
                <div className="status-bar">
                  <div
                    className="status-bar-fill"
                    style={{ width: `${(currentUserStep / gameSequence.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <div className="game-board">
            {colors.map((color) => (
              <div
                key={color}
                className={`color-button ${color} ${activeColor === color ? 'active' : ''}`}
                onClick={() => handleUserInput(color)}
              ></div>
            ))}
          </div>
        </div>
      </div>
      {gameStatus === 'gameover' && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Level: {level}</p>
          <p>Best: {bestLevel}</p>
          <button onClick={startGame}>Restart Game</button>
        </div>
      )}
    </div>
  );
};

export default SimonGame;
