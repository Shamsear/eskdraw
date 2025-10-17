'use client'

import { useEffect, useRef, useState } from 'react'

interface SpinWheelProps {
  items: { id: string; name: string; logoUrl?: string }[]
  onSpinComplete: (selectedItem: { id: string; name: string; logoUrl?: string }) => void
  spinning: boolean
  type: 'team' | 'player'
}

export default function SpinWheel({ items, onSpinComplete, spinning, type }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rotation, setRotation] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const colors = type === 'team' 
    ? ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']
    : ['#48C9B0', '#5DADE2', '#AF7AC5', '#EC7063', '#F8B739', '#58D68D', '#5F6A6A', '#EB984E']

  useEffect(() => {
    if (!canvasRef.current || items.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate((rotation * Math.PI) / 180)

    const sliceAngle = (2 * Math.PI) / items.length

    // Optimize drawing with fewer operations
    items.forEach((item, index) => {
      const startAngle = index * sliceAngle
      const endAngle = startAngle + sliceAngle

      // Draw slice
      ctx.beginPath()
      ctx.arc(0, 0, radius, startAngle, endAngle)
      ctx.lineTo(0, 0)
      ctx.fillStyle = colors[index % colors.length]
      ctx.fill()
      
      // Draw borders with optimization
      if (items.length <= 60) {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = items.length > 40 ? 0.5 : (items.length > 30 ? 1 : 2)
        ctx.stroke()
      }
    })

    // Draw text with adaptive font size
    items.forEach((item, index) => {
      const startAngle = index * sliceAngle
      
      ctx.save()
      ctx.rotate(startAngle + sliceAngle / 2)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#fff'
      
      // Adaptive font size based on number of items
      let fontSize = 14
      let textRadius = radius * 0.65
      if (items.length > 60) {
        fontSize = 8
        textRadius = radius * 0.75
      } else if (items.length > 40) {
        fontSize = 10
        textRadius = radius * 0.7
      } else if (items.length > 25) {
        fontSize = 12
        textRadius = radius * 0.68
      }
      
      ctx.font = `bold ${fontSize}px Arial`
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 2
      
      // Shorter text for many items
      let maxLength = 15
      if (items.length > 60) maxLength = 8
      else if (items.length > 40) maxLength = 10
      else if (items.length > 25) maxLength = 12
      
      const text = item.name.length > maxLength ? item.name.substring(0, maxLength - 2) + '..' : item.name
      ctx.fillText(text, textRadius, fontSize / 3)
      ctx.restore()
    })

    ctx.restore()

    // Draw pointer
    ctx.fillStyle = '#FF0000'
    ctx.beginPath()
    ctx.moveTo(centerX + radius - 20, centerY)
    ctx.lineTo(centerX + radius + 10, centerY - 15)
    ctx.lineTo(centerX + radius + 10, centerY + 15)
    ctx.closePath()
    ctx.fill()

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI)
    ctx.fillStyle = '#333'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()
  }, [items, rotation, colors, type])

  useEffect(() => {
    if (!spinning || items.length === 0) return

    const randomIndex = Math.floor(Math.random() * items.length)
    setSelectedIndex(randomIndex)

    // Pointer is at right side (0 degrees / 3 o'clock), so we need to adjust
    // We want the center of the selected slice to align with the right pointer
    const sliceAngle = 360 / items.length
    // Calculate rotation needed: rotate backward by the slice's position
    // Add offset to center the slice on the pointer
    const targetRotation = 360 * 5 - (randomIndex * sliceAngle) - (sliceAngle / 2)
    // Adjust duration based on number of items for smoother animation
    const duration = items.length > 50 ? 3000 : 4000 // Faster for many items
    const startTime = Date.now()
    const startRotation = rotation

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const currentRotation = startRotation + (targetRotation - startRotation) * easeProgress

      // Reduce update frequency for better performance with many items
      if (items.length > 50 && progress < 0.95) {
        // Skip some frames during the fast spin
        if (Math.random() > 0.7) {
          setRotation(currentRotation % 360)
        }
      } else {
        setRotation(currentRotation % 360)
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        onSpinComplete(items[randomIndex])
      }
    }

    animate()
  }, [spinning, items])

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg">
        <p className="text-gray-500">No {type}s available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="border-4 border-gray-300 rounded-full shadow-lg"
      />
      {selectedIndex !== null && !spinning && (
        <div className="mt-4 text-center">
          <p className="text-lg font-bold text-gray-700">
            Selected: {items[selectedIndex]?.name}
          </p>
        </div>
      )}
    </div>
  )
}
