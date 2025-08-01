"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Plus, Loader2 } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useProjectStore } from "@/store"

interface Video {
  id: string
  title: string
  status: string
  duration: string
  createdAt: string
  thumbnail: string
}

interface ProjectVideosProps {
  videos: Video[]
  projectId: string
}

export function ProjectVideos({ videos, projectId }: ProjectVideosProps) {

  const projects = useProjectStore.getState().projects
  const currentProject = projects.find((p) => p.project_id === projectId)


  const [loading, setLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
  if (!downloadUrl) return

  const controller = new AbortController()

  const fetchVideo = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/download/${downloadUrl}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentProject?.project_access_key}`,
        },
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error("Failed to fetch video")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
    } catch (err) {
      if (err instanceof Error) {
        console.error("Video fetch error:", err.message)
        return
      }
    }
  }

  fetchVideo()

  return () => {
    controller.abort()
  }
}, [downloadUrl, currentProject])


  useEffect(() => {
    if (!taskId) return

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/status/${taskId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentProject?.project_access_key}`,
          },
        })
        const data = await res.json()
        console.log("STATUS FROM API", data)
        setStatus(data.status)

        // check if status is done
        if (data.status === "done") {
          setStatus("done")
          setDownloadUrl(data.task_id)
          setLoading(false)

          if (intervalRef.current) clearInterval(intervalRef.current)
          return
        }

        if (data.status === "failed") {
          setStatus("failed")
          setLoading(false)
          if (intervalRef.current) clearInterval(intervalRef.current)
        }

      } catch (error) {
        console.error("Polling error:", error)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [taskId])


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Videos</CardTitle>
          <Button
            onClick={async () => {
              try {
                setLoading(true)

                const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/video`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentProject?.project_access_key}`,
                  },
                  body: JSON.stringify({
                    text: "TESTING"
                  }),
                })

                if (!res.ok) {
                  const err = await res.json()
                  console.error("Error:", err.details)
                  return
                }
                
                const data = await res.json()
                setTaskId(data.task_id)
                console.log("DATA FROM API", data)
              } catch (error) {
                console.error("Error creating video:", error)
              } finally {
              }
            }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Video
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No videos yet</h3>
            <p className="text-slate-600 mb-4">Create your first AI-generated video to get started.</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Video
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {
                loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" /> <span>{status ? status : ""}</span>
                  </div>
                ) : videoUrl ? (
                  <div className="flex justify-center">
                    <video controls className="rounded-md w-full max-w-2xl" src={videoUrl} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No videos yet</h3>
                    <p className="text-slate-600 mb-4">Create your first AI-generated video to get started.</p>
                  </div>
                )
              }
            </div>
          </>
          // <div className="space-y-4">
          //   {videos.map((video) => (
          //     <div
          //       key={video.id}
          //       className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
          //     >
          //       <div className="relative">
          //         <Image
          //           width={1000}
          //           height={1000}
          //           src={video.thumbnail || "/placeholder.svg"}
          //           alt={video.title}
          //           className="w-20 h-12 object-cover rounded bg-slate-100"
          //         />
          //         {video.status === "completed" && (
          //           <div className="absolute inset-0 flex items-center justify-center">
          //             <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
          //               <Play className="w-3 h-3 text-white fill-white" />
          //             </div>
          //           </div>
          //         )}
          //       </div>

          //       <div className="flex-1 min-w-0">
          //         <h4 className="font-medium text-slate-900 truncate">{video.title}</h4>
          //         <div className="flex items-center space-x-4 mt-1">
          //           <Badge variant="secondary" className={getStatusColor(video.status)}>
          //             {video.status}
          //           </Badge>
          //           <span className="text-sm text-slate-600">{video.duration}</span>
          //           <span className="text-sm text-slate-600">{new Date(video.createdAt).toLocaleDateString()}</span>
          //         </div>
          //       </div>

          //       <DropdownMenu>
          //         <DropdownMenuTrigger asChild>
          //           <Button variant="ghost" size="icon">
          //             <MoreHorizontal className="w-4 h-4" />
          //           </Button>
          //         </DropdownMenuTrigger>
          //         <DropdownMenuContent align="end">
          //           <DropdownMenuItem>
          //             <Play className="w-4 h-4 mr-2" />
          //             Preview
          //           </DropdownMenuItem>
          //           <DropdownMenuItem>
          //             <Download className="w-4 h-4 mr-2" />
          //             Download
          //           </DropdownMenuItem>
          //           <DropdownMenuItem>
          //             <Share className="w-4 h-4 mr-2" />
          //             Share
          //           </DropdownMenuItem>
          //           <DropdownMenuItem className="text-red-600">
          //             <Trash2 className="w-4 h-4 mr-2" />
          //             Delete
          //           </DropdownMenuItem>
          //         </DropdownMenuContent>
          //       </DropdownMenu>
          //     </div>
          //   ))}
          // </div>
        )}
      </CardContent>
    </Card>
  )
}
