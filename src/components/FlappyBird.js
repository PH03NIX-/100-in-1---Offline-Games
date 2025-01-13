import React, { useState, useEffect, useRef } from 'react';
import './FlappyBird.css';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const GRAVITY = 0.25;
const JUMP_HEIGHT = 5; //6.5
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 30;
const BIRD_LEFT = 50;

const FlappyBird = ({setIsTimerActive, soundEffects}) => {
  const [birdPosition, setBirdPosition] = useState(300);
  const [pipes, setPipes] = useState([]);
  const [gameHasStarted, setGameHasStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('flappyBirdHighScore');
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const birdVelocityRef = useRef(0);
  const birdPositionRef = useRef(birdPosition);
  const pipesRef = useRef(pipes);
  const gameLoopRef = useRef(null);
  const pipeGeneratorRef = useRef(null);
  const [lastTapTime, setLastTapTime] = useState(0);

  // Update refs whenever state changes
  useEffect(() => {
    birdPositionRef.current = birdPosition;
  }, [birdPosition]);

  useEffect(() => {
    pipesRef.current = pipes;
  }, [pipes]);

  // Start the game
  const startGame = () => {
    setGameHasStarted(true);
    setGameOver(false);
    setIsTimerActive(true);
    setPipes([]);
    setScore(0);
    setBirdPosition(300);
    soundEffects.play('playButton');
    birdVelocityRef.current = 0;

    // Game loop
    gameLoopRef.current = setInterval(() => {
      setBirdPosition((prevPosition) => {
        const newPosition = prevPosition + birdVelocityRef.current;
        birdVelocityRef.current += GRAVITY;
        return newPosition;
      });

      setPipes((prevPipes) => {
        const newPipes = prevPipes
          .map((pipe) => {
            const newX = pipe.x - 2;
            let passed = pipe.passed;

            // Scoring
            if (!passed && newX + PIPE_WIDTH < BIRD_LEFT) {
              passed = true;
              setScore((prevScore) => {
                const newScore = prevScore + 1;
                soundEffects.play('goodMove');
                if (newScore > highScore) {
                  setHighScore(newScore);
                  localStorage.setItem('flappyBirdHighScore', newScore.toString());
                }
                return newScore;
              });
            }

            return {
              ...pipe,
              x: newX,
              passed,
            };
          })
          .filter((pipe) => pipe.x + PIPE_WIDTH > 0);

        return newPipes;
      });

      checkCollision();
    }, 20);

    // Pipe generator
    pipeGeneratorRef.current = setInterval(() => {
      const gapTop = Math.floor(Math.random() * (GAME_HEIGHT - PIPE_GAP - 100)) + 50;
      setPipes((prevPipes) => [
        ...prevPipes,
        {
          x: GAME_WIDTH,
          gapTop,
          passed: false,
        },
      ]);
    }, 2000);
  };

  // Stop the game
  const stopGame = () => {
    clearInterval(gameLoopRef.current);
    clearInterval(pipeGeneratorRef.current);
    setGameHasStarted(false);
    setGameOver(true);
    soundEffects.play('gameOver');
    setIsTimerActive(false);
  };

  // Check for collisions
  const checkCollision = () => {
    const birdTop = birdPositionRef.current;
    const birdBottom = birdTop + BIRD_HEIGHT;

    // Check ground and ceiling
    if (birdTop <= 0 || birdBottom >= GAME_HEIGHT - 50) {
      console.log("Collision with ground/ceiling");
      stopGame();
      return;
    }

    // Check pipes
    for (const pipe of pipesRef.current) {
      if (
        BIRD_LEFT + BIRD_WIDTH > pipe.x &&
        BIRD_LEFT < pipe.x + PIPE_WIDTH &&
        (birdTop < pipe.gapTop || birdBottom > pipe.gapTop + PIPE_GAP)
      ) {
        console.log("Collision with pipe");
        stopGame();
        return;
      }
    }
  };

  // Handle touch input
  const handleTap = (e) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Stop event propagation

    const currentTime = new Date().getTime();
    const tapInterval = currentTime - lastTapTime;

    // Ignore taps that are too close together (e.g., within 100ms)
    if (tapInterval < 150) {
      return;
    }

    setLastTapTime(currentTime);

    if (gameOver) {
      // startGame();
    } else if (!gameHasStarted) {
      startGame();
    } else {
      soundEffects.play('gameAction');
      birdVelocityRef.current = -JUMP_HEIGHT;
    }
  };

  return (
    <div
      className="pre-bird-game-container"
      onMouseDown={handleTap}
      onTouchStart={handleTap}
    >
      <div
        className="bird-game-container"
      >
        {!gameOver && (
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
        )}
        {/* Bird */}
        <div
          className="bird"
          style={{
            top: birdPosition,
            transform: `rotate(${birdVelocityRef.current * 3}deg)`,
          }}
        />

        {/* Pipes */}
        {pipes.map((pipe, index) => (
          <div key={index}>
            {/* Top Pipe */}
            <div
              className="pipe"
              style={{
                left: pipe.x,
                height: pipe.gapTop,
                top: 0,
              }}
            />
            {/* Bottom Pipe */}
            <div
              className="pipe"
              style={{
                left: pipe.x,
                height: GAME_HEIGHT - pipe.gapTop - PIPE_GAP - 50,
                top: pipe.gapTop + PIPE_GAP,
              }}
            />
          </div>
        ))}

        {/* Ground */}
        <div className="ground" />

        {!gameHasStarted && !gameOver && <div className="start-message">Tap to Start</div>}
      </div>
        {gameOver && (
          <div className="game-over">
            <h2>Game Over!</h2>
            <p>Score: {score}</p>
            <p>High Score: {highScore}</p>
            <button onClick={startGame}>Play Again</button>
          </div>
        )}
    </div>
  );
};

export default FlappyBird;
