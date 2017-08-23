/* 
 * jquery.slidepuzzlize 0.1.0
 * MIT Licensed
 * 
 * Copyright (C) pentamania, https://github.com/pentamania
 */

;(function($) {

  var initializeArray = function(array, num) {
    array.length = 0;
    for (i = 0; i < num; i++){
      array.push(i);
    }
  }

  // getter/setterを維持したまま拡張
  // http://rinat.io/blog/mixing-in-and-extending-javascript-getters-and-setters
  var preciseExtend = function(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
      var descriptor, prop;
      if (source) {
        for (prop in source) {
          descriptor = Object.getOwnPropertyDescriptor(source, prop);
          Object.defineProperty(obj, prop, descriptor);
        }
      }
    });

    return obj;
  };

  var puzzleShuffle = function(array, colNum, rowNum, shuffleTimes, voidIndex) {
    // 空パネルの位置
    var currentIndex = (voidIndex != null) ? voidIndex : array.length - 1;
    for (var i=0; i<shuffleTimes; i++) {
      // 進める方向(インデックス)をチェック
      var dir = [];
      var currentRow = Math.floor(currentIndex / colNum);
      var currentCol = currentIndex % colNum;

      // vertical
      if (currentRow !== 0) {　//上に進めない位置（上端）でなければ
        dir.push(currentIndex - colNum);
      }
      if (currentRow !== rowNum-1) {　//下に進めない位置（下端）でなければ
        dir.push(currentIndex + colNum);
      }

      // horizontal
      if (currentCol !== 0) {　//左に進めない位置（左端）でなければ
        dir.push(currentIndex - 1);
      }
      if (currentCol !== colNum-1) {　//左に進めない位置（右端）でなければ
        dir.push(currentIndex + 1);
      }

      // スワップする方向をランダム決定
      var dest = dir[Math.floor(Math.random() * dir.length)];
      var tmp = array[dest];
      array[dest] = array[currentIndex];
      array[currentIndex] = tmp;
      currentIndex = dest;
    }
  };

  var dfdLoadImage = function(img) {
    var dfd = $.Deferred();
    var image = new Image();
    if (typeof img === "string") {
      image.src = img;
    } else if (img.src != null) {
      image.src = img.src;
    } else {
      console.error("imgタグか、src文字列を渡して下さい");
      return false;
    }

    // success
    image.onload = function() {
      dfd.resolve(image);
    }

    // error
    image.onerror = function(e) {
      dfd.reject(e);
    }

    // timeout
    setTimeout(function(){
      dfd.reject()
    },2000);

    return dfd.promise();
  };

  // http://qiita.com/coa00@github/items/679b0b5c7c468698d53f
  var getUniqueStr = function(myStrong) {
    var strong = 1000;
    if (myStrong) strong = myStrong;
    return new Date().getTime().toString(16)  + Math.floor(strong * Math.random()).toString(16)
  };

  // 高速化のため
  var $id = function(id) {
    var dom = document.getElementById(id);
    return $(dom);
  };


  $.extend({
    slidePuzzlize: function(options) {
      var options = $.extend({
        col: 4,
        row: 4,
        pieceOpacity: 0.6,
        animateDuration: 150,
        borderColor: "#565656",
      }, options);

      if (options.selector != null) {
        var $p = $(options.selector);
      } else {
        var $p = $("<div/>");
        $('body').append($p);
      }

      var colNum = options.col;
      var rowNum = options.row;
      var animateDuration = options.animateDuration;
      var pieceOpacity = options.pieceOpacity;
      var borderColor = options.borderColor;
      var puzzleWidth = options.width || $p.width();
      var puzzleHeight = options.height || $p.height();
      var enableAnimation = options.enableAnimation || true;
      var isLocked = false;
      var uId = "jspz_" + getUniqueStr();
      var shuffleStrength = 16; // シャッフル回数に関係

      var modelArray = [];
      var puzzleArray = [];
      var _preservedArray = [];
      var _isMovable = true;
      var _canAnimate = (typeof $().animate === 'function'); // slim版対策


      // private methods ==============================

      // 空ピースidはpuzzleArrayの末尾であること
      var _setUpPieces = function(img, $container) {
        var pieces = [];
        var m = []; // 画像分割時の座標指定用行列
        var pArray = puzzleArray; // 操作対象配列
        var cWidth = $container.width();
        var cHeight = $container.height();
        // var rowNum = $p.rowNum;
        // var colNum = $p.colNum;
        var spaceId = puzzleArray.length - 1;
        var spaceDOMid = uId+"_"+spaceId;

        // ピースのサイズ・プロパティ
        var pWidth = cWidth / colNum;
        var pHeight = cHeight / rowNum;
        var borderPx = 1; // pieceのボーダー幅
        var pieceProp = {
          "width": pWidth + "px",
          "height": pHeight +"px",
          "border": borderPx + "px solid "+borderColor,
          "box-sizing": "border-box",
          "float": "left",
          "overflow": "hidden",
          "position": "relative",
          // "z-index": 2,
          "cursor": "pointer",
        };
        var voidPieceProp = $.extend({}, pieceProp, {
          visibility: "hidden"
        });
        var pieceNode,
            pVal,
            pieceId,
            originX, // 画像描画開始位置：X軸
            originY, // 画像描画開始位置：Y軸
            imgLeft, // css:leftをマイナスにすることで、左方向にずらす
            imgTop, // css:topをマイナスにすることで、上方向にずらす
            textureImg
        ;

        img.width = cWidth;
        img.height = cHeight;

        // 行列生成
        for (var y=0; y<rowNum; y++) {
          for (var x=0; x<colNum; x++) {
            m.push([x, y]);
          }
        }

        for (var i=0, len=pArray.length; i < len; i++) {
          pVal = pArray[i];
          pieceId = uId + "_" + pVal;
          originX = pWidth * m[pVal][0];
          originY = pHeight * m[pVal][1];
          imgLeft = -originX +"px";
          imgTop = -originY +"px";
          textureImg = $(img.cloneNode(false)).css({
            left: imgLeft,
            top: imgTop,
            position: "absolute",
            maxWidth: "none",
          });

          if (pieceId === spaceDOMid) {
            // 空ピース
            pieceNode = $('<div/>')
            .attr('id', pieceId)
            .css(voidPieceProp);
          } else {
            // 通常ピース
            pieceNode = $('<div/>')
            .attr('id', pieceId)
            .css(pieceProp)
            .append(textureImg)
            ;
          }

          pieceNode.on('touchstart mousedown', tapHandler);
          $container.append(pieceNode);
          pieces.push(pieceNode);
        }

        function tapHandler(e) {
          e.preventDefault();

          // 連続クリック対策
          if (isLocked || !_isMovable) return;
          _isMovable = false;

          var i, j, len;
          var thisId = +$(this).attr('id').replace(uId+"_", ""); //文字列→数値への型変換
          var thisIndex = pArray.indexOf(thisId);

          // 検索用
          var targetIndex;
          var targetId;
          var tPcs;
          var tgtId;
          var thisRow = Math.floor(thisIndex/colNum);
          var rowInitNum = thisRow * colNum;
          var thisCol = thisIndex % colNum;
          var movedFlag = false;

          var upDist = "-="+ (pHeight) +"px";
          var downDist = "+="+ (pHeight) +"px";
          var leftDist = "-="+ (pWidth) +"px";
          var rightDist = "+="+ (pWidth) +"px";
          var translatePiece = function($target, styleObject) {
            if (_canAnimate && enableAnimation) {
              $target.animate(styleObject, animateDuration);
            } else {
              $target.css(styleObject);
            }
          };
          // var animateDuration = $p.animateDuration;

          // クリックしたピースの移動: 行->列の順番で空部分を検索
          for (i=0; i<colNum; i++) {
            // クリックしたピースと同じ行を検索： 4*4、 3段目(配列上は2段目)だったら 2*4 = 8, 9, 10, 11
            targetIndex = rowInitNum + i;
            targetId = pArray[targetIndex];
            // 空ピースがあったら
            if (targetId === spaceId) {
              // 自ピース～空ピースのピース数
              tPcs = Math.abs(targetIndex - thisIndex);

              //空ピースが左側にある
              if (targetIndex < thisIndex) {
                // 左に動かす処理
                for (j=0; j<tPcs; j++) {
                  tgtId = uId+"_"+pArray[thisIndex-j];
                  translatePiece($id(tgtId), {left: leftDist});
                  // $id(id).animate({left: leftDist}, animateDuration)
                }
                // 配列操作
                for (j=0; j<tPcs; j++) {
                  // targetIndex=0,i=2だったら[2] ← [3]
                  pArray[targetIndex+j] = pArray[targetIndex+(j+1)];
                }
                pArray[thisIndex] = targetId;

              // 空ピースが右側にある
              } else {
                // 右に動かす処理
                for (j=0; j<tPcs; j++) {
                  tgtId = uId+"_"+pArray[thisIndex+j];
                  translatePiece($id(tgtId), {left: rightDist});
                  // $id(id).animate({left: rightDist}, animateDuration)
                }
                // 配列操作
                for (j=0; j<tPcs; j++) {
                  pArray[targetIndex-j] = pArray[targetIndex-(j+1)]//targetIndex=0,i=2だったら[2] ← [1]
                }
                pArray[thisIndex] = targetId;
              }
              movedFlag = true;
              break;
            }
          }

          if (!movedFlag) {
            // クリックしたピースと同じ列を検索： 4*4パズル、 ピースindexが"5"だったら col=5%4 = 1(つまり2列目) => 1+4*0, 1+4*1, 1+4*2, 1+4*3
            for (i=0; i<rowNum; i++) {
              targetIndex = thisCol + colNum*i;
              targetId = pArray[targetIndex];
              if (targetId === spaceId) {
                tPcs = Math.abs(targetIndex - thisIndex) / colNum;
                // 空ピースが上にある
                if (targetIndex < thisIndex) {
                  //上にうごかす処理
                  for (j=0; j<tPcs; j++) {
                    tgtId = uId+"_"+pArray[thisIndex - colNum*j];
                    translatePiece($id(tgtId), {top: upDist});
                    // $id(id).animate({top: upDist}, animateDuration);
                  }
                  //配列操作
                  //自分＋移動pieceのindexを上にずらす
                  //それぞれ元index-4の位置に代入
                  for (j=0; j<tPcs; j++) {
                    pArray[targetIndex + colNum*j] = pArray[targetIndex + colNum*(j+1)]//targetIndex=3,i=1だったら[7] ← [11]
                  }
                  pArray[thisIndex] = targetId;

                //空ピースが下にある
                } else {
                  //下にうごかす処理
                  for (j=0; j<tPcs; j++) {
                    tgtId = uId+"_"+pArray[thisIndex + colNum*j];
                    translatePiece($id(tgtId), {top: downDist});
                    // $id(id).animate({top: downDist}, animateDuration);
                  }
                  //配列操作；自分＋移動pieceのindexを下にずらし、
                  // var tmp = pArray[targetIndex]; //空ピースidを一時的に保管
                  for (j=0; j<tPcs; j++) {
                    pArray[targetIndex - colNum*j] = pArray[targetIndex - colNum*(j+1)]; //targetIndex=3,i=1だったらp[7] ← p[3]
                  }
                  pArray[thisIndex] = targetId;
                }

                break;
              }
            }
          }

          // TODO: animate終了後、イベント発火?：動かなかった場合は？
          $p.trigger('_piecemove'); // 内部動作用
          $p.trigger('piecemove');
          _isMovable = true;
        }; // --tapHandler

        return pieces;
      }; // --_setupPieces

      var _checkMatching = function() {
        var isEqual = true;
        modelArray.forEach(function(val, i) {
          var pieceId = uId + "_" +val;
          var $dom = $id(pieceId);
          if (val === puzzleArray[i]) {
            $dom.css("opacity", "1");
          } else {
            $dom.css('opacity', pieceOpacity);
            isEqual = false;
          }
        });

        return isEqual;
      };

      // private funcs --end

      preciseExtend($p, {
        get UID() { return uId; },
        get row() { return rowNum; },
        // set rowNum(v) { rowNum = v; },
        get col() { return colNum; },
        // set colNum(v) { colNum = v; },
        get pieceNum() { return colNum * rowNum; },
        get pieceOpacity() { return pieceOpacity; },
        set pieceOpacity(v) {
          pieceOpacity = v;
          _checkMatching();
        },
        get animateDuration() { return animateDuration; },
        set animateDuration(v) { animateDuration = v; },
        get enableAnimation() { return enableAnimation; },
        set enableAnimation(v) { enableAnimation = v; },
        get shuffleStrength() { return shuffleStrength; },
        set shuffleStrength(v) { shuffleStrength = v; },
        get isLocked() { return isLocked; },
        set isLocked(v) { isLocked = v; },
        // get width() { return puzzleWidth; },
        // get height() { return puzzleHeight; },

        pieces: [],
        image: new Image(),

        shuffle: function() {
          initializeArray(puzzleArray, this.pieceNum);
          puzzleShuffle(puzzleArray, colNum, rowNum, this.pieceNum*shuffleStrength);
          _preservedArray = [].concat(puzzleArray);
          // console.log(puzzleArray, _preservedArray, puzzleArray === _preservedArray)
          this.reset(puzzleArray);
          this.trigger('shuffle');

          return this;
        },

        setGrid: function(col, row) {
          if (col != null) colNum = col;
          if (row != null) rowNum = row;
          var pieceNum = this.pieceNum;
          initializeArray(modelArray, pieceNum);
          initializeArray(puzzleArray, pieceNum);
          initializeArray(_preservedArray, pieceNum);

          return this;
        },

        // @return Deferred.promise
        setImage: function(img, disableFit) {
        // setImage: function(img, width, height) {
        // setImage: function(img, imageRatio, aspectRatio) {
          var dfd = $.Deferred();
          var self = this;
          // var aspectRatio = aspectRatio || 1;

          dfdLoadImage(img)
          .then(function(img) {
            // console.log(img);
            self.image = img;
            if (!disableFit) self.resize(img.width, img.height)

            // if (width || height) {
            //   self.resize(width, height)
            // } else {
            //   self.resize(img.width, img.height)
            // }
            // if (imageRatio) {
            //   self.css({
            //     width: img.width*imageRatio*aspectRatio+"px",
            //     height: img.height*imageRatio+"px",
            //   })
            // }
            // self.reset();
            dfd.resolveWith(self, [img]);
          })
          .catch(function(){
            dfd.reject();
          })

          return dfd.promise();
        },

        resize: function(width, height) {
          if (width) {
            puzzleWidth = width;
            // this.css({width: width+"px"})
          }
          if (height) {
            puzzleHeight = height;
            // this.css({height: height+"px"})
          }
          this.css({
            width: puzzleWidth+"px",
            height: puzzleHeight+"px",
          })
          // this.reset();

          return this;
        },

        reset: function(puzArray) {
          puzzleArray = (puzArray) ? puzArray : [].concat(_preservedArray);
          this.empty();
          this.pieces = _setUpPieces(this.image, this);
          _checkMatching();

          return this;
        },
      });

      // init
      $p.setGrid()
      .on('_piecemove', function() {
        var isMatching = _checkMatching();
        if (isMatching) {
          $p.trigger('match');
        }
      });
      $p.on('touchstart mousedown', function(e) {e.preventDefault()});
      $p.resize();

      return $p;
    }

  });
})(jQuery);
