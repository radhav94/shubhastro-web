import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";

export const agoraClient = AgoraRTC.createClient({
  mode: "rtc",
  codec: "vp8",
});

export const AgoraProvider = ({ children }) => {
  return (
    <AgoraRTCProvider client={agoraClient}>
      {children}
    </AgoraRTCProvider>
  );
};
