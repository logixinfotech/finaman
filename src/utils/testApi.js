const { authenticateUser, fetchSidebarMenu } = require('./api.js');

const testApi = async () => {
    try {
        const authResponse = await authenticateUser();
        console.log('Authentication Successful:', authResponse);
        
        const token = authResponse.token;
        const menuResponse = await fetchSidebarMenu(token);
        console.log('Sidebar Menu:', menuResponse);
    } catch (error) {
        console.error('API Test Error:', error);
    }
};

testApi();


 