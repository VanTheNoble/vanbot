import { Injectable } from "@nestjs/common";
import { Context, TextCommand, TextCommandContext } from "necord";

@Injectable()
export class FunService {

    @TextCommand({
        name:"erethis",
        description:"Erethis ... merda!"
    })
    public onErethis(@Context() [message]: TextCommandContext){
        return message.reply("Erethis ... merda!");
    }
}