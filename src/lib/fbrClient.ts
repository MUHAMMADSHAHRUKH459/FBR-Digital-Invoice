import axios from "axios";
import { config } from "./config";

export const fbrClient = axios.create({
  baseURL: config.fbr.baseUrl, // https://gw.fbr.gov.pk/di_data/v1/di
  headers: {
    // Token safe set - double Bearer avoid
    Authorization: config.fbr.token.startsWith("Bearer ")
      ? config.fbr.token.trim()
      : `Bearer ${config.fbr.token.trim()}`,
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request logging (debug ke liye)
fbrClient.interceptors.request.use((request) => {
  const isSandbox = config.fbr.mode === "sandbox";
  const endpoint = request.url || "";
  const fullEndpoint = isSandbox && !endpoint.endsWith("_sb") ? endpoint + "_sb" : endpoint;

  console.log("FBR Request:", {
    fullUrl: request.baseURL + fullEndpoint,
    method: request.method,
    headers: {
      Authorization: request.headers.Authorization,
      "Content-Type": request.headers["Content-Type"],
    },
    isSandbox,
  });

  // Fix: endpoint mein extra _sb mat add karo agar pehle se hai
  request.url = fullEndpoint;

  return request;
});

// Response error logging
fbrClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("FBR Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);