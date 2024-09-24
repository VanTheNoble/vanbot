import { StringOption } from 'necord';
import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm';

@Entity({
    name: "twitch"
})
export class TwitchProfile {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    channelName: string;
    @Column()
    isOnline: boolean;
    @Column()
    lastMessage: string;
}
