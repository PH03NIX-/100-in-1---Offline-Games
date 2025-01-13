import React, { useState, useEffect, useRef } from 'react';
import './PlatformRunnerGame.css';

const GRAVITY = 900; // Adjusted for deltaTime
const JUMP_FORCE = 600; // Adjusted for deltaTime
const INITIAL_SPEED = 300; // Adjusted for deltaTime
const SCORE_INCREMENT = 100; // Adjusted for deltaTime

const PlatformRunnerGame = ({ setIsTimerActive, gamePaused, soundEffects }) => {
  const [character, setCharacter] = useState({
    x: 50,
    y: 100, // Will be set in setInitialCharacterPosition
    width: 50,
    height: 50,
    velocityY: 0,
    velocityX: 0,
    isJumping: false,
  });

  const characterRef = useRef(character);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('platformRunnerHighScore');
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const [isGameOver, setIsGameOver] = useState(false);

  const speed = useRef(INITIAL_SPEED);
  const platformsRef = useRef([]);
  const obstaclesRef = useRef([]);

  const gameContainerRef = useRef(null);
  const gameLoopRef = useRef(null);
  const lastFrameTimeRef = useRef(performance.now());

  const [gameHeight, setGameHeight] = useState(0);
  const [gameWidth, setGameWidth] = useState(0);
  const gameWidthRef = useRef(0);
  const gameHeightRef = useRef(0);

  useEffect(() => {
    const container = gameContainerRef.current;
    const rect = container.getBoundingClientRect();
    setGameHeight(rect.height);
    setGameWidth(rect.width);
    gameWidthRef.current = rect.width;
    gameHeightRef.current = rect.height;
    // Add touch event listener to the document
    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      // Remove the event listener when the component unmounts
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  useEffect(() => {
    if (gameHeightRef.current > 0 && gameWidthRef.current > 0) {
      generateInitialPlatforms();
      setInitialCharacterPosition();
      startGame();

      // Increase speed over time
      const speedInterval = setInterval(() => {
        speed.current += 3; // Adjusted for deltaTime
      }, 1000);

      return () => {
        stopGame();
        clearInterval(speedInterval);
      };
    }
  }, [gameHeightRef.current, gameWidthRef.current]);

  useEffect(() => {
    if (gamePaused || isGameOver) {
      stopGame();
    } else {
      lastFrameTimeRef.current = performance.now(); // Reset the frame time
      startGame();
    }
  }, [gamePaused, isGameOver]);

  const setInitialCharacterPosition = () => {
    const initialPlatformY = gameHeightRef.current - 100; // Same as the first platform's y
    setCharacter((prev) => {
      const newCharacter = {
        ...prev,
        y: initialPlatformY - 150, // Adjusted as per your code
        x: 50,
      };
      characterRef.current = newCharacter;
      return newCharacter;
    });
  };

  const startGame = () => {
    lastFrameTimeRef.current = performance.now(); // Reset the frame time
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const stopGame = () => {
    cancelAnimationFrame(gameLoopRef.current);
    setIsTimerActive(false);
  };

  const gameLoop = (currentTime) => {
    const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000; // Convert to seconds
    lastFrameTimeRef.current = currentTime;

    updatePlatforms(deltaTime);
    updateObstacles(deltaTime);
    updateCharacter(deltaTime);
    updateScore(deltaTime);

    // Use characterRef.current to get the latest character state
    if (isCharacterOffScreen(characterRef.current)) {
      setIsGameOver(true);
    } else {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();

    setCharacter((prev) => {
      if (!prev.isJumping) {
        soundEffects.play('gameAction');
        const newCharacter = { ...prev, velocityY: -JUMP_FORCE, isJumping: true };
        characterRef.current = newCharacter;
        return newCharacter;
      }
      return prev;
    });
  };

  const generateInitialPlatforms = () => {
    const initialPlatforms = [];
    for (let i = 0; i < 5; i++) {
      initialPlatforms.push({
        x: i * 300,
        y: gameHeightRef.current - 100,
        width: 300,
        height: 20,
      });
    }
    platformsRef.current = initialPlatforms;
  };

  const updatePlatforms = (deltaTime) => {
    const newPlatforms = platformsRef.current
      .map((platform) => ({
        ...platform,
        x: platform.x - speed.current * deltaTime,
      }))
      .filter((platform) => platform.x + platform.width > 0);
console.log('gwidth', gameWidthRef.current)
    // Generate new platforms
    if (newPlatforms.length < 5) {
      const lastPlatform = newPlatforms[newPlatforms.length - 1];
      const newPlatform = {
        x: lastPlatform ? lastPlatform.x + lastPlatform.width + Math.random() * 200 : gameWidthRef.current,
        y: gameHeightRef.current - 100 - Math.random() * 100,
        width: 300,
        height: 20,
      };
      newPlatforms.push(newPlatform);
    }

    platformsRef.current = newPlatforms;
  };

  const updateObstacles = (deltaTime) => {
    const newObstacles = obstaclesRef.current
      .map((obstacle) => ({
        ...obstacle,
        x: obstacle.x - speed.current * deltaTime,
      }))
      .filter((obstacle) => obstacle.x + obstacle.width > 0);

    // Generate new obstacles
    if (Math.random() < 0.02) {
      const newObstacle = {
        x: gameWidthRef.current,
        y: gameHeightRef.current - 120,
        width: 50,
        height: 50,
      };
      newObstacles.push(newObstacle);
    }

    obstaclesRef.current = newObstacles;
  };

  const updateCharacter = (deltaTime) => {
    setCharacter((prev) => {
      let newX = prev.x;
      let newY = prev.y + prev.velocityY * deltaTime;
      let newVelocityY = prev.velocityY + GRAVITY * deltaTime;
      let isOnPlatform = false;
      let isPushedByObstacle = false;

      // Check for collisions with platforms
      platformsRef.current.forEach((platform) => {
        if (
          newX + prev.width > platform.x &&
          newX < platform.x + platform.width &&
          prev.y + prev.height <= platform.y &&
          newY + prev.height >= platform.y
        ) {
          // Collision detected from top
          newY = platform.y - prev.height;
          newVelocityY = 0;
          isOnPlatform = true;
          if (prev.isJumping) {
            soundEffects.play('goodMove'); // Play landing sound
          }
        }
      });

      // Check for collisions with obstacles
      obstaclesRef.current.forEach((obstacle) => {
        if (
          newX + prev.width > obstacle.x &&
          newX < obstacle.x + obstacle.width
        ) {
          if (
            prev.y + prev.height <= obstacle.y &&
            newY + prev.height >= obstacle.y
          ) {
            // Collision from top
            newY = obstacle.y - prev.height;
            newVelocityY = 0;
            isOnPlatform = true;
          }
          if (
            newY + prev.height > obstacle.y &&
            newY < obstacle.y + obstacle.height &&
            newX + prev.width > obstacle.x &&
            newX < obstacle.x + obstacle.width
          ) {
            // Collision from left side
            newX = obstacle.x - prev.width;
            isPushedByObstacle = true;
            soundEffects.play('badMove'); // Play bad move sound
          }
        }
      });

      // If pushed by obstacle, move character with the obstacle
      if (isPushedByObstacle) {
        newX -= speed.current * deltaTime;
      }

      if (!isOnPlatform) {
        // Apply gravity
        newVelocityY += GRAVITY * deltaTime;
      } else {
        newVelocityY = 0;
      }

      const updatedCharacter = {
        ...prev,
        x: newX,
        y: newY,
        velocityY: newVelocityY,
        isJumping: !isOnPlatform,
      };

      characterRef.current = updatedCharacter; // Update the ref
      return updatedCharacter;
    });
  };

  const updateScore = (deltaTime) => {
    setScore((prevScore) => {
      const newScore = prevScore + SCORE_INCREMENT * deltaTime;
      const roundedNewScore = Math.floor(newScore);
      
      if (highScore - roundedNewScore < 50 && highScore - roundedNewScore > 0) {
        if (!soundEffects.isPlaying('gameWon'))
          soundEffects.play('gameWon');
      }
      
      if (roundedNewScore > highScore) {
        setHighScore(roundedNewScore);
        localStorage.setItem('platformRunnerHighScore', roundedNewScore.toString());
      }
      
      return newScore; // Keep the precise score for smooth incrementing
    });
  };

  const isCharacterOffScreen = (char) => {
    console.log('offscreen', char, gameHeight);
    //if( gameHeight === 0) return false;
    const offScreen = char.y > gameHeightRef.current || char.x + char.width < 0;
    if(offScreen && !isGameOver) {
      soundEffects.play('gameOver');
    }
    return offScreen;
  };

  const restartGame = () => {
    soundEffects.play('playButton');
    setScore(0);
    speed.current = INITIAL_SPEED;
    platformsRef.current = [];
    obstaclesRef.current = [];
    generateInitialPlatforms();
    setInitialCharacterPosition();
    setCharacter((prev) => {
      const newCharacter = {
        ...prev,
        velocityY: 0,
        isJumping: false,
      };
      characterRef.current = newCharacter;
      return newCharacter;
    });
    setIsGameOver(false);
    setIsTimerActive(true);
    lastFrameTimeRef.current = performance.now(); // Reset frame time
    startGame();
  };

  return (
    <div className="pre-platform-game-container">
      {isGameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Score: {Math.floor(score)}</p>
          <p>Best: {highScore}</p>
          <button onClick={restartGame}>Restart Game</button>
        </div>
      )}
      <div className="platform-game-container" ref={gameContainerRef}>
        <div className="game-header">
          <div className="score-container">
            <div className="score-box">
              <div className="score-label">SCORE</div>
              <div className="score-value">{Math.floor(score)}</div>
            </div>
            <div className="score-box">
              <div className="score-label">BEST</div>
              <div className="score-value">{highScore}</div>
            </div>
          </div>
        </div>

        {/* Platforms */}
        {platformsRef.current.map((platform, index) => (
          <div
            key={index}
            className="platform"
            style={{
              left: `${platform.x}px`,
              top: `${platform.y}px`,
              width: `${platform.width}px`,
              height: `${platform.height}px`,
            }}
          ></div>
        ))}

        {/* Obstacles */}
        {obstaclesRef.current.map((obstacle, index) => (
          <div
            key={index}
            className="obstacle"
            style={{
              left: `${obstacle.x}px`,
              top: `${obstacle.y}px`,
              width: `${obstacle.width}px`,
              height: `${obstacle.height}px`,
            }}
          ></div>
        ))}

        {/* Character */}
        <div
          className="character"
          style={{
            left: `${character.x}px`,
            top: `${character.y}px`,
            width: `${character.width}px`,
            height: `${character.height}px`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default PlatformRunnerGame;
