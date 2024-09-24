import { Injectable } from "@nestjs/common";
import { AutocompleteInteraction } from "discord.js";
import { AutocompleteInterceptor } from "necord";

@Injectable()
export class LfgInterceptor extends AutocompleteInterceptor{
    transformOptions(interaction: AutocompleteInteraction) {
        const focused = interaction.options.getFocused(true);
        let choices: string[] = [];
        console.log(focused.name);
        if(focused.name === "type"){
            choices = ["Cerco Gruppo", "Cerco Giocatori", "Cerco DM", "Cerco Altro"];
        }
        return interaction.respond(
            choices.filter(choice => choice.toLowerCase().startsWith(focused.value.toString().toLowerCase())).map(choice => ({name: choice, value: choice}))
        );
    }

}