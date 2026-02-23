const express = require('express');
const app = express();
const { registerFont, createCanvas, loadImage } = require('canvas');
const fs = require("fs");
const functions = require("./functions");

const checkColor = functions.checkColor;
const colorBrightness = functions.colorBrightness;

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

app.get("/:size{/:category}", async (req, res) => {
    let { size, category } = req.params

    const match = size.match(/^(\d+)x(\d+)$/)

    if (!match) {
        return res.status(400).send("Invalid dimensions format");
    }

    let width = Number(match[1])
    let height = Number(match[2])

    //ustawiam max rozdzielczosc
    if (width > 3000) width = 3000;
    if (height > 3000) height = 3000;
    if (width < 10) width = 10;
    if (height < 10) height = 10;

    let text = `${width}×${height}`;
    if (req.query.text !== undefined) {
        text = req.query.text;
    }

    let noText = (req.query.notext !== undefined || req.query.noText !== undefined || req.query.text === "") ? true : false;

    let bgColorDefault = "#1D1F20";

    let textColor = "#fff";

    if (req.query.c !== undefined || req.query.color !== undefined) {
        let color = req.query.color || req.query.c;
        textColor = checkColor(color, textColor);
    }

    let imageLines = req.query.lines !== undefined || req.query.cross !== undefined ? true : false;
    let grayscale = req.query.gray !== undefined || req.query.grayscale !== undefined ? true : false;

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
                    index = imageID;
                }

                if (index > images.length - 1) {
                    index = Math.floor(index % images.length);
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
        //jak ktos poda kolor to wypelniamy kolorem
        if (req.query.bg !== undefined) {
            let bg1 = checkColor(req.query.bg, bgColorDefault);

            if (/^#[0-9abcdef]{3}$/i.test(bg1)) {
                bg1 = `#${bg1[1]}${bg1[1]}${bg1[2]}${bg1[2]}${bg1[3]}${bg1[3]}`;
            }

            ctx.fillStyle = bg1;
        }

        //domyslnie gradient ciemny
        if (req.query.bg === undefined) {
            ctx.fillStyle = bgColorDefault;
        }

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
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.moveTo(width / 2 - 0.5, 0);
        ctx.lineTo(width / 2 - 0.5, height);
        ctx.stroke();
        ctx.moveTo(0, height / 2 - 0.5);
        ctx.lineTo(width, height / 2 - 0.5);
        ctx.stroke();
    }

    if (!noText) {
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        const baseFontSize = 30;
        const maxSize = 30;
        registerFont('./fonts/Oswald-SemiBold.ttf', { family: 'Oswald' })
        ctx.font = `${baseFontSize}px Oswald, Arial`;

        const textWidth = ctx.measureText(text).width;
        const textHeight = baseFontSize; // przybliżenie

        let padding = 60;
        if (width < 120) padding = 40;
        if (width < 90) padding = 30;
        if (width < 60) padding = 15;
        if (width < 40) padding = 5;

        const scale = Math.min(
            (width - padding) / textWidth,
            (height - padding) / textHeight
        );

        let finalFontSize = baseFontSize * scale;
        if (finalFontSize > maxSize) finalFontSize = maxSize;
        ctx.font = `${finalFontSize}px Oswald, Arial`;

        if (category) {
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1;
            ctx.strokeText(text, width / 2, height / 2);
        }

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