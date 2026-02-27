// src/utils/api.js
import axios from 'axios';
import config from '../config';

// Create an Axios instance
const api = axios.create({
    baseURL: config.apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

export const authenticateUser = async () => {
    try {
        const response = await api.post('/api/authenticate', {
            com_code: config.credentials.com_code,
            user_id: config.credentials.user_id,
            user_pass: config.credentials.user_pass,
        });
        return response.data;
    } catch (error) {
        console.error('Error during authentication:', error.response ? error.response.data : error.message);
        throw error;
    }
};

export const fetchSidebarMenu = async (token) => {
    try {
        console.log('Fetching sidebar menu with token:', token);
        const response = await api.get('/api/masmod', {
            headers: {
                Authorization: token,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching sidebar menu:', error.response ? error.response.data : error.message);
        throw error;
    }
};

export const fetchMasmnuData = async (token) => {
    try {
        console.log('Fetching sidebar menu with token:', token);
        const response = await api.get('/api/masmnu', {
            headers: {
                Authorization: token,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching sidebar menu:', error.response ? error.response.data : error.message);
        throw error;
    }
};
