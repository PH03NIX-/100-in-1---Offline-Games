import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import './SpiderSolitaire.css';

// Card suits and values
const suits = ['spades', 'hearts', 'clubs', 'diamonds'];
const values = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'];

// Define difficulty levels
const DIFFICULTY_LEVELS = {
    easy: ['spades'],
    medium: ['spades', 'hearts'],
    hard: ['spades', 'hearts', 'clubs', 'diamonds'],
};

// Function to create a deck based on difficulty
const createDeck = (difficulty = 'easy') => {
    let deck = [];
    const selectedSuits = DIFFICULTY_LEVELS[difficulty];
    const totalCardsNeeded = 104; // Spider Solitaire uses 104 cards
    const numSuits = selectedSuits.length;
    const numCopies = totalCardsNeeded / (numSuits * 13); // Number of copies per card

    for (let i = 0; i < numCopies; i++) {
        for (let suit of selectedSuits) {
            for (let value of values) {
                deck.push({ suit, value, faceUp: false }); // Initially, all cards are face-down
            }
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
        return values.indexOf(b.value) - values.indexOf(a.value);
    });

    // Create sequences of King to Ace for each suit
    const sequences = [];
    for (let i = 0; i < deck.length; i += 13) {
        sequences.push(deck.slice(i, i + 13));
    }

    // Distribute sequences across columns
    const columns = Array(10).fill().map(() => []);
    let sequenceIndex = 0;
    for (let i = 0; i < 5; i++) { // 5 full sequences distributed
        for (let j = 0; j < 10; j++) { // across 10 columns
            if (sequences[sequenceIndex]) {
                columns[j].push(sequences[sequenceIndex].pop());
            }
            if (sequences[sequenceIndex].length === 0) {
                sequenceIndex++;
            }
        }
    }

    // Flatten the columns back into a single array
    const arrangedDeck = columns.flat();

    // Add any remaining cards to the end (these will be in the stock)
    while (sequenceIndex < sequences.length) {
        arrangedDeck.push(...sequences[sequenceIndex]);
        sequenceIndex++;
    }

    return arrangedDeck;
};

// Deal cards into columns and return the remaining deck
const dealCards = (deck) => {
    const columns = [[], [], [], [], [], [], [], [], [], []]; // Ten columns
    let index = 0;

    // The first four columns get six cards each
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 6; j++) {
            const card = { ...deck[index], faceUp: j === 5 }; // Only the last card is face-up
            columns[i].push(card);
            index++;
        }
    }

    // The remaining six columns get five cards each
    for (let i = 4; i < 10; i++) {
        for (let j = 0; j < 5; j++) {
            const card = { ...deck[index], faceUp: j === 4 }; // Only the last card is face-up
            columns[i].push(card);
            index++;
        }
    }

    // Return the columns and the remaining deck as the stock
    return { columns, stock: deck.slice(index) };
};

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

const getSuitColor = (suit) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
};

// Function to get numerical value of card ranks
const getCardValue = (value) => {
    switch (value) {
        case 'A':
            return 1;
        case '2':
            return 2;
        case '3':
            return 3;
        case '4':
            return 4;
        case '5':
            return 5;
        case '6':
            return 6;
        case '7':
            return 7;
        case '8':
            return 8;
        case '9':
            return 9;
        case '10':
            return 10;
        case 'J':
            return 11;
        case 'Q':
            return 12;
        case 'K':
            return 13;
        default:
            return 0;
    }
};

