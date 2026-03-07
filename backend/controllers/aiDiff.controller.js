const { explainDiff } = require('../services/aiDiffExplainer.service');

const normalize = (value, fallback = '') => (typeof value === 'string' ? value : fallback);

exports.explainDiffController = async (req, res) => {
  try {
    const leftText = normalize(req.body.leftText);
    const rightText = normalize(req.body.rightText);

    if (!leftText.trim() && !rightText.trim()) {
      return res.status(400).json({
        error: 'leftText or rightText required',
        message: 'Please provide text to compare and explain.'
      });
    }

    if (leftText.length > 200000 || rightText.length > 200000) {
      return res.status(413).json({
        error: 'Input too large',
        message: 'Please keep each input under 200,000 characters.'
      });
    }

    const result = await explainDiff({
      leftText,
      rightText,
      leftTitle: normalize(req.body.leftTitle, 'Left'),
      rightTitle: normalize(req.body.rightTitle, 'Right'),
      options: req.body.options || {},
      maxSnippets: Number(req.body.maxSnippets || 16)
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: 'AI diff explanation failed',
      message: error.message || 'Unexpected server error'
    });
  }
};
