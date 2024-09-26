import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TwitchProfile } from "../entities/twitch.entity";
import { Settings } from "../entities/discord.entity";
import { Repository } from "typeorm";
import { LFG } from "../entities/lfg.entity";
import { Notifications } from "../entities/notifications.entity";
import { GuildEntity } from "../entities/guild.entity";

@Injectable()
export class DatabaseService {
    
    constructor(
        @InjectRepository(TwitchProfile)
        private readonly twitchRepository: Repository<TwitchProfile>,
        @InjectRepository(Settings)
        private readonly settingsRepository: Repository<Settings>,
        @InjectRepository(LFG)
        private readonly lfgRepository: Repository<LFG>,
        @InjectRepository(Notifications)
        private readonly notificationsRepository: Repository<Notifications>,
        @InjectRepository(GuildEntity)
        private readonly guildRepository: Repository<GuildEntity>,

    ) {}

    ///TWITCH DB
    public async findTwitchUser(channelName: string, guild:string): Promise<TwitchProfile | undefined>{
        return await this.twitchRepository.findOneBy({ channelName: channelName, guild: guild });
    }

    public async addTwitchUser(channelName: string, guild: string): Promise<TwitchProfile>{
        return await this.twitchRepository.save({
            channelName: channelName,
            isOnline: false,
            guild: guild
        });
    }
    public async updateTwitchUser(user: TwitchProfile): Promise<TwitchProfile>{
        return await this.twitchRepository.save(user);
    }
    public async deleteTwitchUser(channelName: string, guild: string): Promise<boolean>{
        let u = await this.twitchRepository.findOneBy({ channelName: channelName, guild: guild });
        if(u){
            await this.twitchRepository.remove(u);
            return true;
        }
        return false;
    }

    public async findAllTwitchUsers(): Promise<TwitchProfile[]>{
        return await this.twitchRepository.find();
    }

    public async findAllTwitchUsersForGuild(guild: string): Promise<TwitchProfile[]>{
        return await this.twitchRepository.findBy({guild: guild});
    }
    ///SETTINGS DB
    public async getSettingByKey(key: string, guild: string): Promise<Settings | undefined>{
        return await this.settingsRepository.findOneBy({ key: key, guild: guild });
    }
    public async saveSetting(key: string, value: string, guild: string): Promise<Settings>{
        let settings = await this.settingsRepository.findOneBy({ key: key, guild: guild });
        if(settings){
            settings.value = value;
            return await this.settingsRepository.save(settings);
        }
        return await this.settingsRepository.save({
            key: key,
            value: value,
            guild: guild
        });
    }

    //LFG DB
    public async getLfgForUser(userId: string, guild: string): Promise<LFG | undefined>{
        return await this.lfgRepository.findOneBy({ userId: userId, guild: guild });
    }

    public async createLfg(userId: string, threadId: string, guild: string): Promise<LFG>{
        var lfg = new LFG();
        lfg.userId = userId;
        lfg.threadId = threadId;
        lfg.createdAt = new Date();
        lfg.guild = guild;
        return await this.lfgRepository.save(lfg);
    }

    public async deleteLfg(userId: string, guild: string): Promise<boolean>{
        let lfg = await this.lfgRepository.findBy({ userId: userId, guild: guild });
        if(lfg){
            await this.lfgRepository.remove(lfg);
            return true;
        }
        return false;
    }

    public async getGuilds(): Promise<GuildEntity[]>{
        return await this.guildRepository.find();
    }

    public async createNotification(message: string, guild: string, twitchId: number): Promise<Notifications>{
        var notification = new Notifications();
        notification.guild = guild;
        notification.twitchId = twitchId;
        notification.message = message;
        return await this.notificationsRepository.save(notification);
    }

    public async deleteNotification(guild: string, twitchId: number): Promise<boolean>{
        let notification = await this.notificationsRepository.findOneBy({ guild: guild, twitchId: twitchId });
        if(notification){
            await this.notificationsRepository.remove(notification);
            return true;
        }
        return false;
    }
    public async getNotification(guild: string, twitchId: number): Promise<Notifications | undefined>{
        return await this.notificationsRepository.findOneBy({ guild: guild, twitchId: twitchId });
    }
}