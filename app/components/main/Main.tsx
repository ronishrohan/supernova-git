import React, { useEffect, useState } from 'react'
import Sidebar from './Sidebar'

interface TitlebarProps {
  children: React.ReactNode
}

const Titlebar: React.FC<TitlebarProps> = ({ children }) => {
  const [isMinimizable, setIsMinimizable] = useState(true)
  const [isMaximizable, setIsMaximizable] = useState(true)
  const [platform, setPlatform] = useState<string>('')

  useEffect(() => {
    // Initialize window state
    if (window.conveyor?.window) {
      window.conveyor.window.windowInit().then((data: any) => {
        setIsMinimizable(data.minimizable)
        setIsMaximizable(data.maximizable)
        setPlatform(data.platform)
      })
    }
  }, [])

  const handleMinimize = () => {
    window.conveyor?.window?.windowMinimize()
  }

  const handleMaximize = () => {
    window.conveyor?.window?.windowMaximizeToggle()
  }

  const handleClose = () => {
    window.conveyor?.window?.windowClose()
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div
        className={`flex justify-between items-center h-[30px] bg-card border-b border-border select-none relative z-[1000] transition-colors duration-200 ${
          platform === 'darwin' ? 'pl-[70px]' : ''
        }`}
        style={
          {
            WebkitAppRegion: 'drag',
          } as React.CSSProperties
        }
      >
        <div className="flex items-center flex-1 pl-3">
          <div className=" text-white font-logo text-xl font-light translate-y-[1px]">SUPERNOVA</div>
        </div>

        {platform !== 'darwin' && (
          <div
            className="flex"
            style={
              {
                WebkitAppRegion: 'no-drag',
              } as React.CSSProperties
            }
          >
            {isMinimizable && (
              <button
                className="w-[45px] h-[30px] border-0 bg-transparent text-muted-foreground cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[-2px]"
                onClick={handleMinimize}
                aria-label="Minimize"
                style={{ fontSize: 0 }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" className="pointer-events-none">
                  <path d="M0,5 L10,5" stroke="currentColor" strokeWidth="1" />
                </svg>
              </button>
            )}

            {isMaximizable && (
              <button
                className="w-[45px] h-[30px] border-0 bg-transparent text-muted-foreground cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[-2px]"
                onClick={handleMaximize}
                aria-label="Maximize"
                style={{ fontSize: 0 }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" className="pointer-events-none">
                  <path d="M0,0 L10,0 L10,10 L0,10 Z" stroke="currentColor" strokeWidth="1" fill="none" />
                </svg>
              </button>
            )}

            <button
              className="w-[45px] h-[30px] border-0 bg-transparent text-muted-foreground cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-red-600 hover:text-white active:bg-red-700 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[-2px]"
              onClick={handleClose}
              aria-label="Close"
              style={{ fontSize: 0 }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" className="pointer-events-none">
                <path d="M0,0 L10,10 M0,10 L10,0" stroke="currentColor" strokeWidth="1" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-background">{children}</div>
    </div>
  )
}

export default function Main({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col" overflow-hidden size-full>
      <Titlebar>
        <div className="flex size-full overflow-hidden">
          <Sidebar />
          <div className="size-full overflow-y-auto overflow-x-hidden">{children}</div>
        </div>
      </Titlebar>
    </div>
  )
}
