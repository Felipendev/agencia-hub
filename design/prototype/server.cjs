// Servidor local somente leitura. Sem dependências e sem endpoints de produção.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = __dirname;
const files = {
  "/": "index.html",
  "/index.html": "index.html",
  "/style.css": "style.css",
  "/app.js": "app.js",
  "/export.js": "export.js",
};
http
  .createServer((req, res) => {
    if (req.method === "POST" && req.url === "/export") {
      if (req.headers.origin !== "http://localhost:4176") {
        res.writeHead(403);
        res.end("Origem inválida");
        return;
      }
      let body = "",
        tooLarge = false;
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > 16000000) {
          tooLarge = true;
          req.destroy();
        }
      });
      req.on("end", () => {
        if (tooLarge) return;
        try {
          const data = JSON.parse(body);
          if (
            data.version !== 1 ||
            !Array.isArray(data.screens) ||
            data.screens.length > 100
          )
            throw Error("Formato inválido");
          fs.writeFileSync(path.resolve(root, "../screens.figma.json"), body);
          res.end("Salvo");
        } catch {
          res.writeHead(400);
          res.end("JSON inválido");
        }
      });
      return;
    }
    const file = files[new URL(req.url, "http://localhost").pathname];
    if (!file) {
      res.writeHead(404);
      res.end("Não encontrado");
      return;
    }
    const ext = path.extname(file);
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
      }[ext],
    );
    res.end(fs.readFileSync(path.join(root, file)));
  })
  .listen(4176, "127.0.0.1", () =>
    console.log("Protótipo: http://localhost:4176"),
  );
