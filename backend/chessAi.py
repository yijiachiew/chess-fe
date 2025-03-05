from fastapi import FastAPI
import chess
import chess.engine
from fastapi.middleware.cors import CORSMiddleware

# TO RUN THE PROGRAM : py -m uvicorn chessAi:app --reload
app = FastAPI()
# configure the CORS middleware to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
board = chess.Board()

board = chess.Board() # create a game state instance
# return a state of the board
@app.get("/board")
def get_board() -> dict:
    return {
        "board": board.fen(),
        "turn": "white" if board.turn == chess.WHITE else "black",
        "checkmate": board.is_checkmate(),
        "stalemate": board.is_stalemate(),
        "check": board.is_check(),
        "is_stalemate": board.is_stalemate(),
        "is_game_over": board.is_game_over(),
        "result": board.result() if board.is_game_over() else None,
        "pieces": get_pieces()
    }

@app.post("/move/{move}") 
def make_move(move: str):
    move = chess.Move.from_uci(move)
    board.push(move)


@app.post("/reset")
def reset_board():
    board.reset()
    return board.fen()

@app.post("/undo")
def undo_move():
    board.pop()
    return board.fen()

# convert the coordinates to a square
def convert_to_square(x:int, y:int):
    return chess.square(x, 7 - y)

# convert a square in a board to coordinates
def convert_to_coordinates(square):
    return chess.square_file(square), 7 - chess.square_rank(square)

@app.get("/piece_at_square/{x}/{y}")
def get_piece_at_square(x:str, y:str):
    return board.piece_at(convert_to_square(int(x), int(y)))

# get a list of moves in coordinates based to on a square
@app.get("/legal_moves/{square}")
def get_legal_moves(square:str) -> list[tuple]:
    return [convert_to_coordinates(move.to_square) for move in board.legal_moves if move.from_square == chess.parse_square(square)]

def update_board(uci_move:str):
    board.push_uci(uci_move)
# Return a list of pieces on the board containing the position of each piece and each type
def get_pieces():
    return [
        {
            "square": chess.square_name(square),
            "rank": chess.square_rank(square),
            "file": chess.square_file(square),
            "type": piece.symbol(),
            "colour" : piece.color
        }
        for square, piece in board.piece_map().items()
    ]