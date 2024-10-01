import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import { TwitchExtensionService } from "../services/twitch-extension.service";

@Controller()
export class TwitchController {
 
    constructor(private twitchExtension: TwitchExtensionService){}

    @Get("/login")
    twitchRedirect(@Res() res) {
        const url = this.twitchExtension.buildAuthUrl();
        res.redirect(url);
    }

    @Get("/callback")
    async twitchCallback(@Req() req) {
        let completion = await this.twitchExtension.completeAuth(req.query.code);
        return completion ? "Success" : "Failed";
    }
}