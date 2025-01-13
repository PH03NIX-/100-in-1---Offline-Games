import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import './HangmanGame.css';




const HangmanDrawing = ({ wrongGuesses, gameStatus }) => {
  return (
    <div className={`hangman-drawing ${gameStatus === 'won' ? 'won' : ''}`}>
      {wrongGuesses > 0 && <div className="hangman-base"></div>}
      {wrongGuesses > 1 && <div className="hangman-pole"></div>}
      {wrongGuesses > 2 && <div className="hangman-arm"></div>}
      {wrongGuesses > 3 && <div className="hangman-rope"></div>}
      {wrongGuesses > 4 && <div className="hangman-head"></div>}
      {wrongGuesses > 5 && <div className="hangman-body"></div>}
      {wrongGuesses > 6 && <div className="hangman-left-arm"></div>}
      {wrongGuesses > 7 && <div className="hangman-right-arm"></div>}
      {wrongGuesses > 8 && <div className="hangman-left-leg"></div>}
      {wrongGuesses > 9 && <div className="hangman-right-leg"></div>}
    </div>
  );
};

const WordDisplay = ({ word, guessedLetters }) => {
  return (
    <div className="word-display">
      {word.split('').map((letter, index) => (
        <span key={index} className="word-letter">
          {guessedLetters.includes(letter) ? letter : '_'}
        </span>
      ))}
    </div>
  );
};

const Alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

const LetterButtons = ({ guessedLetters, onLetterClick }) => {
  return (
    <div className="letter-buttons">
      {Alphabet.map((letter) => (
        <button
          key={letter}
          onClick={() => onLetterClick(letter)}
          disabled={guessedLetters.includes(letter)}
          className={guessedLetters.includes(letter) ? 'disabled' : ''}
        >
          {letter.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

const HangmanGame = ({ wordList, soundEffects }) => {
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    setWord(randomWord);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameStatus('playing');
    soundEffects.play('playButton');
  };

  const handleLetterClick = (letter) => {
    if (gameStatus !== 'playing') return;

    if (guessedLetters.includes(letter)) return;

    soundEffects.play('gameAction');

    const updatedGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(updatedGuessedLetters);

    if (word.includes(letter)) {
      // Correct guess
      soundEffects.play('goodMove');
      const allLettersGuessed = word
        .split('')
        .every((char) => updatedGuessedLetters.includes(char));

      if (allLettersGuessed) {
        setGameStatus('won');
        soundEffects.play('gameWon');
      }
    } else {
      // Incorrect guess
      const newWrongGuesses = wrongGuesses + 1;
      setWrongGuesses(newWrongGuesses);

      if (newWrongGuesses >= 10) {
        setGameStatus('lost');
        soundEffects.play('gameOver');
      }
    }
  };

  const handlePlayAgain = () => {
    soundEffects.play('playButton');
    initializeGame();
  };

  return (
    <div className="pre-hangman-game">
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
      <div className="hangman-game">
        <HangmanDrawing wrongGuesses={wrongGuesses} gameStatus={gameStatus} />

        <WordDisplay word={word} guessedLetters={guessedLetters} />

        {gameStatus === 'playing' && (
          <LetterButtons
            guessedLetters={guessedLetters}
            onLetterClick={handleLetterClick}
          />
        )}
      </div>
      {gameStatus === 'lost' && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>The word was "<span className="hangmanCorrectWord">{word}</span>".</p>
          <button className="restart-button" onClick={handlePlayAgain}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default HangmanGame;
