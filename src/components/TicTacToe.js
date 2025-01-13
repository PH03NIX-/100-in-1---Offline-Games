import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import './TicTacToe.css';

const TicTacToe = ({ soundEffects }) => {
  const initialBoard = Array(9).fill(null);
  const [board, setBoard] = useState(initialBoard);
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState(null);
  const [gameStatus, setGameStatus] = useState('playing');
  const [winner, setWinner] = useState(null);
  const [isPlayerFirst, setIsPlayerFirst] = useState(true);

  useEffect(() => {
    if (gameMode === 'single' && !isXNext && gameStatus === 'playing') {
      const timer = setTimeout(() => {
        makeComputerMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameMode, gameStatus]);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return squares[a];
      }
    }
    return null;
  };

  const handleGameModeSelection = (mode) => {
    soundEffects.play('playButton');
    setGameMode(mode);
    if (mode === 'single') {
      const playerGoesFirst = Math.random() < 0.5;
      setIsPlayerFirst(playerGoesFirst);
      setIsXNext(playerGoesFirst);
      if (!playerGoesFirst) {
        setTimeout(() => makeComputerMove(), 500);
      }
    }
  };

  const handleClick = (index) => {
    if (board[index] || gameStatus !== 'playing') return;
    soundEffects.play('gameAction');
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
      setGameStatus('won');
      if (gameMode === 'single' && newWinner === 'O') {
        soundEffects.play('gameOver');
      } else {
        soundEffects.play('gameWon');
      }
    } else if (newBoard.every(square => square !== null)) {
      setGameStatus('draw');
      soundEffects.play('gameOver');
    } else {
      setIsXNext(!isXNext);
    }
  };

  const makeComputerMove = () => {
    const newBoard = [...board];
    const move = findBestMove(newBoard);
    if (move !== -1) {
      setTimeout(() => {
        soundEffects.play('gameAction');
        handleClick(move);
      }, 500);
    }
  };

  const findBestMove = (board) => {
    // Check if AI can win
    const winningMove = findWinningMove(board, 'O');
    if (winningMove !== -1) return winningMove;

    // Check if player is about to win and block
    const blockingMove = findWinningMove(board, 'X');
    if (blockingMove !== -1) return blockingMove;

    // Find the move that creates the most opportunities
    return findBestOpportunity(board);
  };

  const findWinningMove = (board, player) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] === player && board[b] === player && board[c] === null) return c;
      if (board[a] === player && board[c] === player && board[b] === null) return b;
      if (board[b] === player && board[c] === player && board[a] === null) return a;
    }

    return -1;
  };

  const findBestOpportunity = (board) => {
    const emptySquares = board.reduce((acc, square, index) => {
      if (square === null) acc.push(index);
      return acc;
    }, []);

    let bestScore = -Infinity;
    let bestMove = -1;

    for (let square of emptySquares) {
      let score = evaluateMove(board, square);
      if (score > bestScore) {
        bestScore = score;
        bestMove = square;
      }
    }

    return bestMove;
  };

  const evaluateMove = (board, move) => {
    const newBoard = [...board];
    newBoard[move] = 'O';
    
    let score = 0;
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (let line of lines) {
      if (line.includes(move)) {
        const [a, b, c] = line;
        if (newBoard[a] !== 'X' && newBoard[b] !== 'X' && newBoard[c] !== 'X') {
          score += 1;
          if (newBoard[a] === 'O' || newBoard[b] === 'O' || newBoard[c] === 'O') {
            score += 1;
          }
        }
      }
    }

    // Prefer center and corners
    if (move === 4) score += 2;
    if (move === 0 || move === 2 || move === 6 || move === 8) score += 1;

    return score;
  };

  const renderSquare = (index) => (
    <button className="square" onClick={() => handleClick(index)}>
      {board[index]}
    </button>
  );

  const resetGame = () => {
    soundEffects.play('playButton');
    setBoard(initialBoard);
    setGameStatus('playing');
    setWinner(null);
    if (gameMode === 'single') {
      const playerGoesFirst = Math.random() < 0.5;
      setIsPlayerFirst(playerGoesFirst);
      setIsXNext(playerGoesFirst);
      if (!playerGoesFirst) {
        setTimeout(() => makeComputerMove(), 500);
      }
    } else {
      setIsXNext(true);
    }
  };

  if (gameMode === null) {
    return (
      <div className="game-mode-selection">
        <h2>Select Game Mode</h2>
        <button onClick={() => handleGameModeSelection('single')}><span className="emoji">👤</span> Single Player</button>
        <button onClick={() => handleGameModeSelection('multi')}><span className="emoji">👤👤</span> Two Player</button>
      </div>
    );
  }

  return (
    <div className="pre-tictactoe">
      <div className="tictactoe">
        {gameStatus === 'playing' && (
          <div className="status" style={{color: isXNext ? 'green' : 'blue'}}>
            {gameMode === 'multi' 
              ? `Player ${isXNext ? '1' : '2'}'s turn` 
              : (isXNext === isPlayerFirst ? 'Your turn' : 'Computer\'s turn')}
          </div>
        )}
        <div className={`board ${gameStatus === 'won' && (gameMode !== 'single' || winner !== 'O') ? 'winningBoard' : ''}`}>
          <div className="board-row">
            {renderSquare(0)}
            {renderSquare(1)}
            {renderSquare(2)}
          </div>
          <div className="board-row">
            {renderSquare(3)}
            {renderSquare(4)}
            {renderSquare(5)}
          </div>
          <div className="board-row">
            {renderSquare(6)}
            {renderSquare(7)}
            {renderSquare(8)}
          </div>
        </div>
        {gameStatus === 'won' && (gameMode !== 'single' || winner !== 'O') && (
          <>
            <Confetti />
            <div className="win-message">
              {gameMode === 'single' 
                ? (winner === 'X' ? 'YOU WIN!' : '') 
                : `PLAYER ${winner === 'X' ? '1' : '2'} WINS!`}
            </div>
            <button className="play-again-button" onClick={resetGame}>
              Play Again
            </button>            
          </>
        )}
        {gameStatus === 'draw' && (
          <>
            <div className="draw-message">IT'S A DRAW!</div>
            <button className="play-again-button" onClick={resetGame}>
              Play Again
            </button>
          </>
        )}
      </div>
      {gameMode === 'single' && gameStatus === 'won' && winner === 'O' && (
        <div className="game-over">
          <h2>Game Over</h2>
          <button onClick={resetGame}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default TicTacToe;
