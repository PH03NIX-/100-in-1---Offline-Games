import React, { useState, useEffect, useRef } from 'react';
import './MemoryGame.css'; // Reuse the same styles from memory game
import './patternMatchGame.css';

const PatternMatchGame = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
  const [level, setLevel] = useState(1);
  const [topCards, setTopCards] = useState([]);
  const [guessCards, setGuessCards] = useState([]);
  const [handCards, setHandCards] = useState([]);
  const [phase, setPhase] = useState('showing'); // 'showing', 'guessing', 'checking', 'result'
  const [countdown, setCountdown] = useState(3);
  const [correctGuess, setCorrectGuess] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [bestLevel, setBestLevel] = useState(() => {
    const saved = localStorage.getItem('patternMatchBestLevel');
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const topCardRefs = useRef([]);
  const guessCardRefs = useRef([]);
  const handCardRefs = useRef([]);

  // Unicode characters (same as memory game)
  const unicodeChars = [
    '😀', '🎉', '🚀', '🌟', '🍕', '🐶', '🎵', '⚽', '🏀', '🚗', '🎸', '✈️', '🍦', '🎨', '🦄', '🏆', '🎲', '📚', '🖥️', '📷', '💡',
    '🌈', '🍔', '🎁', '🦊', '🚴', '🛸', '💎', '🌸', '🐱', '🍩', '🎤', '🏹', '🚓', '🦋', '🌵', '🦁'
  ];

  useEffect(() => {
    startLevel(level);
  }, [level]);

  useEffect(() => {
    if (gamePaused) {
      setIsTimerActive(false);
    } else if (phase === 'showing' || phase === 'guessing') {
      setIsTimerActive(true);
    }
  }, [gamePaused, phase, setIsTimerActive]);

  useEffect(() => {
    if (level > bestLevel) {
      setBestLevel(level);
      localStorage.setItem('patternMatchBestLevel', level.toString());
    }
  }, [level, bestLevel]);

  const getCardsForLevel = (level) => {
    // For levels 1: 2 cards
    // For levels 2-3: 3 cards
    // increment cards by 1 every 3 levels
    if (level === 1) return 2;
    if (level <= 3) return 3;
    if (level <= 6) return 4;
    if (level <= 9) return 5;
    if (level <= 12) return 5;
    if (level <= 15) return 6;
    if (level <= 18) return 7;
    if (level <= 21) return 8;
    if (level <= 24) return 9;
    if (level <= 27) return 10;
    if (level <= 30) return 11;
    if (level <= 33) return 12;
    if (level <= 36) return 13;
    if (level <= 39) return 14;
    if (level <= 42) return 15;
    if (level <= 45) return 16;
    if (level <= 48) return 17;
    if (level <= 51) return 18;
    if (level <= 54) return 19;
    if (level <= 57) return 20;
    if (level <= 60) return 21;
    if (level <= 63) return 22;
    if (level <= 66) return 23;
    if (level <= 69) return 24;
    if (level <= 72) return 25;
    if (level <= 75) return 26;
    if (level <= 78) return 27;
    if (level <= 81) return 28;
    if (level <= 84) return 29;
    if (level <= 87) return 30;
    if (level <= 90) return 31;
    if (level <= 93) return 32;
    if (level <= 96) return 33;
    if (level <= 99) return 34;
    return 35;
  };

  const startLevel = (lvl) => {
    // Use getCardsForLevel instead of directly using level
    const numCards = getCardsForLevel(lvl);
    
    // Create base sequence first
    const selectedChars = shuffleArray(unicodeChars.slice()).slice(0, numCards);
    const sequence = selectedChars.map((char) => ({ id: Math.random(), char, isFlipped: true }));
    
    // Set top cards (initially face-up during showing phase)
    setTopCards(sequence);
    
    // Initialize empty guess cards array
    setGuessCards([]);
    
    // Initialize hand cards
    setHandCards([]); 

    setPhase('showing');
    setCorrectGuess(false);
    setCountdown(3);
    startCountdown(sequence);
  };

  const startCountdown = (sequence) => {
    let count = 3;
    
    // Show first number immediately
    setCountdown(count);
    
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        
        // Countdown finished:
        setCountdown(0);  // Clear countdown first
        
        // Flip top cards face-down
        setTopCards(prev => prev.map(c => ({...c, isFlipped: false})));
        
        // Show hand cards (face-up, shuffled)
        const hand = [...sequence].map(c => ({...c, isFlipped: true}));
        setHandCards(shuffleArray(hand));
        
        setPhase('guessing');
      }
    }, 900);  // Changed to 900ms to match animation duration
  };

  const shuffleArray = (arr) => {
    return arr.sort(() => Math.random() - 0.5);
  };

  const handleHandCardClick = (card) => {
    if (gamePaused || phase !== 'guessing') return;
    
    soundEffects.play('card');
    
    // Move card from hand to guess
    setHandCards((prev) => prev.filter((c) => c.id !== card.id));
    setGuessCards((prev) => {
      const newGuessCards = [...prev, {...card, isFlipped: true}];
      
      // If guess is complete, check after state update
      if (newGuessCards.length === getCardsForLevel(level)) {
        setPhase('checking');
        setTimeout(() => checkGuess(newGuessCards), 800);  // Pass the complete guess array
      }
      
      return newGuessCards;
    });
  };

  const checkGuess = (completeGuessCards) => {  // Accept complete guess array as parameter
    // Flip top cards face-up to compare
    setTopCards(prev => prev.map(c => ({...c, isFlipped:true})));

    const guessChars = completeGuessCards.map(c => c.char);  // Use passed array instead of state
    const solutionChars = topCards.map(c => c.char);
    console.log('guessChars', guessChars);
    console.log('solutionChars', solutionChars);

    const isCorrect = guessChars.join('') === solutionChars.join('');
    setCorrectGuess(isCorrect);

    if (isCorrect) {
      soundEffects.play('goodMove');
      const levelPoints = level * 100;  // Add points for completing level
      setScore(prev => prev + levelPoints);
      setTimeout(() => {
        setLevel(level + 1);
      }, 1500);
    } else {
      soundEffects.play('badMove');
      if (lives === 0) {
        setPhase('gameOver');
        setIsTimerActive(false);
        soundEffects.play('gameOver');
      } else {
        setPhase('result');
      }
    }
  };

  const handleTryAgain = () => {
    if (lives > 0) {
      // Keep same top cards but reset their flip state to face-up
      setTopCards(prev => prev.map(c => ({...c, isFlipped: true})));
      setGuessCards([]);
      setHandCards([]); // Clear hand cards until countdown is done
      setPhase('showing');
      setCountdown(3);
      setLives(lives - 1);
      soundEffects.play('playButton');
      
      // Start countdown with same sequence
      startCountdown([...topCards]); // Pass current topCards sequence
    }
  };

  const handlePlayAgain = () => {
    setLevel(1);
    setLives(3);
    setScore(0);
    setIsTimerActive(true);
    startLevel(1);
    soundEffects.play('playButton');
  };

  const adjustFontSize = (cardElement) => {
    if (!cardElement) return;
    const cardFront = cardElement.querySelector('.card-front');
    const span = cardFront.querySelector('span');
    let fontSize = 100;
    span.style.fontSize = `${fontSize}px`;

    while ((span.offsetWidth >= cardFront.offsetWidth || span.offsetHeight >= cardFront.offsetHeight) && fontSize > 0) {
      fontSize--;
      span.style.fontSize = `${fontSize}px`;
    }
  };

  useEffect(() => {
    [topCardRefs, guessCardRefs, handCardRefs].forEach(refArray => {
      refArray.current.forEach(el => {
        if (el) adjustFontSize(el);
      });
    });
  }, [topCards, guessCards, handCards]);

  const handleGuessCardClick = (cardIndex) => {
    if (gamePaused || phase !== 'guessing') return;
    
    soundEffects.play('card');
    
    // Get the card from guessCards
    const card = guessCards[cardIndex];
    
    // Move card from guess back to hand
    setGuessCards(prev => {
      const newGuessCards = [...prev];
      newGuessCards.splice(cardIndex, 1);  // Remove card from guess
      return newGuessCards;
    });
    
    setHandCards(prev => [...prev, card]);  // Add card back to hand
  };

  return (
    <div className="pre-memory-game" style={{display:'flex', flexDirection:'column', height:'100vh'}}>
      <div className="memory-game" style={{flex:'1 0 auto', display:'flex', flexDirection:'column', justifyContent:'flex-start', alignItems:'center', marginTop:'50px'}}>
        
        <div className="game-info">
          <div>Lives: {lives}</div>
          <div>Level: {level}</div>
          <div>Best: {bestLevel}</div>
        </div>

        {/* Add countdown display */}
        {phase === 'showing' && countdown > 0 && (
          <div key={countdown} className="countdown">
            {countdown}
          </div>
        )}

        {/* Top Row */}
        <div className="game-grid topRow" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${getCardsForLevel(level)}, 1fr)`,
          gap: '10px',
          marginBottom: '20px'
        }}>
          {topCards.map((card, index) => (
            <div
              key={card.id}
              ref={el => topCardRefs.current[index] = el}
              className={`card ${card.isFlipped ? 'is-flipped' : ''}`}
              style={{height:'100px'}}
            >
              <div className="card-inner">
                <div className="card-front"><span>{card.char}</span></div>
                <div className="card-back"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Guess Row */}
        <div className="game-grid guessRow" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${getCardsForLevel(level)}, 1fr)`,
          gap: '10px',
          marginBottom: '20px'
        }}>
          {Array.from({length: getCardsForLevel(level)}).map((_, i) => {
            const card = guessCards[i];
            return (
              <div
                key={i}
                ref={el => guessCardRefs.current[i] = el}
                className={`card ${card && card.isFlipped ? 'is-flipped' : ''}`}
                style={{height:'80px', cursor: card ? 'pointer' : 'default'}}
                onClick={() => card && handleGuessCardClick(i)}
              >
                <div className="card-inner">
                  <div className="card-front">
                    <span>{card ? card.char : ''}</span>
                  </div>
                  <div className="card-back"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Try Again Button if failed but have lives */}
        {phase === 'result' && !correctGuess && (
          <button onClick={handleTryAgain} className="play-again-button">
            Try Again ({lives})
          </button>
        )}
      </div>

      {/* Hand Row (at bottom) */}
      {phase === 'guessing' && (
        <div className='handRow' style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: `repeat(${getCardsForLevel(level)}, 1fr)`,
          gap: '10px',
          padding: '10px',
          marginBottom: '150px'
        }}>
          {handCards.map((card, index) => (
            <div
              key={card.id}
              ref={el => handCardRefs.current[index] = el}
              className={`card ${card.isFlipped ? 'is-flipped' : ''}`}
              style={{height:'80px'}}
              onClick={() => handleHandCardClick(card)}
            >
              <div className="card-inner">
                <div className="card-front"><span>{card.char}</span></div>
                <div className="card-back"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Game Over Screen */}
      {phase === 'gameOver' && (
        <div className="game-over">
          <h2>Game Over</h2>
          <p>Level: {level}</p>
          <p>Best: {bestLevel}</p>
          <button onClick={handlePlayAgain}>Restart Game</button>
        </div>
      )}
    </div>
  );
};

export default PatternMatchGame;
