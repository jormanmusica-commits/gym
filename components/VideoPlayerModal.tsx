import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    let videoId: string | null = null;

    if (urlObj.hostname.includes('youtube.com')) {
      if (urlObj.pathname.includes('/shorts/')) {
        const pathParts = urlObj.pathname.split('/');
        videoId = pathParts[pathParts.indexOf('shorts') + 1];
      } else {
        videoId = urlObj.searchParams.get('v');
      }
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1).split('/')[0];
    }
    
    if (videoId) {
      const cleanVideoId = videoId.split('?')[0];
      return `https://www.youtube.com/embed/${cleanVideoId}?autoplay=1`;
    }

  } catch (e) { /* Silently fail for invalid URLs */ }
  return null;
};

const isHost = (url: string, host: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes(host);
  } catch (e) {
    return false;
  }
};

type VideoInfo = {
  type: 'youtube' | 'other' | null;
  embedUrl?: string | null;
  originalUrl?: string;
  modalClass: string;
  aspectRatioClass?: string;
};

const BASE_MODAL_CLASS = "bg-gray-900 rounded-lg shadow-xl w-full m-4 relative transform transition-all animate-scaleIn";

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, onClose, videoUrl }) => {
  const [videoInfo, setVideoInfo] = useState<VideoInfo>({ type: null, modalClass: `${BASE_MODAL_CLASS} max-w-4xl` });
  
  useEffect(() => {
    if (!isOpen || !videoUrl) {
      setVideoInfo({ type: null, modalClass: `${BASE_MODAL_CLASS} max-w-4xl` });
      return;
    }

    // For TikTok and Instagram, open in a new tab as embeds are problematic and often force-open the native app.
    if (isHost(videoUrl, 'tiktok.com') || isHost(videoUrl, 'instagram.com')) {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
      onClose(); // Close the (now empty) modal immediately
      return;
    }

    let info: VideoInfo = { 
        type: 'other', 
        originalUrl: videoUrl, 
        embedUrl: videoUrl, 
        modalClass: `${BASE_MODAL_CLASS} max-w-4xl`,
        aspectRatioClass: 'aspect-video'
    };

    const youtubeUrl = getYouTubeEmbedUrl(videoUrl);
    if (youtubeUrl) {
      let modalClass = `${BASE_MODAL_CLASS} max-w-4xl`;
      let aspectRatioClass = 'aspect-video';
      if (videoUrl.includes('/shorts/')) {
          modalClass = `${BASE_MODAL_CLASS} max-w-sm`;
          aspectRatioClass = 'aspect-[9/16]';
      }
      info = { type: 'youtube', embedUrl: youtubeUrl, modalClass, aspectRatioClass };
    }
    
    setVideoInfo(info);
  }, [isOpen, videoUrl, onClose]);


  if (!isOpen) return null;

  // For IG/TikTok, onClose is called, so we'll have already returned.
  // For other URLs, we might render for a frame before useEffect sets the type.
  // This prevents rendering an empty modal shell.
  if (!videoInfo.type) return null;

  const renderContent = () => {
    switch (videoInfo.type) {
      case 'youtube':
        return videoInfo.embedUrl ? (
          <div className={`w-full ${videoInfo.aspectRatioClass || 'aspect-video'}`}>
            <iframe
              src={videoInfo.embedUrl}
              className="w-full h-full rounded-lg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title="Reproductor de video de YouTube"
            ></iframe>
          </div>
        ) : null;
      case 'other':
      default:
        return (
          <div className="w-full aspect-video flex items-center justify-center p-4 text-center">
            <p className="text-white">No se puede reproducir este video. El formato o el enlace no son compatibles.</p>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-player-title"
    >
      <div
        className={videoInfo.modalClass}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="video-player-title" className="sr-only">Reproductor de video</h3>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 z-10 transition-transform duration-200 ease-in-out hover:scale-110"
          aria-label="Cerrar reproductor de video"
        >
          <X className="w-6 h-6" />
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default VideoPlayerModal;