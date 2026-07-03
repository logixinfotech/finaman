import axios from "axios";
import config from "../config";  

const publicApi = axios.create({
  baseURL: config.apiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
}); 

export const fetchPublicQuotation = (led_key) =>
  publicApi.get("/api/public/quotation", { params: { led_key } }).then(r => r.data);

export const updatePublicQuotation = (payload) =>
  publicApi.post("/api/public/quotation/update", payload).then(r => r.data);  