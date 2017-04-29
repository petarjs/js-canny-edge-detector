window.appData = {}

const canvasFrom = document.querySelector('.image--from') as HTMLCanvasElement
const canvasGrayscale = document.querySelector('.image--grayscale') as HTMLCanvasElement
const canvasResult = document.querySelector('.image--result') as HTMLCanvasElement
const canvasBlurred = document.querySelector('.image--blurred') as HTMLCanvasElement
const canvasXDerived = document.querySelector('.image--x-derived') as HTMLCanvasElement
const canvasYDerived = document.querySelector('.image--y-derived') as HTMLCanvasElement

const $file = document.querySelector('.js_image') as HTMLInputElement
const $submit = document.querySelector('.js_submit') as HTMLElement
const $controls = document.querySelector('.js_controls') as HTMLElement
const $status = document.querySelector('.js_status') as HTMLElement
const $ut = document.querySelector('.js_ut') as HTMLInputElement
const $lt = document.querySelector('.js_lt') as HTMLInputElement
const $cancel = document.querySelector('.js_cancel') as HTMLElement

let worker = new Worker('./dist/worker.js')

function initWorker () {
  worker.addEventListener('message', onWorkerMessage, false)
}

$file.addEventListener('change', event => {
  const file = $file.files[0]
  readFileAsDataURL(file)
    .then(loadImage)
    .then(setCanvasSizeFromImage(canvasFrom))
    .then(drawImageOnCanvas(canvasFrom))
    .then(setCanvasSizeFromImage(canvasGrayscale))
    .then(setCanvasSizeFromImage(canvasResult))
    .then(setCanvasSizeFromImage(canvasBlurred))
    .then(setCanvasSizeFromImage(canvasYDerived))
    .then(setCanvasSizeFromImage(canvasXDerived))
    .then((img: HTMLImageElement) => {
      window.appData = {
        img,
        width: img.naturalWidth,
        height: img.naturalHeight
      }
    })
    .then(showControls)
})

$submit.addEventListener('click', event => {

  window.appData.ut = parseFloat($ut.value)
  window.appData.lt = parseFloat($lt.value)

  worker.postMessage({
    cmd: 'appData',
    data: {
      width: window.appData.width,
      height: window.appData.height,
      ut: window.appData.ut,
      lt: window.appData.lt
    } 
  })

  const imgd = canvasFrom
    .getContext('2d')
    .getImageData(0, 0, window.appData.width, window.appData.height)

  const pixels = imgd.data
  setProcessingStatus('1/7 Loaded image data')
  blockControls()

  worker.postMessage({ cmd: 'imgData', data: pixels })
})

$cancel.addEventListener('click', event => {
  worker.terminate()
  setProcessingStatus('')
  unblockControls()
  worker = new Worker('./dist/worker.js')
  initWorker()
})

function showControls () {
  $controls.style.display = 'inline-block'
  setProcessingStatus('')
}

function blockControls () {
  $controls.classList.add('controls--blocked')
  $cancel.style.display = 'inline-block'
}

function unblockControls () {
  $controls.classList.remove('controls--blocked')
  $cancel.style.display = ''
}

function setProcessingStatus (status: string) {
  window.appData.status = status
  $status.innerText = status
}

function onWorkerMessage (e: ServiceWorkerMessageEvent) {
  const drawBytesOnCanvasForImg = drawBytesOnCanvas(window.appData.width, window.appData.height)

  if (e.data.type === 'grayscale') {
    setProcessingStatus('2/7 Converted to Grayscale')
    drawBytesOnCanvasForImg(canvasGrayscale, e.data.data)
  } else if (e.data.type === 'normalized') {
    setProcessingStatus('3/7 Normalized pixel values')
  } else if (e.data.type === 'blurred') {
    setProcessingStatus('4/7 Blurred image')
    drawBytesOnCanvasForImg(canvasBlurred, e.data.data)
  } else if (e.data.type === 'xAxis') {
    setProcessingStatus('5/7 Created X axis derivation')
    drawBytesOnCanvasForImg(canvasXDerived, e.data.data)
  } else if (e.data.type === 'yAxis') {
    setProcessingStatus('6/7 Created Y axis derivation')
    drawBytesOnCanvasForImg(canvasYDerived, e.data.data)
  } else if (e.data.type === 'gradientMagnitude') {
    setProcessingStatus('7/7 Calculated Gradient magnitude')
    drawBytesOnCanvasForImg(canvasResult, e.data.data)
    setProcessingStatus('Done!')
    unblockControls()
  }
}