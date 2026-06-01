const { Client, GatewayIntentBits } = require('discord.js');
const {
    joinVoiceChannel,
    VoiceConnectionStatus
} = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let connection = null;
let reconnecting = false;

let lastWhenYaReply = 0;
let spamCombo = 0;

const normalReplies = [
    'when ya mulu kampoeng',
    'kerja dulu kampoeng',
    'sabar dikit kampoeng',
    'nanya when ya terus kampoeng',
    'gue juga ga tau kampoeng',
    'besok tanya lagi kampoeng',
    'yang lain ada pertanyaan? kampoeng'
];

const spamReplies = [
    'ga usah spam gua kampoeng',
    'baru juga dijawab kampoeng',
    'sabar napa kampoeng',
    'nanya mulu kampoeng',
    'otak when ya doang kampoeng',
    'cooldown dulu kampoeng',
    'udah gue jawab kampoeng',
    'ga capek nanya kampoeng',
    'coba baca chat sebelumnya kampoeng'
];

async function connectToVoice() {
    try {
        console.log('Attempting voice connection...');

        const guild = await client.guilds.fetch(process.env.GUILD_ID);

        connection = joinVoiceChannel({
            channelId: process.env.CHANNEL_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: true
        });

        console.log('Voice connection created');

        connection.on('stateChange', (oldState, newState) => {
            console.log(
                `VOICE: ${oldState.status} -> ${newState.status}`
            );

            if (
                newState.status === VoiceConnectionStatus.Disconnected ||
                newState.status === VoiceConnectionStatus.Destroyed
            ) {
                reconnect();
            }
        });
    } catch (err) {
        console.error('Voice connection error:', err);
        reconnect();
    }
}

function reconnect() {
    if (reconnecting) return;

    reconnecting = true;

    console.log('Reconnecting in 10 seconds...');

    try {
        if (connection) {
            connection.destroy();
        }
    } catch (err) {
        console.error(err);
    }

    setTimeout(async () => {
        reconnecting = false;
        await connectToVoice();
    }, 10000);
}

client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    await connectToVoice();

    // Check every minute that the connection still exists
    setInterval(() => {
        try {
            if (
                !connection ||
                connection.state.status ===
                    VoiceConnectionStatus.Destroyed
            ) {
                console.log('Voice connection missing');
                reconnect();
            }
        } catch (err) {
            console.error(err);
        }
    }, 60000);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();

    if (!content.includes('when ya')) return;

    const now = Date.now();

    if (now - lastWhenYaReply < 10000) {
        spamCombo++;

        let reply;

        switch (spamCombo) {
            case 1:
                reply =
                    spamReplies[
                        Math.floor(
                            Math.random() * spamReplies.length
                        )
                    ];
                break;

            case 2:
                reply = 'masih aja kampoeng';
                break;

            case 3:
                reply = 'cari hobi sana kampoeng';
                break;

            case 4:
                reply = 'mute nih lama lama kampoeng';
                break;

            case 5:
                reply = '🩴';
                break;

            default:
                reply =
                    ['🩴', '🚪', '🙄', '💀', 'kampoeng.'][
                        Math.floor(Math.random() * 5)
                    ];
        }

        await message.reply(reply);
        return;
    }

    spamCombo = 0;
    lastWhenYaReply = now;

    const reply =
        normalReplies[
            Math.floor(Math.random() * normalReplies.length)
        ];

    await message.reply(reply);
});

client.on('error', console.error);
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

console.log('=== BOT STARTING ===');
console.log('TOKEN exists:', !!process.env.TOKEN);
console.log('GUILD_ID:', process.env.GUILD_ID);
console.log('CHANNEL_ID:', process.env.CHANNEL_ID);

client.login(process.env.TOKEN);
