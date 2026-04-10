"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Link, FileText, Folder, Globe } from "lucide-react"

interface ProjectFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function ProjectForm({ onSubmit, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    figmaUrl: "",
    baseUrl: "",
    spec: "",
    galleryType: "figma", // "figma" or "upload"
  })

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [projectFolder, setProjectFolder] = useState<FileList | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      uploadedFiles,
      projectFolder,
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files))
    }
  }

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProjectFolder(e.target.files)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* Project Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            ข้อมูลโปรเจค
          </CardTitle>
          <CardDescription>กรอกข้อมูลพื้นฐานของโปรเจค</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">ชื่อโปรเจค *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="เช่น E-commerce Platform"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">คำอธิบายโปรเจค</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="อธิบายโปรเจคของคุณ..."
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* UX/UI Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            UX/UI Gallery
          </CardTitle>
          <CardDescription>อัพโหลดไฟล์ดีไซนหรือแชร์ลิงก์ Figma</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={formData.galleryType}
            onValueChange={(value) => setFormData({ ...formData, galleryType: value })}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="figma" className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                Figma URL
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                อัพโหลดรูปภาพ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="figma" className="mt-4">
              <div>
                <Label htmlFor="figmaUrl">Figma URL</Label>
                <Input
                  id="figmaUrl"
                  type="url"
                  value={formData.figmaUrl}
                  onChange={(e) => setFormData({ ...formData, figmaUrl: e.target.value })}
                  placeholder="https://www.figma.com/file/..."
                  className="mt-1"
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div>
                <Label htmlFor="gallery">อัพโหลดรูปภาพ UX/UI</Label>
                <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <div className="text-sm text-muted-foreground mb-2">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</div>
                  <input
                    id="gallery"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" onClick={() => document.getElementById("gallery")?.click()}>
                    เลือกไฟล์
                  </Button>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-3 text-sm text-muted-foreground">เลือกไฟล์แล้ว: {uploadedFiles.length} ไฟล์</div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Code Project Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            อัพโหลด Code Project
          </CardTitle>
          <CardDescription>อัพโหลดโฟลเดอร์โปรเจคของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="project-folder">โฟลเดอร์โปรเจค</Label>
            <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Folder className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground mb-2">เลือกโฟลเดอร์โปรเจคของคุณ</div>
              <input
                id="project-folder"
                type="file"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFolderUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("project-folder")?.click()}
              >
                เลือกโฟลเดอร์
              </Button>
              {projectFolder && (
                <div className="mt-3 text-sm text-muted-foreground">เลือกไฟล์แล้ว: {projectFolder.length} ไฟล์</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Base URL
          </CardTitle>
          <CardDescription>กำหนด URL หลักของโปรเจค</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              type="url"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="https://example.com"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Spec */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Specification
          </CardTitle>
          <CardDescription>กำหนดรายละเอียดและข้อกำหนดของโปรเจค</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="spec">รายละเอียดโปรเจค (คล้าย agent.md)</Label>
            <Textarea
              id="spec"
              value={formData.spec}
              onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
              placeholder="# Project Specification

## Overview
อธิบายโปรเจคโดยรวม...

## Features
- Feature 1
- Feature 2

## Technical Requirements
- Technology stack
- Dependencies
- Environment setup

## Design Guidelines
- UI/UX requirements
- Brand guidelines"
              className="mt-1 font-mono text-sm"
              rows={12}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          สร้างโปรเจค
        </Button>
      </div>
    </form>
  )
}
