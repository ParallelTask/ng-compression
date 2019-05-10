var webpackFiles = document.getElementById('webpackFiles').value;

function when(arr, cb) {
    var total = arr.length;
    var response = [];
    arr.forEach(x => {
        var xhr = x.xhr;
        xhr.addEventListener('load', function () {
            if (xhr.status === 200 && xhr.readyState === 4) {
                response.push({
                    file: x.file,
                    ptr: xhr.response
                });
                total--;
                if (total === 0) {
                    cb(response);
                }
            }
        });
        xhr.send();
    });
}
function ajaxLoad(file, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', file, true);
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener('load', function () {
        if (xhr.status === 200 && xhr.readyState === 4) {
            cb(pako.inflate(xhr.response, { to: 'string' }));
        }
    });
    xhr.send();
}
function loadJS(data) {
    var ele = document.createElement('script');
    ele.type = 'application/javascript';
    ele.innerHTML = data;
    document.body.appendChild(ele);
}
function loadCSS(data) {
    var ele = document.createElement('style');
    ele.type = 'text/css';
    ele.appendChild(document.createTextNode(data));
    document.getElementsByTagName('head')[0].appendChild(ele);
}

var files = webpackFiles.split(';');
var chunkedFiles = [];
var unchunkedFiles = [];

// filter chunked and unchunked files
files.forEach(x => {
    var file = x.split('/').pop();
    if (file.split('.').slice(-3, -2)[0] === 'chunk') {
        var name = file.split('.')[0];
        var chunkedFile = chunkedFiles.find(x => x.name === name);
        if (chunkedFile !== undefined) {
            chunkedFile.files.push(x);
        } else {
            chunkedFiles.push({
                files: [x],
                name: name
            });
        }
    }
    else unchunkedFiles.push(x);
});

// load unchunked files
unchunkedFiles.forEach(x => {
    if (x.split('.').pop() === 'css') ajaxLoad(x, loadCSS);
    else if (x.split('.').pop() === 'js') ajaxLoad(x, loadJS);
});

// load chunked files
chunkedFiles.forEach(x => {
    var xhrs = x.files.map(s => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', s, true);
        xhr.responseType = 'arraybuffer';
        return {
            xhr: xhr,
            file: s
        };
    });
    when(xhrs, (data) => {
        data = data.map(d => {
            var uinitarr = new Uint8Array(d.ptr);
            return {
                data: uinitarr,
                size: uinitarr.length,
                file: d.file
            };
        });
        var totalBytes = data.map(d => d.size).reduce((a, b) => a + b, 0);

        data = data.sort((a, b) => {
            var i = a.file.split('/').pop().split('.').slice(-4, -3)[0];
            var j = b.file.split('/').pop().split('.').slice(-4, -3)[0];
            return i - j;
        });
        var c = new Uint8Array(totalBytes + 1);
        var k = 0;
        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].size; j++) {
                c[k] = data[i].data[j];
                k++;
            }
            k--;
        }
        loadJS(pako.inflate(c, { to: 'string' }));
    });
});