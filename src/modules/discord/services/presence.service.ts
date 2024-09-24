import { Injectable, Logger } from "@nestjs/common";
import { Context, ContextOf, createCommandGroupDecorator, On, Options, SlashCommandContext, Subcommand } from "necord";
import { RoleDto } from "../models/slash.dtos";
import { DatabaseService } from "./database.service";
import { ActivityType, Client } from "discord.js";
export const PresenceSlashGroup = createCommandGroupDecorator({
    name: "presence",
    description: "Presence commands",
    guilds: [process.env.GUILD_ID],
    defaultMemberPermissions: ["Administrator", "ManageGuild"],
});

@PresenceSlashGroup()
@Injectable()
export class PresenceService {
  
    private readonly logger = new Logger(PresenceService.name);
    constructor(private database:DatabaseService,private client: Client){}

    @Subcommand({
        name: "set",
        description: "Set the presence configuration",
    })
    public async setPresence(@Context() [message]: SlashCommandContext, @Options() options: RoleDto) {
        this.logger.log(`Presence role set to: ${options.role.name}`);
        this.database.saveSetting("presence_role", options.role.id);
        return message.reply("Presence role set");
    }

    @On("presenceUpdate")
    public async onPresenceUpdate(@Context() [oldPresence, newPresence]: ContextOf<"presenceUpdate">) {
        if(newPresence.member.user.bot) return;
        let role = await this.database.getSettingByKey("presence_role");
        if(!role) return;
        let streaming = false;
        for(let activity of newPresence.activities){
            if(activity.type == ActivityType.Streaming){
                streaming = true;
                break;
            }
        }
        let r = await newPresence.guild.roles.fetch(role.value);
        if(streaming){
            if(!newPresence.member.roles.cache.has(r.id)){

                newPresence.member.roles.add(r.id);
            }
        }
        else{
            if(newPresence.member.roles.cache.has(r.id)){
                newPresence.member.roles.remove(r.id);
            }
        }
    }
}