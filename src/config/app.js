/**Usually created at server, but best practice is to create a separate
 * file for using express and run it on the server itself */
import express from "express";
import router from "../routes/router.js";
import Database from "./database.js";
import { responseWrapper } from "../middlewares/responseWrapper.js";
import configurePassport from "./passport.jwt.config.js";
import passport from "passport";
import requestLogger from "../middlewares/requestLogger.js";
import requestIdMiddleware from "../middlewares/requestId.js";
// import cors from "cors";

const app = express();
const db = new Database(); //create db instance
await db.initialize(); //initialize database connection by calling initialize method

app.set("trust proxy", 1);

//passport config
configurePassport(db);
app.use(passport.initialize());

//req id middleware
app.use(requestIdMiddleware);

//Body parsers - best practice to use in parsing json and forms into objects
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

//Misc server settings
app.set("json spaces", 2); //makes json readable but slightly larger response size
app.set("case sensitive routing", false); //makes routes not case-sensitive
app.set("strict routing", true); //Makes routes strict, does not allow trailing slashes
app.set("x-powered-by", false); //Remove header advertising usage of express for backend

// app.use(cors()); //TODO: Enhance CORS configuration for production use (restrict origins, methods, etc.)

// app.use(morgan("dev")) //TODO: Replace with a more robust logging solution for production (e.g., Winston, Bunyan) and configure log levels, formats, and transports
app.use(requestLogger);

//response wrapper middleware
app.use(responseWrapper);
//CSRF

//Routes
//db instance
app.use((req, res, next) => {
  req.db = db; //attached db connection to every request passing through, preventing multiple imports of db instance in every controller
  next();
});
app.use("/api", router);

//404 handler
app.use((req, res) => {
  res.sendError("Endpoint not found", `path: ${req.originalUrl} method: ${req.method}`, 404, "RESOURCE_NOT_FOUND");
});

//global error handler

export default app;
export { db };