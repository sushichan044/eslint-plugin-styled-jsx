import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";

import { App } from "./index";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary
      fallbackRender={(props) => (
        <div>
          <h2>Something went wrong.</h2>
          <pre>{String(props.error)}</pre>
        </div>
      )}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
