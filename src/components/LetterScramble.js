import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import './LetterScramble.css';

function LetterScramble({ wordList, playtime, gamePaused, setIsTimerActive, soundEffects }) {
  const [letterCount, setLetterCount] = useState(5);
  const [lettersInHand, setLettersInHand] = useState([]);
  const [spellArea, setSpellArea] = useState([]);  // letters user has arranged
  const [allValidWords, setAllValidWords] = useState([]);  // filtered from wordList
  const [foundWords, setFoundWords] = useState([]);        // user success
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('letterScrambleHighScores');
    return saved ? JSON.parse(saved) : {};
  });
  const [gameStatus, setGameStatus] = useState('playing');
  
  // On mount, initialize the game
  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    // Timer rules: if not paused, timer can run
    setIsTimerActive(!gamePaused);
  }, [gamePaused, setIsTimerActive]);

  const handleLetterCountChange = (e) => {
    const newCount = parseInt(e.target.value);
    setLetterCount(newCount);
    startNewGame(newCount);
    if (soundEffects) soundEffects.play('gameAction');
  };

  const startNewGame = (count = letterCount) => {
    let newLetters;
    let possibleWords;
    let allLettersUsed;
    
    do {
        // 1) Pick random letters
        newLetters = generateRandomLetters(count);
        
        // 2) Filter wordList to find valid words
        possibleWords = wordList.filter(word => 
            word.length > 1 && canSpellWithLetters(word, newLetters)
        );

        // 3) Check if each letter is used at least once in possible words
        allLettersUsed = checkAllLettersUsed(newLetters, possibleWords);
        
    } while (possibleWords.length < 7 || !allLettersUsed);
    
    console.log('possibleWords', possibleWords);
    console.log('letters', newLetters);

    setLettersInHand(newLetters.map((char, index) => ({
        id: `hand-${index}-${char}`,
        char,
    })));
    setSpellArea([]);
    setAllValidWords(possibleWords);
    setFoundWords([]);
    setScore(0);
    setGameStatus('playing');
    setIsTimerActive(true);

    if (soundEffects) soundEffects.play('gameAction');
  };

  const generateRandomLetters = (count) => {
    // Simple approach: pick random letters A-Z.
    // Alternatively, you can tweak frequency to mirror Scrabble letter distribution.
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const letters = [];
    for (let i = 0; i < count; i++) {
      const randIndex = Math.floor(Math.random() * alphabet.length);
      letters.push(alphabet[randIndex]);
    }
    return letters;
  };

  // Check if 'word' can be spelled with 'letters' (5 random letters).
  // Each letter can only be used as many times as it appears in 'letters'.
  const canSpellWithLetters = (word, letters) => {
    const wordLower = word.toLowerCase();
    // Quick length check
    if (wordLower.length > letters.length) return false;

    // Create frequency maps
    const freqLetters = {};
    letters.forEach(l => {
      freqLetters[l] = (freqLetters[l] || 0) + 1;
    });

    for (let char of wordLower) {
      if (!freqLetters[char]) {
        return false;
      }
      freqLetters[char]--;
      if (freqLetters[char] < 0) {
        return false;
      }
    }
    return true;
  };

  // Tap a letter in the "hand" to move it to "spellArea"
  const handleTapHandLetter = (letterObj) => {
    // remove from lettersInHand
    setLettersInHand(prev => prev.filter(l => l.id !== letterObj.id));
    // add to spellArea
    setSpellArea(prev => [...prev, letterObj]);
    if (soundEffects) soundEffects.play('gameAction');
  };

  // Tap a letter in the "spellArea" to move it back to "hand"
  const handleTapSpellLetter = (letterObj) => {
    setSpellArea(prev => prev.filter(l => l.id !== letterObj.id));
    setLettersInHand(prev => [...prev, letterObj]);
    if (soundEffects) soundEffects.play('lazer');
  };

  // Calculate percentage score
  const calculateScore = (found, total) => {
    return Math.round((found / total) * 100);
  };

  // Update high score if necessary
  const updateHighScore = (currentScore, letterCount) => {
    const currentHigh = highScores[letterCount] || 0;
    if (currentScore > currentHigh) {
      const newHighScores = { ...highScores, [letterCount]: currentScore };
      setHighScores(newHighScores);
      localStorage.setItem('letterScrambleHighScores', JSON.stringify(newHighScores));
      return true; // Indicates a new high score was set
    }
    return false;
  };

  // Modify handleCheckWord to use percentage scoring
  const handleCheckWord = () => {
    const spelled = spellArea.map(l => l.char).join('').toLowerCase();
    if (spelled.length === 0) {
      if (soundEffects) soundEffects.play('badMove');
      return;
    }
    if (allValidWords.includes(spelled)) {
      if (foundWords.includes(spelled)) {
        if (soundEffects) soundEffects.play('badMove');
        return;
      } else {
        const newFoundWords = [...foundWords, spelled];
        setFoundWords(newFoundWords);
        
        // Calculate new percentage score
        const newScore = calculateScore(newFoundWords.length, allValidWords.length);
        setScore(newScore);
        
        // Check for win condition
        if (newFoundWords.length === allValidWords.length) {
          setGameStatus('won');
          setIsTimerActive(false);
          soundEffects.play('gameWon');
        } else if (updateHighScore(newScore, letterCount)) {
          soundEffects.play('gameWon'); // Play special sound for new high score
        } else {
          soundEffects.play('goodMove');
        }
      }
    } else {
      if (soundEffects) soundEffects.play('badMove');
    }
    setLettersInHand(prev => [...prev, ...spellArea]);
    setSpellArea([]);
  };

  const checkAllLettersUsed = (letters, words) => {
    // Create a Set of all letters that need to be used
    const unusedLetters = new Set(letters);
    
    // Go through each word and remove letters that are used
    for (let word of words) {
        for (let char of word) {
            unusedLetters.delete(char);
        }
        
        // If all letters have been used, we can return early
        if (unusedLetters.size === 0) {
            return true;
        }
    }
    
    // If we get here, some letters were never used
    return false;
  };

  const handlePlayAgain = () => {
    soundEffects.play('playButton');
    setGameStatus('playing');
    startNewGame();
  };

  return (
    <div className="scramble-container">
      {gameStatus === 'won' && (
        <>
          <Confetti />
          <div className="win-message">YOU WIN!</div>
          <div className="game-message">
            <button className="restart-button" onClick={handlePlayAgain}>
              Play Again
            </button>
          </div>
        </>
      )}
      
      <div className="scramble-topbar">
        <select 
          value={letterCount} 
          onChange={handleLetterCountChange}
          className="letter-count-select"
        >
          <option value={4}>4 Letters</option>
          <option value={5}>5 Letters</option>
          <option value={6}>6 Letters</option>
          <option value={7}>7 Letters</option>
          <option value={8}>8 Letters</option>
          <option value={9}>9 Letters</option>
          <option value={10}>10 Letters</option>
          <option value={11}>11 Letters</option>
          <option value={12}>12 Letters</option>
          <option value={13}>13 Letters</option>
        </select>
        <div className="scramble-score">Score: {score}%</div>
        <div className="scramble-score">Best: {highScores[letterCount] || 0}%</div>
      </div>

      {/* Found Words */}
      <div className="scramble-foundwords">
        <h3>Found Words {foundWords.length}/{allValidWords.length}</h3>
        <ul className={`word-list columns-${
          foundWords.length > 32 ? 5 :
          foundWords.length > 24 ? 4 :
          foundWords.length > 16 ? 3 :
          foundWords.length > 8 ? 2 : 1
        } ${foundWords.length > 32 ? 'small-text' : ''}`}>
          {[...foundWords].reverse().map((w, idx) => (
            <li key={idx}>{w.toUpperCase()}</li>
          ))}
        </ul>
      </div>

      <div className="player-area">
        {gameStatus === 'playing' && (
          <>
            {/* Spell Area */}
            <div className="scramble-spell">
              <h3>Spell Word</h3>
              <div className="scramble-spell-letters">
                {spellArea.map(letterObj => (
                  <div 
                    key={letterObj.id} 
                    className="scramble-letter-tile spell-tile"
                    onClick={() => handleTapSpellLetter(letterObj)}
                  >
                    {letterObj.char.toUpperCase()}
                  </div>
                ))}
              </div>
              <button className="scramble-check-btn" onClick={handleCheckWord}>Check Word</button>
            </div>

            {/* Hand (letters) */}
            <div className="scramble-hand">
              <h3>Your Letters</h3>
              <div className="scramble-hand-letters">
                {lettersInHand.map(letterObj => (
                  <div 
                    key={letterObj.id} 
                    className="scramble-letter-tile hand-tile"
                    onClick={() => handleTapHandLetter(letterObj)}
                  >
                    {letterObj.char.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LetterScramble;
