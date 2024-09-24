import { Injectable, UseInterceptors } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import { Context, createCommandGroupDecorator, Options, SlashCommandContext, Subcommand } from "necord";
import { Client, EmbedBuilder, ForumChannel, GuildForumThreadCreateOptions, GuildMember, ThreadChannel } from "discord.js";
import { CreateLFGDTO, LFGConfigurationDTO } from "../models/slash.dtos";
import { LfgInterceptor } from "../interceptors/lfg.interceptor";
export const LfgSlashGroup = createCommandGroupDecorator({
    name: "lfg",
    description: "LFG commands",
    guilds: [process.env.GUILD_ID],
});

@LfgSlashGroup()
@Injectable()
export class LfgService {

    constructor(
        private database: DatabaseService,
        private client: Client,
    ) { }

    @UseInterceptors(LfgInterceptor)
    @Subcommand({
        name: "create",
        description: "Create a LFG message",
    })
    private async createLfg(@Context() [message]: SlashCommandContext, @Options() options: CreateLFGDTO) {
        if (!this.checkPermissions(message.member as GuildMember)) {
            return message.reply("You are not authorized to use this command");
        }
        let role = await this.database.getSettingByKey("lfg_role");
        let channel = await this.database.getSettingByKey("lfg_channel");
        let u = message.member as GuildMember;
        if (!u.roles.cache.has(role.value)) {
            u.roles.add(role.value);
        }
        let channelObj = message.guild.channels.cache.get(channel.value) as ForumChannel;
        let emb = this.createLFGEmbed(options.type, options.message, u);
        let forumMessage: GuildForumThreadCreateOptions = {

            message: {
                embeds: [emb],

            },

            name: `${u.displayName} - ${options.type}`,

        };
        let tags = channelObj.availableTags;
        let tag = tags.find((t) => t.name == "LFG");
        let t = await channelObj.threads.create(forumMessage);
        t.setAppliedTags([tag.id]);
        t.members.add(u.id);
        this.database.createLfg(u.id, t.id);
        return message.reply("LFG message created");
    }
    private createLFGEmbed(type: string, message: string, user: GuildMember) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`${user.displayName} - ${type}`)
            .setThumbnail(`${user.displayAvatarURL({ extension: "png", size: 512 })}`)
            .addFields(
                {
                    name: "Categoria",
                    value: type,
                },
                {
                    name: 'Messaggio',
                    value: `${message}`,
                }
            )
        return embed;
    }
    @Subcommand({
        name: "stop",
        description: "Stop looking for a group",
    })
    private async stopLfg(@Context() [message]: SlashCommandContext) {
        if (!this.checkPermissions(message.member as GuildMember)) {
            return message.reply("You are not authorized to use this command");
        }
        let role = await this.database.getSettingByKey("lfg_role");
        let u = message.member as GuildMember;
        if (u.roles.cache.has(role.value)) {
            u.roles.remove(role.value);
        }
        let user = await this.database.getLfgForUser(u.id);
        if(!user) return message.reply("You are not looking for a group");
        let channel = this.client.channels.cache.get(user.threadId) as ThreadChannel;
        if (channel) {
            await channel.delete();
        }
        this.database.deleteLfg(u.id);
        return message.reply("You are no longer looking for a group");
    }





    private async checkPermissions(user: GuildMember) {
        let authorized = await this.database.getSettingByKey("lfg_authorized_role");
        if (!authorized) return false;
        return user.roles.cache.has(authorized.value);

    }
}

@LfgSlashGroup({
    defaultMemberPermissions: ["Administrator", "ManageGuild"],
    name: "admin",
    description: "Admin commands",
})
@Injectable()
export class LfgAdminService {
    constructor(
        private database: DatabaseService,

    ) { }
    @Subcommand({
        name: "configure",
        description: "Configure the LFG settings",

    })
    public async configureLfg(@Context() [message]: SlashCommandContext, @Options() options: LFGConfigurationDTO) {

        await this.database.saveSetting("lfg_authorized_role", options.authorized.id);
        await this.database.saveSetting("lfg_channel", options.channel.id);
        await this.database.saveSetting("lfg_role", options.lfg.id);
        return message.reply("LFG configuration saved");
    }
}