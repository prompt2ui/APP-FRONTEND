"use client"

import { Navigate, useParams } from "react-router-dom"
import { useStore } from "@/api/storage"

/** Old URL `/project/testing` → `/project/:id/testing` using current project from store. */
export function LegacyProjectTestingRedirect() {
  const { currentProject } = useStore()
  const pid = currentProject?.project_id
  if (pid == null) return <Navigate to="/" replace />
  return <Navigate to={`/project/${pid}/testing`} replace />
}

/** Old URL `/project/testing/:testId` → `/project/:id/testing/:testId`. */
export function LegacyProjectTestingDetailRedirect() {
  const { currentTestId } = useParams()
  const { currentProject } = useStore()
  const pid = currentProject?.project_id
  if (!currentTestId || pid == null) return <Navigate to="/" replace />
  return <Navigate to={`/project/${pid}/testing/${currentTestId}`} replace />
}
