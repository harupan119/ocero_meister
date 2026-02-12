const {
  EMPTY, BLACK, WHITE,
  getValidMoves, applyMove, countPieces, isGameOver, opponent,
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

function analyzeMoves(board, color, depth = 4) {
  const moves = getValidMoves(board, color);
  if (moves.length === 0) return { bestMove: null, analysis: [], evaluation: 0 };

  const analysis = moves.map(move => {
    const result = applyMove(board, color, move.row, move.col);
    if (!result) return { move, score: -Infinity };
    const { score } = minimax(result.board, color, depth - 1, -Infinity, Infinity, false, color);
    return { move, score };
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
