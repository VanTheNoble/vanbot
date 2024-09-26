import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "notifications"})
export class Notifications {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    guild: string;
    @Column()
    twitchId: number;
    @Column()
    message: string;
}