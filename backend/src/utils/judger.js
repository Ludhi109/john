const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com';

/**
 * Executes code against a set of test cases using Judge0
 * @param {string} sourceCode - The code to execute
 * @param {number} languageId - Judge0 language ID
 * @param {Array} testCases - Array of {input, output}
 * @returns {Promise<Object>} - Results { passed, total, details }
 */
const evaluateCoding = async (sourceCode, languageId, testCases) => {
  if (!RAPIDAPI_KEY) {
    console.log('--- USING MOCK JUDGER FALLBACK ---');
    return runMockEvaluation(sourceCode, testCases);
  }

  let passedCount = 0;
  const details = [];

  for (const tc of testCases) {
    try {
      // 1. Submit to Judge0
      const options = {
        method: 'POST',
        url: `https://${RAPIDAPI_HOST}/submissions`,
        params: { base64_encoded: 'true', fields: '*' },
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST,
          'Content-Type': 'application/json'
        },
        data: {
          source_code: Buffer.from(sourceCode).toString('base64'),
          language_id: languageId,
          stdin: tc.input ? Buffer.from(tc.input).toString('base64') : ""
        }
      };

      const response = await axios.request(options);
      const token = response.data.token;

      // 2. Poll for result
      let result = null;
      let statusId = 1;
      
      // Safety timeout: 10 attempts
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const getOptions = {
          method: 'GET',
          url: `https://${RAPIDAPI_HOST}/submissions/${token}`,
          params: { base64_encoded: 'true', fields: '*' },
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': RAPIDAPI_HOST
          }
        };

        const getResponse = await axios.request(getOptions);
        result = getResponse.data;
        statusId = result.status.id;

        if (statusId > 2) break; // Finished processing
      }

      // 3. Compare output
      const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString('utf-8').trim() : "";
      const expectedOutput = tc.output ? tc.output.trim() : "";
      
      const passed = statusId === 3 && stdout === expectedOutput;
      if (passed) passedCount++;

      details.push({
        input: tc.input,
        expected: expectedOutput,
        actual: stdout,
        status: result.status.description,
        passed
      });

    } catch (err) {
      console.error('Judge0 Error:', err.message);
      details.push({
        input: tc.input,
        error: err.message,
        passed: false
      });
    }
  }

  return {
    passed: passedCount,
    total: testCases.length,
    details
  };
};

/**
 * Basic Mock Execution for JavaScript
 */
const runMockEvaluation = (sourceCode, testCases) => {
  let passedCount = 0;
  const details = [];

  testCases.forEach(tc => {
    try {
      // Create a function from the source code
      // We assume the student might have written a function named 'solution' or just raw code
      // This is a basic simulation for localized demos
      let actual = "NO_OUTPUT";
      let passed = false;

      // Wrap in a function that can take inputs
      // For MCQ/Short Answer this won't even be called, only for coding
      try {
        // Basic mapping of comma-separated inputs to function arguments
        const args = tc.input ? tc.input.split(',').map(n => {
          const trimmed = n.trim();
          if (!isNaN(trimmed)) return Number(trimmed);
          if (trimmed.startsWith('"') || trimmed.startsWith("'")) return trimmed.slice(1, -1);
          return trimmed;
        }) : [];

        // Simple execution: evaluate the code and try to see if it returns the expected value
        // We inject the arguments and see what happens
        const executor = new Function('...args', sourceCode + '\nif(typeof solution !== "undefined") return solution(...args);');
        const result = executor(...args);
        
        actual = result !== undefined ? String(result) : "undefined";
        
        // Compare with expected output
        if (actual.trim() === tc.output.trim()) {
          passed = true;
        }
      } catch (evalErr) {
        actual = `Runtime Error: ${evalErr.message}`;
      }

      if (passed) passedCount++;
      details.push({
        input: tc.input || "No Input",
        expected: tc.output,
        actual: actual,
        status: passed ? "Accepted" : "Wrong Answer",
        passed
      });
    } catch (err) {
      details.push({
        input: tc.input,
        error: "Mock Simulation Error: " + err.message,
        passed: false
      });
    }
  });

  return {
    passed: passedCount,
    total: testCases.length,
    details,
    isMock: true
  };
};

module.exports = { evaluateCoding };

