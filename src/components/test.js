// src/components/test.js
const axios = require('axios');

const testApi = async () => {
  console.log('API response:', 'test');
  try {
    const response = await axios.post(
      'http://localhost:63556/api/authenticate',
      {
        com_code: "FINAMAN",
        user_id: "FINAMAN",
        user_pass: "FINAMAN"
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('API response:', response.data);
  } catch (error) {
    console.error('Error calling API:', error.response ? error.response.data : error.message);
  }
};

testApi();
