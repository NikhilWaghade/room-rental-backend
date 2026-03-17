import fs from "fs";
import path from "path";
import morgan from "morgan";

const logStream = fs.createWriteStream(
    path.join("logs", "server.log"),
    { flags: "a" }
);

export const logger = morgan("combined", {
    stream: logStream
});