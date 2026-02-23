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

module.exports.checkColor = checkColor;
module.exports.colorBrightness = colorBrightness;
