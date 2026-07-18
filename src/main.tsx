
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";

import App from "./app/App.tsx";
import { AppDataProvider } from "./context/AppDataContext.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <HashRouter>
    <AppDataProvider>
      <App />
    </AppDataProvider>
  </HashRouter>,
);
