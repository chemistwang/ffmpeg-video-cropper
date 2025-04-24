import React, { useState } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";

const VideoUploader = ({ onVideoUpload, setLoading, setError }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.type.startsWith("video/")) {
      setError("Please upload a video file.");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);

    setLoading(true);
    try {
      const response = await axios.post("/api/videos/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      onVideoUpload({
        file,
        filename: response.data.filename,
        url: response.data.url,
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      setError(
        error.response?.data?.detail ||
          "Error uploading video. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      sx={{
        position: "relative",
        width: "100%",
        textAlign: "center",
      }}
    >
      <input
        type="file"
        id="video-upload"
        style={{ display: "none" }}
        accept="video/*"
        onChange={handleChange}
      />
      <label htmlFor="video-upload">
        <Paper
          elevation={dragActive ? 3 : 1}
          sx={{
            border: dragActive ? "2px dashed #2196f3" : "2px dashed #ccc",
            borderRadius: 2,
            p: 5,
            cursor: "pointer",
            backgroundColor: dragActive ? "rgba(33, 150, 243, 0.1)" : "inherit",
            transition: "background-color 0.3s, border 0.3s",
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center">
            <CloudUploadIcon sx={{ fontSize: 60, color: "#2196f3", mb: 2 }} />
            <Typography variant="h6" component="div" gutterBottom>
              Drag and drop a video or click to browse
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Supported formats: MP4, MOV, AVI, etc.
            </Typography>
            <Button variant="contained" component="span" sx={{ mt: 2 }}>
              Select Video
            </Button>
          </Box>
        </Paper>
      </label>
    </Box>
  );
};

export default VideoUploader;
