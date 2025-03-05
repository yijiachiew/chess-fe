// New script for the chessboard but uses backend server for game logic
import React from "react";
import { useState } from "react";
import { ChessPiece, RenderChessPiece, PieceType, Player} from "./chesspiece";
import Button from "./button";
import axios from "axios";
// API to send to backend
const API_URL = "http://127.0.0.1:8000";
type MoveList = [number,number][];

interface GameState {
    pieces:ChessPiece[];
    playerTurn:Player;
    isCheckmate:boolean;
    isStalemate:boolean;
    isCheck:boolean;
}
const RenderChessBoardNew = () => {
    const initialPieces:ChessPiece[] = [
            // Id not used for this implementation
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
        const [pieces,setPieces] = useState<ChessPiece[]>([...initialPieces])
        const [availableMoves,setAvailableMoves] = useState<{x:number,y:number}[]>([]);
        //Player turn
        const [playerTurn,setPlayerTurn] = useState<Player>('white');
        const handleDragStart = (e:React.DragEvent,id:string) => {
                console.log(id)
                
                const piece = pieces.find((p) => p.id === id);
                if (!piece || piece.player !== playerTurn) {
                    console.log("Piece not found");
                    return;
                }
                e.dataTransfer.setData("PieceId", id);
                
                //getPiece(piece);
                //getMoves(piece);
                const legalMoves = getMoves(piece).then((moves) => {
                    setAvailableMoves(moves);
                });
        
                
            }
        //Fetches the available moves for the piece
    async function getMoves(piece:ChessPiece):Promise<{x:number,y:number}[]> {
        const currentSquare = indexToSquare(piece.x,piece.y);
        try {
            const res = await axios.get(`${API_URL}/legal_moves/${currentSquare }`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.data) {
                console.log("No data");
                return [];

            }
            //Convert the Promise into a list of moves
            const moves:MoveList = res.data;
            console.log(moves);
            return moves.map((m) => {
                return {x:m[0],y:m[1]};
            })
        }
        
        catch (err) {
            console.log("Error2");
            return [];
            
        }
    }
    //Post the move to the backend
    async function postStates(move:string){
        try {
            const res = await axios.post(`${API_URL}/move/${move}`,{
                method: "POST",
                headers: { "Content-Type": "application/json" },
                
        });
        console.log(res.data);
        
        

        } catch (err) {
        console.log("Error");
        }
    }
    //Fetches the current state of the board from the backend
    async function fetchStates() {
        try {
            const res =  await axios.get(`${API_URL}/board`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            const newState:GameState = res.data;
            console.log(newState);
            // Convert from the python dict to a list of ChessPieces
            const newPieces: ChessPiece[] = Object.entries(newState.pieces).map(([key, value]) => {
                const {x, y} = squareToIndex(key);
                return {
                    x:x,
                    y:y,
                    id:value.id,
                    type:value.type,
                    player:value.player,
                }
            });
            setPlayerTurn(newState.playerTurn);
            console.log(newState.playerTurn);
            

        }
        catch (err) {
            console.log("Error");
        }
    }
    async function resetBoard() {
        try {
            const res = await axios.post(`${API_URL}/reset`);
            console.log(res.data);
        }
        catch (err) {
            console.log("Error");
        }
    }
    async function undoMove() {
        try {
            const res = await axios.post(`${API_URL}/undo`);
            console.log(res.data);
        }
        catch (err) {
            console.log("Error");
        }
    }
    // Convert the index position of the square to the chess notation in UCI
    function indexToSquare(xIndex:number,yIndex:number):string {
        const file = String.fromCharCode(97 + xIndex);
        const rank = (8 - yIndex).toString();
        console.log(file + rank);
        return file + rank;
    }
    // Convert the square notation to the index position
    function squareToIndex(square:string):{x:number,y:number} {
        const file = square.charCodeAt(0) - 97;
        const rank = 8 - parseInt(square[1]);
        return {x:file,y:rank};    
    }
    const handleDrop = (e:React.DragEvent,x:number,y:number) => {
            e.preventDefault();
            const pieceId = e.dataTransfer.getData("PieceId");
            const piece = pieces.find((p) => p.id === pieceId);
            if (!piece) {
                console.log("Piece not found");
                return;
            }
            const sourceSquare = indexToSquare(piece.x,piece.y);
            const targetSquare = indexToSquare(x,y);
            //Send the move to the backend
            postStates(`${sourceSquare}${targetSquare}`);
            //Log the current state of the board
            fetchStates();
        }
    // Pieces cannot be dragged over the board
    const handleDragOver = (e:React.DragEvent) => {
        e.preventDefault();
    }
    // Reset the board to the initial state
    const handleReset = () => {
        setPieces([...initialPieces]);
        resetBoard();
    }
    //Undo the last move
    const handleUndo = () => {
    }
    return (
    <div>
        <div className="turn">
            <h2
            style={
                {
                    color: playerTurn === "white" ? "#89CFF0" : "#FFCCCB",
                }
            }>{playerTurn === "white" ? "Blue's Turn": "Red's Turn"}
            </h2>
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
                                        onDrop={(e) => handleDrop(e, j, i)
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
export default RenderChessBoardNew;