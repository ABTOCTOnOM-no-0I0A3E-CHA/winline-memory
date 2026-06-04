import { useState, useEffect, useCallback } from 'react'
import './App.css'
import sport24 from './assets/sport24.svg'
import cross from './assets/cross.svg'
import winline from './assets/winline.svg'
import RectangleSmall from './assets/rectangle-small'
import dynamic from './assets/dynamic.svg'
import dynamicMuted from './assets/muted-dynamic.svg'
import gift from './assets/gift.svg'
import Rectangle from './assets/rectangle'
import light from './assets/light.svg'

// ─── типы ───────────────────────────────────────────────────────────────────

interface CardData {
  id: number
  pairId: number
  image: string
  isBonus: boolean
  isFlipped: boolean
  isMatched: boolean
}

// ─── константы ───────────────────────────────────────────────────────────────

// 8 пар: 3 реальные картинки + 5 цветных заглушек (замени src на нужные)
const PAIRS: { image: string; isBonus: boolean }[] = [
  { image: './foot.png',    isBonus: false },
  { image: './cup.png',     isBonus: true  },
  { image: './whistle.png', isBonus: false },
  { image: '',              isBonus: false }, // заглушка 4
  { image: '',              isBonus: false }, // заглушка 5
  { image: '',              isBonus: false }, // заглушка 6
  { image: '',              isBonus: false }, // заглушка 7
  { image: '',              isBonus: false }, // заглушка 8
]

