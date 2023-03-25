const express = require('express');
const app = express();
const { createCanvas, loadImage } = require('canvas');
const htmlColors = require("./html-colors");
const fs = require("fs");

function checkColor(text, defaultValue) {
    if (/^[abcdef0-9]{6}$/i.test(text)) {
        return '#' + text;
    }
    if (/^[abcdef0-9]{3}$/i.test(text)) {
        return '#' + text;
    }
    if (/^.+$/.test(text) && htmlColors.includes(text)) {
        return text;
    }

    return defaultValue;
}

function colorBrightness(color) {
    const c = color.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >>  8) & 0xff;
    const b = (rgb >>  0) & 0xff;

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function calculateFontSize(fontSize, text, ctx) {
    ctx.save();
    ctx.fontSize = fontSize;
    let w = ctx.canvas.width;
    const width = w >= 100 ? w - 50 : w - 20;
    do {
        ctx.font = `bold ${fontSize}px Source Sans Pro, sans-serif`;
        w = ctx.measureText(text).width;
        fontSize--;
    } while (w > width)
    return w;
}

app.get("/", async (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get("/:width([0-9]+)x:height([0-9]+)/:category?", async (req, res) => {

    let {category, width, height} = req.params;
    width = +width;
    height = +height;

    //ustawiam max rozdzielczosc
    if (width > 3000) width = 3000;
    if (height > 3000) height = 3000;

    let text = `${width}x${height}`;
    if (req.query.text !== undefined) {
        text = req.query.text;
    }

    let bg = "#ddd";
    if (req.query.bg !== undefined) {
        bg = checkColor(req.query.bg, bg);

    }

    let color = "#fff";
    if (req.query.c !== undefined) {
        color = checkColor(req.query.c, color);
    }

    let imageCross = false;
    if (req.query.cross !== undefined) {
        imageCross = true;
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    if (category !== "user") {
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
        }
    }

    //change #f00 to #ff0000
    if (bg.length === 4 && bg[0] === "#") {
        bg = `#${bg[1]}${bg[1]}${bg[2]}${bg[2]}${bg[3]}${bg[3]}`;
    }

    if (category === undefined) {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
    }

    if (imageCross) {
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
    ctx.fillStyle = color;

    ctx.fontSize = calculateFontSize(35, text, ctx);

    if (category === undefined) {
        if (req.query.c) {        
            ctx.fillStyle = color;
        } else {
            ctx.fillStyle = "#333";
        }
    } else {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.strokeText(text, width / 2, height / 2);
        ctx.fillStyle = "#fff"
    }

    ctx.fillText(text, width / 2, height / 2);

    const buffer = canvas.toBuffer('image/png')
    res.setHeader('Content-Type', 'image/png');
    res.setHeader("Cache-Control", "public, max-age=2592000");
    const d = new Date();
    const minutesExpires = 30;
    d.setMinutes(d.getMinutes() + minutesExpires);
    res.setHeader(`Expires`, d.toLocaleString());
    res.setHeader('Cache-Control', `public, max-age=${minutesExpires * 60}`);
    res.send(buffer)
})

app.listen(3333, function () {
    console.log('Listening on http://localhost:3333')
});