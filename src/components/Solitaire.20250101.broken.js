import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import './Solitaire.css';

// Card suits and values
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Get the suit symbol for display
const getSuitSymbol = (suit) => {
    switch (suit) {
        case 'hearts':
            return '♥';
        case 'diamonds':
            return '♦';
        case 'clubs':
            return '♣';
        case 'spades':
            return '♠';
        default:
            return '';
    }
};

// Get the color for the suit (red or black)
const getSuitColor = (suit) => {
    return (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black';
};

// Create deck of cards
const createDeck = () => {
    let deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value, faceUp: true }); // Cards from the deck will always be face-up
        }
    }
    return deck;
};

// Shuffle deck
const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

// Arrange deck for easy win
const shuffleDeckForEasyWin = (deck) => {
    // Sort the deck by suit and value
    deck.sort((a, b) => {
        if (a.suit !== b.suit) {
            return ['hearts', 'diamonds', 'clubs', 'spades'].indexOf(a.suit) - 
                   ['hearts', 'diamonds', 'clubs', 'spades'].indexOf(b.suit);
        }
        return values.indexOf(b.value) - values.indexOf(a.value);
    });

    // Move some cards to the end to ensure playability
    const movedCards = deck.splice(0, 24); // Move first 24 cards
    deck = deck.concat(movedCards);

    return deck;
};

// Deal cards into columns and return the remaining deck
const dealCards = (deck) => {
    const columns = [[], [], [], [], [], [], []];
    let index = 0;
    
    // Deal cards into columns
    for (let i = 0; i < columns.length; i++) {
        for (let j = 0; j <= i; j++) {
            const card = { ...deck[index], faceUp: j === i }; // Only the top card in each column is face-up
            columns[i].push(card);
            index++;
        }
    }
    
    // Return the columns and the remaining deck
    return { columns, remainingDeck: deck.slice(index) };
};

// Add this helper function to serialize cards
const serializeCard = (card) => {
    if (!card) return null;
    return {
        suit: card.suit,
        value: card.value,
        faceUp: card.faceUp,
        color: getSuitColor(card.suit)
    };
};

// Add this helper function to deserialize cards
const deserializeCard = (cardData) => {
    if (!cardData) return null;
    return {
        ...cardData,
        color: getSuitColor(cardData.suit)
    };
};

