import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import { Injectable } from '@nestjs/common';

@Injectable()
export class WelcomeCardService {

    private imageUrls = "https://s6.imgcdn.dev/9W4xv.png";
    constructor() {
        this.registerFonts();
    }

    private registerFonts() {
        GlobalFonts.registerFromPath(__dirname + "/font/PlayfairDisplay-SemiBold.ttf", "username");
        GlobalFonts.registerFromPath(__dirname + "/font/Montserrat-ExtraLight.ttf", "message");
        GlobalFonts.registerFromPath(__dirname + "/font/Ubuntu-Regular", "welcome");

    }

    private usernameColor = "#FFD700"; // Default color
    private titleColor = "#00BFFF"; // Default color
    private messageColor = "#FFFFFF"; // Default color

    public async buildCard(username: string, avatar: string, title: string, message: string) {
        let background = this.imageUrls;

        if (username.length >= 27) {
            username = username.slice(0, 24) + "...";
        }

        if (title.length >= 27) {
            title = title.slice(0, 24) + "...";
        }

        if (message.length >= 27) {
            message = message.slice(0, 24) + "...";
        }

        const canvasWidth = 1280;
        const canvasHeight = 720;

        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d");

        // Load the current background image
        const backgroundImage = await loadImage(background);
        ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);

        const gradientImage = await loadImage("https://s6.imgcdn.dev/9WMon.png");
        ctx.drawImage(gradientImage, 0, 0, canvasWidth, canvasHeight);

        const avatarImage = await loadImage(avatar);


        ctx.fillStyle = this.usernameColor; // Use the provided username color
        ctx.font = "91px username";
        ctx.textAlign = "center";
        ctx.fillText(`${username}`.toUpperCase(), centerX, centerY + 70);

        ctx.fillStyle = this.titleColor; // Use the provided title color
        ctx.font = "76px welcome";
        ctx.fillText(`${title}`, centerX, centerY + 150);

        ctx.fillStyle = this.messageColor; // Use the provided message color
        ctx.font = "bold 41px message";
        ctx.fillText(`${message}`.toUpperCase(), centerX, centerY + 290);

        ctx.globalAlpha = 1;

        ctx.save();
        ctx.beginPath();
        ctx.arc(510 + 130, 92 + 130, 130, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImage, 510, 92, 260, 260);
        ctx.restore();

        return canvas.toBuffer("image/png");
    }

}
