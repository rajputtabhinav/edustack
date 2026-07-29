import { getLeaderboard } from "../services/leaderboardService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await getLeaderboard(req.query.period);
  res.json(leaderboard);
});