const Solitaire = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
    const [deck, setDeck] = useState(null);
    const [currentDeckIndex, setCurrentDeckIndex] = useState(-1);
    const [columns, setColumns] = useState(null);
    const [foundations, setFoundations] = useState(null);
    const [draggedCard, setDraggedCard] = useState(null);
    const [draggedCardPosition, setDraggedCardPosition] = useState({ x: 0, y: 0 });
    const [originalColumn, setOriginalColumn] = useState(null);
    const [isWin, setIsWin] = useState(false);
    const [showResumePrompt, setShowResumePrompt] = useState(false);

    // Load saved game on mount
    useEffect(() => {
        const savedGame = localStorage.getItem('solitaire_savedGame');
        if (savedGame) {
            setShowResumePrompt(true);
        } else {
            initializeNewGame();
        }
    }, []);

    const resumeGame = () => {
        try {
            const savedGame = JSON.parse(localStorage.getItem('solitaire_savedGame'));
            if (!savedGame) {
                initializeNewGame();
                return;
            }
            
            setDeck(savedGame.deck.map(card => deserializeCard(card)));
            setCurrentDeckIndex(savedGame.currentDeckIndex);
            setColumns(savedGame.columns.map(col => 
                col.map(card => deserializeCard(card))
            ));
            setFoundations(savedGame.foundations.map(foundation => 
                foundation.map(card => deserializeCard(card))
            ));
            setShowResumePrompt(false);
        } catch (error) {
            console.error('Error resuming game:', error);
            initializeNewGame();
        }
    };

    // Add error boundaries to the render method
    return (
        <div className="solitaire-container">
            {showResumePrompt ? (
                <div className="resume-prompt">
                    <div className="resume-prompt-content">
                        <h2>Resume Game?</h2>
                        <p>Would you like to continue your previous game?</p>
                        <div className="resume-prompt-buttons">
                            <button onClick={resumeGame}>Continue</button>
                            <button onClick={() => {
                                setShowResumePrompt(false);
                                initializeNewGame();
                            }}>New Game</button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {(!columns || !deck) ? (
                        <div>Loading...</div>
                    ) : (
                        <>
                            {isWin && (
                                <>
                                    <Confetti />
                                    <div className="win-message">YOU WIN!</div>
                                </>
                            )}
                            <div className={`game-board ${isWin ? 'win' : ''}`}>
                                <div className={`deck-stack ${deck[currentDeckIndex] ? 'bottom-margin' : ''}`} onClick={handleDeckClick}>
                                    
                                </div>
                                
                                <div 
                                    className={`card-face from-deck ${currentDeckIndex === -1 ? 'hidden' : ''}`} 
                                    onTouchStart={handleDeckTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                    style={{ 
                                        color: currentDeckIndex >= 0 ? getSuitColor(deck[currentDeckIndex].suit) : 'black',
                                        display: currentDeckIndex === -1 ? 'none' : 'block'
                                    }}
                                >
                                    <div className="card-value top-left">
                                        {currentDeckIndex >= 0 && `${deck[currentDeckIndex].value}${getSuitSymbol(deck[currentDeckIndex].suit)}`}
                                    </div>
                                    <div className="card-value bottom-right">
                                        {currentDeckIndex >= 0 && `${deck[currentDeckIndex].value}${getSuitSymbol(deck[currentDeckIndex].suit)}`}
                                    </div>
                                </div>
                                <div className="foundations">
                                    {foundations.map((foundation, index) => (
                                        <div 
                                            key={index} 
                                            className="foundation-pile" 
                                            onTouchEnd={(e) => handleFoundationDrop(index, e)}
                                            data-foundation-index={index}
                                        >
                                            {foundation.length > 0 && (
                                                <div 
                                                    className="foundation-card"
                                                    style={{ color: foundation[foundation.length - 1].color }}
                                                >
                                                    <div className="card-value top-left">
                                                        {foundation[foundation.length - 1].value}{getSuitSymbol(foundation[foundation.length - 1].suit)}
                                                    </div>
                                                    <div className="card-value bottom-right">
                                                        {foundation[foundation.length - 1].value}{getSuitSymbol(foundation[foundation.length - 1].suit)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="card-columns">
                                    {columns.map((col, colIndex) => (
                                        <div
                                            key={colIndex}
                                            className={`card-column ${isWin ? 'win-column' : ''}`}
                                            data-col-index={colIndex}
                                            onTouchMove={handleTouchMove}
                                            onTouchEnd={handleTouchEnd}
                                        >
                                            {col.map((card, cardIndex) => (
                                                <div
                                                    key={cardIndex}
                                                    className={card.faceUp ? "card-face" : "card-back"}
                                                    data-card-index={cardIndex}
                                                    data-col-index={colIndex}
                                                    onTouchStart={(e) => handleTouchStart(e, card, colIndex, cardIndex)}
                                                    onClick={() => handleCardClick(card, colIndex, cardIndex)}
                                                    style={{ color: getSuitColor(card.suit) }}
                                                >
                                                    {card.faceUp && (
                                                        <>
                                                            <div className="card-value top-left">
                                                                {card.value}{getSuitSymbol(card.suit)}
                                                            </div>
                                                            <div className="card-value bottom-right">
                                                                {card.value}{getSuitSymbol(card.suit)}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {draggedCard && (
                                <div
                                    id="dragged-card"
                                    style={{
                                        position: 'absolute',
                                        left: `${draggedCardPosition.x - 30}px`,  // Slight horizontal offset for centering
                                        top: `${draggedCardPosition.y - 80}px`,  // Slight vertical offset for better placement
                                        zIndex: 1000,
                                        pointerEvents: 'none', // Add this line
                                    }}
                                >
                                    {draggedCard.cards.map((card, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                backgroundColor: 'white',
                                                border: '1px solid #000',
                                                width: 'calc(100vw / 7 - 25px)',
                                                height: 'calc((100vw / 7 - 25px) * 1.4)',
                                                position: 'absolute',
                                                top: `${index * 20}px`,  // Slight vertical offset for stacking
                                                left: 0,
                                                zIndex: 1000 - index,
                                                padding: '10px',
                                                borderRadius: '5px',
                                                color: getSuitColor(card.suit),
                                            }}
                                        >
                                            <div className="card-value top-left">
                                                {card.value}{getSuitSymbol(card.suit)}
                                            </div>
                                            <div className="card-value bottom-right">
                                                {card.value}{getSuitSymbol(card.suit)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default Solitaire;
