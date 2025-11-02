import axios from "axios";
  export const API_BASE = "https://attendhub.vercel.app/api";
  export const api = axios.create({
    baseURL: API_BASE,
  });