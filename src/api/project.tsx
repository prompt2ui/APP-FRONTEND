import { api } from "./index"

export async function getProjects() {
  const res = await api.get("/projects")
  return res.data
}

export async function getProjectDetail(id: number | string) {
  const res = await api.get(`/project/${id}`)
  return res.data

}

export async function deleteTestByID(test_id: number | string) {
  const res = await api.delete(`/test/${test_id}`)
  return res.data
}


export async function createProject(data: any) {
  const res = await api.post("/project", data)
  return res.data
}