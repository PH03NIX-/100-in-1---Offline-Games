import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import './Freecell.css';

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
    return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
};

// Create deck of cards
const createDeck = () => {
    let deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value, faceUp: true }); // All cards are face-up
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
            return suits.indexOf(a.suit) - suits.indexOf(b.suit);
        }
        return values.indexOf(a.value) - values.indexOf(b.value);
    });

    // Reverse the order within each suit to have Kings on top
    const sortedDeck = [];
    for (let i = 0; i < suits.length; i++) {
        const suitCards = deck.slice(i * 13, (i + 1) * 13).reverse();
        sortedDeck.push(...suitCards);
    }

    // Interleave the suits to distribute them across columns
    const finalDeck = [];
    for (let i = 0; i < 13; i++) {
        for (let j = 0; j < 4; j++) {
            finalDeck.push(sortedDeck[j * 13 + i]);
        }
    }

    return finalDeck;
};

// Deal cards into columns
const dealCards = (deck) => {
    const columns = [[], [], [], [], [], [], [], []]; // Eight columns
    let index = 0;

    // First four columns get 7 cards each
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 7; j++) {
            const card = { ...deck[index], faceUp: true }; // All cards are face-up
            columns[i].push(card);
            index++;
        }
    }

    // Last four columns get 6 cards each
    for (let i = 4; i < 8; i++) {
        for (let j = 0; j < 6; j++) {
            const card = { ...deck[index], faceUp: true };
            columns[i].push(card);
            index++;
        }
    }

    // Return the columns
    return { columns, remainingDeck: deck.slice(index) };
};

