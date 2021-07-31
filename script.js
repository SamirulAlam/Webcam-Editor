const video=document.querySelector(".player")
const canvas=document.querySelector(".photo")
const ctx=canvas.getContext("2d")
const gallery=document.querySelector(".gallery")
const red = document.getElementById('red')
const green = document.getElementById('green')
const blue = document.getElementById('blue')
const brightness = document.getElementById('brightness')
const grayscale = document.getElementById('grayscale')
const contrast = document.getElementById('contrast')

let pixels = null
let originalPixels = null
let currentPixels = null

red.onchange = runPipeline
        green.onchange = runPipeline
        blue.onchange = runPipeline
        brightness.onchange = runPipeline
        grayscale.onchange = runPipeline
        contrast.onchange = runPipeline

const getVideo=() => {
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    }).then(localMediaStream => {
        console.log(localMediaStream);
        video.srcObject = localMediaStream
        video.play()
    }).catch((err) =>{
        console.log(err)
    })
}

const paintToCanvas=() => {
    const width=video.videoWidth
    const height=video.videoHeight
    canvas.width = width;
    canvas.height = height;

    return setInterval(() => {
        ctx.drawImage(video,0,0,width,height)
        pixels=ctx.getImageData(0,0,width,height)

        
        
            //getVideo()
            // pixels=redEffect(pixels)
            // pixels=rgbSplit(pixels)
            // ctx.globalAlpha =0.1
            // pixels=greenScreen(pixels)

            copydat = ctx.getImageData(0, 0, width, height)
            originalPixels = pixels.data.slice()
        ctx.putImageData(pixels,0,0)
    },16);
    
}


const takePhoto=() => {
    const data=canvas.toDataURL("/image/jpeg")
    const link=document.createElement("a")
    link.href=data;
    link.setAttribute("download", "handsome")
    link.innerHTML=`<img src="${data}" alt="Handsome man" />`;
    gallery.insertBefore(link,gallery.lastChild)
}

const redEffect=(pixels)=>{
    for(let i=0;i<pixels.data.length;i+=4){
        pixels.data[i+0]=pixels.data[i+0]+100
        pixels.data[i+1]=pixels.data[i+1]-50
        pixels.data[i+2]=pixels.data[i+2]*0.5
    }
    return pixels
}

const rgbSplit=(pixels)=>{
    for(let i=0;i<pixels.data.length;i+=4){
        pixels.data[i-150]=pixels.data[i+0]
        pixels.data[i+500]=pixels.data[i+1]
        pixels.data[i-550]=pixels.data[i+2]
    }
    return pixels
}

const greenScreen=(pixels)=>{
    let levels={}
    document.querySelectorAll(".rgb input").forEach((input)=>{
        levels[input.name]=input.value
    })

    for(let i=0;i<pixels.data.length;i+=4){
        const red=pixels.data[i+0]
        const green=pixels.data[i+1]
        const blue=pixels.data[i+2]
        const alpha=pixels.data[i+3]

        if(red>=levels.rmin 
            && green>=levels.gmin 
            && blue>=levels.bmin
             &&red<=levels.rmax 
             && blue<=levels.bmax 
             && green<=levels.gmax){
            pixels.data[i+3]=0
        }
    }
    return pixels
}

const R_OFFSET = 0
const G_OFFSET = 1
const B_OFFSET = 2

function getIndex(x, y) {
    return (x + y * video.videoWidth) * 4
}

function clamp(value) {
    return Math.max(0, Math.min(Math.floor(value), 255))
}

function addRed(x, y, value) {
    const index = getIndex(x, y) + R_OFFSET
    const currentValue = currentPixels[index]
    currentPixels[index] = clamp(currentValue + value)
}

function addGreen(x, y, value) {
    const index = getIndex(x, y) + G_OFFSET
    const currentValue = currentPixels[index]
    currentPixels[index] = clamp(currentValue + value)
}

function addBlue(x, y, value) {
    const index = getIndex(x, y) + B_OFFSET
    const currentValue = currentPixels[index]
    currentPixels[index] = clamp(currentValue + value)
}

function addBrightness(x, y, value) {
    addRed(x, y, value)
    addGreen(x, y, value)
    addBlue(x, y, value)
}

getVideo()

video.addEventListener("canplay",paintToCanvas)

function runPipeline() {

    currentPixels = originalPixels.slice()

    const brightnessFilter = Number(brightness.value)
    const contrastFilter = Number(contrast.value)
    const redFilter = Number(red.value)
    const greenFilter = Number(green.value)
    const blueFilter = Number(blue.value)

    const grayscaleFilter = grayscale.checked
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

function commitChanges() {

    for (let i = 0; i < pixels.data.length; i++) {
        pixels.data[i] = currentPixels[i]
    }
    ctx.putImageData(pixels, 0, 0, 0, 0, video.videoWidth, video.videoHeight)
}

function setGrayscale(x, y) {
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

function addContrast(x, y, value) {
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