const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlink')
        .setDescription('Unlink yourself.')
        .setDMPermission(false),

    async execute(interaction) {

        const guildId = interaction.guild.id;
        const user = interaction.member;
        const members = await db.get(`${guildId}.members`);

        await interaction.deferReply({ ephemeral: true });

        // Verify whether member is actually linked
        const filter = members.filter(member => member.id === user.id);
        if (Object.entries(filter).length === 0) {
            await interaction.followUp({ content: ':x: You\'re not linked to a Minecraft account.' });
            return;
        }

        // Remove member from database
        await db.set(`${guildId}.members`, members.filter(member => member.id !== user.id))
            .then(async () => await interaction.followUp({content: `:white_check_mark: You've successfully unlinked your Discord profile!`}))
            .catch(() => interaction.followUp({content: `:x: An error occured.`}));

        // Remove assigned roles related to the bot from member
        interaction.guild.members.fetch(user.id).then(async guildMember => {
            const roles = await db.get(`${guildId}.roles`);
            for (let rolesKey in roles) await guildMember.roles.remove(roles[rolesKey]);
        }).catch(err => console.warn(err));

    }
}