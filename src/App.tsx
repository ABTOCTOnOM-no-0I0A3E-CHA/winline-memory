import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { useGameBackend } from './hooks/useGameBackend'
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

type Pair = { image: string; isBonus: boolean }

/** Каждый уровень — свой набор из 8 пар (одна бонусная). */
const LEVELS: Pair[][] = [
  // Уровень 1
  [
    { image: './ball.webp', isBonus: false },
    { image: './cup.webp', isBonus: true },
    { image: './whistle.webp', isBonus: false },
    { image: './gloves.webp', isBonus: false },
    { image: './goldenball.webp', isBonus: false },
    { image: './flag.webp', isBonus: false },
    { image: './world.webp', isBonus: false },
    { image: './foot.webp', isBonus: false },
  ],
  // Уровень 2
  [
    { image: './bottle.webp', isBonus: false },
    { image: './bracelet.webp', isBonus: true },
    { image: './clock.webp', isBonus: false },
    { image: './field.webp', isBonus: false },
    { image: './hat.webp', isBonus: false },
    { image: './jar.webp', isBonus: false },
    { image: './memorial.webp', isBonus: false },
    { image: './pipe.webp', isBonus: false },
  ],
  // Уровень 3
  [
    { image: './playercard.webp', isBonus: false },
    { image: './score.webp', isBonus: true },
    { image: './screen.webp', isBonus: false },
    { image: './ticket.webp', isBonus: false },
    { image: './tornado.webp', isBonus: false },
    { image: './wear.webp', isBonus: false },
    { image: './wolf.webp', isBonus: false },
    { image: './pipe.webp', isBonus: false },
  ],
]

const TOTAL_LEVELS = LEVELS.length
const PAIRS_PER_LEVEL = 8

