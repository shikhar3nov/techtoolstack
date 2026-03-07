// JSON Formatter Controller
// This controller handles JSON formatting requests

exports.formatJson = (req, res) => {
  try {
    const { json } = req.body;
    
    // Validate input
    if (!json) {
      return res.status(400).json({ 
        error: "No JSON data provided",
        message: "Please provide JSON data to format"
      });
    }
    
    // Parse and format JSON
    const parsed = JSON.parse(json);
    const formatted = JSON.stringify(parsed, null, 2);
    
    res.status(200).json({ 
      formatted,
      message: "JSON formatted successfully",
      originalLength: json.length,
      formattedLength: formatted.length
    });
    
  } catch (err) {
    res.status(400).json({ 
      error: "Invalid JSON",
      message: err.message,
      hint: "Please check your JSON syntax"
    });
  }
};