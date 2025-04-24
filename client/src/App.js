import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  AppBar,
  Toolbar,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import VideoUploader from "./components/VideoUploader";
import VideoCropper from "./components/VideoCropper";
import ResultVideo from "./components/ResultVideo";

function App() {
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [croppedVideo, setCroppedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVideoUpload = (videoData) => {
    setUploadedVideo(videoData);
    setCroppedVideo(null);
  };

  const handleVideoCrop = (croppedData) => {
    setCroppedVideo(croppedData);
  };

  const handleReset = () => {
    setUploadedVideo(null);
    setCroppedVideo(null);
  };

  const handleCloseSnackbar = () => {
    setError(null);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            FFmpeg Video Cropping Tool
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" component="h1" gutterBottom>
              {!uploadedVideo
                ? "Upload Video"
                : !croppedVideo
                ? "Crop Video"
                : "Result"}
            </Typography>

            {!uploadedVideo ? (
              <VideoUploader
                onVideoUpload={handleVideoUpload}
                setLoading={setLoading}
                setError={setError}
              />
            ) : !croppedVideo ? (
              <VideoCropper
                videoData={uploadedVideo}
                onVideoCrop={handleVideoCrop}
                setLoading={setLoading}
                setError={setError}
              />
            ) : (
              <ResultVideo croppedVideo={croppedVideo} onReset={handleReset} />
            )}
          </Paper>

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress />
            </Box>
          )}
        </Box>
      </Container>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;
