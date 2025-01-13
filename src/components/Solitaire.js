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


const Solitaire = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
    const [deck, setDeck] = useState(shuffleDeck(createDeck())); 
    const [currentDeckIndex, setCurrentDeckIndex] = useState(-1); 
    const [columns, setColumns] = useState([[], [], [], [], [], [], []]); 
    const [foundations, setFoundations] = useState([[], [], [], []]); // Four foundations for suits
    const [draggedCard, setDraggedCard] = useState(null);
    const [draggedCardPosition, setDraggedCardPosition] = useState({ x: 0, y: 0 });
    const [originalColumn, setOriginalColumn] = useState(null);
    const [isWin, setIsWin] = useState(false);

    useEffect(() => {
        const { columns, remainingDeck } = dealCards(deck);
        setColumns(columns); // Set the columns
        setDeck(remainingDeck); // Set the deck with the remaining cards
    }, []);

    // Check if a card can be placed in a foundation pile
    const isValidFoundationMove = (card, foundation) => {
        if (foundation.length === 0) {
            return card.value === 'A'; // Only an Ace can be placed in an empty foundation pile
        }
        const topCard = foundation[foundation.length - 1];
        return card.suit === topCard.suit && values.indexOf(card.value) === values.indexOf(topCard.value) + 1;
    };

    const handleFoundationDrop = (foundationIndex, e) => {
        console.log('handleFoundationDrop', foundationIndex);
        if (!draggedCard) return; // Prevent error when no card is being dragged
    
        const { cards, fromCol, startIndex, originalDeckIndex } = draggedCard;
        const card = cards[0]; // Only one card can be dropped in a foundation at a time
        let newColumns = [...columns];
        let newDeck = [...deck];
        let newFoundations = [...foundations];
        let moveWasValid = false;
    
        // Validate if the card can be placed in the foundation pile
        if (isValidFoundationMove(card, newFoundations[foundationIndex])) {
            moveWasValid = true;
            // Play both card and goodMove sounds for a successful foundation move
            soundEffects.play('card');
            soundEffects.play('goodMove');

            if (fromCol === 'deck') {
                // Remove the card from the deck array
                const cardIndex = newDeck.findIndex(deckCard => deckCard.suit === card.suit && deckCard.value === card.value);
                if (cardIndex !== -1) {
                    newDeck.splice(cardIndex, 1);
                    setDeck(newDeck);
                }
                // No need to adjust currentDeckIndex further
            } else {
                newColumns[fromCol] = newColumns[fromCol].slice(0, startIndex); // Remove the card from the column
                // Flip the next card in the column, if any remain
                if (newColumns[fromCol].length > 0) {
                    setTimeout(() => {
                        setColumns(prevColumns => {
                            const updatedColumns = [...prevColumns];
                            if(!updatedColumns[fromCol][updatedColumns[fromCol].length - 1]) {
                                soundEffects.play('card');
                            }
                            updatedColumns[fromCol][updatedColumns[fromCol].length - 1].faceUp = true;
                            return updatedColumns;
                        });
                    }, 333); // 1/3 second delay
                }
            }

            // Add the card to the foundation with the correct color
            const cardWithColor = {
                ...card,
                color: getSuitColor(card.suit)
            };
            newFoundations[foundationIndex] = [...newFoundations[foundationIndex], cardWithColor];
            setFoundations(newFoundations); // Update foundation piles
            setColumns(newColumns); // Update columns

            // Reset dragged card data
            setDraggedCard(null);
            setDraggedCardPosition({ x: 0, y: 0 });
            checkWinCondition();
        } else {
            // Move is invalid
            moveWasValid = false;
            soundEffects.play('card');
            soundEffects.play('badMove');
            if (fromCol === 'deck') {
                // Reset currentDeckIndex back to originalDeckIndex
                setCurrentDeckIndex(originalDeckIndex);
            }
            setDraggedCard(null);
            setDraggedCardPosition({ x: 0, y: 0 });
        }

        // Debugging Output
        console.log('foundation Updated State:', {
            deck: newDeck,
            columns: newColumns,
            currentDeckIndex,
        });

        return moveWasValid;
    };

    // Handle cycling through the deck
    const handleDeckClick = () => {
        soundEffects.play('card');
        setCurrentDeckIndex((prevIndex) => {
            if (prevIndex === deck.length - 1) {
                return -1;  // Set to -1 when reaching the end of the deck
            } else {
                return prevIndex + 1;  // Go to the next card in the deck
            }
        });
    };

    // Handle dragging the card from the deck
    const handleDeckTouchStart = (e) => {
        e.preventDefault();
        const card = deck[currentDeckIndex];

        // Store original deck index
        const originalDeckIndex = currentDeckIndex;

        // Adjust currentDeckIndex to show the previous card
        setCurrentDeckIndex((prevIndex) => {
            const newIndex = prevIndex - 1;
            if (newIndex < -1) {
                return -1;
            }
            return newIndex;
        });

        // Set the dragged card with originalDeckIndex
        setDraggedCard({ cards: [card], fromCol: 'deck', cardIndex: currentDeckIndex, originalDeckIndex });

        // Record the starting touch position for dragging
        setDraggedCardPosition({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        });
    };

    // Handle touch start (for selecting the card and all face-up cards below it)
    const handleTouchStart = (e, card, colIndex, cardIndex) => {
        console.log('Touch start', { card, colIndex, cardIndex });
        e.preventDefault();
        if (!card.faceUp) return; // Do not allow dragging of face-down cards

        // Play card sound when starting to drag
        soundEffects.play('card');

        // Get all face-up cards below the selected card
        const cardsToDrag = columns[colIndex].slice(cardIndex);

        // Set dragged cards as an array and track their original column and index
        setDraggedCard({ cards: cardsToDrag, fromCol: colIndex, startIndex: cardIndex });
        setOriginalColumn(colIndex);

        // Set initial touch position
        setDraggedCardPosition({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        });

        // Hide the dragged cards in their original column
        cardsToDrag.forEach((_, idx) => {
            const cardElement = document.querySelector(`[data-card-index="${cardIndex + idx}"][data-col-index="${colIndex}"]`);
            if (cardElement) {
                cardElement.classList.add('hidden-card');
            }
        });
    };

    // Handle touch move
    const handleTouchMove = (e) => {
        //console.log('Touch move', e.touches[0].clientX, e.touches[0].clientY);
        //e.preventDefault();
        setDraggedCardPosition({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        });
    };

    // Handle touch end (drop)
    const handleTouchEnd = (e) => {
        e.preventDefault();
        if (!draggedCard) return;

        const { x, y } = draggedCardPosition;
        console.log('Touch end position:', x, y);

        // Function to check if coordinates are within foundation drop zones
        const isInFoundationZone = (x, y) => {
            const foundations = document.querySelectorAll('.foundation-pile');
            for (let i = 0; i < foundations.length; i++) {
                const foundation = foundations[i];
                const rect = foundation.getBoundingClientRect();
                
                // Extend the drop zone below the foundation pile
                const extendedZone = {
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    // Extend bottom by 100px or adjust as needed
                    bottom: rect.bottom + 100
                };

                if (x >= extendedZone.left && 
                    x <= extendedZone.right && 
                    y >= extendedZone.top && 
                    y <= extendedZone.bottom) {
                    return i; // Return foundation index
                }
            }
            return -1;
        };

        // Function to get the drop target, searching upwards if necessary
        const getDropTarget = (x, y) => {
            let element = document.elementFromPoint(x, y);
            console.log('Initial element:', element);

            // If the element is part of the dragged stack, search upwards
            while (element && element.classList.contains('card-face') && !element.closest('.card-column')) {
                y -= 20;
                element = document.elementFromPoint(x, y);
                console.log('Searching upwards, new element:', element);
            }

            return element;
        };

        const dropTarget = getDropTarget(x, y);
        console.log('Final drop target:', dropTarget);

        // Check for foundation zones first
        const foundationZoneIndex = isInFoundationZone(x, y);
        const dropColIndex = dropTarget?.closest('.card-column')?.dataset?.colIndex;

        if (foundationZoneIndex !== -1) {
            handleFoundationDrop(foundationZoneIndex, e);
        } else if (dropColIndex !== undefined && dropColIndex !== originalColumn) {
            handleDrop(Number(dropColIndex));
        } else {
            // Move is invalid, reset currentDeckIndex if necessary
            if (draggedCard.fromCol === 'deck') {
                setCurrentDeckIndex(draggedCard.originalDeckIndex);
            }
            setDraggedCard(null);
            setDraggedCardPosition({ x: 0, y: 0 });
        }

        // Remove the 'hidden-card' class
        if (draggedCard.fromCol !== 'deck') {
            draggedCard.cards.forEach((_, idx) => {
                const hiddenCard = document.querySelector(
                    `[data-card-index="${draggedCard.startIndex + idx}"][data-col-index="${draggedCard.fromCol}"]`
                );
                if (hiddenCard) {
                    hiddenCard.classList.remove('hidden-card');
                }
            });
        }
    };

    const handleDrop = (dropColIndex) => {
        const { cards, fromCol, startIndex, originalDeckIndex } = draggedCard;
        let newColumns = [...columns];
        let newDeck = [...deck];
        let moveWasValid = false;
        console.log('handleDrop', dropColIndex, cards, newColumns[dropColIndex]);
        if (isValidMove(cards[0], newColumns[dropColIndex])) {
            moveWasValid = true;
            soundEffects.play('card');
            soundEffects.play('goodMove');
            if (fromCol === 'deck') {
                // Remove the card from the deck array
                const cardIndex = newDeck.findIndex(deckCard => deckCard.suit === cards[0].suit && deckCard.value === cards[0].value);
                if (cardIndex !== -1) {
                    newDeck.splice(cardIndex, 1);
                    setDeck(newDeck);
                }
                // No need to adjust currentDeckIndex further
            } else {
                // Remove the cards from the original column
                newColumns[fromCol] = newColumns[fromCol].slice(0, startIndex);

                // Flip the next card in the column if there are any cards left
                if (newColumns[fromCol].length > 0) {
                    setTimeout(() => {
                        setColumns(prevColumns => {
                            const updatedColumns = [...prevColumns];
                            updatedColumns[fromCol][updatedColumns[fromCol].length - 1].faceUp = true;
                            return updatedColumns;
                        });
                    }, 333);
                }
            }

            // Add the cards to the new column
            newColumns[dropColIndex] = [...newColumns[dropColIndex], ...cards];
            setColumns(newColumns);
            
            const cardValueElement = document.querySelector('.card-value.top-left');
            if (cardValueElement) {
                const height = cardValueElement.offsetHeight;
                const cardFaces = document.querySelectorAll('.card-face');
                cardFaces.forEach((cardFace, index) => {
                    cardFace.style.marginBottom = `${height+3}px`;
                });
            }
        } else {
            // Move is invalid
            moveWasValid = false;
            soundEffects.play('card');
            if (fromCol === 'deck') {
                // Reset currentDeckIndex back to originalDeckIndex
                setCurrentDeckIndex(originalDeckIndex);
            }
        }   

        // Reset dragged card and its position
        setDraggedCard(null);
        setDraggedCardPosition({ x: 0, y: 0 });

        // Debugging Output
        console.log('Updated State:', {
            deck: newDeck,
            columns: newColumns,
            currentDeckIndex,
        });

        return moveWasValid;
    };

    // Handle flipping of face-down cards
    const handleCardClick = (card, colIndex, cardIndex) => {
        if (!card.faceUp && cardIndex === columns[colIndex].length - 1) {
            let newColumns = [...columns];
            newColumns[colIndex][cardIndex].faceUp = true;
            setColumns(newColumns);
        }
    };

    // Check if the move is valid based on Solitaire rules
    const isValidMove = (card, targetCol) => {
        console.log('isValidMove', card, targetCol);
        if (targetCol.length === 0) return card.value === 'K'; // Only Kings can be moved to an empty column
        const topCard = targetCol[targetCol.length - 1];
        const cardColor = getSuitColor(card.suit);
        const topCardColor = getSuitColor(topCard.suit);
        return cardColor !== topCardColor && values.indexOf(card.value) === values.indexOf(topCard.value) - 1;
    };

    const checkWinCondition = () => {
        const totalCards = foundations.reduce((sum, foundation) => sum + foundation.length, 0);
        const isWon = totalCards >= 51;   // update count is 1 off..
        console.log("Checking win condition:", isWon);
        console.log("Foundations:", foundations);
        console.log("Total cards in foundations:", totalCards);
        if (isWon) {
            console.log("Game won!");
            setIsWin(true);
            soundEffects.play('gameWon');
        }
    };

    return (
        <div className="solitaire-container">
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
        </div>
    );
};

export default Solitaire;
