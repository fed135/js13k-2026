import { randomPoints } from "./utils.js";
import { pattern } from "./scene.js";
import {a,c} from "./canvas.js";
import Projectile from "./projectile.js";

export default class terrain {
    constructor(amount, startingValue, variation, roughness, min, max, offset, width) {
        this.coords = randomPoints(amount, startingValue, variation, roughness, min, max).map((p) => [p,p]); // [[originalY, currentY], ...]
        this.offset = offset;
        this.width = width;
    }

    render() {
        // each section with the gradient starting at the right height 
        // c.strokeStyle = "black";
        // c.lineWidth = 6;

        const cw = this.width / this.coords.length;

        this.coords.forEach((coord, i) => {
            c.beginPath();
            c.moveTo(Math.floor(i * cw), coord[1]);
            c.lineTo(Math.ceil(i * cw + cw), coord[1]);
            c.lineTo(Math.ceil(i * cw + cw), a.height);
            c.lineTo(Math.floor(i * cw), a.height);
            c.closePath();

            const soilGradient = c.createLinearGradient(0, coord[0], 0, a.height);
            
            soilGradient.addColorStop(0, "#009900");
            soilGradient.addColorStop(0.05, "#006633");
            soilGradient.addColorStop(0.1, "#ffcc99");
            soilGradient.addColorStop(1, "brown");
            
            c.fillStyle = soilGradient;
            c.fill();
            //c.stroke();
            
            c.globalCompositeOperation = 'multiply';
            c.fillStyle = pattern;
            c.fill();
            c.globalCompositeOperation = 'source-over';
        });
    }

    crater(x, falloff, offset) {
        const clampedX = Math.max(0, Math.min(this.width, x));
        const index = Math.min(this.coords.length - 1, Math.floor((clampedX / this.width) * this.coords.length));
        
        // Apply reduction to surrounding terrain as well
        const newfloor = this.coords[index][1] + (falloff * (offset ? 0.1 : 1/6));
        if (this.coords[index][1] > newfloor) return;

        for(let i = 1; i < falloff / 2; i++) {
            if (index - i > 0) this.coords[index - i][1] = Math.max(newfloor - (falloff * (i/16) * (i/16)), this.coords[index - i][1]);
            if(index + i < this.coords.length) this.coords[index + i][1] = Math.max(newfloor - (falloff * (i/16) * (i/16)), this.coords[index + i][1]);
        }
        this.coords[index][1] = newfloor;
    }

    getCurrentY(x) {
        const clampedX = Math.max(0, Math.min(this.width, x));
        const index = Math.min(this.coords.length - 1, Math.floor((clampedX / this.width) * this.coords.length));

        return this.coords[index][1];
    }
}