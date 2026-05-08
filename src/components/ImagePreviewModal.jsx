import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/**
 * Image Preview Modal Component
 * Features: Zoom, Rotate, Download, Navigation for multiple images
 * Used for viewing scanned prescriptions and medical files
 */
const ImagePreviewModal = ({
  isOpen,
  onClose,
  imageUrl,
  images = [],
  currentIndex = 0,
  onNavigate,
  title = "Image Preview",
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const displayUrl = imageUrl || (images.length > 0 ? images[currentIndex]?.fileUrl : null);
  const totalImages = images.length || 1;
  const canNavigate = totalImages > 1;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(displayUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const handleMouseDown = (e) => {
    if (zoom > 100) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 100) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNavigate = (direction) => {
    if (canNavigate && onNavigate) {
      const newIndex =
        direction === "next"
          ? (currentIndex + 1) % totalImages
          : (currentIndex - 1 + totalImages) % totalImages;
      onNavigate(newIndex);
      handleReset(); // Reset zoom/rotation when changing image
    }
  };

  return (
    <AnimatePresence>
      {isOpen && displayUrl && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="pointer-events-auto w-full max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                  {canNavigate && (
                    <p className="text-blue-100 text-sm mt-1">
                      {currentIndex + 1} / {totalImages}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Image Viewer */}
              <div className="flex-1 flex items-center justify-center bg-gray-50 overflow-hidden relative">
                <motion.div
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px)`,
                    cursor: isDragging ? "grabbing" : zoom > 100 ? "grab" : "default",
                  }}
                  className="flex items-center justify-center"
                >
                  <img
                    src={displayUrl}
                    alt="Preview"
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      objectFit: "contain",
                    }}
                    className="max-w-full max-h-full transition-transform"
                  />
                </motion.div>

                {/* Navigation Buttons */}
                {canNavigate && (
                  <>
                    <button
                      onClick={() => handleNavigate("prev")}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleNavigate("next")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Toolbar */}
              <div className="bg-gray-100 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Zoom: {zoom}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    className="p-2 rounded-lg bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    className="p-2 rounded-lg bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={handleRotate}
                    className="p-2 rounded-lg bg-white hover:bg-gray-200 transition-colors"
                    title="Rotate"
                  >
                    <RotateCw className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 rounded-lg bg-white hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700"
                    title="Reset View"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ImagePreviewModal;
