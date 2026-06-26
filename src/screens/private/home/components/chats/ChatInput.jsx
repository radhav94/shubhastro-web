import styles from "./ChatWindow.module.scss";
import toast from "../../../../../component/toast";
import { useState, useRef, useEffect, useCallback } from "react";
import ProfileManager from "../../../../../component/UI/Profile/ProfileManager";
import { useChat } from "../../../../../context/ChatContext";
import { useVoiceRecorder } from "../../../talkToAstrologer/voiceChat/useVoiceRecorder";
import VoiceRecorderPopup from "../../../talkToAstrologer/voiceChat/VoiceRecorderPopup";
import { useFileSelector } from "./filePicker/useFileSelector";

const ChatInput = ({
  value,
  onChange,
  onSend,
  isMessageDisabled = false,
  onChatEnd,
  sendVoiceMessage,
  sendFiles,
}) => {
  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPreview, setCameraPreview] = useState(null); // { url, blob }
  const [isSending, setIsSending] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = back, 'user' = front
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const inputBoxRef = useRef(null);

  const { openFileSelector } = useFileSelector();
  const { recording, paused, seconds, startRecording, stopRecording, pauseRecording, resumeRecording } = useVoiceRecorder();

  // Handle mobile keyboard viewport resize (iOS/Android)
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      // On iOS when keyboard opens, scroll the input into view
      if (inputBoxRef.current) {
        // Use a small delay to let the browser finish layout
        requestAnimationFrame(() => {
          inputBoxRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
        });
      }
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  // Auto-resize textarea helper
  const resizeTextarea = useCallback((el) => {
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
    const maxHeight = lineHeight * 4;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  }, []);

  const handlePauseResume = () => {
    if (paused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  // Start camera stream when cameraOpen becomes true
  useEffect(() => {
    if (!cameraOpen) return;

    let active = true;

    const startStream = async () => {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        // Check if device has multiple cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      } catch (err) {
        console.error("Camera error:", err);
        if (active) {
          toast.error("Camera access denied");
          setCameraOpen(false);
        }
      }
    };

    startStream();

    return () => {
      active = false;
    };
  }, [cameraOpen, facingMode]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCameraClose = () => {
    stopStream();
    setCameraOpen(false);
  };

  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      stopStream();
      setCameraOpen(false);
      setCameraPreview({ url, blob });
    }, "image/jpeg", 0.92);
  };

  const handleCameraPreviewSend = async () => {
    if (!cameraPreview || isSending) return;
    setIsSending(true);
    try {
      const file = new File([cameraPreview.blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
      await sendFiles(file, { name: file.name, type: file.type, size: file.size });
      URL.revokeObjectURL(cameraPreview.url);
      setCameraPreview(null);
    } finally {
      setIsSending(false);
    }
  };

  const handleCameraRetake = () => {
    URL.revokeObjectURL(cameraPreview?.url);
    setCameraPreview(null);
    setCameraOpen(true);
  };

  const handleAttachClick = () => setAttachMenuOpen(true);

  const handleAttachOption = async (type) => {
    setAttachMenuOpen(false);
    if (type === "kundali") { setKundliModalOpen(true); return; }
    if (type === "camera") { setCameraOpen(true); return; }
    try {
      const accept = type === "photo" ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx";
      const { blob, name, size } = await openFileSelector(accept);
      await sendFiles(blob, { name, type: blob.type, size });
    } catch {
      console.log("File selection cancelled");
    }
  };

  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);
    if (!kundli?._id) return toast.error("Kundli not selected properly");
    onSend(kundli);
  };

  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  const handleMicClick = async () => {
    try {
      if (navigator.permissions) {
        const status = await navigator.permissions.query({ name: 'microphone' });
        if (status.state === 'denied') {
          setMicPermissionDenied(true);
          return;
        }
      }
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        stream.getTracks().forEach(t => t.stop());
      });
      await startRecording();
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionDenied(true);
      } else {
        toast.error("Could not access microphone. Please check your device settings.");
      }
    }
  };

  const handleStopRecording = async () => {
    try {
      const { blob, duration } = await stopRecording();
      await sendVoiceMessage(blob, duration);
    } catch (err) {
      console.error("[VoiceRecorder] Stop failed:", err);
    }
  };

  const handleDeleteRecording = async () => {
    try {
      await stopRecording();
    } catch {}
    // discard — don't send
  };

  return (
    <>
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className={styles.inputBox} ref={inputBoxRef}>
        <div className={styles.inputWrapper}>
          {recording ? (
            <VoiceRecorderPopup
              seconds={seconds}
              paused={paused}
              onStop={handleStopRecording}
              onDelete={handleDeleteRecording}
              onPause={handlePauseResume}
              onResume={handlePauseResume}
            />
          ) : (
            <>
            <textarea
              ref={inputRef}
              className={styles.inputField}
              value={value}
              onChange={(e) => {
                onChange(e);
                resizeTextarea(e.target);
              }}
              onFocus={() => {
                // Scroll input into view on focus (helps on iOS/Android)
                setTimeout(() => {
                  inputBoxRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
                }, 300);
              }}
              disabled={isMessageDisabled}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                  // Reset height after send
                  setTimeout(() => {
                    if (inputRef.current) {
                      inputRef.current.style.height = 'auto';
                      inputRef.current.focus();
                    }
                  }, 0);
                }
              }}
              placeholder="Type a message..."
              rows={1}
            />
          <div className={styles.inputIcons}>
            <button type="button" className={styles.iconButton} onClick={handleAttachClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 16 20" fill="none">
                <path d="M9.17 0H2C0.9 0 0 0.9 0 2V18C0 19.1 0.9 20 2 20H14C15.1 20 16 19.1 16 18V6.83C16 6.3 15.79 5.79 15.41 5.42L10.58 0.59C10.21 0.21 9.7 0 9.17 0ZM12 13C12 15.34 9.99 17.21 7.61 16.98C5.53 16.78 4 14.92 4 12.83V7.64C4 6.33 4.94 5.14 6.24 5.01C7.74 4.86 9 6.03 9 7.5V12C9 12.55 8.55 13 8 13C7.45 13 7 12.55 7 12V7.5C7 7.22 6.78 7 6.5 7C6.22 7 6 7.22 6 7.5V12.89C6 13.89 6.68 14.81 7.66 14.97C8.92 15.18 10 14.21 10 13V10C10 9.45 10.45 9 11 9C11.55 9 12 9.45 12 10V13ZM10 5V2L14 6H11C10.45 6 10 5.55 10 5Z" fill="url(#paint0_linear_8989_193)"/>
                <defs>
                  <linearGradient id="paint0_linear_8989_193" x1="0" y1="10" x2="16" y2="10" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F75801"/><stop offset="1" stopColor="#D43400"/>
                  </linearGradient>
                </defs>
              </svg>
            </button>

            <button className={styles.iconButton} onClick={handleMicClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5V11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11V5Z" fill="url(#mic_grad1)"/>
                <path d="M7 11C7 10.4477 6.55228 10 6 10C5.44772 10 5 10.4477 5 11C5 14.5265 7.60771 17.4439 11 17.9291V20H9C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22H15C15.5523 22 16 21.5523 16 21C16 20.4477 15.5523 20 15 20H13V17.9291C16.3923 17.4439 19 14.5265 19 11C19 10.4477 18.5523 10 18 10C17.4477 10 17 10.4477 17 11C17 13.7614 14.7614 16 12 16C9.23858 16 7 13.7614 7 11Z" fill="url(#mic_grad2)"/>
                <defs>
                  <linearGradient id="mic_grad1" x1="5" y1="12" x2="19" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F75801"/><stop offset="1" stopColor="#D43400"/>
                  </linearGradient>
                  <linearGradient id="mic_grad2" x1="5" y1="12" x2="19" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F75801"/><stop offset="1" stopColor="#D43400"/>
                  </linearGradient>
                </defs>
              </svg>
            </button>

            <button className={styles.sendButton} onClick={() => { onSend(); setTimeout(() => inputRef.current?.focus(), 0); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="17" viewBox="0 0 20 17" fill="none">
                <path d="M1.4 16.8849L18.85 9.40488C19.66 9.05488 19.66 7.91488 18.85 7.56488L1.4 0.0848801C0.74 -0.20512 0.00999999 0.28488 0.00999999 0.99488L0 5.60488C0 6.10488 0.37 6.53488 0.87 6.59488L15 8.48488L0.87 10.3649C0.37 10.4349 0 10.8649 0 11.3649L0.00999999 15.9749C0.00999999 16.6849 0.74 17.1749 1.4 16.8849Z" fill="#FEFEFE"/>
              </svg>
            </button>
          </div>
          </>
          )}
        </div>
      </div>

      {/* Attach File Modal */}
      {attachMenuOpen && (
        <div className={styles.attachOverlay} onClick={() => setAttachMenuOpen(false)}>
          <div className={styles.attachSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.attachHeader}>
              <div>
                <h3 className={styles.attachTitle}>Attach File</h3>
                <p className={styles.attachSubtitle}>Please attach the file you would like to include.</p>
              </div>
              <button className={styles.attachClose} onClick={() => setAttachMenuOpen(false)}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="10" stroke="#F75801" strokeWidth="1.5"/>
                  <path d="M7.5 7.5L14.5 14.5M14.5 7.5L7.5 14.5" stroke="#F75801" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className={styles.attachOptions}>
              {[
                { key: "camera", label: "Camera", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/></svg> },
                { key: "photo", label: "Photo", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="white"/><path d="M21 15L16 10L5 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                { key: "document", label: "Document", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="8" y1="13" x2="16" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="17" x2="16" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg> },
                { key: "kundali", label: "Kundali", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><text x="3" y="19" fontSize="18" fill="white" fontFamily="serif">卐</text></svg> },
              ].map(({ key, label, icon }) => (
                <button key={key} className={styles.attachOption} onClick={() => handleAttachOption(key)}>
                  <div className={styles.attachIconCircle}>{icon}</div>
                  <span className={styles.attachOptionLabel}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Camera View */}
      {cameraOpen && (
        <div className={styles.cameraPreviewOverlay}>
          <div className={styles.cameraPreviewContainer}>
            <video
              ref={videoRef}
              className={styles.cameraPreviewImg}
              autoPlay
              playsInline
              muted
            />
            {/* Close button - top right */}
            <button className={styles.cameraCloseBtn} onClick={handleCameraClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            {/* Switch camera button - only show if multiple cameras available */}
            {hasMultipleCameras && (
              <button className={styles.cameraSwitchBtn} onClick={handleSwitchCamera}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 7L16 3L12 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3V15C16 16.1046 15.1046 17 14 17H4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 17L8 21L12 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 21V9C8 7.89543 8.89543 7 10 7H20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            <div className={styles.cameraPreviewActions}>
              {/* Shutter button */}
              <button className={styles.cameraShutterBtn} onClick={handleCapture}>
                <span className={styles.cameraShutterInner} />
              </button>
              <div style={{ width: 100 }} />
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview after capture */}
      {cameraPreview && (
        <div className={styles.cameraPreviewOverlay}>
          <div className={styles.cameraPreviewContainer}>
            <img src={cameraPreview.url} alt="Preview" className={styles.cameraPreviewImg} />
            <div className={styles.cameraPreviewActions}>
              <button className={styles.cameraRetakeBtn} onClick={handleCameraRetake}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.51 15C4.96 18.57 8.35 21 12.27 21C17.1 21 21 17.1 21 12.27C21 7.44 17.1 3.54 12.27 3.54C9.18 3.54 6.46 5.07 4.8 7.42L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Retake
              </button>
              <button className={styles.cameraSendBtn} onClick={handleCameraPreviewSend} disabled={isSending}>
                {isSending ? (
                  <span className={styles.sendingDots}><span /><span /><span /></span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfileManager
        isOpen={kundliModalOpen}
        onClose={() => setKundliModalOpen(false)}
        startCallMode={true}
        callModeBtnTitle="Continue"
        onStartCall={handleChatAfterKundliSelect}
        title="Select Profile"
      />

      {/* Mic Permission Denied Modal */}
      {micPermissionDenied && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setMicPermissionDenied(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 340, width: '90%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎙️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>Microphone Access Required</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
              To send voice messages, please allow microphone access in your browser settings.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => setMicPermissionDenied(false)}
                style={{ background: 'linear-gradient(90deg,#f75801,#d43400)', color: '#fff', border: 'none', borderRadius: 24, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                OK, Got it
              </button>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
                Click the 🔒 lock icon in your browser's address bar → find <strong>Microphone</strong> → set to <strong>Allow</strong> → refresh the page
              </p>
              <button
                onClick={() => setMicPermissionDenied(false)}
                style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 24, padding: '8px 20px', fontSize: 14, color: '#6b7280', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default ChatInput;
