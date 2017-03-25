importScripts('./main.js')

self.appData = {}

self.addEventListener('message', function (e) {
  const data = e.data

  switch (data.cmd) {
    case 'appData':
      self.appData = data.data
      break
    case 'imgData':
      self.postMessage('WORKER STARTED')
      self.imgData = data.data
      start()
      break
  }
})

function start () {
  const toConvolutionForImg = toConvolution(self.appData.width, self.appData.height)

  const grayscale = toPixels(toGrayscale(self.imgData, self.appData.width, self.appData.height))
  self.postMessage({ type: 'grayscale', data: grayscale })
  
  const normalized = toNormalized(grayscale)
  self.postMessage({ type: 'normalized' })

  const blurred = toConvolutionForImg(gaussMatrix, 2, normalized)
  self.postMessage({ type: 'blurred', data: toPixels(toDenormalized(blurred)) })

  const xDerived = toConvolutionForImg(xMatrix, 1, blurred)
  self.postMessage({ type: 'xAxis', data: toPixels(toDenormalized(xDerived)) })

  const yDerived = toConvolutionForImg(yMatrix, 1, blurred)
  self.postMessage({ type: 'yAxis', data: toPixels(toDenormalized(yDerived)) })

  const gradientMagnitude = toGradientMagnitude(
    xDerived,
    yDerived,
    self.appData.width,
    self.appData.height,
    self.appData.lt,
    self.appData.ut
  )
  self.postMessage({ type: 'gradientMagnitude', data: toPixels(toDenormalized(gradientMagnitude)) })
}