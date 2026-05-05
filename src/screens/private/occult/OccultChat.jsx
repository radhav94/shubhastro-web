import { useState, useRef, useEffect } from "react";
import {
  Send,
  ArrowLeft,
  Sparkles,
  Hash,
  Heart,
  ShieldCheck,
  Moon,
  MessageCircle,
  WandSparkles,
  Clock3,
  ChevronRight,
} from "lucide-react";
import styles from "./OccultChat.module.scss";
import { get } from "../../../services/publicRequest";
import TTSButton from "../../../component/UI/TTSButton";

const SERVICES = [
  {
    id: "tarot",
    title: "Tarot Reading",
    Icon: Sparkles,
    description:
      "Gain clarity on love, career, and life decisions through intuitive tarot card readings.",
    tags: ["Love", "Career", "Guidance"],
    prompt: "What do I need to know about my current situation?",
  },
  {
    id: "numerology",
    title: "Numerology",
    Icon: Hash,
    description:
      "Discover the hidden meaning behind your birth numbers — life path, destiny & personality.",
    tags: ["Life Path", "Destiny", "Compatibility"],
    prompt: "What does my birth number reveal about my direction?",
  },
  {
    id: "reiki",
    title: "Reiki Healing",
    Icon: Heart,
    description:
      "Balance your chakras and promote well-being through universal energy healing sessions.",
    tags: ["Healing", "Chakra", "Wellness"],
    prompt: "Which energy block should I focus on healing first?",
  },
  {
    id: "protection",
    title: "Black Magic Removal / Protection",
    Icon: ShieldCheck,
    description:
      "Shield yourself from negative energies with powerful protection rituals and cleansing.",
    tags: ["Protection", "Cleansing", "Spiritual"],
    prompt: "How can I protect my energy from negativity?",
  },
];

const QUICK_PROMPTS = [
  "Give me clarity for today",
  "What should I be careful about?",
  "Suggest a simple remedy",
];

const tarotDeck = [
  { name: "The Fool", meaning: "New beginnings, innocence, adventure." },
  { name: "The Lovers", meaning: "Love, harmony, relationships." },
  { name: "The Tower", meaning: "Sudden change, chaos, awakening." },
  { name: "The Star", meaning: "Hope, faith, renewal." },
  { name: "The Moon", meaning: "Intuition, illusion, subconscious." },
  { name: "The Sun", meaning: "Joy, success, vitality." },
];

const RESPONSE_SECTIONS = [
  { key: "samajh", match: "samajh", fallbackTitle: "Samajh" },
  { key: "upaay", match: "upaay", fallbackTitle: "Upaay" },
  { key: "mantra", match: "mantra", fallbackTitle: "Mantra" },
  { key: "salah", match: "salah", fallbackTitle: "Salah" },
];

const renderInlineText = (text) =>
  text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }

      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }

      return part;
    });

const parseOccultResponse = (text) => {
  if (typeof text !== "string") return [];

  const sectionPattern = /\*\*([^*]+?(?:Samajh|Upaay|Mantra|Salah)[^*]*?):\*\*/gi;
  const matches = [...text.matchAll(sectionPattern)];

  if (!matches.length) return [];

  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    const rawTitle = match[1].trim();
    const content = text.slice(start, end).trim();
    const section = RESPONSE_SECTIONS.find((item) =>
      rawTitle.toLowerCase().includes(item.match)
    );

    return {
      key: section?.key || `section-${index}`,
      title: rawTitle || section?.fallbackTitle || "Guidance",
      content,
    };
  });
};

const parseRemedyItems = (content) => {
  const itemPattern = /(?:^|\s)(\d+)\.\s+\*\*([^*]+):\*\*\s*([\s\S]*?)(?=(?:\s+\d+\.\s+\*\*)|$)/g;
  const items = [...content.matchAll(itemPattern)];

  return items.map((item) => ({
    number: item[1],
    title: item[2].trim(),
    text: item[3].trim(),
  }));
};

