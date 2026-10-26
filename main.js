const path = require("path");
const fs = require("fs");
const { EventEmitter } = require("events");
const os = require("os");
const zlib = require("zlib");
const { pipeline } = require("stream/promises");
const http = require("http");
const PORT = 3000;

function currentPath() {
  console.log({ File: __filename, Dir: __dirname });
  return __filename;
}
let Path = currentPath();

function fileName(Path) {
  console.log(path.basename(Path));
}
fileName(Path);

function buildPath(pathObj) {
  return path.format({
    dir: pathObj.dir,
    name: pathObj.name,
    ext: pathObj.ext,
  });
}
console.log(buildPath(path.parse(Path)));

function fileExt(Path) {
  return path.extname(Path);
}

console.log(fileExt(Path));

function parsePath(Path) {
  const parsed = path.parse(Path);
  return { Name: parsed.name, Ext: parsed.ext };
}
console.log(parsePath(Path));

function isAbsolute(Path) {
  return path.isAbsolute(Path);
}
console.log(isAbsolute(Path));

function joinSegments(segments) {
  return path.join(...segments);
}
console.log(joinSegments(["src", "components", "App.js"]));

function resolveToAbsolute(relativePath) {
  return path.resolve(relativePath);
}

function joinTwoPaths(path, path2) {
  return path.join(path, path2);
}

function deleteFileAsync(Path) {
  fs.unlink(Path, (err) => {
    if (err) return console.error(err);
    console.log(`The ${path.basename(Path)} is deleted.`);
  });
}

function createFolderSync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return "Success";
}

const Emitter = new EventEmitter();
Emitter.on("start", () => {
  console.log("Welcome event triggered!");
});

Emitter.on("login", (username) => {
  console.log(`User logged in: ${username}`);
});

Emitter.emit("login", "Ahmed");

function readFileSync(Path) {
  const content = fs.readFileSync(Path, "utf8");
  console.log(`the file content => “${content}”`);
}

function writeFileAsync(Path, content) {
  fs.writeFile(Path, content, "utf8", (err) => {
    if (err) console.error(err);
  });
}

function checkExists(targetPath) {
  return fs.existsSync(targetPath);
}

function getOSDetails() {
  return { Platform: os.platform(), Arch: os.arch() };
}

function readFileStream(Path) {
  const readStream = fs.createReadStream(Path, { encoding: "utf8" });
  readStream.on("data", (chunk) => {
    console.log("Chunk:", chunk);
  });
}

function copyFileStream(source, destination) {
  const readStream = fs.createReadStream(source);
  const writeStream = fs.createWriteStream(destination);
  readStream.pipe(writeStream);
  writeStream.on("finish", () => {
    console.log("File copied using streams");
  });
}

async function compressFilePipeline(source, destination) {
  try {
    await pipeline(
      fs.createReadStream(source),
      zlib.createGzip(),
      fs.createWriteStream(destination),
    );
    console.log("File compressed successfully");
  } catch (err) {
    console.error("ERROR", err);
  }
}

const usersPath = "./users.json";

const readUsers = () => {
  const data = fs.readFileSync(usersPath, "utf8");
  return JSON.parse(data || "[]");
};
const writeUsers = (users) => {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf8");
};
const sendResponse = (res, statusCode, data) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};
const server = http.createServer((req, res) => {
  const { method, url } = req;
  if (method === "POST" && url === "/users") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      let users = readUsers();
      let newUser = JSON.parse(body);
      if (users.some((user) => user.email === newUser.email)) {
        return sendResponse(res, 400, { message: "Email already exists" });
      }
      newUser.id = new Date().getMilliseconds();
      users.push(newUser);
      writeUsers(users);
      sendResponse(res, 201, newUser);
    });
    return;
  }
  if (method === "GET" && url === "/users") {
    sendResponse(res, 200, readUsers());
    return;
  }
  if (method === "DELETE" && url.startsWith("/users/")) {
    let id = Number(url.split("/")[2]);
    const users = readUsers();
    const user = users.find((user) => user.id == id);
    if (!user) {
      sendResponse(res, 404, { message: "User not found" });
      return;
    }
    const newUsers = users.filter((user) => user.id != id);
    writeUsers(newUsers);
    sendResponse(res, 200, { message: "User deleted " });
    return;
  }
  if (method === "PATCH" && url.startsWith("/users/")) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      let id = Number(url.split("/")[2]);
      let user = JSON.parse(body);
      let users = readUsers();
      let index = users.findIndex((u) => u.id === id);

      if (index === -1) {
        return sendResponse(res, 404, { message: "User not found" });
      }

      users[index] = { ...user };
      writeUsers(users);
      sendResponse(res, 200, users[index]);
    });
    return;
  }
  if (method === "GET" && url.startsWith("/user/")) {
    let id = Number(url.split("/")[2]);
    let users = readUsers();
    let user = users.find((user) => user.id == id);
    if (!user) {
      sendResponse(res, 404, { message: "User not found" });
      return;
    }
    sendResponse(res, 200, user);
    return;
  }
});

server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
