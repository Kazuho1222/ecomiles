"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import AnimatedNumber from "./AnimatedNumber";

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
	onClick?: () => void;
	isActive?: boolean;
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
	onClick,
	isActive,
}: EcoMetricCardProps) {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={onClick ? { scale: 1.015, y: -4 } : {}}
			whileTap={onClick ? { scale: 0.985 } : {}}
			transition={{ type: "spring", stiffness: 400, damping: 25 }}
			onClick={onClick}
			onKeyDown={
				onClick
					? (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onClick();
							}
						}
					: undefined
			}
			role={onClick ? "button" : undefined}
			tabIndex={onClick ? 0 : undefined}
			aria-pressed={onClick ? !!isActive : undefined}
			className={cn(
				"p-6 rounded-2xl border shadow-sm flex flex-col justify-between relative overflow-hidden",
				onClick && "cursor-pointer",
				isActive
					? "ring-2 ring-emerald-500 border-emerald-500 shadow-lg bg-white dark:bg-slate-900"
					: "bg-white dark:bg-slate-900 hover:shadow-md border-slate-200 dark:border-slate-800",
				className,
			)}
		>
			{isActive && (
				<div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 flex items-center justify-center rounded-bl-xl text-white">
					<div className="w-2 h-2 rounded-full bg-white animate-pulse" />
				</div>
			)}
			<div>
				<div className="flex items-center justify-between mb-2">
					<h2
						className={cn(
							"text-xs font-bold uppercase tracking-widest opacity-70",
							titleClassName,
						)}
					>
						{title}
					</h2>
					{icon && <div className="opacity-80">{icon}</div>}
				</div>
				<div className="flex items-baseline gap-1 flex-wrap overflow-hidden">
					<p
						className={cn(
							"text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-all",
							valueClassName,
						)}
					>
						<AnimatedNumber value={value} precision={precision} />
					</p>
					{unit && (
						<span
							className={cn(
								"text-xs sm:text-sm font-medium opacity-70",
								valueClassName,
							)}
						>
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
