const express = require('express');
const app = express();
const { registerFont, createCanvas, loadImage } = require('canvas');
const fs = require("fs");
const functions = require("./functions");

const checkColor = functions.checkColor;
const colorBrightness = functions.colorBrightness;
const calculateFontSize = functions.calculateFontSize;

app.use('/favicon.svg', express.static('./favicon.svg'));

//pokazanie index.html
app.get("/", async (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get("/stress-test", async (req, res) => {
    res.sendFile(__dirname + '/stress-test.html');
});

//pobieranie katalogow
app.get("/categories", async (req, res) => {
    const folders = await fs.promises.readdir(`./images`);
    let data = [];

    for await (let folder of folders) {
        const images = await fs.promises.readdir(`./images/${folder}`);
        data.push({
            count : images.length,
            name : folder
        });
    }

    data = data.sort((a, b) => a.name.localeCompare(b.name));

    res.json({ categories : data });
});

app.get("/:width([0-9]+)x:height([0-9]+)/:category?", async (req, res) => {

    let {category, width, height} = req.params;
    width = +width;
    height = +height;

    //ustawiam max rozdzielczosc
    if (width > 1000) width = 1000;
    if (height > 1000) height = 1000;
    if (width < 10) width = 10;
    if (height < 10) height = 10;

    let text = `${width}x${height}`;
    if (req.query.text !== undefined) {
        text = req.query.text;
    }

    let noText = (req.query.notext !== undefined) ? true : false;
    if (width < 40 || height < 20) {
        noText = true;
    }

    let bg = "#ddd";
    if (req.query.bg !== undefined) {
        bg = checkColor(req.query.bg, bg);
    }

    let textColor = "#fff";
    if (req.query.c !== undefined) {
        textColor = checkColor(req.query.c, textColor);
    }

    let imageLines = req.query.lines !== undefined ? true : false;

    let grayscale = req.query.gray !== undefined ? true : false;

    let imageID = undefined;
    if (req.query.id !== undefined) {
        imageID = +req.query.id;
        if (!Number(imageID)) imageID = undefined;
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    if (category) {
        if (fs.existsSync(`./images/${category}`)) {
            const images = await fs.promises.readdir(`./images/${category}`);

            if (images.length) {
                let index = Math.floor(Math.random() * images.length);

                if (imageID !== undefined) {
                    const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

                    index = clamp(0, +imageID, images.length - 1)
                }

                const image = await loadImage(`./images/${category}/${images[index]}`);

                //fill image to canvas
                let scale = Math.max(canvas.width / image.width, canvas.height / image.height);
                let x = (canvas.width / 2) - (image.width / 2) * scale;
                let y = (canvas.height / 2) - (image.height / 2) * scale;

                ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
            } else {
                category = false;
            }
        } else {
            category = false;
        }
    }

    if (!category) {
        //change #f00 to #ff0000
        if (/^#[0-9abcdef]{3}$/i.test(bg)) {
            bg = `#${bg[1]}${bg[1]}${bg[2]}${bg[2]}${bg[3]}${bg[3]}`;
        }
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
    }

    //grayscale
    if (grayscale) {
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

    if (imageLines) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
        ctx.lineWidth = 1;
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height);
        ctx.stroke();
        ctx.moveTo(width, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
    }

    if (!noText) {
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        let fontSize = calculateFontSize(ctx);
        ctx.font = `bold ${fontSize}px sans-serif`;

        ctx.lineWidth = (canvas.width <= 40 || canvas.height < 40) ? 0.8 : 1.6;
        ctx.strokeStyle = "#0F0F0F";
        ctx.strokeText(text, width / 2, height / 2);

        ctx.fillStyle = textColor;
        ctx.fillText(text, width / 2, height / 2);
    }

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