const PLACEHOLDER_COLORS = ['#FF6A13', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B']

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function createDeck(): CardData[] {
  const cards: CardData[] = []
  PAIRS.forEach((pair, pairId) => {
    for (let i = 0; i < 2; i++) {
      cards.push({
        id: pairId * 2 + i,
        pairId,
        image: pair.image,
        isBonus: pair.isBonus,
        isFlipped: false,
        isMatched: false,
      })
    }
  })
  return shuffle(cards)
}

// ─── компонент карточки ───────────────────────────────────────────────────────

interface CardProps {
  card: CardData
  onClick: () => void
  placeholderColor?: string
}

function Card({ card, onClick, placeholderColor }: CardProps) {
  const { isFlipped, isMatched, image, isBonus } = card
  const open = isFlipped || isMatched

  return (
    <div
      className="aspect-square cursor-pointer"
      style={{ perspective: '800px' }}
      onClick={onClick}
    >
      <div
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s',
          transform: open ? 'rotateY(180deg)' : 'rotateY(0deg)',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* Рубашка */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[10px]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <img src="./template.png" className="w-full h-full object-cover" />
        </div>

        {/* Лицевая */}
        <div
          className={`absolute inset-0 overflow-hidden rounded-[10px] ${
            isMatched
              ? 'border-2 border-green-400 bg-[#E1E1F0]'
              : 'border-2 border-[#FF6A13] bg-[#E1E1F0]'
          }`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {image ? (
            <img src={image} className="w-full h-full object-contain mix-blend-darken p-2.5" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: placeholderColor + '33' }}
            >
              <div
                className="w-10 h-10 rounded-full"
                style={{ background: placeholderColor }}
              />
            </div>
          )}

          {isBonus && (
            <div
              className="absolute bottom-0 right-0 overflow-hidden"
              style={{ width: 64, height: 64 }}
            >
              <div
                className="absolute bg-[#FF6A13] text-white font-winline font-bold italic text-[11px] uppercase text-center"
                style={{
                  width: 90,
                  bottom: 14,
                  right: -22,
                  transform: 'rotate(-45deg)',
                  lineHeight: '20px',
                }}
              >
                БОНУС
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── главный компонент ────────────────────────────────────────────────────────

function App() {
  const [deck, setDeck] = useState<CardData[]>(createDeck)
  const [selected, setSelected] = useState<number[]>([]) // id выбранных
  const [moves, setMoves] = useState(0)
  const [matched, setMatched] = useState(0)
  const [locked, setLocked] = useState(false) // блокировка во время проверки

  const matchedPairs = matched
  const totalPairs = PAIRS.length

  // Сброс игры
  const reset = useCallback(() => {
    setDeck(createDeck())
    setSelected([])
    setMoves(0)
    setMatched(0)
    setLocked(false)
  }, [])

  // Клик по карточке
  const handleClick = useCallback(
    (id: number) => {
      if (locked) return
      const card = deck.find((c) => c.id === id)
      if (!card || card.isFlipped || card.isMatched) return
      if (selected.includes(id)) return

      const newSelected = [...selected, id]

      setDeck((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)))

      if (newSelected.length === 2) {
        setMoves((m) => m + 1)
        setLocked(true)

        const [firstId, secondId] = newSelected
        const first = deck.find((c) => c.id === firstId)!
        const second = deck.find((c) => c.id === id)!

        if (first.pairId === second.pairId) {
          // Совпадение
          setTimeout(() => {
            setDeck((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isMatched: true, isFlipped: false }
                  : c
              )
            )
            setMatched((m) => m + 1)
            setSelected([])
            setLocked(false)
          }, 600)
        } else {
          // Не совпали — перевернуть обратно
          setTimeout(() => {
            setDeck((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
              )
            )
            setSelected([])
            setLocked(false)
          }, 900)
        }
      } else {
        setSelected(newSelected)
      }
    },
    [deck, selected, locked]
  )

  // Победа
  const won = matchedPairs === totalPairs

  return (
    <>
      <header className="flex justify-between items-center px-15 py-5 border-b border-[#E1E1F0] bg-white">
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

      <main className="main-grid px-15 py-3.5 gap-7 grid">
        {/* ── Левая панель ── */}
        <div className="border border-[#E1E1F0] shadow-[-2px_4px_3px_rgba(0,0,0,0.02)] p-6 rounded-lg bg-white">
          <div className="mb-6">
            <p className="font-bold text-[35px]/[35px] italic text-center mb-2.5">УРОВЕНЬ 1</p>
            <div className="flex items-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <Rectangle
                  key={i}
                  className={`text-[#FF6A13] ${i >= matchedPairs ? 'opacity-20' : ''}`}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_1px_1fr] mb-6">
            <div className="text-center font-bold text-[35px]/[35px] italic">
              <p className="mb-1">
                <span className="text-[#FF6A13]">{matchedPairs}</span> / {totalPairs}
              </p>
              <p className="text-[20px]/[20px]">ПАРЫ</p>
            </div>
            <svg width="1" height="60" viewBox="0 0 1 60" fill="none">
              <rect width="1" height="60" fill="url(#grad1)" />
              <defs>
                <linearGradient id="grad1" x1="0.5" y1="0" x2="0.5" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" />
                  <stop offset="0.45" stopColor="#FF6A13" />
                  <stop offset="1" stopColor="white" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center font-bold text-[35px]/[35px] italic">
              <p className="mb-1">{moves}</p>
              <p className="text-[20px]/[20px]">ХОДЫ</p>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_1px_1fr] mb-6">
            <div className="text-center font-bold text-[35px]/[35px] italic">
              <p className="mb-1">—</p>
              <p className="text-[20px]/[20px] uppercase">твоё время</p>
            </div>
            <svg width="1" height="60" viewBox="0 0 1 60" fill="none">
              <rect width="1" height="60" fill="url(#grad2)" />
              <defs>
                <linearGradient id="grad2" x1="0.5" y1="0" x2="0.5" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" />
                  <stop offset="0.45" stopColor="#FF6A13" />
                  <stop offset="1" stopColor="white" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center font-bold text-[35px]/[35px] italic">
              <p className="mb-1">—</p>
              <p className="text-[20px]/[20px] uppercase">среднее время</p>
            </div>
          </div>
          <button
            className="bg-[#FF6A13] rounded-full flex justify-center gap-1 w-full py-2.5 cursor-pointer"
            onClick={reset}
          >
            <img src={light} />
            <span className="text-[20px]/[20px] font-bold italic text-white uppercase">
              {won ? 'заново' : 'подсказка'}
            </span>
          </button>
        </div>

        {/* ── Игровое поле 4×4 ── */}
        <div className="grid grid-cols-4 gap-2.5 content-start">
          {won && (
            <div className="col-span-4 text-center font-winline font-bold italic text-[32px] text-[#FF6A13] py-4">
              🎉 ВЫ ПОБЕДИЛИ ЗА {moves} ХОДОВ!
            </div>
          )}
          {deck.map((card) => (
            <Card
              key={card.id}
              card={card}
              onClick={() => handleClick(card.id)}
              placeholderColor={PLACEHOLDER_COLORS[card.pairId - 3] ?? '#999'}
            />
          ))}
        </div>

        {/* ── Правая панель ── */}
        <div></div>
      </main>
    </>
  )
}

export default App
