import React, { useState, useEffect } from 'react';
import './Bejeweled.css';

const WIDTH = 8;
const HEIGHT = 8;
const GEM_TYPES = [
  { color: 'orange', shape: 'octagon' },
  { color: 'blue', shape: 'square' },
  { color: 'green', shape: 'triangle' },
  { color: 'red', shape: 'diamond' },
  { color: 'purple', shape: 'pentagon' },
];


const Bejeweled = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('bejeweledHighScore');
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [draggedGem, setDraggedGem] = useState(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [level, setLevel] = useState(1);
  const [gemsCollected, setGemsCollected] = useState(0);
  const [gemsNeeded, setGemsNeeded] = useState(20); // Starting gems needed for level 1
  const [levelComplete, setLevelComplete] = useState(false);
  const [bonusScores, setBonusScores] = useState(Array(WIDTH * HEIGHT).fill(0));

  useEffect(() => {
    createBoard();
  }, []);

  const createBoard = () => {
    const newBoard = [];
    for (let i = 0; i < WIDTH * HEIGHT; i++) {
      const randomGemType = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
      newBoard.push({
        id: i,
        position: i,
        color: randomGemType.color,
        shape: randomGemType.shape,
        isSpecial: false,
        isMatched: false,
      });
    }
    setBoard(newBoard);
  };

  const handleSwipe = (direction) => {
    const draggedIndex = draggedGem;
    let replacedIndex = null;

    switch (direction) {
      case 'up':
        replacedIndex = draggedIndex - WIDTH;
        break;
      case 'down':
        replacedIndex = draggedIndex + WIDTH;
        break;
      case 'left':
        if (draggedIndex % WIDTH !== 0) {
          replacedIndex = draggedIndex - 1;
        }
        break;
      case 'right':
        if ((draggedIndex + 1) % WIDTH !== 0) {
          replacedIndex = draggedIndex + 1;
        }
        break;
      default:
        return;
    }

    if (replacedIndex !== null && replacedIndex >= 0 && replacedIndex < WIDTH * HEIGHT) {
      swapGems(draggedIndex, replacedIndex);
    }
  };

  const swapGems = (index1, index2) => {
    const updatedBoard = [...board];
    const gem1 = { ...updatedBoard[index1], position: index2 };
    const gem2 = { ...updatedBoard[index2], position: index1 };
    
    if(!gem1.id || !gem2.id) {
      return;
    }

    soundEffects.play('gameAction'); // Play sound when gems are swapped

    updatedBoard[index1] = gem2;
    updatedBoard[index2] = gem1;

    setBoard(updatedBoard);

    setTimeout(() => {
      const matches = checkForMatches(updatedBoard);
      if (matches.length === 0) {
        soundEffects.play('badMove'); // Play sound when swap is invalid
        const swappedBackBoard = [...updatedBoard];
        const gem1 = { ...swappedBackBoard[index1], position: index2 };
        const gem2 = { ...swappedBackBoard[index2], position: index1 };
        swappedBackBoard[index1] = gem2;
        swappedBackBoard[index2] = gem1;
        setBoard(swappedBackBoard);
      } else {
        handleMatches(matches, updatedBoard);
      }
    }, 300);
  };

  const checkForMatches = (currentBoard) => {
    const matches = [];
  
    // Horizontal matches
    for (let i = 0; i < HEIGHT; i++) {
      for (let j = 0; j < WIDTH - 2; j++) {
        let matchLength = 1;
        const startIdx = i * WIDTH + j;
        const gemColor = currentBoard[startIdx]?.color;
  
        if (!gemColor) continue;
  
        for (let k = j + 1; k < WIDTH; k++) {
          const idx = i * WIDTH + k;
          if (currentBoard[idx]?.color === gemColor) {
            matchLength++;
          } else {
            break;
          }
        }
  
        if (matchLength >= 3) {
          const indices = [];
          for (let k = 0; k < matchLength; k++) {
            indices.push(i * WIDTH + j + k);
          }
          let type = 'normal';
          if (matchLength === 4) {
            type = 'bomb';
          } else if (matchLength >= 5) {
            type = 'missile';
          }
          matches.push({ type, indices });
          j += matchLength - 1; // Skip over matched gems
        }
      }
    }
  
    // Vertical matches
    for (let i = 0; i < WIDTH; i++) {
      for (let j = 0; j < HEIGHT - 2; j++) {
        let matchLength = 1;
        const startIdx = j * WIDTH + i;
        const gemColor = currentBoard[startIdx]?.color;
  
        if (!gemColor) continue;
  
        for (let k = j + 1; k < HEIGHT; k++) {
          const idx = k * WIDTH + i;
          if (currentBoard[idx]?.color === gemColor) {
            matchLength++;
          } else {
            break;
          }
        }
  
        if (matchLength >= 3) {
          const indices = [];
          for (let k = 0; k < matchLength; k++) {
            indices.push((j + k) * WIDTH + i);
          }
          let type = 'normal';
          if (matchLength === 4) {
            type = 'bomb';
          } else if (matchLength >= 5) {
            type = 'missile';
          }
          matches.push({ type, indices });
          j += matchLength - 1; // Skip over matched gems
        }
      }
    }
  
    // Remove duplicate matches
    const uniqueMatches = [];
    const seenIndices = new Set();
    for (const match of matches) {
      const isNew = match.indices.some((idx) => !seenIndices.has(idx));
      if (isNew) {
        uniqueMatches.push(match);
        match.indices.forEach((idx) => seenIndices.add(idx));
      }
    }
  
    return uniqueMatches;
  };

  const handleMatches = (matches, currentBoard) => {
    const updatedBoard = [...currentBoard];
    const indicesToRemove = new Set();
    const bombsToExplode = [];
    const missilesToExplode = [];
  
    matches.forEach((match) => {
      const { type, indices } = match;
  
      if (type === 'bomb' || type === 'missile') {
        const specialIndex = indices[Math.floor(indices.length / 2)];
        indices.forEach((idx) => {
          if (idx !== specialIndex) {
            updatedBoard[idx].isMatched = true;
            indicesToRemove.add(idx);
          }
        });
        if (type === 'bomb') {
          updatedBoard[specialIndex].isBomb = true;
        } else {
          updatedBoard[specialIndex].isMissile = true;
        }
        soundEffects.play('shortBoom'); // Play lazer sound when bomb or missile is created
      } else {
        soundEffects.play('lazer'); // Play sound for regular matches
        indices.forEach((idx) => {
          if (updatedBoard[idx].isBomb) {
            bombsToExplode.push(idx);
          } else if (updatedBoard[idx].isMissile) {
            missilesToExplode.push(idx);
          }
          updatedBoard[idx].isMatched = true;
          indicesToRemove.add(idx);
        });
      }
    });
  
    // Handle bomb explosions
    bombsToExplode.forEach((bombIndex) => {
      soundEffects.play('boom'); // Play boom sound when bomb explodes
      const neighbors = getNeighboringIndices(bombIndex);
      neighbors.forEach((idx) => {
        if (updatedBoard[idx] && !updatedBoard[idx].isMatched) {
          updatedBoard[idx].isExploded = true;
          updatedBoard[idx].isMatched = true;
          indicesToRemove.add(idx);
        }
      });
    });
  
    // Handle missile explosions
    missilesToExplode.forEach((missileIndex) => {
      soundEffects.play('boom'); // Play boom sound when missile explodes
      const rowIndices = getRowIndices(missileIndex);
      const colIndices = getColumnIndices(missileIndex);
      const indicesToExplode = [...rowIndices, ...colIndices];
  
      indicesToExplode.forEach((idx) => {
        if (updatedBoard[idx] && !updatedBoard[idx].isMatched) {
          updatedBoard[idx].isMissileExploded = true;
          updatedBoard[idx].isMatched = true;
          indicesToRemove.add(idx);
        }
      });
    });
  
    setBoard(updatedBoard);
  
    const gemsMatched = indicesToRemove.size;
    setScore((prev) => {
      const newScore = prev + gemsMatched * 10;
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('bejeweledHighScore', newScore.toString());
      }
      return newScore;
    });
  
    setGemsCollected((prev) => prev + gemsMatched);
  
    if (gemsCollected + gemsMatched >= gemsNeeded) {
      setLevelComplete(true);
    }
  
    setTimeout(() => {
      soundEffects.play('goodMove'); // Play sound when gems fall into place
      indicesToRemove.forEach((idx) => {
        updatedBoard[idx] = null;
      });
      collapseGems(updatedBoard);
    }, 400);
  };

  const getRowIndices = (index) => {
    const row = Math.floor(index / WIDTH);
    const indices = [];
    for (let i = 0; i < WIDTH; i++) {
      const idx = row * WIDTH + i;
      if (idx !== index) { // Exclude the missile gem itself
        indices.push(idx);
      }
    }
    return indices;
  };
  
  const getColumnIndices = (index) => {
    const col = index % WIDTH;
    const indices = [];
    for (let i = 0; i < HEIGHT; i++) {
      const idx = i * WIDTH + col;
      if (idx !== index) { // Exclude the missile gem itself
        indices.push(idx);
      }
    }
    return indices;
  }; 

  const getNeighboringIndices = (index) => {
    const neighbors = [];
    const row = Math.floor(index / WIDTH);
    const col = index % WIDTH;
  
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue; // Skip the bomb gem itself
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < HEIGHT && newCol >= 0 && newCol < WIDTH) {
          neighbors.push(newRow * WIDTH + newCol);
        }
      }
    }
  
    return neighbors;
  }; 

  const calculateBonusPoints = (row) => {
    const bonusValues = [10, 25, 50, 100, 200, 500, 1000, 3000];
    return bonusValues[row] || 0;
  };

  const collapseGems = (currentBoard) => {
    let updatedBoard = [...currentBoard];
    const newBonusScores = [...bonusScores];

    for (let i = 0; i < WIDTH; i++) {
      let column = [];
      for (let j = HEIGHT - 1; j >= 0; j--) {
        const index = j * WIDTH + i;
        if (updatedBoard[index]) {
          column.push(updatedBoard[index]);
        }
      }

      const missing = HEIGHT - column.length;
      if (levelComplete) {
        for (let k = 0; k < missing; k++) {
          const positionIndex = k * WIDTH + i;
          const bonus = calculateBonusPoints(k);
          newBonusScores[positionIndex] = bonus;
        }
      } else {
        for (let k = 0; k < missing; k++) {
          const randomGemType = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
          const newGem = {
            id: WIDTH * k + i + Math.random(),
            position: k * WIDTH + i,
            color: randomGemType.color,
            shape: randomGemType.shape,
            isSpecial: false,
            isMatched: false,
          };
          column.push(newGem);
        }
      }

      for (let j = 0; j < HEIGHT; j++) {
        const gem = column[j];
        const gemPosition = (HEIGHT - 1 - j) * WIDTH + i;
        if (gem) {
          gem.position = gemPosition
        }
        updatedBoard[gemPosition] = gem;
      }
    }

    setBoard(updatedBoard);
    setBonusScores(newBonusScores);

    setTimeout(() => {
      const newMatches = checkForMatches(updatedBoard);
      if (newMatches.length > 0) {
        handleMatches(newMatches, updatedBoard);
        soundEffects.play('goodMove'); // Play sound when gems fall into place
      }
    }, 500);
  };

  const goToNextLevel = () => {
    soundEffects.play('gameWon'); // Play sound when going to next level
    const totalBonus = bonusScores.reduce((acc, bonus) => acc + bonus, 0);

    setScore((prev) => {
      const newScore = prev + totalBonus;
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('bejeweledHighScore', newScore.toString());
      }
      return newScore;
    });

    setLevel((prev) => prev + 1);
    setGemsCollected(0);
    setGemsNeeded((prev) => prev + 20);
    setLevelComplete(false);
    setBonusScores(Array(WIDTH * HEIGHT).fill(0));

    createBoard();
  };

  const handleTouchStart = (e, index) => {
    setDraggedGem(index);
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (draggedGem !== null) {
      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      let swipeDirection = null;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) swipeDirection = 'right';
        else swipeDirection = 'left';
      } else {
        if (deltaY > 0) swipeDirection = 'down';
        else swipeDirection = 'up';
      }

      if (swipeDirection) {
        handleSwipe(swipeDirection);
        setDraggedGem(null);
      }
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setDraggedGem(null);
    setTouchStartX(0);
    setTouchStartY(0);
  };

  return (
    <div className="bejeweled-container">
      <div className="game-header">
        <div className="score-container">
          <div className="score-box">
            <div className="score-label">LEVEL</div>
            <div className="score-value">{level}</div>
          </div>
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

      <div className="level-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(gemsCollected / gemsNeeded) * 100}%` }}
          ></div>
        </div>
        {levelComplete && (
          <button className="next-level-button" onClick={goToNextLevel}>
            Go to Level {level + 1}
          </button>
        )}
      </div>

      <div className="game-board">
        {board.map((gem, index) =>
          gem ? (
            <div
              key={`${gem.id}-${gem.position}`}
              className={`gem ${gem.color} ${gem.shape} ${gem.isMatched ? 'matched' : ''} ${
                gem.isBomb ? 'bomb' : ''
              } ${gem.isExploded ? 'exploded' : ''} ${
                gem.isMissile ? 'missile' : ''
              } ${gem.isMissileExploded ? 'missile-exploded' : ''}`}
              style={{
                left: `${(gem.position % WIDTH) * 12.5}%`,
                top: `${Math.floor(gem.position / WIDTH) * 12.5}%`,
              }}
              onTouchStart={(e) => handleTouchStart(e, gem.position)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            ></div>
          ) : bonusScores[index] > 0 ? (
            <div
              key={`empty-${index}`}
              className="empty-spot"
              style={{
                left: `${(index % WIDTH) * 12.5}%`,
                top: `${Math.floor(index / WIDTH) * 12.5}%`,
              }}
            >
              {bonusScores[index]}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default Bejeweled;
