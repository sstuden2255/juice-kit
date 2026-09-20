"use client";

import { animate, useMotionValue, useMotionValueEvent, useTransform, motion } from "motion/react";
import type { MotionValue, Transition } from "motion/react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { useReducedMotionPreference } from "../hooks/use-reduced-motion";
import { springs } from "../lib/springs";
import { cn } from "../lib/utils";

export interface AnimatedNumberProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  /** The number to display. Changing it rolls the digits from the previous value. */
  value: number;
  /**
   * Intl.NumberFormat options. Grouping, fraction digits, currency and unit styles work;
   * `notation: "compact"` does not (digits no longer map to positions).
   */
  format?: Intl.NumberFormatOptions;
  /** BCP 47 locale for formatting. Default: the runtime's default locale. */
  locale?: string;
  /** Spring or tween for the roll. Default: a near-critically damped spring. */
  transition?: Transition;
  /** Force reduced motion on or off; defaults to the user's OS preference. */
  reducedMotion?: boolean;
  /** Called when the roll settles on `value` (immediately under reduced motion). */
  onComplete?: () => void;
}

interface Layout {
  /** Text parts with digit positions counted from the right (0 = least significant digit). */
  parts: Array<{ kind: "digit"; position: number } | { kind: "text"; value: string }>;
  fractionDigits: number;
}

/**
 * Fraction columns to render. An explicit maximum wins; otherwise the resolved minimum is used
 * (0 for plain decimals, 2 for most currencies) so integers do not get phantom fraction columns
 * from Intl's default maximum of 3.
 */
function resolveFractionDigits(options: Intl.NumberFormatOptions | undefined): number {
  if (options?.maximumFractionDigits !== undefined) return options.maximumFractionDigits;
  const resolved = new Intl.NumberFormat(undefined, options).resolvedOptions();
  return Math.max(options?.minimumFractionDigits ?? 0, resolved.minimumFractionDigits ?? 0);
}

/** Digit count of the scaled integer part (at least 1). */
function integerDigitCount(scaled: number): number {
  const floored = Math.floor(Math.abs(scaled));
  return floored === 0 ? 1 : Math.floor(Math.log10(floored)) + 1;
}

/**
 * Continuous column position (0..10) for the digit at `position`, given the scaled value.
 * Behaves like a mechanical odometer: the lowest digit rolls continuously; a higher digit
 * only rolls while every digit below it is a 9.
 */
export function odometerPosition(scaled: number, position: number): number {
  const magnitude = Math.abs(scaled);
  const whole = Math.floor(magnitude);
  const fraction = magnitude - whole;
  const unit = 10 ** position;
  const base = Math.floor(whole / unit) % 10;
  if (position === 0) return base + fraction;
  const lowerAllNines = whole % unit === unit - 1;
  return lowerAllNines ? base + fraction : base;
}

function buildLayout(
  scaled: number,
  fractionDigits: number,
  locale: string | undefined,
  options: Intl.NumberFormatOptions | undefined,
): Layout {
  const sign = scaled < 0 ? -1 : 1;
  const whole = Math.floor(Math.abs(scaled)) * sign;
  const formatter = new Intl.NumberFormat(locale, {
    ...options,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  const partsIn = formatter.formatToParts(whole / 10 ** fractionDigits);
  const digitsTotal = partsIn
    .filter((p) => p.type === "integer" || p.type === "fraction")
    .reduce((sum, p) => sum + p.value.length, 0);
  let seen = 0;
  const parts: Layout["parts"] = [];
  for (const part of partsIn) {
    if (part.type === "integer" || part.type === "fraction") {
      for (let i = 0; i < part.value.length; i += 1) {
        parts.push({ kind: "digit", position: digitsTotal - 1 - seen });
        seen += 1;
      }
    } else {
      parts.push({ kind: "text", value: part.value });
    }
  }
  return { parts, fractionDigits };
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as const;

function DigitColumn({ scaled, position }: { scaled: MotionValue<number>; position: number }) {
  const y = useTransform(scaled, (v) => `${-odometerPosition(v, position) * 100}%`);
  return (
    <span
      data-digit=""
      className="relative inline-block overflow-hidden align-baseline"
      style={{ height: "1em", lineHeight: "1em" }}
    >
      {/* An invisible "0" reserves the width; the column stack is absolute over it. */}
      <span className="invisible">0</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col will-change-transform"
        style={{ y }}
        aria-hidden="true"
      >
        {DIGITS.map((digit, index) => (
          <span key={index} style={{ height: "1em", lineHeight: "1em" }}>
            {digit}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * Odometer-style number: each digit is a rolling column, animated with transform only.
 * Screen readers get the formatted target value; the columns are decorative.
 */
export const AnimatedNumber = forwardRef<HTMLSpanElement, AnimatedNumberProps>(
  function AnimatedNumber(
    { value, format, locale, transition, reducedMotion, onComplete, className, ...rest },
    ref,
  ) {
    const reduced = useReducedMotionPreference(reducedMotion);
    const fractionDigits = useMemo(() => resolveFractionDigits(format), [format]);
    const scale = 10 ** fractionDigits;
    const target = Math.round(value * scale);

    const scaled = useMotionValue(target);
    const [digitCount, setDigitCount] = useState(() => integerDigitCount(target));
    const [negative, setNegative] = useState(target < 0);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useMotionValueEvent(scaled, "change", (v) => {
      const count = integerDigitCount(v);
      setDigitCount((prev) => (prev === count ? prev : count));
      setNegative((prev) => (prev === v < 0 ? prev : v < 0));
    });

    useEffect(() => {
      if (scaled.get() === target) {
        onCompleteRef.current?.();
        return;
      }
      if (reduced) {
        scaled.jump(target);
        onCompleteRef.current?.();
        return;
      }
      const controls = animate(scaled, target, {
        ...(transition ?? springs.gentle),
        onComplete: () => onCompleteRef.current?.(),
      });
      return () => controls.stop();
    }, [scaled, target, reduced, transition]);

    // Layout depends only on the digit count and sign of the current value; columns keep
    // rolling between layouts because they subscribe to the same motion value.
    const layout = useMemo(() => {
      const current = scaled.get();
      const representative =
        integerDigitCount(current) === digitCount && current < 0 === negative
          ? current
          : (negative ? -1 : 1) * (10 ** (digitCount - 1) + 0.0001) * (digitCount > 1 ? 1 : 0);
      return buildLayout(representative, fractionDigits, locale, format);
    }, [scaled, digitCount, negative, fractionDigits, locale, format]);

    const label = useMemo(
      () => new Intl.NumberFormat(locale, format).format(target / scale),
      [locale, format, target, scale],
    );

    return (
      <span
        ref={ref}
        data-reduced-motion={reduced ? "true" : undefined}
        className={cn("inline-flex items-baseline tabular-nums", className)}
        {...rest}
      >
        <span className="sr-only">{label}</span>
        <span aria-hidden="true" className="inline-flex items-baseline">
          {layout.parts.map((part, index) =>
            part.kind === "digit" ? (
              <DigitColumn key={`d${part.position}`} scaled={scaled} position={part.position} />
            ) : (
              <span key={`t${index}`}>{part.value}</span>
            ),
          )}
        </span>
      </span>
    );
  },
);
