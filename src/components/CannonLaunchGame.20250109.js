import React, { useState, useEffect, useRef } from 'react';
import './CannonLaunchGame.css';

/** 
 * Key points:
 * - y=0 is the ground, y>0 is upward
 * - GRAVITY is negative => pulls y downward
 * - If y < 0 => clamp to 0 => bounce
 */
const GRAVITY = -90;          // Negative => pull downward
const FRICTION_COEFF = 0.7;   // Bounces lose 30% velocity
const ANGLE_ANIM_SPEED = 2.0; // Speed for angle bouncing 0..90
const POWER_ANIM_SPEED = 3.0; // Speed for power bouncing 0..100
const STOP_THRESHOLD = 1;     // If speed < 1 => we stop
const MAX_LAUNCH_SPEED = 800; // At 100% power => 120 m/s
const GROUND_HEIGHT = -25;  // Match the CSS ground height
const NUM_TREES = 100;        // Number of trees to generate
const TREE_SPACING = 200;     // Minimum spacing between trees
const WORLD_WIDTH = 20000;    // Match the game world width
const TREE_COLLISION_SLOWDOWN = 0.7;  // Speed reduction on tree hit
const TREE_COLLISION_WIDTH = 40;      // Width to check for tree collision
const TREE_HEIGHT = 100;  // Total height: trunk(60px) + crown(100px)
const EMOTICONS = ['😀', '😁', '😆', '🤣', '😇', '😋', '😝', '🤪', '😟', '😭', '😡', '😲', '🤮'];
const BOMB_SPACING = 800;     // More spread out than trees
const BOMB_BOOST_SPEED = 450; // Dramatic upward boost
const BOMB_COLLISION_WIDTH = 30;
const GENERATION_CHUNK_WIDTH = 2000; // Width of each chunk of terrain we generate
const MIN_GENERATION_DISTANCE = 1000; // Generate new terrain when within this distance of the end
const TRAMPOLINE_BOOST = 600; // Higher boost than bombs
const TRAMPOLINE_SPACING = 600;
const TRAMPOLINE_WIDTH = 60;
const HOLE_SPACING = 1000;    // Space between holes
const HOLE_WIDTH = 100;      // Width of the hole
const HOLE_DEPTH = 200;      // Visual depth of the hole
const UFO_SPEED = 1500;          // Horizontal speed of UFO
const UFO_BOOST_SPEED = 600;     // Forward boost when hit by UFO
const UFO_SPAWN_INTERVAL = 500; // New UFO every 5 seconds
const UFO_HEIGHT_RANGE = 800;   // Range of heights UFO can appear at
const RENDER_SCALE = 2;    // Multiply all game coords by 2 for screen display
const GROUND_Y = 0;        // y=0 is ground
const GROUND_HEIGHT_PX = 100;  // visually we show a 100px green strip

// Add bounding box constants
const RAGDOLL_SIZE = { halfW: 10, halfH: 25 }; // bounding box for stick figure
const TREE_BB = { halfW: 20, halfH: 50 };    // approx bounding box for a tree
const BOMB_BB = { halfW: 15, halfH: 15 };    // bombs are small
const TRAMP_BB = { halfW: 30, halfH: 15 };   // trampolines
const HOLE_BB = { halfW: 50, halfH: 10 };    // approximate for hole
const UFO_BB = { halfW: 30, halfH: 15 };     // UFO bounding box

