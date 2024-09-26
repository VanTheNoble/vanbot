import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "lfg"})
export class LFG{
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    userId: string;
    @Column()
    createdAt: Date = new Date();
    @Column()
    threadId: string;
    @Column()
    guild: string;
}