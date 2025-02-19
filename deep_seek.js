const express = require('express');
const mysql = require('mysql2');
const axios = require('axios');

const app = express();
app.use(express.json());

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nodemysql'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// DeepSeek API configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'; // Replace with actual DeepSeek API URL
const DEEPSEEK_API_KEY = 'sk-939f08602eea4077a8982e9a285027f7'; // Replace with your DeepSeek API key

// Function to generate SQL query using DeepSeek
async function generateSQLQuery(question) {
  const prompt = `Generate a SQL query for: ${question}`;
  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: 'deepseek-model', // Replace with actual model name
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50
    },
    {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.choices[0].message.content.trim();
}

// Function to execute SQL query and fetch results
function executeSQLQuery(query) {
  return new Promise((resolve, reject) => {
    db.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

// Function to format results into natural language
function formatResults(results, question) {
  if (results.length === 0) {
    return 'No results found.';
  }

  if (question.toLowerCase().includes('average salary')) {
    return `The average salary is $${results[0]['AVG(salary)']}.`;
  }

  if (question.toLowerCase().includes('list all employees')) {
    const names = results.map(row => row.name).join(', ');
    return `The employees are: ${names}.`;
  }

  if (question.toLowerCase().includes('highest salary')) {
    return `The employee with the highest salary is ${results[0].name} with a salary of $${results[0].salary}.`;
  }

  return JSON.stringify(results);
}

// API endpoint to handle user questions
app.get('/get',function(req,res){
    console.log("gettting api data");
    res.status(200).json({
        'name':'Hello world'
    });
});
app.post('/ask', async (req, res) => {
    console.log("*******************");
  const { question } = req.body;
  console.log(`question is ${question}`);

  try {
    // Step 1: Generate SQL query using DeepSeek
    const sqlQuery = await generateSQLQuery(question);
    console.log('Generated SQL Query:', sqlQuery);

    // Step 2: Execute the SQL query
    const results = await executeSQLQuery(sqlQuery);

    // Step 3: Format results into natural language
    const response = formatResults(results, question);

    // Step 4: Send the response
    res.json({ response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});