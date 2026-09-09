import { useState, useRef, useCallback, useEffect } from "react";
import {
  useGetChatHistoryQuery,
  useSendVirtualAssistantMessageMutation,
} from "../../redux/api/chatApi";
import { useGetS3SignedUrlMutation } from "../../redux/api/s3SignedApi";
import toast from "../toast";

/*
  Backoff for the "did the assistant answer?" watch below. Three attempts over
  ~13s, and only when the reply is not already in the payload that closes the
  send - so a backend that answers inside the POST costs zero extra requests.
*/
const REPLY_POLL_DELAYS_MS = [3000, 4000, 6000];

export default function useVirtualAssistant({ astrologerId, isOpen }) {
  const [optimisticMsgs, setOptimisticMsgs] = useState([]);
  const [sending, setSending] = useState(false);
  // There is no socket subscription and no polling anywhere in this app for
  // assistant replies (verified: zero `pollingInterval` in src, no "assistant"
  // handler in src/socket). The reply could only ever appear in the single
  // refetch() fired the instant the POST resolves - so if the server writes it
  // asynchronously, that one read races it and the answer never surfaces for
  // the rest of the session. The visitor is then left staring at their own
  // bubble with nothing on screen to indicate anything is pending, which is
  // the only thing in this message list that can absorb four minutes of rage
  // clicks (Clarity session x27oi1, 10:21-10:25, "message-related elements").
  //
  // NOTE: whether the backend is synchronous here is NOT verified from this
  // repo - it needs a live request to settle. The watch is written so it is a
  // no-op in the synchronous case.
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [replyStalled, setReplyStalled] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);
  const replyBaselineRef = useRef(0);
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
  const assistantUsage = historyData?.assistantUsage || null;

  // Count of everything the visitor did NOT write. Only server-confirmed
  // history counts, never optimistic entries, so this can only grow when a
  // real reply lands.
  const assistantCount = history.reduce(
    (n, m) => (m.sender === "user" ? n : n + 1),
    0
  );
  const assistantCountRef = useRef(assistantCount);
  useEffect(() => {
    assistantCountRef.current = assistantCount;
  }, [assistantCount]);

  const beginReplyWatch = useCallback(() => {
    // Baseline is read from the ref, i.e. the last committed history, which is
    // still the pre-send count at the moment a send finishes.
    replyBaselineRef.current = assistantCountRef.current;
    setPollAttempt(0);
    setReplyStalled(false);
    setAwaitingReply(true);
  }, []);

  const stopReplyWatch = useCallback(() => {
    setAwaitingReply(false);
    setReplyStalled(false);
    setPollAttempt(0);
  }, []);

  // Merge history + optimistic messages, dropping any stand-in the server copy
  // has already superseded. The senders now hold the stand-in until the refetch
  // lands (so the message never leaves the screen), which means there is a
  // window where both could be in the list; without this the visitor would see
  // their message twice. Failed stand-ins are always kept - there is no server
  // copy of those.
  const supersededKeys = new Set(
    history.map((m) => `${m.sender}|${m.type}|${m.message}`)
  );
  const messages = [
    ...history,
    ...optimisticMsgs.filter(
      (m) => m._failed || !supersededKeys.has(`${m.sender}|${m.type}|${m.message}`)
    ),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Scroll to bottom when chat window opens
  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen, scrollToBottom]);

  // Bounded reply watch. Re-entered on every assistantCount / pollAttempt
  // change; `pollAttempt` is what advances the backoff, so a refetch that
  // brings nothing new still moves the sequence forward.
  useEffect(() => {
    if (!awaitingReply || !isOpen) return undefined;
    if (assistantCount > replyBaselineRef.current) {
      // Answer arrived - including the common case where the refetch that
      // closes the send already contained it, so nothing is ever requested.
      setAwaitingReply(false);
      return undefined;
    }
    if (pollAttempt >= REPLY_POLL_DELAYS_MS.length) {
      // Give up quietly and hand the visitor an explicit control instead of
      // leaving them to tap their own message bubble.
      setAwaitingReply(false);
      setReplyStalled(true);
      return undefined;
    }
    const timer = setTimeout(() => {
      refetch();
      setPollAttempt((n) => n + 1);
    }, REPLY_POLL_DELAYS_MS[pollAttempt]);
    return () => clearTimeout(timer);
  }, [awaitingReply, isOpen, assistantCount, pollAttempt, refetch]);

  const checkForReply = useCallback(() => {
    setPollAttempt(0);
    setReplyStalled(false);
    setAwaitingReply(true);
    refetch();
  }, [refetch]);

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
        beginReplyWatch();
        // Hold the optimistic stand-in until the refetch that replaces it has
        // actually landed. Dropping it first (the old order) took the message
        // OFF SCREEN for the whole duration of the read - the visitor watched
        // the thing they had just sent disappear from the thread, which is
        // exactly the kind of thing that gets a message bubble tapped again.
        // `await refetch()` resolves on settle and does not throw for a failed
        // query, so the stand-in is always cleared.
        await refetch();
        setOptimisticMsgs((prev) => prev.filter((m) => m._id !== tempId));
      } catch (err) {
        // Mark as failed
        setOptimisticMsgs((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, _failed: true } : m))
        );
        stopReplyWatch();
        toast.error("Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [astrologerId, sending, sendMsgApi, refetch, scrollToBottom, beginReplyWatch, stopReplyWatch]
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

        beginReplyWatch();
        // Same ordering fix as sendText. The revoke also has to come last: the
        // optimistic bubble is still rendering `localUrl`, so revoking before
        // the server copy is on screen blanked the visitor's own photo.
        await refetch();
        setOptimisticMsgs((prev) => prev.filter((m) => m._id !== tempId));
        URL.revokeObjectURL(localUrl);
      } catch (err) {
        setOptimisticMsgs((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, _failed: true } : m))
        );
        stopReplyWatch();
        toast.error("Failed to send image");
      } finally {
        setSending(false);
      }
    },
    [astrologerId, sending, sendMsgApi, getS3SignedUrl, refetch, scrollToBottom, beginReplyWatch, stopReplyWatch]
  );

  const sendFile = useCallback(
    async (file) => {
      if (!file || sending) return;
      setSending(true);

      const tempId = `temp-file-${Date.now()}`;
      const fileName = file.name || "Attachment";
      const optimistic = {
        _id: tempId,
        sender: "user",
        type: "attachment",
        message: fileName,
        createdAt: new Date().toISOString(),
        _optimistic: true,
      };
      setOptimisticMsgs((prev) => [...prev, optimistic]);
      scrollToBottom();

      try {
        const signed = await getS3SignedUrl({ fileType: file.type }).unwrap();
        const uploadUrl = signed.uploadUrl;
        const fileUrl = uploadUrl.split("?")[0];

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        await sendMsgApi({
          astrologerId,
          type: "attachment",
          sender: "user",
          message: JSON.stringify({ url: fileUrl, fileName }),
        }).unwrap();

        beginReplyWatch();
        // Keep the stand-in until the replacement is on screen (see sendText).
        await refetch();
        setOptimisticMsgs((prev) => prev.filter((m) => m._id !== tempId));
      } catch (err) {
        setOptimisticMsgs((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, _failed: true } : m))
        );
        stopReplyWatch();
        toast.error("Failed to send file");
      } finally {
        setSending(false);
      }
    },
    [astrologerId, sending, sendMsgApi, getS3SignedUrl, refetch, scrollToBottom, beginReplyWatch, stopReplyWatch]
  );

  const sendKundli = useCallback(
    async (kundliId, kundliName) => {
      if (!kundliId || sending) return;
      setSending(true);

      // Send the bare kundliId as the message (origin-independent); the kundliId
      // also travels as its own field. Renderers rebuild the link from origin.
      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        _id: tempId,
        sender: "user",
        type: "kundli",
        message: kundliId,
        kundliName: kundliName || "Kundli",
        kundliId,
        createdAt: new Date().toISOString(),
        _optimistic: true,
      };
      setOptimisticMsgs((prev) => [...prev, optimistic]);
      scrollToBottom();

      try {
        await sendMsgApi({
          astrologerId,
          type: "kundli",
          sender: "user",
          message: kundliId,
          kundliId,
          kundliName: kundliName || "Kundli",
        }).unwrap();
        beginReplyWatch();
        // Keep the stand-in until the replacement is on screen (see sendText).
        await refetch();
        setOptimisticMsgs((prev) => prev.filter((m) => m._id !== tempId));
      } catch {
        setOptimisticMsgs((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, _failed: true } : m))
        );
        stopReplyWatch();
        toast.error("Failed to send Kundli");
      } finally {
        setSending(false);
      }
    },
    [astrologerId, sending, sendMsgApi, refetch, scrollToBottom, beginReplyWatch, stopReplyWatch]
  );

  /*
    Returns null when the retry was accepted, or a short reason string the
    caller should show INLINE next to the bubble that was tapped. It must not
    toast: this panel is a portalled sheet pinned to the bottom of a mobile
    screen while the toaster is top-right, so the old toast.info() was invisible
    to the visitor and invisible to session replay.

    "Retry" must also never destroy the message it is retrying. The old body
    dropped the bubble FIRST and only then decided what to do with it, which
    lost the visitor's content three separate ways:

      1. sendText() opens with `if (!text.trim() || sending) return;`. Tap Retry
         while another send is still in flight and the bubble was already gone,
         so nothing was sent, nothing was shown, and the text was unrecoverable.
      2. Only `image` was special-cased, so everything else went to
         sendText(msg.message) as plain chat text. A failed `attachment` carries
         JSON.stringify({ url, fileName }) as its message and a failed `kundli`
         carries a bare 24-char object id - Retry re-posted raw JSON, or a naked
         id, into the thread.
      3. Retrying an image removed the bubble and answered with a toast, so from
         the visitor's side the picture simply vanished when they asked for it
         to be sent again.

    Clarity session x27oi1 rage-clicked "message-related elements" for four
    minutes; this button, sitting inside a failed bubble, is one of the very few
    clickable things in that list.
  */
  const retryMessage = useCallback(
    (msg) => {
      if (sending) {
        return "Still sending your last message. Try again in a moment.";
      }

      if (msg.type === "image" || msg.type === "attachment") {
        // The optimistic record only holds a blob: URL (image) or a bare
        // filename (attachment). Neither can be re-uploaded from here, so keep
        // the bubble on screen - it is the visitor's only reference to what
        // failed - and say what to do instead of silently deleting it.
        return msg.type === "image"
          ? "Couldn't send that image. Please attach it again."
          : "Couldn't send that file. Please attach it again.";
      }

      if (msg.type === "kundli") {
        setOptimisticMsgs((prev) => prev.filter((m) => m._id !== msg._id));
        sendKundli(msg.kundliId || msg.message, msg.kundliName);
        return null;
      }

      const body = typeof msg.message === "string" ? msg.message : "";
      if (!body.trim()) {
        // sendText() would bail on its own guard, so removing the bubble here
        // would delete it and send nothing.
        return "This message can't be resent. Please type it again.";
      }

      setOptimisticMsgs((prev) => prev.filter((m) => m._id !== msg._id));
      sendText(body);
      return null;
    },
    [sending, sendText, sendKundli]
  );

  return {
    messages,
    isLoading,
    isFetching,
    sending,
    sendText,
    sendImage,
    sendFile,
    sendKundli,
    retryMessage,
    messagesEndRef,
    assistantUsage,
    awaitingReply,
    replyStalled,
    checkForReply,
  };
}
