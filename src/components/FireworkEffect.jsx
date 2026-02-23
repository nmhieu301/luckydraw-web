import { useEffect, useRef, useCallback } from 'react'

const COLORS = ['#F59E0B', '#FDE68A', '#DC2626', '#FF6B6B', '#FB923C', '#4ADE80', '#FBBF24']

export default function FireworkEffect() {
    const canvasRef = useRef(null)
    const particlesRef = useRef([])
    const rafRef = useRef(null)
    const isRunningRef = useRef(false)

    const startLoop = useCallback(() => {
        if (isRunningRef.current) return
        isRunningRef.current = true

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particlesRef.current = particlesRef.current.filter(p => {
                p.x += p.vx
                p.y += p.vy
                p.vy += p.gravity
                p.vx *= 0.99
                p.alpha -= p.decay

                if (p.alpha <= 0) return false

                ctx.globalAlpha = p.alpha
                ctx.fillStyle = p.color

                if (p.shape === 'star') {
                    drawStar(ctx, p.x, p.y, p.size)
                } else {
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                    ctx.fill()
                }

                return true
            })

            ctx.globalAlpha = 1

            if (particlesRef.current.length > 0) {
                rafRef.current = requestAnimationFrame(animate)
            } else {
                isRunningRef.current = false
            }
        }

        rafRef.current = requestAnimationFrame(animate)
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')

        function resize() {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        function createParticles(x, y) {
            const count = 12 + Math.floor(Math.random() * 8)
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5
                const speed = 2 + Math.random() * 4
                const size = 2 + Math.random() * 3
                particlesRef.current.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    alpha: 1,
                    decay: 0.015 + Math.random() * 0.02,
                    gravity: 0.05,
                    shape: Math.random() > 0.5 ? 'circle' : 'star',
                })
            }
            startLoop()
        }

        function handleClick(e) {
            createParticles(e.clientX, e.clientY)
        }

        function handleTouch(e) {
            const touch = e.touches[0]
            if (touch) {
                createParticles(touch.clientX, touch.clientY)
            }
        }

        window.addEventListener('click', handleClick)
        window.addEventListener('touchstart', handleTouch, { passive: true })

        return () => {
            window.removeEventListener('resize', resize)
            window.removeEventListener('click', handleClick)
            window.removeEventListener('touchstart', handleTouch)
            cancelAnimationFrame(rafRef.current)
        }
    }, [startLoop])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{ touchAction: 'none' }}
        />
    )
}

function drawStar(ctx, cx, cy, size) {
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i - Math.PI / 2
        const outerX = cx + Math.cos(angle) * size
        const outerY = cy + Math.sin(angle) * size
        const innerAngle = angle + Math.PI / 5
        const innerX = cx + Math.cos(innerAngle) * size * 0.4
        const innerY = cy + Math.sin(innerAngle) * size * 0.4
        if (i === 0) ctx.moveTo(outerX, outerY)
        else ctx.lineTo(outerX, outerY)
        ctx.lineTo(innerX, innerY)
    }
    ctx.closePath()
    ctx.fill()
}
