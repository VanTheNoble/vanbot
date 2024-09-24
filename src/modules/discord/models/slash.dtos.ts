import { Channel, ChannelType, ForumChannel, Role } from "discord.js";
import { ChannelOption, RoleOption, StringOption } from "necord";

export class TwitchProfileDto{
    @StringOption({name: "username", description: "The twitch username", required: true})
    username: string;
}

export class ChannelDto{
    @ChannelOption({
        name: "channel",
        description: "The channel to send the message",
        required: true
    })
    channel: Channel;
}

export class RoleDto{
    @RoleOption({
        name: "role",
        description: "The role to mention",
        required: true
    })
    role: Role;
}

export class TwitchConfigurationDTO{
    @ChannelOption({
        name: "channel",
        description: "The channel to send the message",
        required: true,
        channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement]
    })
    channel: Channel;

    @RoleOption({
        name: "role",
        description: "The role to mention",
        required: true
    })
    role: Role;
}

export class WelcomeConfigurationDTO{
    @ChannelOption({
        name: "channel",
        description: "The channel to send the message",
        required: true,
        channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement]
    })
    channel: Channel;

    @StringOption({
        name: "welcome",
        description: "The message to send",
        required: true
    })
    welcome: string;
    @StringOption({
        name: "goodbye",
        description: "The message to send",
        required: true
    })
    goodbye: string;

}

export class LFGConfigurationDTO{
    @RoleOption({
        name: "authorized",
        description: "The role authorized to use LFG",
        required: true
    })
    authorized: Role;
    @RoleOption({
        name: "lfg",
        description: "The role to give to users looking for a group",
        required: true
    })
    lfg: Role;
    @ChannelOption({
        name: "channel",
        description: "The channel to send the message",
        required: true,
        channel_types: [ChannelType.GuildForum]
    })
    channel: ForumChannel;
}

export class CreateLFGDTO{

    @StringOption({
        name: "type",
        description: "Specifica la tua ricerca",
        required: true,
        autocomplete: true
    })
    type: string;   

    @StringOption({
        name: "message",
        description: "Specifica la categoria o per cosa stai cercando gruppo",
        required: true
    })
    message: string;


}