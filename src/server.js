import "dotenv/config";

import app from "./config/app.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  const server = app.listen(PORT, () => {
    console.log("-".repeat(30));
    console.log("Server Started Sucessfully!");
    console.log("-".repeat(30));
    console.log(`Server live at: http://localhost:${PORT}`);
    console.log("-".repeat(30));
  });

  process.once("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(() => {
      console.log("HTTP server closed.");
      db.close();
      process.exit(0);
    });
  });

  process.once("SIGINT", () => {
    console.log("SIGINT received. Shutting down gracefully...");
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  });
}

startServer().catch((error) => {
  console.error("Failed to start server. ", error.message);
  process.exit(1);
});
