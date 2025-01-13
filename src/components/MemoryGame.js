import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import './MemoryGame.css';

const MemoryGame = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
  const [difficulty, setDifficulty] = useState(12); // Default to 12 cards
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [disableAllCards, setDisableAllCards] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [matches, setMatches] = useState(0);
  const [guesses, setGuesses] = useState(0);
  const [bestAccuracy, setBestAccuracy] = useState({});

  const cardRefs = useRef([]);

  useEffect(() => {
    // Load best accuracies from localStorage
    const savedBestAccuracies = JSON.parse(localStorage.getItem('memoryGameBestAccuracies')) || {};
    setBestAccuracy(savedBestAccuracies);
    initializeGame();
  }, [difficulty]);

  const initializeGame = () => {
    // Unicode characters for card faces
    const unicodeChars = [
      '😀', '🎉', '🚀', '🌟', '🍕', '🐶', '🎵', '⚽', '🏀', '🚗', '🎸', '✈️', '🍦', '🎨', '🦄', '🏆', '🎲', '📚', '🖥️', '📷', '💡',
      '🌈', '🍔', '🎁', '🦊', '🚴', '🛸', '💎', '🌸', 
      '🐱', '🍩', '🎤', '🏹', '🚓', '🦋', '🌵', '🦁'
    ];
    
    

    // Select the number of pairs based on difficulty
    const numPairs = difficulty / 2;
    const selectedChars = unicodeChars.slice(0, numPairs);

    // Create card objects
    const cardArray = selectedChars
      .concat(selectedChars) // Duplicate for pairs
      .map((char) => ({ id: Math.random(), char, isFlipped: false }));

    // Shuffle the cards
    const shuffledCards = cardArray.sort(() => 0.5 - Math.random());

    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedCards([]);
    setDisableAllCards(false);
    setGameWon(false);  // Reset gameWon state
    setMatches(0);
    setGuesses(0);
  };

  const adjustFontSize = (cardElement) => {
    if (!cardElement) return;
    
    const cardFront = cardElement.querySelector('.card-front');
    const span = cardFront.querySelector('span');
    let fontSize = 100;
    span.style.fontSize = `${fontSize}px`;

    while (span.offsetWidth >= cardFront.offsetWidth || span.offsetHeight >= cardFront.offsetHeight) {
      fontSize--;
      span.style.fontSize = `${fontSize}px`;
    }
  };

  const handleCardClick = (card, event) => {
    if (disableAllCards || card.isFlipped || matchedCards.includes(card.id)) {
      return;
    }

    soundEffects.play('card'); // Play card sound when a card is clicked/flipped

    const flipped = [...flippedCards, card];

    // Find the clicked card element
    const clickedCardElement = cardRefs.current.find(ref => ref && ref.contains(event.target));
    if (clickedCardElement) {
      adjustFontSize(clickedCardElement);
    }

    setFlippedCards(flipped);
    setCards((prevCards) =>
      prevCards.map((c) =>
        c.id === card.id ? { ...c, isFlipped: true } : c
      )
    );

    if (flipped.length === 2) {
      setGuesses(prevGuesses => prevGuesses + 1);
      if (flipped[0].char === flipped[1].char) {
        // Match found
        setTimeout(() => {
          soundEffects.play('goodMove'); // Play goodMove sound for a match
        }, 300); // Slight delay to let the card flip sound finish

        setMatches(prevMatches => {
          const newMatches = prevMatches + 1;
          setMatchedCards((prevMatched) => {
            const newMatched = [...prevMatched, flipped[0].id, flipped[1].id];
            // Check if the game is won after updating matchedCards
            if (newMatched.length === cards.length) {
              setTimeout(() => {
                setGameWon(true);
                soundEffects.play('gameWon'); // Play gameWon sound when the game is won
                checkAndUpdateBestAccuracy(newMatches, guesses + 1);
              }, 500);
            }
            return newMatched;
          });
          return newMatches;
        });
        setFlippedCards([]);
      } else {
        // No match
        setDisableAllCards(true);
        setTimeout(() => {
          // Play two card sounds with 20ms delay when cards are flipped back
          soundEffects.play('card');
          setTimeout(() => {
            soundEffects.play('card');
          }, 40);

          setCards((prevCards) =>
            prevCards.map((c) =>
              c.id === flipped[0].id || c.id === flipped[1].id
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
          setDisableAllCards(false);
        }, 1000);
      }
    }
  };

  const checkAndUpdateBestAccuracy = (finalMatches, finalGuesses) => {
    const accuracy = calculateAccuracy(finalMatches, finalGuesses);
    if (!bestAccuracy[difficulty] || accuracy > bestAccuracy[difficulty]) {
      const newBestAccuracy = { ...bestAccuracy, [difficulty]: accuracy };
      setBestAccuracy(newBestAccuracy);
      localStorage.setItem('memoryGameBestAccuracies', JSON.stringify(newBestAccuracy));
    }
  };

  const calculateAccuracy = (matchesCount = matches, guessesCount = guesses) => {
    return guessesCount > 0 ? (matchesCount / guessesCount) * 100 : 0;
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(parseInt(e.target.value));
    setGameWon(false);  // Reset gameWon state when difficulty changes
    initializeGame();   // Reinitialize the game with new difficulty
  };

  const resetGame = () => {
    soundEffects.play('playButton');
    setGameWon(false);
    setMatches(0);
    setGuesses(0);
    initializeGame();
  };

  const getGridColumns = () => {
    switch (difficulty) {
      case 12: return 4;  // Easy
      case 16: return 4;  // Medium
      case 20: return 5;  // Hard
      case 30: return 6;  // Extreme
      case 42: return 7;  // Ridiculous
      case 56: return 7;  // insane
      case 72: return 8;  // insane
      default: return 4;
    }
  };

  return (
    <div className="pre-memory-game">
      <div className="memory-game">
        {gameWon && (
          <>
            <Confetti />
            <div className="win-message">YOU WIN!</div>
          </>
        )}
        <div className="header">
          <select
            value={difficulty}
            onChange={handleDifficultyChange}
          >
            <option value={12}>Beginner (6 Pairs)</option>
            <option value={16}>Easy (8 Pairs)</option>
            <option value={20}>Medium (10 Pairs)</option>
            <option value={30}>Hard (15 Pairs)</option>
            <option value={42}>Extreme (21 Pairs)</option>
            <option value={56}>Ridiculous (28 Pairs)</option>
            <option value={72}>Insane (36 Pairs)</option>
          </select>
        </div>

        <div className="game-info">
          <div>Match: {matches}</div>
          <div>Guess: {guesses}</div>
          <div className={calculateAccuracy() > (bestAccuracy[difficulty] || 0) ? 'better-accuracy' : ''}>
            Acc: {calculateAccuracy().toFixed(1)}%
          </div>
          <div>Best: {(bestAccuracy[difficulty] || 0).toFixed(1)}%</div>
        </div>

        <div className={`game-grid ${gameWon ? 'win' : ''}`} style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`,
          gap: '10px'
        }}>
          {cards.map((card, index) => (
            <div
              key={card.id}
              ref={(el) => cardRefs.current[index] = el}
              className={`card diff${difficulty} ${card.isFlipped ? 'is-flipped' : ''} ${gameWon ? 'win' : ''}`}
              onClick={(event) => handleCardClick(card, event)}
            >
              <div className="card-inner">
                <div className="card-front"><span>{card.char}</span></div>
                <div className="card-back"></div>
              </div>
            </div>
          ))}
        </div>
        
      </div>
      {gameWon && (
        <button onClick={resetGame} className="play-again-button">
          Play Again
        </button>
      )}
    </div>
  );
};

export default MemoryGame;
