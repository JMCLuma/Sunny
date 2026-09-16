import { useCallback, useEffect, useState } from "react";

/**
 * Light/dark preference, shared by the public site header and the Operations
 * module so both toggle the same `dark` class on `<html>` and read the same
 * stored preference. Extracted from the site header so a second copy of this
 * logic is not needed anywhere it is used.
 */
const STORAGE_KEY = "theme";

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) === "dark";
    setIsDark(stored);
    applyTheme(stored);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((previous) => {
      const next = !previous;
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  return { isDark, toggleTheme };
}