const PLACEHOLDER_COLORS = ['#FF6A13', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B']

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function createDeck(level: number): CardData[] {
  const pairs = LEVELS[level - 1] ?? LEVELS[0]
  const items: CardData[] = []
  pairs.forEach((pair, pairId) => {
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
  hinted?: boolean
}

function Card({ card, onClick, placeholderColor, hinted }: CardProps) {
  const { isFlipped, isMatched, image, isBonus } = card
  const open = isFlipped || isMatched

  return (
    <div
      className={`aspect-square cursor-pointer rounded-[10px] ${open ? '' : 'card-hover'} ${
        hinted && !open ? 'card-hinted' : ''
      }`}
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
          <img src="./template.webp" className="w-full h-full object-cover" />
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

/* ─── gift icon (белый, для оранжевой кнопки) ───────────────────────────── */

function GiftIconWhite() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18.5371 6.59571V7.45286C18.5371 7.83174 18.3866 8.1951 18.1187 8.46301C17.8508 8.73092 17.4874 8.88143 17.1086 8.88143H2.42857C2.04969 8.88143 1.68633 8.73092 1.41842 8.46301C1.15051 8.1951 1 7.83174 1 7.45286V6.59571C1 6.21683 1.15051 5.85347 1.41842 5.58556C1.68633 5.31765 2.04969 5.16714 2.42857 5.16714H17.1086C17.4874 5.16714 17.8508 5.31765 18.1187 5.58556C18.3866 5.85347 18.5371 6.21683 18.5371 6.59571Z"
        fill="rgba(255,255,255,0.2)"
      />
      <path
        d="M17.3057 17.2271V8.88143H2.23145V17.2271C2.23145 17.606 2.38196 17.9694 2.64986 18.2373C2.91777 18.5052 3.28114 18.6557 3.66002 18.6557H15.8772C16.256 18.6557 16.6194 18.5052 16.8873 18.2373C17.1552 17.9694 17.3057 17.606 17.3057 17.2271Z"
        fill="rgba(255,255,255,0.15)"
      />
      <path
        d="M9.76857 18.6557V8.88M5.56429 5.16714C3.86 5.16714 2.56429 1 6.12286 1C8.31143 1 9.76857 3.91714 9.76857 5.16714C9.76857 3.91714 11.2257 1 13.4143 1C16.9729 1 15.6771 5.16714 13.9729 5.16714M17.3057 17.2271V8.88143H2.23143V17.2271C2.23143 17.606 2.38194 17.9694 2.64985 18.2373C2.91776 18.5052 3.28112 18.6557 3.66 18.6557H15.8771C16.256 18.6557 16.6194 18.5052 16.8873 18.2373C17.1552 17.9694 17.3057 17.606 17.3057 17.2271ZM18.5371 6.59571V7.45286C18.5371 7.83174 18.3866 8.1951 18.1187 8.46301C17.8508 8.73092 17.4874 8.88143 17.1086 8.88143H2.42857C2.04969 8.88143 1.68633 8.73092 1.41842 8.46301C1.15051 8.1951 1 7.83174 1 7.45286V6.59571C1 6.21683 1.15051 5.85347 1.41842 5.58556C1.68633 5.31765 2.04969 5.16714 2.42857 5.16714H17.1086C17.4874 5.16714 17.8508 5.31765 18.1187 5.58556C18.3866 5.85347 18.5371 6.21683 18.5371 6.59571Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

/* ─── модальное окно "Уровень пройден" ─────────────────────────────────── */

function LevelCompleteModal({
  onClose,
  onClaimBonus,
}: {
  onClose: () => void
  onClaimBonus: () => void
}) {
  const content = (
    <>
      <div className="flex items-center gap-1 mb-4 justify-center overflow-hidden w-full">
        <RectangleSmall className="text-[#FF6A13]/20 shrink-0" />
        <RectangleSmall className="text-[#FF6A13]/50 shrink-0" />
        <RectangleSmall className="text-[#FF6A13] shrink-0" />
        <p className="bonus-modal-title font-bold italic px-2 whitespace-nowrap shrink-0">
          УРОВЕНЬ ПРОЙДЕН!
        </p>
        <RectangleSmall className="text-[#FF6A13] shrink-0" />
        <RectangleSmall className="text-[#FF6A13]/50 shrink-0" />
        <RectangleSmall className="text-[#FF6A13]/20 shrink-0" />
      </div>

      <div className="w-48 h-48 mb-5">
        <img src="./record.webp" className="w-full h-full object-contain" />
      </div>

      <p className="bonus-modal-text font-bold italic mb-6 uppercase text-center">
        Забирай бонус — <span className="text-[#FF6A13]">Фрибет 10&nbsp;000</span> от Winline
      </p>

      <button
        className="btn-primary bg-[#FF6A13] rounded-full flex items-center justify-center gap-2 w-full py-3 mb-3"
        onClick={onClaimBonus}
      >
        <GiftIconWhite />
        <span className="bonus-modal-btn uppercase font-bold italic text-white">Забрать бонус</span>
      </button>
      <button
        className="btn-outline rounded-full border border-[#E1E1F0] w-full py-3"
        onClick={onClose}
      >
        <span className="bonus-modal-btn uppercase font-bold italic">Продолжить игру</span>
      </button>
    </>
  )

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center rules-modal-overlay"
      style={{ background: '#9696964D', backdropFilter: 'blur(7px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Desktop */}
      <div
        className="modal-desktop relative bg-white rounded-[20px] mx-4 w-full max-w-[475px] p-6 flex-col items-center text-center"
        style={{
          border: '2px solid #FF6A13',
          boxShadow: '0px 2px 44px rgba(255, 106, 19, 0.6), -2px 4px 3px rgba(0, 0, 0, 0.02)',
        }}
      >
        <button
          className="absolute -top-4 -right-4 w-9 h-9 rounded-full bg-white border border-[#FF6A13] flex items-center justify-center shadow-sm"
          onClick={onClose}
        >
          <img
            src={cross}
            alt="close"
            style={{
              filter:
                'brightness(0) saturate(100%) invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%) contrast(85%)',
            }}
          />
        </button>
        {content}
      </div>

      {/* Mobile — выезжает снизу */}
      <div className="modal-mobile absolute bottom-0 left-0 right-0 flex-col">
        <div className="bg-white rounded-t-[20px] px-4 pt-6 pb-8 flex flex-col items-center text-center">
          {content}
        </div>
      </div>
    </div>
  )
}

/* ─── содержимое модалки "Бонус" ───────────────────────────────────────── */

function BonusModalContent({
  image,
  onClose,
  onClaimBonus,
}: {
  image: string
  onClose: () => void
  onClaimBonus: () => void
}) {
  return (
    <>
      <div className="flex items-center gap-1 mb-4 justify-center overflow-hidden w-full">
        <RectangleSmall className="text-[#FF6A13]/20 shrink-0" />
        <RectangleSmall className="text-[#FF6A13]/50 shrink-0" />
        <RectangleSmall className="text-[#FF6A13] shrink-0" />
        <p className="bonus-modal-title font-bold italic px-2 whitespace-nowrap shrink-0">
          ОСОБЫЙ ПРЕДМЕТ
        </p>
        <RectangleSmall className="text-[#FF6A13] shrink-0" />
        <RectangleSmall className="text-[#FF6A13]/50 shrink-0" />
        <RectangleSmall className="text-[#FF6A13]/20 shrink-0" />
      </div>

      <div className="w-48 h-48 mb-5">
        <img src={image} className="w-full h-full object-contain" />
      </div>

      <p className="bonus-modal-text font-bold italic mb-1 uppercase">Ты нашел бонусный предмет!</p>
      <p className="bonus-modal-text font-bold italic mb-6 uppercase">
        Забирай подарок — <span className="text-[#FF6A13]">Фрибет 10&nbsp;000</span> от Winline
      </p>

      <button
        className="btn-primary bg-[#FF6A13] rounded-full flex items-center justify-center gap-2 w-full py-3 mb-3"
        onClick={onClaimBonus}
      >
        <GiftIconWhite />
        <span className="bonus-modal-btn uppercase font-bold italic text-white">
          Забрать подарок
        </span>
      </button>
      <button
        className="btn-outline rounded-full border border-[#E1E1F0] w-full py-3"
        onClick={onClose}
      >
        <span className="bonus-modal-btn uppercase font-bold italic">Играть дальше</span>
      </button>
    </>
  )
}

/* ─── модальное окно "Бонус" ────────────────────────────────────────────── */

interface BonusModalProps {
  image: string
  onClose: () => void
  onClaimBonus: () => void
}

function BonusModal({ image, onClose, onClaimBonus }: BonusModalProps) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center rules-modal-overlay"
      style={{ background: '#9696964D', backdropFilter: 'blur(7px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* ── DESKTOP (> 720px): центрированный ── */}
      <div
        className="modal-desktop relative bg-white rounded-[20px] mx-4 w-full max-w-[475px] p-6 flex-col items-center text-center"
        style={{
          border: '2px solid #FF6A13',
          boxShadow: '0px 2px 44px rgba(255, 106, 19, 0.6), -2px 4px 3px rgba(0, 0, 0, 0.02)',
        }}
      >
        <button
          className="absolute -top-4 -right-4 w-9 h-9 rounded-full bg-white border border-[#FF6A13] flex items-center justify-center shadow-sm"
          onClick={onClose}
        >
          <img
            src={cross}
            alt="close"
            style={{
              filter:
                'brightness(0) saturate(100%) invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%) contrast(85%)',
            }}
          />
        </button>
        <BonusModalContent image={image} onClose={onClose} onClaimBonus={onClaimBonus} />
      </div>

      {/* ── MOBILE (≤ 720px): выезжает снизу ── */}
      <div className="modal-mobile absolute bottom-0 left-0 right-0 flex-col">
        <div className="bg-white rounded-t-[20px] px-4 pt-6 pb-8 flex flex-col items-center text-center">
          <BonusModalContent image={image} onClose={onClose} onClaimBonus={onClaimBonus} />
        </div>
      </div>
    </div>
  )
}

/* ─── модальное окно "Правила" ──────────────────────────────────────────── */

interface RulesModalProps {
  onClose: () => void
  onRestart: () => void
  bonusUrl: string
}

function RulesModal({ onClose, onRestart, bonusUrl }: RulesModalProps) {
  return (
    /* Оверлей */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center rules-modal-overlay"
      style={{ background: '#9696964D', backdropFilter: 'blur(7px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* ── DESKTOP: центрированный блок (> 720px) ── */}
      <div className="modal-desktop w-full max-w-[469px] mx-auto flex-col gap-[10px]">
        {/* Реклама */}
        <div className="relative rounded-[10px] overflow-hidden">
          <a href={bonusUrl} target="_blank" rel="noopener noreferrer" className="block aspect-[469/250]">
            <img src="./ad.webp" className="w-full h-full object-cover block cursor-pointer" />
          </a>
          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow"
            onClick={onClose}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="#222" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Как играть */}
        <div className="bg-white rounded-[10px] p-6">
          <p className="text-[35px]/[35px] font-bold italic text-center mb-5">КАК ИГРАТЬ</p>
          <ul className="mb-5">
            <li className="flex gap-2.5 items-center font-whitney font-medium text-lg/[25px] mb-5">
              <img src={touch} />
              <p>Нажимай на карточки, чтобы открыть их</p>
            </li>
            <li className="flex gap-2.5 items-center font-whitney font-medium text-lg/[25px] mb-5">
              <img src={cards} />
              <p>Найди две одинаковые карточки, чтобы собрать пару</p>
            </li>
            <li className="flex gap-2.5 items-center font-whitney font-medium text-lg/[25px]">
              <img src={cup} />
              <p>Собери все пары за наименьшее количество ходов и времени</p>
            </li>
          </ul>
          <button
            className="btn-outline flex rounded-full border border-[#E1E1F0] py-3 w-full justify-center gap-1 mb-3"
            onClick={() => {
              onRestart()
              onClose()
            }}
          >
            <img src={retry} />
            <span className="uppercase font-bold italic text-[20px]/[20px]">Начать заново</span>
          </button>
          <button
            className="btn-primary bg-[#FF6A13] rounded-full flex justify-center gap-1 w-full py-3"
            onClick={onClose}
          >
            <span className="uppercase font-bold italic text-[20px]/[20px] text-white">
              Продолжить игру
            </span>
          </button>
        </div>
      </div>

      {/* ── MOBILE: выезжает снизу (< 720px) ── */}
      <div className="modal-mobile absolute bottom-0 left-0 right-0 flex-col">
        {/* Реклама с отступами 10px */}
        <div className="relative rounded-[10px] overflow-hidden mx-[10px] mb-[10px]">
          <a href={bonusUrl} target="_blank" rel="noopener noreferrer" className="block aspect-[469/250]">
            <img src="./ad.webp" className="w-full h-full object-cover block cursor-pointer" />
          </a>
          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow"
            onClick={onClose}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="#222" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Как играть — во всю ширину, только верхние скругления */}
        <div className="bg-white rounded-t-[20px] px-4 pt-6 pb-8">
          <p className="text-[28px]/[28px] font-bold italic text-center mb-5">ПРАВИЛА ИГРЫ</p>
          <ul className="mb-5">
            <li className="flex gap-3 items-center font-whitney font-medium text-base/[22px] mb-4">
              <img src={touch} className="w-8 h-8 shrink-0" />
              <p>Нажимай на карточки, чтобы открыть их</p>
            </li>
            <li className="flex gap-3 items-center font-whitney font-medium text-base/[22px] mb-4">
              <img src={cards} className="w-8 h-8 shrink-0" />
              <p>Найди две одинаковые карточки, чтобы собрать пару</p>
            </li>
            <li className="flex gap-3 items-center font-whitney font-medium text-base/[22px]">
              <img src={cup} className="w-8 h-8 shrink-0" />
              <p>Собери все пары за наименьшее количество ходов и времени</p>
            </li>
          </ul>
          <button
            className="btn-outline flex rounded-full border border-[#E1E1F0] py-3 w-full justify-center gap-1 mb-3"
            onClick={() => {
              onRestart()
              onClose()
            }}
          >
            <img src={retry} />
            <span className="uppercase font-bold italic text-[18px]/[18px]">Начать заново</span>
          </button>
          <button
            className="btn-primary bg-[#FF6A13] rounded-full flex justify-center gap-1 w-full py-3"
            onClick={onClose}
          >
            <span className="uppercase font-bold italic text-[18px]/[18px] text-white">
              Продолжить игру
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── кнопка бонуса ─────────────────────────────────────────────────────── */

function BonusButton({ bonusUrl, onClick }: { bonusUrl: string; onClick?: () => void }) {
  return (
    <a
      href={bonusUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="btn-outline bonus-btn h-10 rounded-full relative border border-[#E1E1F0] flex items-center gap-1"
    >
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
    </a>
  )
}

/* ─── экран победы ──────────────────────────────────────────────────────── */

function WinScreen({
  moves,
  elapsed,
  onRestart,
  onClaimBonus,
  onShare,
  bonusUrl,
}: {
  moves: number
  elapsed: number
  onRestart: () => void
  onClaimBonus: () => void
  onShare: (channel: 'vk' | 'ok' | 'tg') => void
  bonusUrl: string
}) {
  const shareUrl = encodeURIComponent(bonusUrl)
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  const timeStr = `${mm}:${ss}`

  const cardContent = (
    <>
      <div className="flex items-center gap-1 mb-3 justify-center overflow-hidden w-full">
        <RectangleSmall className="text-[#FF6A13]/20 shrink-0" />
        <RectangleSmall className="text-[#FF6A13]/50 shrink-0" />
        <RectangleSmall className="text-[#FF6A13] shrink-0" />
        <p className="win-title font-bold italic px-2 whitespace-nowrap shrink-0">ИГРА ПРОЙДЕНА!</p>
        <RectangleSmall className="text-[#FF6A13] shrink-0" />
        <RectangleSmall className="text-[#FF6A13]/50 shrink-0" />
        <RectangleSmall className="text-[#FF6A13]/20 shrink-0" />
      </div>

      <p className="win-subtitle font-bold italic mb-5 uppercase">
        Поздравляем! Ты прошёл все уровни!
      </p>

      <div className="grid gap-2.5 grid-cols-2 w-full mb-2.5 rounded-[10px] overflow-hidden">
        <div className="p-4 border rounded-[10px] border-[#E1E1F0]">
          <p className="win-section-label font-bold italic uppercase mb-3">Твой результат</p>
          <div className="grid grid-cols-[1fr_1px_1fr] items-center justify-center gap-3">
            <div>
              <p className="win-value font-bold italic">{moves}</p>
              <p className="win-value-label font-bold italic uppercase mt-1">Ходы</p>
            </div>
            <div
              className="w-px self-stretch"
              style={{ background: 'linear-gradient(to bottom, white, #FF6A13 45%, white)' }}
            />

            <div>
              <p className="win-value font-bold italic">{timeStr}</p>
              <p className="win-value-label font-bold italic uppercase mt-1">Время</p>
            </div>
          </div>
        </div>
        <div className="p-4 border rounded-[10px] border-[#E1E1F0]">
          <p className="win-section-label font-bold italic uppercase mb-1">Поделиться</p>
          <div className="flex gap-2 justify-center">
            <a
              href={`https://vk.com/share.php?url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onShare('vk')}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#0077FF' }}
            >
              <img src="./vk.svg" />
            </a>
            <a
              href={`https://t.me/share/url?url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onShare('tg')}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#29B6F6' }}
            >
              <img src="./tg.svg" />
            </a>
            <a
              href={`https://connect.ok.ru/offer?url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onShare('ok')}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#EE8208' }}
            >
              <img src="./ok.svg" />
            </a>
          </div>
        </div>
      </div>

      <div
        className="w-full rounded-[10px] p-4 mb-5 text-center"
        style={{ border: '1px solid #E1E1F0' }}
      >
        <p className="win-bonus-text font-bold italic uppercase">Забирай бонус от Winline:</p>
        <p className="win-bonus-text font-bold italic text-[#FF6A13] uppercase">
          Фрибет 10&nbsp;000!
        </p>
      </div>

      <button
        className="btn-primary bg-[#FF6A13] rounded-full flex items-center justify-center gap-2 w-full py-3 mb-3"
        onClick={onClaimBonus}
      >
        <GiftIconWhite />
        <span className="uppercase font-bold italic text-[20px]/[20px] text-white">
          Забрать бонус
        </span>
      </button>
      <button
        className="btn-outline rounded-full border border-[#E1E1F0] w-full py-3 flex items-center justify-center gap-2"
        onClick={onRestart}
      >
        <img src={retry} />
        <span className="uppercase font-bold italic text-[20px]/[20px]">Играть снова</span>
      </button>
    </>
  )

  return (
    <>
      {/* ── Десктоп: заменяет main ── */}
      <div
        className="desktop-only flex-1 flex flex-col"
        style={{
          backgroundImage: 'url(./win.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: 'calc(100vh - 81px)',
        }}
      >
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-[20px] w-full max-w-[480px] p-8 flex flex-col items-center text-center"
            style={{
              border: '2px solid #FF6A13',
              boxShadow: '0px 2px 44px rgba(255, 106, 19, 0.6), -2px 4px 3px rgba(0, 0, 0, 0.02)',
            }}
          >
            {cardContent}
          </div>
        </div>
      </div>

      {/* ── Мобилка: конфетти сверху над карточкой ── */}
      <div
        className="mobile-only fixed inset-0 z-[48] pointer-events-none"
        style={{
          backgroundImage: 'url(./win.webp)',
          backgroundSize: 'cover',
          backgroundPosition: '50% -80px',
        }}
      />

      {/* ── Мобилка: карточка выезжает снизу ── */}
      <div
        className="mobile-only fixed bottom-[65px] left-0 right-0 z-[51] rules-modal-mobile bg-white overflow-y-auto max-h-[85vh]"
        style={{ borderTop: '2px solid #FF6A13', borderRadius: '20px 20px 0 0' }}
      >
        <div className="px-4 pt-6 pb-6 flex flex-col items-center text-center">{cardContent}</div>
      </div>
    </>
  )
}

/* ─── главный компонент ─────────────────────────────────────────────────── */

function App() {
  const [level, setLevel] = useState(1)
  const [deck, setDeck] = useState<CardData[]>(() => createDeck(1))
  const [selected, setSelected] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matched, setMatched] = useState(0)
  const [locked, setLocked] = useState(false)
  const [hintIds, setHintIds] = useState<number[]>([])
  const [rulesOpen, setRulesOpen] = useState(true)
  const [bonusImage, setBonusImage] = useState<string | null>(null)
  const [winOpen, setWinOpen] = useState(false)
  const [levelCompleteOpen, setLevelCompleteOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const gameStartRef = useRef<number>(Date.now())
  const totalMovesRef = useRef<number>(0)
  const { isSoundOn, play, toggleSound } = useSound()
  const { track, bonusUrl } = useGameBackend()

  const matchedPairs = matched
  const totalPairs = PAIRS_PER_LEVEL

  // Таймер + старт первого уровня (аналитика)
  useEffect(() => {
    track({ type: 'level_started', level: 1 })
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [track])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    play('click')
    track({ type: 'replayed' })
    track({ type: 'level_started', level: 1 })
    setLevel(1)
    setDeck(createDeck(1))
    setSelected([])
    setMoves(0)
    setMatched(0)
    setLocked(false)
    setWinOpen(false)
    setHintIds([])
    setElapsed(0)
    gameStartRef.current = Date.now()
    totalMovesRef.current = 0
    startTimer()
  }, [play, track, startTimer])

  // Переход на следующий уровень
  const nextLevel = useCallback(() => {
    const next = level + 1
    play('click')
    track({ type: 'level_started', level: next })
    setLevel(next)
    setDeck(createDeck(next))
    setSelected([])
    setMoves(0)
    setMatched(0)
    setLocked(false)
    setHintIds([])
    setElapsed(0)
    startTimer()
  }, [level, play, track, startTimer])

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
              stopTimer()
              const durationMs = Date.now() - startTimeRef.current
              const levelMoves = moves + 1
              totalMovesRef.current += levelMoves
              track({ type: 'level_completed', level, moves: levelMoves, duration_ms: durationMs })

              if (level >= TOTAL_LEVELS) {
                play('gameFinished')
                track({
                  type: 'game_completed',
                  total_moves: totalMovesRef.current,
                  total_duration_ms: Date.now() - gameStartRef.current,
                })
                setTimeout(() => setWinOpen(true), 400)
              } else {
                play('levelComplete')
                setTimeout(() => setLevelCompleteOpen(true), 400)
              }
            } else if (isBonus) {
              play('bonus')
              track({ type: 'special_pair_found', level })
              setBonusImage(first.image || './foot.webp')
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
    [deck, selected, locked, matched, totalPairs, play, track, moves, stopTimer, level]
  )

  const won = matchedPairs === totalPairs

  // Подсказка — кратко показать все неоткрытые карточки
  const handleHint = useCallback(() => {
    if (locked || won) return
    // Собираем неоткрытые карточки по парам, берём случайную полную пару
    const byPair = new Map<number, number[]>()
    for (const c of deck) {
      if (c.isMatched || c.isFlipped) continue
      const arr = byPair.get(c.pairId) ?? []
      arr.push(c.id)
      byPair.set(c.pairId, arr)
    }
    const fullPairs = [...byPair.values()].filter((ids) => ids.length === 2)
    if (fullPairs.length === 0) return
    const pair = fullPairs[Math.floor(Math.random() * fullPairs.length)]
    play('click')
    track({ type: 'hint_used', level })
    setHintIds(pair)
    setTimeout(() => setHintIds([]), 1500)
  }, [deck, locked, won, play, track, level])

  // Клик по «Забрать бонус» — аналитика + переход на ссылку Winline
  const claimBonus = useCallback(
    (placement: 'level_popup' | 'special_popup' | 'final_screen') => {
      track({ type: 'bonus_clicked', placement })
      window.open(bonusUrl, '_blank', 'noopener')
    },
    [track, bonusUrl]
  )

  // Клик по кнопке «поделиться»
  const share = useCallback(
    (channel: 'vk' | 'ok' | 'tg') => {
      track({ type: 'shared', channel })
    },
    [track]
  )

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  const timeStr = `${mm}:${ss}`

  return (
    <>
      {rulesOpen && (
        <RulesModal onClose={() => setRulesOpen(false)} onRestart={reset} bonusUrl={bonusUrl} />
      )}
      {bonusImage && (
        <BonusModal
          image={bonusImage}
          onClose={() => setBonusImage(null)}
          onClaimBonus={() => claimBonus('special_popup')}
        />
      )}
      {levelCompleteOpen && (
        <LevelCompleteModal
          onClose={() => {
            setLevelCompleteOpen(false)
            nextLevel()
          }}
          onClaimBonus={() => claimBonus('level_popup')}
        />
      )}

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
          <BonusButton bonusUrl={bonusUrl} />
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

      {/* ══════ WIN SCREEN ══════ */}
      {winOpen && (
        <WinScreen
          moves={moves}
          elapsed={elapsed}
          onRestart={reset}
          onClaimBonus={() => claimBonus('final_screen')}
          onShare={share}
          bonusUrl={bonusUrl}
        />
      )}

      {/* ══════ MAIN ══════ */}
      {!winOpen && (
        <main className="main-grid py-3.5 gap-7 grid">
          {/* ── Desktop: левая панель ── */}
          <div className="desktop-only flex flex-col justify-between">
            <div className="border border-[#E1E1F0] shadow-[-2px_4px_3px_rgba(0,0,0,0.02)] p-6 rounded-lg bg-white">
              <div className="mb-6">
                <p className="level-title font-bold italic text-center mb-2.5">УРОВЕНЬ {level}</p>
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
                  <p className="stat-value mb-1">{timeStr}</p>
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
                onClick={handleHint}
              >
                <img src={light} />
                <span className="text-[20px]/[20px] font-bold italic text-white uppercase">
                  подсказка
                </span>
              </button>
            </div>

            <div className="text-[#6C6C6C] font-whitney text-xs/[15px] font-medium">
              <p>Реклама 18+.</p>
              <p>Рекламодатель: ООО «Управляющая компания НКС». Erid: F7NfYUJCUneVcwrorawi</p>
            </div>
          </div>

          {/* ── Mobile: уровень + статы + ректанглы (над игровым полем) ── */}
          <div className="mobile-only flex flex-col mb-[15px]">
            <p className="font-bold text-[28px]/[28px] italic text-center mb-2.5">УРОВЕНЬ {level}</p>

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
                <p className="text-[22px]/[22px] mb-1">{timeStr}</p>
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
            {deck.map((card) => (
              <Card
                key={card.id}
                card={card}
                onClick={() => handleClick(card.id)}
                placeholderColor={PLACEHOLDER_COLORS[card.pairId - 3] ?? '#999'}
                hinted={hintIds.includes(card.id)}
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
              <p className="howto-title font-bold italic text-center mb-5">КАК ИГРАТЬ</p>
              <ul>
                <li className="flex gap-2.5 items-center font-whitney font-medium rules-text mb-5">
                  <img src={touch} />
                  <p>Нажимай на карточки, чтобы открыть их</p>
                </li>
                <li className="flex gap-2.5 items-center font-whitney font-medium rules-text mb-5">
                  <img src={cards} />
                  <p>Найди две одинаковые карточки, чтобы собрать пару</p>
                </li>
                <li className="flex gap-2.5 items-center font-whitney font-medium rules-text mb-5">
                  <img src={cup} />
                  <p>Собери все пары за наименьшее количество ходов и времени</p>
                </li>
              </ul>
              <button
                className="btn-outline flex rounded-full border border-[#E1E1F0] py-3 w-full justify-center gap-1"
                onClick={reset}
              >
                <img src={retry} />
                <span className="restart-btn-text uppercase font-bold italic">Начать заново</span>
              </button>
            </div>
            <a
              href={bonusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-[469/250] rounded-[10px] shadow-[-2px_4px_3px_rgba(0,0,0,0.02),-2px_4px_3px_rgba(0,0,0,0.02)] bg-gray-400 overflow-hidden cursor-pointer"
            >
              <img src="./ad.webp" className="w-full h-full object-cover" />
            </a>
          </div>
        </main>
      )}

      {/* ══════ MOBILE BOTTOM BAR ══════ */}
      <div className="mobile-only fixed bottom-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-3 border-t border-[#E1E1F0] bg-white">
        <div className="flex items-center gap-2.5">
          <button
            className="btn-outline w-10 h-10 rounded-full border border-[#E1E1F0] flex items-center justify-center"
            onClick={() => setRulesOpen(true)}
          >
            <img src={info} alt="info" className="w-5 h-5" />
          </button>
          <SoundButton isSoundOn={isSoundOn} onToggle={toggleSound} />
          <BonusButton bonusUrl={bonusUrl} />
        </div>

        <button
          className="btn-primary bg-[#FF6A13] rounded-full flex items-center gap-1 px-5 py-2.5"
          onClick={handleHint}
        >
          <img src={light} />
          <span className="text-[16px]/[16px] font-bold italic text-white uppercase">подсказка</span>
        </button>
      </div>
    </>
  )
}

export default App
