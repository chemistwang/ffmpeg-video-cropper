import React, { useRef, useState, useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import CropIcon from "@mui/icons-material/Crop";
import UndoIcon from "@mui/icons-material/Undo";
import axios from "axios";

const VideoCropper = ({ videoData, onVideoCrop, setLoading, setError }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const overlayRef = useRef(null);

  const [videoDimensions, setVideoDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null);
  const [originalPosition, setOriginalPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Get video dimensions when it's loaded
  useEffect(() => {
    const video = videoRef.current;

    const handleVideoLoad = () => {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      setVideoDimensions({ width: videoWidth, height: videoHeight });

      // Set initial crop area to be 50% of video centered
      const initialWidth = Math.round(videoWidth / 2);
      const initialHeight = Math.round(videoHeight / 2);
      const initialX = Math.round((videoWidth - initialWidth) / 2);
      const initialY = Math.round((videoHeight - initialHeight) / 2);

      setCropArea({
        x: initialX,
        y: initialY,
        width: initialWidth,
        height: initialHeight,
      });
    };

    if (video) {
      video.addEventListener("loadedmetadata", handleVideoLoad);

      return () => {
        video.removeEventListener("loadedmetadata", handleVideoLoad);
      };
    }
  }, [videoData]);

  // Handle dragging of the crop box
  const handleMouseDown = (e) => {
    const overlay = overlayRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    // Check if we're clicking on a resize handle
    if (e.target.classList.contains("crop-handle")) {
      setResizing(e.target.dataset.handle);
      setOriginalPosition({ ...cropArea });
      setDragStart({
        x: clientX,
        y: clientY,
      });
      return;
    }

    // Otherwise we're moving the entire box
    setIsDragging(true);
    setResizing(null);

    const overlayRect = overlay.getBoundingClientRect();

    // Calculate the mouse position relative to the overlay
    setDragStart({
      x: clientX - overlayRect.left + containerRect.left,
      y: clientY - overlayRect.top + containerRect.top,
    });

    setOriginalPosition({ ...cropArea });
  };

  const handleMouseMove = (e) => {
    if (!isDragging && !resizing) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    // Calculate the scale factor between the displayed video and the actual video
    const scaleX = videoDimensions.width / containerRect.width;
    const scaleY = videoDimensions.height / containerRect.height;

    if (resizing) {
      // We're resizing the box
      const deltaX = (clientX - dragStart.x) * scaleX;
      const deltaY = (clientY - dragStart.y) * scaleY;

      let newCrop = { ...cropArea };

      // Handle each resize direction
      switch (resizing) {
        case "nw":
          newCrop = {
            x: Math.min(
              originalPosition.x + originalPosition.width - 20,
              originalPosition.x + deltaX
            ),
            y: Math.min(
              originalPosition.y + originalPosition.height - 20,
              originalPosition.y + deltaY
            ),
            width: Math.max(20, originalPosition.width - deltaX),
            height: Math.max(20, originalPosition.height - deltaY),
          };
          break;
        case "ne":
          newCrop = {
            x: originalPosition.x,
            y: Math.min(
              originalPosition.y + originalPosition.height - 20,
              originalPosition.y + deltaY
            ),
            width: Math.max(20, originalPosition.width + deltaX),
            height: Math.max(20, originalPosition.height - deltaY),
          };
          break;
        case "sw":
          newCrop = {
            x: Math.min(
              originalPosition.x + originalPosition.width - 20,
              originalPosition.x + deltaX
            ),
            y: originalPosition.y,
            width: Math.max(20, originalPosition.width - deltaX),
            height: Math.max(20, originalPosition.height + deltaY),
          };
          break;
        case "se":
          newCrop = {
            x: originalPosition.x,
            y: originalPosition.y,
            width: Math.max(20, originalPosition.width + deltaX),
            height: Math.max(20, originalPosition.height + deltaY),
          };
          break;
        default:
          break;
      }

      // Constrain to video boundaries
      newCrop.x = Math.max(0, newCrop.x);
      newCrop.y = Math.max(0, newCrop.y);
      newCrop.width = Math.min(
        videoDimensions.width - newCrop.x,
        newCrop.width
      );
      newCrop.height = Math.min(
        videoDimensions.height - newCrop.y,
        newCrop.height
      );

      setCropArea(newCrop);
    } else if (isDragging) {
      // We're moving the whole box
      const deltaX = (clientX - dragStart.x) * scaleX;
      const deltaY = (clientY - dragStart.y) * scaleY;

      // Calculate new position
      let newX = originalPosition.x + deltaX;
      let newY = originalPosition.y + deltaY;

      // Constrain to video boundaries
      newX = Math.max(
        0,
        Math.min(videoDimensions.width - cropArea.width, newX)
      );
      newY = Math.max(
        0,
        Math.min(videoDimensions.height - cropArea.height, newY)
      );

      setCropArea({
        ...cropArea,
        x: newX,
        y: newY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizing(null);
  };

  const handleCrop = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("filename", videoData.filename);
      formData.append("x", Math.round(cropArea.x));
      formData.append("y", Math.round(cropArea.y));
      formData.append("width", Math.round(cropArea.width));
      formData.append("height", Math.round(cropArea.height));

      const response = await axios.post("/api/videos/crop", formData);

      onVideoCrop({
        filename: response.data.filename,
        url: response.data.url,
        cropArea: cropArea,
      });
    } catch (error) {
      console.error("Error cropping video:", error);
      setError(
        error.response?.data?.detail ||
          "Error cropping video. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Reset to initial crop area (50% centered)
    const initialWidth = Math.round(videoDimensions.width / 2);
    const initialHeight = Math.round(videoDimensions.height / 2);
    const initialX = Math.round((videoDimensions.width - initialWidth) / 2);
    const initialY = Math.round((videoDimensions.height - initialHeight) / 2);

    setCropArea({
      x: initialX,
      y: initialY,
      width: initialWidth,
      height: initialHeight,
    });
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Drag to move the crop area. Drag the handles to resize.
      </Typography>

      <Box
        ref={containerRef}
        className="crop-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        sx={{
          position: "relative",
          touchAction: "none",
          maxWidth: "100%",
        }}
      >
        <video
          ref={videoRef}
          src={videoData.url}
          controls
          style={{
            maxWidth: "100%",
            maxHeight: "70vh",
            display: "block",
          }}
        />

        <Box
          ref={overlayRef}
          className="crop-overlay"
          sx={{
            position: "absolute",
            top: `${(cropArea.y / videoDimensions.height) * 100}%`,
            left: `${(cropArea.x / videoDimensions.width) * 100}%`,
            width: `${(cropArea.width / videoDimensions.width) * 100}%`,
            height: `${(cropArea.height / videoDimensions.height) * 100}%`,
          }}
        >
          <div className="crop-handle nw" data-handle="nw"></div>
          <div className="crop-handle ne" data-handle="ne"></div>
          <div className="crop-handle sw" data-handle="sw"></div>
          <div className="crop-handle se" data-handle="se"></div>
        </Box>
      </Box>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<UndoIcon />}
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          startIcon={<CropIcon />}
          onClick={handleCrop}
        >
          Crop Video
        </Button>
      </Stack>
    </Box>
  );
};

export default VideoCropper;