const FormattedBotMessage = ({ text }) => {
  const sections = parseOccultResponse(text);

  if (!sections.length) {
    return (
      <div className={styles.simpleResponseCard}>
        <p>{renderInlineText(text)}</p>
      </div>
    );
  }

  return (
    <div className={styles.responseCard}>
      {sections.map((section) => {
        const remedyItems = section.key === "upaay" ? parseRemedyItems(section.content) : [];

        return (
          <section key={section.key} className={styles.responseSection}>
            <h3 className={styles.responseTitle}>{section.title}</h3>
            {remedyItems.length ? (
              <div className={styles.remedyList}>
                {remedyItems.map((item) => (
                  <div key={`${item.number}-${item.title}`} className={styles.remedyItem}>
                    <span className={styles.remedyNumber}>{item.number}</span>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{renderInlineText(item.text)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>{renderInlineText(section.content)}</p>
            )}
          </section>
        );
      })}
    </div>
  );
};

const OccultChat = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showTarot, setShowTarot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const isInitialOpen = useRef(false);

  useEffect(() => {
    if (isInitialOpen.current) {
      isInitialOpen.current = false;
      return;
    }
    // Scroll within the messages container only, not the page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, showTarot, isLoading]);

  const openService = (service) => {
    isInitialOpen.current = true;
    setSelectedService(service);
    setMessages([{ type: "bot", text: `Ask me anything about ${service.title}.` }]);
    setShowTarot(false);
    setInput("");
  };

  const goBack = () => {
    setSelectedService(null);
    setMessages([]);
    setShowTarot(false);
    setInput("");
  };

  const handleBotResponse = async (msg) => {
    const lower = msg.toLowerCase();

    // Tarot card picking flow (local, no API)
    if (selectedService?.id === "tarot" && lower.includes("tarot")) {
      setShowTarot(true);
      setMessages((prev) => [...prev, { type: "bot", text: "Pick a card (1–3)" }]);
      return;
    }

    if (["1", "2", "3"].includes(msg) && showTarot) {
      const card = tarotDeck[Math.floor(Math.random() * tarotDeck.length)];
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: `🃏 ${card.name}: ${card.meaning}` },
      ]);
      setShowTarot(false);
      return;
    }

    // Call the occult API
    setIsLoading(true);
    try {
      const query = `[${selectedService?.title || "Occult"}] ${msg}`;
      const res = await get(`ocult/ocultRemedi?text=${encodeURIComponent(query)}`);
      const reply = res?.data?.message || "✨ I'm interpreting your energy...";
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: typeof reply === "string" ? reply : JSON.stringify(reply) },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { type: "user", text: input }]);
    handleBotResponse(input);
    setInput("");
  };

  const sendTarotChoice = (num) => {
    setMessages((prev) => [...prev, { type: "user", text: num.toString() }]);
    handleBotResponse(num.toString());
  };

  const sendQuickPrompt = (prompt) => {
    if (isLoading) return;
    setMessages((prev) => [...prev, { type: "user", text: prompt }]);
    handleBotResponse(prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // ── Service List View (follows Lal Kitab layout) ──
  if (!selectedService) {
    return (
      <div className={styles.container}>
        <section className={styles.heroSection}>
          <div className={styles.heroAura} />
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>
              <Moon size={16} />
              Mystic guidance desk
            </span>
            <h1 className={styles.pageTitle}>Occult Services</h1>
            <p className={styles.pageSubtitle}>
              Choose a sacred path and begin a focused consultation for clarity,
              healing, protection, or intuitive direction.
            </p>
            <div className={styles.heroStats} aria-label="Occult service highlights">
              <span><strong>4</strong> Guided services</span>
              <span><strong>24/7</strong> Energy support</span>
              <span><strong>AI</strong> Assisted insights</span>
            </div>
          </div>
          <div className={styles.heroOrb} aria-hidden="true">
            <Sparkles size={46} />
          </div>
        </section>

        <div className={styles.featureGrid}>
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className={styles.featureCard}
              onClick={() => openService(service)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openService(service)}
              aria-label={`Open ${service.title}`}
              style={{ position: 'relative' }}
            >
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <TTSButton text={`${service.title}. ${service.description}`} />
              </span>
              <div className={styles.cardTop}>
                <span className={styles.featureIcon}><service.Icon size={28} /></span>
                <span className={styles.openHint}>
                  Start <ChevronRight size={16} />
                </span>
              </div>
              <h4>{service.title}</h4>
              <p>{service.description}</p>
              <div className={styles.cardFooter}>
                <div className={styles.tags}>
                  {service.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.infoSection} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
            <TTSButton text="What are Occult Services? Occult sciences encompass ancient mystical practices like tarot reading, numerology, reiki healing, and spiritual protection. These services help you gain clarity, heal energy imbalances, and shield yourself from negative influences through personalized consultations. Ask one clear question for a more focused reading." />
          </span>
          <div>
            <span className={styles.infoKicker}>Before you begin</span>
            <h3 className={styles.infoTitle}>What are Occult Services?</h3>
            <p className={styles.infoText}>
              Occult sciences encompass ancient mystical practices like tarot reading,
              numerology, reiki healing, and spiritual protection. These services help
              you gain clarity, heal energy imbalances, and shield yourself from
              negative influences through personalized consultations.
            </p>
          </div>
          <div className={styles.infoCard}>
            <WandSparkles size={22} />
            <span>Ask one clear question for a more focused reading.</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Chat View ──
  return (
    <div className={styles.container}>
      <div className={styles.chatWrap}>
        <div className={styles.chatHeader}>
          <button onClick={goBack} className={styles.backBtn} aria-label="Back to services">
            <ArrowLeft size={20} />
          </button>
          <span className={styles.chatHeaderIcon}><selectedService.Icon size={24} /></span>
          <div className={styles.chatHeaderInfo}>
            <span className={styles.chatHeaderMeta}>
              <Clock3 size={13} />
              Live guidance
            </span>
            <h2 className={styles.chatHeaderTitle}>{selectedService.title}</h2>
          </div>
        </div>

        <div className={styles.messages} ref={messagesContainerRef}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={msg.type === "bot" ? styles.botMsg : styles.userMsg}
            >
              {msg.type === "bot" ? (
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '0px', right: '0px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                    <TTSButton text={msg.text} />
                  </span>
                  <FormattedBotMessage text={msg.text} />
                </div>
              ) : msg.text}
            </div>
          ))}
          {showTarot && (
            <div className={styles.tarotCards}>
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => sendTarotChoice(num)}
                  className={styles.tarotCard}
                  aria-label={`Pick tarot card ${num}`}
                >
                  {num}
                </button>
              ))}
            </div>
          )}
          {isLoading && (
            <div className={styles.botMsg}>
              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.quickPrompts} aria-label="Suggested questions">
          <button type="button" onClick={() => sendQuickPrompt(selectedService.prompt)} disabled={isLoading}>
            <MessageCircle size={14} />
            {selectedService.prompt}
          </button>
          {QUICK_PROMPTS.map((prompt) => (
            <button type="button" key={prompt} onClick={() => sendQuickPrompt(prompt)} disabled={isLoading}>
              {prompt}
            </button>
          ))}
        </div>

        <div className={styles.inputBar}>
          <input
            ref={inputRef}
            className={styles.chatInput}
            placeholder={`Ask about ${selectedService.title.toLowerCase()}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Type your message"
          />
          <button onClick={sendMessage} className={styles.sendBtn} aria-label="Send message" disabled={isLoading}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OccultChat;
