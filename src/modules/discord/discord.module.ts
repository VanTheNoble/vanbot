import { Module } from "@nestjs/common";
import { ActivityType, IntentsBitField } from "discord.js";
import { NecordModule } from "necord";
import { UtilsService } from "./services/utils.service";
import { FunService } from "./services/fun.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TwitchProfile } from "./entities/twitch.entity";
import { TwitchService } from "./services/twitch.service";
import { Settings } from "./entities/discord.entity";
import { ScheduleModule } from "@nestjs/schedule";
import { HttpModule } from "@nestjs/axios";
import { DatabaseService } from "./services/database.service";
import { WelcomeService } from "./services/welcome.service";
import { PresenceService } from "./services/presence.service";
import { WelcomeCardService } from "./utilities/WelcomeCard.service";
import { LFG } from "./entities/lfg.entity";
import { LfgAdminService, LfgService } from "./services/lfg.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([TwitchProfile, Settings, LFG]),
        NecordModule.forRoot({
            token: process.env.DISCORD_TOKEN,
            prefix: "v!",
            development: [process.env.GUILD_ID],
            intents: [
                IntentsBitField.Flags.Guilds, 
                IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.GuildMembers,
                IntentsBitField.Flags.MessageContent,
                IntentsBitField.Flags.GuildPresences
            ],
            presence: {
                activities: [
                    {
                        name: "v!help",
                        type: ActivityType.Watching,
                        state: "the server",
                    }
                ],
                status: "online"
            }
        }),
        HttpModule,
        ScheduleModule.forRoot(),
    ],
    providers: [ FunService,WelcomeService,LfgService,LfgAdminService, WelcomeCardService,PresenceService, TwitchService, DatabaseService, UtilsService],
})
export class DiscordModule {}