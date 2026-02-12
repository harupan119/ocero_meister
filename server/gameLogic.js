// Othello game logic - pure functions

const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

function createInitialBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(EMPTY));
  board[3][3] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][4] = WHITE;
  return board;
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function opponent(color) {
  return color === BLACK ? WHITE : BLACK;
}

function getFlips(board, color, row, col) {
  if (board[row][col] !== EMPTY) return [];
  const opp = opponent(color);
  const allFlips = [];

  for (const [dr, dc] of DIRECTIONS) {
    const flips = [];
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c) && board[r][c] === opp) {
      flips.push([r, c]);
      r += dr;
      c += dc;
    }
    if (flips.length > 0 && inBounds(r, c) && board[r][c] === color) {
      allFlips.push(...flips);
    }
  }
  return allFlips;
}

function getValidMoves(board, color) {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (getFlips(board, color, r, c).length > 0) {
        moves.push({ row: r, col: c });
      }
    }
  }
  return moves;
}

function applyMove(board, color, row, col) {
  const flips = getFlips(board, color, row, col);
  if (flips.length === 0) return null;

  const newBoard = board.map(r => [...r]);
  newBoard[row][col] = color;
  for (const [fr, fc] of flips) {
    newBoard[fr][fc] = color;
  }
  return { board: newBoard, flipped: flips };
}

function countPieces(board) {
  let black = 0;
  let white = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === BLACK) black++;
      else if (board[r][c] === WHITE) white++;
    }
  }
  return { black, white };
}

function isGameOver(board) {
  return (
    getValidMoves(board, BLACK).length === 0 &&
    getValidMoves(board, WHITE).length === 0
  );
}

function getWinner(board) {
  const { black, white } = countPieces(board);
  if (black > white) return BLACK;
  if (white > black) return WHITE;
  return null; // draw
}

module.exports = {
  EMPTY,
  BLACK,
  WHITE,
  createInitialBoard,
  getValidMoves,
  getFlips,
  applyMove,
  countPieces,
  isGameOver,
  getWinner,
  opponent,
};
