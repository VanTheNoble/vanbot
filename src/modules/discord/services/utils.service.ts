import { Injectable, Logger } from "@nestjs/common";
import { InteractionResponseType, MessagePayload, Utils } from "discord.js";
import { CommandsService, Context, ContextOf, createCommandGroupDecorator, Once, SlashCommand, SlashCommandContext, Subcommand, TextCommand, TextCommandContext } from "necord";
export const UtilsCommandDecorator = createCommandGroupDecorator({
    name: "utils",
    description: "Utility commands",
    guilds: [process.env.GUILD_ID],
    defaultMemberPermissions: ["Administrator", "ManageGuild"],
});

@UtilsCommandDecorator()
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
        message.reply("Pong!").then(msg => {
            setTimeout(() => msg.delete(), 10000)
          })
          .catch(() => {});
    }

    @Subcommand({
        name: "clear",
        description: "Clear messages",
    })
    public async clearMessages(@Context() [message]: SlashCommandContext) {
        let messages = await message.channel.messages.fetch();
        let m = messages.filter((m) => !m.pinned);
        await message.channel.bulkDelete(m);
        return message.reply("Chat cleared").then(msg => {
            setTimeout(() => msg.delete(), 10000)
          })
          .catch(() => {});
    }

}