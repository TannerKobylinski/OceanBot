module.exports = [{
    name: 'obamna',
    description: 'soda',
    async execute(robot, interaction) {

        const path = `${robot.VIDEO_PATH}/obamna.mp4`
        await interaction.deferReply();
        await interaction.editReply({
            files: [
                path
            ]
        });
    },
}];