function CannonLaunchGame({ setIsTimerActive, gamePaused, soundEffects }) {
  const [gameState, setGameState] = useState('angle');
  // 'angle' => anim angle, 'power' => anim power, 'flying' => projectile motion, 'done' => show results

  const [angle, setAngle] = useState(0);   // 0 => right, 90 => up
  const angleRef = useRef(0);
  const angleDirRef = useRef(1);           // 1 => increasing, -1 => decreasing

  const [power, setPower] = useState(0);   // 0..100
  const powerRef = useRef(0);
  const powerDirRef = useRef(1);

  const requestRef = useRef(null);

  // Projectile states
  const [position, setPosition] = useState({ x: 0, y: 0 }); 
  const positionRef = useRef({ x: 0, y: 0 });

  const [velocity, setVelocity] = useState({ vx: 0, vy: 0 });
  const velocityRef = useRef({ vx: 0, vy: 0 });

  const [projRotation, setProjRotation] = useState(0); // For “ragdoll” spin
  const projRotationRef = useRef(0);

  const [cameraX, setCameraX] = useState(0); // For side-scrolling
  const cameraXRef = useRef(0);

  // Score
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('cannonHighScore');
    return saved ? parseFloat(saved) : 0;
  });

  const [trees, setTrees] = useState([]);
  const treesRef = useRef([]);

  const [currentEmoticon, setCurrentEmoticon] = useState(EMOTICONS[0]);

  const lastEmoticonChangeRef = useRef(0);

  const [bombs, setBombs] = useState([]);
  const bombsRef = useRef([]);

  const lastGeneratedXRef = useRef(WORLD_WIDTH); // Track where we last generated terrain

  const [isOffscreen, setIsOffscreen] = useState(false);

  const [trampolines, setTrampolines] = useState([]);
  const trampolinesRef = useRef([]);

  const [holes, setHoles] = useState([]);
  const holesRef = useRef([]);

  // Add a ref to track if we're falling into a hole
  const fallingInHoleRef = useRef(false);

  const [ufos, setUfos] = useState([]);
  const ufosRef = useRef([]);

  const getRandomEmoticon = () => {
    const randomIndex = Math.floor(Math.random() * EMOTICONS.length);
    return EMOTICONS[randomIndex];
  };

  const tryChangeEmoticon = () => {
    const now = Date.now();
    if (now - lastEmoticonChangeRef.current >= 500) { // Check if 500ms has passed
      setCurrentEmoticon(getRandomEmoticon());
      lastEmoticonChangeRef.current = now;
    }
  };

  useEffect(() => {
    if (gamePaused || gameState === 'done') {
      cancelAnimationFrame(requestRef.current);
    } else {
      if (gameState === 'angle' || gameState === 'power') {
        requestRef.current = requestAnimationFrame(animLoop);
      } else if (gameState === 'flying') {
        requestRef.current = requestAnimationFrame(physicsLoop);
      }
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, gamePaused]);

  useEffect(() => {
    // Generate initial trees only up to WORLD_WIDTH
    const newTrees = generateTreesInRange(200, WORLD_WIDTH);
    setTrees(newTrees);
    treesRef.current = newTrees;

    // Generate initial bombs
    const newBombs = generateBombsInRange(400, WORLD_WIDTH);
    setBombs(newBombs);
    bombsRef.current = newBombs;

    // Generate initial trampolines
    const newTrampolines = generateTrampolinesInRange(300, WORLD_WIDTH);
    setTrampolines(newTrampolines);
    trampolinesRef.current = newTrampolines;

    // Generate initial holes
    const newHoles = generateHolesInRange(500, WORLD_WIDTH);
    setHoles(newHoles);
    holesRef.current = newHoles;
  }, []);

  useEffect(() => {
    if (gameState === 'flying') {
        // Initial UFO spawn
        const initialUfo = {
            x: -100,
            y: 100 + Math.random() * UFO_HEIGHT_RANGE,
            hasHit: false
        };
        ufosRef.current = [initialUfo];
        setUfos([initialUfo]);

        // Set up interval for spawning new UFOs
        const spawnInterval = setInterval(() => {
            const newUfo = {
                x: -100,  // Start off-screen left
                y: 100 + Math.random() * UFO_HEIGHT_RANGE,
                hasHit: false
            };
            ufosRef.current = [...ufosRef.current, newUfo];
            setUfos([...ufosRef.current]);
        }, UFO_SPAWN_INTERVAL);

        // Cleanup
        return () => {
            clearInterval(spawnInterval);
            ufosRef.current = [];
            setUfos([]);
        };
    }
  }, [gameState]);

  // Add new helper functions for terrain generation
  const generateTreesInRange = (startX, endX) => {
    const newTrees = [];
    let x = startX;

    while (x < endX) {
      x += TREE_SPACING + (Math.random() * TREE_SPACING);
      const scale = 0.7 + (Math.random() * 0.6);
      
      newTrees.push({
        x: x,
        scale: scale,
        rotation: (Math.random() * 10) - 5,
        isKnockedOver: false
      });
    }

    return newTrees;
  };

  const generateBombsInRange = (startX, endX) => {
    const newBombs = [];
    let x = startX;

    while (x < endX) {
        x += BOMB_SPACING + (Math.random() * BOMB_SPACING);
        
        newBombs.push({
            x: x,
            y: 91,//GROUND_HEIGHT/2,  // Place bombs at ground level
            isExploded: false,
            scale: 0.8 + (Math.random() * 0.4)
        });
    }
    return newBombs;
  };

  const generateTrampolinesInRange = (startX, endX) => {
    const newTrampolines = [];
    let x = startX;

    while (x < endX) {
      x += TRAMPOLINE_SPACING + (Math.random() * TRAMPOLINE_SPACING);
      newTrampolines.push({
        x: x,
        scale: 0.8 + (Math.random() * 0.4),
        isUsed: false
      });
    }
    return newTrampolines;
  };

  const generateHolesInRange = (startX, endX) => {
    const newHoles = [];
    let x = startX;

    while (x < endX) {
      x += HOLE_SPACING + (Math.random() * HOLE_SPACING);
      newHoles.push({
        x: x,
        width: HOLE_WIDTH + (Math.random() * 50), // Random width variation
      });
    }
    return newHoles;
  };

  /** ========== ANGLE & POWER BOUNCING LOOP ========== **/
  const animLoop = () => {
    if (gameState === 'angle') {
      let newAngle = angleRef.current + ANGLE_ANIM_SPEED * angleDirRef.current;
      if (newAngle > 90) {
        newAngle = 90;
        angleDirRef.current = -1;
      } else if (newAngle < 0) {
        newAngle = 0;
        angleDirRef.current = 1;
      }
      angleRef.current = newAngle;
      setAngle(newAngle);
    }
    else if (gameState === 'power') {
      let newPower = powerRef.current + POWER_ANIM_SPEED * powerDirRef.current;
      if (newPower > 100) {
        newPower = 100;
        powerDirRef.current = -1;
      } else if (newPower < 0) {
        newPower = 0;
        powerDirRef.current = 1;
      }
      powerRef.current = newPower;
      setPower(newPower);
    }

    requestRef.current = requestAnimationFrame(animLoop);
  };

  /** ========== PHYSICS LOOP ========== **/
  const physicsLoop = () => {
    const dt = 1/60; // ~60 FPS
    let { vx, vy } = velocityRef.current;
    let { x, y } = positionRef.current;

    // Update score in real-time (convert x position to meters)
    const currentScore = Math.floor(x/25);
    setScore(currentScore);
    
    // Update high score in real-time if current score is higher
    if (currentScore > highScore) {
      setHighScore(currentScore);
      localStorage.setItem('cannonHighScore', currentScore.toString());
    }

    // Check if we need to generate more terrain
    if (x > lastGeneratedXRef.current - MIN_GENERATION_DISTANCE) {
      const newStartX = lastGeneratedXRef.current;
      const newEndX = newStartX + GENERATION_CHUNK_WIDTH;
      
      // Generate and add new trees
      const newTrees = generateTreesInRange(newStartX, newEndX);
      treesRef.current = [...treesRef.current, ...newTrees];
      setTrees(treesRef.current);

      // Generate and add new bombs
      const newBombs = generateBombsInRange(newStartX, newEndX);
      bombsRef.current = [...bombsRef.current, ...newBombs];
      setBombs(bombsRef.current);

      // Generate and add new trampolines
      const newTrampolines = generateTrampolinesInRange(newStartX, newEndX);
      trampolinesRef.current = [...trampolinesRef.current, ...newTrampolines];
      setTrampolines(trampolinesRef.current);

      // Generate and add new holes
      const newHoles = generateHolesInRange(newStartX, newEndX);
      holesRef.current = [...holesRef.current, ...newHoles];
      setHoles(holesRef.current);

      lastGeneratedXRef.current = newEndX;

      // Update the game world and ground width to match the new terrain
      const worldDiv = document.querySelector('.cannon-game-world');
      const groundDiv = document.querySelector('.cannon-ground');
      if (worldDiv && groundDiv) {
        const newWidth = `${newEndX + GENERATION_CHUNK_WIDTH}px`;
        worldDiv.style.width = newWidth;
        groundDiv.style.width = newWidth;
      }
    }

    // Gravity => vy += (negative)
    vy += GRAVITY * dt;

    // Integrate
    x += vx * dt;
    y += vy * dt;

    // Check tree collisions - only with trees that aren't knocked over
    const treeHitIndex = treesRef.current.findIndex(tree => {
        if (tree.isKnockedOver) return false;
        
        // Use bounding box collision
        const dx = x - tree.x;
        const dy = y - tree.y;
        const overlapX = Math.abs(dx) < (RAGDOLL_SIZE.halfW + TREE_BB.halfW);
        const overlapY = Math.abs(dy) < (RAGDOLL_SIZE.halfH + TREE_BB.halfH);
        
        return overlapX && overlapY;
    });

    if (treeHitIndex !== -1) {
        // Update both the ref and the state
        treesRef.current[treeHitIndex] = {
            ...treesRef.current[treeHitIndex],
            rotation: 90,
            isKnockedOver: true
        };
        
        setTrees([...treesRef.current]); // Update React state

        // Handle collision physics
        vx *= TREE_COLLISION_SLOWDOWN;
        vy *= TREE_COLLISION_SLOWDOWN;
        vy = Math.max(vy, 30);

        if (soundEffects) {
            soundEffects.play('gameAction');
            soundEffects.play('badMove');
            soundEffects.play('shortBoom');
        }
        tryChangeEmoticon();
    }

    // Check bomb collisions
    const bombHitIndex = bombsRef.current.findIndex(bomb => {
        if (bomb.isExploded) return false;
        
        const dx = x - bomb.x;
        const dy = y - bomb.y;
        const overlapX = Math.abs(dx) < (RAGDOLL_SIZE.halfW + BOMB_BB.halfW);
        const overlapY = Math.abs(dy) < (RAGDOLL_SIZE.halfH + BOMB_BB.halfH);
        
        return overlapX && overlapY;
    });

    if (bombHitIndex !== -1) {
        // Update bomb state
        bombsRef.current[bombHitIndex].isExploded = true;
        setBombs([...bombsRef.current]);

        // Dramatic upward boost
        vy = BOMB_BOOST_SPEED;
        vx *= 0.8; // Slight horizontal slowdown

        if (soundEffects) {
            soundEffects.play('gameAction');
            soundEffects.play('boom');
        }
        tryChangeEmoticon();
    }

    // Check trampoline collisions
    const trampolineHitIndex = trampolinesRef.current.findIndex(tramp => {
        if (tramp.isUsed) return false;
        
        const dx = x - tramp.x;
        const dy = y - tramp.y;
        const overlapX = Math.abs(dx) < (RAGDOLL_SIZE.halfW + TRAMP_BB.halfW);
        const overlapY = Math.abs(dy) < (RAGDOLL_SIZE.halfH + TRAMP_BB.halfH);
        
        return overlapX && overlapY;
    });

    if (trampolineHitIndex !== -1) {
        // Update trampoline state
        trampolinesRef.current[trampolineHitIndex].isUsed = true;
        setTrampolines([...trampolinesRef.current]);

        // Super bounce!
        vy = TRAMPOLINE_BOOST;
        vx *= 0.95; // Slight horizontal slowdown

        if (soundEffects) {
            soundEffects.play('gameAction');
            soundEffects.play('boing');
        }
        tryChangeEmoticon();
    }

    // Check hole collisions
    const holeHitIndex = holesRef.current.findIndex(hole => {
        const holeX = hole.x / 2;
        const distanceX = Math.abs(x - holeX);
        
        return distanceX < hole.width/4 && y < (GROUND_HEIGHT/2 + 20);
    });

    if (holeHitIndex !== -1) {
        if (!fallingInHoleRef.current) {  // Only trigger once when first hitting hole
            fallingInHoleRef.current = true;
            vy = -400;  // Faster downward velocity
            vx *= 0.3;  // More significant horizontal slowdown
            
            if (soundEffects) {
                soundEffects.play('gameAction');
                soundEffects.play('shortBoom');
            }
            tryChangeEmoticon('😱');
        }
        
        // End game when figure has fallen far enough
        if (y < -200) {
            endGame(x);
            return;
        }
    }

    // Normal rotation calculation
    const angleDeg = (Math.atan2(vy, vx) * (180/Math.PI)) + 90;
    const blend = 0.15;
    const curRot = projRotationRef.current;
    projRotationRef.current = curRot + blend * (angleDeg - curRot);

    // Check ground => if y < GROUND_HEIGHT/2 => bounce
    // Divide by 2 because we multiply position by 2 in the render
    if (y < GROUND_HEIGHT/2 && !fallingInHoleRef.current) {  // Only bounce if not falling in hole
        y = GROUND_HEIGHT/2;
        vy = -vy * FRICTION_COEFF;
        vx *= 0.9;
        
        if (soundEffects) {
            soundEffects.play('shortBoom');
        }
        tryChangeEmoticon();
        
        if (Math.abs(vx) < STOP_THRESHOLD && Math.abs(vy) < STOP_THRESHOLD) {
            endGame(x);
            return;
        }
    }

    // Check if stick figure is off-screen (convert game coordinates to screen coordinates)
    const screenY = window.innerHeight - (-y * 2 + GROUND_HEIGHT);
    setIsOffscreen(screenY > window.innerHeight*2);

    // Add game over condition for falling off-screen bottom
    if (screenY < -100) {
        endGame(x);
        return;
    }

    // Update references
    velocityRef.current = { vx, vy };
    positionRef.current = { x, y };
    projRotationRef.current = projRotationRef.current;

    // Update states => re-render
    setVelocity({ vx, vy });
    setPosition({ x, y });
    setProjRotation(projRotationRef.current);

    // Camera follow if x advanced
    if (x - cameraXRef.current > 3) {
      cameraXRef.current = x;
      setCameraX(x);
    }

    // Update UFO positions
    const updatedUfos = ufosRef.current.map(ufo => ({
      ...ufo,
      x: ufo.x + (UFO_SPEED * dt)
    })).filter(ufo => ufo.x < WORLD_WIDTH + 200); // Remove UFOs that are off-screen right

    // Check UFO collisions
    const ufoHitIndex = updatedUfos.findIndex(ufo => {
        if (ufo.hasHit) return false;
        
        // Convert UFO coordinates to match stick figure coordinates
        const ufoX = ufo.x / 2;
        const ufoY = ufo.y / 2;  // Divide by 2 to match stick figure coordinate system
        const distanceX = Math.abs(x - ufoX);
        const distanceY = Math.abs(y - ufoY);
        
        console.log('UFO Position:', ufoX, ufoY);
        console.log('Stick Figure Position:', x, y);
        console.log('Distances:', distanceX, distanceY);
        
        // Increase collision box size for better detection
        return distanceX < 60 && distanceY < 60;
    });

    if (ufoHitIndex !== -1) {
        console.log("UFO HIT CONFIRMED!");
        updatedUfos[ufoHitIndex].hasHit = true;
        vx = Math.abs(vx) + UFO_BOOST_SPEED;
        vy *= 0.5;
        
        if (soundEffects) {
            soundEffects.play('gameAction');
            soundEffects.play('boing');
        }
        tryChangeEmoticon('🛸');
    }

    ufosRef.current = updatedUfos;
    setUfos(updatedUfos);

    requestRef.current = requestAnimationFrame(physicsLoop);
  };

  /** ========== ACTIONS ========== **/
  const handleSelectAngle = () => {
    if (soundEffects) soundEffects.play('gameAction');
    setGameState('power');
  };

  const handleSelectPower = () => {
    if (soundEffects) {
      soundEffects.play('playButton');
      soundEffects.play('boom');
    }
    setGameState('flying');

    // Angle in degrees => radians
    const rad = angleRef.current * Math.PI / 180;
    // scale speed
    const launchSpeed = (powerRef.current / 100) * MAX_LAUNCH_SPEED;

    // Because y>0 is up, but gravity is negative,
    // if angle=0 => purely right => vx=+, vy=0
    // if angle=90 => vx=0, vy=+
    const vx = launchSpeed * Math.cos(rad);
    const vy = launchSpeed * Math.sin(rad); // positive => up

    velocityRef.current = { vx, vy };
    setVelocity({ vx, vy });
  };

  const endGame = (finalX) => {
    setGameState('done');
    setIsTimerActive(false);
    // No need to set score here anymore since it's already being updated
  };

  const handleTryAgain = () => {
    if (soundEffects) soundEffects.play('playButton');
    angleRef.current = 0;
    angleDirRef.current = 1;
    powerRef.current = 0;
    powerDirRef.current = 1;

    velocityRef.current = { vx: 0, vy: 0 };
    positionRef.current = { x: 0, y: 0 };
    projRotationRef.current = 0;
    cameraXRef.current = 0;

    setAngle(0);
    setPower(0);
    setVelocity({ vx: 0, vy: 0 });
    setPosition({ x: 0, y: 0 });
    setProjRotation(0);
    setCameraX(0);
    setScore(0);

    // Reset trees
    const resetTrees = trees.map(tree => ({
        ...tree,
        rotation: (Math.random() * 10) - 5,
        isKnockedOver: false
    }));
    setTrees(resetTrees);
    treesRef.current = resetTrees;

    lastEmoticonChangeRef.current = 0; // Reset the cooldown
    setCurrentEmoticon(EMOTICONS[0]); // Reset to initial emoticon
    setGameState('angle');

    // Reset bombs
    const resetBombs = bombs.map(bomb => ({
        ...bomb,
        isExploded: false
    }));
    setBombs(resetBombs);
    bombsRef.current = resetBombs;

    // Reset trampolines
    const resetTrampolines = trampolines.map(tramp => ({
        ...tramp,
        isUsed: false
    }));
    setTrampolines(resetTrampolines);
    trampolinesRef.current = resetTrampolines;

    // Reset position to starting point
    setPosition({ x: 0, y: 0 });
    positionRef.current = { x: 0, y: 0 };
    
    // Reset velocity
    setVelocity({ vx: 0, vy: 0 });
    velocityRef.current = { vx: 0, vy: 0 };
    
    // Reset camera
    setCameraX(0);
    cameraXRef.current = 0;
    
    // Reset falling state
    fallingInHoleRef.current = false;
    
    // Reset game state
    setGameState('angle');
    setIsTimerActive(false);
  };

  /** ========== RENDER ========== **/
  return (
    <div className="cannon-game-container">
      {gameState === 'done' && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Distance: {score}m</p>
          <p>Best: {highScore}m</p>
          <button onClick={handleTryAgain}>Restart Game</button>
        </div>
      )}

      <div className="cannon-scoreboard">
        <div>SCORE: {score}m</div>
        <div>BEST: {highScore}m</div>
      </div>

      <div className="cannon-game-view">
        <div
          className="cannon-game-world"
          style={{ 
            transform: `translateX(${-cameraX * 2}px)`,
            width: `${lastGeneratedXRef.current + GENERATION_CHUNK_WIDTH}px`
          }}
        >
          <div 
            className="cannon-ground" 
            style={{ 
              width: `${lastGeneratedXRef.current + GENERATION_CHUNK_WIDTH}px`
            }} 
          />

          {/* Cannon (Angle: 0 => right, 90 => up) 
              We'll rotate the cannon by -angle so that angle=0 => rotate(0)=right,
              angle=90 => rotate(-90)=up
           */}
          {gameState !== 'done' && (
            <div
              className="cannon-body"
              style={{
                transform: `rotate(${-angle}deg)`,
              }}
            >
              <div className="cannon-barrel">
                {gameState === 'power' && (
                  <div 
                    className="power-indicator"
                    style={{
                      width: `${power}%`,
                      height: '100%',
                      backgroundColor: '#ff4444',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      transition: 'width 0.05s linear'
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Projectile (stick figure) => position + rotation */}
          {(gameState === 'flying' || gameState === 'done') && (
            <div
              className="cannon-projectile"
              style={{
                left: `${position.x * RENDER_SCALE}px`,
                bottom: `${position.y * RENDER_SCALE + GROUND_HEIGHT_PX}px`,
                transform: `rotate(${projRotation}deg)`
              }}
            >
              <div className="stick-figure">
                <div className="head">{currentEmoticon}</div>
                <div className="body" />
                <div className="arm left" />
                <div className="arm right" />
                <div className="leg left" />
                <div className="leg right" />
              </div>
            </div>
          )}

          {/* Trees */}
          {trees.map((tree, index) => (
            <div
                key={index}
                className="tree"
                style={{
                    left: `${tree.x * RENDER_SCALE - 20}px`,
                    bottom: `${tree.y * RENDER_SCALE + GROUND_HEIGHT_PX}px`,
                    transform: tree.isKnockedOver ? 'rotate(90deg)' : `scale(${tree.scale}) rotate(${tree.rotation}deg)`,
                }}
            >
                <div className="tree-trunk" />
                <div className="tree-crown" />
            </div>
          ))}

          {/* Render bombs */}
          {bombs.map((bomb, index) => (
            <div
              key={`bomb-${index}`}
              className={`bomb ${bomb.isExploded ? 'exploded' : ''}`}
              style={{
                left: `${bomb.x}px`,
                bottom: `${bomb.y}px`,
                transform: `scale(${bomb.scale})`,
              }}
            >
              {!bomb.isExploded && '💣'}
              {bomb.isExploded && <div className="explosion" />}
            </div>
          ))}

          {/* Render trampolines */}
          {trampolines.map((tramp, index) => (
            <div
              key={`tramp-${index}`}
              className={`trampoline ${tramp.isUsed ? 'used' : ''}`}
              style={{
                left: `${tramp.x-60}px`,
                transform: `scale(${tramp.scale})`,
              }}
            >
              <div className="trampoline-base" />
              <div className="trampoline-spring" />
            </div>
          ))}

          {/* Render holes */}
          {holes.map((hole, index) => (
            <div
              key={`hole-${index}`}
              className="hole"
              style={{
                left: `${hole.x}px`,
                width: `${hole.width}px`,
              }}
            >
              <div className="hole-surface" />
              <div className="hole-depth" />
            </div>
          ))}

          {/* Render UFOs */}
          {ufos.map((ufo, index) => (
            <div
              key={`ufo-${index}`}
              className="ufo"
              style={{
                left: `${ufo.x}px`,
                bottom: `${ufo.y}px`,
                transform: `translateX(${ufo.hasHit ? 100 : 0}px)`
              }}
            >
              <div className="ufo-dome" />
              <div className="ufo-body" />
              <div className="ufo-light" />
            </div>
          ))}
        </div>
      </div>

      {(gameState === 'angle' || gameState === 'power') && (
        <div className="cannon-ui-panel">
          {gameState === 'angle' && (
            <button onClick={handleSelectAngle} className="cannon-button">
              Select Angle {Math.floor(angle)}°
            </button>
          )}
          {gameState === 'power' && (
            <button onClick={handleSelectPower} className="cannon-button">
              Select Power {Math.floor(power)}%
            </button>
          )}
        </div>
      )}

      {/* Add tracking bubble when stick figure is off-screen */}
      {gameState === 'flying' && isOffscreen && (
        <div 
          className="tracking-bubble"
          style={{
            left: `${Math.min(Math.max(position.x * 2 - cameraX * 2, 100), window.innerWidth - 100) + 40}px`
          }}
        >
          <div className="arrow" />
          <div className="mini-figure">
            <div 
              className="stick-figure"
              style={{
                transform: `rotate(${projRotation + 180}deg)`
              }}
            >
              <div className="head">{currentEmoticon}</div>
              <div className="body" />
              <div className="arm left" />
              <div className="arm right" />
              <div className="leg left" />
              <div className="leg right" />
            </div>
          </div>
          <div className="height">{Math.floor(position.y/25-80)}m</div>
        </div>
      )}
    </div>
  );
}

export default CannonLaunchGame;

