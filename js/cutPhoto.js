/**
 * [CutPhoto 图片处理]
 * 支持电脑端和移动端
 * 支持裁剪、旋转、缩放、压缩图片
 * @author ziweiZhang email:zhangziweiwz@qq.com
 * @date 2016.10.30
 * @param {[object]} params [可传参数]
 * {
 *     sw:300,                  //裁剪区宽度
 *     sh:380,                  //裁剪区高度
 *     bgColor: "#000",         //背景颜色
 *     layerColor: "#000",      //蒙层颜色
 *     layerAlpha:0.5,          //蒙层透明度
 *     borderColor: "#fff",     //边框颜色
 *     imgUrl: "",              //原图的url
 *     resultSize: 300,         //裁剪后的尺寸
 *     getImgUrl:function,      //获取裁剪后的图片url(base64编码)
 *     uploadDone:function      //图片加载完执行的方法
 * }
 *
 * @return {[object]} 返回的对象
 * {
 *     setPhotoUrl:function,    //设置照片的url
 *     cut:function,            //裁剪
 *     rotate:function,         //顺时针旋转图片90度
 *     bigger:function,         //放大图片
 *     smaller:function,        //缩小图片
 *     cutReset:function,       //重置图片到最初始状态
 *     change:function          //设置原图文件(一般通过input[type=file]选择)
 * }
 */

