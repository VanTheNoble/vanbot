import { Injectable, Logger } from "@nestjs/common";
import { MessagePayload } from "discord.js";
import { CommandsService, Context, ContextOf, Once, TextCommand, TextCommandContext } from "necord";

@Injectable()
export class UtilsService {

    private readonly logger = new Logger(UtilsService.name);

    constructor(private commandService: CommandsService){}

    @Once("ready")
    public onReady(@Context() [client]: ContextOf<"ready">) {
        this.logger.log(`Logged in as ${client.user.username}`);
    }

    public registerCommands(){
        this.checkCommands();
    }

    public checkCommands(){
        let cmd = this.commandService.getCommands();
        cmd.forEach((c) => {
            c.setGuilds([process.env.GUILD_ID]);
        });
        this.commandService.registerAllCommands();
    }

    @TextCommand({
        name: "ping",
        description: "Ping pong!",
    })
    public onPing(@Context() [message]: TextCommandContext) {
        message.reply("Pong!");
    }
}