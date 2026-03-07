// Regex Tester Controller
// This controller handles regex testing requests

// Generate regex explanation
function generateExplanation(regex) {
  if (!regex) return 'Enter a regular expression to see explanation';
  
  let explanation = 'Regular expression breakdown:\n\n';
  
  if (regex.includes('^')) explanation += '^ - Matches start of string\n';
  if (regex.includes('$')) explanation += '$ - Matches end of string\n';
  if (regex.includes('\\d')) explanation += '\\d - Matches any digit (0-9)\n';
  if (regex.includes('\\w')) explanation += '\\w - Matches any word character (a-z, A-Z, 0-9, _)\n';
  if (regex.includes('\\s')) explanation += '\\s - Matches any whitespace character\n';
  if (regex.includes('.')) explanation += '. - Matches any character except newline\n';
  if (regex.includes('*')) explanation += '* - Matches 0 or more of the preceding element\n';
  if (regex.includes('+')) explanation += '+ - Matches 1 or more of the preceding element\n';
  if (regex.includes('?')) explanation += '? - Matches 0 or 1 of the preceding element\n';
  if (regex.includes('|')) explanation += '| - Alternation (OR operator)\n';
  if (regex.includes('[')) explanation += '[] - Character class, matches any character inside\n';
  if (regex.includes('(')) explanation += '() - Capturing group\n';
  
  return explanation || 'Basic regex pattern';
}

exports.regexTester = (req, res) => {
  const { pattern, testString, flags } = req.body;
  
  // Check for extremely large test strings
  if (testString && testString.length > 1000000) { // 1MB limit for test string
    return res.status(413).json({
      matches: [],
      error: 'Test string too large. Please use a smaller text (max 1MB).',
      explanation: 'Text too large for processing'
    });
  }
  
  try {
    // Validate input
    if (!pattern) {
      return res.json({ 
        matches: [], 
        error: null,
        explanation: 'Enter a regular expression to see explanation',
        message: 'No pattern provided'
      });
    }

    // Create flag string
    const flagString = Object.entries(flags || {})
      .filter(([_, enabled]) => enabled)
      .map(([flag, _]) => flag)
      .join('');
    
    const regex = new RegExp(pattern, flagString);
    const matches = [];
    
    if (!testString) {
      return res.json({ 
        matches: [], 
        error: null,
        explanation: generateExplanation(pattern),
        message: 'No test string provided'
      });
    }

    let match;

    if (flags?.g) {
      // Global search
      const globalRegex = new RegExp(pattern, flagString);
      while ((match = globalRegex.exec(testString)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
          input: match.input
        });
        if (match.index === globalRegex.lastIndex) break;
      }
    } else {
      // Single match
      match = regex.exec(testString);
      if (match) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
          input: match.input
        });
      }
    }

    res.json({ 
      matches, 
      error: null,
      explanation: generateExplanation(pattern),
      matchCount: matches.length,
      pattern: pattern,
      flags: flagString || 'none'
    });

  } catch (error) {
    res.json({ 
      matches: [], 
      error: error.message,
      explanation: 'Invalid regular expression',
      pattern: pattern,
      message: 'Please check your regex syntax'
    });
  }
};