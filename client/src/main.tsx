import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Fix for mobile viewport height in mobile browsers
function setVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setVh);
setVh();

createRoot(document.getElementById("root")!).render(<App />);
