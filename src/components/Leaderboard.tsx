import React from "react";
import { Trophy, Medal } from "lucide-react";

interface LeaderboardProps {
  entries: {
    id: string;
    name: string;
    totalPoints: number;
  }[];
}

export const Leaderboard = ({ entries }: LeaderboardProps) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          エコ・リーダーボード
        </h3>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
          累計獲得ポイント
        </span>
      </div>
      
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {entries.length > 0 ? (
          entries.map((entry, index) => (
            <div 
              key={entry.id} 
              className={`p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                index === 0 ? "bg-yellow-50/30 dark:bg-yellow-900/10" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 flex justify-center items-center">
                  {index === 0 ? (
                    <Trophy className="text-yellow-500 w-6 h-6" />
                  ) : index === 1 ? (
                    <Medal className="text-slate-400 w-6 h-6" />
                  ) : index === 2 ? (
                    <Medal className="text-amber-600 w-6 h-6" />
                  ) : (
                    <span className="text-slate-400 font-mono font-bold text-lg">{index + 1}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{entry.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{entry.totalPoints.toLocaleString()} <small className="text-xs font-bold">pts</small></p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-500">
            データがまだありません。
          </div>
        )}
      </div>
    </div>
  );
};
