import { StringOption } from 'necord';
import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm';

@Entity({
    name: "twitch"
})
export class TwitchProfile {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    guild: string;
    @Column()
    channelName: string;
}
