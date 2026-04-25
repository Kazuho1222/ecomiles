export type BadgeType = "DISTANCE" | "CO2_SAVED" | "POINTS" | "ACTIVITY_COUNT";

export interface BadgeDefinition {
	id: string;
	name: string;
	description: string;
	type: BadgeType;
	threshold: number;
	icon: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
	{
		id: "first-step",
		name: "初めの一歩",
		description: "最初のアクティビティを記録した",
		type: "ACTIVITY_COUNT",
		threshold: 1,
		icon: "🌱",
	},
	{
		id: "eco-starter",
		name: "エコ・スターター",
		description: "合計10kmの環境に優しい移動を達成",
		type: "DISTANCE",
		threshold: 10,
		icon: "🚴",
	},
	{
		id: "co2-warrior",
		name: "CO2ウォリアー",
		description: "累計10kgのCO2削減を達成",
		type: "CO2_SAVED",
		threshold: 10,
		icon: "🛡️",
	},
	{
		id: "point-collector",
		name: "ポイントコレクター",
		description: "累計100ポイント獲得",
		type: "POINTS",
		threshold: 100,
		icon: "💰",
	},
	{
		id: "century-ride",
		name: "センチュリー・ライド",
		description: "合計100kmの移動を達成",
		type: "DISTANCE",
		threshold: 100,
		icon: "💯",
	},
	{
		id: "green-leader",
		name: "グリーン・リーダー",
		description: "累計50kgのCO2削減を達成",
		type: "CO2_SAVED",
		threshold: 50,
		icon: "👑",
	},
];
