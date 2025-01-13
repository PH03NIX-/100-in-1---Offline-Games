import React, { useState, useEffect, useRef } from 'react';
import './BreakoutGame.css';

const BreakoutGame = ({ setIsTimerActive, gamePaused, soundEffects }) => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('breakoutHighScore');
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [paddleWidth, setPaddleWidth] = useState(75);

  const baseVelocity = 4.5;

  const gameContainerRef = useRef(null);
  const preGameContainerRef = useRef(null);
  const animationRef = useRef(null);

  const ballsRef = useRef([]);
  const paddlePositionRef = useRef(0);
  const paddleWidthRef = useRef(paddleWidth);

  const brickColumns = 5;
  const brickRows = 6;

  const bricksRef = useRef([]);

  // Create refs for gamePaused and gameOver
  const gamePausedRef = useRef(gamePaused);
  const gameOverRef = useRef(gameOver);

  // Define the bonus and bad effects
  const BONUS_EFFECTS = [
    { type: 'POINTS', value: 3, probability: 25 },
    { type: 'POINTS', value: 5, probability: 20 },
    { type: 'POINTS', value: 10, probability: 10 },
    { type: 'POINTS', value: 25, probability: 5 },
    { type: 'LIFE', value: 1, probability: 3 },
    { type: 'PADDLE', value: 'WIDER', probability: 5 },
    { type: 'BALL', value: 'SLOWER', probability: 10 },
    { type: 'EXTRA_BALL', value: 1, probability: 17 }, // New bonus effect
  ];

  const BAD_EFFECTS = [
    { type: 'POINTS', value: -15, probability: 35 },
    { type: 'POINTS', value: -30, probability: 20 },
    { type: 'PADDLE', value: 'SHORTER', probability: 25 },
    { type: 'BALL', value: 'FASTER', probability: 20 },
  ];

  useEffect(() => {
    // Update refs when state changes
    gamePausedRef.current = gamePaused;
  }, [gamePaused]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    paddleWidthRef.current = paddleWidth;
  }, [paddleWidth]);

  useEffect(() => {
    initGame();
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initGame = () => {
    // Cancel any existing animation frame
    cancelAnimationFrame(animationRef.current);

    const containerWidth = gameContainerRef.current.offsetWidth;
    const containerHeight = gameContainerRef.current.offsetHeight;

    paddlePositionRef.current = (containerWidth - paddleWidth) / 2;

    // Initialize balls
    ballsRef.current = [
      {
        x: containerWidth / 2,
        y: containerHeight - 30,
        vx: baseVelocity + level * 0.5,
        vy: -(baseVelocity + level * 0.5),
      },
    ];

    initializeBricks();

    animationRef.current = requestAnimationFrame(gameLoop);
  };

  const initializeBricks = () => {
    const brickRowCount = brickRows;
    const brickColumnCount = brickColumns;
    const brickWidth = (gameContainerRef.current.offsetWidth / brickColumnCount)/*- (10 * (brickColumnCount - 1) ) - 20*/ -20 ;
    const bricksArray = [];

    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        const brick = {
          x: c * (brickWidth + 10) + 35,
          y: r * (20 + 10) + 30,
          status: 1,
          brickWidth: brickWidth,
        };
        bricksArray.push(brick);
      }
    }
    bricksRef.current = bricksArray;
  };

  useEffect(() => {
    const handleTouchMove = (e) => {
      e.preventDefault();
      const gameContainerRect = preGameContainerRef.current.getBoundingClientRect();
      const touchX = e.touches[0].clientX - gameContainerRect.left;
      const containerWidth = gameContainerRef.current.offsetWidth;
      let newPaddlePosition = touchX - paddleWidth / 2;
      newPaddlePosition = Math.max(
        0,
        Math.min(newPaddlePosition, containerWidth - paddleWidth)
      );
      paddlePositionRef.current = newPaddlePosition;
    };

    const preGameContainer = preGameContainerRef.current;
    preGameContainer.addEventListener('touchmove', handleTouchMove);

    return () => {
      preGameContainer.removeEventListener('touchmove', handleTouchMove);
    };
  }, [paddleWidth]);

  const gameLoop = () => {
    if (gamePausedRef.current) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    if (gameOverRef.current) return;

    const ballRadius = 10;
    const paddleHeight = 10;
    const containerWidth = gameContainerRef.current.offsetWidth;
    const containerHeight = gameContainerRef.current.offsetHeight;

    // Update positions of all balls
    ballsRef.current.forEach((ball) => {
      let newX = ball.x + ball.vx;
      let newY = ball.y + ball.vy;

      // Check for wall collisions
      if (newX - ballRadius <= 0 || newX + ballRadius >= containerWidth) {
        ball.vx = -ball.vx;
        newX = ball.x + ball.vx;
        soundEffects.play('gameAction');
      }
      if (newY - ballRadius <= 0) {
        ball.vy = -ball.vy;
        newY = ball.y + ball.vy;
        soundEffects.play('gameAction');
      }

      // Update ball position
      ball.x = newX;
      ball.y = newY;
    });

    // Handle collisions
    handleCollisions();

    if (gameOverRef.current || gameWon) {
      cancelAnimationFrame(animationRef.current);
    } else {
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    // Trigger re-render
    setDummyState((prev) => !prev);
  };

  const [dummyState, setDummyState] = useState(false); // Used to trigger re-renders

  const handleCollisions = () => {
    const ballRadius = 10;
    const paddleHeight = 10;
    const containerHeight = gameContainerRef.current.offsetHeight;
    const containerWidth = gameContainerRef.current.offsetWidth;

    const activeBalls = [];

    ballsRef.current.forEach((ball) => {
      // Wall collisions
      if (ball.x + ballRadius > containerWidth || ball.x - ballRadius < 0) {
        soundEffects.play('gameAction');
        ball.vx = -ball.vx;
      }
      if (ball.y - ballRadius < 0) {
        soundEffects.play('gameAction');
        ball.vy = -ball.vy;
      }

      // Check if the ball is off-screen first
      if (ball.y + ballRadius > containerHeight) {
        // Ball missed paddle
        soundEffects.play('badMove');
      } else {
        // Ball and paddle collision
        if (
          ball.y + ballRadius >= containerHeight - paddleHeight &&
          ball.x + ballRadius >= paddlePositionRef.current &&
          ball.x - ballRadius <=
            paddlePositionRef.current + paddleWidthRef.current
        ) {
          ball.vy = -Math.abs(ball.vy);
          ball.y = containerHeight - paddleHeight - ballRadius;
          soundEffects.play('gameAction');
        }

        // Ball and bricks collision
        for (let i = 0; i < bricksRef.current.length; i++) {
          const brick = bricksRef.current[i];
          if (brick.status === 1 && !brick.isFalling) {
            if (
              ball.x + ballRadius > brick.x &&
              ball.x - ballRadius < brick.x + brick.brickWidth &&
              ball.y + ballRadius > brick.y &&
              ball.y - ballRadius < brick.y + 20
            ) {
              // Reverse ball direction
              ball.vy = -ball.vy;
              
              const outcome = decideBrickOutcome();
              soundEffects.play('gameAction');

              if (outcome === 'DESTROY') {
                brick.status = 0;
              } else if (outcome === 'BONUS' || outcome === 'BAD') {
                // Convert brick into a falling brick
                brick.isFalling = true;
                brick.speed = Math.random() < 0.5 ? 3 : 2;
                brick.isBonus = outcome === 'BONUS';
                brick.effect = brick.isBonus
                  ? selectEffect(BONUS_EFFECTS)
                  : selectEffect(BAD_EFFECTS);
                brick.text = getEffectText(brick.effect);
              }
  
              // Update score
              setScore((prevScore) => prevScore + 1);
  
              break; // Only handle one collision per frame
            }
          }
        }

        // Ball is still active, add to activeBalls
        activeBalls.push(ball);
      }
    });

    ballsRef.current = activeBalls;

    // Check if all balls are lost
    if (ballsRef.current.length === 0) {
      setLives((prevLives) => {
        ballsRef.current = [{thisIs: 'placeholder'}];
        const newLives = prevLives - 1;
        if (newLives <= 0) {
          setGameOver(true);
          setIsTimerActive(false);
          soundEffects.play('gameOver');
        } else {
          // Add a delay before resetting
          setTimeout(() => {
            resetBallAndPaddle();
          }, 500); // 500ms delay
        }
        soundEffects.play('badMove');
        return newLives;
      });
    }

    // Update positions of falling bricks
    bricksRef.current.forEach((brick) => {
      if (brick.isFalling) {
        brick.y += brick.speed;

        // Check for collision with paddle
        if (
          brick.y + 20 >= containerHeight - paddleHeight &&
          brick.x + brick.brickWidth >= paddlePositionRef.current &&
          brick.x <= paddlePositionRef.current + paddleWidthRef.current
        ) {
          // Apply the effect
          applyBrickEffect(brick.effect);
          
          // Play sound based on brick type
          if (brick.isBonus) {
            soundEffects.play('goodMove');
          } else {
            soundEffects.play('badMove');
          }

          // Remove the falling brick
          brick.status = 0;
          brick.isFalling = false;
        } else if (brick.y > containerHeight) {
          // Remove the falling brick if it goes off-screen
          brick.status = 0;
          brick.isFalling = false;
        }
      }
    });

    // When all bricks are destroyed:
    if (bricksRef.current.every((brick) => brick.status === 0)) {
      setLevel((prevLevel) => prevLevel + 1);
      setScore((prevScore) => prevScore + 25); // Bonus for completing a level
      initializeBricks(); // Reset bricks for the new level
      increaseBallSpeed(); // Increase ball speed for the new level
      soundEffects.play('gameWon');
    }
  };
  
  const decideBrickOutcome = () => {
    const random = Math.random();

    /*if (random < 0.7) {
      // 70% chance to destroy the brick
      return 'DESTROY';
    } else if (random < 0.9) {
      // 20% chance to become a bonus falling brick
      return 'BONUS';
    } else {
      // 10% chance to become a bad falling brick
      return 'BAD';
    }*/
   if(random < 0.66) {
    return 'BONUS';
  } else {
    return 'BAD';
  }
  };

  const selectEffect = (effectsArray) => {
    const totalProbability = effectsArray.reduce(
      (sum, effect) => sum + effect.probability,
      0
    );
    const random = Math.random() * totalProbability;
    let cumulative = 0;

    for (const effect of effectsArray) {
      cumulative += effect.probability;
      if (random <= cumulative) {
        return effect;
      }
    }
    return effectsArray[effectsArray.length - 1]; // Fallback
  };

  const getEffectText = (effect) => {
    switch (effect.type) {
      case 'POINTS':
        return effect.value > 0 ? `+${effect.value}` : `${effect.value}`;
      case 'LIFE':
        return '+1 Life';
      case 'PADDLE':
        return effect.value === 'WIDER' ? 'Wider Paddle' : 'Shorter Paddle';
      case 'BALL':
        return effect.value === 'SLOWER' ? 'Slower Ball' : 'Faster Ball';
      case 'EXTRA_BALL':
        return '+1 Ball';
      default:
        return '';
    }
  };

  const applyBrickEffect = (effect) => {
    switch (effect.type) {
      case 'POINTS':
        setScore((prevScore) => prevScore + effect.value);
        break;
      case 'LIFE':
        setLives((prevLives) => prevLives + effect.value);
        break;
      case 'PADDLE':
        if (effect.value === 'WIDER') {
          setPaddleWidth((prevWidth) => prevWidth + 30);
        } else if (effect.value === 'SHORTER') {
          setPaddleWidth((prevWidth) => Math.max(prevWidth - 30, 50));
        }
        break;
      case 'BALL':
        if (effect.value === 'SLOWER') {
          ballsRef.current.forEach((ball) => {
            ball.vx *= 0.7;
            ball.vy *= 0.7;
          });
        } else if (effect.value === 'FASTER') {
          ballsRef.current.forEach((ball) => {
            ball.vx *= 1.4;
            ball.vy *= 1.4;
          });
        }
        break;
      case 'EXTRA_BALL':
        addExtraBall();
        break;
      default:
        break;
    }
  };

  const addExtraBall = () => {
    const containerWidth = gameContainerRef.current.offsetWidth;
    const containerHeight = gameContainerRef.current.offsetHeight;
    const paddleHeight = 10;

    // Add a new ball starting from the paddle position
    ballsRef.current.push({
      x: paddlePositionRef.current + paddleWidthRef.current / 2,
      y: containerHeight - paddleHeight - 10,
      vx: baseVelocity,
      vy: -1 * baseVelocity,
    });
  };

  const increaseBallSpeed = () => {
    const speedIncrease = 0.5;
    ballsRef.current.forEach((ball) => {
      ball.vx = ball.vx > 0 ? ball.vx + speedIncrease : ball.vx - speedIncrease;
      ball.vy = ball.vy > 0 ? ball.vy + speedIncrease : ball.vy - speedIncrease;
    });
  };

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('breakoutHighScore', score.toString());
    }
  }, [score, highScore]);

  const resetBallAndPaddle = () => {
    const containerWidth = gameContainerRef.current.offsetWidth;
    const containerHeight = gameContainerRef.current.offsetHeight;

    ballsRef.current = [
      {
        x: containerWidth / 2,
        y: containerHeight - 30,
        vx: baseVelocity,
        vy: -1 * baseVelocity,
      },
    ];

    paddlePositionRef.current = (containerWidth - paddleWidth) / 2;
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setIsTimerActive(true);
    setGameWon(false);
    setPaddleWidth(75); // Reset paddle width
    initGame();
    soundEffects.play('playButton'); // Play sound when restarting the game
  };

  return (
    <div className="pre-breakout-game-container" ref={preGameContainerRef}>
      <div className="breakout-game-container" ref={gameContainerRef}>
        {/* Balls */}
        {ballsRef.current.map((ball, index) => (
          <div
            key={index}
            className="ball"
            style={{
              left: ball.x - 10,
              top: ball.y - 10,
            }}
          ></div>
        ))}

        {/* Paddle */}
        <div
          className="paddle"
          style={{
            left: paddlePositionRef.current,
            width: paddleWidth,
          }}
        ></div>

        {/* Bricks */}
        {bricksRef.current.map((brick, index) => {
          if (brick.status === 1) {
            return (
              <div
                key={index}
                className={`brick ${
                  brick.isFalling
                    ? brick.isBonus
                      ? 'bonus-brick'
                      : 'bad-brick'
                    : ''
                }`}
                style={{
                  left: brick.x,
                  top: brick.y,
                  width: brick.brickWidth,
                }}
              >
                {brick.isFalling && brick.text && (
                  <span className="brick-text">{brick.text}</span>
                )}
              </div>
            );
          }
          return null;
        })}

        {/* Game Information */}
        <div className="game-info">
          <div>Score: {score}</div>
          <div>Best: {highScore}</div>
          <div>Level: {level}</div>
          <div>Lives: {lives}</div>
        </div>
      </div>

      {/* Game Over Screen */}
      {gameOver && (
        <div className="game-over">
          <h2>Game Over</h2>
          <p>Final Score: {score}</p>
          <p>Level Reached: {level}</p>
          <p>High Score: {highScore}</p>
          <button onClick={resetGame}>Restart Game</button>
        </div>
      )}
    </div>
  );
};

export default BreakoutGame;
