import Link from "next/link";
import { PoweredByStrava } from "./StravaLogo";

interface FooterProps {
	className?: string;
	showBorder?: boolean;
}

export const FOOTER_COPYRIGHT = "© 2026 EcoMiles. Dedicated to a sustainable future.";

export function Footer({ className = "", showBorder = false }: FooterProps) {
	return (
		<footer
			className={`flex flex-col items-center gap-6 py-12 w-full max-w-5xl mx-auto ${
				showBorder ? "border-t border-slate-100 dark:border-slate-800" : ""
			} ${className}`}
		>
			<a
				href="https://strava.com"
				target="_blank"
				rel="noopener noreferrer"
				className="opacity-60 hover:opacity-100 transition-opacity"
			>
				<PoweredByStrava />
			</a>
			<div className="flex gap-4 text-xs text-slate-400 font-medium">
				<Link
					href="/privacy"
					className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
				>
					プライバシーポリシー
				</Link>
			</div>
			<p className="text-xs text-slate-400 font-mono">
				{FOOTER_COPYRIGHT}
			</p>
		</footer>
	);
}
