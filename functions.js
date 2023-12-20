const htmlColors = require("./html-colors.js");

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
    let target = ctx.canvas.width - 30;
    if (target < 10) target = 10;

    let tempWidth = target;
    do {
        ctx.font = `bold ${fontSize}px sans-serif`;
        tempWidth = ctx.measureText(text).width;
        fontSize--;
    } while (tempWidth > target);
    if (ctx.canvas.height <= 50) {
        fontSize = 20;
    }
    if (ctx.canvas.height <= 30) {
        fontSize = 10;
    }
    return fontSize;
}

module.exports.checkColor = checkColor;
module.exports.colorBrightness = colorBrightness;
module.exports.calculateFontSize = calculateFontSize;
