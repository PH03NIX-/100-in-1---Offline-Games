import React, { useState, useEffect } from 'react';
import './ChessGame.css';
import Confetti from 'react-confetti';

// Unicode characters for pieces
const PIECES = {
  'wP': '♙', 'wR': '♖', 'wN': '♘', 'wB': '♗', 'wQ': '♕', 'wK': '♔',
  'bP': '♟', 'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚'
};

// Initial board setup
const initialBoard = [
  ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
  ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
  ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
];


const ChessGame = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
  const [board, setBoard] = useState(initialBoard);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('w');
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [gameMode, setGameMode] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (gameMode === 'single' && currentPlayer === 'b' && !isGameOver) {
      setTimeout(makeComputerMove, 500);
    }
  }, [currentPlayer, board, gameMode, isGameOver]);

  const handleCellClick = (row, col) => {
    if (isGameOver) return;
    if (gameMode === 'single' && currentPlayer !== 'w') return;

    const piece = board[row][col];

    if (selectedPiece) {
      // Try to move
      if (possibleMoves.some(move => move.row === row && move.col === col)) {
        movePiece(selectedPiece, { row, col });
        soundEffects.play('gameAction'); // Play sound for move
        setSelectedPiece(null);
        setPossibleMoves([]);
        // Switch current player
        setCurrentPlayer(currentPlayer === 'w' ? 'b' : 'w');
      } else {
        setSelectedPiece(null);
        setPossibleMoves([]);
        soundEffects.play('gameAction'); // Play sound for deselecting
      }
    } else if (piece && piece.startsWith(currentPlayer)) {
      setSelectedPiece({ row, col });
      const moves = getPossibleMoves(piece, row, col, board);
      setPossibleMoves(moves);
      soundEffects.play('gameAction'); // Play sound for selecting
    }
  };

  const movePiece = (fromPos, toPos) => {
    const newBoard = board.map(row => row.slice());
    newBoard[toPos.row][toPos.col] = newBoard[fromPos.row][fromPos.col];
    newBoard[fromPos.row][fromPos.col] = null;
    setBoard(newBoard);
    
    // Check if a piece was captured
    if (board[toPos.row][toPos.col]) {
      soundEffects.play('goodMove');
    }
    
    checkGameEnd(newBoard);
  };

  const getPossibleMoves = (piece, row, col, board) => {
    // Implement movement logic for each piece
    const moves = [];
    const directions = {
      'P': [[-1, 0], [-1, -1], [-1, 1]],
      'R': [[-1, 0], [1, 0], [0, -1], [0, 1]],
      'N': [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2]],
      'B': [[-1, -1], [-1, 1], [1, -1], [1, 1]],
      'Q': [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]],
      'K': [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]
    };
    const type = piece[1];
    const color = piece[0];

    if (type === 'P') {
      const dir = color === 'w' ? -1 : 1;
      // Forward move
      if (board[row + dir] && !board[row + dir][col]) {
        moves.push({ row: row + dir, col });
        // Double move from starting position
        if ((color === 'w' && row === 6) || (color === 'b' && row === 1)) {
          if (!board[row + 2 * dir][col]) {
            moves.push({ row: row + 2 * dir, col });
          }
        }
      }
      // Captures
      [-1, 1].forEach(dc => {
        if (board[row + dir] && board[row + dir][col + dc]) {
          if (board[row + dir][col + dc][0] !== color) {
            moves.push({ row: row + dir, col: col + dc });
          }
        }
      });
    } else {
      const pieceDirections = directions[type];
      pieceDirections.forEach(([dr, dc]) => {
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          if (!board[r][c]) {
            moves.push({ row: r, col: c });
          } else {
            if (board[r][c][0] !== color) {
              moves.push({ row: r, col: c });
            }
            break;
          }
          if (type === 'N' || type === 'K') break;
          r += dr;
          c += dc;
        }
      });
    }

    // Filter out moves that would put own king in check (not implemented here)
    return moves;
  };

  const evaluateBoard = (board) => {
    const pieceValues = {
      'P': 100, 'N': 320, 'B': 330, 'R': 500, 'Q': 900, 'K': 20000
    };

    let score = 0;
    board.forEach((row, i) => {
      row.forEach((piece, j) => {
        if (piece) {
          const value = pieceValues[piece[1]];
          const positionBonus = getPositionBonus(piece, i, j);
          score += piece[0] === 'w' ? value + positionBonus : -(value + positionBonus);
        }
      });
    });
    return score;
  };

  const getPositionBonus = (piece, row, col) => {
    const center = Math.abs(3.5 - row) + Math.abs(3.5 - col);
    return piece[1] === 'P' ? (7 - row) * 10 : (4 - center) * 10;
  };

  const minimax = (board, depth, alpha, beta, isMaximizingPlayer) => {
    if (depth === 0) {
      return evaluateBoard(board);
    }

    const moves = getAllPossibleMoves(board, isMaximizingPlayer ? 'b' : 'w');

    if (moves.length === 0) {
      // Check for checkmate or stalemate
      return isMaximizingPlayer ? -Infinity : Infinity;
    }

    if (isMaximizingPlayer) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const newBoard = makeMove(board, move.from, move.to);
        const eval1 = minimax(newBoard, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, eval1);
        alpha = Math.max(alpha, eval1);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const newBoard = makeMove(board, move.from, move.to);
        const eval1 = minimax(newBoard, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, eval1);
        beta = Math.min(beta, eval1);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  const makeMove = (board, from, to) => {
    const newBoard = board.map(row => row.slice());
    newBoard[to.row][to.col] = newBoard[from.row][from.col];
    newBoard[from.row][from.col] = null;
    return newBoard;
  };

  const getAllPossibleMoves = (board, color) => {
    const moves = [];
    board.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        if (piece && piece[0] === color) {
          const possibleMoves = getPossibleMoves(piece, rowIndex, colIndex, board);
          possibleMoves.forEach(move => {
            moves.push({ from: { row: rowIndex, col: colIndex }, to: move });
          });
        }
      });
    });
    return moves;
  };

  const makeComputerMove = () => {
    const moves = getAllPossibleMoves(board, 'b');
    let bestMoves = [];
    let bestScore = Infinity;
    const depth = 5; // Increase for stronger play, decrease if too slow

    for (const move of moves) {
      const newBoard = makeMove(board, move.from, move.to);
      const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false);
      console.log('board and score', newBoard, score);
      
      if (score < bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }

    if (bestMoves.length > 0) {
      const randomIndex = Math.floor(Math.random() * bestMoves.length);
      const selectedMove = bestMoves[randomIndex];
      movePiece(selectedMove.from, selectedMove.to);
      setCurrentPlayer('w');
      soundEffects.play('gameAction');
      if(board[selectedMove.to.row][selectedMove.to.col]) {
        soundEffects.play('badMove');
      }
    } else {
      endGame('w'); // Player wins if computer has no moves
    }
  };
  
  const checkGameEnd = (newBoard) => {
    // Implement checkmate and stalemate logic here
    // For now, we'll just check if the king is captured
    const whiteKingExists = newBoard.flat().includes('wK');
    const blackKingExists = newBoard.flat().includes('bK');

    if (!whiteKingExists) {
      endGame('b');
    } else if (!blackKingExists) {
      endGame('w');
    }
  };

  const endGame = (winningPlayer) => {
    setIsGameOver(true);
    setGameWon(true);
    setWinner(winningPlayer);
    if (gameMode === 'single' && winningPlayer === 'b') {
      soundEffects.play('gameOver');
    } else {
      soundEffects.play('gameWon');
    }
  };

  const resetGame = () => {
    soundEffects.play('playButton');
    setBoard(initialBoard);
    setSelectedPiece(null);
    setCurrentPlayer('w');
    setPossibleMoves([]);
    setIsGameOver(false);
    setGameWon(false);
    setWinner(null);
  };

  const renderBoard = () => {
    return board.map((rowData, row) => (
      <div key={row} className="board-row">
        {rowData.map((cell, col) => {
          const isDark = (row + col) % 2 === 1;
          const isSelected =
            selectedPiece && selectedPiece.row === row && selectedPiece.col === col;
          const isPossibleMove = possibleMoves.some(
            move => move.row === row && move.col === col
          );
          return (
            <div
              key={col}
              className={`cell ${isDark ? 'dark' : 'light'} ${
                isSelected ? 'selected' : ''
              } ${isPossibleMove ? 'possible-move' : ''}`}
              onClick={() => handleCellClick(row, col)}
            >
              {cell && <span className="piece">{PIECES[cell]}</span>}
            </div>
          );
        })}
      </div>
    ));
  };

  const handleGameModeSelection = (mode) => {
    soundEffects.play('playButton');
    setGameMode(mode);
  };

  return (
    <div className="pre-chess-game">
      {gameMode === null ? (
        <div className="game-mode-selection">
          <button onClick={() => handleGameModeSelection('single')}>Single Player</button>
          <button onClick={() => handleGameModeSelection('twoPlayer')}>Two Player</button>
        </div>
      ) : (
        <div className="chess-game">
          <div className="message" style={{ color: currentPlayer === 'w' ? 'blue' : 'red' }}>
            {!isGameOver && (gameMode === 'twoPlayer' 
              ? `Player ${currentPlayer === 'w' ? '1' : '2'}'s turn` 
              : (currentPlayer === 'w' ? 'Your turn' : 'Computer\'s turn')
            )}
          </div>
          <div className="board">
            {renderBoard()}
          </div>
          {gameWon && (
            <>
              <Confetti />
              <div className="win-message">
                {gameMode === 'single' 
                  ? (winner === 'w' ? 'YOU WIN!' : 'GAME OVER') 
                  : `PLAYER ${winner === 'w' ? '1' : '2'} WINS!`}
              </div>
              {gameMode !== 'single' && 
                <div className={`win-message2 ${winner === 'w' ? 'winDown' : 'winUp'}`}>
                  {winner === 'w' ? '⬇' : '⬆'}
                </div>
              }
              <button onClick={resetGame} className="play-again-button">
                Play Again
              </button>
            </>
          )}
          {isGameOver && gameMode === 'single' && winner !== 'w' && (
            <div className="game-over">
              <h2>Game Over</h2>
              <button onClick={resetGame}>Restart Game</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChessGame;
