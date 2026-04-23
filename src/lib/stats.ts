import prisma from "./prisma";
import { 
  calculateCO2Reduction, 
  calculateEarthLifespanExtension, 
  calculateIceMeltingPrevention,
  calculateCedarTreeEquivalent
} from "./strava";

export const getCollectiveImpact = async () => {
  const stats = await prisma.activity.aggregate({
    _sum: {
      distance: true,
    },
    _count: {
      id: true,
    },
  });

  const totalDistance = stats._sum.distance || 0;
  const totalActivities = stats._count.id || 0;
  const totalCO2Reduction = calculateCO2Reduction(totalDistance);
  
  return {
    totalDistance,
    totalActivities,
    totalCO2Reduction,
    lifespanExtension: calculateEarthLifespanExtension(totalCO2Reduction),
    iceSaved: calculateIceMeltingPrevention(totalCO2Reduction),
    cedarTrees: calculateCedarTreeEquivalent(totalCO2Reduction),
  };
};

export const getLeaderboard = async (limit = 5) => {
  const usersWithPoints = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      points: {
        select: {
          points: true,
        },
      },
    },
  });

  const leaderboard = usersWithPoints
    .map(user => ({
      id: user.id,
      name: user.name || "Anonymous Athlete",
      totalPoints: user.points.reduce((sum, p) => sum + p.points, 0),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, limit);

  return leaderboard;
};
