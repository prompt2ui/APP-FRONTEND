// app-frontend/src/components/display-panel/display-panel.tsx
'use client';

import CodingPanel from "./coding-panel";
import PreviewPanel from "./preview-panel";



interface DisplayPanelProps {
  activeTab: "preview" | "code";
}
export default function DisplayPanel({ activeTab }: DisplayPanelProps) {
  return activeTab === "preview"
    ? <PreviewPanel/>
    : <CodingPanel/>
}
