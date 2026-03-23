import { useState, useRef, useCallback, useEffect } from "react";
import {
  useGetChatHistoryQuery,
  useSendVirtualAssistantMessageMutation,
} from "../../redux/api/chatApi";
import { useGetS3SignedUrlMutation } from "../../redux/api/s3SignedApi";
import toast from "../toast";

export default function useVirtualAssistant({ astrologerId }) {
  const [optimisticMsgs, setOptimisticMsgs] = useState([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const {
    data: historyData,
    isLoading,
    isFetching,
    refetch,
  } = useGetChatHistoryQuery(
    { userId: astrologerId },
    { skip: !astrologerId, refetchOnMountOrArgChange: true }
  );

  const [sendMsgApi] = useSendVirtualAssistantMessageMutation();
  const [getS3SignedUrl] = useGetS3SignedUrlMutation();

  const history = historyData?.data || [];

  // Merge history + optimistic messages
  const messages = [...history, ...optimisticMsgs].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const sendText = useCallback(
    async (text) => {
      if (!text.trim() || sending) return;
      setSending(true);

      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        _id: tempId,
        sender: "user",
        type: "message",
        message: text,
        createdAt: new Date().toISOString(),
        _optimistic: true,
      };
      setOptimisticMsgs((prev) => [...prev, optimistic]);
      scrollToBottom();

      try {
        await sendMsgApi({
          astrologerId,
          type: "message",
          sender: "user",
          message: text,
        }).unwrap();
        // Remove optimistic msg after refetch brings the real one
        setOptimisticMsgs((prev) => prev.filter((m) => m._id !== tempId));
        refetch();
      } catch (err) {
        // Mark as failed
        setOptimisticMsgs((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, _failed: true } : m))
        );
        toast.error("Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [astrologerId, sending, sendMsgApi, refetch, scrollToBottom]
  );

  const sendImage = useCallback(
    async (file) => {
      if (!file || sending) return;
      setSending(true);

      const tempId = `temp-img-${Date.now()}`;
      const localUrl = URL.createObjectURL(file);
      const optimistic = {
        _id: tempId,
        sender: "user",
        type: "image",
        message: localUrl,
        createdAt: new Date().toISOString(),
        _optimistic: true,
      };
      setOptimisticMsgs((prev) => [...prev, optimistic]);
      scrollToBottom();

      try {
        const signed = await getS3SignedUrl({ fileType: file.type }).unwrap();
        const uploadUrl = signed.uploadUrl;
        const imageUrl = uploadUrl.split("?")[0];

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        await sendMsgApi({
          astrologerId,
          type: "image",
          sender: "user",
          message: imageUrl,
        }).unwrap();

        URL.revokeObjectURL(localUrl);
        setOptimisticMsgs((prev) => prev.filter((m) => m._id !== tempId));
        refetch();
      } catch (err) {
        setOptimisticMsgs((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, _failed: true } : m))
        );
        toast.error("Failed to send image");
      } finally {
        setSending(false);
      }
    },
    [astrologerId, sending, sendMsgApi, getS3SignedUrl, refetch, scrollToBottom]
  );

  const retryMessage = useCallback(
    (msg) => {
      setOptimisticMsgs((prev) => prev.filter((m) => m._id !== msg._id));
      if (msg.type === "image") {
        // Can't retry image from blob URL, just remove
        toast.info("Please re-attach the image");
      } else {
        sendText(msg.message);
      }
    },
    [sendText]
  );

  return {
    messages,
    isLoading,
    isFetching,
    sending,
    sendText,
    sendImage,
    retryMessage,
    messagesEndRef,
  };
}
