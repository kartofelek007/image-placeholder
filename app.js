const express = require('express');
const app = express();
const { createCanvas, loadImage } = require('canvas');
const htmlColors = require("./html-colors");
const fs = require("fs");

function checkColor(text) {
    let valid = false;

    if (/^[absdef0-9]{3}$/i.test(text)) {
        valid = true;
    }
    if (/^[absdef0-9]{3}$/i.test(text)) {
        valid = true;
    }
    if (/^.+$/.test(text) && htmlColors.includes(text)) {
        valid = true;
    }

    return valid;
}

function calculateFontSize(fontSize, text, ctx) {
    ctx.save();
    ctx.fontSize = fontSize;
    let w = ctx.canvas.width;
    const width = w;
    do {
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        w = ctx.measureText(text).width;
        fontSize--;
    } while (w > width - 10)
    return w;
}

app.get("/", async (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get("/:width([0-9]+)x:height([0-9]+)/:category?", async (req, res) => {
    let {category, width, height} = req.params;
    width = +width;
    height = +height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    if (!fs.existsSync(`./images/${category}`)) {
        category = undefined
    }

    if (category !== undefined) {
        const images = await fs.promises.readdir(`./images/${category}`);

        if (!images.length) {
            category = undefined;
        } else {
            const randIndex = Math.floor(Math.random() * images.length);
            const image = await loadImage(`./images/${category}/${images[randIndex]}`);

            //fill image to canvas
            let scale = Math.max(canvas.width / image.width, canvas.height / image.height);
            let x = (canvas.width / 2) - (image.width / 2) * scale;
            let y = (canvas.height / 2) - (image.height / 2) * scale;

            ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
        }
    }

    if (category === undefined) {
        ctx.fillStyle = "#ddd";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 1;
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height);
        ctx.stroke();
        ctx.moveTo(width, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
    }

    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";

    let text = `${width}x${height}`;
    if (req.query.text !== undefined) {
        text = req.query.text;
    }

    ctx.fontSize = calculateFontSize(50, text, ctx);
    ctx.lineWidth = 2;
    ctx.strokeText(text, width / 2, height / 2);
    ctx.fillText(text, width / 2, height / 2);

    //grayscale
    if (req.query.gray) {
        let imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        let pixels = imgData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            let lightness = parseInt((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
            pixels[i] = lightness;
            pixels[i + 1] = lightness;
            pixels[i + 2] = lightness;
        }
        ctx.putImageData(imgData, 0, 0);
    }

    const buffer = canvas.toBuffer('image/png')
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer)
})

app.listen(3000, function () {
    console.log('Listening on http://localhost:3000')
});