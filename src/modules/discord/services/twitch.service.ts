import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TwitchProfile } from "../entities/twitch.entity";
import { In, Repository } from "typeorm";
import { Arguments, Context, ContextOf, createCommandGroupDecorator, On, Options, SlashCommand, SlashCommandContext, Subcommand, TextCommand, TextCommandContext } from "necord";
import { ChannelDto, TwitchConfigurationDTO, TwitchProfileDto } from "../models/slash.dtos";
import { Settings } from "../entities/discord.entity";
import { Cron } from "@nestjs/schedule";
import { ChannelManager, Client, EmbedBuilder, roleMention, TextChannel } from "discord.js";
import { DatabaseService } from "./database.service";
import { AppTokenAuthProvider } from "@twurple/auth";
import { ApiClient, HelixStream, HelixUser } from "@twurple/api";
import { UtilsService } from "./utils.service";
export const TwitchCommandDecorator = createCommandGroupDecorator({
    name: "twitch",
    description: "Twitch commands",
    guilds: [process.env.GUILD_ID],
    defaultMemberPermissions: ["Administrator", "ManageGuild"],
});

@TwitchCommandDecorator()
@Injectable()
export class TwitchService {

    private readonly logger = new Logger(TwitchService.name);
    private authProvider : AppTokenAuthProvider;
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
        
        let u = await this.databaseService.findTwitchUser(options.username);
        if(u){
            return message.reply({content: "User already exists",options: {reply: {messageReference: message.id}}});
        }
        else{
            await this.databaseService.addTwitchUser(options.username); 
            return message.reply("User added");
        }
    }


    @Subcommand({
        name: "remove",
        description: "Remove a twitch user from the database",
    })    
    public async removeTwitch(@Context() [message]: SlashCommandContext, @Options() options: TwitchProfileDto) {
        let deleted = await this.databaseService.deleteTwitchUser(options.username);
        if(deleted){
            return message.reply({ content: "User removed", options: {reply: {messageReference: message.id}}});
        }
        else{
            return message.reply({content: "User not found",options: {reply: {messageReference: message.id}}});
        }
    }

    @Subcommand({
        name: "list",
        description: "List all twitch users",
    })
    public async listTwitch(@Context() [message]: SlashCommandContext) {
        let users = await this.databaseService.findAllTwitchUsers();
        let messageToSend = "**Twitch users:**\n";
        users.forEach(u => {
            messageToSend += `${u.channelName}\n`;
        });
        return message.reply(messageToSend);
    }

    @Subcommand({
        name: "configure",
        description: "Configure twitch notifications",
    })
    public async setTwitchNotification(@Context() [message]: SlashCommandContext, @Options() options: TwitchConfigurationDTO) {
        await this.databaseService.saveSetting("twitch_notification_channel", options.channel.id);
        await this.databaseService.saveSetting("twitch_notification_role", options.role.id);
       
        return message.reply("Notification channel set");
    }

    @Subcommand({
        name: "check",
        description: "Check twitch users",
    })
    public async checkTwitchCommand(@Context() [message]: SlashCommandContext) {
        this.twitchCheck();
        return message.reply("Checking twitch users");
    }

    @Cron("*/5 * * * *")
    public async checkTwitch() {
        
        this.twitchCheck();
    }

    private async twitchCheck(){
        let users = await this.databaseService.findAllTwitchUsers();
        let settingsChannel = await this.databaseService.getSettingByKey("twitch_notification_channel");
        let settingsRole = await this.databaseService.getSettingByKey("twitch_notification_role");
        for(let user of users){
            this.apiClient.streams.getStreamByUserName(user.channelName).then(async stream => {
                if(stream){
                    if(!user.isOnline){
                        const broadcaster = await stream.getUser();
                        user.isOnline = true;
                        let channel = this.client.channels.cache.get(settingsChannel.value) as TextChannel;
                        const emb = this.buildStreamEmbed(stream, broadcaster);
                        let mention = "";
                        
                        if(settingsRole){
                            mention = roleMention(settingsRole.value);
                        }
                        let message = await channel.send({content: `Hey ${mention}! ${broadcaster.displayName} è live!`, embeds: [emb]});
                        user.lastMessage = message.id;
                        this.databaseService.updateTwitchUser(user);

                    }
                }
                else{
                    if(user.isOnline){
                        let channel = this.client.channels.cache.get(settingsChannel.value) as TextChannel;
                        let message = channel.messages.fetch(user.lastMessage);
                        message.then(m => m.delete());
                        user.isOnline = false;
                        user.lastMessage = "";
                        this.databaseService.updateTwitchUser(user);
                    }
                }
            });
        }

    }

    private buildStreamEmbed(stream: HelixStream, broadcaster: HelixUser){
        const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`${stream.title}`)
        .setThumbnail(`${broadcaster.profilePictureUrl}`)
        .setURL(`https://twitch.tv/${broadcaster.name}`)
        .setImage(`${stream.getThumbnailUrl(800,600)}`)
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