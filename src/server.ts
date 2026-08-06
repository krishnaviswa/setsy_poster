import http from "http";
import fs from "fs";
import path from "path";
import { runGeneration } from "./generate-posters";

const PORT = 8787;
const PUBLIC_DIR = path.join(process.cwd(), "public");
const OUTPUT_DIR = path.join(process.cwd(), "output");

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(
  res: http.ServerResponse,
  status: number,
  body: unknown
): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function serveFile(
  res: http.ServerResponse,
  filePath: string,
  contentType: string
): void {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  const data = fs.readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": data.length,
  });
  res.end(data);
}

function safeOutputName(name: string): string | null {
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return null;
  if (name.includes("..")) return null;
  return name;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const method = req.method ?? "GET";

  try {
    if (method === "GET" && url.pathname === "/") {
      serveFile(res, path.join(PUBLIC_DIR, "index.html"), "text/html; charset=utf-8");
      return;
    }

    if (method === "GET" && url.pathname.startsWith("/output/")) {
      const name = safeOutputName(url.pathname.slice("/output/".length));
      if (!name) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Invalid filename");
        return;
      }
      serveFile(res, path.join(OUTPUT_DIR, name), "image/png");
      return;
    }

    if (method === "POST" && url.pathname === "/api/generate") {
      const raw = await readBody(req);
      let prompt = "";
      try {
        const parsed = JSON.parse(raw) as { prompt?: unknown };
        prompt = typeof parsed.prompt === "string" ? parsed.prompt.trim() : "";
      } catch {
        sendJson(res, 400, { error: "Invalid JSON body. Expected { prompt: string }." });
        return;
      }
      if (!prompt) {
        sendJson(res, 400, { error: "Prompt text is required." });
        return;
      }

      const result = await runGeneration(prompt);
      sendJson(res, 200, result);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    sendJson(res, 500, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`Poster UI running at http://localhost:${PORT}`);
  console.log("Paste a structured prompt and click Submit to generate.");
});
