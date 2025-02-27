from fastapi import FastAPI
import chess
import chess.engine


app = FastAPI()
board = chess.Board()

