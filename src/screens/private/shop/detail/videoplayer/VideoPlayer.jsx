import ExternalFallback from "../fallback/ExternalFallback";
import { getVideoEmbedConfig } from "../playscreen/utils";

const VideoPlayer = ({ videoUrl, poster, title }) => {
  const config = getVideoEmbedConfig(videoUrl);

  if (!config || config.type === "unsupported") {
    return <UnsupportedVideo />;
  }

  if (config.type === "youtube") {
    return (
      <iframe
        src={config.src}
        title={title}
        allow={config.allow}
        allowFullScreen
        className="w-full h-full rounded-xl"
      />
    );
  }

  if (config.type === "video") {
    return (
      <video
        src={config.src}
        poster={poster}
        controls
        autoPlay
        muted
        playsInline
        className="w-full h-full rounded-xl bg-black"
      />
    );
  }

  if (config.type === "iframe") {
    return (
      <iframe
        src={config.src}
        title={title}
        className="w-full h-full rounded-xl"
        allow="autoplay; fullscreen"
      />
    );
  }

  // BLOCKED → graceful fallback
  return <ExternalFallback poster={poster} title={title} url={config.src} />;
};

export default VideoPlayer;
