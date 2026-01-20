import { useRef, useState } from "react";

export const useFileSelector = () => {
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  const [selecting, setSelecting] = useState(false);

  const openFileSelector = (accept = "*") =>
    new Promise((resolve, reject) => {
      setSelecting(true);

      if (!inputRef.current) {
        inputRef.current = document.createElement("input");
        inputRef.current.type = "file";
      }

      inputRef.current.accept = accept;
      inputRef.current.value = "";

      inputRef.current.onchange = (e) => {
        setSelecting(false);

        const file = e.target.files && e.target.files[0];
        if (!file) {
          reject("No file selected");
          return;
        }

        fileRef.current = file;

        resolve({
          blob: file,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      };

      inputRef.current.click();
    });

  const clearFile = () => {
    fileRef.current = null;
    setSelecting(false);
  };

  return {
    selecting,
    openFileSelector,
    clearFile,
  };
};
