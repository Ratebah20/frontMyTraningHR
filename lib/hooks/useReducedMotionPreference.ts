'use client'
import { useReducedMotion } from 'framer-motion'

/**
 * Wrapper around framer-motion's useReducedMotion.
 * Returns true if user prefers reduced motion (prefers-reduced-motion: reduce).
 * Components should use this to skip or simplify animations.
 */
export function useReducedMotionPreference(): boolean {
  return useReducedMotion() ?? false
}
