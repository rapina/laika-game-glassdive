import { APP_CONFIG } from '../appConfig'
import type { GameCallbacks, GameRuntime } from './types'

type Fish = { x: number; y: number; vx: number; alive: boolean; surfaced: boolean; phase: number }
type Obstacle = { x: number; y: number; w: number; h: number }

const W = APP_CONFIG.designWidth
const H = APP_CONFIG.designHeight
const ROUND_SECONDS = 90
const ICE_COLS = 20
const ICE_ROWS = 36

export class SampleGame implements GameRuntime {
    private canvas = document.createElement('canvas')
    private ctx = this.canvas.getContext('2d')!
    private callbacks: GameCallbacks | null = null
    private resizeObs: ResizeObserver | null = null
    private raf = 0
    private last = 0
    private elapsed = 0
    private paused = false
    private muted = false
    private over = false
    private won = false
    private dragging = false
    private interactionCount = 0
    private locale: 'ko' | 'en' = navigator.language.toLowerCase().startsWith('ko') ? 'ko' : 'en'
    private ice = new Float32Array(ICE_COLS * ICE_ROWS).fill(1)
    private particles: { x: number; y: number; vx: number; vy: number; life: number }[] = []
    private fish: Fish[] = [
        { x: 105, y: 650, vx: 4, alive: true, surfaced: false, phase: 0 },
        { x: 200, y: 685, vx: -5, alive: true, surfaced: false, phase: 2 },
        { x: 300, y: 660, vx: 3, alive: true, surfaced: false, phase: 4 },
    ]
    private obstacles: Obstacle[] = [
        { x: 0, y: 520, w: 128, h: 25 }, { x: 260, y: 520, w: 140, h: 25 },
        { x: 92, y: 392, w: 218, h: 26 },
        { x: 0, y: 265, w: 145, h: 25 }, { x: 250, y: 265, w: 150, h: 25 },
        { x: 120, y: 145, w: 170, h: 24 },
    ]
    private audio: AudioContext | null = null

    async mount(container: HTMLElement, callbacks: GameCallbacks): Promise<void> {
        this.callbacks = callbacks
        // 4× backing store preserves >= device DPR even when a 390px design
        // is scaled up to the required 430px portrait viewport.
        const backingScale = Math.max(4, Math.min(devicePixelRatio || 1, 4))
        this.canvas.width = W * backingScale
        this.canvas.height = H * backingScale
        this.ctx.setTransform(this.canvas.width / W, 0, 0, this.canvas.height / H, 0, 0)
        this.canvas.style.touchAction = 'none'
        this.canvas.setAttribute('aria-label', '유리잠수 / Glass Dive')
        container.appendChild(this.canvas)
        const fit = () => {
            const s = Math.min(container.clientWidth / W, container.clientHeight / H)
            this.canvas.style.width = `${W * s}px`
            this.canvas.style.height = `${H * s}px`
        }
        fit()
        this.resizeObs = new ResizeObserver(fit)
        this.resizeObs.observe(container)
        this.canvas.addEventListener('pointerdown', this.pointerDown)
        this.canvas.addEventListener('pointermove', this.pointerMove)
        this.canvas.addEventListener('pointerup', this.pointerUp)
        this.canvas.addEventListener('pointercancel', this.pointerUp)
        document.addEventListener('visibilitychange', this.visibility)
        ;(globalThis as unknown as { __forceGameOver?: () => void }).__forceGameOver = () => this.finish(false)
        ;(globalThis as unknown as { __gameDesignSize?: object }).__gameDesignSize = { w: W, h: H }
        this.last = performance.now()
        this.raf = requestAnimationFrame(this.loop)
    }

    private visibility = () => {
        this.paused = document.hidden
        this.last = performance.now()
        if (this.audio) document.hidden ? this.audio.suspend() : this.audio.resume()
    }

