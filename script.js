const video = document.querySelector(".player")
const canvas = document.querySelector(".photo")
const ctx = canvas.getContext("2d")
const gallery = document.querySelector(".gallery")
const red = document.getElementById('red')
const green = document.getElementById('green')
const blue = document.getElementById('blue')
const brightness = document.getElementById('brightness')
const grayscale = document.getElementById('grayscale')
const contrast = document.getElementById('contrast')

var brightnessFilter = 0
var contrastFilter = 0
var redFilter = 0
var greenFilter = 0
var blueFilter = 0
var grayscaleFilter = 0


let pixels = null
let originalPixels = null
let currentPixels = null


const getVideo = () => {
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    }).then(localMediaStream => {
        console.log(localMediaStream);
        video.srcObject = localMediaStream
        video.play()
    }).catch((err) => {
        console.log(err)
    })
}

const paintToCanvas = () => {
    const width = video.videoWidth
    const height = video.videoHeight
    canvas.width = width;
    canvas.height = height;

    return setInterval(() => {
        ctx.drawImage(video, 0, 0, width, height)
        pixels = ctx.getImageData(0, 0, width, height)


        copydat = ctx.getImageData(0, 0, width, height)
        originalPixels = pixels.data.slice()
        runPipeline()

        ctx.putImageData(pixels, 0, 0)
    }, 16);

}


const takePhoto = () => {
    const data = canvas.toDataURL("/image/jpeg")
    const link = document.createElement("a")
    link.href = data;
    link.setAttribute("download", "webfie")
    link.innerHTML = `<img src="${data}" alt="Handsome man" />`;
    gallery.insertBefore(link, gallery.lastChild)
}


const R_OFFSET = 0
const G_OFFSET = 1
const B_OFFSET = 2

const getIndex=(x, y)=> {
    return (x + y * video.videoWidth) * 4
}

const clamp=(value)=> {
    return Math.max(0, Math.min(Math.floor(value), 255))
}

const addRed=(x, y, value)=> {
    const index = getIndex(x, y) + R_OFFSET
    const currentValue = currentPixels[index]
    currentPixels[index] = clamp(currentValue + value)
}

const addGreen=(x, y, value)=> {
    const index = getIndex(x, y) + G_OFFSET
    const currentValue = currentPixels[index]
    currentPixels[index] = clamp(currentValue + value)
}

const addBlue=(x, y, value)=> {
    const index = getIndex(x, y) + B_OFFSET
    const currentValue = currentPixels[index]
    currentPixels[index] = clamp(currentValue + value)
}

const addBrightness=(x, y, value)=> {
    addRed(x, y, value)
    addGreen(x, y, value)
    addBlue(x, y, value)
}

const setGrayscale=(x, y)=> {
    const redIndex = getIndex(x, y) + R_OFFSET
    const greenIndex = getIndex(x, y) + G_OFFSET
    const blueIndex = getIndex(x, y) + B_OFFSET

    const redValue = currentPixels[redIndex]
    const greenValue = currentPixels[greenIndex]
    const blueValue = currentPixels[blueIndex]

    const mean = (redValue + greenValue + blueValue) / 3

    currentPixels[redIndex] = clamp(mean)
    currentPixels[greenIndex] = clamp(mean)
    currentPixels[blueIndex] = clamp(mean)
}

const addContrast=(x, y, value)=> {
    const redIndex = getIndex(x, y) + R_OFFSET
    const greenIndex = getIndex(x, y) + G_OFFSET
    const blueIndex = getIndex(x, y) + B_OFFSET

    const redValue = currentPixels[redIndex]
    const greenValue = currentPixels[greenIndex]
    const blueValue = currentPixels[blueIndex]
    const alpha = (value + 255) / 255

    const nextRed = alpha * (redValue - 128) + 128
    const nextGreen = alpha * (greenValue - 128) + 128
    const nextBlue = alpha * (blueValue - 128) + 128

    currentPixels[redIndex] = clamp(nextRed)
    currentPixels[greenIndex] = clamp(nextGreen)
    currentPixels[blueIndex] = clamp(nextBlue)
}

var kernel = 5

const blurReg=(x, y, kernel)=> {
    var tot = 0
    var tot1 = 0
    var tot2 = 0
    for (let n = x - (Math.floor(kernel / 2)); n <= x + Math.floor(kernel / 2); n++) {
        for (let k = y - (Math.floor(kernel / 2)); k <= y + Math.floor(kernel / 2); k++) {
            tot += (pixels.data[getIndex(n, k)] || pixels.data[getIndex(x, y)])
            tot1 += (pixels.data[getIndex(n, k) + 1] || pixels.data[getIndex(x, y) + 1])
            tot2 += (pixels.data[getIndex(n, k) + 2] || pixels.data[getIndex(x, y) + 2])
        }
    }
    tot = Math.floor(tot / (kernel * kernel));
    tot1 = Math.floor(tot1 / (kernel * kernel));
    tot2 = Math.floor(tot2 / (kernel * kernel));
    pixels.data[getIndex(x, y)] = tot
    pixels.data[getIndex(x, y) + 1] = tot1
    pixels.data[getIndex(x, y) + 2] = tot2
}

const blurx=()=> {
    kernel = getel('blr').value * 1
    kernel += (1 & !(kernel & 1))
    for (let n = 0; n < pixels.width; n++) {
        for (let k = 0; k < pixels.height; k++) {
            blurReg(n, k, kernel)
        }
    }
    ctx.putImageData(pixels, 0, 0, 0, 0, video.videoWidth, video.videoHeight)

}


const runPipeline=()=> {

    currentPixels = originalPixels.slice()

    brightnessFilter = Number(brightness.value)
    contrastFilter = Number(contrast.value)
    redFilter = Number(red.value)
    greenFilter = Number(green.value)
    blueFilter = Number(blue.value)

    grayscaleFilter = grayscale.checked
    for (let i = 0; i < video.videoWidth; i++) {
        for (let j = 0; j < video.videoHeight; j++) {


            if (grayscaleFilter) {
                setGrayscale(i, j)
            }

            addBrightness(i, j, brightnessFilter)
            addContrast(i, j, contrastFilter)

            if (!grayscaleFilter) {
                addRed(i, j, redFilter)
                addGreen(i, j, greenFilter)
                addBlue(i, j, blueFilter)
            }
        }
    }

    commitChanges()
}

const commitChanges=()=> {

    for (let i = 0; i < pixels.data.length; i++) {
        pixels.data[i] = currentPixels[i]
    }
}

red.onchange = runPipeline
green.onchange = runPipeline
blue.onchange = runPipeline
brightness.onchange = runPipeline
grayscale.onchange = runPipeline
contrast.onchange = runPipeline

const getel=(x)=> {
    return document.getElementById(x)
}

const reset=()=> {
    for (let n = 0; n < copydat.data.length; n++) {
        pixels.data[n] = copydat.data[n];
    }

    getel('red').value = "0"
    getel('green').value = "0"
    getel('blue').value = "0"
    getel('brightness').value = "0"
    getel('contrast').value = "0"
    getel('blr').value = "0"
    grayscale.checked=false


    ctx.putImageData(pixels, 0, 0, 0, 0, video.videoWidth, video.videoHeight)

}

getVideo()

video.addEventListener("canplay", paintToCanvas)