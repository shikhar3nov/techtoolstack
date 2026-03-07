const { analyzeJsonContract } = require('../services/aiJsonContractAssistant.service');

const normalize = (value, fallback = '') => (typeof value === 'string' ? value : fallback);

exports.analyzeJsonContractController = async (req, res) => {
  try {
    const baselineJson = normalize(req.body.baselineJson);
    const candidateJson = normalize(req.body.candidateJson);
    const context = normalize(req.body.context);
    const environment = normalize(req.body.environment, 'production') || 'production';
    const roleHint = normalize(req.body.roleHint, 'backend') || 'backend';

    if (!baselineJson.trim() || !candidateJson.trim()) {
      return res.status(400).json({
        error: 'baselineJson and candidateJson are required',
        message: 'Please provide both baseline and candidate JSON payloads.'
      });
    }

    if (baselineJson.length > 250000 || candidateJson.length > 250000) {
      return res.status(413).json({
        error: 'Input too large',
        message: 'Please keep each JSON input under 250,000 characters.'
      });
    }

    const result = await analyzeJsonContract({
      baselineJson,
      candidateJson,
      context,
      environment,
      roleHint
    });

    return res.json(result);
  } catch (error) {
    if (error.code === 'INVALID_JSON') {
      return res.status(400).json({
        error: 'Invalid JSON',
        message: error.message
      });
    }

    return res.status(500).json({
      error: 'AI JSON contract analysis failed',
      message: error.message || 'Unexpected server error'
    });
  }
};
