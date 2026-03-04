/**Usually created at server, but best practice is to create a separate
 * file for using express and run it on the server itself */
import express from "express";
import router from "../routes/router.js";
// import cors from "cors";

const app = express();

app.set("trust proxy", 1);

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

//response wrapper middleware

//CSRF

//Routes
//db instance
app.use("/api", router);

//404 handler

//global error handler

export default app;
