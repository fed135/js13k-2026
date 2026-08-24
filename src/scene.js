import { a,c, perlin } from './canvas.js';

export const pattern = c.createPattern(perlin(), 'repeat');

let t = - 2000;

export function sky() {
    //sky
    t++;
    if (t>4000) t =-2000;
    const gradient = c.createRadialGradient(t, 90, 30, t, 100, a.width);
    
    gradient.addColorStop(0, "#FAFAD2");
    gradient.addColorStop(0.05, "white");
    gradient.addColorStop(0.25, "#F0FFFF");
    gradient.addColorStop(0.5, "#87CEFA");
    gradient.addColorStop(1, "#191970");
    
    c.fillStyle = gradient;
    c.fillRect(0,0,a.width, a.height);
}

export function backdrop(parralax, height) {
    const sy = Math.round(a.height * height);
    c.beginPath();
    c.moveTo(0, sy);
    for (let t = 0; t < parralax.length; t++) {
        const x = Math.round(t * (a.width / parralax.length));
        const y = parralax[t];
        c.lineTo(x, y + sy);
        
    }
    c.lineTo(a.width, parralax[parralax.length -1]);
    c.lineTo(a.width, a.height);
    c.lineTo(0, a.height);
    c.lineTo(0, sy);
    c.closePath();
    const parallaxGradient = c.createLinearGradient(0, 0, 0, a.height);
    parallaxGradient.addColorStop(0, "white");
    parallaxGradient.addColorStop(1, "#191970");
    c.fillStyle = parallaxGradient;
    c.fill();
}

export function mound(offsetX, offsetY, height) {
    //c.strokeStyle = "black";
    //c.lineWidth = 6;
    c.beginPath();
    c.moveTo(Math.round(a.width * offsetX) - 600, a.height);
    c.lineTo(Math.round(a.width * offsetX) - 200, Math.round(a.height * offsetY) + 100);
    c.lineTo(Math.round(a.width * offsetX) - 80, Math.round(a.height * offsetY));
    c.lineTo(Math.round(a.width * offsetX) + 80, Math.round(a.height * offsetY));
    c.lineTo(Math.round(a.width * offsetX) + 200, Math.round(a.height * offsetY) + 100);
    c.lineTo(Math.round(a.width * offsetX) + 600, a.height);
    c.closePath();
    const soilGradient = c.createLinearGradient(0, a.height * offsetY, 0, a.height * height);
    
    soilGradient.addColorStop(0, "#009900");
    soilGradient.addColorStop(0.1, "#ffcc99");
    soilGradient.addColorStop(0.9, "#8B4513");
    
    c.fillStyle = soilGradient;
    //c.fillStyle = "#8B4513";
    c.fill();
    //c.stroke();
    
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = pattern;
    c.fill();
    c.globalCompositeOperation = 'source-over';
}