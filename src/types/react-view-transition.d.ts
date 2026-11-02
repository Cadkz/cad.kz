// В React из Next.js (App Router) <ViewTransition> и addTransitionType уже без префикса unstable_,
// а в @types/react 19.2.0 описаны только с префиксом. Описание переносим под настоящие имена.
import type { ExoticComponent, ViewTransitionProps } from 'react'
import type {} from 'react/experimental'

declare module 'react' {
  export const ViewTransition: ExoticComponent<ViewTransitionProps>
  export function addTransitionType(type: string): void
}
