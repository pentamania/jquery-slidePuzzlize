# jQuery.slidePuzzlize

## 概要
好きな画像をスライドパズル化するネタ系jqueryプラグインです。

jQuery3.x系（IE9+）に対応、IE8以下はサポート外です。

## Usage

#### index.html
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="IE=Edge">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <title>jquery-slidePuzzlize</title>
</head>
<body>

  <div id="field"></div>

  <script src="http://code.jquery.com/jquery-3.2.1.min.js"></script>
  <script src="./path/to/jquery.slidePuzzlize.js"></script>
  <script src="./path/to/main.js"></script>
</body>
</html>
```

#### main.js
```js
// 画像生成
var img = document.createElement('img');
img.src = "./assets/sample.jpg";

// initialize
var puzzle = $.slidePuzzlize({
  selector: "#field",
  col: 3,
});

// 画像の適用
puzzle.setImage(img);
```

## API

### Options (Properties)
Name | Type | Info
--- | --- | ---
selector | String | パズル化するセレクタ（#id | .class）を指定します。
col | Number | パズルの行数を設定します
row | Number | パズルの段数を設定します
enableAnimation | Boolean | アニメーションを許可するかどうか設定します
animateDuration | Number | スライドアニメーションのスピードを変えます。
pieceOpacity | Number | マッチしてないピースの透明度を変えます （0 ~ 1）
shuffleStrength | Number | シャッフル回数を調整します（初期値：16）

…TODO

### Methods
一部を除き、自分自身を返します。(つまりメソッドチェーン化できます)

#### shuffle()
パズルをシャッフルします。

#### setGrid(rowNumber, colNumber)
パズルの行数・列数を変更します。

#### setImage(imageSrc | imageObject)
画像をセットアップします。  
これだけは非同期処理のため、promiseを返すことに注意。  
引数としてimg要素を渡します。

```js
// 画像セット直後にシャッフルしたい場合
var img = "./assets/image/myCat.png"
var puzzle = $.slidePuzzlize({});

puzzle.setImage(img)
.then(function(img) {
  // パズルをシャッフル： コンテキストは維持されるので this === puzzle となります
  this.resize(img.width/2, img.height/2); // 画像に合わせてサイズ変更
  this.shuffle();
});

```

#### resize(width, height)
パズルサイズを変更し、reset()を行います。

#### reset()
パズルを直近のシャッフル直後にリセットします。

### Events
特定動作に応じて各種イベントを発火します。

#### shuffle
シャッフル完了時に発火

#### pieceMove
ピース移動時に発火

#### match
パズルが揃った時に発火

```js
var img = "./assets/image/myCat.png";
var puzzle = $.slidePuzzlize({});

puzzle.setImage(img)
.then(function(img) {
  this.shuffle();
  this.on("match", function() {
    console.log('clear!')
  });
});

```

## Licence

[MIT](https://github.com/tcnksm/tool/blob/master/LICENCE)

## Author

[pentamania](https://github.com/pentamania)