const Freecell = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
    const [deck, setDeck] = useState(shuffleDeck(createDeck()));
    const [columns, setColumns] = useState([[], [], [], [], [], [], [], []]);
    const [foundations, setFoundations] = useState([[], [], [], []]); // Four foundations for suits
    const [freeCells, setFreeCells] = useState([null, null, null, null]); // Four free cells
    const [draggedCard, setDraggedCard] = useState(null);
    const [draggedCardPosition, setDraggedCardPosition] = useState({ x: 0, y: 0 });
    const [originalColumn, setOriginalColumn] = useState(null);
    const [isWin, setIsWin] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const { columns } = dealCards(deck);
        setColumns(columns); // Set the columns
    }, []);

    // Check if a card can be placed in a foundation pile
    const isValidFoundationMove = (card, foundation) => {
        if (foundation.length === 0) {
            return card.value === 'A'; // Only an Ace can be placed in an empty foundation pile
        }
        const topCard = foundation[foundation.length - 1];
        return (
            card.suit === topCard.suit &&
            values.indexOf(card.value) === values.indexOf(topCard.value) + 1
        );
    };

    // Handle moving card to foundation
    const handleFoundationDrop = (foundationIndex, e) => {
        if (!draggedCard) return;

        const { cards, fromCol, startIndex, freeCellIndex } = draggedCard;
        const card = cards[0]; // Only one card can be dropped in a foundation at a time
        let newColumns = [...columns];
        let newFoundations = [...foundations];
        let newFreeCells = [...freeCells];

        // Validate if the card can be placed in the foundation pile
        if (isValidFoundationMove(card, newFoundations[foundationIndex])) {
            soundEffects.play('card');
            soundEffects.play('goodMove');
            if (fromCol === 'freeCell') {
                newFreeCells[freeCellIndex] = null;
                setFreeCells(newFreeCells);
            } else {
                newColumns[fromCol] = newColumns[fromCol].slice(0, startIndex);
            }

            // Add the card to the foundation
            const cardWithColor = {
                ...card,
                color: getSuitColor(card.suit),
            };
            newFoundations[foundationIndex] = [...newFoundations[foundationIndex], cardWithColor];
            setFoundations(newFoundations);
            setColumns(newColumns);
            checkWinCondition();
        } else {
            soundEffects.play('card'); // Play card sound for invalid move
        }

        // Reset dragged card data
        setDraggedCard(null);
        setDraggedCardPosition({ x: 0, y: 0 });
    };

    // Handle touch start on tableau columns
    const handleTouchStart = (e, card, colIndex, cardIndex) => {
        e.preventDefault();
        // Play card sound when starting to drag
        soundEffects.play('card');
    
        // Get all cards from this card down
        const cardsToDrag = columns[colIndex].slice(cardIndex);
    
        // Ensure the sequence being moved is valid
        const isSequenceValid = checkIfSequenceIsValid(cardsToDrag);
    
        if (!isSequenceValid) {
            // Optionally, provide feedback to the player
            setMessage("Can't move selected cards; they aren't in valid sequence.");
            return;
        }
    
        // Check if there are enough free cells and empty columns to move the sequence
        const maxMovableCards = calculateMaxMovableCards();
        if (cardsToDrag.length > maxMovableCards) {
            setMessage(`Can't move that many cards. Max cards you can move: ${maxMovableCards}`);
            return;
        }
    
        // Clear any existing message
        setMessage('');
    
        setDraggedCard({ cards: cardsToDrag, fromCol: colIndex, startIndex: cardIndex });
        setOriginalColumn(colIndex);
    
        // Set initial touch position
        setDraggedCardPosition({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        });
    
        // Hide the dragged cards in their original column
        cardsToDrag.forEach((_, idx) => {
            const cardElement = document.querySelector(
                `[data-card-index="${cardIndex + idx}"][data-col-index="${colIndex}"]`
            );
            if (cardElement) {
                cardElement.classList.add('hidden-card');
            }
        });
    };

    const checkIfSequenceIsValid = (cards) => {
        if (cards.length === 0) return false;

        for (let i = 0; i < cards.length - 1; i++) {
            const currentCard = cards[i];
            const nextCard = cards[i + 1];
            const currentColor = getSuitColor(currentCard.suit);
            const nextColor = getSuitColor(nextCard.suit);

            if (
                values.indexOf(currentCard.value) !== values.indexOf(nextCard.value) + 1 ||
                currentColor === nextColor
            ) {
                return false;
            }
        }
        return true;
    };

    const calculateMaxMovableCards = () => {
        const emptyFreeCells = freeCells.filter(cell => cell === null).length;
        const emptyColumns = columns.filter(col => col.length === 0).length;
        const maxMovable = (emptyFreeCells + 1) * Math.pow(2, emptyColumns);
        return maxMovable;
    };
    

    

    // Update handleFreeCellTouchStart to set originalColumn
    const handleFreeCellTouchStart = (e, card, freeCellIndex) => {
        e.preventDefault();
        soundEffects.play('card');
        setDraggedCard({ cards: [card], fromCol: 'freeCell', freeCellIndex });
        setOriginalColumn('freeCell');
        setDraggedCardPosition({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        });

        // Instead of hiding the card, we'll remove it from the freeCells array
        let newFreeCells = [...freeCells];
        newFreeCells[freeCellIndex] = null;
        setFreeCells(newFreeCells);
    };

    // Handle touch move
    const handleTouchMove = (e) => {
        setDraggedCardPosition({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        });
    };

    // Handle touch end (drop)
    // Handle touch end (drop)
