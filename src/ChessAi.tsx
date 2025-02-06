//TODO Make a chess AI that can play against the player 
//Algorithm: Minimax
import { ChessPiece, Player,getAvailableMoves } from "./chesspiece";
interface ChessMove {
    x: number;
    y: number;
    piece:ChessPiece;
}
function bestMove (pieces : ChessPiece[],player:Player):ChessMove{
    let bestMove : ChessMove | null = null;
    let bestScore = -Infinity;
    for (const piece of pieces.filter(p => p.player === player)) {
        const moves = getAvailableMoves(piece,pieces);
        for (const move of moves) {
            const simulatedPieces = simulateMove(piece,move.x,move.y,pieces);
            const score = miniMax(simulatedPieces,2,-Infinity,Infinity,false);
            if (score > bestScore){
                bestScore = score;
                bestMove = {x:move.x,y:move.y,piece};
            }
        }
    }
    return {x:0,y:0,piece:pieces[0]};
}


function miniMax (pieces:ChessPiece[],depth:number, alpha:number, beta:number,isMax:boolean): number{
    if (depth === 0 || isGameOver(pieces)){
        return evaluateBoard(pieces);
    }
    if (isMax){
        let maxEval = -Infinity;
        for (const piece of pieces.filter(p => p.player === 'white')) {
            const moves = getAvailableMoves(piece,pieces);
            for (const move of moves) {
                const simulatedPieces = simulateMove(piece,move.x,move.y,pieces);
                const score = miniMax(simulatedPieces,depth-1,alpha,beta,false);
                maxEval = Math.max(maxEval,score);
                alpha = Math.max(alpha,score);
                if (beta <= alpha){
                    break;
                }
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const piece of pieces.filter(p => p.player === 'black')) {
            const moves = getAvailableMoves(piece,pieces);
            for (const move of moves) {
                const simulatedPieces = simulateMove(piece,move.x,move.y,pieces);
                const score = miniMax(simulatedPieces,depth-1,alpha,beta,true);
                minEval = Math.min(minEval,score);
                beta = Math.min(beta,score);
                if (beta <= alpha){
                    break;
                }
            }
        }
        return minEval;
    }
}
function isGameOver(pieces:ChessPiece[]):boolean{
    return !pieces.some(p => p.type === 'king');
}
function simulateMove(piece:ChessPiece,x:number,y:number,pieces:ChessPiece[]):ChessPiece[]{
    return pieces.map(p => 
        p.id === piece.id ? {...p,x,y} : (p.x === x && p.y === y ? null : p)
    ).filter(Boolean) as ChessPiece[];

}
function evaluateBoard(pieces:ChessPiece[]):number{
    //Piece values
    const pieceValues : Record<string,number> = {
        pawn:10,
        knight:30,
        bishop:30,
        rook:50,
        queen:90,
        king:1000,
    }
    let score = 0;
    for (const piece of pieces) {
        score += piece.player === 'white' ? pieceValues[piece.type] : -pieceValues[piece.type];
    }
    return score;
}