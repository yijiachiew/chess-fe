//TODO: Implement scenario where the king is in check
//TODO: Implement scenario where the game is a draw
//TODO: Implement Castling
//Implement Turn shifts
//TODO: Implement button to reset the board
import React from "react";
import { useState } from "react";
import { ChessPiece, RenderChessPiece, getAvailableMoves, checkValidMove, PieceType, Player ,isCheckmate,canCastle} from "./chesspiece";
import Button from "./button";
import { bestMove } from "./ChessAi";
// API to send to backend
const API_URL = "http://127.0.0.1:8000";

// Renders the entire chessboard
const RenderChessBoard = () => {
    //initial state for the chess pieces
    const testPieces:ChessPiece[] = [
        //{id:"kingb",x:0,y:7,type:'king',player:'black'},
        //{id:"kingw",x:2,y:3,type:'king',player:'white'},
 //
        //{id:"rookw1",x:3,y:0,type:'rook',player:'white'},
        //{id:"rookw2",x:1,y:5,type:'rook',player:'white'},
        ...Array.from({length: 8}, (_,i) => ({id:`pawnw${i}`,x:i,y:6,type:'pawn' as PieceType,player:'white' as Player})),
        {id:"rookw1",x:0,y:7,type:'rook',player:'white'},
        {id:"rookw2",x:7,y:7,type:'rook',player:'white'},
        {id:"kingw",x:4,y:7,type:'king',player:'white'},
        {id:"kingb",x:4,y:0,type:'king',player:'black',haveMoved:false},
        {id:"rookb1",x:0,y:0,type:'rook',player:'black',haveMoved:false},
        {id:"rookb2",x:7,y:0,type:'rook',player:'black',haveMoved:false},
    ]
    const initialPieces:ChessPiece[] = [
        //White pieces
        ...Array.from({length: 8}, (_,i) => ({id:`pawnw${i}`,x:i,y:6,type:'pawn' as PieceType,player:'white' as Player})),
        {id:"rookw1",x:0,y:7,type:'rook',player:'white'},
        {id:"rookw2",x:7,y:7,type:'rook',player:'white'},
        {id:"knightw1",x:1,y:7,type:'knight',player:'white'},
        {id:"knightw2",x:6,y:7,type:'knight',player:'white'},
        {id:"bishopw1",x:2,y:7,type:'bishop',player:'white'},
        {id:"bishopw2",x:5,y:7,type:'bishop',player:'white'},
        {id:"queenw",x:3,y:7,type:'queen',player:'white'},
        {id:"kingw",x:4,y:7,type:'king',player:'white'},
        //Black pieces
        ...Array.from({length: 8}, (_,i) => ({id:`pawnb${i}`,x:i,y:1,type:'pawn' as PieceType,player:'black' as Player})),
        {id:"rookb1",x:0,y:0,type:'rook',player:'black'},
        {id:"rookb2",x:7,y:0,type:'rook',player:'black'},
        {id:"knightb1",x:1,y:0,type:'knight',player:'black'},
        {id:"knightb2",x:6,y:0,type:'knight',player:'black'},
        {id:"bishopb1",x:2,y:0,type:'bishop',player:'black'},
        {id:"bishopb2",x:5,y:0,type:'bishop',player:'black'},
        {id:"queenb",x:3,y:0,type:'queen',player:'black'},
        {id:"kingb",x:4,y:0,type:'king',player:'black'},
    ]
    //TODO: Create the initial state for the chess pieces
    const [pieces,setPieces] = useState<ChessPiece[]>([...initialPieces])
    const [availableMoves,setAvailableMoves] = useState<{x:number,y:number}[]>([]);
    // Previous state of the board
    const [previousState,setPreviousState] = useState<ChessPiece[]>([]);
    //Player turn
    const [playerTurn,setPlayerTurn] = useState<Player>('white');
    //Previous player turn
    const [previousPlayerTurn,setPreviousPlayerTurn] = useState<Player>('black');


    // Handles the drag event when a piece is picked up
    //TODO: Implement possible moves shown on the board
    const handleDragStart = (e:React.DragEvent,id:string) => {
        console.log(id)
        
        const piece = pieces.find((p) => p.id === id);
        if (!piece || piece.player !== playerTurn) {
            console.log("Piece not found");
            return;
        }
        e.dataTransfer.setData("PieceId", id);
        setAvailableMoves(getAvailableMoves(piece,pieces));

        
    }

    // Handles the drop event after a piece is placed on the board
    //TODO: Implement the logic for blocked moves
    //TODO: Implement the logic for capturing pieces
    const handleDrop = (e:React.DragEvent,x:number,y:number) => {
        e.preventDefault();
        const pieceId = e.dataTransfer.getData("PieceId");
        
        //find the piece that is being moved
        const piece = pieces.find((p) => p.id === pieceId);
        if (!piece) {
            console.log("Piece not found");
            return;
        }
        piece.haveMoved = true;
        
        //Check if the move is valid
        //Check if the move is in the available moves
        if (!availableMoves.some((m) => m.x === x && m.y === y)) {
            console.log("Invalid Move");
            return;
        }
        // Save the previous state of the board
        setPreviousState([...pieces]);
        const targetPiece = pieces.find((p) => p.x === x && p.y === y);
        // Updates the piece's position
        setPieces((pieces) =>
            pieces
            .filter((p) => p.id !== targetPiece?.id)
            .map((p) => {
            if (p.id === pieceId) {
                return { ...p, x, y };
            }
            return p;
            })
        );
        //Check if the move is a castling move
        if (piece.type === 'king' && Math.abs(piece.x - x) === 2) {
            //Find the rook
            const rook = pieces.find((p) => p.type === 'rook' && p.player === piece.player && ((p.x === 0 && x === 2)||( p.x === 7 && x === 6)));
            console.log(rook);
            if (rook) {
                //Move the rook
                const newRookX = x === 2 ? 3 : 5;
                setPieces((pieces) => pieces.map((p) => {
                    if (p.id === rook.id) {
                        return {...p, x: newRookX};
                    }
                    return p;
                }));
            }
        }
        //Change the player turn
        setPlayerTurn(playerTurn === 'white' ? 'black' : 'white');
        setPreviousPlayerTurn(playerTurn);
        //Check if the game is over
        //Reset the available moves
        setAvailableMoves([]);
    }
    //HandleDrop event but for the AI
    const handleDropAi = (e:React.DragEvent,x:number,y:number) => {
        e.preventDefault();
        const pieceId = e.dataTransfer.getData("PieceId");
        
        //find the piece that is being moved
        const piece = pieces.find((p) => p.id === pieceId);
        if (!piece) {
            console.log("Piece not found");
            return;
        }
        piece.haveMoved = true;
        
        //Check if the move is valid
        //Check if the move is in the available moves
        if (!availableMoves.some((m) => m.x === x && m.y === y)) {
            console.log("Invalid Move");
            return;
        }
        // Save the previous state of the board
        setPreviousState([...pieces]);
        const targetPiece = pieces.find((p) => p.x === x && p.y === y);
        // Create a new set of pieces with updated positions
        const newPieces = pieces.filter((p) => p.id !== targetPiece?.id).map((p) => {
            if (p.id === pieceId) {
                return { ...p, x, y };
            }
            return p;
        });
        // Updates the piece's position
        setPieces(newPieces);
        //Check if the move is a castling move
        if (piece.type === 'king' && Math.abs(piece.x - x) === 2) {
            //Find the rook
            const rook = pieces.find((p) => p.type === 'rook' && p.player === piece.player && ((p.x === 0 && x === 2)||( p.x === 7 && x === 6)));
            console.log(rook);
            if (rook) {
                //Move the rook
                const newRookX = x === 2 ? 3 : 5;
                setPieces((pieces) => pieces.map((p) => {
                    if (p.id === rook.id) {
                        return {...p, x: newRookX};
                    }
                    return p;
                }));
            }
        }
        setTimeout(() => {
            makeAiMove(newPieces);
        },300);
        //Change the player turn
        //setPlayerTurn(playerTurn === 'white' ? 'black' : 'white');
        setPreviousPlayerTurn(playerTurn);
        //Check if the game is over
        //Reset the available moves
        setAvailableMoves([]);
    }
    // Pieces cannot be dragged over the board
    const handleDragOver = (e:React.DragEvent) => {
        e.preventDefault();
    }
    //Automated move madde by the AI
    const makeAiMove = (newPieces:ChessPiece[]) => {
       // console.log(playerTurn);
        const move = bestMove(newPieces,3,"black");
        if (move) {
            //console.log(move);
            const targetPiece = newPieces.find((p) => p.x === move.x && p.y === move.y);
            setPieces((pieces) => pieces.filter((p) => p.id !== targetPiece?.id)
            .map((p) => {
                if (p.id === move.piece.id) {
                    return {...p,x:move.x,y:move.y};
                }
                return p;
            }));
            console.log(targetPiece);
            //setPlayerTurn(playerTurn === 'white' ? 'black' : 'white');
    }
    //setPlayerTurn(playerTurn === 'white' ? 'black' : 'white');
    }
    const handleReset = () => {
        setPieces([...initialPieces]);
        
    }
    
    //TODO: Implement button to revert the last move
    const handleUndo = () => {
        setPieces([...previousState]);
        //If the player has already moved, revert the turn
        setPlayerTurn(previousPlayerTurn);
    }
    
    
    return (
        <div>
            <div>
                {isCheckmate(playerTurn,pieces) && <h1>{playerTurn === "black" ? "white":"black"} Player Wins</h1>}
            </div>
            <div className="turn">
                <h2
                style={
                    {
                        color: playerTurn === "white" ? "#89CFF0" : "#FFCCCB",
                    }
                }>{playerTurn === "white" ? "Blue's Turn": "Red's Turn"}</h2>
            </div>
            <div 
                className="chessboard">
                {
                Array.from({length: 8}).map((_,i) => 
                    Array.from({length: 8}).map((_,j) => {
                        // Check if the square is black or white
                        const isBlack = (i + j) % 2 === 1;
                        // Checks if there is a piece at the current square
                        const piece = pieces.find((p) => p.x === j && p.y === i);
                        // Check if there is some available moves for the piece
                        const isAvailableMove = availableMoves.some((m) => m.x === j && m.y === i);
                        //console.log(isAvailableMove)
                        return (
                            <div
                                key={`${j}-${i}`}
                                className="square"
                                style={{
                                    backgroundColor: isBlack ? "black" : "white",
                                }}
                                /**Handles the drop event here */
                                onDrop={(e) => handleDropAi(e, j, i)
                                }
                                onDragOver={handleDragOver}
                            >
                                {isAvailableMove && <div 
                                //Render the available moves
                                style={{
                                    width: "20px",
                                    height: "20px",
                                    backgroundColor: "green",
                                    borderRadius: "50%",
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",

                                }}
                                ></div>}
                                {piece && (
                                    <RenderChessPiece
                                        id={piece.id}
                                        type={piece.type}
                                        player={piece.player}
                                        onDragStart={handleDragStart}
                                    />
                                )}

                            </div>
                        );
                    })

                    )}          
            </div>
            <Button text="Reset" onClick={handleReset}/>
            <Button text="Undo" onClick={handleUndo}/>
        </div>
    )

}


export default RenderChessBoard;