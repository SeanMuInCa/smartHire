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
export default axiosService
