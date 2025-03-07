import { useState } from 'react'
import './App.css'
import RenderChessBoard from './chessboard'
import RenderChessBoardNew from './chessboard2'
function App() {
  
  return (
    <div>
      <h1>Chess-Fe</h1>
      <RenderChessBoardNew/>
    </div>
  )
}

export default App