var CutPhoto = function(params) {
    var ua = window.navigator['userAgent'].toLowerCase(),
        isAndroid = /Android|HTC/i.test(ua),
        isIOS = !isAndroid && /iPod|iPad|iPhone/i.test(ua),
        isMobile = isAndroid || isIOS,
        touchstart = isMobile ? "touchstart" : "mousedown",
        touchmove = isMobile ? "touchmove" : "mousemove",
        touchend = isMobile ? "touchend" : "mouseup";
    var params = params;
    var isMove = false,
        _canvas = {
            temp: document.createElement("canvas"),
            draw: document.createElement("canvas")
        },
        cvsDraw = _canvas.draw.getContext("2d"),
        cvsTemp = _canvas.temp.getContext("2d"),
        canvas1 = document.getElementById("canvas"),
        canvas2 = document.createElement("canvas"),
        c1 = canvas1.getContext("2d"),
        c2 = canvas2.getContext("2d"),
        photoUrl = "",
        photo = new Image(),
        cutShowW,
        cutShowH,
        cutX,
        cutY,
        sh = params.sh,
        sw = params.sw,
        photosObject = [],
        oldP = [{
            x: 0,
            y: 0
        }, {
            x: 0,
            y: 0
        }],
        newP = [{
            x: 0,
            y: 0
        }, {
            x: 0,
            y: 0
        }];

    var requestAnimFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };

    function getEventPosition(ev) {
        var x, y;
        x = isMobile ? ev.touches[0].clientX : ev.x;
        y = isMobile ? ev.touches[0].clientY : ev.y;
        if (isMobile && ev.touches.length > 1) {
            return [{
                x: ev.touches[0].clientX,
                y: ev.touches[0].clientY
            }, {
                x: ev.touches[1].clientX,
                y: ev.touches[1].clientY
            }]
        }
        return [{ x: x, y: y }];
    }

    //获取两点之间的间距
    function _getDistance(p1, p2) {
        var x = p2.x - p1.x;
        var y = p2.y - p1.y;
        return Math.sqrt((x * x) + (y * y));
    }

    (function initPage() {
        cutShowW = sw;
        cutShowH = sw;
        cutX = 0;
        cutY = (sh - sw) / 2;

        canvas1.width = sw;
        canvas1.height = sh;
        c1.globalCompositeOperation = "destination-over";
        setPhotoUrl(params.imgUrl || "images/IMG_1220.JPG");
    })();

    function setPhotoUrl(_url) {
        photoUrl = _url;
        canvas1.addEventListener(touchstart, cutDown);
        loadCutPhoto();
    }

    function drawCutPage() {
        c1.clearRect(0, 0, sw, sh);
        cvsDraw.clearRect(0, 0, sw, sh);
        cvsTemp.clearRect(0, 0, sw, sh);
        //前景图片
        cvsDraw.save();
        cvsDraw.fillStyle = "#f00";
        cvsDraw.fillRect(cutX, cutY, cutShowW, cutShowH);
        // cvsDraw.arc(cutX+cutShowW/2,cutY+cutShowH/2,cutShowW/2,0,2*Math.PI);
        // cvsDraw.fill();
        cvsDraw.restore();

        cvsTemp.save();
        cvsTemp.drawImage(_canvas.draw, 0, 0);
        cvsTemp.globalCompositeOperation = "source-in";

        photosObject.cut.draw(cvsTemp);
        cvsTemp.restore();
        c1.save();
        //边框
        c1.lineWidth = 2;
        c1.strokeStyle = params.borderColor || "#fff";
        c1.strokeRect(cutX + 1, cutY + 1, cutShowW - 2, cutShowH - 2);
        //     c1.arc(cutX+cutShowW/2,cutY+cutShowH/2,cutShowW/2,0,2*Math.PI);
        //     c1.stroke();
        c1.restore();

        //裁剪区域的照片
        c1.drawImage(_canvas.temp, 0, 0);
        //蒙层
        c1.save();
        c1.fillStyle = params.layerColor || "#000";
        c1.globalAlpha = params.layerAlpha || 0.5;
        c1.fillRect(0, 0, sw, sh);
        c1.restore();

        //完整的照片
        photosObject.cut.draw(c1);

        //背景颜色 
        c1.save();
        c1.fillStyle = params.bgColor || "#000";
        c1.fillRect(0, 0, sw, sh);
        c1.restore();
    }

    function loadCutPhoto() {
        _canvas.temp.width = canvas1.width;
        _canvas.temp.height = canvas1.height;
        _canvas.draw.width = canvas1.width;
        _canvas.draw.height = canvas1.height;
        photo.src = photoUrl;
        photo.onload = function() {
            dealPhoto(photo);
        };
    }

    function dealPhoto(photo) {
        photo.crossOrigin = "anonymous";
        EXIF.getData(photo, function() {
            //0°~1 顺时针90°~6 逆时针90°~8 180°~3  
            var a = EXIF.getTag(this, "Orientation");
            if (a == undefined) {
                a = 1;
            }
            if (a == 1) {
                _angle = 0;
            } else if (a == 6) {
                _angle = 90;
            } else if (a == 8) {
                _angle = 270;
            } else if (a == 3) {
                _angle = 180;
            }

            var p = new Photo();
            p.img = photo;
            p.width = photo.width;
            p.height = photo.height;
            p.scaleX = cutShowW / p.width;
            p.scaleY = cutShowH / p.height;

            p._angle = _angle;
            p.angle = _angle;
            if (p.scaleX > p.scaleY) {
                p._scale = p.scaleX;
                p.scale = p._scale;
            } else {
                p._scale = p.scaleY;
                p.scale = p._scale;
            }
            if (p.width > p.height) {
                p.x = cutX - (p.width - p.height) / 2 * p.scale;
                p.y = cutY - (p.height * p.scale - cutShowH) / 2;
            } else {
                p.x = cutX - (p.width * p.scale - cutShowW) / 2;
                p.y = cutY - (p.height - p.width) / 2 * p.scale;
            }

            photosObject["cut"] = p;
            drawCutPage();
            if (typeof params.uploadDone === "function") {
                params.uploadDone();
            }
        });
    }

    function cut() {
        var w, h, wLh = (photosObject.cut.width < photosObject.cut.height),
            cx, cy;
        w = h = params.resultSize || 500;
        var _photo = new Photo(),
            _scale = w / canvas1.width;
        for (var s in photosObject.cut) {
            _photo[s] = photosObject.cut[s];
        }

        _photo.scale *= _scale;
        _photo.x -= cutX;
        _photo.x *= _scale;
        _photo.y -= cutY;
        _photo.y *= _scale;
        c2.clearRect(0, 0, canvas2.width, canvas2.height);
        canvas2.width = w;
        canvas2.height = h;
        _photo.draw(c2);
        _photo = null;
        var imgStr = canvas2.toDataURL();
        if (typeof params.getImgUrl === "function") {
            params.getImgUrl(imgStr);
        }
    }

    function cutMove(e) {
        e.preventDefault();
        var points = getEventPosition(e),
            p = points[0],
            _photo = photosObject.cut;
        p.x = p.x;
        p.y = p.y;
        newP[0].x = p.x;
        newP[0].y = p.y;
        if (points[1] != undefined) {
            newP[1].x = points[1].x;
            newP[1].y = points[1].y;
        }


        if (isMove) {
            if (p.x < $("canvas").offset().left || p.x > -(-$("canvas").offset().left - $("canvas").offset().width) ||
                p.y < $("canvas").offset().top || p.y > -(-$("canvas").offset().top - $("canvas").offset().height)) {}
            if (points[1] != undefined) {
                //缩放
                var oldDist = _getDistance(oldP[0], oldP[1]),
                    newDist = _getDistance(newP[0], newP[1]),
                    _scale = newDist / oldDist;
                var centerP = { x: _photo.x + _photo.width * _photo.scale / 2 + (newP[1].x + newP[0].x) / 2 - (oldP[1].x + oldP[0].x) / 2, y: _photo.y + _photo.height * _photo.scale / 2 + (newP[1].y + newP[0].y) / 2 - (oldP[1].y + oldP[0].y) / 2 },
                    newScale = _photo.scale * _scale,
                    newW = _photo.width * newScale,
                    newH = _photo.height * newScale,
                    newX = centerP.x - newW / 2,
                    newY = centerP.y - newH / 2;

                _photo.x = newX;
                _photo.y = newY;
                _photo.scale = newScale;
            } else {
                var x = newP[0].x - oldP[0].x,
                    y = newP[0].y - oldP[0].y,
                    mX, mY;
                var moveX, moveY;
                moveX = _photo.x + x;
                moveY = _photo.y + y;
                _photo.x = moveX;
                _photo.y = moveY;
            }
            drawCutPage();
            oldP[0].x = newP[0].x;
            oldP[0].y = newP[0].y;
            if (newP[1] != undefined) {
                oldP[1].x = newP[1].x;
                oldP[1].y = newP[1].y;
            }
        }
    }

    function cutUp(e) {
        if (!isMove) {
            return;
        }
        isMove = false;
        oldP = [{ x: 0, y: 0 }, { x: 0, y: 0 }],
            newP = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
        checkPhoto();
    }

    function set() {
        var _photo = photosObject.cut,
            _scale = 1,
            _width = _photo.width * _photo.scale,
            _height = _photo.height * _photo.scale,
            _center = {
                x: _photo.x + _width / 2,
                y: _photo.y + _height / 2
            },

            _x = 0,
            _y = 0,
            reX = 0,
            reY = 0;
        if (_photo.width > _photo.height) {
            if (_height >= cutShowH) {
                //大小正常

            } else {
                _scale = cutShowH / (_height);
            }
        } else {
            if (_width >= cutShowW) {

            } else {
                _scale = cutShowW / (_width);
            }
        }

        if (_photo.angle % 180 == 0) {
            _x = _photo.x;
            _y = _photo.y;
            if (_x > cutX) {
                reX = cutX - _x;
            } else if (_x + _width * _scale < cutX + cutShowW) {
                reX = cutX + cutShowW - _width * _scale - _x;
            }
            if (_y > cutY) {
                reY = cutY - _y;
            } else if (_y + _height * _scale <= cutY + cutShowH) {
                reY = cutY + cutShowH - _height * _scale - _y;
            }
        } else {
            _x = _center.x - _height / 2;
            _y = _center.y - _width / 2;
            if (_x > cutX) {
                reX = cutX - _x;
            } else if (_x + _height * _scale < cutX + cutShowW) {
                reX = cutX + cutShowW - _height * _scale - _x;
            }
            if (_y > cutY) {
                reY = cutY - _y;
            } else if (_y + _width * _scale <= cutY + cutShowH) {
                reY = cutY + cutShowH - _width * _scale - _y;
            }
        }

        var ReScale = _photo.scale * (_scale - 1);
        photosObject.cut.x += reX;
        photosObject.cut.y += reY;
        photosObject.cut.scale += ReScale;
        drawCutPage();
    }

    function checkPhoto() {
        var _photo = photosObject.cut,
            _scale = 1,
            _width = _photo.width * _photo.scale,
            _height = _photo.height * _photo.scale,
            _center = {
                x: _photo.x + _width / 2,
                y: _photo.y + _height / 2
            },
            _x = 0,
            _y = 0,
            reX = 0,
            reY = 0;

        if (_photo.width > _photo.height) {
            if (_height >= cutShowH) {
                //大小正常

            } else {
                _scale = cutShowH / (_height);
            }
        } else {
            if (_width >= cutShowW) {

            } else {
                _scale = cutShowW / (_width);
            }
        }

        if (_photo.angle % 180 == 0) {
            _x = _photo.x;
            _y = _photo.y;
            if (_x > cutX) {
                reX = cutX - _x;
            } else if (_x + _width * _scale < cutX + cutShowW) {
                reX = cutX + cutShowW - _width * _scale - _x;
            }
            if (_y > cutY) {
                reY = cutY - _y;
            } else if (_y + _height * _scale <= cutY + cutShowH) {
                reY = cutY + cutShowH - _height * _scale - _y;
            }
        } else {
            _x = _center.x - _height / 2;
            _y = _center.y - _width / 2;
            if (_x > cutX) {
                reX = cutX - _x;
            } else if (_x + _height * _scale < cutX + cutShowW) {
                reX = cutX + cutShowW - _height * _scale - _x;
            }
            if (_y > cutY) {
                reY = cutY - _y;
            } else if (_y + _width * _scale <= cutY + cutShowH) {
                reY = cutY + cutShowH - _width * _scale - _y;
            }
        }

        var T = 10,
            t = 0,
            ReScale = _photo.scale * (_scale - 1),
            q = ReScale / T,
            qx = reX / T,
            qy = reY / T,
            _x = _photo.x,
            _y = _photo.y,
            _q = _photo.scale;
        reDrawPhoto();

        function reDrawPhoto() {
            _photo.scale = linear(t, _q, ReScale, T);
            _photo.x = linear(t, _x, reX, T);
            _photo.y = linear(t, _y, reY, T);
            drawCutPage();

            if (!isMove && t < T) {
                requestAnimFrame(reDrawPhoto);
                t++;
            }
        }
    }

    function linear(time, startValue, changeValue, duration) {
        return changeValue * time / duration + startValue;
    }

    function cutDown(e) {
        e.preventDefault();
        e.stopPropagation();
        oldP = [{
                x: 0,
                y: 0
            }, {
                x: 0,
                y: 0
            }],
            newP = [{
                x: 0,
                y: 0
            }, {
                x: 0,
                y: 0
            }];
        var points = getEventPosition(e),
            p = points[0];
        p.x = p.x;
        p.y = p.y;
        oldP[0].x = p.x;
        oldP[0].y = p.y;
        if (points[1] != undefined) {
            oldP[1].x = points[1].x;
            oldP[1].y = points[1].y;
        }

        isMove = true;
        canvas1.addEventListener(touchmove, cutMove, false);
        canvas1.addEventListener(touchend, cutUp, false);
    }

    function cutReset() {
        photosObject.cut.scale = photosObject.cut._scale;
        photosObject.cut.angle = photosObject.cut._angle;
        if (photosObject.cut.width > photosObject.cut.height) {
            photosObject.cut.x = cutX - (photosObject.cut.width - photosObject.cut.height) / 2 * photosObject.cut.scale;
            photosObject.cut.y = cutY;
        } else {
            photosObject.cut.x = cutX;
            photosObject.cut.y = cutY - (photosObject.cut.height - photosObject.cut.width) / 2 * photosObject.cut.scale;
        }
        drawCutPage();
    }
    /**
     * 图片类
     */
    function Photo() {
        /**
         * 图片x坐标
         * @property {float} x
         */
        this.x;
        /**
         * 图片y坐标
         * @property {float} y
         */
        this.y;
        /**
         * 原图宽度
         * @property {int} width
         */
        this.width;
        /**
         * 原图高度
         * @property {int} height
         */
        this.height;
        /**
         * 图片原来的旋转角度
         * @property {int} _angle
         */
        this._angle;
        /**
         * 用户操作后的旋转角度
         * @property {int} angle
         */

        this.angle;
        /**
         * 图片原来的缩放比例
         * @property {float} _scale
         */

        this._scale;
        /**
         * 用户操作后的缩放比例
         * @property {float} scale
         */
        this.scale;
        /**
         * image对象
         * @property {img} img
         */
        this.img;


        /**
         * 画图片
         * @method draw
         * @for Photo
         * @param {context} c canvas上下文引用
         * @return {undefined} 无
         */
        this.draw = function(c) {
            c.save();
            c.translate((this.x + this.width / 2 * this.scale), (this.y + this.height / 2 * this.scale));
            c.rotate(this.angle % 360 * Math.PI / 180);
            c.drawImage(this.img, 0, 0, this.width, this.height, -this.width / 2 * this.scale, -this.height / 2 * this.scale, this.width * this.scale, this.height * this.scale);
            c.restore();
        };
    }

    function rotate() {
        photosObject.cut.angle += 90;
        set();
    }

    function bigger() {
        var _scale = photosObject.cut.scale;
        photosObject.cut.scale += 0.01;
        if (photosObject.cut.scale >= 2) {
            photosObject.cut.scale = 2;
        }
        photosObject.cut.x = photosObject.cut.x + photosObject.cut.width / 2 * _scale - photosObject.cut.width / 2 * photosObject.cut.scale;
        photosObject.cut.y = photosObject.cut.y + photosObject.cut.height / 2 * _scale - photosObject.cut.height / 2 * photosObject.cut.scale;
        set();
    }

    function smaller() {
        var _scale = photosObject.cut.scale;
        photosObject.cut.scale -= 0.01;
        if (photosObject.cut.scale <= photosObject.cut._scale) {
            photosObject.cut.scale = photosObject.cut._scale;
        }
        photosObject.cut.x = photosObject.cut.x + photosObject.cut.width / 2 * _scale - photosObject.cut.width / 2 * photosObject.cut.scale;
        photosObject.cut.y = photosObject.cut.y + photosObject.cut.height / 2 * _scale - photosObject.cut.height / 2 * photosObject.cut.scale;
        set();
    }

    function change(file) {
        var data = "";
        var reader = new FileReader(),
            img = new Image(),
            _angle = 0;
        reader.readAsDataURL(file);
        reader.onload = function(e) {
            data = e.target.result;
            img.src = data;
            img.onload = function() {
                dealPhoto(img);
            }
        }
    }
    return {
        setPhotoUrl: setPhotoUrl,
        cut: cut,
        rotate: rotate,
        bigger: bigger,
        smaller: smaller,
        cutReset: cutReset,
        change: change
    }
};
