import Pawn from "./assets/img/Soldier.png";
import Knight from "./assets/img/Cav.png";
import Rook from "./assets/img/General.png";
import Bishop from "./assets/img/Bishop.png";
import Queen from "./assets/img/Falcon.png";
import King from "./assets/img/Chrom.png";

import Pawn1 from "./assets/img/Soldier1.png";
import Knight1 from "./assets/img/Cav1.png";
import Rook1 from "./assets/img/General1.png";
import Bishop1 from "./assets/img/Bishop1.png";
import Queen1 from "./assets/img/Falcon1.png";
import King1 from "./assets/img/Chrom1.png";

type PieceType = 'pawn'|'rook'|'knight'|'bishop'|'queen'|'king';
type Player = 'white'|'black';
// ChessPiece interaface for computation
interface ChessPiece{
    id: string;
    x: number;
    y: number;
    type: PieceType;
    player: Player;
    haveMoved?: boolean;
}

// ChessPieceProps interface for rendering and drag events
interface ChessPieceProps {
    id: string;
    type: PieceType;
    player: Player;
    onDragStart: (e: React.DragEvent, id: string) => void;
}
//TODO: Implement for black pieces
// Checks if the player is white or black
const checkIsWhite = (player: string) => {
    return player === 'white';
}

// Check valid move for pawns
//TODO: Implement for black pawns
const isPawnValidMoves = (x:number,y:number,piece:ChessPiece,pieces:ChessPiece[]) => {
    if (piece.player === 'white') {
        // White pawns move forward (incorrect implementation)
        return (x === piece.x && (y === piece.y - 1 || (y === piece.y - 2 && piece.y === 6))) && 
        //Check there is no piece in between
        !pieces.some((p) => {
            return  (p.x === x && p.y === piece.y - 1);
        })
        // White pawns can capture diagonally
        ||
        (Math.abs(x - piece.x) === 1 && y === piece.y - 1) && isCaptureMove(x,y,piece,pieces); 
    }
    // Black pawns move backwards (incorrect implementation)
    return (x === piece.x && (y === piece.y + 1 || (y === piece.y + 2 && piece.y === 1))) &&   
    //Check there is no piece in between
    !pieces.some((p) => {
        return  (p.x === x && p.y === piece.y + 1);
    })
    // Black pawns can capture diagonally
    ||
    (Math.abs(x - piece.x) === 1 && y === piece.y + 1) && isCaptureMove(x,y,piece,pieces);
}

const isRookValidMoves = (x:number,y:number,piece:ChessPiece,pieces:ChessPiece[]) => {
    return (x === piece.x || y === piece.y) && 
    //Check there is no piece in between
    !pieces.some((p) => {
        return  (
            (p.x > Math.min(piece.x, x) && p.x < Math.max(piece.x, x) && p.y === y) || 
            (p.y > Math.min(piece.y, y) && p.y < Math.max(piece.y, y) && p.x === x)
        );
    });
}

const isKnightValidMoves = (x:number,y:number,piece:ChessPiece,pieces:ChessPiece[]) => {
    return ((Math.abs(x - piece.x) === 2 && Math.abs(y - piece.y) === 1) 
    || (Math.abs(x - piece.x) === 1 && Math.abs(y - piece.y) === 2)
    ) 
    
}

const isBishopValidMoves = (x:number,y:number,piece:ChessPiece,pieces:ChessPiece[]) => {
    return Math.abs(x - piece.x) === Math.abs(y - piece.y) &&
    //Check there is no piece in between
    !pieces.some((p) => {
        return  (
            Math.abs(p.x - piece.x) === Math.abs(p.y - piece.y) &&
            (p.x > Math.min(piece.x, x) && p.x < Math.max(piece.x, x) && p.y > Math.min(piece.y, y) && p.y < Math.max(piece.y, y))
            );
        });
}

const isQueenValidMoves = (x:number,y:number,piece:ChessPiece,pieces:ChessPiece[]) => {
    return isRookValidMoves(x,y,piece,pieces) || isBishopValidMoves(x,y,piece,pieces);
}

