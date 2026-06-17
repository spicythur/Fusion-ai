import type { Variants, Transition } from "framer-motion";

/* ============================================
   REUSABLE ANIMATION VARIANTS
   ============================================ */

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

/** Container that staggers children */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

/* ============================================
   TRANSITIONS
   ============================================ */

export const spring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const smooth: Transition = {
  duration: 0.4,
  ease: "easeOut",
};

export const fast: Transition = {
  duration: 0.2,
  ease: "easeOut",
};

export const bounce: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 15,
};

/* ============================================
   HOVER & TAP
   ============================================ */

export const hoverLift = {
  whileHover: { y: -4, transition: { type: "spring" as const, stiffness: 400, damping: 20 } },
  whileTap: { scale: 0.98 },
};

export const hoverGlow = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
};

export const tapScale = {
  whileTap: { scale: 0.95 },
};

/* ============================================
   VIEWPORT
   ============================================ */

export const viewportOnce = {
  once: true,
  margin: "-60px",
};
