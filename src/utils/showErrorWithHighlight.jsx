import toast from "react-hot-toast";

export const showErrorWithHighlight = (message) => {
  // console.log("Testing::", message);

  if (!message) {
    toast.error("Something went wrong");
    return;
  }

  // Split message by quoted parts ('...')
  const parts = message.split(/('.*?')/g);

  toast.error(
    <span>
      {parts.map((part, index) => {
        // Check if part is inside single quotes
        if (part.startsWith("'") && part.endsWith("'")) {
          return <b key={index}>{part}</b>;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};