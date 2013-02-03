/*jshint jquery:true browser:true strict:true node:true es5:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
/*globals URL:true*/
$(function () {
  "use strict";

  var videoEl = document.querySelector("#js-video")
    , canvas = document.querySelector('#js-snapshot').getContext('2d')
    , newPixels
    , oldPixels
    , pixLength
    , hl = document.querySelector('#js-pointer')
    , firstFrame = true
    ;

  $('body').on('click', '.js-allow-video', function () {
    window.navigator.webkitGetUserMedia({ video: true }, function (stream) {
      videoEl.src = URL.createObjectURL(stream);
      console.log('URL video stream', videoEl.src);
      videoEl.play();
      setInterval(draw, 200);
    });
  });


  function draw() {
    console.log('updating');

    var vidWidth = videoEl.width
      , vidHeight = videoEl.height
      ;

    //Let's add some bloody stuff the analyze the image in the canvas
    canvas.drawImage(videoEl, 0, 0, vidWidth, vidHeight);

    //Get the imageData from the canvas

    if (firstFrame) {
      newPixels = canvas.getImageData(0, 0, vidWidth, vidHeight);
      pixLength = newPixels.data.length / 4;
      firstFrame = false;
      return;
    }

    oldPixels = newPixels;
    newPixels = canvas.getImageData(0, 0, vidWidth, vidHeight);

    //map: make two dimensional array to store which pixels detect green
    //scores: 2d array to store the 5x5 scores for each pixel. Each pixel
    //	gets a score of the summary of the green pixels around it. It looks
    //	at the 5 pixels to the left, right, above and below the pixel. The
    //	pixel gets the score of the sum of that total.
    var map = new Array(vidWidth);
    var scores = new Array(vidWidth);
    for(var i = 0; i < vidWidth; i++){
      map[i] = new Array(vidHeight);
      scores[i] = new Array(vidHeight);
    }

    /*
      Pretend this represents the image vidWidth=10px and vidHeight=5px
      [],[],[],[],[],[],[],[],[],[],[]
      [],[],[],[],[],[],[],[],[],[],[]
      [],[],[],[],[],[],[],[],[],[],[]
      [],[],[],[],[],[],[],[],[],[],[]
      [],[],[],[],[],[],[],[],[],[],[]
    
      -We need to fill the map array with one entry for each pixel.

      -The entry will be 1 or 0: 1 if greenish, 0 if anything else

      -We will do something with this
      
      LET'S FILL THE MAP WITH 1 and 0 for the image
      checkout six
    */

    //load the map with 1 and 0 for green and non-green pixels respectively
    var index = -4
      , diffSumX = 0
      , diffSumY = 0
      , diffSumCount = 0
      ;

    for(i = 0; i < pixLength; i++){
      index += 4;
      var r = Math.abs(newPixels.data[index] - oldPixels.data[index])
        , g = Math.abs(newPixels.data[index + 1] - oldPixels.data[index + 1])
        , b = Math.abs(newPixels.data[index + 2] - oldPixels.data[index + 2])
        , left = Math.floor(i % vidWidth)
        , top = Math.floor(i / vidWidth)
        ;
        
      // 0-255 , 3 * 255
      if ((r + g + b) > 128) {
        //IT'S DIFFERENT!
        newPixels.data[i * 4 + 3] = 0; //it's green, make pixel invisible
        map[left][top] = 1;         //give it a map value of 1
        diffSumX += left;
        diffSumY += top;
        diffSumCount += 1;
      } else {
        //NOT DIFFERENT
        map[left][top] = 0;         //give it a map value of 0
      }
      
    }

    diffSumX /= diffSumCount;
    diffSumY /= diffSumCount;


    //NOW LET'S CALCULATE EACH SCORE BY WAY OF A NEIGHBORHOOD OPERATION
    /*
      [],[],[],[ ],[ ],[1],[ ],[ ],[],[],[]
      [],[],[],[ ],[ ],[1],[ ],[ ],[],[],[]
      [],[],[],[1],[1],[?],[1],[1],[],[],[]
      [],[],[],[ ],[ ],[1],[ ],[ ],[],[],[]
      [],[],[],[ ],[ ],[1],[ ],[ ],[],[],[]
    
      You get a score of the total of the people around you

    */

    //sum the score for each pixel
    for(var j = 5; j < vidHeight-5; j++){
      for(i = 5; i < vidWidth-5; i++){
        var l5 = map[i-5][j],
          l4 = map[i-4][j],
          l3 = map[i-3][j],
          l2 = map[i-2][j],
          l1 = map[i-1][j],
          r1 = map[i+1][j],
          r2 = map[i+2][j],
          r3 = map[i+3][j],
          r4 = map[i+4][j],
          r5 = map[i+5][j],
          u5 = map[i][j-5],
          u4 = map[i][j-4],
          u3 = map[i][j-3],
          u2 = map[i][j-2],
          u1 = map[i][j-1],
          d1 = map[i][j+1],
          d2 = map[i][j+1],
          d3 = map[i][j+1],
          d4 = map[i][j+1],
          d5 = map[i][j+1],
          self = map[i][j];
        //console.log(i,j);
        scores[i][j] = l5+l4+l3+l2+l1+r1+r2+r3+r4+r5+u5+u4+u3+u2+u1+d1+d2+d3+d4+d5+self;
      }
    }

    /*
      Now that we have the neighborhood scores for each pixel, we need to 
      find the pixel with the highest score. That is the highest concentration
      of Green
      
    */
    //Find the pixel closest to the top left that has the highest score. The
    //	pixel with the highest score is where the highlight box will appear.
    var targetx = 0;
    var targety = 0;
    var targetscore = 0;
    for(i = 5; i < vidWidth-5; i++){
      for(j = 5; j < vidHeight-5; j++){
        //if(scores[i][j] > targetscore){
          targetx += i,
          targety += j;
        //targetscore = scores[i][j];
        //}
      }
    }
    targetx = targetx / vidHeight;
    targety = targety / vidWidth;
    if (diffSumX > 0 && diffSumY > 0) {
      hl.style.left = ""+Math.floor(
        document.width*(diffSumX / videoEl.width)
      )+"px";
      hl.style.top = ""+Math.floor(
        document.height*(diffSumY / videoEl.height)
      )+"px";
    }
    canvas.putImageData(newPixels, 0, 0);
  }
});
