import Link from "next/link";

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
				href="https://intervals.icu"
				target="_blank"
				rel="noopener noreferrer"
				className="text-[10px] text-slate-400 hover:text-purple-500 font-bold tracking-widest uppercase transition-colors"
			>
				Powered by Intervals.icu API
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