const handleTouchEnd = (e) => {
    e.preventDefault();
    if (!draggedCard) return;

    const { x, y } = draggedCardPosition;

    // Function to get the drop target
    const getDropTarget = (x, y) => {
        let element = document.elementFromPoint(x, y);
        while (
            element &&
            element.classList.contains('card-face') &&
            !element.closest('.card-column') &&
            !element.closest('.freecell-slot') &&
            !element.closest('.foundation-pile')
        ) {
            y -= 20; // Move up by 20 pixels
            element = document.elementFromPoint(x, y);
        }
        return element;
    };

    const dropTarget = getDropTarget(x, y);

    const foundationIndex = dropTarget?.closest('.foundation-pile')?.dataset?.foundationIndex;
    const freeCellIndex = dropTarget?.closest('.freecell-slot')?.dataset?.freecellIndex;
    const dropColIndex = dropTarget?.closest('.card-column')?.dataset?.colIndex;

    if (foundationIndex !== undefined) {
        handleFoundationDrop(Number(foundationIndex), e);
    } else if (freeCellIndex !== undefined) {
        handleFreeCellDrop(Number(freeCellIndex), e);
    } else if (dropColIndex !== undefined && dropColIndex !== originalColumn) {
        handleDrop(Number(dropColIndex));
    } else {
        // Move is invalid, reset dragged card
        setDraggedCard(null);
        setDraggedCardPosition({ x: 0, y: 0 });
    }

    // Remove the 'hidden-card' class
    if (draggedCard.fromCol === 'freeCell') {
        const hiddenCard = document.querySelector(
            `[data-freecell-index="${draggedCard.freeCellIndex}"]`
        );
        if (hiddenCard) {
            hiddenCard.classList.remove('hidden-card');
        }
    } else {
        // Unhide all the dragged cards
        draggedCard.cards.forEach((_, idx) => {
            const cardElement = document.querySelector(
                `[data-card-index="${draggedCard.startIndex + idx}"][data-col-index="${draggedCard.fromCol}"]`
            );
            if (cardElement) {
                cardElement.classList.remove('hidden-card');
            }
        });
    }
};


    const handleDrop = (dropColIndex) => {
        const { cards, fromCol, startIndex, freeCellIndex } = draggedCard;
        let newColumns = [...columns];
        let moveWasValid = false;
    
        if (isValidMove(cards, newColumns[dropColIndex])) {
            moveWasValid = true;
            soundEffects.play('card');
            soundEffects.play('goodMove');
            if (fromCol === 'freeCell') {
                let newFreeCells = [...freeCells];
                newFreeCells[freeCellIndex] = null;
                setFreeCells(newFreeCells);
            } else {
                // Remove the cards from the original column
                newColumns[fromCol] = newColumns[fromCol].slice(0, startIndex);
            }
    
            // Add the cards to the new column
            newColumns[dropColIndex] = [...newColumns[dropColIndex], ...cards];
            setColumns(newColumns);
        } else {
            soundEffects.play('card'); // Play card sound for invalid move
            setMessage("Invalid move.");
        }
    
        // Reset dragged card and its position
        setDraggedCard(null);
        setDraggedCardPosition({ x: 0, y: 0 });
    };
    

    const handleFreeCellDrop = (freeCellIndex, e) => {
        if (!draggedCard) return;

        const { cards, fromCol, startIndex } = draggedCard;
        const card = cards[0]; // Only one card can be moved to a free cell

        if (freeCells[freeCellIndex] === null) {
            soundEffects.play('card');
            soundEffects.play('goodMove');
            let newColumns = [...columns];
            let newFreeCells = [...freeCells];

            if (fromCol === 'freeCell') {
                // Cannot move from one free cell to another
                soundEffects.play('card'); // Play card sound for invalid move
                return;
            } else {
                newColumns[fromCol] = newColumns[fromCol].slice(0, startIndex);
            }

            // Place the card in the free cell
            newFreeCells[freeCellIndex] = card;
            setFreeCells(newFreeCells);
            setColumns(newColumns);
        } else {
            soundEffects.play('card'); // Play card sound for invalid move
        }

        // Reset dragged card
        setDraggedCard(null);
        setDraggedCardPosition({ x: 0, y: 0 });
    };

    // Check if the move is valid based on Freecell rules
    const isValidMove = (cardsToMove, targetCol) => {
        if (cardsToMove.length === 0) return false;
    
        const movingCard = cardsToMove[0];
    
        if (targetCol.length === 0) {
            return true; // Any sequence can be moved to an empty column
        } else {
            const topCard = targetCol[targetCol.length - 1];
            const movingCardColor = getSuitColor(movingCard.suit);
            const topCardColor = getSuitColor(topCard.suit);
    
            return (
                movingCardColor !== topCardColor &&
                values.indexOf(movingCard.value) === values.indexOf(topCard.value) - 1
            );
        }
    };
    

    const checkWinCondition = () => {
        const totalCards = foundations.reduce((sum, foundation) => sum + foundation.length, 0);
        const isWon = totalCards >= 51; // Freecell uses a single 52-card deck (function on a delay)
        console.log("Checking win condition:", isWon);
        console.log("Foundations:", foundations);
        console.log("Total cards in foundations:", totalCards);
        if (isWon) {
            console.log("Game won!");
            soundEffects.play('gameWon');
            setIsWin(true);
        }
    };

    return (
        <div className="freecell-solitaire-container">
            {isWin && (
                <>
                    <Confetti />
                    <div className="win-message">YOU WIN!</div>
                </>
            )}
            {/* Message Area */}
            {/*<div className="message-area">
                {message && <div className="message">{message}</div>}
            </div>*/}
            <div
                className={`game-board ${isWin ? 'win' : ''}`}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Free Cells and Foundations */}
                <div className="top-section">
                    <div className="freecells">
                        {freeCells.map((card, index) => (
                            <div
                                key={index}
                                className="freecell-slot"
                                data-freecell-index={index}
                            >
                                {card ? (
                                    <div
                                        className="card-face"
                                        data-freecell-index={index}
                                        onTouchStart={(e) => handleFreeCellTouchStart(e, card, index)}
                                        style={{ color: getSuitColor(card.suit) }}
                                    >
                                        <div className="card-value top-left">
                                            {card.value}
                                            {getSuitSymbol(card.suit)}
                                        </div>
                                        <div className="card-value bottom-right">
                                            {card.value}
                                            {getSuitSymbol(card.suit)}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="freecell-slot-empty">free</div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="foundations">
                        {foundations.map((foundation, index) => (
                            <div
                                key={index}
                                className="foundation-pile"
                                data-foundation-index={index}
                            >
                                {foundation.length > 0 && (
                                    <div
                                        className="foundation-card"
                                        style={{ color: getSuitColor(foundation[foundation.length - 1].suit) }}
                                    >
                                        <div className="card-value top-left">
                                            {foundation[foundation.length - 1].value}
                                            {getSuitSymbol(foundation[foundation.length - 1].suit)}
                                        </div>
                                        <div className="card-value bottom-right">
                                            {foundation[foundation.length - 1].value}
                                            {getSuitSymbol(foundation[foundation.length - 1].suit)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tableau Columns */}
                <div className="card-columns">
                    {columns.map((col, colIndex) => (
                        <div
                            key={colIndex}
                            className={`card-column ${isWin ? 'winningBoard' : ''}`}
                            data-col-index={colIndex}
                        >
                            {col.map((card, cardIndex) => (
                                <div
                                    key={cardIndex}
                                    className="card-face"
                                    data-card-index={cardIndex}
                                    data-col-index={colIndex}
                                    onTouchStart={(e) => handleTouchStart(e, card, colIndex, cardIndex)}
                                    style={{ color: getSuitColor(card.suit) }}
                                >
                                    <div className="card-value top-left">
                                        {card.value}
                                        {getSuitSymbol(card.suit)}
                                    </div>
                                    <div className="card-value bottom-right">
                                        {card.value}
                                        {getSuitSymbol(card.suit)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Dragged card rendering */}
            {draggedCard && (
                <div
                    id="dragged-card"
                    style={{
                        position: 'absolute',
                        left: `${draggedCardPosition.x - 30}px`,
                        top: `${draggedCardPosition.y - 80}px`,
                        zIndex: 1000,
                        pointerEvents: 'none',
                    }}
                >
                    {draggedCard.cards.map((card, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: 'white',
                                border: '1px solid #000',
                                width: 'calc(100vw / 8 - 25px)',
                                height: 'calc((100vw / 8 - 25px) * 1.4)',
                                position: 'absolute',
                                top: `${index * 20}px`,
                                left: 0,
                                zIndex: 1000 - index,
                                padding: '10px',
                                borderRadius: '5px',
                                color: getSuitColor(card.suit),
                            }}
                        >
                            <div className="card-value top-left">
                                {card.value}
                                {getSuitSymbol(card.suit)}
                            </div>
                            <div className="card-value bottom-right">
                                {card.value}
                                {getSuitSymbol(card.suit)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Freecell;
