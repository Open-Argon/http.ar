const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const size = { width: 150, height: 150 };

const colourPicker = document.getElementById("colour");
const colourHex = document.getElementById("colourhex");
colourHex.innerText = colourPicker.value;
let currentColour = colourPicker.value;

console.log(colourPicker, colourHex);

colourPicker.addEventListener("input", (e) => {
    colourHex.value = e.target.value;
    currentColour = e.target.value;
});

colourHex.addEventListener("input", () => {
    colourPicker.value = colourHex.value;
    currentColour = colourHex.value;
});

const addPixel = (x, y, colour) => {
    pixels[y][x] = colour;
};

new Event("colour-change");

let pixels = [];
let updatesSince;

const resize = () => {
    const { innerWidth, innerHeight } = window;
    const ratio = Math.min(innerWidth / size.width, innerHeight / size.height);
    canvas.style.width = `${size.width * ratio}px`;
    canvas.style.height = `${size.height * ratio}px`;
    canvas.width = size.width * ratio;
    canvas.height = size.height * ratio;
};
window.addEventListener("resize", resize);

const draw = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const pixelsize = canvas.width / size.width;
    for (let i = 0; i < pixels.length; i++) {
        for (let j = 0; j < pixels[i].length; j++) {
            if (!pixels[i][j]) continue;
            ctx.fillStyle = pixels[i][j];
            ctx.fillRect(j * pixelsize, i * pixelsize, pixelsize, pixelsize);
        }
    }
    requestAnimationFrame(draw);
};

const getCanvas = async () => {
    const resp = await fetch("/get-canvas");
    const data = await resp.json();
    updatesSince = data.time
    pixels = data.canvas;
};

const getUpdates = async () => {
    const url = new URL("/get-canvas-updates", window.location.href);
    url.searchParams.append("lastTime", updatesSince);
    const resp = await fetch(url);
    const data = await resp.json();
    for (const update of data.updates) {
        addPixel(update.x, update.y, update.colour);
    }
    updatesSince = data.time
};

canvas.addEventListener("click", async (e) => {
    const pixelsize = canvas.width / size.width;
    const x = Math.floor(e.offsetX / pixelsize);
    const y = Math.floor(e.offsetY / pixelsize);
    await fetch("/update-canvas", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            x,
            y,
            colour: currentColour,
        }),
    });
    getUpdates()
});

resize();
requestAnimationFrame(draw);
const snooze = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
    await getCanvas();
    while (true) {
        try {
            await getUpdates();
        } catch (e) {
            console.error(e);
        }
        await snooze(500);
    }
};

main();
