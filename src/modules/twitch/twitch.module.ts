import { Module } from "@nestjs/common";
import { TwitchController } from "../twitch/controllers/TwitchController.controller";
import { TwitchExtensionService } from "../twitch/services/twitch-extension.service";
import { HttpModule } from "@nestjs/axios";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
    imports: [
        HttpModule,
        ScheduleModule.forRoot(),
    ],
    controllers: [TwitchController],
    providers: [ TwitchExtensionService],
})
export class TwitchModule {}