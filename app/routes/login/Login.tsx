import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import backdrop from '../../assets/images/backdrop.png'

import logo_large from '../../assets/images/icon-large.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const navigate = useNavigate()
  const { login, signup } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = isSignup
        ? await signup(email, password)
        : await login(email, password)

      if (result.error) {
        setError(result.error)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="size-full gap-2 flex">
      <div className="p-4 flex flex-col w-1/2 items-center justify-start py-[40px] gap-2">
        <div className=" flex flex-col gap-2 items-stretch">
          <div className="w-full h-fit mb-4">
            <img src={logo_large} className="w-full h-fit rounded-lg mix-blend-lighten rotate-[-20deg]" />
          </div>
          <div className="text-center text-4xl leading-[20px] font-logo font-light tracking-tighter">SUPERNOVA</div>
          <div className="text-center text-gray-600 mb-4">AI powered security</div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border outline-none focus:border-primary  border-border  px-4 py-2"
              required
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border outline-none focus:border-primary border-border  px-4 py-2"
              required
              disabled={loading}
            />
            <button
              type="submit"
              className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] w-full px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (isSignup ? 'Creating account...' : 'Logging in...') : (isSignup ? 'Create Account' : 'Login')}
            </button>
          </form>
          <button
            onClick={() => {
              setIsSignup(!isSignup)
              setError('')
            }}
            className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-accent/60 to-accent/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] w-full px-4 py-2"
            disabled={loading}
          >
            {isSignup ? 'Already have an account? Login' : 'Create an account'}
          </button>
        </div>
      </div>
      <div className=" size-full relative">
        {/*<div className="absolute left-0 h-full w-1/2 bg-gradient-to-r "></div>*/}
        <div className="size-full absolute bg-primary z-20 mix-blend-hard-light"></div>
        <img src={backdrop} className="size-full object-cover saturate-0" />
      </div>
    </div>
  )
}
