const { routeErrorIncident } = require('../services/aiErrorRouter.service');

const normalizeValue = (value, fallback = '') => (typeof value === 'string' ? value.trim() : fallback);

exports.routeErrorToWorkflow = async (req, res) => {
  try {
    const errorText = normalizeValue(req.body.errorText);
    const context = normalizeValue(req.body.context);
    const environment = normalizeValue(req.body.environment, 'production') || 'production';
    const roleHint = normalizeValue(req.body.roleHint);
    const maxRecommendations = Number(req.body.maxRecommendations || 3);

    if (!errorText) {
      return res.status(400).json({
        error: 'errorText is required',
        message: 'Please paste an error message, stack trace, or incident log to analyze.'
      });
    }

    if (errorText.length > 50000) {
      return res.status(413).json({
        error: 'errorText too large',
        message: 'Please keep error content under 50,000 characters.'
      });
    }

    const result = await routeErrorIncident({
      errorText,
      context,
      environment,
      roleHint,
      maxRecommendations
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: 'AI routing failed',
      message: error.message || 'Unexpected server error'
    });
  }
};
