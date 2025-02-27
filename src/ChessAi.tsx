//TODO Make a chess AI that can play against the player 
//Algorithm: Minimax
import { ChessPiece, Player,getAvailableMoves } from "./chesspiece";
//ChessMove interface to store the move that the AI will make
interface ChessMove {
    x: number;
    y: number;
    piece:ChessPiece;//The piece that is moving
}
function bestMove (pieces : ChessPiece[],depth:number,player:Player):ChessMove|null{
    let bestMove : ChessMove | null = null;
    let bestScore = Infinity;
    for (const piece of pieces.filter(p => p.player === player)) {
        const moves = getAvailableMoves(piece,pieces);
        //moves ? console.log(moves) : console.log("No moves");
        for (const move of moves) {
            const simulatedPieces = simulateMove(piece,move.x,move.y,pieces);
            const score = miniMax(simulatedPieces,depth-1,-Infinity,Infinity,true);
            if (score < bestScore){
                bestScore = score;
                bestMove = {x:move.x,y:move.y,piece};
            }
        }
    }
    console.log(bestMove);
    return bestMove;
}


function miniMax (pieces:ChessPiece[],depth:number, alpha:number, beta:number,isMax:boolean): number{
    if (depth === 0 || isGameOver(pieces)){
        return evaluateBoard(pieces);
    }
    if (isMax){
        //Maximizing player
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
        //Minimizing player
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
    return !pieces.some(p => p.type === 'king' && p.player === 'white') || !pieces.some(p => p.type === 'king' && p.player === 'black');
}
function simulateMove(piece:ChessPiece,x:number,y:number,pieces:ChessPiece[]):ChessPiece[]{
    const targetPiece = pieces.find((p) => p.x === x && p.y === y);
    return pieces.map(p => 
        p.id === piece.id ? {...p,x,y} : p
    ).filter((p) => p.id !== targetPiece?.id);

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
    //console.log(score);
    return score;
}
export { bestMove }