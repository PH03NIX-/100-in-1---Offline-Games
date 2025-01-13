import React, { useState, useMemo, useEffect, useRef } from 'react';
import './MainMenu.css';
import solitaireImage from '../game-images/solitaire.png';
import spiderSolitaireImage from '../game-images/spider-solitaire.png';
import freecellImage from '../game-images/freecell-solitaire.png';
import bejeweledImage from '../game-images/bejeweled.png';
import numberMergeImage from '../game-images/number-merge.png';
import sudokuImage from '../game-images/sudoku.png';
import cardMatchImage from '../game-images/card-match.png';
import patternRepeatImage from '../game-images/pattern-repeat.png';
import bubbleShooterImage from '../game-images/bubble-shooter.png';
import triviaImage from '../game-images/trivia.png';
import checkersImage from '../game-images/checkers.png';
import chessImage from '../game-images/chess.png';
import ticTacToeImage from '../game-images/tic-tac-toe.png';
import hangmanImage from '../game-images/hangman.png';
import snakeImage from '../game-images/snake.png';
import platformRunnerImage from '../game-images/platform-runner.png';
import pongImage from '../game-images/pong.png';
import flappyBirdImage from '../game-images/flappy-bird.png';
import breakoutImage from '../game-images/breakout.png';
import asteroidsImage from '../game-images/asteroids.png';
import wordleImage from '../game-images/wordle.png';
import patternMatchImage from '../game-images/pattern-match.png';
import gridLockedImage from '../game-images/grid-locked.png';
//import minesweeperImage from '../game-images/minesweeper.png';
import blockPuzzleImage from '../game-images/blocks.png';
import minesweeperImage from '../game-images/minesweeper.png';
import letterScrambleImage from '../game-images/letter-scramble.png';
import rapidFireImage from '../game-images/rapid-fire.png';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const initialGamesList = [
    { devStatus: 'a', id: 'bejeweled', name: 'Bejeweled', img: bejeweledImage, description: 'Match colorful gems in this addictive puzzle game. Create special gems for powerful effects and aim for high scores!', instructions: 'Swap adjacent gems to create matches of 3 or more. Match 4 gems to create bombs, 5 in a line for missiles. Clear the board, fill the progress bar, and advance through levels for bonus points.', genre: 'Puzzle', timesPlayed: 0 },
    { devStatus: 'a', id: 'bubbleShooter', name: 'Bubble Shooter', img: bubbleShooterImage, description: 'Shoot colorful bubbles to match and pop groups of three or more. Clear the board and watch out for special power-ups!', instructions: 'Aim and shoot bubbles to match colors. Create groups of 3+ to pop them. Use row bombs for massive clearance. Clear the board to advance levels.', genre: 'Puzzle', timesPlayed: 0 },
    { devStatus: 'a', id: 'platformRunner', name: 'Platform Runner', img: platformRunnerImage, description: 'Run and jump across moving platforms while avoiding obstacles. How far can you go before falling off?', instructions: 'Tap to jump between platforms. Avoid obstacles and stay on screen. The game speeds up over time. Collect points and try to beat your high score!', genre: 'Arcade', timesPlayed: 0 },
    { devStatus: 'a', id: 'snake', name: 'Snake', img: snakeImage, description: 'Guide the snake to eat food and grow without hitting walls or itself.', instructions: 'Swipe up, down, left, or right to control the snake. Eat food to grow longer.', genre: 'Arcade', timesPlayed: 0 },
    { devStatus: 'a', id: 'sudoku', name: 'Sudoku', img: sudokuImage, description: 'Fill the 9x9 grid with numbers so each row, column, and 3x3 box contains 1-9.', instructions: 'Tap on empty cells and enter numbers. Avoid repeats in rows, columns, and boxes.', genre: 'Puzzle', timesPlayed: 0 },
    { devStatus: 'a', id: '2048', name: 'Number Merge', img: numberMergeImage, description: 'Slide numbered tiles to combine them and reach 2048.', instructions: 'Swipe up, down, left, or right to slide tiles. Tiles with the same number merge when they touch.', genre: 'Puzzle', timesPlayed: 0 },
    { devStatus: 'a', id: 'asteroids', name: 'Asteroid Blaster', img: asteroidsImage, description: 'Pilot a spaceship and shoot asteroids while avoiding collisions.', instructions: 'Use on-screen buttons to rotate, thrust, and shoot. Destroy asteroids and avoid getting hit.', genre: 'Arcade', timesPlayed: 0 },
    { devStatus: 'a', id: 'pong', name: 'Ping Pong', img: pongImage, description: 'Classic table tennis-themed arcade game.', instructions: 'Tap and drag to control paddle. Hit the ball past your opponent to score.', genre: 'Arcade', timesPlayed: 0 },
    { devStatus: 'a', id: 'flappyBird', name: 'Floppy Blob', img: flappyBirdImage, description: 'Tap to navigate the bird through the gaps in the pipes.', instructions: 'Tap repeatedly to keep the bird airborne. Avoid hitting obstacles.', genre: 'Arcade', timesPlayed: 0 },
    { devStatus: 'a', id: 'breakout', name: 'Brick Buster', img: breakoutImage, description: 'Break all the bricks by bouncing the ball off the paddle. Catch falling bricks for bonus or negative effects.', instructions: 'Swipe to move the paddle left or right. Break all bricks without losing the ball.', genre: 'Arcade', timesPlayed: 0 },
    { devStatus: 'a', id: 'memory', name: 'Card Match', img: cardMatchImage, description: 'Find matching pairs of cards.', instructions: 'Tap on cards to flip them. Remember positions to find matching pairs.', genre: 'Memory', timesPlayed: 0 },
    { devStatus: 'a', id: 'simon', name: 'Pattern Repeat', img: patternRepeatImage, description: 'Repeat the color sequence shown by the game.', instructions: 'Watch the sequence, then tap the colors in the same order. Remember longer sequences to progress.', genre: 'Memory', timesPlayed: 0 },
    { devStatus: 'a', id: 'trivia', name: 'Trivia', img: triviaImage, description: 'Answer trivia questions correctly to score points.', instructions: 'Select the correct answer from multiple choices. Test your knowledge across different categories.', genre: 'Quiz', timesPlayed: 0 },
    { devStatus: 'a', id: 'hangman', name: 'Hangman', img: hangmanImage, description: 'Guess the word before the hangman is complete.', instructions: 'Tap letters to guess the word. Avoid incorrect guesses to prevent losing.', genre: 'Word' },
    { devStatus: 'a', id: 'ticTacToe', name: 'Tic Tac Toe', img: ticTacToeImage, description: 'Classic X and O game. Get three in a row to win.', instructions: 'Tap on empty squares to place your mark. Alternate turns with the computer.', genre: 'Strategy', timesPlayed: 0 },
    { devStatus: 'a', id: 'checkers', name: 'Checkers', img: checkersImage, description: 'Strategy board game. Capture all opponent\'s pieces to win.', instructions: 'Tap on your piece, then click on a valid diagonal space to move. Jump over opponent\'s pieces to capture them.', genre: 'Strategy', timesPlayed: 0 },
    { devStatus: 'a', id: 'chess', name: 'Chess', img: chessImage, description: 'Classic chess game with a modern twist. Play against the computer or challenge a friend in two-player mode.', instructions: 'Select a piece to see possible moves. Tap to move. Capture opponent\'s pieces and protect your king. Choose between single-player against AI or two-player mode.', genre: 'Strategy', timesPlayed: 0 },
    {
        devStatus: 'a',
        id: 'solitaire',
        name: 'Classic Solitaire',
        img: solitaireImage,
        description: 'Classic card game. Arrange all cards in foundation piles to win.',
        instructions: 'Tap and drag cards to move them. Build descending sequences alternating in color in tableau.',
        genre: 'Card Game',
        timesPlayed: 0
    },      
    {
        devStatus: 'a',
        id: 'spiderSolitaire',
        name: 'Spider Solitaire',
        img: spiderSolitaireImage,
        description: 'Spider Solitaire is a card game where the goal is to build eight complete sequences of cards in descending order from King to Ace of the same suit.',
        instructions: 'Start with a layout of cards and move them to create descending sequences. You can move a card or sequence of cards if they form a proper order within the same suit. Complete sequences (King to Ace) are removed from the game. If stuck, deal more cards from the stockpile. The game ends when all eight sequences are completed.',
        genre: 'Card Game',
        timesPlayed: 0
    },      
    {
        devStatus: 'a',
        id: 'freecell',
        name: 'Freecell Solitaire',
        img: freecellImage,
        description: 'Freecell is a card game where every card is dealt face-up and you must move all the cards to foundation piles, ordered by suit, starting from Ace to King.',
        instructions: 'The tableau consists of eight columns, and the player can move one card at a time to build sequences in descending order, alternating colors. You can use the four Free Cells as temporary storage to hold cards. The goal is to move all the cards into the four foundation piles, building up from Ace to King. Every card is visible, so the game is a mix of strategy and careful planning.',
        genre: 'Card Game',
        timesPlayed: 0
    },      
    {
        devStatus: 'a',
        id: 'wordle',
        name: 'Word Guess',
        img: wordleImage,
        description: 'Guess the hidden word in six tries or fewer! Test your vocabulary and deduction skills with this classic word puzzle game.',
        instructions: 'Enter a 5-letter word as your guess. The game will give feedback on which letters are correct (green), in the word but in the wrong position (yellow), or not in the word at all (gray). Use the feedback to deduce the correct word within six guesses.',
        genre: 'Word',
        timesPlayed: 0
    },
    {
        devStatus: 'a',
        id: 'patternMatch',
        name: 'Pattern Match',
        img: patternMatchImage,
        description: 'Challenge your memory and sequencing skills in this fun card game! Memorize the order of the cards, then replicate the sequence to win.',
        instructions: "You will be shown a set of cards for 3 seconds before they are flipped face-down. Then, you'll be given the same cards in a random order. Choose your cards in the correct sequence to match the face-down cards. After you submit your sequence, the face-down cards will flip to reveal if your order is correct. Complete the sequence to win and advance to the next level!",
        genre: 'Memory',
        timesPlayed: 0
    },
    {
        devStatus: 'b',
        id: 'blockPuzzle',
        name: 'Blocks',
        img: blockPuzzleImage,
        description: 'Strategically place blocks to clear horizontal lines, vertical lines, and 3x3 squares while scoring points for every block placed. Keep the board clear and aim for a high score!',
        instructions: "Drag and drop blocks onto the grid. Clear horizontal lines, vertical lines, and 3x3 squares to make room for more blocks. Earn points for every block placed, and additional points when lines or squares are cleared. The game ends when there's no room left for new blocks. Plan ahead and use your space wisely to achieve the best score!",
        genre: 'Puzzle',
        timesPlayed: 0
    },
    {
        devStatus: 'b',
        id: 'minesweeperGame',
        name: 'Minesweeper',
        img: minesweeperImage,
        description: 'harpen your logic and uncover hidden mines in this timeless puzzle game! Use your deduction skills to clear the board without setting off a mine.',
        instructions: "Tap tiles to reveal them, and use the buttons at the bottom of the screen to toggle between revealing tiles and placing flags. Numbers on revealed tiles indicate how many mines are adjacent to that tile. Flag suspected mines to avoid them. Uncover all non-mine tiles to win, but be careful—hitting a mine ends the game!",
        genre: 'Puzzle',
        timesPlayed: 0
    },
    {
        devStatus: 'b',
        id: 'carGridGame',
        name: 'Grid Locked',
        img: gridLockedImage,
        description: 'Navigate a crowded grid of cars, each facing a direction. Tap a car to drive it in the direction of its arrows! Cleverly remove as many cars as possible to clear the grid.',
        instructions: 'Tap on a car to make it move in the direction of its arrow. If the path is blocked by another car, it stops at the car. If it reaches the edge without obstruction, it drives off the grid and disappears. Plan your moves and free the grid!',
        genre: 'Puzzle',
        timesPlayed: 0
    },
    {
        devStatus: 'b',
        id: 'letterScramble',
        name: 'Letter Scramble',
        img: letterScrambleImage,
        description: 'Create as many words as possible from the given set of letters in this fun and brain-teasing word game! Test your vocabulary skills and aim to find all the hidden words to win.',
        instructions: 'Use the provided letters to form words with at least two letters. Select the letters in order, then click the "Check Word" button to submit. Discover all the possible words to complete the challenge and improve your score.',
        genre: 'Word',
        timesPlayed: 0
    },
    {
        devStatus: 'b',
        id: 'rapidFire',
        name: 'Rapid Fire',
        img: rapidFireImage,
        description: 'Test your quick thinking in this fast-paced true/false quiz game! Answer as many general knowledge questions as you can within 60 seconds. Each wrong answer costs you 5 seconds!',
        instructions: 'You have 60 seconds to answer as many questions as possible. Select True or False for each question. Correct answers earn 1 point, but wrong answers deduct 5 seconds from your remaining time. Try to beat your high score!',
        genre: 'Quiz',
        timesPlayed: 0
    },
    {
        devStatus: 'b',
        id: 'soundTest',
        name: 'Sound Test',
        img: letterScrambleImage,
        description: 'Test all available sound effects in the game.',
        instructions: 'Click on any button to play its corresponding sound effect.',
        genre: 'Debug',
        timesPlayed: 0
    },
    {
        devStatus: 'b',
        id: 'cannonLaunch',
        name: 'Cannon Launch',
        img: letterScrambleImage,
        description: 'Test all available sound effects in the game.',
        instructions: 'Click on any button to play its corresponding sound effect.',
        genre: 'Arcade',
        timesPlayed: 0
    },
    // ... rest of the games
];

