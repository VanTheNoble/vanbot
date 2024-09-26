import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "guild"})
export class GuildEntity{
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    guildId: string; 
    @Column()
    guildName: string;
}