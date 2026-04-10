import { useEffect, useState } from "react"
import { getProjects } from "@/api/project"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Link } from "react-router-dom"
import { Heart, Users } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createProject } from "@/api/project"
import { toast } from "sonner"
import { UserDetail } from "@/lib/utils"

const PROJECT_COVER_IMAGES = [
  "/dev_cover1.png",
  "/dev_cover2.png",
  "/dev_cover3.png",
  "/dev_cover4.png",
  "/dev_cover5.png",
] as const

function resolveProjectCover(
  thumbnail: string | null | undefined,
  index: number
): string {
  const raw = thumbnail?.trim()
  if (raw) {
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw
    if (raw.startsWith("/")) return raw
    return `/${raw}`
  }
  return PROJECT_COVER_IMAGES[index % PROJECT_COVER_IMAGES.length]
}


export default function ProjectListSection() {
  
  //   const mockProjects = [
  //   {
  //     project_id: "1",
  //     project_name: "Frontend Tester Dashboard",
  //     project_thumbnail: "dev_cover1.png",
  //     project_description: "AI-powered test management dashboard for frontend automation.",
  //   },
  //   {
  //     project_id: "2",
  //     project_name: "Login Page Generator",
  //     project_thumbnail: "dev_cover1.png",
  //     project_description: "Beautiful responsive login templates with authentication logic.",
  //   },
  //   {
  //     project_id: "3",
  //     project_name: "Test Script Studio",
  //     project_thumbnail: "dev_cover1.png",
  //     project_description: "Build and run Playwright scripts directly from your browser.",
  //   },
  //   {
  //     project_id: "4",
  //     project_name: "QA Metrics Dashboard",
  //     project_thumbnail: "dev_cover1.png",
  //     project_description: "Visualize test coverage, pass rates, and execution trends.",
  //   },
  //   {
  //     project_id: "5",
  //     project_name: "UI Element Recorder",
  //     project_thumbnail: "dev_cover1.png",
  //     project_description: "Record user flows and auto-generate reusable test components.",
  //   },
  //   {
  //     project_id: "6",
  //     project_name: "Test Result Viewer",
  //     project_thumbnail: "dev_cover1.png",
  //     project_description: "Watch recorded videos, logs, and metadata for every test case.",
  //   },
  // ]

  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchProjects = async () => {
    try {
      const data = await getProjects()
      setProjects(data)
    } catch (error) {
      console.error(error)
      toast.error("ไม่สามารถโหลดรายการโปรเจกต์ได้")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const formSchema = z.object({
    projectName: z.string().min(1, "กรุณาระบุชื่อโปรเจกต์"),
    projectDescription: z.string().optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      projectDescription: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const res = await createProject({
        user_id: UserDetail.user_id,
        project_name: values.projectName,
        project_description: values.projectDescription,
        project_thumbnail: null, // Default
      })

      if (res.success) {
        toast.success("สร้างโปรเจกต์สำเร็จ")
        setOpen(false)
        form.reset()
        fetchProjects() // Refresh list
      } else {
        toast.error(res.error || "ไม่สามารถสร้างโปรเจกต์ได้")
      }
    } catch (error) {
      console.error(error)
      toast.error("เกิดข้อผิดพลาดขณะสร้างโปรเจกต์")
    } finally {
      setIsSubmitting(false)
    }
  }



  if (loading) return <div className="py-10 text-center text-sm text-muted-foreground">กำลังโหลด...</div>

  return (
    <section className="flex flex-col gap-8 px-48">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">โปรเจกต์ล่าสุด</h2>
          <p className="text-sm text-muted-foreground">
            สำรวจและจัดการการทดสอบของคุณ
          </p>
        </div>
        {/* <button className="text-sm text-muted-foreground hover:underline">
          New Project →
        </button> */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="text-sm text-muted-foreground hover:underline">โปรเจกต์ใหม่ →</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>สร้างโปรเจกต์ใหม่</DialogTitle>
                <DialogDescription>
                  กรอกรายละเอียดโปรเจกต์ แล้วกดสร้างเมื่อพร้อม
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="text-sm font-medium text-gray-300">
                    ชื่อโปรเจกต์
                  </Label>
                  <Input
                    id="projectName"
                    placeholder="เช่น ทดสอบหน้าเว็บ"
                    className="bg-zinc-900 border-zinc-800 text-gray-200 placeholder:text-gray-500"
                    {...form.register("projectName")}
                  />
                  {form.formState.errors.projectName && (
                    <p className="text-xs text-red-500">{form.formState.errors.projectName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectDescription" className="text-sm font-medium text-gray-300">
                    คำอธิบายโปรเจกต์
                  </Label>
                  <Input
                    id="projectDescription"
                    placeholder="อธิบายโปรเจกต์ของคุณ (ไม่บังคับ)"
                    className="bg-zinc-900 border-zinc-800 text-gray-200 placeholder:text-gray-500"
                    {...form.register("projectDescription")}
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="border-zinc-700 text-gray-300 hover:bg-zinc-800"
                  onClick={() => setOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button 
                  type="submit" 
                  className="bg-white text-black hover:bg-gray-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "กำลังสร้าง..." : "สร้าง"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* {projects.map((item) => ( */}
        {/* {mockProjects.map((item) => ( */}
        {projects.map((item, index) => (
          <Link key={item.project_id} to={`/project/${item.project_id}`} className="group flex flex-col overflow-hidden rounded-lg">
            {/* preview image — public dev covers rotate when no thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <img
                src={resolveProjectCover(item.project_thumbnail, index)}
                alt={item.project_name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* info */}
            <div className="mt-3 flex items-center gap-3">
              <Avatar className="h-7 w-7">
                <AvatarFallback>
                  {item.project_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium leading-tight">
                  {item.project_name}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <p className="line-clamp-1">{item.project_description || "ยังไม่มีคำอธิบาย"}</p>
                  {/* <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> 0
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> 0
                  </span> */}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
    
  )
}
