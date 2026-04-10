import React, { useState } from "react";

const UploadPage: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [fileContent, setFileContent] = useState<string>("");

  // เลือกไฟล์ผ่าน dialog
  async function handleChooseFile() {
    const selected = await (window as any).electronAPI.openFile();
    console.log("เลือกไฟล์:", selected);
    setFiles(selected); // ✅ update state
  }

  // อ่านโฟลเดอร์
  async function handleReadDir() {
    const dir = "/Users/khxo/Desktop"; // 👈 ตัวอย่าง fix path
    const list = await (window as any).electronAPI.readDir(dir);
    console.log("ไฟล์ในโฟลเดอร์:", list);
    setFiles(list); // ✅ update state
  }

  // อ่านไฟล์แรกจาก state
  async function handleReadFile() {
    if (files.length === 0) return;
    const firstPath = typeof files[0] === "string" ? files[0] : files[0].fullPath;
    const content = await (window as any).electronAPI.readFile(firstPath);
    console.log("เนื้อหา:", content);
    setFileContent(content);
  }

  // เขียนไฟล์แรกจาก state
  async function handleWriteFile() {
    if (files.length === 0) return;
    const firstPath = typeof files[0] === "string" ? files[0] : files[0].fullPath;
    await (window as any).electronAPI.writeFile(firstPath, "\nHello world!");
    console.log("เขียนไฟล์เสร็จแล้ว");
  }

  return (
    <div className="flex h-screen">
      {/* ซ้าย */}
      <div className="w-1/2 p-6 border-r space-y-4">
        <h2 className="text-xl font-bold">File Explorer</h2>

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleChooseFile}
        >
          เลือกไฟล์
        </button>

        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={handleReadDir}
        >
          เปิด Desktop
        </button>

        {files.length > 0 && (
          <div>
            <h3 className="font-semibold mt-4">ไฟล์ที่เลือก/อ่านได้:</h3>
            <ul className="list-disc ml-6">
              {files.map((f, i) => (
                <li key={i}>{typeof f === "string" ? f : f.fullPath}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-x-2 mt-4">
          <button
            className="bg-purple-500 text-white px-4 py-2 rounded"
            onClick={handleReadFile}
          >
            อ่านไฟล์แรก
          </button>

          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={handleWriteFile}
          >
            เขียนไฟล์แรก (append)
          </button>
        </div>

        {fileContent && (
          <pre className="bg-gray-100 p-2 mt-4 h-48 overflow-y-auto">
            {fileContent}
          </pre>
        )}
      </div>

      {/* ขวา */}
      <div className="w-1/2">
        <iframe
          src="http://localhost:5173/login"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
};

export default UploadPage;
