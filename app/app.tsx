import './styles/app.css'
import Main from './components/main/Main'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './routes/login/Login'
import TestRoute from './routes/test/Test'
import BlockchainTest from './routes/test/BlockchainTest'

export default function App() {
  return (
    <Main>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/test" element={<TestRoute />} />
          <Route path="/blockchain-test" element={<BlockchainTest />} />
        </Routes>
      </BrowserRouter>
    </Main>
  )
}
