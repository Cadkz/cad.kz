import type { DetailedHTMLProps, HTMLAttributes } from 'react'

/** Веб-компонент <model-viewer> от Google: атрибуты, которые мы используем. */
type ModelViewerAttributes = DetailedHTMLProps<
  HTMLAttributes<ModelViewerElement>,
  ModelViewerElement
> & {
  src: string
  alt: string
  poster?: string
  'camera-controls'?: boolean
  'auto-rotate'?: boolean
  'auto-rotate-delay'?: string
  'rotation-per-second'?: string
  'touch-action'?: string
  'shadow-intensity'?: string
  exposure?: string
  'interaction-prompt'?: string
  'camera-orbit'?: string
  'min-camera-orbit'?: string
  'max-camera-orbit'?: string
  'min-field-of-view'?: string
  orientation?: string
  loading?: 'auto' | 'lazy' | 'eager'
}

/** То, что мы вызываем у элемента: положение камеры и её перенос. */
export type ModelViewerElement = HTMLElement & {
  getCameraOrbit(): { theta: number; phi: number; radius: number }
  cameraOrbit: string
  autoRotate: boolean
  resetTurntableRotation?: (theta?: number) => void
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes
    }
  }
}
