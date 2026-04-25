import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

export function formatActivityDate(date: Date | string) {
	const d = typeof date === "string" ? new Date(date) : date;
	const now = new Date();
	const isCurrentYear = d.getFullYear() === now.getFullYear();

	const options: Intl.DateTimeFormatOptions = {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: "Asia/Tokyo",
	};

	if (!isCurrentYear) {
		options.year = "numeric";
	}

	return d.toLocaleString("ja-JP", options);
}
