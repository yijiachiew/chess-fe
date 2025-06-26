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
            // Id should be in the rank + file format
            //White pieces
            ...Array.from({length: 8}, (_,i) => ({id:`${String.fromCharCode(97+i)}2`,x:i,y:6,type:'pawn' as PieceType,player:'white' as Player})),
            {id:"a1",x:0,y:7,type:'rook',player:'white'},
            {id:"h1",x:7,y:7,type:'rook',player:'white'},
            {id:"b1",x:1,y:7,type:'knight',player:'white'},
            {id:"g2",x:6,y:7,type:'knight',player:'white'},
            {id:"c1",x:2,y:7,type:'bishop',player:'white'},
            {id:"f1",x:5,y:7,type:'bishop',player:'white'},
            {id:"d1",x:3,y:7,type:'queen',player:'white'},
            {id:"e1",x:4,y:7,type:'king',player:'white'},
            //Black pieces
            ...Array.from({length: 8}, (_,i) => ({id:`${String.fromCharCode(97+i)}7`,x:i,y:1,type:'pawn' as PieceType,player:'black' as Player})),
            {id:"a8",x:0,y:0,type:'rook',player:'black'},
            {id:"h8",x:7,y:0,type:'rook',player:'black'},
            {id:"b8",x:1,y:0,type:'knight',player:'black'},
            {id:"g8",x:6,y:0,type:'knight',player:'black'},
            {id:"c8",x:2,y:0,type:'bishop',player:'black'},
            {id:"f8",x:5,y:0,type:'bishop',player:'black'},
            {id:"d8",x:3,y:0,type:'queen',player:'black'},
            {id:"e8",x:4,y:0,type:'king',player:'black'},
        ]
        //Toggle gamemode of the chessboard
        const [gameMode,setGameMode] = useState<"pvp"|"ai">("pvp");

        const [pieces,setPieces] = useState<ChessPiece[]>([...initialPieces])
        const [availableMoves,setAvailableMoves] = useState<{x:number,y:number}[]>([]);
        //Player turn
        const [playerTurn,setPlayerTurn] = useState<Player>('white');
        const [isCheckmate,setIsCheckmate] = useState<boolean>(false);
        const [isStalemate,setIsStalemate] = useState<boolean>(false);
        const [isCheck,setIsCheck] = useState<boolean>(false);
        const [isGameOver,setIsGameOver] = useState<boolean>(false);
        //Handles the drag event
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
    async function postStates(move:string,promotion?:string){
        try {
            console.log("Posting move: " + JSON.stringify({move_uci:move,promotion:null}));
            const payload = {
                move_uci: move,
                promotion: promotion || null
            }
            const res = await axios.post(`${API_URL}/move/`, payload);
                
        
        // Check if the response indicates a promotion is needed
        if (res.data.promotionNeeded){
            console.log("Promotion needed");
            const pieceChoice = await handlePromotion();
            postStates(move,pieceChoice);
            return;
        }

        const newState:GameState = res.data;
        updateGameState(newState);

        } catch (err) {
        console.log("Error at postStates");
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
            
            const newPieces:ChessPiece[] = newState.pieces.map((p:ChessPiece) => {
                return {id:p.id,x:p.x,y:p.y,type:p.type,player:p.player};
            });
            
            setPieces(newPieces);
           
            
            setPlayerTurn(newState.playerTurn);
            console.log(newState.playerTurn);
            

        }
        catch (err) {
            console.log("Error");
        }
    }
    // Reset the board to the initial state
    async function resetBoard() {
        try {
            const res = await axios.post(`${API_URL}/reset`);
            console.log("reset");
        }
        catch (err) {
            console.log("Error");
        }
    }
    // Undo the last move
    async function undoMove() {
        try {
            const res = await axios.post(`${API_URL}/undo`,{
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const newState:GameState = res.data;
            updateGameState(newState);
            
        }
        catch (err) {
            console.log("Error");
        }
    }
    async function setMode(mode:"pvp"|"ai") {
        setGameMode(mode);
        try {
            const res = await axios.post(`${API_URL}/set_game_mode`, { mode: mode });
            console.log("Game mode set to: " + mode);
        } catch (err) {
            console.log("Error setting game mode");
        }
    }
    function updateGameState(newState:GameState) {
        console.log(newState);
        // Convert from the python dict to a list of ChessPieces
        
        const newPieces:ChessPiece[] = newState.pieces.map((p:ChessPiece) => {
            return {id:p.id,x:p.x,y:p.y,type:p.type,player:p.player};
        });
        
        setPieces(newPieces);
        setPlayerTurn(newState.playerTurn);
        setIsCheckmate(newState.isCheckmate);
        setIsStalemate(newState.isStalemate);
        setIsCheck(newState.isCheck);
        setIsGameOver(newState.isCheckmate || newState.isStalemate);
        console.log(newState.playerTurn);
    }
    // Convert the index position of the square to the chess notation in UCI
    function indexToSquare(xIndex:number,yIndex:number):string {
        const file = String.fromCharCode(97 + xIndex);
        const rank = (8 - yIndex).toString();
        //console.log(file + rank);
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
            //fetchStates();
            setAvailableMoves([]);
        }
    // Handle promotion prompt 
    const handlePromotion = async (): Promise<string> => {
        const piece = window.prompt("Promote your pawn to (q for queen, r for rook, b for bishop, n for knight):", "q");
        return piece ? piece.toLowerCase() : "q"; // Default to queen if no input
    }
    // Pieces cannot be dragged over the board
    const handleDragOver = (e:React.DragEvent) => {
        e.preventDefault();
    }
    // Reset the board to the initial state
    const handleReset = () => {
        setPieces([...initialPieces]);
        setPlayerTurn('white');
        resetBoard();
    }
    //Undo the last move
    const handleUndo = () => {
        console.log("Undo");
        undoMove();
    }
    const setToPvp = () => {
        setMode("pvp");
        resetBoard();
    }
    const setToAi = () => {
        setMode("ai");
        resetBoard();
    }
    return (
    <div>
        <div className="turn">
        <h2>
            {isCheckmate ? `${playerTurn === "white" ? "Red" : "Blue"} wins by Checkmate!` : isStalemate ? "Stalemate!" : isCheck ? "Check!" : isGameOver ? "Game Over!" : ""}
        </h2>
        <h2>
            {isGameOver ? "Game Over!" : (
                <span style={{ color: playerTurn === "white" ? "#89CFF0" : "#FFCCCB" }}>
                    {playerTurn === "white" ? "Blue's Turn" : "Red's Turn"}
                </span>
            )}
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
        <div className="gamemode">
            <Button text="PvP" onClick={setToPvp}/>
            <Button text="AI" onClick={setToAi}/>
            /</div>
        
    </div>
    )
}
export default RenderChessBoardNew;