import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./pages/DashboardLayout";
import ImageGen from "./pages/ImageGen";
import VideoGen from "./pages/VideoGen";
import History from "./pages/History";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard/image" replace />} />
            <Route path="image" element={<ImageGen />} />
            <Route path="video" element={<VideoGen />} />
            <Route path="history" element={<History />} />
          </Route>

          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<Admin />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
