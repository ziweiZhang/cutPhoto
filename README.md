# cutPhoto
图片处理
###功能
支持裁剪、旋转、缩放、压缩图片
###兼容性
兼容PC端主流浏览器和移动端

####传入的参数
     @param {[object]} params [可传参数]
      {
          sw:300,                  //裁剪区宽度
          sh:380,                  //裁剪区高度
          bgColor: "#000",         //背景颜色
          layerColor: "#000",      //蒙层颜色
          layerAlpha:0.5,          //蒙层透明度
          borderColor: "#fff",     //边框颜色
          imgUrl: "",              //原图的url， 不支持跨域
          resultSize: 300,         //裁剪后的尺寸
          getImgUrl:function,      //获取裁剪后的图片url(base64编码)
          uploadDone:function      //图片加载完执行的方法
      }
####可使用的方法
    @return {[object]} 返回的对象
      {
         setPhotoUrl:function,    //设置照片的url，不支持跨域
         cut:function,            //裁剪
         rotate:function,         //顺时针旋转图片90度
         bigger:function,         //放大图片
         smaller:function,        //缩小图片
         cutReset:function,       //重置图片到最初始状态
         change:function          //设置原图文件(一般通过input[type=file]选择)
     }
    
具体使用方法可参见demo.html
