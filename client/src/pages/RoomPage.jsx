import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import useGame, { BLACK, WHITE } from '../hooks/useGame';
import useMeister from '../hooks/useMeister';
import Board from '../components/Board';
import GameInfo from '../components/GameInfo';
import GameResult from '../components/GameResult';
import SpectatorBadge from '../components/SpectatorBadge';
import MeisterOverlay from '../components/MeisterOverlay';
import RoomSettingsModal from '../components/RoomSettingsModal';
import CoinToss from '../components/CoinToss';

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { userName } = useAppContext();
  const {
    roomState, lastFlipped, lastMove, timers, disconnectedPlayer,
    joinRoom, leaveRoom, swapSides, updateSettings, startGame, makeMove, requestAnalysis,
  } = useGame(roomId);

  const { meisterActive } = useMeister(userName);
  const [myRole, setMyRole] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCoinToss, setShowCoinToss] = useState(false);
  const [coinResult, setCoinResult] = useState(null);
  const [meisterData, setMeisterData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const prevGameStatusRef = useRef(null);

  useEffect(() => {
    joinRoom('player').then((res) => {
      if (res.role) setMyRole(res.role);
    });

    return () => {
      leaveRoom();
    };
  }, [roomId, joinRoom, leaveRoom]);

  // Determine role from room state
  useEffect(() => {
    if (!roomState || !userName) return;
    if (roomState.players[BLACK] === userName) setMyRole('black');
    else if (roomState.players[WHITE] === userName) setMyRole('white');
    else setMyRole('spectator');
  }, [roomState, userName]);

  // Show result overlay only when game transitions to finished
  useEffect(() => {
    const currentStatus = roomState?.game?.status;
    if (prevGameStatusRef.current === 'playing' && currentStatus === 'finished') {
      setShowResult(true);
    }
    prevGameStatusRef.current = currentStatus || null;
  }, [roomState?.game?.status]);

  // Meister analysis
  useEffect(() => {
    if (!meisterActive || !roomState?.game || roomState.game.status !== 'playing') {
      setMeisterData(null);
      return;
    }

    const myColor = myRole === 'black' ? BLACK : myRole === 'white' ? WHITE : null;
    if (!myColor) return;

    setAnalyzing(true);
    requestAnalysis(roomState.game.board, myColor).then((data) => {
      setMeisterData(data);
      setAnalyzing(false);
    });
  }, [meisterActive, roomState?.game?.board, roomState?.game?.currentTurn, myRole, requestAnalysis]);

  function handleCellClick(row, col) {
    if (!roomState?.game || roomState.game.status !== 'playing') return;
    const myColor = myRole === 'black' ? BLACK : myRole === 'white' ? WHITE : null;
    if (!myColor || myColor !== roomState.game.currentTurn) return;

    makeMove(row, col);
  }

  function handleStartGame() {
    setShowResult(false);
    startGame();
  }

  function handleSwap() {
    swapSides();
  }

  function handleCoinToss() {
    const result = Math.random() < 0.5 ? 'black' : 'white';
    setCoinResult(result);
    setShowCoinToss(true);
  }

  function handleCoinTossEnd() {
    setShowCoinToss(false);
    // Swap sides if the coin result differs from current role
    if (coinResult && coinResult !== myRole) {
      swapSides();
    }
  }

  function handleLeave() {
    leaveRoom().then(() => navigate('/'));
  }

  const game = roomState?.game;
  const isPlayer = myRole === 'black' || myRole === 'white';
  const isMyTurn = game && isPlayer &&
    ((myRole === 'black' && game.currentTurn === BLACK) ||
     (myRole === 'white' && game.currentTurn === WHITE));
  const canStart = isPlayer && roomState?.players[BLACK] && roomState?.players[WHITE] &&
    (!game || game.status === 'finished');

  return (
    <div className="room-page">
      <header className="room-header">
        <button className="btn btn-back" onClick={handleLeave}>&#8592; 戻る</button>
        <h2>Room {roomId}</h2>
        {isPlayer && (!game || game.status !== 'playing') && (
          <button className="btn btn-small" onClick={() => setShowSettings(true)}>&#9881;</button>
        )}
      </header>

      {!isPlayer && <SpectatorBadge />}

      <GameInfo
        roomState={roomState}
        myRole={myRole}
        timers={timers}
        disconnectedPlayer={disconnectedPlayer}
      />

      <div className="board-container">
        <Board
          board={game?.board}
          validMoves={isMyTurn ? game?.validMoves : []}
          lastFlipped={lastFlipped}
          lastMove={lastMove}
          meisterData={meisterActive ? meisterData : null}
          onCellClick={handleCellClick}
        />
      </div>

      {meisterActive && (
        <MeisterOverlay data={meisterData} analyzing={analyzing} />
      )}

      <div className="room-actions">
        {canStart && (
          <>
            <button className="btn btn-primary" onClick={handleStartGame}>
              ゲーム開始
            </button>
            <button className="btn" onClick={handleSwap}>先後交替</button>
            <button className="btn" onClick={handleCoinToss}>コイントス</button>
          </>
        )}
      </div>

      {showResult && game?.status === 'finished' && game.result && (
        <GameResult
          result={game.result}
          userName={userName}
          onClose={() => setShowResult(false)}
        />
      )}

      {showSettings && (
        <RoomSettingsModal
          settings={roomState?.settings}
          onSave={(s) => { updateSettings(s); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showCoinToss && (
        <CoinToss result={coinResult} onEnd={handleCoinTossEnd} />
      )}
    </div>
  );
}
