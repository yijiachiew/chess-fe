from fastapi import FastAPI
import chess
import chess.engine
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

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

board = chess.Board() # create a game state instance

class MoveRequest(BaseModel):
    move_uci: str  # UCI format move string
    promotion: Optional[str] = None  # Optional promotion piece

# return a state of the board
@app.get("/board")
def get_board() -> dict:
    get_board_status()


def get_board_status(promotion_needed:bool=False) -> dict:
    return {
        "board": board.fen(),
        "playerTurn": "white" if board.turn == chess.WHITE else "black",
        "isCheckmate": board.is_checkmate(),
        "isStalemate": board.is_stalemate(),
        "isCheck": board.is_check(),
        "isGameOver": board.is_game_over(),
        "result": board.result() if board.is_game_over() else None,
        "pieces": get_pieces(),
        "promotionNeeded": promotion_needed
    }
@app.post("/move/") 
def make_move(moveR:MoveRequest) -> dict:
    # check if not a legal move
    if not check_valid_move(moveR.move_uci):
        return {"error": "Invalid move"}
    else:
        print(f"Move received: {moveR.move_uci}, Promotion: {moveR.promotion}")
        move = chess.Move.from_uci(moveR.move_uci)
        # check if the move is a promotion move

        if is_promotion_move(move, board) and moveR.promotion is None:
            print("Promotion move detected without promotion piece specified.")
            return get_board_status(promotion_needed=True)
        
        
        if is_promotion_move(move, board):
            promotion_piece = {
                'q': chess.QUEEN,
                'r': chess.ROOK,
                'b': chess.BISHOP,
                'n': chess.KNIGHT
            }.get(moveR.promotion.lower(), chess.QUEEN)
            move = chess.Move(move.from_square, move.to_square, promotion=promotion_piece)
        board.push(move)
        return get_board_status()
    
def check_valid_move(move:str):
    try:
        new_move = chess.Move.from_uci(move)
        # Check for promotion move
        if is_promotion_move(new_move, board) and new_move.promotion is None:
            print("Promotion move detected without promotion piece specified.")
            return True
        # Check if the move is legal
        if new_move in board.legal_moves:
            return True
        return False
    except:
        #print(f"Invalid move format: {move}")
        return False

@app.post("/reset")
def reset_board():
    board.reset()
    return board.fen()

@app.post("/undo")
def undo_move():
    board.pop()
    return get_board_status()

# convert the coordinates to a square
def convert_to_square(x:int, y:int):
    return chess.square(x, 7 - y)

# convert a square in a board to coordinates
def convert_to_coordinates(square):
    return chess.square_file(square), 7 - chess.square_rank(square)

@app.get("/piece_at_square/{x}/{y}")
def get_piece_at_square(x:str, y:str):
    return board.piece_at(convert_to_square(int(x), int(y)))

def is_promotion_move(move: chess.Move, board: chess.Board) -> bool:
    """Check if a move leads to a promotion of a pawn."""
    print(f"Checking promotion for move: {move}")
    piece = board.piece_at(move.from_square)
    return piece and piece.piece_type == chess.PAWN and chess.square_rank(move.to_square) in (0, 7)

# get a list of moves in coordinates based to on a square
@app.get("/legal_moves/{square}")
def get_legal_moves(square:str) -> list[tuple]:
    return [convert_to_coordinates(move.to_square) for move in board.legal_moves if move.from_square == chess.parse_square(square)]

def update_board(uci_move:str):
    board.push_uci(uci_move)
# Return a list of pieces on the board containing the position of each piece and each type
def get_pieces():
    piece_types = {
        'p': 'pawn', 'r': 'rook', 'n': 'knight', 'b': 'bishop', 'q': 'queen', 'k': 'king',
        'P': 'pawn', 'R': 'rook', 'N': 'knight', 'B': 'bishop', 'Q': 'queen', 'K': 'king'
    }
    return [
        {
            "id": chess.square_name(square),
            "x": chess.square_file(square),
            "y": 7 - chess.square_rank(square),
            "type": piece_types[piece.symbol()],
            "player": "white" if piece.color == chess.WHITE else "black"
        }
        for square, piece in board.piece_map().items()
    ]