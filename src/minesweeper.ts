import {times, range} from "lodash/fp"

type TileStatus = typeof TILE_STATUSES[number];

type Position = {
    x: number;
    y: number;
}

type Tile = Position & {
    mine: boolean;
    status: TileStatus;
}

type Board = Tile[][];

export const TILE_STATUSES = ["hidden", "mine", "number", "marked"] as const;

export function createBoard(boardSize: number, minePositions: Position[]):Board {
    return times(x => {
        return times(y => {
            return {
                x,
                y,
                mine: minePositions.some(minePos => {
                    positionMatch(minePos, {x, y})
                }),
                status: "hidden",
            }
        }, boardSize)
    }, boardSize)
}

export function markedTilesCount(board:Board) {
    return board.reduce((count, row) => {
        return (
            count + row.filter(tile => tile.status === "marked").length
        )
    }, 0)
}

export function markTile(board: Board, {x, y}: Position) {
    const tile = board[x][y]
    if (
        tile.status !== "hidden" &&
        tile.status !== "marked"
    ) {
        return board
    }

    if (tile.status === "marked") {
        return replaceTile(
            board,
            {x, y},
            {...tile, status: "hidden"}
        )
    } else {
        return replaceTile(
            board,
            {x, y},
            {...tile, status: "marked"}
        )
    }
}

function replaceTile(board, position, newTile) {
    return board.map((row, x) => {
        return row.map((tile, y) => {
            if (positionMatch(position, {x, y})) {
                return newTile
            }
            return tile
        })
    })
}

export function revealTile(board, {x, y}) {
    const tile = board[x][y]
    if (tile.status !== "hidden") {
        return board
    }

    if (tile.mine) {
        return replaceTile(board, {x, y}, {...tile, status: TILE_STATUSES.MINE})
    }

    const adjacentTiles = nearbyTiles(board, tile)
    const mines = adjacentTiles.filter(t => t.mine)
    const newBoard = replaceTile(
        board,
        {x, y},
        {...tile, status: TILE_STATUSES.NUMBER, adjacentMinesCount: mines.length}
    )
    if (mines.length === 0) {
        return adjacentTiles.reduce((b, t) => {
            return revealTile(b, t)
        }, newBoard)
    }
    return newBoard
}

export function checkWin(board) {
    return board.every(row => {
        return row.every(tile => {
            return (
                tile.status === TILE_STATUSES.NUMBER ||
                (tile.mine &&
                    (tile.status === "hidden" ||
                        tile.status === "marked"))
            )
        })
    })
}

export function checkLose(board) {
    return board.some(row => {
        return row.some(tile => {
            return tile.status === TILE_STATUSES.MINE
        })
    })
}

export function positionMatch(a: Position, b: Position) {
    return a.x === b.x && a.y === b.y
}

function nearbyTiles(board, {x, y}) {
    const offsets = range(-1, 2)

    return offsets
        .flatMap(xOffset => {
            return offsets.map(yOffset => {
                return board[x + xOffset]?.[y + yOffset]
            })
        })
        .filter(tile => tile != null)
}