const deployList = ['a', 'b'];

const MainMenu = ({ showGameModal, showFeedback, setShowFeedback, onFeedbackComplete }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [orderBy, setOrderBy] = useState(() => {
        // Load the saved preference from localStorage, default to 'A-Z' if not found
        return localStorage.getItem('orderByPreference') || 'Genre';
    });
    const [gamesList, setGamesList] = useState([]);
    const scrollableContentRef = useRef(null);
    const [feedbackStage, setFeedbackStage] = useState('initial');
    const [feedbackText, setFeedbackText] = useState('');

    useEffect(() => {
        const loadTimesPlayed = () => {
            const updatedGamesList = initialGamesList
                .filter(game => deployList.includes(game.devStatus))
                .map(game => {
                    const timesPlayed = localStorage.getItem(`${game.id}_timesPlayed`);
                    return {
                        ...game,
                        timesPlayed: timesPlayed ? parseInt(timesPlayed, 10) : 0
                    };
                });
            setGamesList(updatedGamesList);
        };

        loadTimesPlayed();

        // Restore scroll position
        const savedScrollPosition = localStorage.getItem('scrollPosition');
        console.log('savedScrollPosition', savedScrollPosition);
        if (savedScrollPosition && scrollableContentRef.current) {
            setTimeout(() => {
                scrollableContentRef.current.scrollTop = parseInt(savedScrollPosition, 10);
                console.log('scrollableContentRef.current.scrollTop', scrollableContentRef.current.scrollTop);
            }, 0);
        }
    }, []);

    // Save orderBy preference to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('orderByPreference', orderBy);
    }, [orderBy]);

    const handleShowGameModal = (game) => {
        // Save scroll position before showing the game modal
        if (scrollableContentRef.current) {
            localStorage.setItem('scrollPosition', scrollableContentRef.current.scrollTop);
        }
        showGameModal(game);
    };

    const filteredAndSortedGames = useMemo(() => {
        let result = gamesList.filter(game =>
            game.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (orderBy === 'A-Z') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (orderBy === 'Genre') {
            result.sort((a, b) => a.genre.localeCompare(b.genre) || a.name.localeCompare(b.name));
        } else if (orderBy === 'Most Played') {
            result.sort((a, b) => b.timesPlayed - a.timesPlayed || a.name.localeCompare(b.name));
        }

        return result;
    }, [searchQuery, orderBy, gamesList]);

    const groupedGames = useMemo(() => {
        if (orderBy !== 'Genre') return null;

        return filteredAndSortedGames.reduce((acc, game) => {
            if (!acc[game.genre]) {
                acc[game.genre] = [];
            }
            acc[game.genre].push(game);
            return acc;
        }, {});
    }, [filteredAndSortedGames, orderBy]);

    const handleOrderByChange = (e) => {
        setOrderBy(e.target.value);
    };

    const openAppStore = async () => {
        const platform = Capacitor.getPlatform();
        if (platform === 'ios') {
            // Replace with your iOS App Store ID
            window.open('https://apps.apple.com/app/20-in-1-offline-games/id6737703144');
        } else if (platform === 'android') {
            // Replace with your app's Play Store package name
            window.open('https://play.google.com/store/apps/details?id=com.ph03games.offlinegames');
        }
    };

    const handleFeedbackSubmit = () => {
        const encodedFeedback = encodeURIComponent(feedbackText);
        const emailSubject = encodeURIComponent('App Feedback - 100 in 1 Offline Games');
        const mailtoLink = `mailto:ph03games@gmail.com?subject=${emailSubject}&body=${encodedFeedback}`;
        window.open(mailtoLink);
        
        setFeedbackText('');
        onFeedbackComplete();
        setFeedbackStage('initial');
    };

    const handleRateApp = () => {
        openAppStore();
        onFeedbackComplete();
    };

    return (
        <div className="main-menu">
            <div className="fixed-header">
                <h1>Offline Games Collection</h1>
                <div className="search-and-order">
                    <input
                        type="text"
                        placeholder="Search games..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <select
                        value={orderBy}
                        onChange={handleOrderByChange}
                    >
                        <option value="A-Z">A-Z</option>
                        <option value="Genre">Genre</option>
                        <option value="Most Played">Most Played</option>
                    </select>
                </div>
            </div>
            <div className="scrollable-content" ref={scrollableContentRef}>
                {orderBy === 'Genre' ? (
                    Object.entries(groupedGames).map(([genre, games]) => (
                        <div key={genre} className="genre-group">
                            <h3>{genre}</h3>
                            <div className="games-grid">
                                {games.map(game => (
                                    <div 
                                        className="game-card" 
                                        key={game.id} 
                                        onClick={() => handleShowGameModal(game)}
                                    >
                                        {game.devStatus === 'b' && (
                                            <div className="new-game-indicator">NEW</div>
                                        )}
                                        <img src={game.img} alt={game.name} />
                                        <h2>{game.name}</h2>
                                        {orderBy === 'Most Played' && (
                                            <p>{game.timesPlayed} play{game.timesPlayed === 1 ? '' : 's'}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="games-grid">
                        {filteredAndSortedGames.map(game => (
                            <div 
                                className="game-card" 
                                key={game.id} 
                                onClick={() => handleShowGameModal(game)}
                            >
                                {game.devStatus === 'b' && (
                                    <div className="new-game-indicator">NEW</div>
                                )}
                                <img src={game.img} alt={game.name} />
                                <h2>{game.name}</h2>
                                {orderBy === 'Most Played' && (
                                    <p>{game.timesPlayed} play{game.timesPlayed === 1 ? '' : 's'}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="coming-soon-section">
                    <div className="coming-soon-divider">
                        <span>More Games Coming Soon!</span>
                    </div>
                    <div className="coming-soon-icons">
                        <span>🎮</span>
                        <span>🎲</span>
                        <span>🧩</span>
                    </div>
                </div>
            </div>
            
            {showFeedback && (
                <div className="feedback-container">
                    {feedbackStage === 'initial' && (
                        <div className="feedback-box">
                            <p>Are you enjoying 100 in 1 - Offline Games?</p>
                            <div className="feedback-buttons">
                                <button onClick={() => setFeedbackStage('positive')}>Yes, I love it!</button>
                                <button onClick={() => setFeedbackStage('negative')}>Not really</button>
                            </div>
                        </div>
                    )}
                    
                    {feedbackStage === 'negative' && (
                        <div className="feedback-box">
                            <p>We're sorry to hear that. Your feedback helps us improve!</p>
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Please let us know what we can do better..."
                                rows="3"
                            />
                            <div className="feedback-buttons">
                                <button onClick={handleFeedbackSubmit}>Send Feedback</button>
                                <button onClick={() => setShowFeedback(false)}>Cancel</button>
                            </div>
                        </div>
                    )}
                    
                    {feedbackStage === 'positive' && (
                        <div className="feedback-box">
                            <p>Thank you! Would you mind taking a moment to rate us? It really helps support the app's growth!</p>
                            <div className="feedback-buttons">
                                <button onClick={handleRateApp}>Rate 5 Stars</button>
                                <button onClick={() => setShowFeedback(false)}>Maybe Later</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MainMenu;
