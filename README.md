# js-canny-edge-detector

> Example of Canny edge detection algorithm in javascript

This is an implementation Canny Edge Detection algorithm in JavaScript. It's really just for fun. The story behind it is - I found an old faculty project written in C#, and decided to rewrite it in JS. I did it one evening, and it works! :D

## Usage

First, you load the worker:

```js
let worker = new Worker('./dist/worker.js')
```

Then, to set up the worker, you need to send the command `appData`.

```js
worker.postMessage({
  cmd: 'appData',
  data: {
    width: window.appData.width,
    height: window.appData.height,
    ut: window.appData.ut,
    lt: window.appData.lt
  } 
})
```

The command requires the following settings in the `data` object:

- `width` - Width of the image we're going to work on
- `height` - Height of the image we're going to work on
- `ut` - Upper treshold for edge detection
- `lt` - Lower treshold for edge detection

Setting `ut` and `lt` allows you to make them configurable from the UI. If `ut` and `lt` are not provided, tresholds will be automatically determined.

Finally, you need to provide the image to work on to the worker:

```js
worker.postMessage({
  cmd: 'imgData',
  data: pixels
})
```

`pixels` must be of type `ImageData`. You can get it from the canvas into which the image is loaded:

```js
const imgd = canvasFrom
    .getContext('2d')
    .getImageData(0, 0, width, height)

const imageData = imgd.data
```

## Install

Not sure why you'd use this in a project, but if you really really want to...
With [npm](https://npmjs.org/) installed, run

```
$ npm install petarjs/js-canny-edge-detector
```

And refer to the `index.html` in the repo to find the example of usage.

## See Also

- [Canny Edge Detector on Wikipedia](https://en.wikipedia.org/wiki/Canny_edge_detector)
- [Implementation with similar results as this one](https://github.com/yuta1984/CannyJS)
- [Another, more awesome implementation](https://github.com/cmisenas/canny-edge-detection)

## License

MIT

