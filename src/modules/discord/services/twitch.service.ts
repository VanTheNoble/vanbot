import { Injectable, Logger } from "@nestjs/common";
import { Context, createCommandGroupDecorator, On, Options, SlashCommand, SlashCommandContext, Subcommand, TextCommand, TextCommandContext } from "necord";
import { TwitchConfigurationDTO, TwitchProfileDto } from "../models/slash.dtos";
import { Cron } from "@nestjs/schedule";
import { ChannelManager, Client, EmbedBuilder, roleMention, TextChannel } from "discord.js";
import { DatabaseService } from "./database.service";
import { AppTokenAuthProvider } from "@twurple/auth";
import { ApiClient, HelixStream, HelixUser } from "@twurple/api";
import { UtilsService } from "./utils.service";
export const TwitchCommandDecorator = createCommandGroupDecorator({
    name: "twitch",
    description: "Twitch commands",
    guilds: [process.env.GUILD_ID, process.env.VAN_GUILD_ID],
    defaultMemberPermissions: ["Administrator", "ManageGuild"],
});

@TwitchCommandDecorator()
@Injectable()
export class TwitchService {

    private readonly logger = new Logger(TwitchService.name);
    private authProvider: AppTokenAuthProvider;
    private apiClient: ApiClient;

    constructor(
        private readonly client: Client,
        private readonly channels: ChannelManager,
        private readonly databaseService: DatabaseService,
        private readonly utilsService: UtilsService,
    ) {
        this.authProvider = new AppTokenAuthProvider(process.env.TWITCH_CLIENT, process.env.TWITCH_SECRET);
        this.apiClient = new ApiClient({ authProvider: this.authProvider });
        setTimeout(() => {
            this.utilsService.registerCommands();
        }, 10000);
    }

    @Subcommand({
        name: "add",
        description: "Add a twitch user to the database",
    })
    public async addTwitch(@Context() [message]: SlashCommandContext,
        @Options() options: TwitchProfileDto) {

        let u = await this.databaseService.findTwitchUser(options.username, message.guild.id);
        if (u) {
            return message.reply({ content: "User already exists", options: { reply: { messageReference: message.id } } }).then(msg => {
                setTimeout(() => msg.delete(), 10000)
            })
                .catch(() => { });
        }
        else {
            await this.databaseService.addTwitchUser(options.username, message.guild.id);
            return message.reply("User added").then(msg => {
                setTimeout(() => msg.delete(), 10000)
            })
                .catch(() => { });
        }
    }


    @Subcommand({
        name: "remove",
        description: "Remove a twitch user from the database",
    })
    public async removeTwitch(@Context() [message]: SlashCommandContext, @Options() options: TwitchProfileDto) {
        let deleted = await this.databaseService.deleteTwitchUser(options.username, message.guild.id);
        if (deleted) {
            return message.reply({ content: "User removed", options: { reply: { messageReference: message.id } } }).then(msg => {
                setTimeout(() => msg.delete(), 10000)
            })
                .catch(() => { });
        }
        else {
            return message.reply({ content: "User not found", options: { reply: { messageReference: message.id } } }).then(msg => {
                setTimeout(() => msg.delete(), 10000)
            })
                .catch(() => { });
        }
    }

    @Subcommand({
        name: "list",
        description: "List all twitch users",
    })
    public async listTwitch(@Context() [message]: SlashCommandContext) {
        let users = await this.databaseService.findAllTwitchUsersForGuild(message.guild.id);
        let messageToSend = "**Twitch users:**\n";
        users.forEach(u => {
            messageToSend += `${u.channelName}\n`;
        });
        return message.reply(messageToSend).then(msg => {
            setTimeout(() => msg.delete(), 30000)
        })
            .catch(() => { });;
    }

    @Subcommand({
        name: "configure",
        description: "Configure twitch notifications",
    })
    public async setTwitchNotification(@Context() [message]: SlashCommandContext, @Options() options: TwitchConfigurationDTO) {
        await this.databaseService.saveSetting("twitch_notification_channel", options.channel.id, message.guild.id);
        await this.databaseService.saveSetting("twitch_notification_role", options.role.id, message.guild.id);

        return message.reply("Notification channel set").then(msg => {
            setTimeout(() => msg.delete(), 10000)
        })
            .catch(() => { });
    }

    @Subcommand({
        name: "check",
        description: "Check twitch users",
    })
    public async checkTwitchCommand(@Context() [message]: SlashCommandContext) {
        this.checkForGuild(message.guild.id);
        return message.reply("Checking twitch users").then(msg => {
            setTimeout(() => msg.delete(), 10000)
        })
            .catch(() => { });
    }

    @Cron("*/5 * * * *")
    public async checkTwitch() {

        this.twitchCheck();
    }

