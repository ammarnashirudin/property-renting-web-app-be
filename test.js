const http = require("http");

http.createServer((req, res) => {
  res.end("SERVER HIDUP");
}).listen(5000, () => {
  console.log("RUNNING ON 5000");
});
