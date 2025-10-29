import './styles/app.css'
import Main from './components/main/Main'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './routes/login/Login'

export default function App() {
  return (
    <Main>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </Main>
  )
}
