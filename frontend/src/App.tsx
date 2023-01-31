import { ReactElement, useState } from 'react';

interface SquareProps {
  value: string | null;
  onSquareClick: () => void;
}

function Square({ value, onSquareClick }: SquareProps): ReactElement {
  return (
    <button onClick={onSquareClick} className="square">{value}</button>
  );
}

function Board(): ReactElement {
  const [gameStatus, setGameStatus] = useState('Next player: X');
  const [nextMove, setNextMove] = useState('X');
  const [squares, setSquares] = useState(Array(9).fill(null));

  const handleClick = function (i: number) {
    if (squares[i] !== null || calculateWinner(squares)) {
      return;
    }
    const nextValue = squares.slice(); // Slice() = shallow copy the array, so that setValue() actually does something, otherwise setValue() is noop.
    nextValue[i] = nextMove;

    if (nextMove === 'X') {
      setNextMove('O');
    } else {
      setNextMove('X');
    }

    setSquares(nextValue); // setValue() causes the Element and its children to be redrawn with the new state

    const winner = calculateWinner(nextValue);
    if (winner) {
      setGameStatus(`The winner is ${winner}`);
    } else {
      setGameStatus(`Next player: ${nextMove === 'X' ? 'O' : 'X'}`);
    }
  }

  return (
    <>
      <span className="game-info">{gameStatus}</span>
      <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div>
    </>
  )
}


function calculateWinner(squares: string|null[]) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

export default Board;