const isKingValidMoves = (x:number,y:number,piece:ChessPiece,pieces:ChessPiece[]) => {
    return Math.abs(x - piece.x) <= 1 && Math.abs(y - piece.y) <= 1;
}
// Check for valid capture moves
const isCaptureMove = (x:number,y:number,piece:ChessPiece,pieces:ChessPiece[]) => {
    const targetPiece = pieces.find((p) => p.x === x && p.y === y);
    return targetPiece && targetPiece.player !== piece.player;
}
// Check valid moves for all pieces
function checkValidMove (x:number,y:number,piece:ChessPiece,pieces:ChessPiece[]) {
    //Check move is blocked
    const targetPiece = pieces.find((p) => p.x === x && p.y === y);
    if (targetPiece && targetPiece.player === piece.player) {
        return false;
    }
    switch (piece.type) {
        case 'pawn':
            return isPawnValidMoves(x,y,piece,pieces);
        case 'rook':
            return isRookValidMoves(x,y,piece,pieces);
        case 'knight':
            return isKnightValidMoves(x,y,piece,pieces);
        case 'bishop':
            return isBishopValidMoves(x,y,piece,pieces);
        case 'queen':
            return isQueenValidMoves(x,y,piece,pieces);
        case 'king':
            return isKingValidMoves(x,y,piece,pieces);
        default:
            return true;
    }
}
//Returns available moves for a piece on the board
function getAvailableMoves(piece:ChessPiece,pieces:ChessPiece[]) {
    let availableMoves = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (checkValidMove(i,j,piece,pieces)) {
                availableMoves.push({x:i,y:j});
            }
        }
    }
    //Additional logic for kings
    if (piece.type === 'king'){
        //Check for castling
        const rooks = pieces.filter((p) => p.type === 'rook' && p.player === piece.player);
        rooks.forEach((rook) => {
            if (canCastle(piece,rook,pieces)) {
                console.log("Can castle");
                const newKingX = rook.x > piece.x ? 6:2;
                availableMoves.push({x:newKingX,y:rook.y});
            }
            else {
                console.log("Cannot castle");
            }
        });
        //Filter out moves that put the king in check
        availableMoves = availableMoves.filter((move) => {
            const simulatedPieces = pieces.map((p) => p.id !== piece.id ? p : {...piece, x: move.x, y: move.y});
            //console.log("Simulated pieces",simulatedPieces);
            return !isKingInCheck({...piece,x:move.x,y:move.y},simulatedPieces);
            
        })
        console.log("Available moves",availableMoves);

    }
    return availableMoves;
}
// Renders a single chess piece
function RenderChessPiece({ id,type,player,onDragStart}: ChessPieceProps) {
    // Image source depends on the piece type and player
    let source = "";
    switch (type) {
        case 'pawn':
            source = player === 'white' ? Pawn : Pawn1;
            break;
        case 'knight':
            source = player === 'white' ? Knight : Knight1;
            break;
        case 'rook':
            source = player === 'white' ? Rook : Rook1;
            break;
        case 'bishop':
            source = player === 'white' ? Bishop : Bishop1;
            break;
        case 'queen':
            source = player === 'white' ? Queen : Queen1;
            break;
        case 'king':
            source = player === 'white' ? King : King1;
            break;
        default:
            break;
        }
    return (
        <img
        src={source}
        alt={type}
        draggable
        onDragStart={(e) => onDragStart(e, id)}
        style={{
            position: "absolute",
            width: "50px",
            height: "50px",
            cursor: "pointer",
            transform: "translate(-50%, 0%)",
        }}
        />
    )
}
//Check if the king is in check
function isKingInCheck(king:ChessPiece,pieces:ChessPiece[]):boolean {
    return pieces.some((piece)=> 
    piece.player !== king.player && checkValidMove(king.x,king.y,piece,pieces));
    
}
//TODO: Implement scenario where the king is in checkmate
//Get the king piece
function getKing(player:Player,pieces:ChessPiece[]):ChessPiece|undefined {
    return pieces.find((piece) => piece.type === 'king' && piece.player === player);
}
//Check if the king is in checkmate
function isCheckmate(player:Player,pieces:ChessPiece[]):boolean {
    const king = getKing(player,pieces);
    if (!king) {
        return false;
    }
    //Check if the king is in check
    if (!isKingInCheck(king,pieces)) {
        return false;
    }
    console.log("King is in check");
    //Check if the king can move to a safe square
    return !pieces.some((piece) => piece.player === player && getAvailableMoves(piece,pieces).some((move) => !isKingInCheck({...king,x:move.x,y:move.y},pieces)));
}
function canCastle (king:ChessPiece,rook:ChessPiece,pieces:ChessPiece[]):boolean {
    if (king.type !== 'king' || rook.type !== 'rook') {
        return false;
    }
    console.log("Checking castle");
    if (king.haveMoved || rook.haveMoved) {
        return false;
    }
    //Check if there are pieces in between
    if (pieces.some((piece) => piece.x > Math.min(king.x,rook.x) && piece.x < Math.max(king.x,rook.x) && piece.y === king.y)) {
        return false;
    }
    return true;

}
export {checkValidMove,getAvailableMoves,RenderChessPiece,isCheckmate,canCastle};
export type {ChessPiece, ChessPieceProps, PieceType, Player};