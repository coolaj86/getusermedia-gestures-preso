/*jshint jquery:true browser:true strict:true node:true es5:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
/*globals URL:true*/
$(function () {
  "use strict";

  var vidEl = document.querySelector("#js-video")
    , canvas = document.querySelector('#js-snapshot').getContext('2d')
    , n = window.navigator
    , newPixels
    , oldPixels
    , pixLength
    , $hl = $('#js-pointer')
    , firstFrame = true
    , intervalTime = 33
    ;

  n.getUserMedia = n.getUserMedia || n.webkitGetUserMedia || n.mozGetUserMedia;

  function initialize() {
    window.navigator.getUserMedia({ video: true }, function (stream) {
      vidEl.src = URL.createObjectURL(stream);
      console.log('URL video stream', vidEl.src);
      vidEl.play();
      setInterval(draw, intervalTime);
      $('.js-allow-video').fadeOut();
      $('.js-toggle-video').fadeIn();
      $('#js-snapshot').slideDown();
      $('#js-pointer').fadeIn();
    });
  }
  $('body').on('click', '.js-allow-video', initialize);
  $('body').on('click', '.js-toggle-video', function () {
    $('#js-snapshot').slideToggle();
  });


  function draw() {
    var vidWidth = vidEl.width
      , vidHeight = vidEl.height
      , i
      , j
      , map
      , scores
      ;

    //Let's add some bloody stuff the analyze the image in the canvas
    canvas.drawImage(vidEl, 0, 0, vidWidth, vidHeight);

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
    map = new Array(vidWidth);
    scores = new Array(vidWidth);
    for(i = 0; i < vidWidth; i++){
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
        , total = r + g + b
        , left = Math.floor(i % vidWidth)
        , top = Math.floor(i / vidWidth)
        ;
        
      // 0-255 , 3 * 255
      if (r > 16 || g > 16 || b > 16) {
      //if (r + g + b > 16) {
        //IT'S DIFFERENT!
        newPixels.data[i * 4 + 3] = 0; //it's green, make pixel invisible
        map[left][top] = 1;           //give it a map value of 1
        //map[left][top] = total;           //give it a map value of 1
        diffSumX += left;
        diffSumY += top;
        //diffSumCount += 1;
        diffSumCount += 1;
      } else {
        //NOT DIFFERENT
        map[left][top] = 0;         //give it a map value of 0
        //map[left][top] = total;         //give it a map value of 0
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

    function score() {
      var i
        , j
        , rowLimit
        , colLimit
        , dist = 5
        , suspect
        , localSum
        , k
        , kMax = 100
        ;

      rowLimit = map.length;
      colLimit = map[0].length;

      //sum the score for each pixel
      for (j = 0; j < vidHeight; j++) {
        for (i = 0; i < vidWidth; i++) {
          suspect = map[i][j];
          if (suspect) {
            localSum = 100;
          } else {
            localSum = 0;
            continue;
          }

          // TODO for each value of k
          // get each corner i - k, i + k, j - k, j + k
          // sweep (non-inclusively) from [i - k][j - k] to [i - k][j + k]
          // sweep (non-inclusively) from [i - k][j + k] to [i - k][j - k]
          // sweep (non-inclusively) from [i + k][j - k] to [i + k][j + k]
          // sweep (non-inclusively) from [i + k][j + k] to [i + k][j - k]
          // sweep a minimum of 10 spaces
          // sweep a maximum of 100 spaces
          // when the sum is less than 1/4, stop the sweep
          
          // work left
          k = 0;
          while (suspect && i - k >= 0 && k <= kMax) {
            suspect = map[i - k][j];
            if (suspect) {
              localSum += (100 - k);
            }
            k += 1;
          }

          // work right
          k = 0;
          while (suspect && i + k < rowLimit && k <= kMax) {
            suspect = map[i + k][j];
            if (suspect) {
              localSum += (100 - k);
            }
            k += 1;
          }

          // work up
          /*
          k = 0;
          while (suspect && (j - k >= 0) && k <= kMax) {
            suspect = map[i][j - k];
            if (suspect) {
              localSum += (100 - k);
            }
            k += 1;
          }
          */

          // work down
          k = 0;
          while (suspect && (j + k < colLimit) && k <= kMax) {
            suspect = map[i][j + k];
            if (suspect) {
              localSum += (100 - k);
            }
            k += 1;
          }

          scores[i][j] = localSum;
        }
      }
    }

    score();

    /*
      Now that we have the neighborhood scores for each pixel, we need to 
      find the pixel with the highest score. That is the highest concentration
      of Green
      
    */
    //Find the pixel closest to the top left that has the highest score. The
    //	pixel with the highest score is where the highlight box will appear.
    var targetx = 0
      , targety = 0
      , targetscore = 0
      , targetCount = 0
      ;

    for (i = 5; i < vidWidth-5; i++) {
      for (j = 5; j < vidHeight-5; j++) {
        if (scores[i][j] > 1000) {
          targetx += i,
          targety += j;
          targetscore = 1000;
          targetCount += 1;
        }
        /*
        if (scores[i][j] > targetscore) {
          targetscore = scores[i][j];
          targetx = i;
          targety = j;
        }
        */
      }
    }
    targetx = targetx / targetCount;
    targety = targety / targetCount;

    function useDiffSum() {
      if (diffSumX > 0 && diffSumY > 0) {
        var newLeft
          , newTop
          ;

        newLeft = Math.floor(document.width * ((vidEl.width - diffSumX) / vidEl.width));
        newTop = Math.floor(document.height * (diffSumY / vidEl.height));
        if (newLeft > document.width * 0.2) {
          // TODO debounce
          //$('#js-snapshot').fadeToggle();
        }
        $hl.animate({ left: newLeft + 'px', top: newTop + 'px' }, Math.floor(intervalTime - intervalTime * 0.2));
      }
    }

    function useGravity(targetx, targety) {
      if (targetscore < 500) {
        return;
      }

      var newLeft
        , newTop
        ;

      newLeft = Math.floor(document.width * ((vidEl.width - targetx) / vidEl.width));
      newTop = Math.floor(document.height * (targety / vidEl.height));

      if (newLeft > document.width * 0.2) {
        // TODO debounce
        //$('#js-snapshot').fadeToggle();
      }

      $hl.animate(
          { left: newLeft + 'px', top: newTop + 'px' }
        , Math.floor(intervalTime - intervalTime * 0.2)
      );
    }

    useGravity(targetx, targety);
    canvas.putImageData(newPixels, 0, 0);
  }
});
