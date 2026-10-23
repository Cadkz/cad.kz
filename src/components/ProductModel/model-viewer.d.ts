import type { DetailedHTMLProps, HTMLAttributes } from 'react'

/** Веб-компонент <model-viewer> от Google: атрибуты, которые мы используем. */
type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
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
  'disable-zoom'?: boolean
  loading?: 'auto' | 'lazy' | 'eager'
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes
    }
  }
}