const SpiderSolitaire = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
    const [deck, setDeck] = useState([]);
    const [stock, setStock] = useState([]);
    const [columns, setColumns] = useState([]);
    const [draggedCard, setDraggedCard] = useState(null);
    const [draggedCardPosition, setDraggedCardPosition] = useState({ x: 0, y: 0 });
    const [originalColumn, setOriginalColumn] = useState(null);
    const [isWin, setIsWin] = useState(false);
    const [completedSequences, setCompletedSequences] = useState(Array(8).fill(null));
    const [message, setMessage] = useState('');



    useEffect(() => {
        const newDeck = shuffleDeck(createDeck('easy')); // Change difficulty here
        const { columns, stock } = dealCards(newDeck);
        setColumns(columns);
        setStock(stock);
        setDeck(newDeck);
        console.log('completedSequences', completedSequences);
    }, []);

    // Handle dealing from the stock
    const dealFromStock = () => {
        if (stock.length < 10) return; // Not enough cards to deal

        // Play card sound 10 times with 20ms delay
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                soundEffects.play('card');
            }, i * 50);
        }

        let newColumns = [...columns];
        for (let i = 0; i < 10; i++) {
            const card = { ...stock[0], faceUp: true }; // Cards dealt from stock are face-up
            newColumns[i].push(card);
            stock.shift();
        }

        // Update the columns and stock state
        setColumns(newColumns);
        setStock([...stock]);

        // Check for completed sequences in each column using the updated columns
        for (let i = 0; i < 10; i++) {
            checkForCompletedSequence(i, newColumns);
        }
    };

    // Handle touch start (for selecting the card and all face-up cards below it)
    const handleTouchStart = (e, card, colIndex, cardIndex) => {
        e.preventDefault();
        if (!card.faceUp) return; // Do not allow dragging of face-down cards

        soundEffects.play('card'); // Play card sound when starting to drag

        // Get all cards from this card down
        const cardsToDrag = columns[colIndex].slice(cardIndex);
    
        // Ensure the sequence being moved is in order and same suit
        const movingSequenceIsValid = cardsToDrag.every((card, idx, arr) => {
            if (idx === 0) return true;
            const prevCard = arr[idx - 1];
            return (
                getCardValue(prevCard.value) === getCardValue(card.value) + 1 &&
                prevCard.suit === card.suit
            );
        });
    
        if (!movingSequenceIsValid) {
            setMessage("Can't move selected cards; they aren't in sequential order.");
        }
    
        // Clear any existing message
        //setMessage('');
    
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
            const cardElement = document.querySelector(
                `[data-card-index="${cardIndex + idx}"][data-col-index="${colIndex}"]`
            );
            if (cardElement) {
                cardElement.classList.add('hidden-card');
            }
        });
    };


    // Handle touch move
    const handleTouchMove = (e) => {
        e.preventDefault();
        setDraggedCardPosition({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        });
    };

    // Handle touch end (drop)
    const handleTouchEnd = (e) => {
        e.preventDefault();
        if (!draggedCard) return;
    
        // Clear any existing message
        setMessage('');

        const { x, y } = draggedCardPosition;

        // Function to get the drop target
        const getDropTarget = (x, y) => {
            let element = document.elementFromPoint(x, y);
            while (element && element.classList.contains('card-face') && !element.closest('.card-column')) {
                y -= 20; // Move up by 20 pixels (adjust based on your card stacking)
                element = document.elementFromPoint(x, y);
            }
            return element;
        };

        const dropTarget = getDropTarget(x, y);

        const dropColIndex = dropTarget?.closest('.card-column')?.dataset?.colIndex;

        if (dropColIndex !== undefined) {
            handleDrop(Number(dropColIndex));
        } else {
            // Move is invalid, reset dragged card
            setDraggedCard(null);
            setDraggedCardPosition({ x: 0, y: 0 });
        }

        // Remove the 'hidden-card' class
        draggedCard.cards.forEach((_, idx) => {
            const hiddenCard = document.querySelector(
                `[data-card-index="${draggedCard.startIndex + idx}"][data-col-index="${draggedCard.fromCol}"]`
            );
            if (hiddenCard) {
                hiddenCard.classList.remove('hidden-card');
            }
        });
    };

    const handleDrop = (dropColIndex) => {
        const { cards, fromCol, startIndex } = draggedCard;
        let newColumns = [...columns];

        if (isValidMove(cards, newColumns[dropColIndex])) {
            soundEffects.play('card');
            soundEffects.play('goodMove');

            // Remove the cards from the original column
            newColumns[fromCol] = newColumns[fromCol].slice(0, startIndex);

            // Add the cards to the new column
            newColumns[dropColIndex] = [...newColumns[dropColIndex], ...cards];

            // Update the columns state
            setColumns(newColumns);

            // Flip the next card in the column if there are any cards left
            if (newColumns[fromCol].length > 0) {
                setTimeout(() => {
                    setColumns((prevColumns) => {
                        soundEffects.play('card');
                        const updatedColumns = [...prevColumns];
                        if(!updatedColumns[fromCol][updatedColumns[fromCol].length - 1]) {
                            soundEffects.play('card');
                        }
                        updatedColumns[fromCol][
                            updatedColumns[fromCol].length - 1
                        ].faceUp = true;
                        return updatedColumns;
                    });
                }, 333);
            }

            // Check for completed sequences using the updated columns
            checkForCompletedSequence(dropColIndex, newColumns);

            // Check for win condition
            //checkWinCondition();
        } else {
            // Move is invalid
            soundEffects.play('card');
            // Optionally, provide feedback to the player
        }

        // Reset dragged card and its position
        setDraggedCard(null);
        setDraggedCardPosition({ x: 0, y: 0 });
    };

    // Check if the move is valid based on Spider Solitaire rules
    const isValidMove = (cardsToMove, targetCol) => {
        if (cardsToMove.length === 0) return false;

        const movingCard = cardsToMove[0];

        // Ensure the sequence being moved is in order and same suit
        const movingSequenceIsValid = cardsToMove.every((card, idx, arr) => {
            if (idx === 0) return true;
            const prevCard = arr[idx - 1];
            return (
                getCardValue(prevCard.value) === getCardValue(card.value) + 1 &&
                prevCard.suit === card.suit
            );
        });

        if (!movingSequenceIsValid) return false;

        if (targetCol.length === 0) {
            return true; // Can move any card or sequence to an empty column
        } else {
            const topCard = targetCol[targetCol.length - 1];
            return (
                getCardValue(topCard.value) === getCardValue(movingCard.value) + 1
            );
        }
    };

    // Check for completed sequences in a column
    const checkForCompletedSequence = (colIndex, columnsParam) => {
        let column = columnsParam[colIndex];
        let sequenceFound = true;
    
        while (sequenceFound && column.length >= 13) {
            const last13Cards = column.slice(-13);
            const isCompleteSequence = last13Cards.every((card, idx) => {
                if (idx === 0) return true;
                const prevCard = last13Cards[idx - 1];
                return (
                    getCardValue(prevCard.value) === getCardValue(card.value) + 1 &&
                    prevCard.suit === card.suit
                );
            });
    
            if (isCompleteSequence) {
                // Remove the sequence
                column = column.slice(0, column.length - 13);
                columnsParam[colIndex] = column;
    
                // Add the sequence to completedSequences
                setCompletedSequences(prev => {
                    const newCompleted = [...prev];
                    const emptyIndex = newCompleted.findIndex(seq => seq === null);
                    if (emptyIndex !== -1) {
                        newCompleted[emptyIndex] = last13Cards;
                    }
                    return newCompleted;
                });
                
    
                // Flip the next card in the column if it's face-down
                if (column.length > 0 && !column[column.length - 1].faceUp) {
                    column[column.length - 1].faceUp = true;
                    columnsParam[colIndex] = column;
                }
    
                // Update columns state
                setColumns([...columnsParam]);
    
                // Check for win condition
                checkWinCondition();
            } else {
                sequenceFound = false;
            }
        }
    };
    

    const checkWinCondition = () => {
        const totalCards = completedSequences.reduce((sum, sequence) => sum + (sequence ? sequence.length : 0), 0);
        const isWon = totalCards >= 91; // Spider Solitaire uses 2 decks, so 104 cards total
        console.log("Checking win condition:", isWon);
        console.log("Completed sequences:", completedSequences);
        console.log("Total cards in completed sequences:", totalCards);
        if (isWon) {
            console.log("Game won!");
            setIsWin(true);
            soundEffects.play('gameWon'); // Play gameWon sound when the game is won
        }
    };
    
    return (
        <div className="spider-solitaire-container">
            {isWin && (
                <>
                    <Confetti />
                    <div className="win-message">YOU WIN!</div>
                </>
            )}
            {/* Message Area */}
            <div className="message-area">
                {message && <div className="message">{message}</div>}
            </div>
            <div className="completed-sequences">
                {completedSequences.map((sequence, index) => (
                    <div key={index} className={`completed-sequence ${sequence ? '' : 'empty'}`}>
                        {sequence && (
                            <div className="card-face completed-card" style={{ color: getSuitColor(sequence[0].suit) }}>
                                <div className="card-value top-left">
                                    {sequence[0].value}{getSuitSymbol(sequence[0].suit)}
                                </div>
                                <div className="card-value bottom-right">
                                    {sequence[0].value}{getSuitSymbol(sequence[0].suit)}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className={`game-board ${isWin ? 'win' : ''}`}>
                <div className="stock" onClick={dealFromStock}>
                    {Array.from({ length: Math.ceil(stock.length / 10) }, (_, index) => (
                        <div 
                            key={index} 
                            className="card-back"
                            style={{
                                position: 'absolute',
                                left: `${index *8}px`,  // 2px offset to the right for each div
                                top: `${index * 0 + 44}px`,   // 1px offset downwards for each div
                                zIndex: index,           // Ensures proper stacking order
                            }}
                        ></div>
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
                        left: `${draggedCardPosition.x - 18}px`,
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
                                width: 'calc(100vw / 10 - 25px)',
                                height: 'calc((100vw / 10 - 25px) * 1.4)',
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


export default SpiderSolitaire;
