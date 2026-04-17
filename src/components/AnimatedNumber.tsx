"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface AnimatedNumberProps {
	value: number;
	precision?: number;
}

export default function AnimatedNumber({
	value,
	precision = 0,
}: AnimatedNumberProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const motionValue = useMotionValue(0);
	const springValue = useSpring(motionValue, {
		damping: 30,
		stiffness: 100,
	});
	const isInView = useInView(ref, { once: true });

	useEffect(() => {
		if (isInView) {
			motionValue.set(value);
		}
	}, [value, isInView, motionValue]);

	useEffect(() => {
		return springValue.on("change", (latest) => {
			if (ref.current) {
				ref.current.textContent = latest.toFixed(precision);
			}
		});
	}, [springValue, precision]);

	return <span ref={ref} />;
}
