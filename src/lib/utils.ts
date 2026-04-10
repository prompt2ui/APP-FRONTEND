import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export const UserDetail = {
  "user_id": 2,
  "user_name": "admin",
  "user_email": "admin@gmail.com",
  "user_password": "P@ssw0rd",
  "created_at": "2026-03-12 23:51:29",
  "updated_at": "2026-03-12 23:51:22"
}