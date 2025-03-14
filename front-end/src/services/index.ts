import axios from "axios"
import { TIME_OUT } from "./config"
const BASE_URL = import.meta.env.VITE_API_URL
console.log(import.meta.env.VITE_API_URL);

const axiosService = axios.create({
  baseURL: BASE_URL,
  timeout: TIME_OUT,
  headers:{
    "Content-Type": "application/json",
  }
})

// 添加请求拦截器用于调试
axiosService.interceptors.request.use(
  config => {
    console.log('发送请求:', config);
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器用于调试
axiosService.interceptors.response.use(
  response => {
    console.log('收到响应:', response);
    return response;
  },
  error => {
    console.error('响应错误:', error);
    return Promise.reject(error);
  }
);

export default axiosService
