import React from 'react'
import backdrop from '../../assets/images/backdrop.png'

export default function Login() {
  return (
    <div className="size-full gap-2 flex">
      <div className="p-4 flex flex-col w-1/2 items-center justify-start py-[100px] gap-2">
        <div className=" flex flex-col gap-2 items-stretch">
          <div className="text-center text-4xl leading-[20px] font-logo font-light tracking-tighter">SUPERNOVA</div>
          <div className="text-center text-gray-600 mb-4">AI powered security</div>
          <input placeholder="Email" className="border outline-none focus:border-primary  border-border  px-4 py-2" />
          <input placeholder="Password" className="border outline-none focus:border-primary border-border  px-4 py-2" />
          <button className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] w-full px-4 py-2 ">
            Login
          </button>
          <button className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-accent/60 to-accent/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] w-full px-4 py-2 ">
            Create an account
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
