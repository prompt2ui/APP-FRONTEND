'use client'

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";

import HomePage from "./pages/HomePage";
import ProjectLayout from "@/pages/Project/ProjectLayout";
import ProjectDetailPage from "@/pages/Project/ProjectDetail";
import ProjectTestingPage from "@/pages/Project/ProjectTesting";
import ProjectTestingDetailPage from "@/pages/Project/ProjectTestingDetail";
import {
  LegacyProjectTestingDetailRedirect,
  LegacyProjectTestingRedirect,
} from "@/pages/Project/legacy-testing-redirects";
import APIKeySettingsPage from "./pages/Project/APIKeySettings";
import { Toaster } from "sonner";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project" element={<HomePage />} />
          <Route element={<ProjectLayout />}>
            <Route path="/project/settings/api-key" element={<APIKeySettingsPage />} />
            {/* Legacy URLs (bookmark / old links) */}
            <Route path="/project/testing/:currentTestId" element={<LegacyProjectTestingDetailRedirect />} />
            <Route path="/project/testing" element={<LegacyProjectTestingRedirect />} />
            <Route path="/project/:id/testing/:currentTestId" element={<ProjectTestingDetailPage />} />
            <Route path="/project/:id/testing" element={<ProjectTestingPage />} />
            <Route path="/project/:id" element={<ProjectDetailPage />} />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </ThemeProvider>
  );
}
