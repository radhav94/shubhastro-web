import VideoPlayer from "../videoplayer/VideoPlayer";
import { useParams } from "react-router-dom";
import { useGetSingleEPoojaQuery } from "../../../../../redux/api/astromall/epooja/epoojaApi";

const PlayScreen = () => {
  const { productSlug } = useParams();
  const { data } = useGetSingleEPoojaQuery(productSlug);

  const video = data?.data;

  if (!video) return null;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="aspect-video">
        <VideoPlayer
          videoUrl={video.video_url}
          poster={video.image}
          title={video.title}
        />
      </div>
    </div>
  );
};

export default PlayScreen;
