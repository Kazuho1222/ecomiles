import React from "react";

/**
 * Strava 公式のシンボルマーク (不等号を2つ重ねた山)
 * 公式のブランドアセットに基づいた正確なパス
 */
export const StravaSymbol = ({
	color = "white",
	size = 24,
}: { color?: string; size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"
			fill={color}
		/>
	</svg>
);

/**
 * Strava ロゴ (シンボル + テキスト)
 */
export const StravaLogo = ({
	color = "#FC5200",
	width = 120,
}: { color?: string; width?: number }) => {
	const height = width / 4.5;
	const symbolSize = height * 1.2;

	return (
		<div
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: "4px",
			}}
		>
			<StravaSymbol color={color} size={symbolSize} />
			<span
				style={{
					fontSize: `${height}px`,
					fontWeight: 900,
					color: color,
					fontStyle: "italic",
					letterSpacing: "-0.05em",
					lineHeight: 1,
				}}
			>
				STRAVA
			</span>
		</div>
	);
};

/**
 * Strava "Connect with Strava" ボタン
 * 公式ガイドラインに準拠した CSS/SVG ハイブリッド実装
 */
export const ConnectWithStrava = () => {
	return (
		<div
			style={{
				display: "inline-flex",
				alignItems: "center",
				backgroundColor: "#FC5200",
				color: "white",
				height: "48px",
				padding: "0 24px 0 16px",
				borderRadius: "4px",
				textDecoration: "none",
				fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
				fontWeight: "bold",
				fontSize: "16px",
				userSelect: "none",
			}}
		>
			<div style={{ marginRight: "12px", display: "flex" }}>
				<StravaSymbol color="white" size={24} />
			</div>
			Connect with Strava
		</div>
	);
};

/**
 * Powered by Strava
 */
export const PoweredByStrava = () => {
	return (
		<div
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: "8px",
				opacity: 0.8,
			}}
		>
			<span
				style={{
					fontSize: "12px",
					fontWeight: 600,
					color: "#666",
					textTransform: "uppercase",
					letterSpacing: "0.05em",
				}}
			>
				Powered by
			</span>
			<div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
				<StravaSymbol color="#FC5200" size={16} />
				<span
					style={{
						fontSize: "16px",
						fontWeight: 900,
						color: "#FC5200",
						fontStyle: "italic",
						letterSpacing: "-0.02em",
					}}
				>
					STRAVA
				</span>
			</div>
		</div>
	);
};
