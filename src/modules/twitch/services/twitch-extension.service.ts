import { Injectable } from "@nestjs/common";
import { StaticAuthProvider } from "@twurple/auth";
import { ChatClient } from "@twurple/chat";
import { PubSubClient } from "@twurple/pubsub";

@Injectable()
export class TwitchExtensionService {


    private code:string;
    private accessToken:string;
    private chatClient:ChatClient;
    private pubSubClient:PubSubClient;

    constructor() {

    }

    public buildAuthUrl() : string{
        let url = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT}&redirect_uri=http://localhost:3001/callback&response_type=code&scope=chat:read+chat:edit`
        return url;
    }

    public async completeAuth(code:string) : Promise<boolean>{
        this.code = code;
        let url = `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT}&client_secret=${process.env.TWITCH_SECRET}&code=${this.code}&grant_type=authorization_code&redirect_uri=http://localhost:3001/callback`
        let res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        if(res.ok){
            let data = await res.json();
            this.accessToken = data.access_token;
            await this.startServices();
            return true;
        }else{
            return false;
        }
    }

    public async startServices(){
        const authProvider = new StaticAuthProvider(process.env.TWITCH_CLIENT, this.accessToken);   
        this.chatClient = new ChatClient({authProvider: authProvider, channels: ['thevandev']});
        this.pubSubClient = new PubSubClient({authProvider: authProvider});
        await this.chatClient.connect();
        this.chatClient.onMessage((channel, user, message, msg) => {
            console.log(`${channel} - ${user} - ${message}`);
            
        });
    }

}