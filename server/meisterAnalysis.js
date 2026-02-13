const {
  EMPTY, BLACK, WHITE,
  getValidMoves, getFlips, applyMove, countPieces, isGameOver, opponent,
} = require('./gameLogic');

// Positional weights - corners are highly valuable
const POSITION_WEIGHTS = [
  [100, -20,  10,   5,   5,  10, -20, 100],
  [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [ 10,  -2,   1,   1,   1,   1,  -2,  10],
  [  5,  -2,   1,   0,   0,   1,  -2,   5],
  [  5,  -2,   1,   0,   0,   1,  -2,   5],
  [ 10,  -2,   1,   1,   1,   1,  -2,  10],
  [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [100, -20,  10,   5,   5,  10, -20, 100],
];

function evaluate(board, color) {
  const opp = opponent(color);
  const pieces = countPieces(board);
  const totalPieces = pieces.black + pieces.white;
  const myPieces = color === BLACK ? pieces.black : pieces.white;
  const oppPieces = color === BLACK ? pieces.white : pieces.black;

  // Endgame: pure piece count
  if (totalPieces > 55) {
    return (myPieces - oppPieces) * 10;
  }

  // Positional score
  let posScore = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === color) posScore += POSITION_WEIGHTS[r][c];
      else if (board[r][c] === opp) posScore -= POSITION_WEIGHTS[r][c];
    }
  }

  // Mobility score
  const myMoves = getValidMoves(board, color).length;
  const oppMoves = getValidMoves(board, opp).length;
  const mobilityScore = (myMoves - oppMoves) * 5;

  // Corner control
  let cornerScore = 0;
  const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
  for (const [r, c] of corners) {
    if (board[r][c] === color) cornerScore += 25;
    else if (board[r][c] === opp) cornerScore -= 25;
  }

  return posScore + mobilityScore + cornerScore;
}

function minimax(board, color, depth, alpha, beta, maximizing, originalColor) {
  if (depth === 0 || isGameOver(board)) {
    return { score: evaluate(board, originalColor), move: null };
  }

  const currentColor = maximizing ? originalColor : opponent(originalColor);
  const moves = getValidMoves(board, currentColor);

  if (moves.length === 0) {
    // Pass turn
    const result = minimax(board, color, depth - 1, alpha, beta, !maximizing, originalColor);
    return { score: result.score, move: null };
  }

  let bestMove = moves[0];

  if (maximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      const result = applyMove(board, currentColor, move.row, move.col);
      if (!result) continue;
      const { score } = minimax(result.board, color, depth - 1, alpha, beta, false, originalColor);
      if (score > maxScore) {
        maxScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      const result = applyMove(board, currentColor, move.row, move.col);
      if (!result) continue;
      const { score } = minimax(result.board, color, depth - 1, alpha, beta, true, originalColor);
      if (score < minScore) {
        minScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return { score: minScore, move: bestMove };
  }
}

const CORNERS = [[0, 0], [0, 7], [7, 0], [7, 7]];

// Cells adjacent to corners (diagonal = X-squares, edge-adjacent = C-squares)
const CORNER_ADJACENT = {
  '0,0': [[0, 1], [1, 0], [1, 1]],
  '0,7': [[0, 6], [1, 7], [1, 6]],
  '7,0': [[6, 0], [7, 1], [6, 1]],
  '7,7': [[6, 7], [7, 6], [6, 6]],
};

function isCorner(row, col) {
  return (row === 0 || row === 7) && (col === 0 || col === 7);
}

function isEdge(row, col) {
  return row === 0 || row === 7 || col === 0 || col === 7;
}

function generateReasons(board, color, move, resultBoard) {
  const reasons = [];
  const { row, col } = move;
  const opp = opponent(color);
  const totalPieces = countPieces(board);
  const total = totalPieces.black + totalPieces.white;

  // Corner capture
  if (isCorner(row, col)) {
    reasons.push('角を確保！最も安定した位置です');
  }

  // Adjacent to corner (dangerous)
  for (const [cornerKey, adjacents] of Object.entries(CORNER_ADJACENT)) {
    const [cr, cc] = cornerKey.split(',').map(Number);
    // Only warn if the corner is still empty
    if (board[cr][cc] !== EMPTY) continue;
    for (const [ar, ac] of adjacents) {
      if (ar === row && ac === col) {
        reasons.push('角の隣は危険！相手に角を取られやすくなります');
        break;
      }
    }
    if (reasons.some(r => r.includes('角の隣'))) break;
  }

  // Edge capture (not corner, not corner-adjacent negative)
  if (!isCorner(row, col) && isEdge(row, col) && POSITION_WEIGHTS[row][col] > 0) {
    reasons.push('辺を確保。安定した石になりやすいです');
  }

  // Flip count
  const flips = getFlips(board, color, row, col);
  if (flips.length > 0) {
    reasons.push(`${flips.length}枚裏返せます`);
  }

  // Mobility analysis
  const myMovesBefore = getValidMoves(board, color).length;
  const oppMovesAfter = getValidMoves(resultBoard, opp).length;
  if (oppMovesAfter <= 3) {
    reasons.push(`相手の選択肢を${oppMovesAfter}手に制限できます`);
  } else {
    const myMovesAfter = getValidMoves(resultBoard, color).length;
    if (myMovesAfter < myMovesBefore - 1) {
      reasons.push(`自分の手が減ります（${myMovesBefore}手→${myMovesAfter}手）`);
    }
  }

  // Giving opponent a corner
  const oppMovesAfterList = getValidMoves(resultBoard, opp);
  const givesCorner = oppMovesAfterList.some(m => isCorner(m.row, m.col));
  if (givesCorner) {
    reasons.push('この手は相手に角を与えてしまいます');
  }

  // Endgame: piece count matters
  if (total >= 55) {
    const afterPieces = countPieces(resultBoard);
    const myAfter = color === BLACK ? afterPieces.black : afterPieces.white;
    const oppAfter = color === BLACK ? afterPieces.white : afterPieces.black;
    const diff = myAfter - oppAfter;
    if (diff > 0) {
      reasons.push(`終盤は石の数が重要。${diff}枚多く取れます`);
    }
  }

  // Limit to 3 reasons
  return reasons.slice(0, 3);
}

function analyzeMoves(board, color, depth = 4) {
  const moves = getValidMoves(board, color);
  if (moves.length === 0) return { bestMove: null, analysis: [], evaluation: 0 };

  const analysis = moves.map(move => {
    const result = applyMove(board, color, move.row, move.col);
    if (!result) return { move, score: -Infinity, reasons: [] };
    const { score } = minimax(result.board, color, depth - 1, -Infinity, Infinity, false, color);
    const reasons = generateReasons(board, color, move, result.board);
    return { move, score, reasons };
  });

  analysis.sort((a, b) => b.score - a.score);

  const bestScore = analysis[0].score;
  const worstScore = analysis[analysis.length - 1].score;

  const classified = analysis.map((item, index) => {
    let rank;
    if (index === 0) rank = 'best';
    else if (item.score === bestScore) rank = 'best';
    else if (item.score <= worstScore) rank = 'worst';
    else rank = 'normal';
    return { ...item, rank };
  });

  // Overall position evaluation
  const overallScore = evaluate(board, color);
  let evaluation;
  if (overallScore > 20) evaluation = 'advantage';
  else if (overallScore < -20) evaluation = 'disadvantage';
  else evaluation = 'even';

  return {
    bestMove: classified[0].move,
    analysis: classified,
    evaluation,
    overallScore,
  };
}

module.exports = { analyzeMoves, evaluate };