    private pos(e: PointerEvent) {
        const r = this.canvas.getBoundingClientRect()
        return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }
    }

    private pointerDown = (e: PointerEvent) => {
        this.dragging = true
        this.canvas.setPointerCapture(e.pointerId)
        this.ensureAudio()
        const p = this.pos(e)
        this.melt(p.x, p.y)
    }
    private pointerMove = (e: PointerEvent) => {
        if (!this.dragging) return
        const p = this.pos(e)
        this.melt(p.x, p.y)
    }
    private pointerUp = () => {
        this.dragging = false
        if (this.over) this.restartRun()
    }

    private melt(x: number, y: number) {
        if (this.over || y < 70) return
        this.interactionCount++
        const cx = x / W * ICE_COLS
        const cy = y / H * ICE_ROWS
        for (let iy = Math.max(0, Math.floor(cy - 2.2)); iy <= Math.min(ICE_ROWS - 1, Math.ceil(cy + 2.2)); iy++) {
            for (let ix = Math.max(0, Math.floor(cx - 2.2)); ix <= Math.min(ICE_COLS - 1, Math.ceil(cx + 2.2)); ix++) {
                const d = Math.hypot(ix + .5 - cx, iy + .5 - cy)
                if (d < 2.25) this.ice[iy * ICE_COLS + ix] = Math.max(0, this.ice[iy * ICE_COLS + ix] - .2 * (2.4 - d))
            }
        }
        for (let i = 0; i < 5; i++) this.particles.push({ x, y, vx: (Math.random() - .5) * 25, vy: -20 - Math.random() * 25, life: 1 })
        this.tone(170 + y * .18)
    }

    private ensureAudio() {
        if (this.muted || this.audio) return
        this.audio = new AudioContext()
    }
    private tone(freq: number) {
        if (!this.audio || this.muted || this.audio.state !== 'running') return
        const o = this.audio.createOscillator()
        const g = this.audio.createGain()
        o.type = 'sine'; o.frequency.value = freq
        g.gain.setValueAtTime(.018, this.audio.currentTime)
        g.gain.exponentialRampToValueAtTime(.001, this.audio.currentTime + .08)
        o.connect(g).connect(this.audio.destination); o.start(); o.stop(this.audio.currentTime + .08)
    }

    private loop = (now: number) => {
        const dt = Math.min(.04, (now - this.last) / 1000)
        this.last = now
        if (!this.paused && !this.over) this.update(dt)
        this.draw()
        this.raf = requestAnimationFrame(this.loop)
    }

    private update(dt: number) {
        this.elapsed += dt
        for (const f of this.fish) {
            if (!f.alive || f.surfaced) continue
            f.phase += dt * 2
            f.vx += Math.sin(f.phase) * dt * 8
            f.x += f.vx * dt
            f.x = Math.max(14, Math.min(W - 14, f.x))
            if (f.x <= 14 || f.x >= W - 14) f.vx *= -1
            const ice = this.ice[Math.min(ICE_ROWS - 1, Math.floor(f.y / H * ICE_ROWS)) * ICE_COLS + Math.min(ICE_COLS - 1, Math.floor(f.x / W * ICE_COLS))]
            f.y -= (ice < .42 ? 42 : 7) * dt
            for (const o of this.obstacles) {
                if (f.x > o.x - 8 && f.x < o.x + o.w + 8 && f.y > o.y - 9 && f.y < o.y + o.h + 9) f.alive = false
            }
            if (f.y < 75) f.surfaced = true
        }
        for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.6 }
        this.particles = this.particles.filter(p => p.life > 0)
        if (this.fish.every(f => f.surfaced)) this.finish(true)
        else if (this.fish.every(f => !f.alive)) this.finish(false)
        else if (this.elapsed >= ROUND_SECONDS) this.finish(false)
    }

    private finish(won: boolean) {
        if (this.over) return
        this.over = true; this.won = won
        const saved = this.fish.filter(f => f.surfaced).length
        this.callbacks?.onGameOver({ score: saved * 100 + Math.max(0, Math.ceil(ROUND_SECONDS - this.elapsed)), phase: saved })
    }

    restartRun() {
        if (!this.over) return
        this.over = false; this.won = false; this.elapsed = 0; this.ice.fill(1); this.particles = []
        this.fish = [
            { x: 105, y: 650, vx: 4, alive: true, surfaced: false, phase: 0 },
            { x: 200, y: 685, vx: -5, alive: true, surfaced: false, phase: 2 },
            { x: 300, y: 660, vx: 3, alive: true, surfaced: false, phase: 4 },
        ]
    }
    setPaused(v: boolean) { this.paused = v; this.last = performance.now() }
    setMuted(v: boolean) { this.muted = v; if (v) this.audio?.suspend(); else this.audio?.resume() }
    setLocale(v: 'ko' | 'en') { this.locale = v }

    private drawFish(f: Fish) {
        const c = this.ctx
        c.save(); c.translate(f.x, f.y)
        c.globalAlpha = f.alive ? 1 : .2
        c.strokeStyle = f.surfaced ? '#fff4c8' : '#9bf9ff'; c.lineWidth = 2
        c.fillStyle = 'rgba(160,245,255,.16)'
        c.beginPath(); c.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2); c.fill(); c.stroke()
        c.beginPath(); c.moveTo(-10, 0); c.lineTo(-18, -7); c.lineTo(-18, 7); c.closePath(); c.stroke()
        c.fillStyle = '#fff'; c.beginPath(); c.arc(5, -1, 1.3, 0, Math.PI * 2); c.fill(); c.restore()
    }

    private draw() {
        const c = this.ctx
        c.clearRect(0, 0, W, H)
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#08253b'); g.addColorStop(1, '#010711')
        c.fillStyle = g; c.fillRect(0, 0, W, H)
        c.fillStyle = 'rgba(121,229,255,.12)'; c.fillRect(0, 60, W, 10)
        for (const o of this.obstacles) {
            c.fillStyle = '#07111e'; c.fillRect(o.x, o.y, o.w, o.h)
            c.strokeStyle = '#31546a'; c.strokeRect(o.x + .5, o.y + .5, o.w - 1, o.h - 1)
        }
        const cw = W / ICE_COLS, ch = H / ICE_ROWS
        for (let y = 3; y < ICE_ROWS; y++) for (let x = 0; x < ICE_COLS; x++) {
            const a = this.ice[y * ICE_COLS + x]
            if (a < .03) continue
            c.fillStyle = `rgba(111,173,195,${a * .22})`; c.fillRect(x * cw, y * ch, cw + .4, ch + .4)
            c.strokeStyle = `rgba(196,241,246,${a * .09})`; c.strokeRect(x * cw, y * ch, cw, ch)
        }
        for (const p of this.particles) { c.fillStyle = `rgba(167,246,255,${p.life})`; c.beginPath(); c.arc(p.x, p.y, 2, 0, 7); c.fill() }
        for (const f of this.fish) if (!f.surfaced) this.drawFish(f)
        c.fillStyle = '#d9faff'; c.font = 'bold 15px Galmuri14, sans-serif'; c.textAlign = 'left'
        c.fillText(this.locale === 'ko' ? '유리잠수' : 'GLASS DIVE', 16, 29)
        c.font = '12px Galmuri11, sans-serif'; c.fillStyle = '#8eb6c6'
        c.fillText(`${this.locale === 'ko' ? '수면' : 'SURFACE'}  ${this.fish.filter(f => f.surfaced).length}/3`, 16, 49)
        c.textAlign = 'right'; c.fillText(`${Math.max(0, Math.ceil(ROUND_SECONDS - this.elapsed))}s`, W - 16, 29)
        if (this.elapsed < 5 && this.interactionCount === 0) {
            c.textAlign = 'center'; c.fillStyle = '#e9fdff'; c.font = '14px Galmuri11, sans-serif'
            c.fillText(this.locale === 'ko' ? '누르고 끌어 얼음을 녹이세요' : 'PRESS & DRAG TO MELT ICE', W / 2, H - 28)
        }
        if (this.over) {
            c.fillStyle = 'rgba(1,7,17,.82)'; c.fillRect(30, H / 2 - 75, W - 60, 150)
            c.textAlign = 'center'; c.fillStyle = this.won ? '#fff2b3' : '#a9d6df'; c.font = 'bold 24px Galmuri14, sans-serif'
            c.fillText(this.won ? (this.locale === 'ko' ? '수면에 닿았다' : 'SURFACE REACHED') : (this.locale === 'ko' ? '유리가 잠들었다' : 'GLASS AT REST'), W / 2, H / 2 - 18)
            c.font = '13px Galmuri11, sans-serif'; c.fillStyle = '#bad7df'
            c.fillText(this.locale === 'ko' ? '화면을 눌러 다시 잠수' : 'TAP TO DIVE AGAIN', W / 2, H / 2 + 28)
        }
    }

    destroy() {
        cancelAnimationFrame(this.raf); this.resizeObs?.disconnect()
        this.canvas.removeEventListener('pointerdown', this.pointerDown); this.canvas.removeEventListener('pointermove', this.pointerMove)
        this.canvas.removeEventListener('pointerup', this.pointerUp); document.removeEventListener('visibilitychange', this.visibility)
        this.canvas.remove(); this.audio?.close()
    }
    getDebugState() {
        return { over: this.over, score: this.fish.filter(f => f.surfaced).length, timeLeft: Math.max(0, ROUND_SECONDS - this.elapsed), interactionCount: this.interactionCount, meltedCells: [...this.ice].filter(v => v < .5).length, fishAlive: this.fish.filter(f => f.alive).length }
    }
}
