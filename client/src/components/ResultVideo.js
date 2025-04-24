import React from "react";
import { Box, Button, Stack, Typography, Chip } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import MonochromePhotosIcon from "@mui/icons-material/MonochromePhotos";
import axios from "axios";

const ResultVideo = ({ croppedVideo, onReset }) => {
  const handleDownload = async () => {
    try {
      // 使用axios直接获取文件内容并创建blob下载
      const response = await axios.get(
        `/api/videos/download/${croppedVideo.filename}`,
        {
          responseType: "blob", // 关键：指定响应类型为blob
        }
      );

      // 从响应中获取内容类型
      const contentType = response.headers["content-type"];

      // 创建Blob对象
      const blob = new Blob([response.data], { type: contentType });

      // 创建URL
      const url = window.URL.createObjectURL(blob);

      // 创建下载链接并触发点击
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", croppedVideo.filename);
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("下载文件时出错:", error);
      alert("下载文件时出错，请重试");
    }
  };

  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Typography variant="h6" gutterBottom>
        Cropped Video Result
        {croppedVideo.grayscale && (
          <Chip
            icon={<MonochromePhotosIcon />}
            label="灰度视频"
            color="primary"
            size="small"
            sx={{ ml: 1 }}
          />
        )}
      </Typography>

      <Box sx={{ my: 3 }}>
        <video
          src={croppedVideo.url}
          controls
          autoPlay
          style={{ maxWidth: "100%", maxHeight: "70vh" }}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your video has been successfully cropped!
        {croppedVideo.cropArea && (
          <Box component="span" sx={{ display: "block", mt: 1 }}>
            Crop coordinates: X: {Math.round(croppedVideo.cropArea.x)}, Y:{" "}
            {Math.round(croppedVideo.cropArea.y)}, Width:{" "}
            {Math.round(croppedVideo.cropArea.width)}, Height:{" "}
            {Math.round(croppedVideo.cropArea.height)}
            {croppedVideo.grayscale && ", Grayscale: Yes"}
          </Box>
        )}
      </Typography>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<RestartAltIcon />}
          onClick={onReset}
        >
          Process Another Video
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download Video
        </Button>
      </Stack>
    </Box>
  );
};

export default ResultVideo;
