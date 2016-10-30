(function resizePage() {
    var ua = window.navigator['userAgent'].toLowerCase(),
        isAndroid = /Android|HTC/i.test(ua),
        isIOS = !isAndroid && /iPod|iPad|iPhone/i.test(ua),
        isMobile = isAndroid || isIOS,
        touchstart = isMobile ? "touchstart" : "mousedown",
        touchmove = isMobile ? "touchmove" : "mousemove",
        touchend = isMobile ? "touchend" : "mouseup";
    window.onresize = r;
    var winW, cutPhoto;
    var hasInit = false;


    function r(resizeNum) {
        var winW = window.innerWidth;
        if (!isMobile) {
            $("body").addClass("pc");
            document.getElementsByTagName("html")[0].style.fontSize = "100px";
        } else {
            document.getElementsByTagName("html")[0].style.fontSize = winW * 0.15625 + "px";
        }


        if (winW > window.screen.width && resizeNum <= 10) {
            setTimeout(function() {
                r(++resizeNum);
            }, 100);
        } else {
            if (!hasInit) {
                hasInit = true;

                sw = Number($(".canvas-wrap").css("width").replace("px", ""));
                sh = Number($(".canvas-wrap").css("height").replace("px", ""));
                $(".canvas-wrap canvas").css({ "width": sw, "height": sh });
                $("body").css("opacity", 1);
                showLoading($("#uploading"));
                cutPhoto = CutPhoto({
                    sw: sw,
                    sh: sh,
                    bgColor: "#030",
                    layerColor: "",
                    layerAlpha: "",
                    borderColor: "",
                    imgUrl: "",
                    resultSize: 300,
                    getImgUrl: function(url) {
                        downloadFile("cut" + new Date().getTime() + ".png", url);
                    },
                    uploadDone: function() {
                        $("#uploading").hide();
                    }
                });

            }
        }
    }
    setTimeout(function() { r(0) }, 100);

    (function bind() {
        $("ul").on("click", "[name=cut]", function() {
            cutPhoto.cut();
        }).on("click", "[name=rotate]", function() {
            cutPhoto.rotate();
        }).on("click", "[name=bigger]", function() {
            cutPhoto.bigger();
        }).on("click", "[name=smaller]", function() {
            cutPhoto.smaller();
        }).on("click", "[name=reset]", function() {
            cutPhoto.cutReset();
        });
        $("input[type=file]").on("change", function() {
            showLoading($("#uploading"));
            cutPhoto.change(this.files[0]);
            $(this).val("");
        });
    })();

    function base64Img2Blob(code) {
        var parts = code.split(';base64,');
        var contentType = parts[0].split(':')[1];
        var raw = window.atob(parts[1]);
        var rawLength = raw.length;

        var uInt8Array = new Uint8Array(rawLength);

        for (var i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }

        return new Blob([uInt8Array], { type: contentType });
    }

    function showLoading($element, num) {
        var num = num?num:8,
        angle = 360 / num,
            i = 0;
        var html = "<div class='load'>";
        for (; i < num; i++) {
            html += "<div class='load-dot' style='transform: rotate(" + angle * i + "deg) translateX(50px)'></div>";
        }
        html += "</div>";
        $element.html(html).show();
    }

    function downloadFile(fileName, content) {

        var aLink = document.createElement('a');
        var blob = base64Img2Blob(content); //new Blob([content]);

        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("click", false, false); //initEvent 不加后两个参数在FF下会报错
        aLink.download = fileName;
        aLink.href = URL.createObjectURL(blob);

        aLink.dispatchEvent(evt);
    }
})();
