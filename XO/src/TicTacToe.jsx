import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';

function XOGame() {
  const [size, setSize] = useState(3);
  const [board, setBoard] = useState(Array(size).fill().map(() => Array(size).fill(null)));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [history, setHistory] = useState([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [playerX, setPlayerX] = useState('human');
  const [playerO, setPlayerO] = useState('human');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [gameMode, setGameMode] = useState('human-vs-human');

  useEffect(() => {
    resetGame();
  }, [size]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('gameHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Failed to load game history:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!isReplaying && board.some(row => row.some(cell => cell !== null))) {
      saveGameHistory(board, winner, isXNext);
    }
  }, [board, winner]);

  useEffect(() => {
    if (!winner && board.every(row => row.every(cell => cell !== null))) {
      setIsDraw(true);
    }
  }, [board, winner]);

  useEffect(() => {
    if (!isReplaying && !winner && !isDraw) {
      const currentPlayer = isXNext ? playerX : playerO;
      if (currentPlayer === 'ai') {
        const timeoutId = setTimeout(() => {
          makeAiMove();
        }, 500);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [board, isXNext, playerX, playerO, winner, isDraw, isReplaying]);

  const calculateWinner = (board) => {
    for (let row = 0; row < size; row++) {
      if (board[row][0] && board[row].every(cell => cell === board[row][0])) {
        return board[row][0];
      }
    }
    for (let col = 0; col < size; col++) {
      if (board[0][col] && board.every(row => row[col] === board[0][col])) {
        return board[0][col];
      }
    }
    if (board[0][0] && board.every((row, idx) => row[idx] === board[0][0])) {
      return board[0][0];
    }
    if (board[0][size - 1] && board.every((row, idx) => row[size - 1 - idx] === board[0][size - 1])) {
      return board[0][size - 1];
    }
    return null;
  };

  const handleClick = (row, col) => {
    if (isReplaying || board[row][col] || winner || isDraw) return;

    if ((isXNext && playerX === 'ai') || (!isXNext && playerO === 'ai')) return;

    makeMove(row, col);
  };

  const makeMove = (row, col) => {
    const newBoard = board.map((r, i) =>
      i === row ? r.map((cell, j) => j === col ? (isXNext ? 'X' : 'O') : cell) : r
    );

    setBoard(newBoard);
    setIsXNext(!isXNext);

    const currentWinner = calculateWinner(newBoard);
    if (currentWinner) {
      setWinner(currentWinner);
    }
  };

  const makeAiMove = () => {
    let row, col;

    switch (aiDifficulty) {
      case 'easy':
        [row, col] = findRandomMove();
        break;
      case 'hard':
        const bestMove = findBestMove();
        [row, col] = [bestMove.row, bestMove.col];
        break;
      case 'medium':
      default:
        if (Math.random() < 0.5) {
          [row, col] = findRandomMove();
        } else {
          const bestMove = findBestMove();
          [row, col] = [bestMove.row, bestMove.col];
        }
        break;
    }

    if (row !== undefined && col !== undefined) {
      makeMove(row, col);
    }
  };

  const findRandomMove = () => {
    const emptyCells = [];

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (!board[i][j]) {
          emptyCells.push([i, j]);
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      return emptyCells[randomIndex];
    }

    return [undefined, undefined];
  };

  const findBestMove = () => {
    let bestVal = -1000;
    let bestMove = { row: -1, col: -1 };
    const player = isXNext ? 'X' : 'O';
    const opponent = isXNext ? 'O' : 'X';

    if (board.every(row => row.every(cell => cell === null))) {
      return {
        row: Math.floor(size / 2),
        col: Math.floor(size / 2)
      };
    }

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (!board[i][j]) {
          const newBoard = JSON.parse(JSON.stringify(board));
          newBoard[i][j] = player;

          if (calculateWinner(newBoard) === player) {
            return { row: i, col: j };
          }
        }
      }
    }

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (!board[i][j]) {
          const newBoard = JSON.parse(JSON.stringify(board));
          newBoard[i][j] = opponent;

          if (calculateWinner(newBoard) === opponent) {
            return { row: i, col: j };
          }
        }
      }
    }

    if (size === 3) {
      if (!board[1][1]) {
        return { row: 1, col: 1 };
      }

      const corners = [[0, 0], [0, 2], [2, 0], [2, 2]];
      for (let [i, j] of corners) {
        if (!board[i][j]) {
          return { row: i, col: j };
        }
      }
    }

    const [row, col] = findRandomMove();
    return { row, col };
  };

  const saveGameHistory = (board, winner, isXNext) => {
    const gameHistory = {
      board: JSON.parse(JSON.stringify(board)),
      winner,
      isXNext,
      timestamp: new Date().toISOString(),
      gameMode,
      size: size,
      aiDifficulty: aiDifficulty
    };

    const newHistory = [...history, gameHistory];
    setHistory(newHistory);
    localStorage.setItem('gameHistory', JSON.stringify(newHistory));
  };

  const downloadGameHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    saveAs(blob, 'gameHistory.json');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const loadedHistory = JSON.parse(reader.result);
          setHistory(loadedHistory);
          setReplayIndex(0);

          resetGame();
        } catch (error) {
          alert("ไม่สามารถโหลดไฟล์ได้: " + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const startReplay = () => {
    if (history.length === 0) {
      alert("ไม่มีประวัติการเล่นที่จะแสดง");
      return;
    }

    setIsReplaying(true);
    resetGame();
    setReplayIndex(0);

    let index = 0;
    const interval = setInterval(() => {
      if (index >= history.length) {
        clearInterval(interval);
        setIsReplaying(false);
        return;
      }

      const currentHistory = history[index];
      setBoard(currentHistory.board);
      setIsXNext(currentHistory.isXNext);
      setWinner(currentHistory.winner);
      setReplayIndex(index);
      index++;
    }, 1000);
  };

  const stopReplay = () => {
    setIsReplaying(false);
    resetGame();
  };

  const renderBoard = () => {
    return board.map((row, rowIndex) => (
      <div key={rowIndex} style={{ display: 'flex' }}>
        {row.map((cell, colIndex) => (
          <button
            key={colIndex}
            onClick={() => handleClick(rowIndex, colIndex)}
            style={{
              width: 50,
              height: 50,
              fontSize: '20px',
              backgroundColor: cell ? (cell === 'X' ? '#e0f7fa' : '#fff9c4') : '#fff',
              border: '1px solid #999',
              fontWeight: 'bold',
              cursor: (isReplaying || board[rowIndex][colIndex] || winner || isDraw ||
                (isXNext && playerX === 'ai') || (!isXNext && playerO === 'ai'))
                ? 'default' : 'pointer',
              borderRadius: '4px',
              margin: '2px',
              transition: 'background-color 0.3s',
              color: cell === 'X' ? '#0277bd' : '#ff8f00'
            }}
          >
            {cell}
          </button>
        ))}
      </div>
    ));
  };

  const resetGame = () => {
    setBoard(Array(size).fill().map(() => Array(size).fill(null)));
    setIsXNext(true);
    setWinner(null);
    setIsDraw(false);
  };

  const clearHistory = () => {
    if (window.confirm('คุณต้องการล้างประวัติการเล่นทั้งหมดหรือไม่?')) {
      setHistory([]);
      localStorage.removeItem('gameHistory');
    }
  };

  const handleSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    if (newSize >= 3 && newSize <= 10) {
      setSize(newSize);
    }
  };

  const handleGameModeChange = (e) => {
    const mode = e.target.value;
    setGameMode(mode);

    switch (mode) {
      case 'human-vs-human':
        setPlayerX('human');
        setPlayerO('human');
        break;
      case 'human-vs-ai':
        setPlayerX('human');
        setPlayerO('ai');
        break;
      case 'ai-vs-human':
        setPlayerX('ai');
        setPlayerO('human');
        break;
      case 'ai-vs-ai':
        setPlayerX('ai');
        setPlayerO('ai');
        break;
    }

    resetGame();
  };

  const handleAiDifficultyChange = (e) => {
    setAiDifficulty(e.target.value);
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Tic-Tac-Toe</h1>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <label htmlFor="board-size">ขนาดกระดาน: </label>
            <input
              id="board-size"
              type="number"
              min="3"
              max="10"
              value={size}
              onChange={handleSizeChange}
              disabled={isReplaying}
              style={{ width: '50px', marginLeft: '5px' }}
            />
          </div>

          <div>
            {isReplaying ? (
              <div>
                <span>Replaying: {replayIndex + 1}/{history.length}</span>
                <button
                  onClick={stopReplay}
                  style={{ marginLeft: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}
                >
                  หยุด Replay
                </button>
              </div>
            ) : (
              <div>
                <span>ตาของ: <b style={{ color: isXNext ? '#0277bd' : '#ff8f00' }}>{isXNext ? 'X' : 'O'}</b></span>
                {((isXNext && playerX === 'ai') || (!isXNext && playerO === 'ai')) && !winner && !isDraw && (
                  <span style={{ marginLeft: '10px', color: '#4caf50' }}>(AI กำลังคิด...)</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <label htmlFor="game-mode">โหมดเกม: </label>
            <select
              id="game-mode"
              value={gameMode}
              onChange={handleGameModeChange}
              disabled={isReplaying || board.some(row => row.some(cell => cell !== null))}
              style={{ padding: '5px', borderRadius: '4px', marginLeft: '5px' }}
            >
              <option value="human-vs-human">คน vs คน</option>
              <option value="human-vs-ai">คน vs AI</option>
              <option value="ai-vs-human">AI vs คน</option>
              <option value="ai-vs-ai">AI vs AI</option>
            </select>
          </div>

          {(playerX === 'ai' || playerO === 'ai') && (
            <div>
              <label htmlFor="ai-difficulty">ระดับ AI: </label>
              <select
                id="ai-difficulty"
                value={aiDifficulty}
                onChange={handleAiDifficultyChange}
                disabled={isReplaying}
                style={{ padding: '5px', borderRadius: '4px', marginLeft: '5px' }}
              >
                <option value="easy">ง่าย</option>
                <option value="medium">ปานกลาง</option>
                <option value="hard">ยาก</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        {renderBoard()}
      </div>

      <div style={{
        marginBottom: '20px',
        textAlign: 'center',
        padding: '10px',
        backgroundColor: winner || isDraw ? '#e8f5e9' : 'transparent',
        borderRadius: '4px',
        display: (winner || isDraw) ? 'block' : 'none'
      }}>
        {winner ? (
          <h2 style={{ color: winner === 'X' ? '#0277bd' : '#ff8f00' }}>
            ผู้ชนะคือ: {winner} {winner === 'X' ? (playerX === 'ai' ? '(AI)' : '(คน)') : (playerO === 'ai' ? '(AI)' : '(คน)')}
          </h2>
        ) : isDraw ? (
          <h2 style={{ color: '#388e3c' }}>เกมเสมอ!</h2>
        ) : null}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <button
          onClick={resetGame}
          disabled={isReplaying}
          style={{
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: isReplaying ? 'default' : 'pointer',
            opacity: isReplaying ? 0.7 : 1
          }}
        >
          เล่นใหม่
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <label
            htmlFor="file-upload"
            style={{
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            อัปโหลดประวัติ
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          <button
            onClick={startReplay}
            disabled={isReplaying || history.length === 0}
            style={{
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: (isReplaying || history.length === 0) ? 'default' : 'pointer',
              opacity: (isReplaying || history.length === 0) ? 0.7 : 1
            }}
          >
            เล่นย้อนหลัง
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={downloadGameHistory}
            disabled={history.length === 0}
            style={{
              backgroundColor: '#9c27b0',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: history.length === 0 ? 'default' : 'pointer',
              opacity: history.length === 0 ? 0.7 : 1
            }}
          >
            บันทึกประวัติ
          </button>

          <button
            onClick={clearHistory}
            disabled={history.length === 0}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: history.length === 0 ? 'default' : 'pointer',
              opacity: history.length === 0 ? 0.7 : 1
            }}
          >
            ล้างประวัติ
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>ประวัติการเล่น ({history.length} ตา)</h3>
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px'
          }}>
            {history.map((game, index) => {
              const mode = game.gameMode || 'human-vs-human';
              const difficulty = game.aiDifficulty || 'medium';
              const boardSize = game.size || 3;

              let modeText = 'คน vs คน';
              if (mode === 'human-vs-ai') modeText = 'คน vs AI';
              else if (mode === 'ai-vs-human') modeText = 'AI vs คน';
              else if (mode === 'ai-vs-ai') modeText = 'AI vs AI';

              return (
                <div key={index} style={{
                  padding: '5px',
                  borderBottom: index < history.length - 1 ? '1px solid #eee' : 'none',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ตาที่ {index + 1}</span>
                    <span>{game.winner ? `ผู้ชนะ: ${game.winner}` : 'เสมอ'}</span>
                    <span>{new Date(game.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '0.85em', color: '#666', marginTop: '3px' }}>
                    <span>โหมด: {modeText}</span>
                    {mode.includes('ai') && <span> | ระดับ AI: {difficulty === 'easy' ? 'ง่าย' : difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'}</span>}
                    <span> | ขนาด: {boardSize}x{boardSize}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default XOGame;