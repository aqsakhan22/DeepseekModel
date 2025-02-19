const axios = require('axios');
const express = require('express')
const app = express();
const mysql = require('mysql2');
app.use(express.json());

// Replace with your OpenRouter API key
const OPENROUTER_API_KEY = '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';

// The DeepSeek R1 model ID
//  
const MODEL_ID = "deepseek/deepseek-r1:free";
//'deepseek-ai/deepseek-r1-free';


// The API endpoint for OpenRouter

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nodemysql'
});
// DB Connect
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});
// Function to save prompt and response to MySQL
function saveToDatabase(prompt, response) {
    const query = 'INSERT INTO responses (prompt, response) VALUES (?, ?)';
    db.query(query, [prompt, response], (err, results) => {
        if (err) {
            console.error('Error saving to database:', err);
            return;
        }
        console.log('Saved to database with ID:', results.insertId);
    });
}


app.post('/ask', async function(req,res) {
 const {question} = req.body;
 const prompt=question;
 console.log(`question is ${question}`);
 try {
    const response = await axios.post(
        OPENROUTER_API_URL,
        {
            model: MODEL_ID,
            messages: [
                { role: 'user', content: prompt }
            ]
        },
        {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    // Extract the response from the model
    //const modelResponse = response.data.choices[0].message.content;
         //saveToDatabase(prompt, response);

        // Fetch and display all responses from MySQL
       // fetchResponsesFromDatabase();
    const modelResponse = response.data.choices[0].message.content;
    const data=response.data;

    res.status(200).json({
'message':modelResponse,
 'data':data
        //'response':response
    });
    //console.log('DeepSeek R1 Response:', modelResponse);
   // return modelResponse;
} catch (error) {
    console.error('Error fetching response from DeepSeek R1:', error);
    res.status(500).json(
        {
            'message':error
        }
    );
    throw error;
}
 


});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// async function getResponseFromDeepSeek(prompt) {
//     try {
//         const response = await axios.post(
//             OPENROUTER_API_URL,
//             {
//                 model: MODEL_ID,
//                 messages: [
//                     { role: 'user', content: prompt }
//                 ]
//             },
//             {
//                 headers: {
//                     'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
//                     'Content-Type': 'application/json'
//                 }
//             }
//         );

//         // Extract the response from the model
//         const modelResponse = response.data.choices[0].message.content;
//         return modelResponse;
//     } catch (error) {
//         console.error('Error fetching response from DeepSeek R1:', error);
//         throw error;
//     }
// }

// // Example usage
// (async () => {
//     const prompt = "Hello, how are you?";
//     const response = await getResponseFromDeepSeek(prompt);
//     console.log('DeepSeek R1 Response:', response);
// })();