window.appData = {};
const canvasFrom = document.querySelector('.image--from');
const canvasGrayscale = document.querySelector('.image--grayscale');
const canvasResult = document.querySelector('.image--result');
const canvasBlurred = document.querySelector('.image--blurred');
const canvasXDerived = document.querySelector('.image--x-derived');
const canvasYDerived = document.querySelector('.image--y-derived');
const $file = document.querySelector('.js_image');
const $submit = document.querySelector('.js_submit');
const $controls = document.querySelector('.js_controls');
const $status = document.querySelector('.js_status');
const $ut = document.querySelector('.js_ut');
const $lt = document.querySelector('.js_lt');
const $cancel = document.querySelector('.js_cancel');
let worker = new Worker('./dist/worker.js');
function initWorker() {
    worker.addEventListener('message', onWorkerMessage, false);
}
$file.addEventListener('change', event => {
    const file = $file.files[0];
    readFileAsDataURL(file)
        .then(loadImage)
        .then(setCanvasSizeFromImage(canvasFrom))
        .then(drawImageOnCanvas(canvasFrom))
        .then(setCanvasSizeFromImage(canvasGrayscale))
        .then(setCanvasSizeFromImage(canvasResult))
        .then(setCanvasSizeFromImage(canvasBlurred))
        .then(setCanvasSizeFromImage(canvasYDerived))
        .then(setCanvasSizeFromImage(canvasXDerived))
        .then(img => {
        window.appData = {
            img,
            width: img.naturalWidth,
            height: img.naturalHeight
        };
    })
        .then(showControls);
});
$submit.addEventListener('click', event => {
    window.appData.ut = parseFloat($ut.value, 10);
    window.appData.lt = parseFloat($lt.value, 10);
    worker.postMessage({
        cmd: 'appData',
        data: {
            width: window.appData.width,
            height: window.appData.height,
            ut: window.appData.ut,
            lt: window.appData.lt
        }
    });
    const imgd = canvasFrom
        .getContext('2d')
        .getImageData(0, 0, window.appData.width, window.appData.height);
    const pixels = imgd.data;
    setProcessingStatus('1/7 Loaded image data');
    blockControls();
    worker.postMessage({ cmd: 'imgData', data: pixels });
});
$cancel.addEventListener('click', event => {
    worker.terminate();
    setProcessingStatus('');
    unblockControls();
    worker = new Worker('./dist/worker.js');
    initWorker();
});
function showControls() {
    $controls.style.display = 'inline-block';
    setProcessingStatus('');
}
function blockControls() {
    $controls.classList.add('controls--blocked');
    $cancel.style.display = 'inline-block';
}
function unblockControls() {
    $controls.classList.remove('controls--blocked');
    $cancel.style.display = '';
}
function setProcessingStatus(status) {
    window.appData.status = status;
    $status.innerText = status;
}
function onWorkerMessage(e) {
    const drawBytesOnCanvasForImg = drawBytesOnCanvas(window.appData.width, window.appData.height);
    if (e.data.type === 'grayscale') {
        setProcessingStatus('2/7 Converted to Grayscale');
        drawBytesOnCanvasForImg(canvasGrayscale, e.data.data);
    }
    else if (e.data.type === 'normalized') {
        setProcessingStatus('3/7 Normalized pixel values');
    }
    else if (e.data.type === 'blurred') {
        setProcessingStatus('4/7 Blurred image');
        drawBytesOnCanvasForImg(canvasBlurred, e.data.data);
    }
    else if (e.data.type === 'xAxis') {
        setProcessingStatus('5/7 Created X axis derivation');
        drawBytesOnCanvasForImg(canvasXDerived, e.data.data);
    }
    else if (e.data.type === 'yAxis') {
        setProcessingStatus('6/7 Created Y axis derivation');
        drawBytesOnCanvasForImg(canvasYDerived, e.data.data);
    }
    else if (e.data.type === 'gradientMagnitude') {
        setProcessingStatus('7/7 Calculated Gradient magnitude');
        drawBytesOnCanvasForImg(canvasResult, e.data.data);
        setProcessingStatus('Done!');
        unblockControls();
    }
}