// Analytics controllers only select the requested month and return the
// service's calculated dashboard view model to the client.
import { getMonthlyAnalytics } from '../services/analyticsService.js';

export const getMonthly = async (req, res, next) => {
  try {
    const result = await getMonthlyAnalytics(req.user.id, req.query.year, req.query.month);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
