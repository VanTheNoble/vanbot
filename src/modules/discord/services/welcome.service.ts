import { Injectable } from "@nestjs/common";
import { Context, ContextOf, createCommandGroupDecorator, On, Options, SlashCommandContext, Subcommand } from "necord";
import { WelcomeConfigurationDTO } from "../models/slash.dtos";
import { ChannelManager, Client, GuildMember, PartialGuildMember, TextChannel } from "discord.js";
import { DatabaseService } from "./database.service";
import { WelcomeCardService } from "../utilities/WelcomeCard.service";
export const WelcomeSlashGroup = createCommandGroupDecorator({
    name: "welcome",
    description: "Welcome commands",
    guilds: [process.env.GUILD_ID],
    defaultMemberPermissions: ["Administrator", "ManageGuild"],
});


@WelcomeSlashGroup()
@Injectable()
export class WelcomeService {
 
    constructor(
        private readonly client: Client,
        private readonly channels: ChannelManager,
        private readonly databaseService: DatabaseService,
        private readonly welcomeCardService: WelcomeCardService,
    ){}

    @Subcommand({
        name: "activate",
        description: "Activate the welcome message",
    })
    public async activateWelcome(@Context() [message]: SlashCommandContext) {
        await this.databaseService.saveSetting("welcome_active", "true");
        return message.reply("Welcome message activated");
    }

    @Subcommand({
        name: "deactivate",
        description: "Deactivate the welcome message",
    })
    public async deactivateWelcome(@Context() [message]: SlashCommandContext) {
        await this.databaseService.saveSetting("welcome_active", "false");
        return message.reply("Welcome message deactivated");
    }

    @Subcommand({
        name: "test",
        description: "Test the welcome message",
    })
    public async testWelcome(@Context() [message]: SlashCommandContext) {
        this.welcomeUser(message.member as GuildMember);
        this.goodbyeUser(message.member as GuildMember);
        return message.reply("Test message sent");
    }

   


    @Subcommand({
        name: "configure",
        description: "Configure the welcome message",
    })
    public async configureWelcome(@Context() [message]: SlashCommandContext, @Options() options: WelcomeConfigurationDTO) {
        await this.databaseService.saveSetting("welcome_message", options.welcome);
        await this.databaseService.saveSetting("welcome_channel", options.channel.id);
        await this.databaseService.saveSetting("goodbye_message", options.goodbye);
        return message.reply("Welcome message configured");
    }

    @On("guildMemberEntered")
    public async onGuildMemberEntered(@Context() [member]: ContextOf<"guildMemberEntered">) {
        let active = await this.databaseService.getSettingByKey("welcome_active");
        if(!(active && active.value === "true")){
            return;
        }
        this.welcomeUser(member);
        
    }

    @On("guildMemberRemove")
    public async onGuildMemberRemove(@Context() [member]: ContextOf<"guildMemberRemove">) {
        let active = await this.databaseService.getSettingByKey("welcome_active");
        if(!(active && active.value === "true")){
            return;
        }
        this.goodbyeUser(member);
    }

    private async welcomeUser(member: GuildMember){
        let message = await this.databaseService.getSettingByKey("welcome_message");
        let channel = await this.databaseService.getSettingByKey("welcome_channel");
        if(message && channel){
            let c = this.channels.resolve(channel.value) as TextChannel;
            if(c){
                const welcomeBuffer = await this.buildWelcomeMessage(member, message.value);
                c.send({files: [welcomeBuffer]});
            }
        }
    }

    private async goodbyeUser(member: GuildMember | PartialGuildMember){
        let message = await this.databaseService.getSettingByKey("goodbye_message");
        let channel = await this.databaseService.getSettingByKey("welcome_channel");
        if(message && channel){
            let c = this.channels.resolve(channel.value) as TextChannel;
            if(c){
                const welcomeBuffer = await this.buildGoodbyeMessage(member, message.value);
                c.send({files: [welcomeBuffer]});
            }
        }
    }

    private buildGoodbyeMessage(member: GuildMember | PartialGuildMember, message: string){

        let avatarUrl =member.user.displayAvatarURL({extension: "png", size: 256});
        const welcomeCard = this.welcomeCardService.buildCard(
            member.user.displayName,avatarUrl,message, "");
            return welcomeCard;
    }

    private buildWelcomeMessage(member: GuildMember, message: string){
        let avatarUrl =member.user.displayAvatarURL({extension: "png", size: 256});
        const welcomeCard = this.welcomeCardService.buildCard(
            member.user.displayName,avatarUrl,message, "");
            return welcomeCard;
    }
    
}