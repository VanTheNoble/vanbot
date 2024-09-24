import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TwitchProfile } from "../entities/twitch.entity";
import { Settings } from "../entities/discord.entity";
import { Repository } from "typeorm";
import { LFG } from "../entities/lfg.entity";

@Injectable()
export class DatabaseService {
    
    constructor(
        @InjectRepository(TwitchProfile)
        private readonly twitchRepository: Repository<TwitchProfile>,
        @InjectRepository(Settings)
        private readonly settingsRepository: Repository<Settings>,
        @InjectRepository(LFG)
        private readonly lfgRepository: Repository<LFG>,
    ) {}

    ///TWITCH DB
    public async findTwitchUser(channelName: string): Promise<TwitchProfile | undefined>{
        return await this.twitchRepository.findOneBy({ channelName: channelName });
    }

    public async addTwitchUser(channelName: string): Promise<TwitchProfile>{
        return await this.twitchRepository.save({
            channelName: channelName,
            isOnline: false,
            lastMessage: ""
        });
    }
    public async updateTwitchUser(user: TwitchProfile): Promise<TwitchProfile>{
        return await this.twitchRepository.save(user);
    }
    public async deleteTwitchUser(channelName: string): Promise<boolean>{
        let u = await this.twitchRepository.findOneBy({ channelName: channelName });
        if(u){
            await this.twitchRepository.remove(u);
            return true;
        }
        return false;
    }


    public async findAllTwitchUsers(): Promise<TwitchProfile[]>{
        return await this.twitchRepository.find();
    }
    ///SETTINGS DB
    public async getSettingByKey(key: string): Promise<Settings | undefined>{
        return await this.settingsRepository.findOneBy({ key: key });
    }
    public async saveSetting(key: string, value: string): Promise<Settings>{
        let settings = await this.settingsRepository.findOneBy({ key: key });
        if(settings){
            settings.value = value;
            return await this.settingsRepository.save(settings);
        }
        return await this.settingsRepository.save({
            key: key,
            value: value
        });
    }

    //LFG DB
    public async getLfgForUser(userId: string): Promise<LFG | undefined>{
        return await this.lfgRepository.findOneBy({ userId: userId });
    }

    public async createLfg(userId: string, threadId: string): Promise<LFG>{
        var lfg = new LFG();
        lfg.userId = userId;
        lfg.threadId = threadId;
        lfg.createdAt = new Date();
        return await this.lfgRepository.save(lfg);
    }

    public async deleteLfg(userId: string): Promise<boolean>{
        let lfg = await this.lfgRepository.findBy({ userId: userId });
        if(lfg){
            await this.lfgRepository.remove(lfg);
            return true;
        }
        return false;
    }
}