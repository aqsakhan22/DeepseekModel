require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// MySQL Database Connection
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

// Function to convert Natural Language to SQL using DeepSeek
async function generateSQLQuery(naturalQuery) {
  try {
    const response = await axios.post(process.env.DEEPSEEK_API_URL, {
      model: "deepseek-chat",
      prompt: `Convert this into an SQL query: ${naturalQuery}`,
      max_tokens: 200,
      temperature: 0.3,
    });

    const sqlQuery = response.data.choices[0].text.trim();
    return sqlQuery;
  } catch (error) {
    console.error("DeepSeek API Error:", error);
    throw new Error("Failed to generate SQL query");
  }
}

// Execute SQL Query in MySQL
async function executeSQLQuery(sqlQuery) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(sqlQuery);
    connection.release();
    return rows;
  } catch (error) {
    console.error("SQL Execution Error:", error);
    throw new Error("Failed to execute SQL query");
  }
}

// API Endpoint to Handle Natural Language Query
app.post("/query", async (req, res) => {
  const { naturalQuery } = req.body;

  if (!naturalQuery) {
    return res.status(400).json({ error: "Natural language query is required" });
  }

  try {
    const sqlQuery = await generateSQLQuery(naturalQuery);
    console.log("Generated SQL Query:", sqlQuery);

    const result = await executeSQLQuery(sqlQuery);
    res.json({ sqlQuery, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// How Check
/* {
  "sqlQuery": "SELECT SUM(sales) FROM orders WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH);",
  "result": [
    { "SUM(sales)": 50000 }
  ]
}
 */