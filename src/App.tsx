import './App.css'
import sport24 from './assets/sport24.svg'
import cross from './assets/cross.svg'
import winline from './assets/winline.svg'
import RectangleSmall from './assets/rectangle-small'
import dynamic from './assets/dynamic.svg'
import dynamicMuted from './assets/muted-dynamic.svg'
import gift from './assets/gift.svg'

function App() {
  return (
    <>
      <header className="flex justify-between items-center px-15 py-5 border-b border-[#E1E1F0]">
        <div className="text-green-400 flex-1">
          <img src={sport24} alt="sport24" className="inline" />
          <img src={cross} alt="cross" className="inline mx-4" />
          <img src={winline} alt="winline" className="inline" />
        </div>
        <div className="flex justify-center items-center gap-1 flex-1">
          <RectangleSmall className="text-[#FF6A13]/20" />

          <RectangleSmall className="text-[#FF6A13]/50" />

          <RectangleSmall className="text-[#FF6A13]" />

          <p className="text-[50px]/[50px] font-bold italic px-3.5">ФУТБОЛЬНОЕ МЕМОРИ</p>
          <RectangleSmall className="text-[#FF6A13]" />

          <RectangleSmall className="text-[#FF6A13]/50" />

          <RectangleSmall className="text-[#FF6A13]/20" />
        </div>
        <div className="flex-1 justify-end items-center flex gap-2.5">
          <div className="w-10 h-10 rounded-full relative border border-[#E1E1F0]">
            <img
              src={dynamic}
              className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"
            />
            <img
              src={dynamicMuted}
              className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"
            />
          </div>
          <div className="px-5 h-10 rounded-full relative border border-[#E1E1F0] flex items-center gap-1">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute -top-1.25 -right-1.25"
            >
              <rect width="20" height="20" rx="10" fill="#FF6A13" />
              <path
                d="M10.477 12.61H8.44299L9.99099 3.736H12.385L10.477 12.61ZM7.61499 16.264L8.10099 13.762H10.405L9.91899 16.264H7.61499Z"
                fill="white"
              />
            </svg>
            <img src={gift} />
            <p className="font-winline text-[20px]/[20px] font-bold italic">БОНУС</p>
          </div>
        </div>
      </header>
    </>
  )
}

export default App
