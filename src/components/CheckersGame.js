import React, { useState, useEffect, useRef } from 'react';
import './CheckersGame.css';
import Confetti from 'react-confetti';

const BOARD_SIZE = 8;
const COMPUTER_MOVE_DELAY = 500; // Delay between moves in milliseconds

const createInitialBoard = () => {
  const board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const currentRow = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) {
          currentRow.push({ player: 2, king: false }); // Player 2's pieces
        } else if (row > 4) {
          currentRow.push({ player: 1, king: false }); // Player 1's pieces
        } else {
          currentRow.push(null);
        }
      } else {
        currentRow.push(null);
      }
    }
    board.push(currentRow);
  }
  return board;
};

const CheckersGame = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
  const [board, setBoard] = useState(createInitialBoard());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(1); // 1 = Player 1, 2 = Player 2 or Computer
  const [message, setMessage] = useState('');
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [gameMode, setGameMode] = useState(null); // 'single' or 'multi'
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [winner, setWinner] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  useEffect(() => {
    if (gameMode === 'single' && currentPlayer === 2 && !isComputerThinking && !isGameOver) {
      setIsComputerThinking(true);
      setTimeout(makeComputerMove, COMPUTER_MOVE_DELAY);
    }
  }, [currentPlayer, isComputerThinking, gameMode, isGameOver]);

  const handleCellClick = (row, col) => {
    if (isGameOver) return;
    if (gameMode === 'single' && currentPlayer !== 1) return;

    const piece = board[row][col];
    if (selectedPiece) {
      // Try to move
      const [fromRow, fromCol] = selectedPiece;
      if (isValidMove(fromRow, fromCol, row, col, board, currentPlayer)) {
        const newBoard = makeMove(fromRow, fromCol, row, col, board);
        soundEffects.play('gameAction');
        
        // Check if a piece was captured
        if (Math.abs(row - fromRow) === 2) {
          soundEffects.play('goodMove');
        }

        // Check for winner immediately after the move, using the new board state
        const winner = checkForWinnerImmediate(newBoard);
        if (winner) {
          setBoard(newBoard);
          endGame(winner);
          return;
        }

        // If no winner, continue with the game logic
        if (
          Math.abs(row - fromRow) === 2 &&
          canCaptureAgain(row, col, newBoard, currentPlayer)
        ) {
          setBoard(newBoard);
          setSelectedPiece([row, col]);
          setMessage("Another capture available!");
        } else {
          const nextPlayer = currentPlayer === 1 ? 2 : 1;
          const possibleMoves = findAllPossibleMoves(nextPlayer, newBoard);
          
          if (possibleMoves.length === 0) {
            setBoard(newBoard);
            endGame(currentPlayer);
          } else {
            setBoard(newBoard);
            setSelectedPiece(null);
            setCurrentPlayer(nextPlayer);
            if (gameMode === 'single') {
              setMessage(nextPlayer === 1 ? 'Your turn' : 'Computer is thinking...');
            } else {
              setMessage(`Player ${nextPlayer}'s turn`);
            }
          }
        }
      } else {
        setSelectedPiece(null);
        setMessage("Invalid move. Try again.");
        soundEffects.play('gameAction'); // Play sound for deselecting
      }
    } else if (piece && piece.player === currentPlayer) {
      setSelectedPiece([row, col]);
      soundEffects.play('gameAction'); // Play sound for selecting
      if (captureAvailable(currentPlayer, board)) {
        setMessage("Capture move available, but not required.");
      } else {
        setMessage(`Player ${currentPlayer}'s piece selected.`);
      }
    }
  };

  const isValidMove = (fromRow, fromCol, toRow, toCol, board, player) => {
    const piece = board[fromRow][fromCol];
    if (!piece || piece.player !== player) return false;

    const deltaRow = toRow - fromRow;
    const deltaCol = Math.abs(toCol - fromCol);
    const direction = player === 1 ? -1 : 1;

    // Regular move
    if (Math.abs(deltaRow) === 1 && deltaCol === 1) {
      return (deltaRow === direction || piece.king) && board[toRow][toCol] === null;
    }

    // Capture move
    if (Math.abs(deltaRow) === 2 && deltaCol === 2) {
      if (!piece.king && deltaRow !== 2 * direction) return false;

      const middleRow = fromRow + deltaRow / 2;
      const middleCol = (fromCol + toCol) / 2;
      const capturedPiece = board[middleRow][middleCol];

      return capturedPiece &&
        capturedPiece.player !== player &&
        board[toRow][toCol] === null;
    }

    return false;
  };

  const captureAvailable = (player, board) => {
    const possibleCaptures = findAllPossibleMoves(player, board, true);
    return possibleCaptures.length > 0;
  };

  const makeMove = (fromRow, fromCol, toRow, toCol, board) => {
    const newBoard = board.map((row) => row.slice());
    const piece = { ...newBoard[fromRow][fromCol] };
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    // Check for capture
    if (Math.abs(toRow - fromRow) === 2) {
      const middleRow = (fromRow + toRow) / 2;
      const middleCol = (fromCol + toCol) / 2;
      newBoard[middleRow][middleCol] = null;
    }

    // Check for kinging
    if (
      (piece.player === 1 && toRow === 0) ||
      (piece.player === 2 && toRow === BOARD_SIZE - 1)
    ) {
      piece.king = true;
    }

    return newBoard;
  };

  const makeComputerMove = () => {
    const possibleMoves = findAllPossibleMoves(2, board);
    if (possibleMoves.length === 0) {
      setMessage('You win! Computer has no more moves.');
      setIsComputerThinking(false);
      soundEffects.play('gameWon');
      setGameWon(true);
      return;
    }

    // For each possible move, simulate the move sequence
    const evaluatedMoves = possibleMoves.map((move) => {
      const result = simulateMoveSequence(
        move.fromRow,
        move.fromCol,
        board,
        move.toRow,
        move.toCol,
        2
      );
      const score = evaluateBoard(result.board, 2);
      return { moveSequence: result.moveSequence, score };
    });

    // Select the best move
    const bestMoveData = evaluatedMoves.reduce((best, moveData) =>
      moveData.score > best.score ? moveData : best
    );

    if (!bestMoveData) {
      setMessage('Error: No valid moves for computer');
      setIsComputerThinking(false);
      return;
    }

    // Now execute the best move sequence
    executeComputerMoveSequence(bestMoveData.moveSequence);
  };

  const simulateMoveSequence = (fromRow, fromCol, board, toRow, toCol, player) => {
    let moveSequence = [{ fromRow, fromCol, toRow, toCol }];
    let newBoard = makeMove(fromRow, fromCol, toRow, toCol, board);

    // Check for additional captures
    let currentRow = toRow;
    let currentCol = toCol;

    while (canCaptureAgain(currentRow, currentCol, newBoard, player)) {
      const nextCaptures = getValidMoves(currentRow, currentCol, newBoard, player).captures;
      if (nextCaptures.length > 0) {
        // For simplicity, choose the first available capture
        const nextMove = nextCaptures[0];
        moveSequence.push({
          fromRow: currentRow,
          fromCol: currentCol,
          toRow: nextMove.toRow,
          toCol: nextMove.toCol,
        });
        newBoard = makeMove(
          currentRow,
          currentCol,
          nextMove.toRow,
          nextMove.toCol,
          newBoard
        );
        currentRow = nextMove.toRow;
        currentCol = nextMove.toCol;
      } else {
        break;
      }
    }

    return { board: newBoard, moveSequence };
  };

  const executeComputerMoveSequence = (moveSequence) => {
    if (moveSequence.length === 0) {
      finishComputerTurn();
      return;
    }

    const [currentMove, ...remainingMoves] = moveSequence;

    if (
      !isValidMove(
        currentMove.fromRow,
        currentMove.fromCol,
        currentMove.toRow,
        currentMove.toCol,
        board,
        2
      )
    ) {
      console.error('Invalid move attempted by computer:', currentMove);
      finishComputerTurn();
      return;
    }

    const newBoard = makeMove(
      currentMove.fromRow,
      currentMove.fromCol,
      currentMove.toRow,
      currentMove.toCol,
      board
    );
    setBoard(newBoard);
    soundEffects.play('gameAction');

    // Check if a piece was captured
    if (Math.abs(currentMove.toRow - currentMove.fromRow) === 2) {
      soundEffects.play('badMove');
    }

    // Small delay before updating the message
    setTimeout(() => {
      setMessage(`Computer is moving... (${remainingMoves.length} moves left)`);

      // Delay before executing the next move
      setTimeout(() => {
        if (remainingMoves.length > 0) {
          executeComputerMoveSequence(remainingMoves);
        } else {
          finishComputerTurn(newBoard);
        }
      }, COMPUTER_MOVE_DELAY);
    }, 100); // 100ms delay for message update
  };

  const finishComputerTurn = (newBoard) => {
    const possibleMoves = findAllPossibleMoves(1, newBoard || board);
    if (possibleMoves.length === 0) {
      setMessage('Computer wins! You have no more moves.');
      soundEffects.play('gameOver');
      setIsGameOver(true);
      setIsComputerThinking(false);
    } else {
      setCurrentPlayer(1);
      setIsComputerThinking(false);
      setMessage('Your turn');
    }
  };

  const evaluateBoard = (board, player) => {
    let score = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];
        if (piece) {
          const pieceValue = piece.king ? 3 : 1;
          if (piece.player === player) {
            score += pieceValue;
          } else {
            score -= pieceValue;
          }
        }
      }
    }
    return score;
  };

  const findAllPossibleMoves = (player, board, capturesOnly = false) => {
    const captures = [];
    const moves = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];
        if (piece && piece.player === player) {
          const pieceMoves = getValidMoves(row, col, board, player);
          captures.push(...pieceMoves.captures);
          moves.push(...pieceMoves.moves);
        }
      }
    }
    if (capturesOnly) {
      return captures;
    }
    return captures.length > 0 ? captures : moves;
  };

  const getValidMoves = (row, col, board, player) => {
    const captures = [];
    const moves = [];
    const piece = board[row][col];
    const directions = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    for (let [dRow, dCol] of directions) {
      if (
        !piece.king &&
        ((player === 1 && dRow > 0) || (player === 2 && dRow < 0))
      ) {
        continue;
      }
      const toRow = row + dRow;
      const toCol = col + dCol;
      if (
        toRow >= 0 &&
        toRow < BOARD_SIZE &&
        toCol >= 0 &&
        toCol < BOARD_SIZE
      ) {
        if (isValidMove(row, col, toRow, toCol, board, player)) {
          moves.push({ fromRow: row, fromCol: col, toRow, toCol });
        }
      }
      // Check for captures
      const captureRow = row + 2 * dRow;
      const captureCol = col + 2 * dCol;
      if (
        captureRow >= 0 &&
        captureRow < BOARD_SIZE &&
        captureCol >= 0 &&
        captureCol < BOARD_SIZE
      ) {
        if (isValidMove(row, col, captureRow, captureCol, board, player)) {
          captures.push({
            fromRow: row,
            fromCol: col,
            toRow: captureRow,
            toCol: captureCol,
          });
        }
      }
    }
    return { captures, moves };
  };

  const canCaptureAgain = (row, col, board, player) => {
    const pieceMoves = getValidMoves(row, col, board, player);
    return pieceMoves.captures.length > 0;
  };

  const renderBoard = () => {
    return board.map((rowData, row) => (
      <div key={row} className="board-row">
        {rowData.map((cell, col) => {
          const isDark = (row + col) % 2 === 1;
          const isSelected =
            selectedPiece && selectedPiece[0] === row && selectedPiece[1] === col;
          return (
            <div
              key={col}
              className={`cell ${isDark ? 'dark' : 'light'} ${
                isSelected ? 'selected' : ''
              }`}
              onClick={() => handleCellClick(row, col)}
            >
              {cell && (
                <div
                  className={`piece player${cell.player} ${
                    cell.king ? 'king' : ''
                  }`}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    ));
  };

  const checkForWinnerImmediate = (board) => {
    const player1Pieces = board.flat().filter(cell => cell && cell.player === 1).length;
    const player2Pieces = board.flat().filter(cell => cell && cell.player === 2).length;

    if (player1Pieces === 0) return 2;
    if (player2Pieces === 0) return 1;
    return null;
  };

  const endGame = (winner) => {
    if (gameMode === 'single' && winner === 2) {
      setIsGameOver(true);
      soundEffects.play('gameOver');
    } else {
      setGameWon(true);
      soundEffects.play('gameWon');
    }
    setWinner(winner);

    if (gameMode === 'single') {
      if (winner === 1) {
        setPlayerScore(prevScore => prevScore + 1);
      } else {
        setOpponentScore(prevScore => prevScore + 1);
      }
    }
  };

  const resetGame = () => {
    soundEffects.play('playButton');
    setBoard(createInitialBoard());
    setSelectedPiece(null);
    setCurrentPlayer(1);
    setMessage('');
    setIsComputerThinking(false);
    setIsGameOver(false);
    setGameWon(false);
    setWinner(null);
    // Optionally reset the gameMode to allow the player to select again
    // setGameMode(null);
  };

  const handleGameModeSelection = (mode) => {
    soundEffects.play('playButton');
    setGameMode(mode);
  };

  return (
    <div className="pre-checkers-game">
      {gameMode === null ? (
        <div className="game-mode-selection">
          <button onClick={() => handleGameModeSelection('single')}>Single Player</button>
          <button onClick={() => handleGameModeSelection('twoPlayer')}>Two Player</button>
        </div>
      ) : (
        <div className="checkers-game">
          <div className="message" style={{ color: currentPlayer === 1 ? 'blue' : 'red' }}>
            {!isGameOver && (gameMode === 'twoPlayer' 
              ? `Player ${currentPlayer}'s turn` 
              : (currentPlayer === 1 ? 'Your turn' : 'Computer\'s turn')
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
                  ? (winner === 1 ? 'YOU WIN!' : 'GAME OVER') 
                  : `PLAYER ${winner} WINS!`}
              </div>
              {gameMode !== 'single' && 
                <div className={`win-message2 ${winner === 1 ? 'winDown' : 'winUp'}`}>
                  {winner === 1 ? '⬇' : '⬆'}
                </div>
              }
              <button onClick={resetGame} className="play-again-button">
                Play Again
              </button>
            </>
          )}
          {isGameOver && gameMode === 'single' && winner !== 1 && (
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

export default CheckersGame;
