/**
 * 環境貢献に関する計算ロジック
 * このファイルはクライアントサイド（ブラウザ）でもサーバーサイドでも安全にインポートできます。
 */

/**
 * CO2排出削減量の計算 (kg)
 * 自動車（ガソリン車）の平均排出量: 約0.17kg/km と仮定
 */
export const CO2_REDUCTION_FACTOR = 0.17; // kg CO2 / km

export const calculateCO2Reduction = (distanceKm: number): number => {
	return distanceKm * CO2_REDUCTION_FACTOR;
};

/**
 * 地球の寿命（温暖化閾値到達までの時間）をどのくらい延ばしたかの推定 (秒)
 */
export const calculateEarthLifespanExtension = (
	co2ReductionKg: number,
): number => {
	const secondsPerKg = 1577880000 / 2000000000000;
	return co2ReductionKg * secondsPerKg;
};

/**
 * 北極の氷をどれくらい守ったかの推定 (kg)
 * 1kgのCO2削減 ≈ 3kgの北極の氷の融解を阻止
 */
export const calculateIceMeltingPrevention = (
	co2ReductionKg: number,
): number => {
	return co2ReductionKg * 3.0;
};

/**
 * 杉の木が1年間に吸収する量に換算 (本・年)
 * 杉の木1本は1年間に約14kgのCO2を吸収する
 */
export const CEDAR_ABSORPTION_PER_YEAR = 14;

export const calculateCedarTreeEquivalent = (
	co2ReductionKg: number,
): number => {
	return co2ReductionKg / CEDAR_ABSORPTION_PER_YEAR;
};

/**
 * スマートフォンのフル充電回数に換算
 */
export const SMARTPHONE_CHARGE_CO2 = 0.005;

export const calculateSmartphoneCharges = (co2ReductionKg: number): number => {
	return co2ReductionKg / SMARTPHONE_CHARGE_CO2;
};

/**
 * LED電球の使用時間に換算
 */
export const LED_BULB_HOUR_CO2 = 0.002;

export const calculateLEDBulbHours = (co2ReductionKg: number): number => {
	return co2ReductionKg / LED_BULB_HOUR_CO2;
};
