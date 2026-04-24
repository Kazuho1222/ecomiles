"use client";

import { toPng } from "html-to-image";
import { Download, ImageIcon, Loader2, Share, X } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { ShareCard } from "./ShareCard";
import { Button } from "./ui/button";

interface ShareModalProps {
	data: {
		totalPoints: number;
		totalCO2Reduction: number;
		iceSaved: number;
		cedarTrees: number;
		userName: string;
		avatarUrl?: string;
	};
}

export const ShareModal: React.FC<ShareModalProps> = ({ data }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const shareCardRef = useRef<HTMLDivElement>(null);

	const generateImage = async () => {
		if (!shareCardRef.current) return;

		setIsGenerating(true);
		try {
			// フォントの読み込み待ちやレンダリングの安定化のために少し待つ
			await new Promise((resolve) => setTimeout(resolve, 500));

			const dataUrl = await toPng(shareCardRef.current, {
				cacheBust: true,
				width: 1200,
				height: 630,
			});

			setPreviewUrl(dataUrl);
		} catch (err) {
			console.error("Failed to generate image:", err);
			alert("画像の生成に失敗しました。");
		} finally {
			setIsGenerating(false);
		}
	};

	const downloadImage = () => {
		if (!previewUrl) return;
		
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const day = String(now.getDate()).padStart(2, "0");
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");
		const seconds = String(now.getSeconds()).padStart(2, "0");
		
		const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;
		
		const link = document.createElement("a");
		link.download = `ecomiles-impact-${timestamp}.png`;
		link.href = previewUrl;
		link.click();
	};

	const handleOpen = () => {
		setIsOpen(true);
		generateImage();
	};

	return (
		<>
			<Button
				onClick={handleOpen}
				className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full px-6 py-6 shadow-lg transition-all hover:scale-105 active:scale-95"
			>
				<Share size={20} />
				SNSでシェアする
			</Button>

			{/* 実際のレンダリング用（画面外に配置） */}
			<div className="fixed top-[-9999px] left-[-9999px] pointer-events-none">
				<div ref={shareCardRef}>
					<ShareCard data={data} />
				</div>
			</div>

			{/* モーダルオーバーレイ */}
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
						<div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
							<h3 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
								<ImageIcon className="text-emerald-500" />
								SNSシェア画像のプレビュー
							</h3>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
							>
								<X size={24} />
							</button>
						</div>

						<div className="p-8 flex-1 overflow-y-auto flex flex-col items-center justify-center bg-slate-50 dark:bg-black/40">
							{isGenerating ? (
								<div className="flex flex-col items-center gap-4 py-20">
									<Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
									<p className="font-bold text-slate-500 animate-pulse">
										画像を生成中...
									</p>
								</div>
							) : previewUrl ? (
								<div className="space-y-6 w-full max-w-2xl">
									<div className="relative group rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
										<img
											src={previewUrl}
											alt="EcoMiles Share Card"
											className="w-full h-auto"
										/>
									</div>
									<p className="text-sm text-center text-slate-500 dark:text-slate-400 font-medium">
										画像を保存して、X(Twitter)やInstagramなどでシェアしましょう！
									</p>
								</div>
							) : null}
						</div>

						<div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-4">
							<Button
								onClick={downloadImage}
								disabled={!previewUrl || isGenerating}
								className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-2xl gap-2 text-lg shadow-md"
							>
								<Download size={24} />
								画像を保存する
							</Button>
							<Button
								variant="outline"
								onClick={() => setIsOpen(false)}
								className="sm:w-32 h-14 rounded-2xl font-bold border-slate-200 dark:border-slate-700"
							>
								閉じる
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};
