function download() {
    document.getElementById("dl").classList.remove("invalid");
    document.getElementById("ldr").style.display = "";
    document.getElementById("downloadSnack").style.display = "none";
    var xhr = new XMLHttpRequest();
    document.getElementById("status").innerHTML = "Getting media information...";
    document.getElementById("statDeet").innerHTML = "This may take a minute.";
    xhr.open("GET", "/api/getInfo?url=" + document.getElementById("dl").value);
    xhr.send();
    xhr.onload = function () {
        document.getElementById("ldr").style.display = "none";
        document.getElementById("formatSelect").style.display = "";
        var json = JSON.parse(xhr.responseText);
        for (var c in json.formats) {
            var btn = document.createElement("BUTTON");
            btn.innerHTML = json.formats[c].format;
            btn.value = json.formats[c].format_id;
            btn.onclick = function () { getFormat(document.getElementById("dl").value, this.value) }
            document.getElementById("formatButtonList").appendChild(btn);
        }
        document.getElementById("thumbnail").src = json.thumbnail;
    }
}

function getFormat(url, format) {
    document.getElementById("status").innerHTML = "Downloading to our servers...";
    document.getElementById("statDeet").innerHTML = "This may take long. Sit tight.";
    document.getElementById("ldr").style.display = "";
    document.getElementById("formatSelect").style.display = "none";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/download?url=" + url + "&format=" + format);
    xhr.send();
    xhr.onload = function () {
        document.getElementById("complete").style.display = "";
        document.getElementById("downloadLink").href = "/api/files/" + JSON.parse(xhr.responseText).location;
        document.getElementById("ldr").style.display = "none";
    }
}
