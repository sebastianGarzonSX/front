'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { formatNumber } from '@/components/dashboard/KPICard'

export interface FunnelStep {
  label:    string
  count:    number
  color:    string
  costPer?: number
  convPct?: number
  pctTotal?: number
}

interface Funnel3DCanvasProps {
  steps:        FunnelStep[]
  selectedIdx:  number | null
  onSelect:     (idx: number) => void
}

const hexToNum = (h: string) => parseInt(h.replace('#', ''), 16)

export default function Funnel3DCanvas({ steps, selectedIdx, onSelect }: Funnel3DCanvasProps) {
  const wrapRef         = useRef<HTMLDivElement>(null)
  const rafRef          = useRef<number | null>(null)
  const selectedIdxRef  = useRef<number | null>(selectedIdx)
  const onSelectRef     = useRef(onSelect)

  // Mantener refs actualizadas sin recrear escena
  useEffect(() => { selectedIdxRef.current = selectedIdx }, [selectedIdx])
  useEffect(() => { onSelectRef.current    = onSelect    }, [onSelect])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || steps.length === 0) return

    let W = wrap.clientWidth  || 500
    let H = wrap.clientHeight || 460
    const isMobile = () => W < 600

    /* ── Scene / camera / renderers ───────────────────────────────────────── */
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100)
    camera.position.set(0, 1.4, 11.5)
    camera.lookAt(0, -0.2, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    wrap.appendChild(renderer.domElement)

    const labelRenderer = new CSS2DRenderer()
    labelRenderer.setSize(W, H)
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.inset    = '0'
    labelRenderer.domElement.style.pointerEvents = 'none'
    wrap.appendChild(labelRenderer.domElement)

    /* ── Lighting ─────────────────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.42))
    const keyLight = new THREE.DirectionalLight(0xfff4e8, 1.5)
    keyLight.position.set(5, 9, 7)
    scene.add(keyLight)

    const coolFill = new THREE.PointLight(0x5577ff, 1.0, 30)
    coolFill.position.set(-7, 3, 4)
    scene.add(coolFill)

    const warmAccent = new THREE.PointLight(0xffaa55, 0.6, 30)
    warmAccent.position.set(7, -3, 4)
    scene.add(warmAccent)

    const backRim = new THREE.PointLight(0x99aaff, 0.85, 25)
    backRim.position.set(0, 5, -8)
    scene.add(backRim)

    /* ── Funnel ───────────────────────────────────────────────────────────── */
    const group = new THREE.Group()
    scene.add(group)

    const N        = steps.length
    const STAGE_H  = isMobile() ? 0.62 : 0.80
    const MAX_R    = isMobile() ? 1.95 : 2.35
    const MIN_R    = isMobile() ? 0.45 : 0.55
    const SEGS     = 64

    const radii: number[] = []
    for (let i = 0; i <= N; i++) {
      const t = i / N
      radii.push(MAX_R + (MIN_R - MAX_R) * (t * (2 - t)))
    }

    const totalH = N * STAGE_H
    const yTop   = totalH / 2

    interface UD { step: FunnelStep; baseY: number; baseEmissive: number; idx: number }

    const meshes: THREE.Mesh[] = []
    const rings:  THREE.Mesh[] = []

    steps.forEach((step, i) => {
      const topR = radii[i]
      const botR = radii[i + 1]
      const yPos = yTop - i * STAGE_H - STAGE_H / 2

      const geo = new THREE.CylinderGeometry(botR, topR, STAGE_H, SEGS, 1, false)
      const colorNum = hexToNum(step.color)

      const mat = new THREE.MeshPhysicalMaterial({
        color:              colorNum,
        metalness:          0.45,
        roughness:          0.28,
        clearcoat:          0.32,
        clearcoatRoughness: 0.08,
        emissive:           new THREE.Color(colorNum),
        emissiveIntensity:  0.04,
      })

      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.y = yPos
      mesh.scale.set(0.001, 0.001, 0.001)
      mesh.userData = { step, baseY: yPos, baseEmissive: 0.04, idx: i } as UD
      group.add(mesh)
      meshes.push(mesh)

      // Aro luminoso en el borde superior
      const ringGeo = new THREE.TorusGeometry(topR, 0.02, 14, SEGS)
      const ringMat = new THREE.MeshBasicMaterial({
        color:       colorNum,
        transparent: true,
        opacity:     0.5,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.y = yPos + STAGE_H / 2
      ring.rotation.x = Math.PI / 2
      ring.scale.set(0.001, 0.001, 0.001)
      group.add(ring)
      rings.push(ring)

      // ── Number label sobre el segmento ─────────────────────────────────
      const numEl = document.createElement('div')
      numEl.style.cssText = `
        pointer-events:none;user-select:none;
        font-family:ui-sans-serif,system-ui,sans-serif;
        font-size:${isMobile() ? '14px' : '17px'};
        font-weight:700;color:#ffffff;
        text-shadow:0 2px 8px rgba(0,0,0,0.85),0 0 12px ${step.color}88;
        letter-spacing:-0.02em;white-space:nowrap;
      `
      numEl.textContent = formatNumber(step.count)
      const numObj = new CSS2DObject(numEl)
      numObj.position.set(0, yPos - 0.05, MAX_R + 0.05)
      scene.add(numObj)

      const nameEl = document.createElement('div')
      nameEl.style.cssText = `
        pointer-events:none;user-select:none;
        font-family:ui-monospace,monospace;
        font-size:${isMobile() ? '8px' : '9px'};
        font-weight:600;letter-spacing:0.16em;text-transform:uppercase;
        color:${step.color};
        text-shadow:0 1px 4px rgba(0,0,0,0.9);white-space:nowrap;
      `
      nameEl.textContent = step.label
      const nameObj = new CSS2DObject(nameEl)
      nameObj.position.set(0, yPos + STAGE_H * 0.30, MAX_R + 0.05)
      scene.add(nameObj)
    })

    /* ── Raycaster + interacción ──────────────────────────────────────────── */
    const ray     = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let hoveredIdx = -1
    let mouseX = 0, mouseY = 0

    const computePointer = (clientX: number, clientY: number) => {
      const rect = wrap.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      pointer.x = (x / W) * 2 - 1
      pointer.y = -(y / H) * 2 + 1
      mouseX = pointer.x
      mouseY = pointer.y
      return { x, y }
    }

    const intersect = () => {
      ray.setFromCamera(pointer, camera)
      const hits = ray.intersectObjects(meshes, false)
      return hits.length > 0 ? meshes.indexOf(hits[0].object as THREE.Mesh) : -1
    }

    const onMouseMove = (e: MouseEvent) => {
      computePointer(e.clientX, e.clientY)
      const idx = intersect()
      hoveredIdx = idx
      if (idx >= 0) {
        wrap.style.cursor = 'pointer'
        if (idx !== selectedIdxRef.current) {
          onSelectRef.current(idx)
        }
      } else {
        wrap.style.cursor = 'default'
      }
    }

    const onMouseLeave = () => {
      hoveredIdx = -1
      wrap.style.cursor = 'default'
    }

    const onClick = (e: MouseEvent) => {
      computePointer(e.clientX, e.clientY)
      const idx = intersect()
      if (idx >= 0) onSelectRef.current(idx)
    }

    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      if (!t) return
      computePointer(t.clientX, t.clientY)
      const idx = intersect()
      if (idx >= 0) {
        onSelectRef.current(idx)
        e.preventDefault()
      }
    }

    wrap.addEventListener('mousemove',  onMouseMove)
    wrap.addEventListener('mouseleave', onMouseLeave)
    wrap.addEventListener('click',      onClick)
    wrap.addEventListener('touchend',   onTouchEnd, { passive: false })

    /* ── Animation loop ───────────────────────────────────────────────────── */
    const startTime = performance.now()

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      const t = (performance.now() - startTime) / 1000
      const sel = selectedIdxRef.current
      const activeIdx = hoveredIdx >= 0 ? hoveredIdx : sel

      // Entrada escalonada + hover/selected highlight
      meshes.forEach((m, i) => {
        const stagger = i * 0.08
        const local   = Math.max(0, Math.min(1, (t - stagger) / 0.65))
        const eased   = 1 - Math.pow(1 - local, 3)

        const isActive   = i === activeIdx
        const hoverBoost = isActive ? 1.10 : 1.0
        const targetSc   = eased * hoverBoost

        m.scale.x += (targetSc - m.scale.x) * 0.18
        m.scale.y += (eased    - m.scale.y) * 0.18
        m.scale.z += (targetSc - m.scale.z) * 0.18

        const ud = m.userData as UD
        const targetEm = isActive ? 0.55 : ud.baseEmissive
        const mat = m.material as THREE.MeshPhysicalMaterial
        mat.emissiveIntensity += (targetEm - mat.emissiveIntensity) * 0.18
      })

      rings.forEach((r, i) => {
        const stagger = i * 0.08 + 0.05
        const local   = Math.max(0, Math.min(1, (t - stagger) / 0.65))
        const eased   = 1 - Math.pow(1 - local, 3)
        const isActive = i === activeIdx
        const target  = isActive ? 1.06 : 1.0
        r.scale.x += (eased * target - r.scale.x) * 0.18
        r.scale.y += (eased          - r.scale.y) * 0.18
        r.scale.z += (eased * target - r.scale.z) * 0.18
        const rm = r.material as THREE.MeshBasicMaterial
        rm.opacity += ((isActive ? 1.0 : 0.5) - rm.opacity) * 0.18
      })

      // Parallax con suavizado
      const targetRotY = mouseX * 0.32
      const targetRotX = mouseY * 0.16
      group.rotation.y += (targetRotY - group.rotation.y) * 0.06
      group.rotation.x += (targetRotX - group.rotation.x) * 0.06

      renderer.render(scene, camera)
      labelRenderer.render(scene, camera)
    }
    animate()

    /* ── Resize ───────────────────────────────────────────────────────────── */
    const onResize = () => {
      W = wrap.clientWidth  || 500
      H = wrap.clientHeight || 460
      camera.aspect = W / H
      camera.updateProjectionMatrix()
      renderer.setSize(W, H)
      labelRenderer.setSize(W, H)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(wrap)

    /* ── Cleanup ──────────────────────────────────────────────────────────── */
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      wrap.removeEventListener('mousemove',  onMouseMove)
      wrap.removeEventListener('mouseleave', onMouseLeave)
      wrap.removeEventListener('click',      onClick)
      wrap.removeEventListener('touchend',   onTouchEnd)

      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          const m = o.material
          if (Array.isArray(m)) m.forEach((x) => x.dispose())
          else m.dispose()
        }
      })
      renderer.dispose()
      if (wrap.contains(renderer.domElement))      wrap.removeChild(renderer.domElement)
      if (wrap.contains(labelRenderer.domElement)) wrap.removeChild(labelRenderer.domElement)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps])  // recrea solo si cambian las etapas

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      style={{ height: 'clamp(340px, 48vh, 480px)' }}
    />
  )
}
