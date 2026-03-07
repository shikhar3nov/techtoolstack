import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

const AIPromptGenerator = () => {
  const [formData, setFormData] = useState({
    task: '',
    context: '',
    tone: 'professional',
    outputFormat: 'paragraph',
    audience: 'general',
    additionalRequirements: '',
    promptType: 'general',
    examples: '',
    constraints: ''
  });

  const [generatedPrompts, setGeneratedPrompts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const promptTypes = [
    { value: 'general', label: 'General Task' },
    { value: 'creative', label: 'Creative Writing' },
    { value: 'analysis', label: 'Analysis & Research' },
    { value: 'coding', label: 'Code Generation' },
    { value: 'business', label: 'Business & Marketing' },
    { value: 'educational', label: 'Teaching & Explanation' },
    { value: 'problem-solving', label: 'Problem Solving' },
    { value: 'data-processing', label: 'Data Processing' }
  ];

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'formal', label: 'Formal' },
    { value: 'creative', label: 'Creative' },
    { value: 'authoritative', label: 'Authoritative' },
    { value: 'conversational', label: 'Conversational' },
    { value: 'technical', label: 'Technical' }
  ];

  const formatOptions = [
    { value: 'paragraph', label: 'Paragraph' },
    { value: 'bullet-points', label: 'Bullet Points' },
    { value: 'numbered-list', label: 'Numbered List' },
    { value: 'table', label: 'Table' },
    { value: 'json', label: 'JSON' },
    { value: 'code', label: 'Code' },
    { value: 'step-by-step', label: 'Step-by-Step Guide' },
    { value: 'comparison', label: 'Comparison' },
    { value: 'summary', label: 'Summary' }
  ];

  const audienceOptions = [
    { value: 'general', label: 'General Audience' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'expert', label: 'Expert' },
    { value: 'child', label: 'Child (Ages 8-12)' },
    { value: 'teenager', label: 'Teenager (Ages 13-18)' },
    { value: 'academic', label: 'Academic/Researcher' },
    { value: 'business', label: 'Business Professional' },
    { value: 'technical', label: 'Technical Professional' }
  ];

  const generateOptimizedPrompts = () => {
    const { task, context, tone, outputFormat, audience, additionalRequirements, promptType, examples, constraints } = formData;

    // Enhanced prompt generation with advanced techniques
    const prompts = [];

    // Prompt 1: Role-based with specific instructions
    const roleMap = {
      'creative': 'creative writing expert and storyteller',
      'analysis': 'data analyst and research specialist',
      'coding': 'senior software developer and coding expert',
      'business': 'business strategist and marketing professional',
      'educational': 'experienced educator and subject matter expert',
      'problem-solving': 'problem-solving specialist and consultant',
      'data-processing': 'data scientist and information processing expert',
      'general': 'knowledgeable assistant and expert'
    };

    const role = roleMap[promptType] || 'expert assistant';
    
    let prompt1 = `You are a ${role}. Your task is to ${task}.

CONTEXT: ${context || 'General application'}

REQUIREMENTS:
- Target audience: ${audience === 'child' ? 'children (use simple, easy-to-understand language)' : audience === 'teenager' ? 'teenagers (use engaging, relatable language)' : audience === 'expert' ? 'experts (use technical terminology and advanced concepts)' : audience === 'academic' ? 'academic audience (use scholarly language and cite sources when relevant)' : 'general audience'}
- Tone: ${tone}
- Format: ${outputFormat === 'bullet-points' ? 'Use bullet points for clear organization' : outputFormat === 'numbered-list' ? 'Use numbered lists for step-by-step clarity' : outputFormat === 'table' ? 'Present information in a well-structured table format' : outputFormat === 'json' ? 'Provide response in valid JSON format' : outputFormat === 'code' ? 'Include relevant code examples with explanations' : outputFormat === 'step-by-step' ? 'Break down into clear, actionable steps' : outputFormat === 'comparison' ? 'Compare and contrast different aspects' : outputFormat === 'summary' ? 'Provide a concise summary' : 'Write in clear, well-structured paragraphs'}`;

    if (constraints) {
      prompt1 += `\n- Constraints: ${constraints}`;
    }

    if (additionalRequirements) {
      prompt1 += `\n- Additional requirements: ${additionalRequirements}`;
    }

    if (examples) {
      prompt1 += `\n\nEXAMPLES FOR REFERENCE:\n${examples}`;
    }

    prompt1 += `\n\nPlease provide a comprehensive, accurate, and helpful response that fully addresses the task while meeting all the specified requirements.`;

    prompts.push(prompt1);

    // Prompt 2: Chain of thought approach
    let prompt2 = `I need help with: ${task}

Please approach this systematically:

1. First, analyze the task and context: ${context || 'General scenario'}
2. Consider the target audience (${audience}) and appropriate ${tone} tone
3. Structure your response as ${outputFormat === 'bullet-points' ? 'bullet points' : outputFormat === 'numbered-list' ? 'a numbered list' : outputFormat === 'table' ? 'a table' : outputFormat === 'json' ? 'JSON format' : outputFormat === 'code' ? 'code with explanations' : outputFormat === 'step-by-step' ? 'step-by-step instructions' : outputFormat === 'comparison' ? 'a comparison' : outputFormat === 'summary' ? 'a summary' : 'clear paragraphs'}
4. Ensure the response is practical and actionable`;

    if (constraints) {
      prompt2 += `\n5. Keep in mind these constraints: ${constraints}`;
    }

    if (additionalRequirements) {
      prompt2 += `\n6. Address these additional requirements: ${additionalRequirements}`;
    }

    if (examples) {
      prompt2 += `\n\nFor reference, here are some examples of what I'm looking for:\n${examples}`;
    }

    prompt2 += `\n\nPlease think through each step and provide a detailed, well-reasoned response.`;

    prompts.push(prompt2);

    // Prompt 3: Specific outcome-focused prompt
    let prompt3 = `TASK: ${task}

OBJECTIVE: Create ${outputFormat === 'bullet-points' ? 'a bullet-pointed breakdown' : outputFormat === 'numbered-list' ? 'a numbered list' : outputFormat === 'table' ? 'a structured table' : outputFormat === 'json' ? 'a JSON response' : outputFormat === 'code' ? 'code with detailed explanations' : outputFormat === 'step-by-step' ? 'step-by-step instructions' : outputFormat === 'comparison' ? 'a detailed comparison' : outputFormat === 'summary' ? 'a comprehensive summary' : 'detailed content'} that is ${tone} in tone and suitable for ${audience === 'child' ? 'children' : audience === 'teenager' ? 'teenagers' : audience === 'expert' ? 'experts in the field' : audience === 'academic' ? 'academic researchers' : audience === 'business' ? 'business professionals' : audience === 'technical' ? 'technical professionals' : 'a general audience'}.

CONTEXT: ${context || 'This is for general use'}

SUCCESS CRITERIA:
- Clear and actionable information
- Appropriate depth for the target audience
- Well-organized and easy to follow
- Practical and immediately useful`;

    if (constraints) {
      prompt3 += `\n- Respects these constraints: ${constraints}`;
    }

    if (additionalRequirements) {
      prompt3 += `\n- Meets these specific requirements: ${additionalRequirements}`;
    }

    if (examples) {
      prompt3 += `\n\nREFERENCE EXAMPLES:\n${examples}`;
    }

    prompt3 += `\n\nPlease provide a response that meets all these criteria and delivers exactly what I need.`;

    prompts.push(prompt3);

    // Prompt 4: Constraint-based prompt with examples
    let prompt4 = `Act as a ${role}. I need you to ${task}.

Key Details:
• Context: ${context || 'General application'}
• Audience: ${audience === 'child' ? 'Children (ages 8-12) - use simple language and fun examples' : audience === 'teenager' ? 'Teenagers (ages 13-18) - use engaging, relatable content' : audience === 'expert' ? 'Subject matter experts - use technical depth and advanced concepts' : audience === 'academic' ? 'Academic/research community - use scholarly approach' : audience === 'business' ? 'Business professionals - focus on practical applications' : audience === 'technical' ? 'Technical professionals - include technical details' : 'General public - use accessible language'}
• Tone: ${tone.charAt(0).toUpperCase() + tone.slice(1)}
• Format: ${outputFormat === 'bullet-points' ? 'Bullet points with clear headings' : outputFormat === 'numbered-list' ? 'Numbered list with logical progression' : outputFormat === 'table' ? 'Table format with clear columns and rows' : outputFormat === 'json' ? 'Valid JSON structure' : outputFormat === 'code' ? 'Code blocks with explanations' : outputFormat === 'step-by-step' ? 'Sequential steps with clear instructions' : outputFormat === 'comparison' ? 'Side-by-side comparison format' : outputFormat === 'summary' ? 'Concise summary format' : 'Well-structured paragraphs'}`;

    if (constraints) {
      prompt4 += `\n• Constraints: ${constraints}`;
    }

    if (additionalRequirements) {
      prompt4 += `\n• Special Requirements: ${additionalRequirements}`;
    }

    if (examples) {
      prompt4 += `\n\nExample of desired output style:\n${examples}`;
    }

    prompt4 += `\n\nPlease provide a complete, detailed response that I can use immediately. Make sure it's accurate, helpful, and exactly what I need for my specific use case.`;

    prompts.push(prompt4);

    // Prompt 5: Advanced prompt with metacognitive elements
    let prompt5 = `I need expert assistance with this task: ${task}

BACKGROUND INFORMATION:
${context || 'This is for general use and application'}

SPECIFIC REQUIREMENTS:
1. Target Audience: ${audience === 'child' ? 'Children (8-12 years) - Use simple vocabulary, short sentences, and engaging examples' : audience === 'teenager' ? 'Teenagers (13-18 years) - Use current, relatable language and examples' : audience === 'expert' ? 'Domain experts - Use technical terminology and assume advanced knowledge' : audience === 'academic' ? 'Academic researchers - Use scholarly language and research-backed information' : audience === 'business' ? 'Business professionals - Focus on ROI, efficiency, and practical implementation' : audience === 'technical' ? 'Technical professionals - Include technical specifications and implementation details' : 'General audience - Use clear, accessible language without jargon'}

2. Communication Style: ${tone.charAt(0).toUpperCase() + tone.slice(1)} tone throughout

3. Response Format: ${outputFormat === 'bullet-points' ? 'Organize using bullet points with clear categories' : outputFormat === 'numbered-list' ? 'Use numbered lists for easy following' : outputFormat === 'table' ? 'Present in table format for easy comparison' : outputFormat === 'json' ? 'Structure as valid JSON with proper formatting' : outputFormat === 'code' ? 'Include code examples with line-by-line explanations' : outputFormat === 'step-by-step' ? 'Break into clear, actionable steps' : outputFormat === 'comparison' ? 'Use comparison format to highlight differences' : outputFormat === 'summary' ? 'Provide concise but comprehensive summary' : 'Use clear paragraph structure with logical flow'}

4. Quality Standards:
   - Accuracy and factual correctness
   - Practical applicability
   - Clear and actionable guidance
   - Appropriate depth for the audience`;

    if (constraints) {
      prompt5 += `\n   - Adherence to constraints: ${constraints}`;
    }

    if (additionalRequirements) {
      prompt5 += `\n   - Additional requirements: ${additionalRequirements}`;
    }

    if (examples) {
      prompt5 += `\n\nEXAMPLE REFERENCE:\n${examples}\n\nPlease use this as a reference for style and structure.`;
    }

    prompt5 += `\n\nBefore responding, please consider:
- What would be most helpful for my specific situation?
- How can you make this immediately actionable?
- What details are most important for my audience?

Then provide your comprehensive response.`;

    prompts.push(prompt5);

    return prompts;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generatePrompts = () => {
    if (!formData.task.trim()) {
      alert('Please enter a task or topic');
      return;
    }

    setIsGenerating(true);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      const prompts = generateOptimizedPrompts();
      setGeneratedPrompts(prompts);
      setIsGenerating(false);
    }, 1500);
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadPrompts = () => {
    const content = generatedPrompts.map((prompt, index) => 
      `PROMPT ${index + 1}:\n${prompt}\n\n${'='.repeat(80)}\n\n`
    ).join('');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized-ai-prompts.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearForm = () => {
    setFormData({
      task: '',
      context: '',
      tone: 'professional',
      outputFormat: 'paragraph',
      audience: 'general',
      additionalRequirements: '',
      promptType: 'general',
      examples: '',
      constraints: ''
    });
    setGeneratedPrompts([]);
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <span className="text-4xl mr-3">🚀</span>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">AI Prompt Generator</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto text-lg">
            Generate professional, optimized prompts for ChatGPT, Claude, and other AI assistants. 
            Get better results by providing detailed context and requirements.
          </p>
        </div> */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
          <div className="text-center mb-4 mt-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">AI Prompt Generator</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm mb-3">Generate professional, optimized prompts for ChatGPT, Claude, and other AI assistants. 
              Get better results by providing detailed context and requirements.</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Column 1: Main Task Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Task Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What do you want AI to help you with? *
                  </label>
                  <textarea
                    name="task"
                    value={formData.task}
                    onChange={handleInputChange}
                    placeholder="e.g., Write a comprehensive blog post about sustainable living practices that can be implemented in urban environments"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="4"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Context/Background
                  </label>
                  <textarea
                    name="context"
                    value={formData.context}
                    onChange={handleInputChange}
                    placeholder="e.g., This is for an environmental blog with 50K monthly readers, focusing on practical tips for city dwellers"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Task Type
                  </label>
                  <select
                    name="promptType"
                    value={formData.promptType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {promptTypes.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Column 2: Format & Audience */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Format & Audience</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Audience
                  </label>
                  <select
                    name="audience"
                    value={formData.audience}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {audienceOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tone
                  </label>
                  <select
                    name="tone"
                    value={formData.tone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {toneOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Output Format
                  </label>
                  <select
                    name="outputFormat"
                    value={formData.outputFormat}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {formatOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Column 3: Additional Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Additional Requirements</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Specific Requirements
                  </label>
                  <textarea
                    name="additionalRequirements"
                    value={formData.additionalRequirements}
                    onChange={handleInputChange}
                    placeholder="e.g., Include statistics, avoid jargon, maximum 1000 words, include actionable tips"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Constraints/Limitations
                  </label>
                  <textarea
                    name="constraints"
                    value={formData.constraints}
                    onChange={handleInputChange}
                    placeholder="e.g., No mentions of specific brands, must be family-friendly, budget under $100"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Examples (Optional)
                  </label>
                  <textarea
                    name="examples"
                    value={formData.examples}
                    onChange={handleInputChange}
                    placeholder="e.g., Similar to articles like 'X' or in the style of 'Y'"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="2"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={generatePrompts}
                disabled={isGenerating}
                className="flex items-center px-4 py-3 bg-purple-600 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <span className="mr-2 animate-spin">⚡</span>
                    Generating Optimized Prompts...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🎯</span>
                    Generate Professional Prompts
                  </>
                )}
              </button>

              <button
                onClick={clearForm}
                className="px-3 py-3 bg-gray-500 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60"
              >
                <span className="mr-2">🗑️</span>
                Clear Form
              </button>

              {generatedPrompts.length > 0 && (
                <button
                  onClick={downloadPrompts}
                  className="flex items-center px-3 py-3 bg-green-600 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60"
                >
                  <span className="mr-2">📥</span>
                  Download All Prompts
                </button>
              )}
            </div>
          </div>

          {generatedPrompts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                🎯 5 Optimized Prompts Ready for ChatGPT/Claude
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Copy any of these prompts and paste them directly into ChatGPT, Claude, or any AI assistant for optimal results.
              </p>
              
              <div className="space-y-6">
                {generatedPrompts.map((prompt, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-5 bg-gray-50 dark:bg-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          Prompt {index + 1}
                        </span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-300">
                          {index === 0 ? 'Role-Based Approach' : 
                          index === 1 ? 'Chain of Thought' : 
                          index === 2 ? 'Outcome-Focused' : 
                          index === 3 ? 'Constraint-Based' : 
                          'Advanced Metacognitive'}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(prompt, index)}
                        className="flex items-center text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <span className="mr-1">📋</span>
                        {copiedIndex === index ? 'Copied!' : 'Copy Prompt'}
                      </button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <pre className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                        {prompt}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-gray-100 mb-2">💡 Pro Tips:</h3>
                <ul className="text-sm text-blue-700 dark:text-gray-100 space-y-1">
                  <li>• Try different prompts to see which works best for your specific AI assistant</li>
                  <li>• Copy the entire prompt including all formatting and instructions</li>
                  <li>• You can modify the prompts further based on the AI's response</li>
                  <li>• Save the prompts that work well for future similar tasks</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPromptGenerator;