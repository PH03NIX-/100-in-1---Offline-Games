import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import './PongGame.css';

const PongGame = ({ gamePaused, soundEffects }) => {
  const gameAreaRef = useRef(null);

  // Game dimensions
  const [gameWidth, setGameWidth] = useState(window.innerWidth);
  const [gameHeight, setGameHeight] = useState(window.innerHeight - 66);

  const paddleWidth = 20; // Width of the paddles
  const paddleHeight = 100;
  const ballSize = 20;

  // Constants for ball speed
  const INITIAL_BALL_SPEED = 5; // Adjust as needed
  const SPEED_INCREMENT = 0.5;  // Adjust as needed

  // Game mode state: 'single' or 'multi'
  const [gameMode, setGameMode] = useState(null);

  // Refs for positions and velocities
  const playerYRef = useRef(gameHeight / 2 - paddleHeight / 2);
  const playerPrevYRef = useRef(playerYRef.current);

  const player2YRef = useRef(gameHeight / 2 - paddleHeight / 2);
  const player2PrevYRef = useRef(player2YRef.current);

  const computerYRef = useRef(gameHeight / 2 - paddleHeight / 2);
  const computerPrevYRef = useRef(computerYRef.current);

  const ballRef = useRef({});
  const lastScoredByRef = useRef('opponent'); // Start with ball on player's side

  const [playerY, setPlayerY] = useState(playerYRef.current);
  const [player2Y, setPlayer2Y] = useState(player2YRef.current);
  const [computerY, setComputerY] = useState(computerYRef.current);
  const [ball, setBall] = useState(ballRef.current);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const [playerScore, setPlayerScore] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [computerScore, setComputerScore] = useState(0);

  const gameLoopRef = useRef(null);

  // Touch mapping
  const touchPaddleMapRef = useRef({});

  const [scorePause, setScorePause] = useState(false);

  // Initialize the game when the component mounts
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight - 66;
      setGameWidth(newWidth);
      setGameHeight(newHeight);
      resetGame(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    if (gameMode !== null) {
      resetGame();
      if (!gamePaused && !isGameOver) {
        startGame();
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      stopGame();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode]);

  // Main game loop
  useEffect(() => {
    if (gamePaused || isGameOver || gameWon || scorePause) {
      stopGame();
    } else if (gameMode !== null) {
      startGame();
    }

    return () => stopGame();
  }, [gamePaused, isGameOver, gameWon, gameMode, scorePause]);

  const startGame = () => {
    if (gameLoopRef.current) return; // Don't start if already running
    gameLoopRef.current = setInterval(() => {
      // Calculate paddle Y speed
      const playerYSpeed = playerYRef.current - playerPrevYRef.current;

      let player2YSpeed = 0;
      if (gameMode === 'multi') {
        player2YSpeed = player2YRef.current - player2PrevYRef.current;
      }

      moveBall(playerYSpeed, player2YSpeed);

      if (gameMode === 'single') {
        moveComputerPaddle();
      }

      // Update state to trigger re-renders
      setBall({ ...ballRef.current });
      setPlayerY(playerYRef.current);
      if (gameMode === 'multi') {
        setPlayer2Y(player2YRef.current);
      } else {
        setComputerY(computerYRef.current);
      }

      // Store the current position for the next frame
      playerPrevYRef.current = playerYRef.current;
      if (gameMode === 'single') {
        computerPrevYRef.current = computerYRef.current;
      } else {
        player2PrevYRef.current = player2YRef.current;
      }
    }, 16); // Update every ~16ms (~60 FPS)
  };

  const stopGame = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  const resetGame = (newWidth = gameWidth, newHeight = gameHeight) => {
    soundEffects.play('playButton');
    playerYRef.current = newHeight / 2 - paddleHeight / 2;
    playerPrevYRef.current = playerYRef.current;
    setPlayerY(playerYRef.current);

    if (gameMode === 'multi') {
      player2YRef.current = newHeight / 2 - paddleHeight / 2;
      player2PrevYRef.current = player2YRef.current;
      setPlayer2Y(player2YRef.current);
    } else {
      computerYRef.current = newHeight / 2 - paddleHeight / 2;
      computerPrevYRef.current = computerYRef.current;
      setComputerY(computerYRef.current);
    }

    lastScoredByRef.current = 'opponent'; // Ball starts from player's side
    setPlayerScore(0);
    setComputerScore(0);
    setPlayer2Score(0);
    setIsGameOver(false);
    setGameWon(false);
    resetBall();
  };

  const moveBall = (playerYSpeed, player2YSpeed) => {
    let { x, y, velocityX, velocityY, speed } = ballRef.current;

    // Update ball position
    let newX = x + velocityX;
    let newY = y + velocityY;

    // Collision with top and bottom walls
    if (newY <= 0 || newY + ballSize >= gameHeight) {
      velocityY = -velocityY;
      soundEffects.play('gameAction');
    }

    // Collision with left paddle
    if (
      newX <= paddleWidth &&
      newY + ballSize >= playerYRef.current &&
      newY <= playerYRef.current + paddleHeight
    ) {
      newX = paddleWidth;

      // Increase ball speed
      speed += SPEED_INCREMENT;
      ballRef.current.speed = speed;

      // Adjust angle based on where it hit the paddle
      const relativeIntersectY =
        playerYRef.current + paddleHeight / 2 - (newY + ballSize / 2);
      const normalizedRelativeIntersectionY =
        relativeIntersectY / (paddleHeight / 2);
      const bounceAngle = normalizedRelativeIntersectionY * (Math.PI / 4);

      // Calculate new velocities based on the bounce angle and new speed
      velocityX = speed * Math.cos(bounceAngle);
      velocityY = -speed * Math.sin(bounceAngle);

      // Factor in paddle's vertical movement
      const influenceFactor = 0.55; // Adjust as needed
      velocityY += playerYSpeed * influenceFactor;

      // Normalize velocities to match the new speed
      const newVelocityMagnitude = Math.sqrt(
        velocityX * velocityX + velocityY * velocityY
      );
      const speedScale = speed / newVelocityMagnitude;
      velocityX *= speedScale;
      velocityY *= speedScale;
      soundEffects.play('gameAction');
    }
    // Collision with right paddle
    else if (
      newX + ballSize >= gameWidth - paddleWidth &&
      newY + ballSize >= (gameMode === 'single' ? computerYRef.current : player2YRef.current) &&
      newY <= (gameMode === 'single' ? computerYRef.current : player2YRef.current) + paddleHeight
    ) {
      newX = gameWidth - paddleWidth - ballSize;

      // Increase ball speed
      speed += SPEED_INCREMENT;
      ballRef.current.speed = speed;

      // Adjust angle based on where it hit the paddle
      const relativeIntersectY =
        (gameMode === 'single' ? computerYRef.current : player2YRef.current) +
        paddleHeight / 2 -
        (newY + ballSize / 2);
      const normalizedRelativeIntersectionY =
        relativeIntersectY / (paddleHeight / 2);
      const bounceAngle = normalizedRelativeIntersectionY * (Math.PI / 4);

      // Calculate new velocities based on the bounce angle and new speed
      velocityX = -speed * Math.cos(bounceAngle);
      velocityY = -speed * Math.sin(bounceAngle);

      // Factor in paddle's vertical movement in multi-player mode
      if (gameMode === 'multi') {
        const influenceFactor = 0.55; // Adjust as needed
        velocityY += player2YSpeed * influenceFactor;
      }

      // Normalize velocities to match the new speed
      const newVelocityMagnitude = Math.sqrt(
        velocityX * velocityX + velocityY * velocityY
      );
      const speedScale = speed / newVelocityMagnitude;
      velocityX *= speedScale;
      velocityY *= speedScale;
      soundEffects.play('gameAction');
    }

    // Scoring
    if (newX <= 0 || newX + ballSize >= gameWidth) {
      if (newX <= 0) {
        // Opponent scores
        if (gameMode === 'single') {
          setComputerScore((prevScore) => prevScore + 1);
          soundEffects.play('badMove');
        } else {
          setPlayer2Score((prevScore) => prevScore + 1);
          soundEffects.play('goodMove');
        }
        lastScoredByRef.current = 'opponent';
      } else {
        // Player scores
        setPlayerScore((prevScore) => prevScore + 1);
        soundEffects.play('goodMove');
        lastScoredByRef.current = 'player';
      }

      // Pause the game for 0.5 seconds
      setScorePause(true);
      setTimeout(() => {
        setScorePause(false);
        resetBall();
      }, 500);

      return;
    }

    // Update the ball ref
    ballRef.current = { x: newX, y: newY, velocityX, velocityY, speed };
  };

  const resetBall = () => {
    const angleRange = Math.PI / 4; // 45 degrees
    const angleOffset = -Math.PI / 8; // Centered around 0
    const angle = Math.random() * angleRange + angleOffset;
    const speed = INITIAL_BALL_SPEED;
    let velocityX, velocityY, x, y;

    if (lastScoredByRef.current === 'player') {
      // Player scored last, ball starts from opponent's side towards player
      x = gameWidth - paddleWidth - ballSize - 1;
      y =
        (gameMode === 'multi' ? player2YRef.current : computerYRef.current) +
        paddleHeight / 2 -
        ballSize / 2;
      velocityX = -speed * Math.cos(angle);
      velocityY = speed * Math.sin(angle);
    } else {
      // Opponent scored last or game start, ball starts from player's side towards opponent
      x = paddleWidth + 1;
      y = playerYRef.current + paddleHeight / 2 - ballSize / 2;
      velocityX = speed * Math.cos(angle);
      velocityY = speed * Math.sin(angle);
    }

    ballRef.current = {
      x,
      y,
      speed,
      velocityX,
      velocityY,
    };
    setBall({ ...ballRef.current });
  };

  const moveComputerPaddle = () => {
    const paddleCenter = computerYRef.current + paddleHeight / 2;
    const ballCenterY = ballRef.current.y + ballSize / 2;
    const speed = 5; // Adjust speed as necessary

    if (paddleCenter < ballCenterY - 5) {
      computerYRef.current = Math.min(
        computerYRef.current + speed,
        gameHeight - paddleHeight
      );
    } else if (paddleCenter > ballCenterY + 5) {
      computerYRef.current = Math.max(computerYRef.current - speed, 0);
    }
    // No need to set state here; it will be updated in the game loop
  };

  // Handle touch input for paddles
  useEffect(() => {
    const handleTouchStart = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const touchX = touch.clientX;
        const halfWidth = gameWidth / 2;
        const touchId = touch.identifier;

        if (touchX < halfWidth) {
          // Left half of screen, player 1
          if (touchPaddleMapRef.current['player1'] === undefined) {
            touchPaddleMapRef.current['player1'] = touchId;
          }
        } else {
          // Right half of screen, player 2
          if (touchPaddleMapRef.current['player2'] === undefined) {
            touchPaddleMapRef.current['player2'] = touchId;
          }
        }
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const touchId = touch.identifier;

        if (touchPaddleMapRef.current['player1'] === touchId) {
          const touchY = touch.clientY;
          const newY = Math.min(
            Math.max(touchY - paddleHeight / 2, 0),
            gameHeight - paddleHeight
          );
          playerYRef.current = newY;
          setPlayerY(newY);
        } else if (touchPaddleMapRef.current['player2'] === touchId) {
          const touchY = touch.clientY;
          const newY = Math.min(
            Math.max(touchY - paddleHeight / 2, 0),
            gameHeight - paddleHeight
          );
          player2YRef.current = newY;
          setPlayer2Y(newY);
        }
      }
    };

    const handleTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const touchId = touch.identifier;
        if (touchPaddleMapRef.current['player1'] === touchId) {
          delete touchPaddleMapRef.current['player1'];
        }
        if (touchPaddleMapRef.current['player2'] === touchId) {
          delete touchPaddleMapRef.current['player2'];
        }
      }
    };

    const gameArea = gameAreaRef.current;
    gameArea.addEventListener('touchstart', handleTouchStart);
    gameArea.addEventListener('touchmove', handleTouchMove);
    gameArea.addEventListener('touchend', handleTouchEnd);
    gameArea.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      gameArea.removeEventListener('touchstart', handleTouchStart);
      gameArea.removeEventListener('touchmove', handleTouchMove);
      gameArea.removeEventListener('touchend', handleTouchEnd);
      gameArea.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [gameWidth, gameHeight]);

  const handleMouseMove = (e) => {
    if (!gamePaused && gameMode !== null) {
      const mouseX = e.clientX;
      const halfWidth = gameWidth / 2;
      const newY = Math.min(
        Math.max(e.clientY - paddleHeight / 2, 0),
        gameHeight - paddleHeight
      );
      if (gameMode === 'single' || mouseX < halfWidth) {
        // Left paddle
        playerYRef.current = newY;
        setPlayerY(newY);
      } else if (gameMode === 'multi' && mouseX >= halfWidth) {
        // Right paddle
        player2YRef.current = newY;
        setPlayer2Y(newY);
      }
    }
  };

  // Game over logic
  useEffect(() => {
    if (gameMode === 'single') {
      if (playerScore >= 11 && playerScore - computerScore >= 2) {
        setGameWon(true);
        soundEffects.play('gameWon');
      } else if (computerScore >= 11 && computerScore - playerScore >= 2) {
        setIsGameOver(true);
        soundEffects.play('gameOver');
      }
    }
    else {      
      if (playerScore >= 11 && playerScore - player2Score >= 2) {
        setGameWon(true);
        soundEffects.play('gameWon');
      } else if (player2Score >= 11 && player2Score - playerScore >= 2) {
        setGameWon(true);
        soundEffects.play('gameWon');
      }
    }
  }, [playerScore, computerScore, player2Score, gameMode]);

  return (
    <div className='pre-pong-game-area'>
      {gameMode === null ? (
        <div className="game-mode-selection"
          ref={gameAreaRef}>
          <h2>Select Game Mode</h2>
          <button onClick={() => setGameMode('single')}><span className="emoji">👤</span> Single Player</button>
          <button onClick={() => setGameMode('multi')}><span className="emoji">👤👤</span> Two Player</button>
        </div>
      ) : (
        <div
          className="pong-game-area"
          ref={gameAreaRef}
          onTouchMove={(e) => e.preventDefault()}
          onMouseMove={handleMouseMove}
        >          
          {gameWon && (
            <>
              <Confetti />
              <div className="win-message">{gameMode === 'single' ? 'YOU WIN!' : playerScore > player2Score ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!'}</div>
              {gameMode !== 'single' && 
                <div className={`win-message2 ${playerScore > player2Score ? 'winLeft' : 'winRight'}`}>
                  {playerScore > player2Score ? '⬅' : '⮕'}
                </div>
              }
            </>
          )}
          {/* Scores */}
          <div className="score player-score">{playerScore}</div>
          <div className="score computer-score">
            {gameMode === 'single' ? computerScore : player2Score}
          </div>

          {/* Player 1 Paddle */}
          <div className="paddle player-paddle" style={{ top: playerY }} />

          {/* Player 2 or Computer Paddle */}
          <div
            className={
              gameMode === 'single'
                ? 'paddle computer-paddle'
                : 'paddle player2-paddle'
            }
            style={{
              top: gameMode === 'single' ? computerY : player2Y,
            }}
          />

          {/* Ball */}
          <div className="ball" style={{ left: ball.x, top: ball.y }} />

          {gamePaused && (
            <div className="pause-overlay">
              <h2>Game Paused</h2>
            </div>
          )}
          {gameWon && (
            <button onClick={resetGame} className="play-again-button">
              Play Again
            </button>
          )}
          {scorePause && (
            <div className="score-pause-overlay">
              <h2>Score!</h2>
            </div>
          )}
        </div>
      )}
      {isGameOver && (
        <div className="game-over">
          <h2>Game Over</h2>
          <p>Final Score: {playerScore}</p>
          <p>Opponent Score: {computerScore}</p>
          <button onClick={resetGame}>Restart Game</button>
        </div>
      )}
    </div>
  );
};

export default PongGame;
