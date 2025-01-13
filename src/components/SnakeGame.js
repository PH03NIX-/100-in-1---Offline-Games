import React, { useState, useEffect, useCallback } from 'react';
import './SnakeGame.css';

const SnakeGame = ({ gamePaused, setIsTimerActive, soundEffects }) => {
    const [snake, setSnake] = useState([{ x: 5, y: 11 }]);
    const [food, setFood] = useState({ x: Math.floor(Math.random() * 25), y: Math.floor(Math.random() * 15) });
    const [direction, setDirection] = useState({ x: 0, y: -1 });
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [startTouch, setStartTouch] = useState(null);
    const [newHighScore, setNewHighScore] = useState(false);

    // Retrieve high score from localStorage
    useEffect(() => {
        const savedHighScore = localStorage.getItem('highScore') || 0;
        setHighScore(parseInt(savedHighScore, 10));
    }, []);

    // Generate new food position
    const generateFood = useCallback(() => {
        const newFood = { x: Math.floor(Math.random() * 25), y: Math.floor(Math.random() * 15) };
        setFood(newFood);
    }, []);

    // Handle touch start event
    const handleTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        setStartTouch({ x: touch.clientX, y: touch.clientY });
    }, []);

    // Handle touch end event
    const handleTouchEnd = useCallback((e) => {
        if (!startTouch) return;
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - startTouch.x;
        const deltaY = touch.clientY - startTouch.y;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0 && direction.y === 0) {
                setDirection({ x: 0, y: 1 }); // Swipe right
                soundEffects.play('gameAction');
            } else if (deltaX < 0 && direction.y === 0) {
                setDirection({ x: 0, y: -1 }); // Swipe left
                soundEffects.play('gameAction');
            }
        } else {
            if (deltaY > 0 && direction.x === 0) {
                setDirection({ x: 1, y: 0 }); // Swipe down
                soundEffects.play('gameAction');
            } else if (deltaY < 0 && direction.x === 0) {
                setDirection({ x: -1, y: 0 }); // Swipe up
                soundEffects.play('gameAction');
            }
        }
        setStartTouch(null);
    }, [startTouch, direction, soundEffects]);

    // Restart the game by resetting all the states
    const restartGame = () => {
        soundEffects.play('playButton');
        setSnake([{ x: 5, y: 11 }]);
        setFood({ x: Math.floor(Math.random() * 25), y: Math.floor(Math.random() * 15) });
        setDirection({ x: 0, y: -1 });
        setScore(0);
        setGameOver(false);
        setIsTimerActive(true);

    };

    // Game loop
    useEffect(() => {
        if (gameOver || gamePaused) return;
        const gameInterval = setInterval(() => {
            setSnake(prevSnake => {
                const newSnake = [...prevSnake];
                const head = { x: newSnake[0].x + direction.x, y: newSnake[0].y + direction.y };

                if (head.x < 0 || head.x >= 25 || head.y < 0 || head.y >= 15) {
                    setGameOver(true);
                    setIsTimerActive(false);
                    soundEffects.play('gameOver');
                    return prevSnake;
                }

                if (head.x === food.x && head.y === food.y) {
                    setScore(score + 1);
                    newSnake.unshift(head);
                    generateFood();
                    soundEffects.play('goodMove');
                } else {
                    newSnake.pop();
                    newSnake.unshift(head);
                }

                if (newSnake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
                    setGameOver(true);
                    setIsTimerActive(false);
                    soundEffects.play('gameOver');
                    return prevSnake;
                }
                if (gameOver || gamePaused) return prevSnake;
                return newSnake;
            });
        }, 200);

        return () => clearInterval(gameInterval);
    }, [snake, direction, gameOver, gamePaused, food, score, generateFood, setIsTimerActive, soundEffects]);

    // Update high score if the current score is higher
    useEffect(() => {
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('highScore', score);
            if (!newHighScore) {
                setNewHighScore(true);
                soundEffects.play('gameWon');
            }
        }
    }, [gameOver, score, highScore, newHighScore, soundEffects]);

    /*if (gameOver) {
        return (
            <div className="game-over">
                <h2>Game Over!</h2>
                <p>Score: {score}</p>
                <p>Best: {highScore}</p>
                <button onClick={restartGame}>Restart Game</button>
            </div>
        );
    }*/

    return (
        <div 
            className="snake-game" 
            onTouchStart={handleTouchStart} 
            onTouchEnd={handleTouchEnd}
        >
            {gameOver && 
                <div className="game-over">
                    <h2>Game Over!</h2>
                    <p>Score: {score}</p>
                    <p>Best: {highScore}</p>
                    <button onClick={restartGame}>Restart Game</button>
                </div>
            }
            <div className="game-info">
                <div className="score">Score: {score}</div>
                <div className="high-score">Best: {highScore}</div>
            </div>
            <div className="grid">
                {Array(15).fill(0).map((_, row) => (
                    <div className="row" key={row}>
                        {Array(25).fill(0).map((_, col) => (
                            <div
                                className={`cell ${snake.some(segment => segment.x === col && segment.y === row) ? 'snake' : ''}`}
                                key={col}
                            >
                                {food.x === col && food.y === row && <div className="food"></div>}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            {gamePaused && (
                <div className="pause-overlay">
                    <h2>Game Paused</h2>
                </div>
            )}
        </div>
    );
};

export default SnakeGame;
