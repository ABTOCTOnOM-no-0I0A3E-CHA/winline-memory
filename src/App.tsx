import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import sport24 from './assets/sport24.svg'
import cross from './assets/cross.svg'
import winline from './assets/winline.svg'
import RectangleSmall from './assets/rectangle-small'
import volumeOn from './assets/volume-on.svg'
import dynamicMuted from './assets/muted-dynamic.svg'
import gift from './assets/gift.svg'
import Rectangle from './assets/rectangle'
import light from './assets/light.svg'
import touch from './assets/touch.svg'
import cards from './assets/cards.svg'
import cup from './assets/cup.svg'
import retry from './assets/retry.svg'
import info from './assets/info.svg'

/* ─── типы ──────────────────────────────────────────────────────────────── */

interface CardData {
  id: number
  pairId: number
  image: string
  isBonus: boolean
  isFlipped: boolean
  isMatched: boolean
}

/* ─── константы ─────────────────────────────────────────────────────────── */

const PAIRS: { image: string; isBonus: boolean }[] = [
  { image: './foot.png', isBonus: false },
  { image: './cup.png', isBonus: true },
  { image: './whistle.png', isBonus: false },
  { image: '', isBonus: false },
  { image: '', isBonus: false },
  { image: '', isBonus: false },
  { image: '', isBonus: false },
  { image: '', isBonus: false },
]

