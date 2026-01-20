const ExternalFallback = ({ poster, title, url }) => {
  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-black">
      <img
        src={poster}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <p className="text-white text-lg font-semibold mb-3">Live Darshan</p>

        <p className="text-white/80 text-sm mb-6">
          This temple allows live darshan only on its official website
        </p>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-300 transition"
        >
          Open Official Website
        </a>
      </div>
    </div>
  );
};

export default ExternalFallback;
