"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";
import { cn } from "@/lib/utils";

interface EcoMetricCardProps {
	title: string;
	value: number;
	unit?: string;
	precision?: number;
	icon?: ReactNode;
	className?: string;
	titleClassName?: string;
	valueClassName?: string;
	description?: string;
}

export default function EcoMetricCard({
	title,
	value,
	unit,
	precision = 0,
	icon,
	className,
	titleClassName,
	valueClassName,
	description,
}: EcoMetricCardProps) {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				"p-6 rounded-xl border shadow-sm flex flex-col justify-between transition-colors",
				className
			)}
		>
			<div>
				<div className="flex items-center justify-between mb-2">
					<h2 className={cn("text-sm font-medium uppercase tracking-wider", titleClassName)}>
						{title}
					</h2>
					{icon && <div className="opacity-80">{icon}</div>}
				</div>
				<div className="flex items-baseline gap-1">
					<p className={cn("text-4xl font-bold tracking-tight", valueClassName)}>
						<AnimatedNumber value={value} precision={precision} />
					</p>
					{unit && (
						<span className={cn("text-sm font-medium opacity-70", valueClassName)}>
							{unit}
						</span>
					)}
				</div>
			</div>
			{description && (
				<p className={cn("text-xs mt-2 opacity-70", titleClassName)}>
					{description}
				</p>
			)}
		</motion.div>
	);
}
