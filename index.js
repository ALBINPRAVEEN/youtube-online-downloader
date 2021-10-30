const fs = require("fs");
const http = require("http");
const urlPkg = require("url");
const ytdl = require("youtube-dl");
const port = process.env.PORT || 8008

http.createServer(runServer).listen(port);
console.log("[i] darlin is on port " + port);

async function runServer(req, res) {
    var url = urlPkg.parse(req.url, true);
    if (url.pathname == "/") {
        fs.readFile("./index.html", function (err, resp) { 
            if (!err) {
                res.writeHead(200, {
                    "Access-Control-Allow-Origin" : "*",
                    "Content-Type": "text/html"
                });
                res.end(resp);
            }
        })
    } else if (url.pathname.substring(0,4) !== "/api") {
        fs.readFile("./web-content" + url.pathname, function (err, resp) {
            if (!err) {
                var ft = url.pathname.split(".")[url.pathname.split.length];
                if (ft == "html") {
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "text/html"
                    });
                } else if (ft == "css") {
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "text/css"
                    })
                } else if (ft == "js") {
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "application/javascript"
                    })
                } else {
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin" : "*"
                    })
                }
                res.end(resp);
            } else {
                if (err.code == "ENOENT") {
                    fs.readFile("./error-pages/not-found.html", function (err, resp) {
                        res.writeHead(404, {
                            "Access-Control-Allow-Origin" : "*",
                            "Content-Type": "text/html"
                        });
                        res.end(resp)
                    })
                } else if (err.code == "EISDIR") {
                    if (fs.existsSync("./web-content" + url.pathname + "index.html")) {
                        fs.readFile("./web-content" + url.pathname + "index.html", function (err, resp) {
                            if (!err) {
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin" : "*",
                                    "Content-Type": "text/html"
                                });
                                res.end(resp);
                            } else {
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin" : "*",
                                    "Content-Type": "text/plain"
                                });
                                res.end(err.code);
                            }
                        })
                    } else if (fs.existsSync("./web-content" + url.pathname + "/index.html")) {
                        fs.readFile("./web-content" + url.pathname + "/index.html", function (err, resp) {
                            if (!err) {
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin" : "*",
                                    "Content-Type": "text/html"
                                });
                                res.end(resp);
                            } else {
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin" : "*",
                                    "Content-Type": "text/plain"
                                });
                                res.end(err.code);
                            }
                        })
                    } else {
                        fs.readFile("./error-pages/not-found.html", function (err, resp) {
                            res.writeHead(404, {
                                "Access-Control-Allow-Origin" : "*",
                                "Content-Type": "text/html"
                            });
                            res.end(resp)
                        })
                    }
                }
            }
        })
    } else {
        if (url.pathname.substring(0,4) == "/api") {
            var path = [];
            for (var c in url.pathname.split("/api")[1].split("/")) {
                path.push(url.pathname.split("/api")[1].split("/")[c]);
            }
            var path = path.slice(1)
            if (path[0] == "" && !path[1]) {
                var data = JSON.stringify({
                    "version": "1.0.0"
                })
                res.writeHead(200, {
                    "Access-Control-Allow-Origin" : "*",
                    "Content-Type": "application/json"
                });
                res.end(data);
            } else if (path[0] == "getInfo") {
                var a = ytdl.getInfo(url.query.url, [], function(err, info) {
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    });
                    res.end(JSON.stringify(info));
                });
            } else if (path[0] == "download") {
                if (url.query.url) {
                    if (!fs.existsSync("./files/")) {fs.mkdirSync("./files/")}
                    if (url.query.format) {var a = ytdl(url.query.url, ["--format=" + url.query.format]);} else {var a = ytdl(url.query.url);}
                    a.on('info', function(info) {
                        var fn = info._filename;
                        var b = a.pipe(fs.createWriteStream("./files/" + fn));
                        b.on("close", function () {
                            var d = {
                                "location": btoa(fn),
                                "success": true
                            }
                            res.writeHead(200, {
                                "Access-Control-Allow-Origin" : "*",
                                "Content-Type": "application/json"
                            });
                            res.end(JSON.stringify(d));
                            setTimeout(function () {
                                if (fs.existsSync("./files/" + url.query.id + "-" + url.query.itag + ".mp4")) {
                                    fs.unlinkSync("./files/" + url.query.id + "-" + url.query.itag + ".mp4");
                                }
                            }, 1800000)
                        })
                    });
                } else {
                    var data = {
                        "err": "missingInfo",
                        "success": false
                    };
                    res.writeHead(400, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "application/json"
                    });
                    res.end(data);
                }
            } else if (path[0] == "files") {
                if (fs.existsSync("./files/")) {
                    if (fs.existsSync("./files/" + atob(url.pathname.split("/files/")[1]))) {
                        var path = "./files/" + atob(url.pathname.split("/files/")[1]);
                        var fileName = atob(url.pathname.split("/files/")[1]);
                        var fn = fileName.split("-")[fileName.split("-").length - 1];
                        var readStream = fs.createReadStream(path);
                        var fileSize = fs.statSync(path)["size"];
                        res.writeHead(200, {
                            "Access-Control-Allow-Origin":"*",
                            "Content-Type": "application/octet-stream",
                            "Content-Length": fileSize,
                            "Content-Disposition": 'attachment; filename="' + fn + '"'
                        })
                        readStream.pipe(res);
                    } else {
                        fs.readFile("./error-pages/not-found.html", function (err, resp) {
                            res.writeHead(404, {
                                "Access-Control-Allow-Origin" : "*",
                                "Content-Type": "text/html"
                            });
                            res.end(resp)
                        })
                    }
                } else {
                    fs.readFile("./error-pages/not-found.html", function (err, resp) {
                        res.writeHead(404, {
                            "Access-Control-Allow-Origin" : "*",
                            "Content-Type": "text/html"
                        });
                        res.end(resp)
                    })
                }
            } else if (path[0] == "extractors") {
                ytdl.getExtractors(true, function (err, list) {
                    if (list) {
                        var list = JSON.stringify(list);
                        res.writeHead(200, {
                            "Access-Control-Allow-Origin" : "*",
                            "Content-Type": "application/json"
                        });
                        res.end(list);
                    } else {
                        var err = JSON.stringify({
                            "err": err.message
                        });
                        res.writeHead(500, {
                            "Access-Control-Allow-Origin" : "*",
                            "Content-Type": "application/json"
                        });
                        res.end(err);
                    }
                })
            } else {
                var data = JSON.stringify({
                    "version": "1.0.0",
                    "err": "couldNotFindEndpoint"
                })
                res.writeHead(400, {
                    "Access-Control-Allow-Origin" : "*",
                    "Content-Type": "application/json"
                });
                res.end(data);
            }
        }
    }
}

function atob(a) {
    return Buffer.from(a, 'base64').toString('utf-8');
}

function btoa(a) {
    return Buffer.from(a, "utf-8").toString("base64");
}
