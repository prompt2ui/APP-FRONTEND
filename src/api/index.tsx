import axios from "axios"

function withTrailingSlash(base: string): string {
  const trimmed = base.trim()
  if (!trimmed) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is empty. Set it in .env (see .env.example)."
    )
  }
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`
}

const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL
if (!fromEnv?.trim()) {
  throw new Error(
    "Missing NEXT_PUBLIC_API_BASE_URL. Copy .env.example to .env and set your backend API base URL."
  )
}

export const API_BASE_URL = withTrailingSlash(fromEnv)



export const api = axios.create({
  baseURL:  API_BASE_URL,
  headers:  { 
                "Content-Type": "application/json" 
            },
})


api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error("API Error:", error.message)
    return Promise.resolve({
      ok: false,
      data: null,
      status: error.response?.status || 500,
      message: error.response?.data || "Unknown Error",
    })
  }
)