    private async checkForGuild(guild: string){
        let users = await this.databaseService.findAllTwitchUsersForGuild(guild);
        let g = (await this.databaseService.getGuilds()).filter(g => g.guildId == guild)[0];
        if (!g) return;
        let guildSettings = {};
        this.logger.log(`Getting settings for guild ${g.guildId}`);
        let settingsChannel = await this.databaseService.getSettingByKey("twitch_notification_channel", g.guildId);
        let settingsRole = await this.databaseService.getSettingByKey("twitch_notification_role", g.guildId);
        if(!settingsChannel || !settingsRole){
            this.logger.log(`Settings not found for guild ${g.guildId}`);
            return;
        };
        guildSettings[g.guildId] = {
            channel: settingsChannel.value,
            role: settingsRole.value
        };
        
        for (let user of users) {
            const settings = guildSettings[user.guild];
            if(!settings){ 
                this.logger.log(`Settings not found for guild ${user.guild}`);    
                continue;
            }
            this.apiClient.streams.getStreamByUserName(user.channelName).then(async stream => {
                let guild = this.client.guilds.cache.get(user.guild);
                    if(!guild) return;
                    let notification = await this.databaseService.getNotification(user.guild, user.id);
                if (stream) {
                    
                    if (!notification) {
                        this.logger.log(`user is flagged offline so we can proceed`);
                        const broadcaster = await stream.getUser();
                        
                        let channel = guild.channels.cache.get(settings.channel) as TextChannel;
                        const emb = this.buildStreamEmbed(stream, broadcaster);
                        let mention = "";

                        if (settings.role) {
                            mention = roleMention(settings.role);
                        }
                        let message = await channel.send({ content: `Hey ${mention}! ${broadcaster.displayName} è live!`, embeds: [emb] });
                        this.databaseService.createNotification(message.id,user.guild,  user.id);
                        this.databaseService.updateTwitchUser(user);
                    }
                }
                else {
                    if (notification) {
                        
                        let channel = guild.channels.cache.get(settings.channel) as TextChannel;
                        let message = channel.messages.fetch(notification.message);
                        message.then(m => m.delete());
                        this.databaseService.deleteNotification(user.guild, user.id);
                        this.databaseService.updateTwitchUser(user);
                    }
                }
            });
        }

    }

    private async twitchCheck() {
        let users = await this.databaseService.findAllTwitchUsers();
        let guilds = await this.databaseService.getGuilds();
        let guildSettings = {};
        for(let g of guilds){
            this.logger.log(`Getting settings for guild ${g.guildId}`);
            let settingsChannel = await this.databaseService.getSettingByKey("twitch_notification_channel", g.guildId);
            let settingsRole = await this.databaseService.getSettingByKey("twitch_notification_role", g.guildId);
            if(!settingsChannel || !settingsRole){
                this.logger.log(`Settings not found for guild ${g.guildId}`);
                continue;
            };
            guildSettings[g.guildId] = {
                channel: settingsChannel.value,
                role: settingsRole.value
            };
        }
        console.log(JSON.stringify(guildSettings));
        for (let user of users) {
            const settings = guildSettings[user.guild];
            if(!settings){ 
                this.logger.log(`Settings not found for guild ${user.guild}`);    
                continue;
            }
            this.apiClient.streams.getStreamByUserName(user.channelName).then(async stream => {
                let guild = this.client.guilds.cache.get(user.guild);
                    if(!guild) return;
                    let notification = await this.databaseService.getNotification(user.guild, user.id);
                if (stream) {
                    
                    if (!notification) {
                        this.logger.log(`user is flagged offline so we can proceed`);
                        const broadcaster = await stream.getUser();
                        
                        let channel = guild.channels.cache.get(settings.channel) as TextChannel;
                        const emb = this.buildStreamEmbed(stream, broadcaster);
                        let mention = "";

                        if (settings.role) {
                            mention = roleMention(settings.role);
                        }
                        let message = await channel.send({ content: `Hey ${mention}! ${broadcaster.displayName} è live!`, embeds: [emb] });
                        this.databaseService.createNotification(message.id,user.guild,  user.id);
                        this.databaseService.updateTwitchUser(user);
                    }
                }
                else {
                    if (notification) {
                        
                        let channel = guild.channels.cache.get(settings.channel) as TextChannel;
                        let message = channel.messages.fetch(notification.message);
                        message.then(m => m.delete());
                        this.databaseService.deleteNotification(user.guild, user.id);
                        this.databaseService.updateTwitchUser(user);
                    }
                }
            });
        }

    }

    private buildStreamEmbed(stream: HelixStream, broadcaster: HelixUser) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`${stream.title}`)
            .setThumbnail(`${broadcaster.profilePictureUrl}`)
            .setURL(`https://twitch.tv/${broadcaster.name}`)
            .setImage(`${stream.getThumbnailUrl(800, 600)}`)
            .addFields(
                {
                    name: "Categoria",
                    value: stream.gameName,
                },
                {
                    name: 'View',
                    value: `${stream.viewers}`,
                }
            )
        return embed;
    }





}