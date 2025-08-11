'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

// Note: Les plugins premium comme DrawSVGPlugin, MorphSVGPlugin, SplitText 
// nécessitent d'être téléchargés depuis votre compte GSAP et importés manuellement
// Exemple:
// import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
// import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
// import { SplitText } from 'gsap/SplitText';

// Enregistrer les plugins disponibles
gsap.registerPlugin(ScrollTrigger, TextPlugin);

export function GSAPProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Configuration globale GSAP
    gsap.config({
      nullTargetWarn: false,
      force3D: true,
    });

    // Defaults pour les animations
    gsap.defaults({
      ease: 'power3.out',
      duration: 0.8,
    });

    // Nettoyage au démontage
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return <>{children}</>;
}