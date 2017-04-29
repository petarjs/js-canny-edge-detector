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
const $imageNav = document.querySelector('.js_image-nav') as HTMLElement
const $status = document.querySelector('.js_status') as HTMLElement
const $ut = document.querySelector('.js_ut') as HTMLInputElement
const $lt = document.querySelector('.js_lt') as HTMLInputElement
const $cancel = document.querySelector('.js_cancel') as HTMLElement
const $result = document.querySelector('.result') as HTMLElement

let worker

function initWorker () {
  worker = new Worker('./dist/worker.js')
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
    .then(() => {
      [...document.querySelectorAll('canvas')].forEach(canvas => {
        let newWidth = Math.min($result.clientWidth, canvas.width)
        canvas.style.width = newWidth + 'px'
        canvas.style.height = newWidth * (canvas.height / canvas.width) + 'px'
      })
    })
    .then(showControls)
})

$submit.addEventListener('click', event => {

  window.appData.ut = parseFloat($ut.value)
  window.appData.lt = parseFloat($lt.value)

  initWorker()

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
  resetImageNav()

  worker.postMessage({ cmd: 'imgData', data: pixels })
})

$cancel.addEventListener('click', event => {
  worker.terminate()
  worker.removeEventListener('message', onWorkerMessage, false)
  setProcessingStatus('')
  unblockControls()
  initWorker()
  resetImageNav()
})

function showControls () {
  $status.style.display = 'inline-block'
  $controls.style.display = 'inline-block'
  $imageNav.classList.add('image-nav--active')
  $result.style.height = canvasFrom.style.height
  resetImageNav()
  setProcessingStatus('Waiting for start.')
}

function blockControls () {
  $controls.classList.add('controls--blocked')
  $cancel.style.display = 'inline-block'
}

function unblockControls () {
  $controls.classList.remove('controls--blocked')
  $cancel.style.display = ''
}

function resetImageNav () {
  [...document.querySelectorAll('.image-nav__item--active')].forEach(el => el.classList.remove('image-nav__item--active'))
  document.querySelector(`[data-target="js_image--from"]`).classList.add('image-nav__item--active')
}

function setProcessingStatus (status: string) {
  window.appData.status = status
  $status.innerText = status
}

function activateImage (className) {
  let imageNavItem = document.querySelector(`[data-target="${className}"]`)
  if (imageNavItem) {
    imageNavItem.classList.add('image-nav__item--active')
  }
  document.querySelector(`.${className}`).classList.add(`image--active`)
}

function onWorkerMessage (e: ServiceWorkerMessageEvent) {
  const drawBytesOnCanvasForImg = drawBytesOnCanvas(window.appData.width, window.appData.height)

  if (e.data.type === 'grayscale') {
    setProcessingStatus('2/7 Converted to Grayscale')
    drawBytesOnCanvasForImg(canvasGrayscale, e.data.data)
    activateImage('js_image--grayscale')
  } else if (e.data.type === 'normalized') {
    setProcessingStatus('3/7 Normalized pixel values')
  } else if (e.data.type === 'blurred') {
    setProcessingStatus('4/7 Blurred image')
    drawBytesOnCanvasForImg(canvasBlurred, e.data.data)
    activateImage('js_image--blurred')
  } else if (e.data.type === 'xAxis') {
    setProcessingStatus('5/7 Created X axis derivation')
    drawBytesOnCanvasForImg(canvasXDerived, e.data.data)
    activateImage('js_image--x-derived')
  } else if (e.data.type === 'yAxis') {
    setProcessingStatus('6/7 Created Y axis derivation')
    drawBytesOnCanvasForImg(canvasYDerived, e.data.data)
    activateImage('js_image--y-derived')
  } else if (e.data.type === 'gradientMagnitude') {
    setProcessingStatus('7/7 Calculated Gradient magnitude')
    drawBytesOnCanvasForImg(canvasResult, e.data.data)
    activateImage('js_image--result')
    setProcessingStatus('Done!')
    unblockControls()
  }
}

document.querySelector('.js_image-nav').addEventListener('click', e => {
  let eventTarget = (e.target as HTMLElement)
  if (eventTarget.classList.contains('image-nav__item--active')) {
    let target = eventTarget.dataset.target
    Array.from(document.querySelectorAll('.image--active')).forEach(el => el.classList.remove('image--active'))
    document.querySelector(`.${target}`).classList.add(`image--active`)
  }
})