const PLACEHOLDER_COLORS = ['#FF6A13', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B']

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function createDeck(): CardData[] {
  const items: CardData[] = []
  PAIRS.forEach((pair, pairId) => {
    for (let i = 0; i < 2; i++) {
      items.push({
        id: pairId * 2 + i,
        pairId,
        image: pair.image,
        isBonus: pair.isBonus,
        isFlipped: false,
        isMatched: false,
      })
    }
  })
  return shuffle(items)
}

/* ─── разделитель-градиент ──────────────────────────────────────────────── */

function GradientDivider({ id }: { id: string }) {
  return (
    <svg width="1" height="60" viewBox="0 0 1 60" fill="none" className="shrink-0 self-center">
      <rect width="1" height="60" fill={`url(#${id})`} />
      <defs>
        <linearGradient id={id} x1="0.5" y1="0" x2="0.5" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="0.45" stopColor="#FF6A13" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ─── компонент карточки ────────────────────────────────────────────────── */

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
      className={`aspect-square cursor-pointer rounded-[10px] ${open ? '' : 'card-hover'}`}
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
        <div
          className="absolute inset-0 overflow-hidden rounded-[10px]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <img src="./template.png" className="w-full h-full object-cover" />
        </div>

        <div
          className={`absolute inset-0 overflow-hidden rounded-[10px] bg-[#E1E1F0] ${
            isBonus ? 'border-2 border-[#FF6A13]' : ''
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
              <div className="w-10 h-10 rounded-full" style={{ background: placeholderColor }} />
            </div>
          )}

          {isBonus && (
            <div className="card-bonus-ribbon absolute bottom-0 right-0 overflow-hidden">
              <div className="card-bonus-text absolute bg-[#FF6A13] text-white font-winline font-bold italic uppercase text-center">
                БОНУС
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── звуковая система ──────────────────────────────────────────────────── */

const SOUNDS = {
  flip: './flip.mp3',
  correct: './correct.mp3',
  error: './error.mp3',
  bonus: './bonus.mp3',
  click: './click.mp3',
  levelComplete: './level-complete.mp3',
  gameFinished: './game-finished.mp3',
  music: './music.mp3',
} as const

type SoundName = keyof typeof SOUNDS

function useSound() {
  const soundOn = useRef(false)
  const [isSoundOn, setIsSoundOn] = useState(false)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const cacheRef = useRef<Map<string, HTMLAudioElement>>(new Map())

  const play = useCallback((name: SoundName) => {
    if (!soundOn.current) return

    if (name === 'music') return

    const src = SOUNDS[name]
    const audio = new Audio(src)
    audio.volume = 0.5
    audio.play().catch(() => {})
  }, [])

  const toggleSound = useCallback(() => {
    const next = !soundOn.current
    soundOn.current = next
    setIsSoundOn(next)

    if (next) {
      if (!musicRef.current) {
        musicRef.current = new Audio(SOUNDS.music)
        musicRef.current.loop = true
        musicRef.current.volume = 0.3
      }
      musicRef.current.play().catch(() => {})
    } else {
      musicRef.current?.pause()
    }
  }, [])

  return { isSoundOn, play, toggleSound }
}

/* ─── кнопка звука ─────────────────────────────────────────────────────── */

function SoundButton({ isSoundOn, onToggle }: { isSoundOn: boolean; onToggle: () => void }) {
  return (
    <button
      className="btn-outline w-10 h-10 rounded-full relative border border-[#E1E1F0] flex items-center justify-center"
      onClick={onToggle}
    >
      <img
        src={isSoundOn ? volumeOn : dynamicMuted}
        className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"
      />
    </button>
  )
}

/* ─── кнопка бонуса ─────────────────────────────────────────────────────── */

function BonusButton() {
  return (
    <div className="btn-outline bonus-btn h-10 rounded-full relative border border-[#E1E1F0] flex items-center gap-1">
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
      <p className="bonus-btn-label font-winline text-[20px]/[20px] font-bold italic">БОНУС</p>
    </div>
  )
}

/* ─── главный компонент ─────────────────────────────────────────────────── */

function App() {
  const [deck, setDeck] = useState<CardData[]>(createDeck)
  const [selected, setSelected] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matched, setMatched] = useState(0)
  const [locked, setLocked] = useState(false)
  const { isSoundOn, play, toggleSound } = useSound()

  const matchedPairs = matched
  const totalPairs = PAIRS.length

  const reset = useCallback(() => {
    play('click')
    setDeck(createDeck())
    setSelected([])
    setMoves(0)
    setMatched(0)
    setLocked(false)
  }, [play])

  const handleClick = useCallback(
    (id: number) => {
      if (locked) return
      const card = deck.find((c) => c.id === id)
      if (!card || card.isFlipped || card.isMatched) return
      if (selected.includes(id)) return

      play('flip')

      const newSelected = [...selected, id]

      setDeck((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)))

      if (newSelected.length === 2) {
        setMoves((m) => m + 1)
        setLocked(true)

        const [firstId, secondId] = newSelected
        const first = deck.find((c) => c.id === firstId)!
        const second = deck.find((c) => c.id === id)!

        if (first.pairId === second.pairId) {
          const isBonus = first.isBonus
          const newMatched = matched + 1

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

            if (newMatched === totalPairs) {
              play('gameFinished')
            } else if (isBonus) {
              play('bonus')
            } else {
              play('correct')
            }
          }, 600)
        } else {
          setTimeout(() => {
            play('error')
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
    [deck, selected, locked, matched, totalPairs, play]
  )

  const won = matchedPairs === totalPairs

  return (
    <>
      {/* ══════ DESKTOP HEADER ══════ */}
      <header className="desktop-only flex justify-between items-center px-15 py-5 border-b border-[#E1E1F0] bg-white">
        <div className="text-green-400 flex-1">
          <img src={sport24} alt="sport24" className="inline logo-sport24" />
          <img src={cross} alt="cross" className="inline mx-4 logo-cross" />
          <img src={winline} alt="winline" className="inline logo-winline" />
        </div>

        <div className="flex justify-center items-center gap-1 flex-1">
          <RectangleSmall className="text-[#FF6A13]/20" />
          <RectangleSmall className="text-[#FF6A13]/50" />
          <RectangleSmall className="text-[#FF6A13]" />
          <p className="title-main font-bold italic px-3.5">ФУТБОЛЬНОЕ МЕМОРИ</p>
          <RectangleSmall className="text-[#FF6A13]" />
          <RectangleSmall className="text-[#FF6A13]/50" />
          <RectangleSmall className="text-[#FF6A13]/20" />
        </div>

        <div className="flex-1 justify-end items-center flex gap-2.5">
          <SoundButton isSoundOn={isSoundOn} onToggle={toggleSound} />
          <BonusButton />
        </div>
      </header>

      {/* ══════ MOBILE HEADER ══════ */}
      <header className="mobile-only flex flex-col items-center px-4 py-3 border-b border-[#E1E1F0] bg-white gap-2.5">
        <div className="flex items-center">
          <img src={sport24} alt="sport24" className="logo-sport24" />
          <img src={cross} alt="cross" className="mx-3 logo-cross" />
          <img src={winline} alt="winline" className="logo-winline" />
        </div>

        <div className="flex items-center gap-1">
          <RectangleSmall className="text-[#FF6A13]/20" />
          <RectangleSmall className="text-[#FF6A13]/50" />
          <RectangleSmall className="text-[#FF6A13]" />
          <p className="title-main font-bold italic px-2">ФУТБОЛЬНОЕ МЕМОРИ</p>
          <RectangleSmall className="text-[#FF6A13]" />
          <RectangleSmall className="text-[#FF6A13]/50" />
          <RectangleSmall className="text-[#FF6A13]/20" />
        </div>
      </header>

      {/* ══════ MAIN ══════ */}
      <main className="main-grid px-15 py-3.5 gap-7 grid">
        {/* ── Desktop: левая панель ── */}
        <div className="desktop-only flex flex-col justify-between">
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

            <div className="grid grid-cols-[1fr_1px_1fr] stat-row-gap">
              <div className="text-center font-bold italic">
                <p className="stat-value mb-1">
                  <span className="text-[#FF6A13]">{matchedPairs}</span> / {totalPairs}
                </p>
                <p className="stat-label">ПАРЫ</p>
              </div>
              <GradientDivider id="grad1" />
              <div className="text-center font-bold italic">
                <p className="stat-value mb-1">{moves}</p>
                <p className="stat-label">ХОДЫ</p>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_1px_1fr] mb-6">
              <div className="text-center font-bold italic">
                <p className="stat-value mb-1">—</p>
                <p className="stat-label uppercase">твоё время</p>
              </div>
              <GradientDivider id="grad2" />
              <div className="text-center font-bold italic">
                <p className="stat-value mb-1">—</p>
                <p className="stat-label uppercase">среднее время</p>
              </div>
            </div>

            <button
              className="btn-primary bg-[#FF6A13] rounded-full flex justify-center gap-1 w-full py-2.5"
              onClick={reset}
            >
              <img src={light} />
              <span className="text-[20px]/[20px] font-bold italic text-white uppercase">
                {won ? 'заново' : 'подсказка'}
              </span>
            </button>
          </div>

          <div className="text-[#6C6C6C] font-whitney text-xs/[15px] font-medium">
            <p>Реклама 18+.</p>
            <p>Рекламодатель: ООО «Управляющая компания НКС». Erid: F7NfYUJCUneTSxdfsZ4U</p>
          </div>
        </div>

        {/* ── Mobile: уровень + статы + ректанглы (над игровым полем) ── */}
        <div className="mobile-only flex flex-col mb-[15px]">
          <p className="font-bold text-[28px]/[28px] italic text-center mb-2.5">УРОВЕНЬ 1</p>

          <div className="grid grid-cols-[1fr_1px_1fr_1px_1fr_1px_1fr] items-center mb-2.5">
            <div className="text-center font-bold italic">
              <p className="text-[22px]/[22px] mb-1">
                <span className="text-[#FF6A13]">{matchedPairs}</span> / {totalPairs}
              </p>
              <p className="text-[12px]/[12px]">ПАРЫ</p>
            </div>
            <GradientDivider id="mgrad1" />
            <div className="text-center font-bold italic">
              <p className="text-[22px]/[22px] mb-1">{moves}</p>
              <p className="text-[12px]/[12px]">ХОДЫ</p>
            </div>
            <GradientDivider id="mgrad2" />
            <div className="text-center font-bold italic">
              <p className="text-[22px]/[22px] mb-1">—</p>
              <p className="text-[12px]/[12px] uppercase">время</p>
            </div>
            <GradientDivider id="mgrad3" />
            <div className="text-center font-bold italic">
              <p className="text-[22px]/[22px] mb-1">—</p>
              <p className="text-[12px]/[12px] uppercase">среднее</p>
            </div>
          </div>

          <div className="mobile-rectangles">
            {Array.from({ length: 8 }).map((_, i) => (
              <Rectangle
                key={i}
                className={`text-[#FF6A13] ${i >= matchedPairs ? 'opacity-20' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* ── Игровое поле 4×4 ── */}
        <div className="grid grid-cols-4 gap-2.5 content-start">
          {won && (
            <div className="col-span-4 text-center font-winline font-bold italic text-[32px] text-[#FF6A13] py-4">
              ВЫ ПОБЕДИЛИ ЗА {moves} ХОДОВ!
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

        {/* ── Mobile: инфа о рекламе ── */}
        <div className="mobile-only text-[#6C6C6C] font-whitney text-[10px]/[13px] font-medium text-center mt-2.5">
          <p>Реклама 18+.</p>
          <p>Рекламодатель: ООО «Управляющая компания НКС». Erid: F7NfYUJCUneTSxdfsZ4U</p>
        </div>

        {/* ── Desktop: правая панель ── */}
        <div className="desktop-only">
          <div className="border border-[#E1E1F0] shadow-[-2px_4px_3px_rgba(0,0,0,0.02)] p-6 rounded-lg bg-white mb-2.5">
            <p className="text-[35px]/[35px] font-bold italic text-center mb-5">КАК ИГРАТЬ</p>
            <ul>
              <li className="flex gap-2.5 items-center font-whitney font-medium text-lg/[25px] mb-5">
                <img src={touch} />
                <p>Нажимай на карточки, чтобы открыть их</p>
              </li>
              <li className="flex gap-2.5 items-center font-whitney font-medium text-lg/[25px] mb-5">
                <img src={cards} />
                <p>Найди две одинаковые карточки, чтобы собрать пару</p>
              </li>
              <li className="flex gap-2.5 items-center font-whitney font-medium text-lg/[25px] mb-5">
                <img src={cup} />
                <p>Собери все пары за наименьшее количество ходов и времени</p>
              </li>
            </ul>
            <button className="btn-outline flex rounded-full border border-[#E1E1F0] py-3 w-full justify-center gap-1">
              <img src={retry} />
              <span className="uppercase font-bold italic text-[20px]/[20px]">Начать заново</span>
            </button>
          </div>
          <div className="h-62.5 rounded-[10px] shadow-[-2px_4px_3px_rgba(0,0,0,0.02),-2px_4px_3px_rgba(0,0,0,0.02)] bg-gray-400 overflow-hidden">
            <img src="./ad.jpg" className="w-full h-full object-cover" />
          </div>
        </div>
      </main>

      {/* ══════ MOBILE BOTTOM BAR ══════ */}
      <div className="mobile-only fixed bottom-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-3 border-t border-[#E1E1F0] bg-white">
        <div className="flex items-center gap-2.5">
          <button className="btn-outline w-10 h-10 rounded-full border border-[#E1E1F0] flex items-center justify-center">
            <img src={info} alt="info" className="w-5 h-5" />
          </button>
          <SoundButton isSoundOn={isSoundOn} onToggle={toggleSound} />
          <BonusButton />
        </div>

        <button
          className="btn-primary bg-[#FF6A13] rounded-full flex items-center gap-1 px-5 py-2.5"
          onClick={reset}
        >
          <img src={light} />
          <span className="text-[16px]/[16px] font-bold italic text-white uppercase">
            {won ? 'заново' : 'подсказка'}
          </span>
        </button>
      </div>
    </>
  )
}

export default App
