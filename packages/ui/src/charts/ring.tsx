"use client";

import { Arc, arc as arcGenerator } from "@visx/shape";
import { motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import { ringCssVars, useRing } from "./ring-context";

// Helper to generate arc path using d3 arc generator
function generateArcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  cornerRadius: number
): string {
  const generator = arcGenerator<unknown>({
    innerRadius,
    outerRadius,
    cornerRadius,
  });
  return generator({ startAngle, endAngle } as unknown as null) || "";
}

export interface RingProps {
  /** Index of the ring in the data array */
  index: number;
  /** Optional color override - falls back to data color or palette */
  color?: string;
  /** Animate the progress arc. Default: true */
  animate?: boolean;
  /** Show glow effect on hover. Default: true */
  showGlow?: boolean;
}

interface AnimatedProgressArcProps {
  index: number;
  innerRadius: number;
  outerRadius: number;
  progress: number;
  color: string;
  isHovered: boolean;
  isFaded: boolean;
  animationKey: number;
  showGlow: boolean;
}

function AnimatedProgressArc({
  index,
  innerRadius,
  outerRadius,
  progress,
  color,
  isHovered,
  isFaded,
  animationKey,
  showGlow,
}: AnimatedProgressArcProps) {
  const startAngle = -Math.PI / 2;
  const targetEndAngle = startAngle + 2 * Math.PI * progress;
  const cornerRadius = (outerRadius - innerRadius) / 2;

  // Progress arc delay - starts after background rings expand
  const progressDelay = 0.6 + index * 0.1;

  // Animate the end angle with spring
  const springValue = useSpring(0, {
    stiffness: 60,
    damping: 20,
    restDelta: 0.001,
  });

  // Reset and start animation on mount
  useEffect(() => {
    springValue.jump(0);
    const timeout = setTimeout(() => {
      springValue.set(1);
    }, progressDelay * 1000);
    return () => clearTimeout(timeout);
  }, [progressDelay, springValue]);

  // Transform spring value to arc path
  const animatedPath = useTransform(springValue, (v) => {
    const currentEndAngle = startAngle + (targetEndAngle - startAngle) * v;
    if (currentEndAngle <= startAngle + 0.01) {
      return "";
    }
    return generateArcPath(
      innerRadius,
      outerRadius,
      startAngle,
      currentEndAngle,
      cornerRadius
    );
  });

  return (
    <motion.path
      animate={{
        opacity: isFaded ? 0.4 : 1,
        scale: isHovered ? 1.03 : 1,
      }}
      d={animatedPath}
      fill={color}
      key={`progress-${animationKey}`}
      style={{
        transformOrigin: "center",
        filter:
          showGlow && isHovered ? `drop-shadow(0 0 12px ${color})` : "none",
      }}
      transition={{
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      }}
    />
  );
}

export function Ring({
  index,
  color: colorProp,
  animate = true,
  showGlow = true,
}: RingProps) {
  const {
    data,
    hoveredIndex,
    setHoveredIndex,
    animationKey,
    getColor,
    getRingRadii,
  } = useRing();

  const ringData = data[index];
  if (!ringData) {
    return null;
  }

  const { innerRadius, outerRadius } = getRingRadii(index);
  const color = colorProp || getColor(index);
  const progress = ringData.value / ringData.maxValue;

  const isHovered = hoveredIndex === index;
  const isFaded = hoveredIndex !== null && hoveredIndex !== index;

  // Stagger delay for ring expansion (phase 1)
  const ringExpandDelay = index * 0.08;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: SVG group for hover interaction
    <g
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      style={{ cursor: "pointer" }}
    >
      {/* Background track - full circle */}
      <Arc
        cornerRadius={(outerRadius - innerRadius) / 2}
        endAngle={2 * Math.PI}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={0}
      >
        {({ path }) => (
          <motion.path
            animate={{
              scale: 1,
              opacity: isFaded ? 0.3 : 1,
            }}
            d={path(null) || ""}
            fill={ringCssVars.ringBackground}
            initial={animate ? { scale: 0 } : { scale: 1 }}
            key={`bg-${animationKey}`}
            style={{ transformOrigin: "center" }}
            transition={{
              scale: {
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: animate ? ringExpandDelay : 0,
              },
              opacity: { duration: 0.2 },
            }}
          />
        )}
      </Arc>

      {/* Animated Progress arc */}
      {animate ? (
        <AnimatedProgressArc
          animationKey={animationKey}
          color={color}
          index={index}
          innerRadius={innerRadius}
          isFaded={isFaded}
          isHovered={isHovered}
          outerRadius={outerRadius}
          progress={progress}
          showGlow={showGlow}
        />
      ) : (
        <motion.path
          animate={{
            opacity: isFaded ? 0.4 : 1,
            scale: isHovered ? 1.03 : 1,
          }}
          d={generateArcPath(
            innerRadius,
            outerRadius,
            -Math.PI / 2,
            -Math.PI / 2 + 2 * Math.PI * progress,
            (outerRadius - innerRadius) / 2
          )}
          fill={color}
          style={{
            transformOrigin: "center",
            filter:
              showGlow && isHovered ? `drop-shadow(0 0 12px ${color})` : "none",
          }}
          transition={{
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 },
          }}
        />
      )}
    </g>
  );
}

Ring.displayName = "Ring";

export default Ring;
