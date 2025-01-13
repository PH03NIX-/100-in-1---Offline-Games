import React, { useState, useEffect, useRef } from 'react';
import './AsteroidsGame.css';

const AsteroidsGame = ({ gamePaused, setIsTimerActive, soundEffects }) => {
  const gameAreaRef = useRef(null);

  const degToRad = (deg) => (deg * Math.PI) / 180;

  const [ship, setShip] = useState(() => {
    const randomAngle = Math.random() * 360; // Random angle between 0 and 360
    const angleRad = degToRad(randomAngle);
    const initialSpeed = 0.5; // Adjust speed as desired
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      angle: randomAngle,
      velocity: {
        x: Math.cos(angleRad) * initialSpeed,
        y: Math.sin(angleRad) * initialSpeed,
      },
    };
  });
  const [bullets, setBullets] = useState([]);
  const [asteroids, setAsteroids] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRotatingLeft, setIsRotatingLeft] = useState(false);
  const [isRotatingRight, setIsRotatingRight] = useState(false);
  const [isThrusting, setIsThrusting] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('asteroidsHighScore');
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  // Initialize asteroids when the component mounts or level changes
  useEffect(() => {
    if (!isGameOver) {
      const initialAsteroids = Array.from(
        { length: 3 + level },
        () => createAsteroid(undefined, null, null, 1, null, ship.x, ship.y)
      );
      setAsteroids(initialAsteroids);
    }

    // Resize listener for window size changes
    const handleResize = () => {
      setShip((prevShip) => ({
        ...prevShip,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [level, isGameOver]);

  // Main game loop
  useEffect(() => {
    if (!isGameOver && !gamePaused) {
      const interval = setInterval(() => {
        updateGameObjects();
        if(isThrusting) {
          soundEffects.shortBoom.stop();
          soundEffects.shortBoom.play();
        }
      }, 30); // Update every 30ms
      return () => clearInterval(interval);
    }
  }, [isGameOver, gamePaused, ship, bullets, asteroids, isRotatingLeft, isRotatingRight, isThrusting, soundEffects]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('asteroidsHighScore', score.toString());
    }
  }, [score, highScore]);

  // Function to create a new asteroid
  const createAsteroid = (
    size = 60 - level * 2,
    x = null,
    y = null,
    generation = 1,
    initialVelocity = null,
    shipX,
    shipY
  ) => {
    const minDistance = 200;
    let posX, posY;
    let attempts = 0;
    const maxAttempts = 100;
    let distance; // Declare distance here

    do {
      posX = x !== null ? x : Math.random() * window.innerWidth;
      posY = y !== null ? y : Math.random() * window.innerHeight;

      const dx = posX - shipX;
      const dy = posY - shipY;
      distance = Math.sqrt(dx * dx + dy * dy);

      attempts++;
      if (attempts > maxAttempts) {
        // Break if too many attempts to prevent infinite loops
        break;
      }
    } while (x === null && y === null && distance < minDistance);

    const speedMultiplier = (3 - generation) * (1 + level * 0.1);
    const velocity = initialVelocity || {
      x: (Math.random() * 1.5 - 0.75) * speedMultiplier,
      y: (Math.random() * 1.5 - 0.75) * speedMultiplier,
    };

    return {
      x: posX,
      y: posY,
      size: Math.max(size, 20), // Ensure asteroids don't get too small
      angle: Math.random() * 360,
      velocity,
      generation,
      invulnerable: 5, // Invulnerable for 5 frames
    };
  };

  // Update positions of ship, bullets, and asteroids
  const updateGameObjects = () => {
    if (isRotatingLeft) rotateShip(-5);
    if (isRotatingRight) rotateShip(5);
    if (isThrusting) thrustShip();
    moveShip();
    moveBullets();
    moveAsteroids();
    handleCollisions();
    checkLevelCompletion();
  };

  const moveShip = () => {
    setShip((prevShip) => {
      const newX =
        (prevShip.x + prevShip.velocity.x + window.innerWidth) %
        window.innerWidth;
      const newY =
        (prevShip.y + prevShip.velocity.y + window.innerHeight) %
        window.innerHeight;
      return { ...prevShip, x: newX, y: newY };
    });
  };

  const moveBullets = () => {
    setBullets((prevBullets) =>
      prevBullets
        .map((bullet) => ({
          ...bullet,
          x:
            (bullet.x + bullet.velocity.x + window.innerWidth) %
            window.innerWidth,
          y:
            (bullet.y + bullet.velocity.y + window.innerHeight) %
            window.innerHeight,
          life: bullet.life - 1,
        }))
        .filter((bullet) => bullet.life > 0)
    );
  };

  const moveAsteroids = () => {
    setAsteroids((prevAsteroids) =>
      prevAsteroids.map((asteroid) => ({
        ...asteroid,
        x:
          (asteroid.x + asteroid.velocity.x + window.innerWidth) %
          window.innerWidth,
        y:
          (asteroid.y + asteroid.velocity.y + window.innerHeight) %
          window.innerHeight,
        invulnerable: Math.max(0, asteroid.invulnerable - 1), // Decrease invulnerability
      }))
    );
  };

  const handleCollisions = () => {
    // Ship and asteroid collision
    asteroids.forEach((asteroid) => {
      if (isColliding(ship, asteroid, asteroid.size / 2 + 10)) {
        setIsGameOver(true);
        setIsTimerActive(false);
        soundEffects.play('boom'); // Play boom when ship is hit
        soundEffects.play('gameOver'); // Play game over sound
      }
    });

    // Bullet and asteroid collision
    let newAsteroids = [...asteroids];
    let newBullets = [...bullets];

    let pointsEarned = 0;

    bullets.forEach((bullet, bulletIndex) => {
      asteroids.forEach((asteroid, asteroidIndex) => {
        if (
          !asteroid.invulnerable &&
          isColliding(bullet, asteroid, asteroid.size / 2)
        ) {
          soundEffects.play('boom'); // Play boom when asteroid is hit
          // Remove the bullet
          newBullets.splice(bulletIndex, 1);

          // Remove the hit asteroid
          newAsteroids.splice(asteroidIndex, 1);

          // Award points based on asteroid size
          if (asteroid.generation === 1) {
            pointsEarned += 10; // 10 points for large asteroids
          } else {
            pointsEarned += 5; // 5 points for small asteroids
          }

          // If the asteroid is large enough, split it
          if (asteroid.generation < 2) {
            const newAsteroidPieces = splitAsteroid(asteroid);
            newAsteroids.push(...newAsteroidPieces);
          }
        }
      });
    });

    // Update score when asteroids are hit
    if (pointsEarned > 0) {
      setScore((prevScore) => {
        const newScore = prevScore + pointsEarned;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('asteroidsHighScore', newScore.toString());
        }
        return newScore;
      });
    }

    // Update the state only if there were changes
    if (newAsteroids.length !== asteroids.length) {
      setAsteroids(newAsteroids);
    }
    if (newBullets.length !== bullets.length) {
      setBullets(newBullets);
    }
  };

  const isColliding = (obj1, obj2, distance) => {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy) < distance;
  };

  const splitAsteroid = (asteroid) => {
    const newSize = asteroid.size / 2;
    const newGeneration = asteroid.generation + 1;
    const speed = 1;
    return [
      createAsteroid(
        newSize,
        asteroid.x,
        asteroid.y,
        newGeneration,
        { x: -speed, y: -speed }
      ),
      createAsteroid(
        newSize,
        asteroid.x,
        asteroid.y,
        newGeneration,
        { x: speed, y: speed }
      ),
    ];
  };

  const removeBullet = (bullet) => {
    setBullets((prevBullets) => prevBullets.filter((b) => b !== bullet));
  };

  // Handle control buttons
  const rotateShip = (direction) => {
    setShip((prevShip) => ({
      ...prevShip,
      angle: (prevShip.angle + direction + 360) % 360,
    }));
  };

  const thrustShip = () => {
    setShip((prevShip) => {
      const acceleration = 0.2;
      const angleRad = degToRad(prevShip.angle); // Corrected angle conversion
      const velX = prevShip.velocity.x + Math.cos(angleRad) * acceleration;
      const velY = prevShip.velocity.y + Math.sin(angleRad) * acceleration;
      return { ...prevShip, velocity: { x: velX, y: velY } };
    });
  };

  const fireBullet = () => {
    const bulletSpeed = 5;
    const angleRad = degToRad(ship.angle); // Corrected angle conversion
    const bullet = {
      x: ship.x + Math.cos(angleRad) * 15,
      y: ship.y + Math.sin(angleRad) * 15,
      velocity: {
        x: ship.velocity.x + Math.cos(angleRad) * bulletSpeed,
        y: ship.velocity.y + Math.sin(angleRad) * bulletSpeed,
      },
      life: 60, // Bullet life in frames
    };
    setBullets((prevBullets) => [...prevBullets, bullet]);
    soundEffects.play('lazer'); // Play lazer sound when shooting
  };

  const restartGame = () => {
    const randomAngle = Math.random() * 360;
    const angleRad = degToRad(randomAngle);
    const initialSpeed = 0.5; // Adjust as desired

    const shipX = window.innerWidth / 2;
    const shipY = window.innerHeight / 2;

    setShip({
      x: shipX,
      y: shipY,
      angle: randomAngle,
      velocity: {
        x: Math.cos(angleRad) * initialSpeed,
        y: Math.sin(angleRad) * initialSpeed,
      },
    });

    // Reset other game states
    setBullets([]);
    setLevel(1);
    setScore(0);
    setIsGameOver(false);
    setIsTimerActive(true);
    setIsRotatingLeft(false);
    setIsRotatingRight(false);
    setIsThrusting(false);

    // Initialize asteroids
    const initialAsteroids = Array.from(
      { length: 3 + 1 },
      () => createAsteroid(undefined, null, null, 1, null, shipX, shipY)
    );
    setAsteroids(initialAsteroids);
    soundEffects.play('playButton'); // Play button sound when restarting
  };

  const handleRotateStart = (direction) => {
    if (direction === 'left') setIsRotatingLeft(true);
    if (direction === 'right') setIsRotatingRight(true);
  };

  const handleRotateEnd = (direction) => {
    if (direction === 'left') setIsRotatingLeft(false);
    if (direction === 'right') setIsRotatingRight(false);
  };

  const handleThrustStart = () => {
    setIsThrusting(true);
  };

  const handleThrustEnd = () => {
    setIsThrusting(false);
    // Stop the shortBoom sound
    soundEffects.shortBoom.stop();
  };

  const startLevel = () => {
    const randomAngle = Math.random() * 360;
    const angleRad = degToRad(randomAngle);
    const initialSpeed = 1; // Adjust as desired

    const shipX = window.innerWidth / 2;
    const shipY = window.innerHeight / 2;

    // Reset the ship's position, angle, and velocity
    setShip((prevShip) => ({
      ...prevShip,
      x: shipX,
      y: shipY,
      angle: randomAngle,
      velocity: {
        x: Math.cos(angleRad) * initialSpeed,
        y: Math.sin(angleRad) * initialSpeed,
      },
    }));

    // Initialize asteroids for the new level
    const initialAsteroids = Array.from(
      { length: 3 + level },
      () => createAsteroid(undefined, null, null, 1, null, shipX, shipY)
    );
    setAsteroids(initialAsteroids);
  };

  const checkLevelCompletion = () => {
    if (asteroids.length === 0) {
      setLevel((prevLevel) => {
        const newLevel = prevLevel + 1;
        setScore((prevScore) => prevScore + newLevel * 100); // Bonus points
        soundEffects.play('gameWon'); // Play game won sound when advancing to next level
        return newLevel;
      });

      startLevel();
    }
  };

  return (
    <div className="pre-asteroids-game-area">
      <div className="asteroids-game-area" ref={gameAreaRef}>
        <div className="game-info">
          <div>Level: {level}</div>
          <div>Score: {score}</div>
          <div>Best: {highScore}</div>
        </div>
        {/* Ship */}
        <div
          className="ship"
          style={{
            left: ship.x,
            top: ship.y,
            transform: `translate(-50%, -50%) rotate(${ship.angle + 90}deg)`, // Added 90 degrees
          }}
        />

        {/* Bullets */}
        {bullets.map((bullet, index) => (
          <div
            key={index}
            className="bullet"
            style={{
              left: bullet.x,
              top: bullet.y,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Asteroids */}
        {asteroids.map((asteroid, index) => (
          <div
            key={index}
            className="asteroid"
            style={{
              left: asteroid.x,
              top: asteroid.y,
              width: asteroid.size,
              height: asteroid.size,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Control Buttons */}
        <div className="controls">
          <button
            onMouseDown={() => handleRotateStart('left')}
            onMouseUp={() => handleRotateEnd('left')}
            onTouchStart={() => handleRotateStart('left')}
            onTouchEnd={() => handleRotateEnd('left')}
          >
            &#x21ba; Left
          </button>
          <button
            onMouseDown={() => handleRotateStart('right')}
            onMouseUp={() => handleRotateEnd('right')}
            onTouchStart={() => handleRotateStart('right')}
            onTouchEnd={() => handleRotateEnd('right')}
          >
            Right &#x21bb;
          </button>
          <button onTouchStart={fireBullet} onMouseDown={fireBullet}>
            &#x25b6; Shoot
          </button>
          <button
            onMouseDown={handleThrustStart}
            onMouseUp={handleThrustEnd}
            onTouchStart={handleThrustStart}
            onTouchEnd={handleThrustEnd}
          >
            &#x25b2; Thrust
          </button>
        </div>
        {gamePaused && (
          <div className="pause-overlay">
            <h2>Game Paused</h2>
          </div>
        )}
      </div>
      {isGameOver && (
        <div className="game-over">
          <h2>Game Over</h2>
          <p>Final Score: {score}</p>
          <p>Level Reached: {level}</p>
          <p>High Score: {highScore}</p>
          <button onClick={restartGame}>Restart Game</button>
        </div>
      )}
    </div>
  );
};

export default AsteroidsGame;
