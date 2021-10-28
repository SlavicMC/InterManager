const Discord = require('discord.js');
const Canvas = require('canvas');
const db = require('quick.db')
const config = require('./config.json');

let client = new Discord.Client()

console.log("Running...")

client.on('ready', async () => {
    console.log("Connected as " + client.user.tag)

    client.guilds.cache.forEach(function(guild)
    {
      guild.fetchInvites().then(async function(invites)
      {
        let uses = []
        invites.forEach(async function(inv)
        {
          let toPush = {code: inv.code, uses: inv.uses, inviterID: inv.inviter.id}
          uses.push(toPush)
        })
        await db.set(`invitesOfServer${guild.id}`, uses)
      }).catch(function () { })
    })
  setInterval(function() {
      var statusIndex = Math.floor(Math.random() * 8) + 1;
      if (statusIndex == 1) client.user.setActivity(client.guilds.cache.size + " servers already!")
      if (statusIndex == 2) client.user.setActivity(`Join our support server! Use "invite" command to get the invite.`)
      if (statusIndex == 3) client.user.setActivity(`${client.users.cache.get("772206026874945576").tag} is my owner!`)
      if (statusIndex == 4) client.user.setActivity(`My default prefix is "."!`)
      if (statusIndex == 5) client.user.setActivity(`Have a nice day! ;)`)
      if (statusIndex == 6) client.user.setActivity(`*praying to the Glorious Ryba*`)
      if (statusIndex == 7) client.user.setActivity(`My original purpose was to protect server "Interpact"!`)
      if (statusIndex == 8) client.user.setActivity(`I automatically change my nick after changing prefix!`)
    }, 1000 * 15);
})


process.on('unhandledRejection', error => {
  console.log(error);
});


client.on('channelCreate', async (channel) => { 
  if (channel.guild === null || channel.guild === undefined) return;
    const entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_CREATE'}).then(audit => audit.entries.first()).catch()
    let author;
    let wasBotUsed = false;
    if (entry.reason != null && entry.reason.includes('Fast action by:') && entry.executor.id == client.user.id)
    {
      let reasonSplited = entry.reason.split(" ")
      author = channel.guild.members.cache.get(reasonSplited[3]).user
      wasBotUsed = true;
    }
    else 
    {
      author = entry.executor;
      wasBotUsed = false;
    }
    let authorToSend = channel.guild.members.cache.get(author.id)
    let actionName = 'ChannelCreate'

    if (await db.fetch(`securityOfServer${channel.guild.id}`) == true)
    {
    await db.set(`actionPointsFor${actionName}InServer${channel.guild.id}`, 40)
    actionPoints(authorToSend, actionName, channel.guild)
    }


    let theExecutorParameter;
    if (wasBotUsed == true) 
    {
      theExecutorParameter = author.tag + " (by InterManager)"
    }
    if (wasBotUsed == false)
    {
      theExecutorParameter = author.tag 
    }

    if (await db.fetch(`idOfLoggingChannelOfServer${channel.guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${channel.guild.id}`)) != undefined)
    {
      await db.set(`fastActionsInServer${channel.guild.id}`, true) 
      let channelCreateLogEmbed;
      if (await db.fetch(`fastActionsInServer${channel.guild.id}`) != true) 
      {
        channelCreateLogEmbed = new Discord.MessageEmbed()
        .setColor('#32CD32')
        .setTitle('🆕 A channel got created!')
        .setDescription('Create data: ')
        .addFields(
          { name: "Channel: ", value: channel.guild.channels.cache.get(channel.id).toString() },
          { name: "Channel's ID: ", value: channel.id },
          { name: "Channel type: ", value: channel.type },
          { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
        )
        .setTimestamp()
      }
      else 
      {
        channelCreateLogEmbed = new Discord.MessageEmbed()
        .setColor('#32CD32')
        .setTitle('🆕 A channel got created!')
        .setDescription('Create data: ')
        .addFields(
          { name: "Channel: ", value: channel.guild.channels.cache.get(channel.id).toString() },
          { name: "Channel's ID: ", value: channel.id },
          { name: "Channel type: ", value: channel.type },
          { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
          { name: "Fast actions: ", value: `⬅️ - undo\n🔨 - ban executor` },
        )
        .setTimestamp()
      }


    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${channel.guild.id}`)).send(channelCreateLogEmbed)
    //console.log(channel)
    .then(async function(theEmbed)
    {
      if (await db.fetch(`fastActionsInServer${channel.guild.id}`) == true) 
      {
        fastActionsUse(theEmbed, channel.guild, authorToSend, actionName, channel, 0)

        /*
        let theBotMember = channel.guild.members.cache.get(client.user.id)
        theEmbed.react('⬅️')
        .then(theEmbed.react('🔨'))

        theEmbed.awaitReactions((reaction, user) => user.id != client.user.id && channel.guild.members.cache.get(user.id).hasPermission(['MANAGE_CHANNELS']) && channel.guild.me.hasPermission(['MANAGE_CHANNELS']) && (reaction.emoji.name == '⬅️'),
        { max: 1, time: 60000 * 5}).then(async function(collected) {
          let actionName = 'ChannelDelete'
            let theActionAuthor;
            collected.first().users.cache.forEach(function(user) 
            {
              if (user.id != client.user.id && channel.guild.members.cache.get(user.id).hasPermission(['MANAGE_CHANNELS'])) 
              {
                theActionAuthor = user
              }
            })
            if (theActionAuthor == undefined || theActionAuthor == null) return;
            channel.delete({reason: `Fast action ban by ${theActionAuthor.tag}!`}).catch(() => {
              console.log(`Something went wrong with fast action (roleCreate fast actions) deleting ${channel}!`)
            })

            if (await db.fetch(`securityOfServer${channel.guild.id}`) == true)
            {
            actionPoints(theActionAuthor, actionName, channel.guild)
            }

            theEmbed.reactions.cache.get('⬅️').remove()
          }).catch(() => 
          {
            theEmbed.reactions.cache.get('⬅️').remove()
          })
        theEmbed.awaitReactions((reaction, user) => user.id != client.user.id && channel.guild.members.cache.get(user.id).hasPermission(['BAN_MEMBERS']) && theBotMember.hasPermission(['BAN_MEMBERS']) && channel.guild.members.cache.get(authorToSend.id).roles.highest.position < theBotMember.roles.highest.position && channel.guild.members.cache.get(authorToSend.id).roles.highest.position < channel.guild.members.cache.get(user.id).roles.highest.position && authorToSend.id != channel.guild.ownerID && (reaction.emoji.name == '🔨'),
        { max: 1, time: 60000 * 5}).then(function(collected) {
          let theActionAuthor;
          collected.first().users.cache.forEach(function(user) 
          {
            if (user.id != client.user.id && channel.guild.members.cache.get(user.id).hasPermission(['BAN_MEMBERS']) && theBotMember.hasPermission(['BAN_MEMBERS']) && channel.guild.members.cache.get(authorToSend.id).roles.highest.position < theBotMember.roles.highest.position && channel.guild.members.cache.get(authorToSend.id).roles.highest.position < channel.guild.members.cache.get(user.id).roles.highest.position && authorToSend.id != channel.guild.ownerID) 
            {
              theActionAuthor = user
            }
          })
          if (theActionAuthor == undefined || theActionAuthor == null) return;
            authorToSend.ban({reason: `Fast action ban by ${theActionAuthor.tag}!`}).catch(() => {
              console.log(`Something went wrong with fast action (roleCreate fast actions) banning ${authorToSend.user.tag}!`)
            })
            //console.log(collected)
            theEmbed.reactions.cache.get('🔨').remove()
          }).catch(() => 
          {
            theEmbed.reactions.cache.get('🔨').remove()
          }) */
      }
    })
    }
  })


client.on('channelDelete', async (channel) => {
  const entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_DELETE'}).then(audit => audit.entries.first()).catch()
  let author;
  let wasBotUsed = false;
  if (entry.reason != null && entry.reason.includes('Fast action by:') && entry.executor.id == client.user.id)
  {
    let reasonSplited = entry.reason.split(" ")
    author = channel.guild.members.cache.get(reasonSplited[3]).user
    wasBotUsed = true;
  }
  else 
  {
    author = entry.executor;
    wasBotUsed = false;
  }
  let authorToSend = channel.guild.members.cache.get(author.id)
  let actionName = 'ChannelDelete'

  
  if (await db.fetch(`securityOfServer${channel.guild.id}`) == true)
  {
  await db.set(`actionPointsFor${actionName}InServer${channel.guild.id}`, 40)
  actionPoints(authorToSend, actionName, channel.guild)
  }


  let theExecutorParameter;
  if (wasBotUsed == true) 
  {
    theExecutorParameter = author.tag + " (by InterManager)"
  }
  if (wasBotUsed == false)
  {
    theExecutorParameter = author.tag 
  }

  if (await db.fetch(`idOfLoggingChannelOfServer${channel.guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${channel.guild.id}`)) != undefined)
  {
    await db.set(`fastActionsInServer${channel.guild.id}`, true) 
    let channelDeleteLogEmbed;
    if (await db.fetch(`fastActionsInServer${channel.guild.id}`) != true) 
    {
      channelDeleteLogEmbed = new Discord.MessageEmbed()
      .setColor('#FF6347')
      .setTitle('🗑️ A channel got deleted!')
      .setDescription('Delete data: ')
      .addFields(
        { name: "Channel's name: ", value: channel.name },
        { name: "Channel's ID: ", value: channel.id },
        { name: "Channel type: ", value: channel.type },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
      )
      .setTimestamp()
    }
    else 
    {
      channelDeleteLogEmbed = new Discord.MessageEmbed()
      .setColor('#FF6347')
      .setTitle('🗑️ A channel got deleted!')
      .setDescription('Delete data: ')
      .addFields(
        { name: "Channel's name: ", value: channel.name },
        { name: "Channel's ID: ", value: channel.id },
        { name: "Channel type: ", value: channel.type },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
        { name: "Fast actions: ", value: `⬅️ - undo\n🔨 - ban executor` },
      )
      .setTimestamp()
    }

    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${channel.guild.id}`)).send(channelDeleteLogEmbed)

    .then(async function(theEmbed)
    {
      if (await db.fetch(`fastActionsInServer${channel.guild.id}`) == true) 
      {
        fastActionsUse(theEmbed, channel.guild, authorToSend, actionName, channel, 0)
      }
    })
  }


})



client.on('channelUpdate', async (oldChannel, newChannel) => {
  const entry = await oldChannel.guild.fetchAuditLogs({type: 'CHANNEL_UPDATE'}).then(audit => audit.entries.first()).catch()
  //console.log(entry.reason)
  let author;
  let wasBotUsed = false;
  if (entry.reason != null && entry.reason.includes('Fast action by:') && entry.executor.id == client.user.id)
  {
    let reasonSplited = entry.reason.split(" ")
    author = newChannel.guild.members.cache.get(reasonSplited[3]).user
    wasBotUsed = true;
  }
  else 
  {
    author = entry.executor;
    wasBotUsed = false;
  }
  let authorToSend = oldChannel.guild.members.cache.get(author.id)
  let actionName = 'ChannelUpdate'

  if (oldChannel.name == newChannel.name && oldChannel.topic == newChannel.topic && oldChannel.rateLimitPerUser == newChannel.rateLimitPerUser && oldChannel.nsfw == newChannel.nsfw && oldChannel.type == newChannel.type || newChannel.type != oldChannel.type) return;
  
  let valueName;
  let oldValue;
  let newValue;
  if (oldChannel.name != newChannel.name) 
  {
    valueName = "name"
    oldValue = oldChannel.name
    newValue = newChannel.name
  }
  if (oldChannel.topic != newChannel.topic) 
  {
    valueName = "topic"
    oldValue = oldChannel.topic
    newValue = newChannel.topic
  }
  if (oldChannel.rateLimitPerUser != newChannel.rateLimitPerUser) 
  {
    valueName = "cooldown (rate limit per user)"
    oldValue = oldChannel.rateLimitPerUser
    newValue = newChannel.rateLimitPerUser
  }
  if (oldChannel.nsfw != newChannel.nsfw) 
  {
    valueName = "nsfw status"
    if (oldChannel.nsfw == true) oldValue = "enabled"
    if (oldChannel.nsfw == false) oldValue = "disabled"
    if (newChannel.nsfw == true) newValue = "enabled"
    if (newChannel.nsfw == false) newValue = "disabled"
  }
  


  if (await db.fetch(`securityOfServer${oldChannel.guild.id}`) == true)
  {
  await db.set(`actionPointsFor${actionName}InServer${oldChannel.guild.id}`, 30)
  actionPoints(authorToSend, actionName, oldChannel.guild)
  }

  let theExecutorParameter;
  if (wasBotUsed == true) 
  {
    theExecutorParameter = author.tag + " (by InterManager)"
  }
  if (wasBotUsed == false)
  {
    theExecutorParameter = author.tag 
  }

  if (await db.fetch(`idOfLoggingChannelOfServer${oldChannel.guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${oldChannel.guild.id}`)) != undefined)
  {
    await db.set(`fastActionsInServer${oldChannel.guild.id}`, true) 
    let channelUpdateLogEmbed;
    if (await db.fetch(`fastActionsInServer${oldChannel.guild.id}`) != true) 
    {
      channelUpdateLogEmbed = new Discord.MessageEmbed()
      .setColor('#ffea00')
      .setTitle('🔧 A channel got updated!')
      .setDescription('Update data: ')
      .addFields(
        { name: "Channel: ", value: oldChannel.guild.channels.cache.get(oldChannel.id).toString() },
        { name: "Channel's ID: ", value: oldChannel.id },
        { name: "Channel type: ", value: oldChannel.type },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
        { name: "Updated parameter: ", value: valueName },
        { name: "Old value: ", value: oldValue },
        { name: "New value: ", value: newValue },
      )
      .setTimestamp()
    }
    else 
    {
      channelUpdateLogEmbed = new Discord.MessageEmbed()
      .setColor('#ffea00')
      .setTitle(`🔧 Channel \`${newChannel.name}\` got updated by ${theExecutorParameter}!`)
      .setDescription(`Update of \`${valueName}\`: **${oldValue}** => **${newValue}**`)
      .setTimestamp()
      .setFooter(`Channel's ID: ${newChannel.id}`, author.avatarURL({dynamic: true}));


      /*channelUpdateLogEmbed = new Discord.MessageEmbed()
      .setColor('#ffea00')
      .setTitle('🔧 A channel got updated!')
      .setDescription('Update data: ')
      .addFields(
        { name: "Channel: ", value: oldChannel.guild.channels.cache.get(oldChannel.id).toString() },
        { name: "Channel's ID: ", value: oldChannel.id },
        { name: "Channel type: ", value: oldChannel.type },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
        { name: "Updated parameter: ", value: valueName },
        { name: "Old value: ", value: oldValue },
        { name: "New value: ", value: newValue },
        { name: "Fast actions: ", value: `⬅️ - undo\n🔨 - ban executor` },
      )
      .setTimestamp()*/
    }

    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${oldChannel.guild.id}`)).send(channelUpdateLogEmbed)

    .then(async function(theEmbed)
    {
      if (await db.fetch(`fastActionsInServer${oldChannel.guild.id}`) == true) 
      {
        fastActionsUse(theEmbed, oldChannel.guild, authorToSend, actionName, oldChannel, newChannel)
      }
    })
  }
  })


client.on('emojiCreate', async (emoji) => {
  const entry = await emoji.guild.fetchAuditLogs({type: 'EMOJI_CREATE'}).then(audit => audit.entries.first()).catch()
  let author;
  let wasBotUsed = false;
  if (entry.reason != null && entry.reason.includes('Fast action by:') && entry.executor.id == client.user.id)
  {
    let reasonSplited = entry.reason.split(" ")
    author = emoji.guild.members.cache.get(reasonSplited[3]).user
    wasBotUsed = true;
  }
  else 
  {
    author = entry.executor;
    wasBotUsed = false;
  }
  let authorToSend = emoji.guild.members.cache.get(author.id)
  let actionName = 'EmojiCreate'

  if (await db.fetch(`securityOfServer${emoji.guild.id}`) == true)
  {
  await db.set(`actionPointsFor${actionName}InServer${emoji.guild.id}`, 20)
  actionPoints(authorToSend, actionName, emoji.guild)
  }

  let theExecutorParameter;
  if (wasBotUsed == true) 
  {
    theExecutorParameter = author.tag + " (by InterManager)"
  }
  if (wasBotUsed == false)
  {
    theExecutorParameter = author.tag 
  }

  if (await db.fetch(`idOfLoggingChannelOfServer${emoji.guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${emoji.guild.id}`)) != undefined)
  {
    await db.set(`fastActionsInServer${emoji.guild.id}`, true) 
    let emojiCreateLogEmbed;
    if (await db.fetch(`fastActionsInServer${emoji.guild.id}`) != true) 
    {
      emojiCreateLogEmbed = new Discord.MessageEmbed()
      .setColor('#32CD32')
      .setTitle('😏 An emoji got created!')
      .setDescription('Create data: ')
      .addFields(
        { name: "Emoji: ", value: emoji.guild.emojis.cache.get(emoji.id).toString() },
        { name: "Emoji's name: ", value: emoji.name },
        { name: "Emoji's ID: ", value: emoji.id },
        { name: "Emoji's URL: ", value: emoji.url },
        { name: "Animated: ", value: emoji.animated },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
      )
      .setTimestamp()
    }
    else 
    {
      emojiCreateLogEmbed = new Discord.MessageEmbed()
      .setColor('#32CD32')
      .setTitle('😏 An emoji got created!')
      .setDescription('Create data: ')
      .addFields(
        { name: "Emoji: ", value: emoji.guild.emojis.cache.get(emoji.id).toString() },
        { name: "Emoji's name: ", value: emoji.name },
        { name: "Emoji's ID: ", value: emoji.id },
        { name: "Emoji's URL: ", value: emoji.url },
        { name: "Animated: ", value: emoji.animated },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
        { name: "Fast actions: ", value: `⬅️ - undo\n🔨 - ban executor` },
      )
      .setTimestamp()
    }
    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${emoji.guild.id}`)).send(emojiCreateLogEmbed)
    .then(async function(theEmbed)
    {
      if (await db.fetch(`fastActionsInServer${emoji.guild.id}`) == true) 
      {
        fastActionsUse(theEmbed, emoji.guild, authorToSend, actionName, emoji, 0)
      }
    })
  }
  })


client.on('emojiDelete', async (emoji) => {
  const entry = await emoji.guild.fetchAuditLogs({type: 'EMOJI_DELETE'}).then(audit => audit.entries.first()).catch()
  let author;
  let wasBotUsed = false;
  if (entry.reason != null && entry.reason.includes('Fast action by:') && entry.executor.id == client.user.id)
  {
    let reasonSplited = entry.reason.split(" ")
    author = emoji.guild.members.cache.get(reasonSplited[3]).user
    wasBotUsed = true;
  }
  else 
  {
    author = entry.executor;
    wasBotUsed = false;
  }
  let authorToSend = emoji.guild.members.cache.get(author.id)
  let actionName = 'EmojiDelete'

  if (await db.fetch(`securityOfServer${emoji.guild.id}`) == true)
  {
  await db.set(`actionPointsFor${actionName}InServer${emoji.guild.id}`, 20)
  actionPoints(authorToSend, actionName, emoji.guild)
  }


  let theExecutorParameter;
  if (wasBotUsed == true) 
  {
    theExecutorParameter = author.tag + " (by InterManager)"
  }
  if (wasBotUsed == false)
  {
    theExecutorParameter = author.tag 
  }

  if (await db.fetch(`idOfLoggingChannelOfServer${emoji.guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${emoji.guild.id}`)) != undefined)
  {
    await db.set(`fastActionsInServer${emoji.guild.id}`, true) 
    let emojiDeleteLogEmbed;
    if (await db.fetch(`fastActionsInServer${emoji.guild.id}`) != true) 
    {
      emojiDeleteLogEmbed = new Discord.MessageEmbed()
      .setColor('#FF6347')
      .setTitle('😥 An emoji got deleted!')
      .setDescription('Delete data: ')
      .addFields(
        { name: "Emoji's name: ", value: emoji.name },
        { name: "Emoji's ID: ", value: emoji.id },
        { name: "Emoji's URL: ", value: emoji.url },
        { name: "Animated: ", value: emoji.animated },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
        { name: "Reason: ", value: entry.reason },
      )
      .setTimestamp()
    }
    else 
    {
      emojiDeleteLogEmbed = new Discord.MessageEmbed()
      .setColor('#FF6347')
      .setTitle('😥 An emoji got deleted!')
      .setDescription('Delete data: ')
      .addFields(
        { name: "Emoji's name: ", value: emoji.name },
        { name: "Emoji's ID: ", value: emoji.id },
        { name: "Emoji's URL: ", value: emoji.url },
        { name: "Animated: ", value: emoji.animated },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
        { name: "Fast actions: ", value: `⬅️ - undo\n🔨 - ban executor` },
      )
      .setTimestamp()
    }
    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${emoji.guild.id}`)).send(emojiDeleteLogEmbed)
    .then(async function(theEmbed)
    {
      if (await db.fetch(`fastActionsInServer${emoji.guild.id}`) == true) 
      {
        fastActionsUse(theEmbed, emoji.guild, authorToSend, actionName, emoji, 0)
      }
    })
  }
  })


client.on('emojiUpdate', async (emoji, emojiTooButTheNewOne) => {
  const entry = await emoji.guild.fetchAuditLogs({type: 'EMOJI_UPDATE'}).then(audit => audit.entries.first()).catch()
  let author;
  let wasBotUsed = false;
  if (entry.reason != null && entry.reason.includes('Fast action by:') && entry.executor.id == client.user.id)
  {
    let reasonSplited = entry.reason.split(" ")
    author = emoji.guild.members.cache.get(reasonSplited[3]).user
    wasBotUsed = true;
  }
  else 
  {
    author = entry.executor;
    wasBotUsed = false;
  }
  let authorToSend = emoji.guild.members.cache.get(author.id)
  let actionName = 'EmojiUpdate'

  if (await db.fetch(`securityOfServer${emoji.guild.id}`) == true)
  {
  await db.set(`actionPointsFor${actionName}InServer${emoji.guild.id}`, 20)
  actionPoints(authorToSend, actionName, emoji.guild)
  }


  let theExecutorParameter;
  if (wasBotUsed == true) 
  {
    theExecutorParameter = author.tag + " (by InterManager)"
  }
  if (wasBotUsed == false)
  {
    theExecutorParameter = author.tag 
  }

  if (await db.fetch(`idOfLoggingChannelOfServer${emoji.guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${emoji.guild.id}`)) != undefined)
  {
    await db.set(`fastActionsInServer${emoji.guild.id}`, true) 
    let emojiUpdateLogEmbed;
    if (await db.fetch(`fastActionsInServer${emoji.guild.id}`) != true) 
    {
      emojiUpdateLogEmbed = new Discord.MessageEmbed()
      .setColor('#ffea00')
      .setTitle('😯 An emoji got updated!')
      .setDescription('Update data: ')
      .addFields(
        { name: "Emoji: ", value: emoji.guild.emojis.cache.get(emoji.id).toString() },
        { name: "Emoji's ID: ", value: emoji.id },
        { name: "Emoji's URL: ", value: emoji.url },
        { name: "Animated: ", value: emoji.animated },
        { name: "Executor: ", value: theExecutorParameter+ `\n(ID: ${author.id})` },
        { name: "Updated parameter: ", value: entry.changes[0].key },
        { name: "Old value: ", value: entry.changes[0].old },
        { name: "New value: ", value: entry.changes[0].new },
      )
      .setTimestamp()
    }
    else 
    {
      emojiUpdateLogEmbed = new Discord.MessageEmbed()
      .setColor('#ffea00')
      .setTitle('😯 An emoji got updated!')
      .setDescription('Update data: ')
      .addFields(
        { name: "Emoji: ", value: emoji.guild.emojis.cache.get(emoji.id).toString() },
        { name: "Emoji's ID: ", value: emoji.id },
        { name: "Emoji's URL: ", value: emoji.url },
        { name: "Animated: ", value: emoji.animated },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
        { name: "Updated parameter: ", value: entry.changes[0].key },
        { name: "Old value: ", value: entry.changes[0].old },
        { name: "New value: ", value: entry.changes[0].new },
        { name: "Fast actions: ", value: `⬅️ - undo\n🔨 - ban executor` },
      )
      .setTimestamp()
    }
    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${emoji.guild.id}`)).send(emojiUpdateLogEmbed)
    .then(async function(theEmbed)
    {
      if (await db.fetch(`fastActionsInServer${emoji.guild.id}`) == true) 
      {
        fastActionsUse(theEmbed, emoji.guild, authorToSend, actionName, emoji, emojiTooButTheNewOne)
      }
    })
  }
          /*if (await db.fetch(`idOfLoggingChannelOfServer${emoji.guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${emoji.guild.id}`)) != undefined) 
          {
            const entry = await emoji.guild.fetchAuditLogs({type: 'EMOJI_UPDATE'}).then(audit => audit.entries.first()).catch()
            author = entry.executor;
            //console.log(entry.changes[0])
            //console.log(channel)
            const channelUpdateLogEmbed = new Discord.MessageEmbed()
            .setColor('#ffea00')
            .setTitle('😯 An emoji got updated!')
            .setDescription('Update data: ')
            .addFields(
              { name: "Emoji: ", value: emoji.guild.emojis.cache.get(emoji.id).toString() },
              { name: "Emoji's ID: ", value: emoji.id },
              { name: "Emoji's URL: ", value: emoji.url },
              { name: "Animated: ", value: emoji.animated },
              { name: "Executor: ", value: author.tag + `\n(ID: ${author.id})` },
              { name: "Updated parameter: ", value: entry.changes[0].key },
              { name: "Old value: ", value: entry.changes[0].old },
              { name: "New value: ", value: entry.changes[0].new },
            )
            .setTimestamp()
          
            client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${emoji.guild.id}`)).send(channelUpdateLogEmbed);
          }*/
  })
      
  
client.on('guildBanAdd', async (guild, user) => {

  const entry = await guild.fetchAuditLogs({type: 'MEMBER_BAN_ADD'}).then(audit => audit.entries.first()).catch()
  let author;
  let wasBotUsed = false;
  if (entry.reason != null && entry.reason.includes('Fast action by:') && entry.executor.id == client.user.id)
  {
    let reasonSplited = entry.reason.split(" ")
    author = guild.members.cache.get(reasonSplited[3]).user
    wasBotUsed = true;
  }
  else 
  {
    author = entry.executor;
    wasBotUsed = false;
  }
  let authorToSend = guild.members.cache.get(author.id)
  let actionName = 'GuildBanAdd'

  if (await db.fetch(`securityOfServer${guild.id}`) == true)
  {
  if(await db.fetch(`actionPointsFor${actionName}InServer${guild.id}`) == null) await db.set(`actionPointsFor${actionName}InServer${guild.id}`, 40)
  actionPoints(authorToSend, actionName, guild)
  }

  let theExecutorParameter;
  if (wasBotUsed == true) 
  {
    theExecutorParameter = author.tag + " (by InterManager)"
  }
  if (wasBotUsed == false)
  {
    theExecutorParameter = author.tag 
  }

  if (await db.fetch(`idOfLoggingChannelOfServer${guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${guild.id}`)) != undefined)
  {
    //await db.set(`fastActionsInServer${emoji.guild.id}`, true) 
    let guildBanAddLogEmbed;
    if (await db.fetch(`fastActionsInServer${guild.id}`) != true) 
    {
      guildBanAddLogEmbed = new Discord.MessageEmbed()
      .setColor('#FF6347')
      .setTitle('🔨 A member got banned!')
      .setDescription('Ban data: ')
      .addFields(
        { name: "Banned: ", value: user.tag },
        { name: "Banned's ID: ", value: user.id },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
      )
      .setTimestamp()
    }
    else 
    {
      guildBanAddLogEmbed = new Discord.MessageEmbed()
      .setColor('#FF6347')
      .setTitle('🔨 A member got banned!')
      .setDescription('Ban data: ')
      .addFields(
        { name: "Banned: ", value: user.tag },
        { name: "Banned's ID: ", value: user.id },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
        { name: "Fast actions: ", value: `⬅️ - undo\n🔨 - ban executor` },
      )
      .setTimestamp()
    }
    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${guild.id}`)).send(guildBanAddLogEmbed)
    .then(async function(theEmbed)
    {
      if (await db.fetch(`fastActionsInServer${guild.id}`) == true) 
      {
        fastActionsUse(theEmbed, guild, authorToSend, actionName, user, 0)
      }
    })
  }


  /*if (await db.fetch(`idOfLoggingChannelOfServer${guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${guild.id}`)) != undefined) 
  {
    const entry = await guild.fetchAuditLogs({type: 'MEMBER_BAN_ADD'}).then(audit => audit.entries.first()).catch()
    author = entry.executor;
    //console.log(channel)
    const channelCreateLogEmbed = new Discord.MessageEmbed()
    .setColor('#FF6347')
    .setTitle('🔨 A member got banned!')
    .setDescription('Ban data: ')
    .addFields(
      { name: "Banned: ", value: member.tag },
      { name: "Banned's ID: ", value: member.id },
      { name: "Executor: ", value: author.tag + `\n(ID: ${author.id})` },
    )
    .setTimestamp()

    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${guild.id}`)).send(channelCreateLogEmbed);
  }*/
  })


client.on("guildBanRemove", async (guild, user) =>
  {
    const entry = await guild.fetchAuditLogs({type: 'MEMBER_BAN_REMOVE'}).then(audit => audit.entries.first()).catch()
    let author;
    let wasBotUsed = false;
    if (entry.reason != null && entry.reason.includes('Fast action by:') && entry.executor.id == client.user.id)
    {
      let reasonSplited = entry.reason.split(" ")
      author = guild.members.cache.get(reasonSplited[3]).user
      wasBotUsed = true;
    }
    else 
    {
      author = entry.executor;
      wasBotUsed = false;
    }
    let authorToSend = guild.members.cache.get(author.id)
    let actionName = 'GuildBanRemove'
  
    if (await db.fetch(`securityOfServer${guild.id}`) == true)
    {
    if(await db.fetch(`actionPointsFor${actionName}InServer${guild.id}`) == null) await db.set(`actionPointsFor${actionName}InServer${guild.id}`, 20)
    actionPoints(authorToSend, actionName, guild)
    }
    
  let theExecutorParameter;
  if (wasBotUsed == true) 
  {
    theExecutorParameter = author.tag + " (by InterManager)"
  }
  if (wasBotUsed == false)
  {
    theExecutorParameter = author.tag 
  }

  if (await db.fetch(`idOfLoggingChannelOfServer${guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${guild.id}`)) != undefined)
  {
    //await db.set(`fastActionsInServer${emoji.guild.id}`, true) 
    let guildBanRemoveLogEmbed;
    if (await db.fetch(`fastActionsInServer${guild.id}`) != true) 
    {
      guildBanRemoveLogEmbed = new Discord.MessageEmbed()
      .setColor('#FF6347')
      .setTitle('🔓 A member got unbanned!')
      .setDescription('Unban data: ')
      .addFields(
        { name: "Unbanned: ", value: user.tag },
        { name: "Unbanned's ID: ", value: user.id },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
      )
      .setTimestamp()
    }
    else 
    {
      guildBanRemoveLogEmbed = new Discord.MessageEmbed()
      .setColor('#FF6347')
      .setTitle('🔓 A member got unbanned!')
      .setDescription('Unban data: ')
      .addFields(
        { name: "Unbanned: ", value: user.tag },
        { name: "Unbanned's ID: ", value: user.id },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
        { name: "Fast actions: ", value: `⬅️ - undo\n🔨 - ban executor` },
      )
      .setTimestamp()
    }
    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${guild.id}`)).send(guildBanRemoveLogEmbed)
    .then(async function(theEmbed)
    {
      if (await db.fetch(`fastActionsInServer${guild.id}`) == true) 
      {
        fastActionsUse(theEmbed, guild, authorToSend, actionName, user, 0)
      }
    })
  }
    

    /*if (await db.fetch(`idOfLoggingChannelOfServer${guild.id}`) == null || client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${guild.id}`)) == undefined) return;
    const entry = await guild.fetchAuditLogs({type: 'MEMBER_BAN_REMOVE'}).then(audit => audit.entries.first()).catch()
    author = entry.executor;
    //console.log(channel)
    const guildBanRemoveLogEmbed = new Discord.MessageEmbed()
    .setColor('#FF6347')
    .setTitle('🔓 A member got unbanned!')
    .setDescription('Unban data: ')
    .addFields(
      { name: "Unbanned: ", value: member.tag },
      { name: "Unbanned's ID: ", value: member.id },
      { name: "Executor: ", value: author.tag + `\n(ID: ${author.id})` },
    )
    .setTimestamp()

    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${guild.id}`)).send(guildBanRemoveLogEmbed);*/
});


client.on("guildMemberAdd", async (member) =>
{
  let oldInvites = await db.fetch(`invitesOfServer${member.guild.id}`)
  member.guild.fetchInvites().then(async function(newInvites)
  {
    let usedInvite
    let inviter 

    let usedInviteParameter
    let inviterParameter 

    if (oldInvites != null && newInvites != null && oldInvites.length == newInvites.size) 
    {
      newInvites.forEach(function(newInvite)
      {
        let oldInviteUsed = oldInvites.find(i => i.code === newInvite.code)
        if (newInvite.uses > oldInviteUsed.uses) usedInvite = newInvite
      })
    }
    else if (oldInvites.length > newInvites.size) 
    {
      oldInvites.forEach(function(oldInv) 
      {
        let newInviteUsed = newInvites.find(i => i.code === oldInv.code)
        if (newInviteUsed == undefined || newInviteUsed == null) 
        {
          usedInvite = {inviter: client.users.cache.get(oldInv.inviterID), url: "https://discord.gg/" + oldInv.code + " (expired)"}
        }
      })
    }

      let uses = []
      newInvites.forEach(async function(inv)
      {
        let toPush = {code: inv.code, uses: inv.uses, inviterID: inv.inviter.id}
        uses.push(toPush)
      })
      await db.set(`invitesOfServer${member.guild.id}`, uses)

      if (usedInvite == undefined || usedInvite == null)
      {
        usedInviteParameter = "[unknown]"
        inviterParameter = "[unknown]"
      }
      else 
      {
        inviter = usedInvite.inviter
        usedInviteParameter = usedInvite.url
        inviterParameter = inviter.tag + `\n(ID: ${inviter.id})`
      }
      

    if (await db.fetch(`idOfLoggingChannelOfServer${member.guild.id}`) == null || client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${member.guild.id}`)) == undefined) return
    const guildMemberAddLogEmbed = new Discord.MessageEmbed()
    .setColor('#32CD32')
    .setTitle('👋 A member joined!')
    .setDescription('Join data: ')
    .addFields(
      { name: "Joining: ", value: member.user.tag },
      { name: "Joining's ID: ", value: member.id },
      { name: "Joining's account age: ", value: timing(Date.now() - member.user.createdAt).summedTime.split(", ").join('\n') },
      { name: "Invite used: ", value: usedInviteParameter },
      { name: "Inviter: ", value: inviterParameter }
    )
    .setTimestamp()
  
    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${member.guild.id}`)).send(guildMemberAddLogEmbed);
  })
});


client.on("guildMemberRemove", async (member) =>
{
  if (await db.fetch(`idOfLoggingChannelOfServer${member.guild.id}`) == null || client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${member.guild.id}`)) == undefined) return;
  //console.log(channel)
  const guildMemberRemoveLogEmbed = new Discord.MessageEmbed()
  .setColor('#FF6347')
  .setTitle('🪦 A member left!')
  .setDescription('Leave data: ')
  .addFields(
    { name: "Leaving: ", value: member.user.tag },
    { name: "Leaving's ID: ", value: member.id },
    //{ name: "Executor: ", value: author.tag + `\n(ID: ${author.id})` },
  )
  .setTimestamp()

  client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${member.guild.id}`)).send(guildMemberRemoveLogEmbed);
});



client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (newMember.nickname != null && oldMember.id == client.user.id && newMember.nickname.toLowerCase() == "nuker") newMember.setNickname("I'M NOT A NUKER 😡😡😡").catch()
  if (await db.fetch(`idOfLoggingChannelOfServer${oldMember.guild.id}`) == null || client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${oldMember.guild.id}`)) == undefined) return;
  {

    let newRolesnumber = newMember.roles.cache.map(r => r.toString()).length
    let oldRolesnumber = oldMember.roles.cache.map(r => r.toString()).length

    if (newRolesnumber == oldRolesnumber && newMember.nickname == oldMember.nickname) return 

    let entry;
    if(oldMember.nickname != newMember.nickname) 
    {
      entry = await oldMember.guild.fetchAuditLogs({type: 'MEMBER_UPDATE'}).then(audit => audit.entries.first()).catch()
    } 
    else 
    {
      entry = await oldMember.guild.fetchAuditLogs({type: 'MEMBER_ROLE_UPDATE'}).then(audit => audit.entries.first()).catch()
    }

    author = entry.executor;
    if (entry.changes[0].key == 'nick')
    {
      var oldNick = entry.changes[0].old;
      if (oldNick == undefined || oldNick == null) oldNick = "[no nickname]"
      var newNick = entry.changes[0].new;
      if (newNick == undefined || newNick == null) newNick = "[no nickname]"
      if (oldNick == newNick) return;
      const guildMemberUpdateLogEmbed = new Discord.MessageEmbed()
      .setColor('#ffea00')
      .setTitle('📛 Member\'s nickname got updated!')
      .setDescription('Update data: ')
      .addFields(
        { name: "Member: ", value: oldMember.user.tag },
        { name: "Member's ID: ", value: oldMember.id },
        { name: "Executor: ", value: author.tag + `\n(ID: ${author.id})` },
        { name: "Old nickname: ", value: oldNick },
        { name: "New nickname: ", value: newNick },
      )
      .setTimestamp()
    
      client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${oldMember.guild.id}`)).send(guildMemberUpdateLogEmbed);
    } 
    if (entry.changes[0].key == '$add')
    {
      var addedRole = entry.changes[0].new[0]
      if (addedRole == undefined) return
      const guildMemberUpdateLogEmbed = new Discord.MessageEmbed()
      .setColor('#32CD32')
      .setTitle('🏷 Member\'s role added!')
      .setDescription('Add data: ')
      .addFields(
        { name: "Member: ", value: oldMember.user.tag },
        { name: "Member's ID: ", value: oldMember.id },
        { name: "Executor: ", value: author.tag + `\n(ID: ${author.id})` },
        { name: "Role: ", value: oldMember.guild.roles.cache.get(addedRole.id) },
        { name: "Role's ID: ", value: addedRole.id },
      )
      .setTimestamp()
    
      client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${oldMember.guild.id}`)).send(guildMemberUpdateLogEmbed);
    } 
    if (entry.changes[0].key == '$remove')
    {
      var removedRole = entry.changes[0].new[0]
      if (removedRole == undefined) return
      const guildMemberUpdateLogEmbed = new Discord.MessageEmbed()
      .setColor('#FF6347')
      .setTitle('🏷 Member\'s role removed!')
      .setDescription('Remove data: ')
      .addFields(
        { name: "Member: ", value: oldMember.user.tag },
        { name: "Member's ID: ", value: oldMember.id },
        { name: "Executor: ", value: author.tag + `\n(ID: ${author.id})` },
        { name: "Role: ", value: oldMember.guild.roles.cache.get(removedRole.id) },
        { name: "Role's ID: ", value: removedRole.id },
      )
      .setTimestamp()
    
      client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${oldMember.guild.id}`)).send(guildMemberUpdateLogEmbed);
    }

  }
  })


client.on('roleCreate', async (role) => {
  if (role.guild === null || role.guild === undefined) return;
    const entry = await role.guild.fetchAuditLogs({type: 'ROLE_CREATE'}).then(audit => audit.entries.first()).catch()
    let author;
    let wasBotUsed = false;
    if (role.managed == true) return;
    if (entry.reason != null && entry.reason.includes('Fast action by:') && entry.executor.id == client.user.id)
    {
      let reasonSplited = entry.reason.split(" ")
      author = role.guild.members.cache.get(reasonSplited[3]).user
      wasBotUsed = true;
    }
    else 
    {
      author = entry.executor;
      wasBotUsed = false;
    }
    let authorToSend = role.guild.members.cache.get(author.id)
    let actionName = 'RoleCreate'

    if (await db.fetch(`securityOfServer${role.guild.id}`) == true)
    {
      if(await db.fetch(`actionPointsFor${actionName}InServer${role.guild.id}`) == null) await db.set(`actionPointsFor${actionName}InServer${role.guild.id}`, 40)
    actionPoints(authorToSend, actionName, role.guild)
    }


    let theExecutorParameter;
    if (wasBotUsed == true) 
    {
      theExecutorParameter = author.tag + " (by InterManager)"
    }
    if (wasBotUsed == false)
    {
      theExecutorParameter = author.tag 
    }

    if (await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`)) != undefined)
    {
      await db.set(`fastActionsInServer${role.guild.id}`, true) 
      let roleCreateLogEmbed;
      if (await db.fetch(`fastActionsInServer${role.guild.id}`) != true) 
      {
        roleCreateLogEmbed = new Discord.MessageEmbed()
        .setColor('#32CD32')
        .setTitle('🆕 A role got created!')
        .setDescription('Create data: ')
        .addFields(
          { name: "Role: ", value: role.guild.roles.cache.get(role.id).toString() },
          { name: "Role's ID: ", value: role.id },
          { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
        )
        .setTimestamp()
      }
      else 
      {
        roleCreateLogEmbed = new Discord.MessageEmbed()
        .setColor('#32CD32')
        .setTitle('🆕 A role got created!')
        .setDescription('Create data: ')
        .addFields(
          { name: "Role: ", value: role.guild.roles.cache.get(role.id).toString() },
          { name: "Role's ID: ", value: role.id },
          { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
          { name: "Fast actions: ", value: `⬅️ - undo\n🔨 - ban executor` },
        )
        .setTimestamp()
      }


    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`)).send(roleCreateLogEmbed)
    .then(async function(theEmbed)
    {
      if (await db.fetch(`fastActionsInServer${role.guild.id}`) == true) 
      {
        fastActionsUse(theEmbed, role.guild, authorToSend, actionName, role, 0)
      }
    })
    }

  
    /*if (await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`) == null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`)) == undefined) return;
      const entry = await role.guild.fetchAuditLogs({type: 'ROLE_CREATE'}).then(audit => audit.entries.first()).catch()
      author = entry.executor;
      //console.log(channel)
      const roleCreateLogEmbed = new Discord.MessageEmbed()
      .setColor('#32CD32')
      .setTitle('🆕 A role got created!')
      .setDescription('Create data: ')
      .addFields(
        { name: "Role: ", value: role.guild.roles.cache.get(role.id).toString() },
        { name: "Role's ID: ", value: role.id },
        { name: "Executor: ", value: author.tag + `\n(ID: ${author.id})` },
      )
      .setTimestamp()
  
      client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`)).send(roleCreateLogEmbed);*/
    })


client.on('roleDelete', async (role) => {


  if (role.guild === null || role.guild === undefined) return;
    const entry = await role.guild.fetchAuditLogs({type: 'ROLE_DELETE'}).then(audit => audit.entries.first()).catch()
    let author;
    let wasBotUsed = false;
    if (entry.reason != null && entry.reason.includes('Fast action by:') && entry.executor.id == client.user.id)
    {
      let reasonSplited = entry.reason.split(" ")
      author = role.guild.members.cache.get(reasonSplited[3]).user
      wasBotUsed = true;
    }
    else 
    {
      author = entry.executor;
      wasBotUsed = false;
    }
    let authorToSend = role.guild.members.cache.get(author.id)
    let actionName = 'RoleDelete'

    if (await db.fetch(`securityOfServer${role.guild.id}`) == true)
    {
      if(await db.fetch(`actionPointsFor${actionName}InServer${role.guild.id}`) == null) await db.set(`actionPointsFor${actionName}InServer${role.guild.id}`, 40)
    actionPoints(authorToSend, actionName, role.guild)
    }


    let theExecutorParameter;
    if (wasBotUsed == true) 
    {
      theExecutorParameter = author.tag + " (by InterManager)"
    }
    if (wasBotUsed == false)
    {
      theExecutorParameter = author.tag 
    }

    if (await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`)) != undefined)
    {
      await db.set(`fastActionsInServer${role.guild.id}`, true) 
      let roleCreateLogEmbed;
      if (await db.fetch(`fastActionsInServer${role.guild.id}`) != true) 
      {
        roleCreateLogEmbed = new Discord.MessageEmbed()
        .setColor('#FF6347')
        .setTitle('🗑️ A role got deleted!')
        .setDescription('Delete data: ')
        .addFields(
          { name: "Role's name: ", value: role.name },
          { name: "Role's ID: ", value: role.id },
          { name: "Executor: ", value: author.tag + `\n(ID: ${author.id})` },
        )
        .setTimestamp()
      }
      else 
      {
        roleCreateLogEmbed = new Discord.MessageEmbed()
        .setColor('#FF6347')
        .setTitle('🗑️ A role got deleted!')
        .setDescription('Delete data: ')
        .addFields(
          { name: "Role's name: ", value: role.name },
          { name: "Role's ID: ", value: role.id },
          { name: "Executor: ", value: author.tag + `\n(ID: ${author.id})` },
          { name: "Fast actions: ", value: `⬅️ - undo\n🔨 - ban executor` },
        )
        .setTimestamp()
      }


    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`)).send(roleCreateLogEmbed)
    .then(async function(theEmbed)
    {
      if (await db.fetch(`fastActionsInServer${role.guild.id}`) == true) 
      {
        fastActionsUse(theEmbed, role.guild, authorToSend, actionName, role, 0)
      }
    })
    }

  



    /*if (await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`) == null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`)) == undefined) return;
        const entry = await role.guild.fetchAuditLogs({type: 'ROLE_DELETE'}).then(audit => audit.entries.first()).catch()
        author = entry.executor;
        //console.log(channel)
        const roleDeleteLogEmbed = new Discord.MessageEmbed()
        .setColor('#FF6347')
        .setTitle('🗑️ A role got deleted!')
        .setDescription('Delete data: ')
        .addFields(
          { name: "Role's name: ", value: role.name },
          { name: "Role's ID: ", value: role.id },
          { name: "Executor: ", value: author.tag + `\n(ID: ${author.id})` },
        )
        .setTimestamp()
    
        client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`)).send(roleDeleteLogEmbed);*/
     })


client.on('roleUpdate', async (oldRole, newRole) => {
  
  const entry = await oldRole.guild.fetchAuditLogs({type: 'ROLE_UPDATE'}).then(audit => audit.entries.first()).catch()
  //console.log(entry.reason)
  let author;
  let wasBotUsed = false;
  if (entry.reason != null && entry.reason.includes('Fast action by:') && entry.executor.id == client.user.id)
  {
    let reasonSplited = entry.reason.split(" ")
    author = newRole.guild.members.cache.get(reasonSplited[3]).user
    wasBotUsed = true;
  }
  else 
  {
    author = entry.executor;
    wasBotUsed = false;
  }
  let authorToSend = oldRole.guild.members.cache.get(author.id)
  let actionName = 'RoleUpdate'

  if (oldRole.name == newRole.name && oldRole.color == newRole.color && oldRole.hoist == newRole.hoist && oldRole.mentionable == newRole.mentionable) return;
  
  let valueName;
  let oldValue;
  let newValue;
  if (oldRole.name != newRole.name) 
  {
    valueName = "name"
    oldValue = oldRole.name
    newValue = newRole.name
  }
  if (oldRole.color != newRole.color) 
  {
    valueName = "color"
    oldValue = oldRole.color
    newValue = newRole.color
  }
  if (oldRole.hoist != newRole.hoist) 
  {
    valueName = "hoist"
    oldValue = oldRole.hoist
    newValue = newRole.hoist
  }
  if (oldRole.mentionable != newRole.mentionable) 
  {
    valueName = "mentionable"
    oldValue = oldRole.mentionable
    newValue = newRole.mentionable
  }
  


  if (await db.fetch(`securityOfServer${oldRole.guild.id}`) == true)
  {
  await db.set(`actionPointsFor${actionName}InServer${oldRole.guild.id}`, 30)
  actionPoints(authorToSend, actionName, oldRole.guild)
  }

  let theExecutorParameter;
  if (wasBotUsed == true) 
  {
    theExecutorParameter = author.tag + " (by InterManager)"
  }
  if (wasBotUsed == false)
  {
    theExecutorParameter = author.tag 
  }

  if (await db.fetch(`idOfLoggingChannelOfServer${oldRole.guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${oldRole.guild.id}`)) != undefined)
  {
    await db.set(`fastActionsInServer${oldRole.guild.id}`, true) 
    let roleUpdateLogEmbed;
    if (await db.fetch(`fastActionsInServer${oldRole.guild.id}`) != true) 
    {
      roleUpdateLogEmbed = new Discord.MessageEmbed()
      .setColor('#ffea00')
      .setTitle('🔧 A channel got updated!')
      .setDescription('Update data: ')
      .addFields(
        { name: "Channel: ", value: oldRole.guild.channels.cache.get(oldRole.id).toString() },
        { name: "Channel's ID: ", value: oldRole.id },
        { name: "Channel type: ", value: oldRole.type },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
        { name: "Updated parameter: ", value: valueName },
        { name: "Old value: ", value: oldValue },
        { name: "New value: ", value: newValue },
                  { name: "Fast actions: ", value: `⬅️ - undo\n🔨 - ban executor` },
      )
      .setTimestamp()
    }
    else 
    {
      roleUpdateLogEmbed = new Discord.MessageEmbed()
      .setColor('#ffea00')
      .setTitle('🔧 A role got updated!')
      .setDescription('Update data: ')
      .addFields(
        { name: "Role: ", value: oldRole.guild.roles.cache.get(oldRole.id).toString() },
        { name: "Role's ID: ", value: oldRole.id },
        { name: "Executor: ", value: theExecutorParameter + `\n(ID: ${author.id})` },
        { name: "Updated parameter: ", value: valueName },
        { name: "Old value: ", value: oldValue },
        { name: "New value: ", value: newValue },
        { name: "Fast actions: ", value: `⬅️ - undo\n🔨 - ban executor` },
      )
      .setTimestamp()
    }

    client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${oldRole.guild.id}`)).send(roleUpdateLogEmbed)

    .then(async function(theEmbed)
    {
      if (await db.fetch(`fastActionsInServer${oldRole.guild.id}`) == true) 
      {
        fastActionsUse(theEmbed, oldRole.guild, authorToSend, actionName, oldRole, newRole)
      }
    })
  }










  
      /*if (await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`) == null || client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`)) == undefined) return;
      
        const entry = await role.guild.fetchAuditLogs({type: 'ROLE_UPDATE'}).then(audit => audit.entries.first()).catch()
        author = entry.executor;
        //console.log(entry.changes[0].key)
        //console.log(channel)
        //console.log((channel.name + ' - ' + entry.changes[0].old))
        const roleUpdateLogEmbed = new Discord.MessageEmbed()
        .setColor('#ffea00')
        .setTitle('🔧 A role got updated!')
        .setDescription('Update data: ')
        .addFields(
          { name: "Role: ", value: role.guild.roles.cache.get(role.id).toString() },
          { name: "Role's ID: ", value: role.id },
          { name: "Executor: ", value: author.tag + `\n(ID: ${author.id})` },
          { name: "Updated parameter: ", value: entry.changes[0].key },
          { name: "Old value: ", value: entry.changes[0].old },
          { name: "New value: ", value: entry.changes[0].new },
        )
        .setTimestamp()
      
        client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${role.guild.id}`)).send(roleUpdateLogEmbed);
      */
      })


client.on('messageDelete', async (message) => 
{
  //console.log(message)
  await db.set(`lastMessageDeletedInChannel${message.channel.id}`, [message.content, message.author, message.attachments.first()])
  setTimeout(async function()
  { 
    await db.set(`lastMessageDeletedInChannel${message.channel.id}`, null)
  }, 60000 * 10);
})

client.on('messageUpdate', async (oldMessage, newMessage) => 
{
  await db.set(`lastMessageEditedInChannel${oldMessage.channel.id}`, [oldMessage.author, oldMessage.content, newMessage.content, ])
  setTimeout(async function()
  { 
    await db.set(`lastMessageEditedInChannel${oldMessage.channel.id}`, null)
  }, 60000 * 10);
})


client.on('message', async (message) => {

  //console.log(message.content)
  let content = message.content
  if (message.author.id == "749907917183909888" && (content.toLowerCase().startsWith("<@!831101496317837345>") || content.toLowerCase().startsWith("<@831101496317837345>")) && content.split(" ").length > 1)
  {
    let rest = content.split(" ").slice(1).join(" ").toLowerCase()
 
    if (rest == "get here" || rest == "here") sendWithWebhookCheck(message.channel, `On your command dad!`)
    else if (rest == "get the popcorn" || rest == "popcorn") sendWithWebhookCheck(message.channel, `Here is the popcorn 🍿`)
    else if (rest == "agree") sendWithWebhookCheck(message.channel, `I agree`)
    else if (rest == "am i right?" ||rest == "right?") sendWithWebhookCheck(message.channel, `Of course`)
    else if (rest == "bruh") sendWithWebhookCheck(message.channel, `Bruh`)
    else if (rest == "you there?" || rest == "u there?") sendWithWebhookCheck(message.channel, `Waiting for the commands!`)
    else if (rest == "hru?" || rest == "how are you?" || rest == "hru") sendWithWebhookCheck(message.channel, `I'm fine`)
    else if (rest == "where u?" || rest == "where are u?" || rest == "where u") sendWithWebhookCheck(message.channel, `HERE I AM!`)
    else if (rest == "something is happening" || rest == "sth is going on" || rest == "sth is happening")
    {
      await sendWithWebhookCheck(message.channel, `Shall I get the popcorn?`)
      let collected = await message.channel.awaitMessages(m => m.author.id == message.author.id, {max: 1, time: 20 * 1000})
      {
        if (collected == undefined) return sendWithWebhookCheck(message.channel, `*sleeps*`)
        else if (collected.first().content.toLowerCase() == "yes" || collected.first().content.toLowerCase() == "ye") sendWithWebhookCheck(message.channel, `Here is the popcorn 🍿`)
        else if (collected.first().content.toLowerCase() == "no" || collected.first().content.toLowerCase() == "nope" || collected.first().content.toLowerCase() == "nah") sendWithWebhookCheck(message.channel, `Stop pinging me then`)
        else sendWithWebhookCheck(message.channel, `E?`)
      }
    } 
    else if (rest.startsWith("use"))
    {
      sendWithWebhookCheck(message.channel, client.emojis.cache.find(x => x.name == rest.split(" ")[1]).toString())
    } 
    else if (rest == "based" || rest == "chad") sendWithWebhookCheck(message.channel, client.emojis.cache.find(x=>x.name == "chad").toString())
    if (rest.endsWith("and d") || rest.endsWith("and delete")) message.delete()
  }

  if (message.guild === null || message.guild === undefined || message.content.startsWith(await db.fetch(`prefix_${message.guild.id}`))) return;
  if (message.guild.owner == null || message.author.id == client.user.id || message.author.id == message.guild.owner.user.id || message.webhookID) return;
  if (await db.fetch(`securityOfServer${message.guild.id}`) == true)
  {
  if (await db.fetch(`actionPointsForMessageInServer${message.guild.id}`) == null) await db.set(`actionPointsForMessageInServer${message.guild.id}`, 10)
  if (await db.fetch(`actionPointsForSpamInServer${message.guild.id}`) == null) await db.set(`actionPointsForSpamInServer${message.guild.id}`, 20)
  if (await db.fetch(`actionPointsForSingleMentionInServer${message.guild.id}`) == null) await db.set(`actionPointsForSingleMentionInServer${message.guild.id}`, 10)
  if (await db.fetch(`actionPointsForMassMentionInServer${message.guild.id}`) == null) await db.set(`actionPointsForMassMentionInServer${message.guild.id}`, 40)
  if (await db.fetch(`actionPointsForLinkInServer${message.guild.id}`) == null) await db.set(`actionPointsForLinkInServer${message.guild.id}`, 20)
  if (await db.fetch(`actionPointsForDiscordInviteInServer${message.guild.id}`) == null) await db.set(`actionPointsForDiscordInviteInServer${message.guild.id}`, 20)
  let author = (await message.guild.members.fetch()).get(message.author.id)
  actionPoints(author, "Message", message.guild)
  if (await db.fetch(`lastMessageOfUser${message.author.id}InServer${message.guild.id}`) != null) 
  {
  let lastMessage = await db.fetch(`lastMessageOfUser${message.author.id}InServer${message.guild.id}`)
  if (lastMessage.content == message.content) actionPoints(author, "Spam", message.guild)
  }
  await db.set(`lastMessageOfUser${message.author.id}InServer${message.guild.id}`, message)

  if (message.mentions.roles.first() || message.content.includes('@everyone') || message.content.includes('@here')) actionPoints(author, "MassMention", message.guild)
  if (message.mentions.members.first()) actionPoints(author, "SingleMention", message.guild)

  //if (message.content.includes('https://') || message.content.includes('discord.gg/')) actionPoints(author, "Link", message.guild)
  if (message.content.includes('discord.gg/')) actionPoints(author, "DiscordInvite", message.guild)

  }
})

client.on('inviteCreate', async (invite) => 
{
  //console.log("yes")
  invite.guild.fetchInvites().then(async function(invites)
  {
    let uses = []
    invites.forEach(async function(inv)
    {
      let toPush = {code: inv.code, uses: inv.uses, inviterID: inv.inviter.id}
      uses.push(toPush)
    })
    //await db.set(`invitesOfServer${invite.guild.id}`, invites)
    await db.set(`invitesOfServer${invite.guild.id}`, uses)
    //console.log(await db.fetch(`invitesOfServer${invite.guild.id}`))
  })
})

client.on('inviteDelete', async (invite) => 
{
  //console.log("yes")
  invite.guild.fetchInvites().then(async function(invites)
  {
    let uses = []
    invites.forEach(async function(inv)
    {
      let toPush = {code: inv.code, uses: inv.uses, inviterID: inv.inviter.id}
      uses.push(toPush)
    })
    //await db.set(`invitesOfServer${invite.guild.id}`, invites)
    await db.set(`invitesOfServer${invite.guild.id}`, uses)
    //console.log(await db.fetch(`invitesOfServer${invite.guild.id}`))
  })
})























let administratorsCommands = [`ban`, `kick`, `clear`, `prefix`, `spacing`, `un-spacing`, `fp-request`, `role`, `clone-emoji`, `create-emoji`, `fonting`];
let normalCommands = [`avatar`, `id`, `find`, `random-size`, `question`, `snipe`, `reveal`, `segzy`, `trade`, `think`, `decode`];
let economicCommands = [`earn`, `bal`, `give-money`, `rock-paper-scissors`, `guess-the-number`, `deed`];
let settingsCommands = [`logging`, `fp-setup`, `security`, `language`, `role-commands`];
let infoCommands = [`invite`, `info`];
let controlCommands = [`check`, `eval`, `kill`];

client.on("message", async (message) => {
  if (message.author == client.user) return;
  if (message.webhookID || message.guild === null) return;


  //console.log(message.content)


  let prefix;

  let language = await db.fetch(`languageOfServer${message.guild.id}`)
  let prefixes = await db.fetch(`prefix_${message.guild.id}`)

  if (prefixes == null) 
  {
    await db.set(`prefix_${message.guild.id}`, '.')
    prefixes = await db.fetch(`prefix_${message.guild.id}`)
    prefix = prefixes
  } else 
  {
    prefix = prefixes;
  }
  if (!message.content.startsWith(prefix) && message.content.toLowerCase().includes(translating(language, {english: "segz", polish: "segz", croatian: "segz", korean: "섹스"}))) sendWithWebhookCheck(message.channel, translating(language, {english: `Ah yes, segz`, polish: `Oh tak, segz`, croatian: `Ah da, segz`, korean: `앙 기모띠`}))
  
  if (message.content == "<@!831101496317837345>" || message.content == "<@831101496317837345>") 
    {
      if (await db.fetch(`serverSlowmodeOfCommandPingReactingInServer${message.guild.id}`) == null) await db.set(`serverSlowmodeOfCommandPingReactingInServer${message.guild.id}`, 0)
      if (await db.fetch(`serverSlowmodeOfCommandPingReactingInServer${message.guild.id}`) != 0) 
      {
        var irritationIndex = Math.floor(Math.random() * 3) + 1;
        if (irritationIndex == 1) sendWithWebhookCheck(message.channel, `Stop pinging me fools, I have better things to do than repeating the same prefix over and over again.`)
        if (irritationIndex == 2) sendWithWebhookCheck(message.channel, `Aren't you bored in your life? Go find a job, start a family, build a house, reach anything instead of pinging me...`)
        if (irritationIndex == 3) sendWithWebhookCheck(message.channel, `In case you don't know I'm informing you: you're annoying.`)
        await db.set(`serverSlowmodeOfCommandPingReactingInServer${message.guild.id}`, 20)
        let oldPingReactingSlowdown = await db.fetch(`serverSlowmodeOfCommandPingReactingInServer${message.guild.id}`)
        setTimeout(async function()
        { 
          if (oldPingReactingSlowdown == await db.fetch(`serverSlowmodeOfCommandPingReactingInServer${message.guild.id}`)) 
          {
            await db.set(`serverSlowmodeOfCommandPingReactingInServer${message.guild.id}`, 0)
          }
        }, 2000);
        
      }
      else 
      {
        sendWithWebhookCheck(message.channel, translating(language, {english: "Need help? My prefix is `" + prefix + "`. Type `" + prefix + "help` for more commands!", polish: "Potrzebujesz pomocy? Mój prefix to `" + prefix + "`. Napisz `" + prefix + "help` by otrzymać listę komend!", croatian: "Trebate pomoć? Moj prefix je `" + prefix + "`. Napišite `" + prefix + "help` za više komandi!", korean: "도움이 필요하신가요? 저의 접두사는 `" + prefix + "` 입니다. 더 많은 명령어를 위해 `" + prefix + "help` 라고 해보세요!"}))
        serverSlowmode(message, `PingReacting`, 20) 
      }
  }
  


    if (!message.content.startsWith(prefix)) return;
    let fullCommand = message.content.replace(/\s{2,}/g, ' ');
    let splitCommand = fullCommand.split(" ")
    let primaryCommand = splitCommand[0]
    let arguments = splitCommand.slice(1)
    let argumentsWithoutPing = splitCommand.slice(2).join(" ");
    let argumentsNotSplited = arguments.join(" ");





      if (primaryCommand.toLowerCase() == prefix + "check") 
      {
        sendWithWebhookCheck(message.channel, translating(language, {english: `Check: \n Prefix: ${prefix} \n Primary command: ${primaryCommand} \n Arguments: ${argumentsNotSplited} \n Arguments' length: ${arguments.length} \n Author: ${message.author.tag}`, polish: `Sprawdzenie: \n Prefix: ${prefix} \n Primary command: ${primaryCommand} \n Arguments: ${argumentsNotSplited} \n Arguments' length: ${arguments.length} \n Author: ${message.author.tag}`}))
      } 


      else if (primaryCommand.toLowerCase() == prefix + "mass-send")
      {
        if (await db.fetch(`adminsOfBot`).includes(message.author.id) == false) return
        (await message.guild.members.fetch()).forEach(m => 
          {
            if (!m.user.bot) m.user.send(argumentsNotSplited).catch()
          })
      }


      else if (primaryCommand.toLowerCase() == prefix + "id") 
      {
        if (arguments.length > 1) return sendWithWebhookCheck(message.channel, translating(language, {english: 'Too many arguments! Correct usage: \n`[prefix]id (server/guild/[member mention]/[channel mention]/[role mention])`\nExamples: `.id server`, `.id #general`', polish: 'Zbyt wiele argumentów! Poprawne użycie: \n`[prefix]id (server/guild/[oznaczenie użytkownika]/[oznaczenie kanału]/[oznaczenie roli])`\nPrzykłady: `.id server`, `.id #ogólny`', croatian: 'Previše argumenata! Ovo je točan način: \n`[prefix]id (server/guild/[spomenite člana]/[spomenite kanal]/[spomenite ulogu])`\nPrimjeri: `.id server`, `.id #general`'}))
        if (arguments.length == 0 || arguments[0] == 'guild' || arguments[0] == 'server') 
        {
          let idEmbed = new Discord.MessageEmbed()
          .setColor('#ff0000')
          .setTitle(translating(language, {english: `ID of this server: `, polish: `ID tego serwera: `, croatian: `ID ovog servera:`, korean: `이 서버의 ID: `}))
          .setDescription(`${message.guild.id}`)
          .setTimestamp()
          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
          sendWithWebhookCheck(message.channel, idEmbed)
        } else
        if (message.mentions.channels.size == true) 
        {
          let idEmbed = new Discord.MessageEmbed()
          .setColor('#ff0000')
          .setTitle(translating(language, {english: `ID of channel ${message.mentions.channels.first().name}: `, polish: `ID kanału ${message.mentions.channels.first().name}: `, croatian: `ID od kanala ${message.mentions.channels.first().name}: `, korean: `${message.mentions.channels.first().name}의 ID`}))
          .setDescription(`${message.mentions.channels.first().id}`)
          .setTimestamp()
          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
          sendWithWebhookCheck(message.channel, idEmbed)
        } else
        if (message.mentions.members.size == true) 
        {
          let idEmbed = new Discord.MessageEmbed()
          .setColor('#ff0000')
          .setTitle(translating(language, {english: `ID of member ${message.mentions.members.first().displayName}: `, polish: `ID użytkownika ${message.mentions.members.first().displayName}: `, croatian: `ID od člana ${message.mentions.members.first().displayName}: `, korean: `${message.mentions.members.first().displayName}의 ID: `}))
          .setDescription(`${message.mentions.members.first().id}`)
          .setTimestamp()
          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
          sendWithWebhookCheck(message.channel, idEmbed)
        } else
        if (message.mentions.roles.size == true) 
        {
          let idEmbed = new Discord.MessageEmbed()
          .setColor('#ff0000')
          .setTitle(translating(language, {english: `ID of role ${message.mentions.roles.first().name}: `, polish: `ID roli ${message.mentions.roles.first().name}: `, croatian: `ID od uloge ${message.mentions.roles.first().name}: `, korean: `${message.mentions.roles.first().name}의 ID:`}))
          .setDescription(`${message.mentions.roles.first().id}`)
          .setTimestamp()
          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
          sendWithWebhookCheck(message.channel, idEmbed)
        } 
        else 
        {
          sendWithWebhookCheck(message.channel, translating(language, {english: 'Invalid argument!\nCorrect usage: `[prefix]id (server/guild/[member mention]/[channel mention]/[role mention])`\nExamples: `.id server`, `.id #general`', polish: 'Niepoprawny argument!\nPoprawne użycie: `[prefix]id (server/guild/[oznaczenie użytkownika]/[oznaczenie kanału]/[oznaczenie roli])`\nPrzykłady: `.id server`, `.id #ogólny`', croatian: 'Netočan argument!\nOvo je točan način: `[prefix]id (server/guild/[spomenite člana]/[spomenite kanal]/[spomenite ulogu])`\nPrimjeri: `.id server`, `.id #general`', korean: '대상이 올바르지 않습니다\n올바른 사용법: `[접두사]id (서버/길드/[멤버 언급]/[채널 언급]/[역할 언급]\n예: `.id server`, `.id #general``)'}))
        }

      } 


      else if (primaryCommand.toLowerCase() == prefix + "help") 
      {
        let serverCmds = await db.fetch(`customRoleCommandsOfServer${message.guild.id}`)
        const helpEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(translating(language, {english: `My commands:`, polish: `Moje komendy:`, korean: `나의 명령어:`}))
        .addFields(
          { name: translating(language, {english: "Administrator's commands:", polish: "Komendy administratora:", korean: `어드민의 명령어:`}), value: administratorsCommands },
          { name: translating(language, {english: "Normal commands:", polish: "Normalne komendy:", korean: `평범한 명령어:`}), value: normalCommands },
          { name: translating(language, {english: "Economic commands:", polish: "Ekonomiczne komendy:", korean: `경제적인 명령어:`}), value: economicCommands },
          { name: translating(language, {english: "Settings commands:", polish: "Komendy ustawień:", korean: `세팅 명령어:`}), value: settingsCommands },
          { name: translating(language, {english: "Info commands:", polish: "Informacyjne komendy:", korean: `정보 명령어:`}), value: infoCommands },
          { name: translating(language, {english: "Control commands:", polish: "Komendy kontrolne:", korean: `조종 명령어:`}), value: controlCommands },
          { name: translating(language, {english: "Server commands:", polish: "Komendy serwerowe:", korean: `조종 명령어:`}), value: (serverCmds == null || serverCmds.length == 0) ? translating(language, {english: "[no commands]", polish: "[brak komend]"}) : serverCmds.map(x=>x.name) },
        )
        .setTimestamp()
        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, korean: `${primaryCommand} ${message.author.tag} 가 세팅함`}), message.author.avatarURL());
      
      sendWithWebhookCheck(message.channel, helpEmbed);
      }


      else if (primaryCommand.toLowerCase() == prefix + "language") 
      {
        if (!message.member.hasPermission('MANAGE_GUILD')) sendWithWebhookCheck(translating(language, {english: `You cannot manage this setting!`, polish: `Nie możesz zarządzać tym ustawieniem!`, croatian: `Vi nemožete postaviti ovu postavku!`}))
        let embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(translating(language, {english: `Managing language by ${message.author.tag}: `, polish: `Zarządzanie językiem przez ${message.author.tag}: `, croatian: `Izabir jezika od ${message.author.tag}: `, korean: `언어 세팅자: ${message.author.tag}: `}))
        .setDescription(translating(language, {english: `**Pick the language:**`, polish: `**Wybierz język:**`, croatian: `**Izaberite jezik:**`, korean: `**언어를 골라주세요:** `}) + `\n🏴󠁧󠁢󠁥󠁮󠁧󠁿 - English\n🇵🇱 - Polski (Polish)\n🇰🇷 - 한국어 (Korean)\n🇭🇷 - Hrvatski (Croatian)`)
        .setTimestamp()
        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`, korean: `${primaryCommand} ${message.author.tag} 가 세팅함`}), message.author.avatarURL());
        message.channel.send(embed)
        .then(function(msg)
        {
          //🇭🇷
          msg.react('🏴󠁧󠁢󠁥󠁮󠁧󠁿')
          .then(msg.react('🇵🇱'))
          .then(msg.react('🇰🇷'))
          .then(msg.react('🇭🇷'))

          msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '🏴󠁧󠁢󠁥󠁮󠁧󠁿' || reaction.emoji.name == '🇵🇱' || reaction.emoji.name == '🇭🇷' || reaction.emoji.name == '🇰🇷'),
          { max: 1, time: 30000 }).then(async function(collected) 
          {
            if (collected.first().emoji.name == '🏴󠁧󠁢󠁥󠁮󠁧󠁿') await db.set(`languageOfServer${message.guild.id}`, "english")
            else if (collected.first().emoji.name == '🇵🇱') await db.set(`languageOfServer${message.guild.id}`, "polish")
            else if (collected.first().emoji.name == '🇭🇷') await db.set(`languageOfServer${message.guild.id}`, "croatian")
            else if (collected.first().emoji.name == '🇰🇷') await db.set(`languageOfServer${message.guild.id}`, "korean")
            msg.reactions.removeAll()

            language = await db.fetch(`languageOfServer${message.guild.id}`)

            let embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(translating(language, {english: `Managing language by ${message.author.tag}: `, polish: `Zarządzanie językiem przez ${message.author.tag}: `, croatian: `Izabir jezika od ${message.author.tag}: `, korean: `언어 제작자: ${message.author.tag}:`}))
            .setDescription(translating(language, {english: `**Server language set to English!**`, polish: `**Ustawiono język serwera na Polski!**`, croatian: `**Jezik servera je postavljen na Hrvatski!**`, korean: `**서버 언어가 한국어로 세팅되었습니다!**`}))
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`, korean: `${primaryCommand} ${message.author.tag} 가 세팅함`}), message.author.avatarURL());
            msg.edit(embed)
          })
        })
      }


      else if (primaryCommand.toLowerCase() == prefix + "clear" || primaryCommand.toLowerCase() == prefix + "purge") 
      {
        if (arguments.length != 1) return sendWithWebhookCheck(message.channel, translating(language, {english: "Incorrect number of arguments! \nCorrect usage: `[prefix]clear [number of messages to delete (1-100)]`\nExample: `.clear 5`", polish: "Niepoprawna liczba argumentów! \nPoprawne użycie: `[prefix]clear [liczba wiadomości do usunięcia (1-100)]`\nPrzykład:: `.clear 5`"}));
        var numberOfMessagesToDelete = parseInt(argumentsNotSplited);
        if (!message.guild.me.hasPermission(['MANAGE_MESSAGES'])) return sendWithWebhookCheck(message.channel, translating(language, {english: "I cannot manage messages!", polish: "Nie mogę zarządzać wiadomościami!"}));
        if (!message.member.hasPermission(['MANAGE_MESSAGES'])) return sendWithWebhookCheck(message.channel, translating(language, {english: "You cannot manage messages!", polish: "Nie możesz zarządzać wiadomościami!"}));
        if (isNaN(numberOfMessagesToDelete)) return sendWithWebhookCheck(message.channel,  translating(language, {english: "Enter a valid number! \nCorrect usage: `[prefix]clear [number of messages to delete (1-100)]`\nExample: `.clear 5`", polish: "Wprowadź liczbę wiadomości do usunięcia! \nPoprawne użycie: `[prefix]clear [liczba wiadomości do usunięcia (1-100)]`\nPrzykład:: `.clear 5`"}));
        if (numberOfMessagesToDelete <= 0 || 100 < numberOfMessagesToDelete) return sendWithWebhookCheck(message.channel,  translating(language, {english: "Incorrect number of messages to delete! \nCorrect usage: `[prefix]clear [number of messages to delete (1-100)]`\nExample: `.clear 5`", polish: "Wprowadzono niepoprawną liczbę wiadomości do usunięcia! \nPoprawne użycie: `[prefix]clear [liczba wiadomości do usunięcia (1-100)]`\nPrzykład:: `.clear 5`"}));
        var messagesToDeleteTogether = numberOfMessagesToDelete;
        await message.delete()
        message.channel.bulkDelete(messagesToDeleteTogether).then(async function() {
          sendWithWebhookCheck(message.channel,  translating(language, {english: "Deleted `" + messagesToDeleteTogether + "` messages!", polish: "Usunięto `" + messagesToDeleteTogether + "` wiadomości!"}))
          .then(function(msg) 
          {
            msg.delete({ timeout: 3000 })
          })
          /*initPromise(message.channel)
          .then(function(result) {
          console.log(result); // "initResolve"
          return "normalReturn";
          })*/
        });
      }  


      else if (primaryCommand.toLowerCase() == prefix + "ban") 
      {
        if(arguments.length == 0) return sendWithWebhookCheck(message.channel, translating(language, {english: "Incorrect number of arguments!\nCorrect usage: `[prefix]ban [member mention] ([reason])`", polish: "Niepoprawna liczba argumentów!\nPoprawne użycie: `[prefix]ban [oznaczenie użytkownika] ([przyczyna])`", korean: "명령어가 올바르지 않습니다!\n올바른 사용법: `[접두사]ban [멤버 언급] ([이유])`"}))
        let member = message.mentions.members.first();
        if (!message.guild.me.hasPermission(['BAN_MEMBERS'])) {
          sendWithWebhookCheck(message.channel, translating(language, {english: "I cannot ban members!", polish: "Nie mogę banować innych!", korean: "저는 멤버를 밴 할수 있는 권한이 없습니다!"}));
          return;
      } 
      else if (!message.member.hasPermission(['BAN_MEMBERS'])) {
          sendWithWebhookCheck(message.channel, translating(language, {english: "You cannot ban members!", polish: "Nie możesz banować innych!", korean: "당신은 맴버를 밴 할 권한이 없습니다!"}));
          return;
      } 
      if (message.member.roles.highest.position <= member.roles.highest.position || member.id == message.guild.ownerID) 
      {
        sendWithWebhookCheck(message.channel, translating(language, {english: "You cannot ban this member because their greatest role is higher than yours, is equal or that's the server's owner!", polish: "Nie możesz zbanować tego użytkownika ponieważ jego najwyższa rola jest wyższa niż Twoja, jest taka sama lub to właściciel serwera!", korean: `당신이 밴 하려 한사람은 제일 높은 역할이 당신 보다 높거나, 같거나, 아니면 서버의 소유자입니다!`}));
        return;
      } 
      else if (message.guild.me.roles.highest.position <= member.roles.highest.position || member.id == message.guild.ownerID) 
      {
        sendWithWebhookCheck(message.channel, translating(language, {english: "I cannot ban this member because their greatest role is higher than mine, is equal or that's the server's owner!", polish: "Nie mogę zbanować tego użytkownika ponieważ jego najwyższa rola jest wyższa niż moja, jest taka sama lub to właściciel serwera!", korean: `당신이 밴하려 한사람은 제일 높은 역할이 저보다 높거나, 같거나, 서버의 소유자 입니다!`}));
        return;
      }
      let reason;
      if (!argumentsNotSplited) reason = translating(language, {english: "[none]", polish: "[brak]", korean: "[이유 없음]"})
      else reason = argumentsNotSplited
        member.ban({reason: reason}).then((member) => {
          if (arguments.length == 1) 
          {
            sendWithWebhookCheck(message.channel, translating(language, {english: `${member.displayName} has been banned!`, polish: `${member.displayName} został zbanowany!`}));
            member.user.send(translating(language, {english: `You have been banned from ${message.guild.name}!`, polish: `Zostałeś zbanowany z serwera ${message.guild.name}!`, korean: `당신은 ${message.guild.name}에서 밴을 당했습니다!`}))
          } else 
          {
            sendWithWebhookCheck(message.channel, translating(language, {english: `${member.displayName} has been banned for: ${argumentsWithoutPing}!`, polish: `${member.displayName} został zbanowany za: ${argumentsWithoutPing}!`}));
            member.user.send(translating(language, {english: `You have been banned from ${message.guild.name} for: ${argumentsWithoutPing}!`, polish: `Zostałeś zbanowany z ${message.guild.name} za: ${argumentsWithoutPing}!`, korean: `당신은 ${message.guild.name}에서 ${argumentsWithoutPing}의 이유로 밴을 당했습니다!`}))
          }
        }).catch(() => {
          sendWithWebhookCheck(message.channel, translating(language, {english: `Something went wrong with banning this member! Try again.`, polish: `Coś poszło nie tak podczas banowania tego użytkownika! Spróbuj ponownie.`, korean: `이 맴버를 밴하는것에서 오류가 생겼습니다! 다시 시도해주세요.`}))
        })
      }


      else if (primaryCommand.toLowerCase() == prefix + "kick") 
      {
        if(arguments.length == 0) return sendWithWebhookCheck(message.channel, translating(language, {english: "Incorrect number of arguments!\nCorrect usage: `[prefix]kick [member mention] ([reason])`", polish: "Niepoprawna liczba argumentów!\nPoprawne użycie: `[prefix]kick [oznaczenie użytkownika] ([przyczyna])`"}))
        let member = message.mentions.members.first();
        if (!message.guild.me.hasPermission(['KICK_MEMBERS'])) {
          sendWithWebhookCheck(message.channel, translating(language, {english: "I cannot kick members!", polish: "Nie mogę wyrzucać innych!"}));
          return;
      } 
      else if (!message.member.hasPermission(['KICK_MEMBERS'])) {
          sendWithWebhookCheck(message.channel, translating(language, {english: "You cannot kick members!", polish: "Nie możesz wyrzucać innych!"}));
          return;
      } 
      else if (message.member.roles.highest.position <= member.roles.highest.position || member.id == message.guild.ownerID) 
      {
        sendWithWebhookCheck(message.channel, translating(language, {english: "You cannot kick this member because their greatest role is higher than yours, is equal or that's the server's owner!", polish: "Nie możesz wyrzucić tego użytkownika ponieważ jego najwyższa rola jest wyższa niż Twoja, jest taka sama lub to właściciel serwera!"}));
        return;
      } 
      else if (message.guild.me.roles.highest.position <= member.roles.highest.position || member.id == message.guild.ownerID) 
      {
        sendWithWebhookCheck(message.channel, translating(language, {english: "I cannot kick this member because their greatest role is higher than mine, is equal or that's the server's owner!", polish: "Nie mogę wyrzucić tego użytkownika ponieważ jego najwyższa rola jest wyższa niż moja, jest taka sama lub to właściciel serwera!"}));
        return;
      }
      let reason;
      if (!argumentsNotSplited) reason = translating(language, {english: "None", polish: "Brak"})
      else reason = argumentsNotSplited
        member.kick({reason: reason}).then((member) => {
          if (arguments.length == 1) 
          {
            sendWithWebhookCheck(message.channel, translating(language, {english: `${member.displayName} has been kicked!`, polish: `${member.displayName} został wyrzucony!`}));
            member.user.send(translating(language, {english: `You have been kicked from ${message.guild.name}!`, polish: `Zostałeś wyrzucony z serwera ${message.guild.name}!`}))
          } else 
          {
            sendWithWebhookCheck(message.channel, translating(language, {english: `${member.displayName} has been kicked for: ${argumentsWithoutPing}!`, polish: `${member.displayName} został wyrzucony za: ${argumentsWithoutPing}!`}));
            member.user.send(translating(language, {english: `You have been kicked from ${message.guild.name} for: ${argumentsWithoutPing}!`, polish: `Zostałeś wyrzucony z ${message.guild.name} za: ${argumentsWithoutPing}!`}))
          }
        }).catch(() => {
          sendWithWebhookCheck(message.channel, translating(language, {english: `Something went wrong with kicking this member! Try again.`, polish: `Coś poszło nie tak podczas wyrzucania tego użytkownika! Spróbuj ponownie.`}))
        })
      } 
      //translating(language, {english: ``, polish: ``})
      //translating(language, {english: ``, polish: ``, croatian: ``, korean: ``})

      else if (primaryCommand.toLowerCase() == prefix + "prefix") 
      {
        if (arguments.length == 0) 
        {
          sendWithWebhookCheck(message.channel, translating(language, {english: "Current prefix is: `" + prefix + "`. To change prefix type `" + prefix + "prefix [new prefix]`.", polish: "Obecny prefix to: `" + prefix + "`. Aby zmienić prefix napisz `" + prefix + "prefix [new prefix]`."}));
        } else
        if (arguments.length == 1) 
        {
          if (!message.member.hasPermission('MANAGE_GUILD')) return sendWithWebhookCheck(message.channel, translating(language, {english: "You don't have permission to change the prefix! (This action requires `Manage Server` permission.)", polish: "Nie możesz zmienić prefix'u bota! (Wymaga to premisji `Zarządzanie serwerem`.)"}));
          await db.set(`prefix_${message.guild.id}`, arguments)
          sendWithWebhookCheck(message.channel, translating(language, {english: "The bot's prefix has been set to `" + arguments + "`!", polish: "Ustawiono prefix bota na `" + arguments + "`!"}))
          message.guild.me.setNickname(`[${arguments}] ${client.user.username}`)
        } else 
        {
          sendWithWebhookCheck(message.channel, translating(language, {english: "The prefix can include only one parameter!", polish: "Prefix może składać się tylko z jednego parametru!"}))
        }
      } 


      else if (primaryCommand.toLowerCase() == prefix + "role" || primaryCommand.toLowerCase() == prefix + "r") 
      {
        //console.log(arguments)
        if (arguments.length != 2) 
        {
          sendWithWebhookCheck(message.channel, translating(language, {english: "Incorrect number of arguments!\nCorrect usage: `[prefix]role [member mention/member's ID] [role mention/role's ID]`", polish: "Niepoprawna liczba argumentów!\nPoprawne użycie: `[prefix]role [oznaczenie użytkownika/ID użytkownika] [oznaczenie roli/ID roli]`"}))
          console.log(arguments)
          console.log(argumentsNotSplited)
          return
        } 
        if (!message.guild.me.hasPermission(['MANAGE_ROLES'])) return sendWithWebhookCheck(message.channel, translating(language, {english: "I cannot manage roles!", polish: "Nie mogę zarządzać rolami!"}))
        if (!message.member.hasPermission(['MANAGE_ROLES'])) return sendWithWebhookCheck(message.channel, translating(language, {english: "You cannot manage roles!", polish: "Nie możesz zarządzać rolami!"}))
        let member;
        if (message.mentions.members.first()) member = message.mentions.members.first();
        if (member == undefined) member = (await message.guild.members.fetch()).get(arguments[0])
        if (member == undefined) return sendWithWebhookCheck(message.channel, translating(language, {english: "No user with this mention/ID found!\nCorrect usage: `[prefix]role [member mention/member's ID] [role mention/role's ID]`", polish: "Nie znaleziono żadnego użytkownika!\nPoprawne użycie: `[prefix]role [oznaczenie użytkownika/ID użytkownika] [oznaczenie roli/ID roli]`"}))
        let role;
        if (message.mentions.roles.first()) role = message.mentions.roles.first();
        if (role == undefined) role = message.guild.roles.cache.get(arguments[1])
        if (role == undefined) return sendWithWebhookCheck(message.channel, "No role with this mention/ID found! Correct usage: \n`[prefix]role [member mention/member's ID] [role mention/role's ID]`")
        //console.log("Member: " + member.user.username)
        //console.log("Role: " + role.name)
        if (role.position >= (await message.guild.members.fetch()).get(message.author.id).roles.highest.position) return sendWithWebhookCheck(message.channel, "You cannot manage this role!")
        if (role.position >= (await message.guild.members.fetch()).get(client.user.id).roles.highest.position) return sendWithWebhookCheck(message.channel, "I cannot manage this role!")
        if (member.roles.cache.has(role.id))
        {
          member.roles.remove(role.id)
          .then(() => 
          {
            sendWithWebhookCheck(message.channel, `Role \`${role.name}\` of member **${member.user.tag}** removed!`)
          })
        }
        else
        {
          member.roles.add(role.id)
          .then(() => 
          {
            sendWithWebhookCheck(message.channel, `Role \`${role.name}\` was given to member **${member.user.tag}**!`)
          })
        }
      }


      else if (primaryCommand.toLowerCase() == prefix + "avatar" || primaryCommand.toLowerCase() == prefix + "av" || primaryCommand.toLowerCase() == prefix + "pfp" || primaryCommand.toLowerCase() == prefix + "profile") 
      {
        if (arguments.length == 0)
        {
          //const image = new Discord.MessageAttachment(message.author.avatarURL({size: 1024}))
          const avatarEmbed = new Discord.MessageEmbed()
          .setColor('#ff0000')
          .setTitle(message.author.tag + '\'s avatar: ')
          .setDescription(`**URL:** ${message.author.avatarURL({size: 1024, dynamic: true, format: 'jpg' })}\n**Image:**`)
          .setImage(message.author.avatarURL({size: 1024, dynamic: true}))
          .setTimestamp()
          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
          sendWithWebhookCheck(message.channel, avatarEmbed)
        } else
        {
          let user;
          if (message.mentions.members.first()) user = message.mentions.members.first();
          if (user == undefined) user = (await message.guild.members.fetch()).get(argumentsNotSplited)
          if (user == undefined) return sendWithWebhookCheck(message.channel, "No user found!")
          //const image = new MessageAttachment(user.displayAvatarURL({size: 1024}))
          const avatarEmbed = new Discord.MessageEmbed()
          .setColor('#ff0000')
          .setTitle(user.user.tag + '\'s avatar: ')
          .setDescription(`**URL:** ${user.user.avatarURL({size: 1024, dynamic: true})}\n**Image:**`)
          .setImage(user.user.avatarURL({size: 1024, dynamic: true}))
          .setTimestamp()
          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
          sendWithWebhookCheck(message.channel, avatarEmbed)
        }

      } 


      else if (primaryCommand.toLowerCase() == prefix + "ad") 
      {
        sendWithWebhookCheck(message.channel, await db.fetch(`fpAdvertisementOfServer${message.guild.id}`))
      }


      else if (primaryCommand.toLowerCase() == prefix + "social-credit" || primaryCommand.toLowerCase() == prefix + "sc")
      {
        let size = 0;
        if (message.mentions.members.size > 0 || message.guild.members.cache.get(arguments[0]) != undefined) size = 1;
        let member;
        if (size == 0) member = message.member
        else member = message.guild.members.cache.get(arguments[0]) || message.mentions.members.first()
        if (arguments.length == size) 
        {
          sendWithWebhookCheck(message.channel, `${(size == 0) ? "Your" : member.displayName + "'s"} social credit in this server: \`${(db.fetch(`socialCreditOf${member.id}In${message.guild.id}`) == null) ? 0 : db.fetch(`socialCreditOf${member.id}In${message.guild.id}`)}\`. 🇨🇳`)
        }
        else if (arguments[0] == "list" || arguments[0] == "l")
        {
          let members = await message.guild.members.fetch();
          let clearList = []
          members.forEach(function(m) 
          {
            let sc = db.fetch(`socialCreditOf${m.id}In${message.guild.id}`)
            if(sc != 0 && sc != null && sc != undefined)
            {
              let member = {id: m.id, sc: sc}
              clearList.push(member)
            }
          })
          for(i=0;i<clearList.length;i++)
          {
            for(j=0;j<clearList.length-1;j++)
            {
              //console.log(clearList[j])
              if(clearList[j].sc<clearList[j+1].sc) clearList.swap(j, j+1)
            }
          }
          //console.log(clearList)
          let readyText = ""
          for (i=0;i<clearList.length;i++)
          {
            readyText += `**${i+1}.** \`${members.get(clearList[i].id).user.tag}\` - \`${clearList[i].sc}\`\n`
          }
          sendWithWebhookCheck(message.channel, readyText)
        }
        else if (message.member.hasPermission(`MANAGE_ROLES`) || message.member.hasPermission(`MANAGE_GUILD`))
        {
          if (isNaN(parseInt(arguments[size])) && !arguments[size].startsWith("++") && !arguments[size].startsWith("--"))
          {
            sendWithWebhookCheck(message.channel, `Something went wrong!`)
          }
          else if (arguments[size].startsWith("++") || arguments[size].startsWith("--"))
          {
            let num
            if (arguments[size].startsWith("++")) num = arguments[size].split("").slice(2).join("")
            else if (arguments[size].startsWith("--")) num = arguments[size].split("").slice(1).join("")
            if (db.fetch(`socialCreditOf${member.id}In${message.guild.id}`) + parseInt(num) > 999999999999999999999 || db.fetch(`socialCreditOf${member.id}In${message.guild.id}`) + parseInt(num) < -999999999999999999999) return sendWithWebhookCheck(message.channel, `WTF are you trying to do bro?!`)
            await db.add(`socialCreditOf${member.id}In${message.guild.id}`, parseInt(num))
            sendWithWebhookCheck(message.channel, `${(size == 0) ? "Your" : member.displayName + "'s"} social credit has been raised by \`${num}\`. Now it's equal to \`${db.fetch(`socialCreditOf${member.id}In${message.guild.id}`)}\`! 🇨🇳`)
          }
          else if (!isNaN(parseInt(arguments[size])))
          {
            if (arguments[size] > 999999999999999999999 || arguments[size] < -999999999999999999999) return sendWithWebhookCheck(message.channel, `WTF are you trying to do bro?!`)
            await db.set(`socialCreditOf${member.id}In${message.guild.id}`, parseInt(arguments[size]))
            sendWithWebhookCheck(message.channel, `${(size == 0) ? "Your" : member.displayName + "'s"} social credit has been set to \`${db.fetch(`socialCreditOf${member.id}In${message.guild.id}`)}\`! 🇨🇳`)
          }
        } 
        else return sendWithWebhookCheck(message.channel, `You cannot manage social credit here!`)
      }


      else if (primaryCommand.toLowerCase() == prefix + "snipe" || primaryCommand.toLowerCase() == prefix + "s")
      {
        let deletedMessageData = await db.fetch(`lastMessageDeletedInChannel${message.channel.id}`)
        if (deletedMessageData == null || deletedMessageData == undefined)
        {
          const embed = new Discord.MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`Nothing to snipe!`)
          .setTimestamp()
          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
        
        sendWithWebhookCheck(message.channel, embed);
        return
        }
        //console.log(deletedMessageData)
        let author = deletedMessageData[1]
        let attachment = deletedMessageData[2]
        let messageContent;
        if (deletedMessageData[0].size >= 1000)
        {
          messageContent = `Message too long to display!`
        }
        else 
        {
          messageContent = deletedMessageData[0]
        }

        const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`Message by ${author.tag}:`)
        .setThumbnail(author.avatarURL)
        .setTimestamp()
        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

        if (messageContent != "" && messageContent != null && messageContent != undefined) embed.setDescription(messageContent)
        if (attachment != undefined && attachment != null && (attachment.url.endsWith(".png") || attachment.url.endsWith(".jpg") || attachment.url.endsWith(".gif"))) embed.setImage(attachment.url)
      
      sendWithWebhookCheck(message.channel, embed);
      }


      else if (primaryCommand.toLowerCase() == prefix + "reveal")
      {
        let editedMessageData = await db.fetch(`lastMessageEditedInChannel${message.channel.id}`)
        if (editedMessageData == null || editedMessageData == undefined)
        {
          const embed = new Discord.MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`Nothing to reveal!`)
          .setTimestamp()
          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
        
        sendWithWebhookCheck(message.channel, embed);
        return
        }
        //console.log(deletedMessageData)
        let author = editedMessageData[0]
        let oldContent;
        let newContent;
        if (editedMessageData[1].size >= 1000)
        {
          oldContent = `Message too long to display!`
        }
        else 
        {
          oldContent = editedMessageData[1]
        }

        if (editedMessageData[2].size >= 1000)
        {
          newContent = `Message too long to display!`
        }
        else 
        {
          newContent = editedMessageData[2]
        }

        const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`Message by ${author.tag}:`)
        .addFields(
          { name: "Old message: ", value: oldContent },
          { name: "New message: ", value: newContent },
        )
        .setThumbnail(author.avatarURL)
        .setTimestamp()
        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
      
      sendWithWebhookCheck(message.channel, embed);
      }


      else if (primaryCommand.toLowerCase() == prefix + "random-size" || primaryCommand.toLowerCase() == prefix + "rs") 
      {
        if (arguments.length == 0) return sendWithWebhookCheck(message.channel, "Add text to resize!")
        if (argumentsNotSplited.length > 1000) return sendWithWebhookCheck(message.channel, `This text is too long (max 1000 characters)!`)
        let newText = [""];
        var argumentIndex = 0;
        arguments.forEach((argument) => 
        {
          newText[argumentIndex] = ""
          for (var i = 0; i < argument.length; i++) 
          {
            //newText[i] = argument[i]
            var sizeIndex = Math.floor(Math.random() * 2) + 1;
            if (sizeIndex == 1) 
            {
              newText[argumentIndex] = newText[argumentIndex] + argument[i].toLowerCase()
            }
            if (sizeIndex == 2) 
            {
              newText[argumentIndex] = newText[argumentIndex] + argument[i].toUpperCase()
            }
          }
          //console.log(newText)
          argumentIndex = argumentIndex + 1
        })
        const randomSizeEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Random sized text:')
        .setDescription(newText.join(" "))
        .setTimestamp()
        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
        sendWithWebhookCheck(message.channel, randomSizeEmbed)
      }


      else if (primaryCommand.toLowerCase() == prefix + "find" || primaryCommand.toLowerCase() == prefix + "f") 
      {
        if (arguments.length != 1) return sendWithWebhookCheck(message.channel, `Invalid number of arguments!`)
        let wasSomethingFound = false
        let foundParameter = `member`
        //console.log(client)
        let theValue = client.users.cache.get(arguments[0]) 
          if (theValue != null && theValue != undefined) 
          {
            if ((await message.guild.members.fetch()).get(arguments[0]) != undefined) isPresent = true
            else isPresent = false
            sendWithWebhookCheck(message.channel, `A ${foundParameter} found: \`${theValue.tag}\` (Present: \`${isPresent}\`)`)
            wasSomethingFound = true
          }
          foundParameter = `server`
          theValue = client.guilds.cache.get(arguments[0])
            if (theValue != null && theValue != undefined) 
            {
            sendWithWebhookCheck(message.channel, `A ${foundParameter} found: \`${theValue.name}\``)
            wasSomethingFound = true
            }
            foundParameter = `channel`
            theValue = client.channels.cache.get(arguments[0])
              if (theValue != null && theValue != undefined) 
              {
                sendWithWebhookCheck(message.channel, `A ${foundParameter} found: \`${theValue.name}\` (Server: \`${theValue.guild}\`)`)
                wasSomethingFound = true
              }
              foundParameter = `role`
              theValue = message.guild.roles.cache.get(arguments[0])
                if (theValue != null && theValue != undefined) 
                {
                  sendWithWebhookCheck(message.channel, `A ${foundParameter} found: \`${theValue.name}\` (local search)`)
                  wasSomethingFound = true
                }
                foundParameter = `emoji`
                theValue = client.emojis.cache.get(arguments[0])
                  if (theValue != null && theValue != undefined) 
                  {
                    sendWithWebhookCheck(message.channel, `An ${foundParameter} found: \`${theValue.name}\` (Server: \`${theValue.guild}\`)`)
                    wasSomethingFound = true
                  }
                    if (wasSomethingFound && (theValue == null || theValue == undefined) && (arguments[0].toLowerCase() == "gay" || arguments[0].toLowerCase() == "lgbt")) 
                    {
                      foundParameter = `gay`
                      theValue = message.author.tag
                      sendWithWebhookCheck(message.channel, `A ${foundParameter} found: \`${theValue}\` ${client.emojis.cache.find(x=>x.name.toLowerCase() == "troll")}`)
                      wasSomethingFound = true
                    }
                if (wasSomethingFound == false) sendWithWebhookCheck(message.channel, "Nothing found!")
      }


      else if (primaryCommand.toLowerCase() == prefix + "question" || primaryCommand.toLowerCase() == prefix + "q")
      {
        if (arguments.length == 0) return sendWithWebhookCheck(message.channel, "Where is the question?")
        var answerIndex = Math.floor(Math.random() * 8) + 1;
        if (answerIndex == 1) sendWithWebhookCheck(message.channel, `${message.author.tag}, of course!`)
        if (answerIndex == 2) sendWithWebhookCheck(message.channel, `${message.author.tag}, NOOOOOOOOOOOO!`)
        if (answerIndex == 3) sendWithWebhookCheck(message.channel, `${message.author.tag}, I'm not sure but I think so...`)
        if (answerIndex == 4) sendWithWebhookCheck(message.channel, `${message.author.tag}, hard question... I think you should ask your math teacher.`)
        if (answerIndex == 5) sendWithWebhookCheck(message.channel, `${message.author.tag}, I don't know but I know your son knows.`)
        if (answerIndex == 6) sendWithWebhookCheck(message.channel, `${message.author.tag}, dumb question, the answer is no!`)
        if (answerIndex == 7) sendWithWebhookCheck(message.channel, `${message.author.tag}, God is the answer for all your questions!`)
        if (answerIndex == 8) sendWithWebhookCheck(message.channel, `${message.author.tag}, +1`)
      }


      else if (primaryCommand.toLowerCase() == prefix + "invite") 
      {
        message.member.user.send("My invite link: https://discord.com/oauth2/authorize?client_id=831101496317837345&permissions=8&scope=bot\nYou need help with the bot? Check our support server: https://discord.gg/CSxQYsNZc7")
        sendWithWebhookCheck(message.channel, "Link sent in DM!")
      } 


      else if (primaryCommand.toLowerCase() == prefix + "clone-emoji" || primaryCommand.toLowerCase() == prefix + "cle") 
      {
        if (arguments.length == 0) return sendWithWebhookCheck(message.channel, translating(language, {english: "Incorrect number of arguments!\nCorrect usage: `[prefix]clone-emoji [emoji ID/emoji name] ([server ID])`", polish: "Niepoprawna liczba argumentów!\nPoprawne użycie: `[prefix]clone-emoji [ID emotki/nazwa emotki] ([ID serwera])`"}))
        if (!message.guild.me.hasPermission(['MANAGE_EMOJIS'])) return sendWithWebhookCheck(message.channel, translating(language, {english: "I cannot manage emojis!", polish: "Nie mogę zarządzać emotkami!"}))
        if (!message.member.hasPermission(['MANAGE_EMOJIS'])) return sendWithWebhookCheck(message.channel, translating(language, {english: "You cannot manage emojis!", polish: "Nie możesz zarządzać emotkami!"}))
        let emoji
        if (arguments.length != 2) 
        {
          emoji = client.emojis.cache.get(arguments[0])
          if (emoji == undefined || emoji == null) emoji = client.emojis.cache.find(emoji => emoji.name === arguments[0]) 
        }
        else 
        {
          let gld = client.guilds.cache.get(arguments[1])
          if (gld == undefined || gld == null) return sendWithWebhookCheck(message.channel, translating(language, {english: "No server found!", polish: "Nie znaleziono serwera!"}))
          emoji = gld.emojis.cache.get(arguments[0])
          if (emoji == undefined || emoji == null) emoji = gld.emojis.cache.find(emoji => emoji.name === arguments[0]) 
        }
        if (emoji == undefined || emoji == null) return sendWithWebhookCheck(message.channel, translating(language, {english: "No emoji found!", polish: "Nie znaleziono emotki!"}))
        message.guild.emojis.create(emoji.url, emoji.name)
        .then(newEmoji => 
          {
            const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(translating(language, {english: "Emoji cloned:", polish: "Sklonowano emotkę:"}))
            .setDescription(translating(language, {english: `Emoji ${newEmoji} successfully cloned from server \`${emoji.guild.name}\`!`, polish: `Pomyślnie sklonowano emotkę ${newEmoji} z serwera \`${emoji.guild.name}\`!`}))
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            sendWithWebhookCheck(message.channel, embed)
          })
      }


      else if (primaryCommand.toLowerCase() == prefix + "role-commands" || primaryCommand.toLowerCase() == prefix + "rc")
      {
        if (!message.member.hasPermission('MANAGE_ROLES')) return sendWithWebhookCheck(message.channel, "You cannot manage this setting!")
        const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Role commands menu:')
        .setDescription('What do you want to do?')
        //.setThumbnail('https://i.imgur.com/wSTFkRM.png')
        .addFields(
          { name: "🗒️ - overview", value: "Show details of existing role commands" },
          { name: "📝 - create a new command", value: "Create a new role command for this server" },
          { name: "🗑️ - delete a command", value: "Delete an unwanted role command" },
          { name: "⛔ - cancel", value: "Exit role commands menu" },
        )
        //.addField('Inline field title', 'Some value here', true)
        //.setImage('https://i.imgur.com/wSTFkRM.png')
        .setTimestamp()
        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
      
      message.channel.send(embed)
      .then((msg) => 
      {
        msg.react('🗒️')
        .then(msg.react('📝'))
        .then(msg.react('🗑️'))
        .then(msg.react('⛔'))

        msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '📝' || reaction.emoji.name == '🗒️' || reaction.emoji.name == '🗑️' || reaction.emoji.name == '⛔'),
        { max: 1, time: 1000 * 60 }).then(async function(collected) 
        {
          if(await db.fetch(`customRoleCommandsOfServer${message.guild.id}`) == null) await db.set(`customRoleCommandsOfServer${message.guild.id}`, [])
          let commands = await db.fetch(`customRoleCommandsOfServer${message.guild.id}`)
          msg.reactions.removeAll()
          //let commands = [{name: "first name", rolesAdded: [{name: "role1"}, {name: "role2"}], rolesRemoved: [{name: "role3"}, {name: "role4"}] }, {name: "second name", rolesAdded: [{name: "role1"}, {name: "role2"}], rolesRemoved: [{name: "role3"}, {name: "role4"}] }]
          if (collected.first().emoji.name == '🗒️') 
          {
            const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Role commands overview:')
            //.setDescription('What do you want to do?')
            //.addField('Inline field title', 'Some value here', true)
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
          
            if (commands.length != 0)
            {
              commands.forEach(function(command)
              {
                embed.addField(`Command \`${command.name}\`:`, `**Member search:**\n\`${command.receiver}\`\n**Permission:**\n\`${command.permission.split("_").join(" ").toLowerCase()}\`\n**Roles added:**\n${(command.rolesToAdd.length > 0) ? `\`${command.rolesToAdd.map((role) => role.name).join('``, `')}\``:`\`[no roles]\``}\n**Roles removed:**\n${(command.rolesToRemove == "all") ? "`all`" : `${(command.rolesToRemove.length > 0) ? `\`${command.rolesToRemove.map((role) => role.name).join('``, `')}\``:`\`[no roles]\``}`}`)
              })
            }
            else 
            {
              embed.setDescription('There are no role commands on this server yet!')
            }

            msg.edit(embed)
          }

          else if (collected.first().emoji.name == '📝')
          {
            let name;
            let receiver;
            let permission;
            let permissionToShow;
            let rolesToRemove = [];
            let rolesToAdd = [];
            const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Creating command:')
            .setDescription('First please give the command a name! It cannot include either spaces or more than 20 characters. Also make sure a command with this name doesn\'t exist yet. Do it in the chat now.')
            //.addField('Inline field title', 'Some value here', true)
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

            msg.edit(embed)

            let collected = await message.channel.awaitMessages(m => m.author.id == message.author.id, {max: 1, time: 60000})
            if (collected.first().content.length > 20 || collected.first().content.includes(" "))
            {
              msg.reactions.removeAll()
              const embed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Operation error!')
              .setDescription('Name of the new command is too long or includes spaces!')
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
            msg.edit(embed)
            return;
            }

            name = collected.first().content
            if (administratorsCommands.includes(name) || settingsCommands.includes(name) || economicCommands.includes(name) || normalCommands.includes(name) || infoCommands.includes(name) || controlCommands.includes(name) || commands.map(x=>x.name).includes(name))
            {
              msg.reactions.removeAll()
              const embed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Operation error!')
              .setDescription('A command with this name already exists!')
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
            msg.edit(embed)
            return;
            }


            const embed2 = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Creating command:')
            .setDescription(`Good! The neme of the command just got set to \`${name}\`. Now please point who will receive/loose roles. Do it in the chat now.\n\`me\` - command author\n\`mention\` - member mentioned in the command\n\`id\` - member with ID pointed in the command`)
            //.addField('Inline field title', 'Some value here', true)
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

            msg.edit(embed2)

            let collected2 = await message.channel.awaitMessages(m => m.author.id == message.author.id, {max: 1, time: 60000})
            if (collected2.first().content.toLowerCase() != "me" && collected2.first().content.toLowerCase() != "mention" && collected2.first().content.toLowerCase() != "id")
            {
              msg.reactions.removeAll()
              const embed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Operation error!')
              .setDescription('You didn\'t choose a valid option!')
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
            msg.edit(embed)
            return;
            }
            receiver = collected2.first().content.toLowerCase()

            let permissions = [`administrator`, `manage guild`, `manage roles`, `manage channels`]
            const embed3 = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Creating command:')
            .setDescription(`Great! The receiver just got set to \`${receiver}\`. Now please point what permission will author need to use this command. Use \`no\` if no permission is required. Do it in the chat now.\nAvailable permissions: \`${permissions.join("`, `")}\``)
            //.addField('Inline field title', 'Some value here', true)
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

            msg.edit(embed3)

            let collected3 = await message.channel.awaitMessages(m => m.author.id == message.author.id, {max: 1, time: 60000})
            if (!permissions.includes(collected3.first().content.toLowerCase()) && collected3.first().content.toLowerCase() != "no")
            {
              msg.reactions.removeAll()
              const embed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Operation error!')
              .setDescription('You didn\'t choose a valid option!')
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
            msg.edit(embed)
            return;
            }
            permission = collected3.first().content.toUpperCase().split(" ").join("_")
            permissionToShow = collected3.first().content.toLowerCase()

            //let permissions = [`aministrator`, `manage guild`, `manage roles`, `manage channels`]
            const embed4 = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Creating command:')
            .setDescription(`All right! The required permission just got set to \`${permissionToShow}\`. Now please mention or send IDs of all roles you want to be given. There can be max 5 roles! Use \`no\` if no role shall be given. Do it in the chat now.`)
            //.addField('Inline field title', 'Some value here', true)
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

            msg.edit(embed4)

            let collected4 = await message.channel.awaitMessages(m => m.author.id == message.author.id, {max: 1, time: 60000 * 3})
            let receivedMessage = collected4.first().content.split(" ")
            //console.log(receivedMessage)
            receivedMessage.forEach(arg => 
              {
                
                if (arg.startsWith("<@&") && arg.endsWith(">"))
                {
                  id = arg.split("")
                  part1 = id.slice(3)
                  part2 = part1.slice(0,-1)
                  ready = part2.join("")
                  let found = message.guild.roles.cache.get(ready)
                  if(!rolesToAdd.includes(found) && found.id != message.guild.id) 
                  {
                    if(shouldManageRole(message.member, found)) rolesToAdd.push(found)
                    else rolesToAdd.push("unmanageable")
                  }
                  
                  //console.log(ready)
                }
                else if(message.guild.roles.cache.get(arg) != undefined)
                {
                  let found = message.guild.roles.cache.get(arg)
                  if(!rolesToAdd.includes(found) && found.id != message.guild.id) 
                  {
                    if(shouldManageRole(message.member, found)) rolesToAdd.push(found)
                    else rolesToAdd.push("unmanageable")
                  }
                  //console.log(arg)
                }
              })
            if (rolesToAdd.includes(undefined))
            {
              msg.reactions.removeAll()
              const embed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Operation error!')
              .setDescription('Some mentions/IDs are invalid!')
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
            msg.edit(embed)
            return;
            }
            if (rolesToAdd.length > 5)
            {
              msg.reactions.removeAll()
              const embed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Operation error!')
              .setDescription(`You provided too many roles (${rolesToAdd}/5)!`)
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
            msg.edit(embed)
            return;
            }
            if (rolesToAdd.includes("unmanageable"))
            {
              msg.reactions.removeAll()
              const embed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Operation error!')
              .setDescription(`You/me cannot manage some provided roles!`)
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
            msg.edit(embed)
            return;
            }


            const embed5 = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Creating command:')
            .setDescription(`We are almost there! The roles to add were saved. Now please mention or send IDs of all roles you want to be removed. There can be max 5 roles! Use \`no\` if no role shall be removed or \`all\` to remove all roles. Do it in the chat now.`)
            //.addField('Inline field title', 'Some value here', true)
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

            msg.edit(embed5)

            let collected5 = await message.channel.awaitMessages(m => m.author.id == message.author.id, {max: 1, time: 60000 * 3})
            if (collected5.first().content.toLowerCase() != "all")
            {
              let receivedMessage2 = collected5.first().content.split(" ")

              receivedMessage2.forEach(arg => 
                {
                  
                  if (arg.startsWith("<@&") && arg.endsWith(">"))
                  {
                    id = arg.split("")
                    part1 = id.slice(3)
                    part2 = part1.slice(0,-1)
                    ready = part2.join("")
                    let found = message.guild.roles.cache.get(ready)
                    if(!rolesToRemove.includes(found) && found.id != message.guild.id) 
                    {
                      if(shouldManageRole(message.member, found)) rolesToRemove.push(found)
                      else rolesToRemove.push("unmanageable")
                    }
                    
                    //console.log(ready)
                  }
                  else if(message.guild.roles.cache.get(arg) != undefined)
                  {
                    let found = message.guild.roles.cache.get(arg)
                    if(!rolesToRemove.includes(found) && found.id != message.guild.id) 
                    {
                      if(shouldManageRole(message.member, found)) rolesToRemove.push(found)
                      else rolesToRemove.push("unmanageable")
                    }
                    //console.log(arg)
                  }
                })
              if (rolesToRemove.includes(undefined))
              {
                msg.reactions.removeAll()
                const embed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Operation error!')
                .setDescription('Some mentions/IDs are invalid!')
                .setTimestamp()
                .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
              
              msg.edit(embed)
              return;
              }
              if (rolesToRemove.length > 5)
              {
                msg.reactions.removeAll()
                const embed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Operation error!')
                .setDescription(`You provided too many roles (${rolesToAdd}/5)!`)
                .setTimestamp()
                .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
              
              msg.edit(embed)
              return;
              }
              if (rolesToRemove.includes("unmanageable"))
              {
                msg.reactions.removeAll()
                const embed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Operation error!')
                .setDescription(`You/me cannot manage some provided roles!`)
                .setTimestamp()
                .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
              
              msg.edit(embed)
              return;
              }
            }
            else rolesToRemove = "all";

            const embed6 = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Creating command:')
            .setDescription(`Everything is ready! Confirm to create the command!`)
            //.addField('Inline field title', 'Some value here', true)
            .addFields(
              { name: "Name:", value: `\`${name}\`` },
              { name: "Member search:", value: `\`${receiver}\`` },
              { name: "Required permission:", value: `\`${permissionToShow}\`` },
              { name: "Roles added", value: `\`${rolesToAdd.map(x=>x.name).join("`, `")}\`` },
              { name: "Roles removed", value: `${(rolesToRemove == "all") ? "`all`" : `\`${rolesToRemove.map(x=>x.name).join("`, `")}\``}` },
            )
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

            msg.edit(embed6)
            //console.log(rolesToAdd.map(x=>x.name))
            msg.react('✅')
            .then(msg.react('⛔'))

            let collected6 = await msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '⛔'), { max: 1, time: 30000 })
            if (collected6.first().emoji.name == '✅')
            {
              let command = 
              {
                name: name,
                receiver: receiver,
                permission: permission,
                rolesToAdd: rolesToAdd,
                rolesToRemove: rolesToRemove
              }
              commands.push(command)
              await db.set(`customRoleCommandsOfServer${message.guild.id}`, commands)

              msg.reactions.removeAll()
              const endEmbed = new Discord.MessageEmbed()
              .setColor('#32CD32')
              .setTitle('Creating command:')
              .setDescription(`Command \`${name}\` successfully created!`)
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
              msg.edit(endEmbed)
            }
            else 
            {
              msg.reactions.removeAll()
              const endEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Operation cancelled!')
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
              msg.edit(endEmbed)
              return;
            }
          } 

          else if (collected.first().emoji.name == '🗑️')
          {
            const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Deleting command:')
            .setDescription(`Which command do you wish to delete? Send it's name in the chat now.\n\`${commands.map(x=>x.name).join("`\n`")}\``)
            //.addField('Inline field title', 'Some value here', true)
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

            msg.edit(embed)

            let collected = await message.channel.awaitMessages(m => m.author.id == message.author.id, {max: 1, time: 60000})
            if (collected == undefined) 
            {
              msg.reactions.removeAll()
              const endEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Operation cancelled!')
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
              msg.edit(endEmbed)
              return;
            }
            let receivedMessage = collected.first().content.toLowerCase()
            if (commands.map(x=>x.name).includes(receivedMessage))
            {
              let command = commands.find(x => x.name == receivedMessage)
              const embed = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .setTitle('Deleting command:')
              .setDescription(`Are you sure you want to delte \`${command.name}\`?`)
              //.addField('Inline field title', 'Some value here', true)
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
  
              msg.edit(embed) 

              msg.react('✅')
              .then(msg.react('⛔'))
  
              let collected2 = await msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '⛔'), { max: 1, time: 30000 })
              if (collected2.first().emoji.name == '✅')
              {
                let newCommands = commands.filter(x => x != command)
                await db.set(`customRoleCommandsOfServer${message.guild.id}`, newCommands)

                msg.reactions.removeAll()
                const endEmbed = new Discord.MessageEmbed()
                .setColor('#32CD32')
                .setTitle('Deleting command:')
                .setDescription(`Command \`${command.name}\` successfully deleted!`)
                .setTimestamp()
                .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
              
                msg.edit(endEmbed)
              }
              else 
              {
                msg.reactions.removeAll()
                const endEmbed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Operation cancelled!')
                .setTimestamp()
                .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
              
                msg.edit(endEmbed)
                return;
              }
            }
            else
            {
              msg.reactions.removeAll()
              const embed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Operation error!')
              .setDescription('No command with this name found!')
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
            msg.edit(embed)
            return;
            }
          }

          else
          {
            msg.reactions.removeAll()
            const endEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle('Operation cancelled!')
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
          
            msg.edit(endEmbed)
            return;
          }
        })
      })
      }


      else if (primaryCommand.toLowerCase() == prefix + "create-emoji" || primaryCommand.toLowerCase() == prefix + "cre") 
      {
        if (!message.guild.me.hasPermission(['MANAGE_EMOJIS'])) return sendWithWebhookCheck(message.channel, "I cannot manage emojis!")
        if (!message.member.hasPermission(['MANAGE_EMOJIS'])) return sendWithWebhookCheck(message.channel, "You cannot manage emojis!")
        if (arguments.length != 2) return sendWithWebhookCheck(message.channel, "Wrong number of arguments!")
        message.guild.emojis.create(arguments[1], arguments[0])
        .then(newEmoji => 
          {
          if (newEmoji != undefined && newEmoji != null) sendWithWebhookCheck(message.channel, `Created ${newEmoji}!`)
          else (sendWithWebhookCheck(message.channel, `Something went wrong with creating the emoji!`))
          }).catch(() => {
            sendWithWebhookCheck(message.channel, `Something went wrong with creating the emoji!`)
          })
      }


      else if (primaryCommand.toLowerCase() == prefix + "fonting" || primaryCommand.toLowerCase() == prefix + "fn")
      {
        if (!message.member.hasPermission('MANAGE_CHANNELS')) return sendWithWebhookCheck(message.channel, `You don't have manage channels permission!`)
        if (!message.guild.me.hasPermission('MANAGE_CHANNELS')) return sendWithWebhookCheck(message.channel, `I don't have manage channels permission!`)

        let newFontIndex 
        let fontingStyle 
        let embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`Fonting of ${message.author.tag}: `)
        .setDescription(`**Pick the font:**\n1️⃣ - 𝐀𝐚𝐁𝐛𝐂𝐜\n2️⃣ - 𝕬𝖆𝕭𝖇𝕮𝖈\n3️⃣ - 𝒜𝒶𝐵𝒷𝒞𝒸\n4️⃣ - 𝗔𝗮𝗕𝗯𝗖𝗰\n⛔ - cancel`)
        .setTimestamp()
        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
        message.channel.send(embed)
        .then(async function(msg) {

          msg.react('1️⃣')
          .then(msg.react('2️⃣'))
          .then(msg.react('3️⃣'))
          .then(msg.react('4️⃣'))
          .then(msg.react('⛔'))

          msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '1️⃣' || reaction.emoji.name == '2️⃣' || reaction.emoji.name == '3️⃣' || reaction.emoji.name == '4️⃣' || reaction.emoji.name == '⛔'),
          { max: 1, time: 30000 })
          .then(async function(collected) {
            if (collected.first().emoji.name == '1️⃣') 
            {
              newFontIndex = 1
            }
            else if (collected.first().emoji.name == '2️⃣') 
            {
              newFontIndex = 2
            }
            else if (collected.first().emoji.name == '3️⃣') 
            {
              newFontIndex = 3
            }
            else if (collected.first().emoji.name == '4️⃣') 
            {
              newFontIndex = 4
            }
            else if (collected.first().emoji.name == '⛔') 
            {
              msg.reactions.removeAll()
              const endEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle('Operation cancelled!')
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
              msg.edit(endEmbed)
              return;
            }

            msg.reactions.removeAll()
            let embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Fonting of ${message.author.tag}: `)
            .setDescription(`**Pick the fonting type:**\n🇸 - small (general-chat)\n🇨 - capital (GENERAL-CHAT)\n🇧 - beginning (General-chat)\n🇦 - all beginnings (General-Chat)\n⛔ - cancel`)
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            msg.edit(embed)
            .then(async function(msg)
            {
              msg.react('🇸')
              .then(msg.react('🇨'))
              .then(msg.react('🇧'))
              .then(msg.react('🇦'))
              .then(msg.react('⛔'))

              msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '🇸' || reaction.emoji.name == '🇨' || reaction.emoji.name == '🇧' || reaction.emoji.name == '🇦' || reaction.emoji.name == '⛔'),
              { max: 1, time: 30000 })
              .then(async function(collected) 
              {
                if (collected.first().emoji.name == '🇸')
                {
                  fontingStyle = "small"
                }
                else if (collected.first().emoji.name == '🇨')
                {
                  fontingStyle = "capital"
                }
                else if (collected.first().emoji.name == '🇧')
                {
                  fontingStyle = "beginning"
                }
                else if (collected.first().emoji.name == '🇦')
                {
                  fontingStyle = "all beginnings"
                }
                else if (collected.first().emoji.name == '⛔') 
                {
                  msg.reactions.removeAll()
                  const endEmbed = new Discord.MessageEmbed()
                  .setColor('#FF0000')
                  .setTitle('Operation cancelled!')
                  .setTimestamp()
                  .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                
                  msg.edit(endEmbed)
                  return;
                }

                msg.reactions.removeAll()
                let textToFont = message.channel.name
                let splitTextToFont = textToFont.split("")
                let newFontCapital
                let newFontSmall
                let capitals
                let normalCapitalFont = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                let normalSmallFont = "abcdefghijklmnopqrstuvwxyz"
                let font1 = {small: ["𝐚", "𝐛", "𝐜", "𝐝", "𝐞", "𝐟", "𝐠", "𝐡", "𝐢", "𝐣", "𝐤", "𝐥", "𝐦", "𝐧", "𝐨", "𝐩", "𝐪", "𝐫", "𝐬", "𝐭", "𝐮", "𝐯", "𝐰", "𝐱", "𝐲", "𝐳"], capital: ["𝐀", "𝐁" ,"𝐂", "𝐃", "𝐄", "𝐅", "𝐆", "𝐇", "𝐈", "𝐉", "𝐊", "𝐋", "𝐌", "𝐍", "𝐎", "𝐏", "𝐐", "𝐑", "𝐒", "𝐓", "𝐔", "𝐕", "𝐖", "𝐗", "𝐘", "𝐙"]}
                let font2 = {small: ["𝖆", "𝖇", "𝖈", "𝖉", "𝖊", "𝖋", "𝖌", "𝖍", "𝖎", "𝖏", "𝖐", "𝖑", "𝖒", "𝖓", "𝖔", "𝖕", "𝖖", "𝖗", "𝖘", "𝖙", "𝖚", "𝖛", "𝖜", "𝖝", "𝖞", "𝖟"], capital: ["𝕬", "𝕭", "𝕮", "𝕯", "𝕰", "𝕱", "𝕲", "𝕳", "𝕴", "𝕵", "𝕶", "𝕷", "𝕸", "𝕹", "𝕺", "𝕻", "𝕼", "𝕽", "𝕾", "𝕿", "𝖀", "𝖁", "𝖂", "𝖃", "𝖄", "𝖅"]}
                let font3 = {small: ["𝒶", "𝒷", "𝒸", "𝒹", "𝑒", "𝒻", "𝑔", "𝒽", "𝒾", "𝒿", "𝓀", "𝓁", "𝓂", "𝓃", "𝑜", "𝓅", "𝓆", "𝓇", "𝓈", "𝓉", "𝓊", "𝓋", "𝓌", "𝓍", "𝓎", "𝓏"], capital: ["𝒜", "𝐵", "𝒞", "𝒟", "𝐸", "𝐹", "𝒢", "𝐻", "𝐼", "𝒥", "𝒦", "𝐿", "𝑀", "𝒩", "𝒪", "𝒫", "𝒬", "𝑅", "𝒮", "𝒯", "𝒰", "𝒱", "𝒲", "𝒳", "𝒴", "𝒵"]}
                let font4 = {small: ["𝗮", "𝗯", "𝗰", "𝗱", "𝗲", "𝗳", "𝗴", "𝗵", "𝗶", "𝗷", "𝗸", "𝗹", "𝗺", "𝗻", "𝗼", "𝗽", "𝗾", "𝗿", "𝘀", "𝘁", "𝘂", "𝘃", "𝘄", "𝘅", "𝘆", "𝘇"], capital: ["𝗔", "𝗕", "𝗖", "𝗗", "𝗘", "𝗙", "𝗚", "𝗛", "𝗜", "𝗝", "𝗞", "𝗟", "𝗠", "𝗡", "𝗢", "𝗣", "𝗤", "𝗥", "𝗦", "𝗧", "𝗨", "𝗩", "𝗪", "𝗫", "𝗬", "𝗭"]}
                let newName = ""
                if (newFontIndex == 1) 
                {
                  newFontCapital = font1.capital
                  newFontSmall = font1.small
                }
                else if (newFontIndex == 2) 
                {
                  newFontCapital = font2.capital
                  newFontSmall = font2.small
                }
                else if (newFontIndex == 3) 
                {
                  newFontCapital = font3.capital
                  newFontSmall = font3.small
                }
                else if (newFontIndex == 4) 
                {
                  newFontCapital = font4.capital
                  newFontSmall = font4.small
                }

                if (fontingStyle == "small")
                {
                  capitals = 0
                }
                else if (fontingStyle == "capital")
                {
                  capitals = 1000
                }
                else if (fontingStyle == "beginning")
                {
                  capitals = 1
                }
                else if (fontingStyle == "all beginnings")
                {
                  capitals = 1
                }
                splitTextToFont.forEach(function(character) 
                {
                  if (normalCapitalFont.includes(character) || normalSmallFont.includes(character))
                  {
                    let chartIndex
                    for (i = 0; i < normalCapitalFont.length; i++)
                    {
                      if (normalCapitalFont[i] == character) chartIndex = i
                      if (normalSmallFont[i] == character) chartIndex = i
                    }
                    if (capitals > 0) 
                    {
                      newName = newName + newFontCapital[chartIndex]
                      capitals = capitals - 1
                    }
                    else
                    {
                      newName = newName + newFontSmall[chartIndex]
                    }
                  }
                  else 
                  {
                    newName = newName + character
                    if (fontingStyle == "all beginnings") 
                    {
                      capitals = 1
                    }
                  }
                })

                let embed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`Fonting of ${message.author.tag}: `)
                .setDescription(`It seems that a discord cooldown occured... I will finish the action as soon as possible!`)
                .setTimestamp()
                .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                msg.edit(embed)

                message.channel.setName(newName)
                .then(function(c) 
                {
                  if (c.name == newName)
                  {
                    let embed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`Fonting of ${message.author.tag}: `)
                    .setDescription("**Channel's name successfully changed to `" + newName + "`!**")
                    .setTimestamp()
                    .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                    msg.edit(embed)
                  }
                  else 
                  {
                    let embed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`Fonting of ${message.author.tag}: `)
                    .setDescription("**It seems that something went wrong with changing channel's name. Make sure that I have the proper permission and try again.**")
                    .setTimestamp()
                    .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                    msg.edit(embed)
                  }
                })
              }).catch(() => {
                msg.reactions.removeAll()
                const templateEmbed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Operation cancelled!')
                .setTimestamp()
                .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
              
              msg.edit(templateEmbed)
              return;
          });
          })
      }).catch(() => {
        msg.reactions.removeAll()
        const templateEmbed = new Discord.MessageEmbed()
        .setColor('#FF0000')
        .setTitle('Operation cancelled!')
        .setTimestamp()
        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
      
      msg.edit(templateEmbed)
      return;
  });
      })
      }


      else if (primaryCommand.toLowerCase() == prefix + "un-spacing") 
      {
        if (!message.guild.me.hasPermission(['MANAGE_CHANNELS'])) return sendWithWebhookCheck(message.channel, "I cannot manage channels!");
        if (!message.member.hasPermission(['MANAGE_CHANNELS'])) return sendWithWebhookCheck(message.channel, "You cannot manage channels!");
        var editedChannels = 0;
        message.guild.channels.cache.forEach(async function(channel)
        {
          if (channel.name.includes("ˑ")) 
          {
            var fullNewNameUnspacing = "";
            for (var i = 0; i < channel.name.length; i++) {
              let characterToAdd = channel.name[i]
              if (characterToAdd == "ˑ") 
              {
                characterToAdd = "-"
              }
              fullNewNameUnspacing = fullNewNameUnspacing + characterToAdd
            }
            //console.log(fullNewNameUnspacing)
            channel.setName(fullNewNameUnspacing)
            editedChannels = editedChannels + 1
          }
        })
        if (editedChannels == 0) return sendWithWebhookCheck(message.channel, "No channels to edit!")
        sendWithWebhookCheck(message.channel, `${editedChannels} channels edited!`)
      }


      else if (primaryCommand.toLowerCase() == prefix + "spacing") 
      {
        if (!message.guild.me.hasPermission(['MANAGE_CHANNELS'])) return sendWithWebhookCheck(message.channel, "I cannot manage channels!");
        if (!message.member.hasPermission(['MANAGE_CHANNELS'])) return sendWithWebhookCheck(message.channel, "You cannot manage channels!");
        var editedChannels = 0;
        message.guild.channels.cache.forEach(async function(channel)
        {
          if (channel.name.includes("-") || channel.name.includes("-")) 
          {
            var fullNewNameSpacing = "";
            for (var i = 0; i < channel.name.length; i++) {
              let characterToAdd = channel.name[i]
              if (characterToAdd == "-" || characterToAdd == "-") 
              {
                characterToAdd = "ˑ"
              }
              fullNewNameSpacing = fullNewNameSpacing + characterToAdd
            }
            //console.log(fullNewNameSpacing)
            channel.setName(fullNewNameSpacing)
            editedChannels = editedChannels + 1
          }
        })
        if (editedChannels == 0) return sendWithWebhookCheck(message.channel, "No channels to edit!")
        sendWithWebhookCheck(message.channel, `${editedChannels} channels edited!`)
      }


      else if (primaryCommand.toLowerCase() == prefix + "fp-request") 
      {

        let theInvite;
        let theProperinvite
        let invites = await message.guild.fetchInvites()
        theProperinvite = await db.fetch(`fpInviteOfServer${message.guild.id}`)
        if (!message.member.hasPermission(['MANAGE_GUILD'])) return sendWithWebhookCheck(message.channel, "You cannot request partnerships! This action requires permission to manage server or administrator.")

          invites.forEach(async function(invite) {
            if (`https://discord.gg/` + invite.code == theProperinvite) 
            {
              theInvite = invite
              //sendWithWebhookCheck(message.channel, `https://discord.gg/` + theInvite.code)
            }
          })
          if (theInvite == undefined || `https://discord.gg/` + theInvite.code != theProperinvite) 
          {
            await sendWithWebhookCheck(message.channel, 'The invite of fast partnerships is not valid! Use `' + prefix + 'fp-setup` to generate a new one!')
          }
          else if (`https://discord.gg/` + theInvite.code == theProperinvite) 
          {
            if (arguments.length != 1) return sendWithWebhookCheck(message.channel, "Incorrect number of arguments! Correct usage: `[prefix]fp-request [server's ID]`")
            let serverToRequest = client.guilds.cache.get(arguments[0])
            if (serverToRequest == undefined) return sendWithWebhookCheck(message.channel, `No server with this ID found! Make sure you used a proper ID and InterManager is in the server! If you don't know how to get server's ID just use command \`${prefix}id\``)
            //sendWithWebhookCheck(message.channel, `Server found: ${serverToRequest.name}`)
            if (await db.fetch(`fpInviteOfServer${serverToRequest.id}`) == undefined || await db.fetch(`fpInviteOfServer${serverToRequest.id}`) == null) return sendWithWebhookCheck(message.channel, `Invite of the server you are requesting is not set!`)
            const fpRequestEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Fast partnership request from ${message.guild.name}`)
            .addFields(
              { name: "Fp channel: ", value: `#` + client.channels.cache.get(await db.fetch(`idOfFastPartnershipsChannelOfServer${message.guild.id}`)).name },
              { name: "Advertisement: ", value:  await db.fetch(`fpAdvertisementOfServer${message.guild.id}`)},
              { name: "Invite: ", value: await db.fetch(`fpInviteOfServer${message.guild.id}`) },
            )
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
          serverToRequest.owner.send(fpRequestEmbed)
          .then((fpRequestEmbed) =>
          {
            fpRequestEmbed.react('✅')
            .then(fpRequestEmbed.react('❎'))

            fpRequestEmbed.awaitReactions((reaction, user) => user.id == serverToRequest.owner.user.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '❎'),
            { max: 1, time: 60000 * 60 }).then(async function(collected) {
                    if (collected.first().emoji.name == '✅') 
                    {
                      let fpAdOfAsking = await db.fetch(`fpAdvertisementOfServer${message.guild.id}`)
                      let fpAdOfAsked = await db.fetch(`fpAdvertisementOfServer${serverToRequest.id}`)
                      let fpInviteOfAsking = await db.fetch(`fpInviteOfServer${message.guild.id}`)
                      let fpInviteOfAsked = await db.fetch(`fpInviteOfServer${serverToRequest.id}`)
                      let fpChannelOfAsking = client.channels.cache.get(await db.fetch(`idOfFastPartnershipsChannelOfServer${message.guild.id}`))
                      let fpChannelOfAsked = client.channels.cache.get(await db.fetch(`idOfFastPartnershipsChannelOfServer${serverToRequest.id}`))
                      fpChannelOfAsking.send(`${fpAdOfAsked}\n\nInvite: ${fpInviteOfAsked}`)
                      fpChannelOfAsked.send(`${fpAdOfAsking}\n\nInvite: ${fpInviteOfAsking}`)
                      //client.channels.cache.get(await db.fetch(`idOfFastPartnershipsChannelOfServer${message.guild.id}`)).send(`Channel ${channel.name} deleted by ${author.tag}`);
                    }
                    if (collected.first().emoji.name == '❎') 
                    {
                      sendWithWebhookCheck(message.channel, `Partnership with ${serverToRequest.name} got rejected!`)
                    }
                  })
          })
          .then(async function() 
          {
            sendWithWebhookCheck(message.channel, `Fast partnership request sent to ${serverToRequest.owner.user.tag}!`)
          })

          }
      } 


      else if (primaryCommand.toLowerCase() == prefix + "fp-setup" || primaryCommand.toLowerCase() == prefix + "fast-partnerships-setup" || primaryCommand.toLowerCase() == prefix + "fps") 
      {
        if (!message.member.hasPermission(['MANAGE_GUILD'])) return sendWithWebhookCheck(message.channel, "You cannot manage this setting! ");
        if (!message.member.hasPermission(['MANAGE_CHANNELS'])) return sendWithWebhookCheck(message.channel, "You cannot manage channels!");
        if (!message.member.hasPermission(['CREATE_INSTANT_INVITE'])) return sendWithWebhookCheck(message.channel, "You cannot create invites!");
        if (!message.guild.me.hasPermission(['CREATE_INSTANT_INVITE'])) return sendWithWebhookCheck(message.channel, "I cannot create invites!");
        let invite = await message.channel.createInvite({
          maxAge: 0, // 0 = infinite expiration
          maxUses: 0 // 0 = infinite uses
        })
        //reply
        await db.set(`fpInviteOfServer${message.guild.id}`, `https://discord.gg/` + invite.code)
        sendWithWebhookCheck(message.channel, 'Please mention a channel to fast partnerships!\nDo it now in this chat in 60s.');
        message.channel.awaitMessages(m => m.author.id == message.author.id,
        {max: 1, time: 60000}).then(async function(collected) {
          if (collected.first().mentions.channels.size == true) 
          {
            let thePartnershipChannel = collected.first().mentions.channels.first()
            await db.set(`idOfFastPartnershipsChannelOfServer${message.guild.id}`, thePartnershipChannel.id)
            sendWithWebhookCheck(message.channel, `${thePartnershipChannel} is now the fast partnerships channel!\nPlease enter the fast partnerships message now. The message cannot include either invites or mentions!`);
            message.channel.awaitMessages(m => m.author.id == message.author.id,
              {max: 1, time: 300000}).then(async function(collected) {
                if (collected.first().content.includes("discord.gg/") || collected.first().mentions.roles.size == true || collected.first().content.includes("@everyone") || collected.first().content.includes("@here")) return sendWithWebhookCheck(message.channel, 'The partnership message cannot include either invites or mentions (they are created automatically)!')
                if (collected.first().content.length > 1000) return sendWithWebhookCheck(message.channel, `The fast partnerships message cannot include more than 1000 characters (Current number of characters: ${collected.first().content.length})!`)
                await db.set(`fpAdvertisementOfServer${message.guild.id}`, collected.first().content)
                //sendWithWebhookCheck(message.channel, collected.first().content)

                const fpSetupEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Fast partnerships settings updated!')
                .addFields(
                  { name: "Fp channel: ", value: client.channels.cache.get(await db.fetch(`idOfFastPartnershipsChannelOfServer${message.guild.id}`)) },
                  { name: "Advertisement: ", value:  await db.fetch(`fpAdvertisementOfServer${message.guild.id}`)},
                  { name: "Invite: ", value: await db.fetch(`fpInviteOfServer${message.guild.id}`) },
                )
                .setTimestamp()
                .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

              sendWithWebhookCheck(message.channel, fpSetupEmbed);

              }).catch(() => {
                sendWithWebhookCheck(message.channel,'No answer after 5 miutes, operation canceled.');
              });
          } 
          else return sendWithWebhookCheck(message.channel,"You didn't mention a valid channel!");
        }).catch(() => {
          sendWithWebhookCheck(message.channel,'No answer after 60 seconds, operation canceled.');
        });
      }


      else if (primaryCommand.toLowerCase() == prefix + "earn") 
      {
        let commandName = "Earn"
        if (await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`) == null ) 
        {
          await db.set(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`, 0)
        }
        if (await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`) != 0 ) 
        {
          sendWithWebhookCheck(message.channel, `This command is in slowmode! Wait ${await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)} more seconds.`)
          let oldEarnSlowdown = await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)
          setTimeout(async function()
          { 
            if (oldEarnSlowdown == await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)) 
            {
              sendWithWebhookCheck(message.channel, `An error occured, slowdown reset!`)
              await db.set(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`, 0)
            }
          }, 2000);
          return;
        }
        var money = await db.fetch(`moneyOfMember${message.member.id}`)
        var earnIndex = Math.floor(Math.random() * 6) + 1;
        var randomMoneynumber = Math.floor(Math.random() * 15) + 5;
        addMoney(message.author, randomMoneynumber)
        if (earnIndex == 1) 
        {
          message.reply(`you just found ${randomMoneynumber}$ on a street. Lucky!`)
        }
        if (earnIndex == 2) 
        {
          message.reply(`your babushka gave you ${randomMoneynumber}$ when you visited her. I wish I had such a babushka...`)
        }
        if (earnIndex == 3) 
        {
          message.reply(`your begged on a street and some guy gave you ${randomMoneynumber}$. Aren't you bored with your life?`)
        }
        if (earnIndex == 4) 
        {
          message.reply(`you worked in a restaurant as a chef and gained ${randomMoneynumber}$. Maybe I'll try your dishes once!`)
        }
        if (earnIndex == 5) 
        {
          message.reply(`your friend saw how poor you are and gave you ${randomMoneynumber}$. What a great friend!`)
        }
        if (earnIndex == 6) 
        {
          message.reply(`some lady just dropped her purse on the floor. You gave it back to her and she rewarded you with ${randomMoneynumber}$. I wonder how rich you would be if you robbed it...`)
        }
        globalSlowmode(message, commandName, 20)
      }


      else if (primaryCommand.toLowerCase() == prefix + "eval")
      {
        if (argumentsNotSplited.length == 0) return sendWithWebhookCheck(message.channel, "Nothing to eval!")
        if (message.author.id != "501747059854934036" && !(await db.fetch(`adminsOfBot`).includes(message.author.id))) return sendWithWebhookCheck(message.channel, "Only staff of InterManager can use eval!")
        try 
        {
          eval(argumentsNotSplited)
        }
        catch (error) 
        {
          sendWithWebhookCheck(message.channel, "An error occured!")
        }
      }


      else if (primaryCommand.toLowerCase() == prefix + "reset") 
      {
        await db.set(`moneyOfMember${message.member.id}`, 0)
        var money = await db.fetch(`moneyOfMember${message.member.id}`)
        message.reply(`your balance has been set to ${money}`)
      }


      else if (primaryCommand.toLowerCase() == prefix + "bal" || primaryCommand.toLowerCase() == prefix + "balance") 
      {
        if (arguments.length != 1 || (message.mentions.has(message.member))) 
        {
          if (await db.fetch(`moneyOfMember${message.member.id}`) == null) await db.set(`moneyOfMember${message.member.id}`, 0)
          var money = await db.fetch(`moneyOfMember${message.member.id}`)
          if (money > await db.fetch(`moneyRecordOfMember${message.member.id}`)) await db.set(`moneyRecordOfMember${message.member.id}`, money)
          var record = await db.fetch(`moneyRecordOfMember${message.member.id}`)
          let balEmbed = new Discord.MessageEmbed()
          .setColor('#ffff00')
          .setTitle(`Balance of ${message.author.tag}: `)
          .setDescription(`**💰 Current money:**\n\`${money}$\`\n**🏆 Record:**\n\`${record}$\``)
          .setTimestamp()
          .setFooter(`${prefix}bal by ${message.author.tag}`, message.author.avatarURL());
          sendWithWebhookCheck(message.channel, balEmbed)
        } else 
        {
          let member = message.mentions.members.first()
          if (await db.fetch(`moneyOfMember${member.id}`) == null) await db.set(`moneyOfMember${member.id}`, 0)
          var money = await db.fetch(`moneyOfMember${member.id}`)
          if (money > await db.fetch(`moneyRecordOfMember${member.id}`)) await db.set(`moneyRecordOfMember${member.id}`, money)
          if (await db.fetch(`moneyRecordOfMember${member.id}`) == null) await db.set(`moneyRecordOfMember${message.member.id}`, 0)
          var record = await db.fetch(`moneyRecordOfMember${member.id}`)
          let balEmbed = new Discord.MessageEmbed()
          .setColor('#ffff00')
          .setTitle(`Balance of ${member.user.tag}: `)
          .setDescription(`**💰 Current money:**\n\`${money}$\`\n**🏆 Record:**\n\`${record}$\``)
          .setTimestamp()
          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
          sendWithWebhookCheck(message.channel, balEmbed)
        }
      }
      

      else if (primaryCommand.toLowerCase() == prefix + "decode" || primaryCommand.toLowerCase() == prefix + "d")
      {
        if (arguments.length == 0) sendWithWebhookCheck(message.channel, "Nothing to decode!")
        let laLetters = "A a B b V v G g D d E e Ż ż Dz DZ dz Z z Y y I i J j K k L l M m N n O o P p R r S s T t U u F f X x Ō ō Ph PH ph Št ŠT št C c Č č Š š Ja JA ja H h Ju JU ju Ę ę Jö JÖ jö Ję JĘ ję Ą ą Ją JĄ ją Th TH th Ü ü '' '".split(" ")
        let ggLetters = "Ⰰ ⰰ Ⰱ ⰱ Ⰲ ⰲ Ⰳ ⰳ Ⰴ ⰴ Ⰵ ⰵ Ⰶ ⰶ Ⰷ Ⰷ ⰷ Ⰸ ⰸ Ⰹ ⰹ Ⰻ ⰻ Ⰼ ⰼ Ⰽ ⰽ Ⰾ ⰾ Ⰿ ⰿ Ⱀ ⱀ Ⱁ ⱁ Ⱂ ⱂ Ⱃ ⱃ Ⱄ ⱄ Ⱅ ⱅ Ⱆ ⱆ Ⱇ ⱇ Ⱈ ⱈ Ⱉ ⱉ Ⱊ Ⱊ ⱊ Ⱋ Ⱋ ⱋ Ⱌ ⱌ Ⱍ ⱍ Ⱎ ⱎ Ⱑ Ⱑ ⱑ Ⱒ ⱒ Ⱓ Ⱓ ⱓ Ⱔ ⱔ Ⱖ Ⱖ ⱖ Ⱗ Ⱗ ⱗ Ⱘ ⱘ Ⱙ Ⱙ ⱙ Ⱚ Ⱚ ⱚ Ⱛ ⱛ ⱏ ⱐ".split(" ")
        
        let len = laLetters.length
        let readyGg = ""
        let readyLa = ""
        let numbered = []
        let analysed = []
        let received = argumentsNotSplited.split("")
        for (i=0; i<received.length; i++)
        {
          if (received[i+1] != undefined && laLetters.includes(received[i]+received[i+1]))
          {
            analysed.push(received[i]+received[i+1])
            i++
          }
          else 
          {
            analysed.push(received[i])
          }
        }
        //console.log(analysed)

        for (i=0; i<analysed.length; i++)
        {
          if (ggLetters.includes(analysed[i]) || laLetters.includes(analysed[i]))
          {
            for(j=0; j<len; j++)
            {
              if(laLetters[j] == analysed[i] && numbered[i] == undefined) numbered.push(j)
              else if(ggLetters[j] == analysed[i] && numbered[i] == undefined) numbered.push(j)
            }
          }
          else 
          {
            numbered.push(analysed[i])
          }
        }
        //console.log(numbered)
        
        for (i=0; i<numbered.length; i++)
        {
          if (typeof numbered[i] == "number")
          {
            readyGg += ggLetters[numbered[i]]
            readyLa += laLetters[numbered[i]]
          }
          else 
          {
            readyGg += numbered[i]
            readyLa += numbered[i]
          }
        }

        const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`Decoding by ${message.author.tag}:`)
        .addFields(
          { name: "Latin alphabet: ", value: readyLa },
          { name: "Glagolitic alphabet: ", value: readyGg },
        )
        .setTimestamp()
        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
      
      sendWithWebhookCheck(message.channel, embed);
      }


      else if (primaryCommand.toLowerCase() == prefix + "logging-reset") 
      {
        if (!message.member.hasPermission(['VIEW_AUDIT_LOG'])) return sendWithWebhookCheck(message.channel, "You cannot view audit log!");
        if (!message.guild.me.hasPermission(['VIEW_AUDIT_LOG'])) return sendWithWebhookCheck(message.channel, "I cannot view audit log!");
        if (!message.member.hasPermission(['MANAGE_CHANNELS'])) return sendWithWebhookCheck(message.channel, "You cannot manage channels!");
        await db.set(`idOfLoggingChannelOfServer${message.guild.id}`, null)
        sendWithWebhookCheck(message.channel, `Logging channel removed!`);
      }


      else if (primaryCommand.toLowerCase() == prefix + "logging") 
      {
        if (!message.member.hasPermission(['VIEW_AUDIT_LOG'])) return sendWithWebhookCheck(message.channel, "You cannot view audit log!");
        if (!message.guild.me.hasPermission(['VIEW_AUDIT_LOG'])) return sendWithWebhookCheck(message.channel, "I cannot view audit log!");
        if (!message.member.hasPermission(['MANAGE_CHANNELS'])) return sendWithWebhookCheck(message.channel, "You cannot manage channels!");
        message.reply('please mention a channel to log changes.\nDo it in the chat now.');
        message.channel.awaitMessages(m => m.author.id == message.author.id,
        {max: 1, time: 30000}).then(async function(collected) {
          if (collected.first().mentions.channels.first()) 
          {
            let theLoggingChannel = collected.first().mentions.channels.first()
            await db.set(`idOfLoggingChannelOfServer${message.guild.id}`, theLoggingChannel.id)
            sendWithWebhookCheck(message.channel, `${theLoggingChannel} is now the logging channel!`);
          } 
          else return collected.channel.send("You didn't mention a valid channel!");

        }).catch(() => {
          message.reply('No answer after 30 seconds, operation canceled.');
        });
      }


      else if (primaryCommand.toLowerCase() == prefix + "invites-slvmc")
      {
        message.channel.send("Working...")
        client.guilds.cache.forEach(async (guild) => {
          const channel = guild.channels.cache.filter((channel) => channel.type === 'text').first();
          await channel.createInvite().then(async (invite) => {
              console.log(invite.url)
            })
        });
      }


      if(primaryCommand.toLowerCase() == prefix + "kill")
      {
        if (await db.fetch(`adminsOfBot`).includes(message.author.id))
        {
          await sendWithWebhookCheck(message.channel, translating(language, {english: `*Dies*`, polish: `*Umiera*`}))
          client.destroy()
        }
        else sendWithWebhookCheck(message.channel, translating(language, {english: `Only staff of InterManager can use this command!`, polish: `Tylko administracja bota może używać tej komendy!`}))
      }


      else if (primaryCommand.toLowerCase() == prefix + "give-money") 
      {
        let commandName = "Give-money"
        if (await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`) == null) 
        {
          await db.set(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`, 0)
        }
        if (await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`) != 0 ) return sendWithWebhookCheck(message.channel, `This command is in slowmode! Wait ${await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)} more seconds.`)
        if (arguments.length != 2) return sendWithWebhookCheck(message.channel, `Incorrect number of arguments! Correct usage: \n\`[prefix]give-money [mention] [number]\``)
        var moneyToGive = parseInt(arguments[1])
        if (isNaN(moneyToGive)) return sendWithWebhookCheck(message.channel, `Incorrect money to give value! Correct usage: \n\`[prefix]give-money [mention] [number]\``)
        if (moneyToGive <= 0) return sendWithWebhookCheck(message.channel, 'number of money to give must be higher than 0!')
        var givingsMoney = await db.fetch(`moneyOfMember${message.member.id}`)
        if (givingsMoney < moneyToGive) return sendWithWebhookCheck(message.channel, 'You don\'t have so much money!')
        addMoney(message.mentions.members.first().user, moneyToGive)
        addMoney(message.author, -moneyToGive)
        sendWithWebhookCheck(message.channel, `${message.member} gave ${message.mentions.members.first()} ${moneyToGive}$!`)
        globalSlowmode(message, commandName, 10)
      } 


      else if (primaryCommand.toLowerCase() == prefix + "rps" || primaryCommand == prefix + "rock-paper-scissors") 
      {
        let commandName = "Rps"
        if (await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`) == null ) 
        {
          await db.set(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`, 0)
        }
        if (await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`) != 0 ) 
        { 
          sendWithWebhookCheck(message.channel, `This command is in slowmode! Wait ${await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)} more seconds.`)

          let oldSlowdown = await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)
          setTimeout(async function()
          { 
            if (oldSlowdown == await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)) 
            {
              sendWithWebhookCheck(message.channel, `An error occured, slowdown reset!`)
              await db.set(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`, 0)
            }
          }, 2000);
          return
        }
        var playersMove
        var opponentsMove
        var opponentsMoveIndex
        var playersMoveIndex
        let rpsWinner
        let rpsEmbed = new Discord.MessageEmbed()
        .setColor('#ffff00')
        .setTitle(`Rock, paper, scissors battle of ${message.author.tag}: `)
        .setDescription(`**Pick your move:**\n✊ - rock\n✋ - paper\n✌️ - scissors`)
        .setTimestamp()
        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
        message.channel.send(rpsEmbed)
        .then((msg) => {
          msg.react('✊')
          .then (msg.react('✋'))
          .then (msg.react('✌️'))

          opponentsMoveIndex = Math.floor(Math.random() * 3) + 1;
          if(opponentsMoveIndex == 1) opponentsMove = '✊'
          if(opponentsMoveIndex == 2) opponentsMove = '✋'
          if(opponentsMoveIndex == 3) opponentsMove = '✌️'

          globalSlowmode(message, commandName, 15)

          msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '✊' || reaction.emoji.name == '✋' || reaction.emoji.name == '✌️' || reaction.emoji.name == '💣' || reaction.emoji.name == '🧨' || reaction.emoji.name == '⛏️' || reaction.emoji.name == '🔨' || reaction.emoji.name == '🪓'),
          { max: 1, time: 30000 }).then(async function(collected) {
            playersMove = collected.first().emoji.name
                  if (collected.first().emoji.name == '✊') 
                  {
                    playersMoveIndex = 1
                  }
                  if (collected.first().emoji.name == '✋')
                  {
                    playersMoveIndex = 2
                  }
                  if (collected.first().emoji.name == '✌️') 
                  {
                    playersMoveIndex = 3
                  }
                  let player = message.author.tag
                  let opponent = msg.author.tag
                  msg.reactions.removeAll()

                  if (playersMoveIndex == opponentsMoveIndex)
                  {
                    rpsWinner = '🤷‍♀️ Draw! 🤷‍♀️'
                  }
                  if ((playersMoveIndex == 1 && opponentsMoveIndex == 3) || (playersMoveIndex == 3 && opponentsMoveIndex == 1)) 
                  {
                    if(playersMoveIndex < opponentsMoveIndex  || "💣 🧨 ⛏️ 🔨 🪓".includes(collected.first().emoji.name)) 
                    {
                      rpsWinner = `🏆 ${player} wins and earns 100$! 🏆`
                      addMoney(message.author, 100)
                    }
                    if(opponentsMoveIndex < playersMoveIndex) 
                    {
                      rpsWinner = `☠️ ${opponent} wins! ${player} loses 50$! ☠️`
                      addMoney(message.author, -50)
                    }
                  } 
                  else
                  {
                    if(opponentsMoveIndex < playersMoveIndex || "💣 🧨 ⛏️ 🔨 🪓".includes(collected.first().emoji.name)) 
                    {
                      rpsWinner = `🏆 ${player} wins and earns 100$! 🏆`
                      addMoney(message.author, 100)
                    }
                    else if(playersMoveIndex < opponentsMoveIndex) 
                    {
                      rpsWinner = `☠️ ${opponent} wins! ${player} loses 50$! ☠️`
                      addMoney(message.author, -50)
                    }
                  }

                  if (rpsWinner == 'draw') 
                  {
                    let newRpsEmbed = new Discord.MessageEmbed()
                    .setColor('#ffff00')
                    .setTitle(`Rock, paper, scissors battle of ${message.author.tag}: `)
                    .setDescription(`Player's move: ${playersMove}\nOpponent's move: ${opponentsMove}\nResult: **draw**`)
                    .setTimestamp()
                    .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                    msg.edit(newRpsEmbed)
                  } 
                  if (rpsWinner != 'draw') 
                  {
                    let newRpsEmbed = new Discord.MessageEmbed()
                    .setColor('#ffff00')
                    .setTitle(`Rock, paper, scissors battle of ${message.author.tag}: `)
                    .setDescription(`Player's move: ${playersMove}\nOpponent's move: ${opponentsMove}\nResult: **${rpsWinner}**`)
                    .setTimestamp()
                    .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                    msg.edit(newRpsEmbed)
                  }
          }).catch(() => 
          {
            msg.reactions.removeAll()
            let newRpsEmbed = new Discord.MessageEmbed()
            .setColor('#ffff00')
            .setTitle(`Rock, paper, scissors battle of ${message.author.tag}: `)
            .setDescription(`No responce after 30s, game cancelled!`)
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            msg.edit(newRpsEmbed)
          })
      });
      }


      else if (primaryCommand.toLowerCase() == prefix + "gtn" || primaryCommand == prefix + "guess-the-number")
      {
        commandName = "Gtn"
        if (await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`) == null ) 
        {
          await db.set(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`, 0)
        }
        if (await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`) != 0 ) 
        {
          sendWithWebhookCheck(message.channel, `This command is in slowmode! Wait ${await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)} more seconds.`)
          let oldSlowdown = await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)
          setTimeout(async function()
          { 
            if (oldSlowdown == await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)) 
            {
              sendWithWebhookCheck(message.channel, `An error occured, slowdown reset!`)
              await db.set(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`, 0)
            }
          }, 2000);
          return;
        }
        let theNumber = Math.floor(Math.random() * 10) + 1;
        let tryOfguess;
        let tryToShow;
        //sendWithWebhookCheck(message.channel, theNumber)
        let triesLeft = 3;
        let embed = new Discord.MessageEmbed()
        .setColor('#228B22')
        .setTitle(`Guess the number game of ${message.author.tag}:`)
        .setDescription(`Guess the number from 1 to 10 to win!\nTries left: \`${triesLeft}\` ❤️ ❤️ ❤️`)
        .setTimestamp()
        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

        globalSlowmode(message, commandName, 15)
      
      message.channel.send(embed)
      .then((msg) => 
      {
        message.channel.awaitMessages(m => m.author.id == message.author.id,
          {max: 1, time: 30000}).then(async function(collected) {
            tryOfguess = parseInt(collected.first().content)
            if (tryOfguess == theNumber) 
            {
            triesLeft = 2
            if (tryOfguess >= 1 && tryOfguess <= 10) tryToShow = tryOfguess
            else tryToShow = "not a valid number!"
            embed = new Discord.MessageEmbed()
            .setColor('#228B22')
            .setTitle(`Guess the number game of ${message.author.tag}:`)
            .setDescription(`Answer: \`${tryToShow}\`\nTries: \`${3 - triesLeft}\` ❤️ ❤️ ❤️\nResult: **🏆 ${message.author.tag} wins and earns 150$! 🏆**`)
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

            msg.edit(embed)

            addMoney(message.author, 150)
            return;
            }
            else 
            {
              triesLeft = 2
              if (tryOfguess >= 1 && tryOfguess <= 10) tryToShow = tryOfguess
              else tryToShow = "not a valid number!"

              embed = new Discord.MessageEmbed()
              .setColor('#228B22')
              .setTitle(`Guess the number game of ${message.author.tag}:`)
              .setDescription(`**💔 Miss! 💔**\nYour answer: \`${tryToShow}\`\nTries left: \`${triesLeft}\` ❤️ ❤️ 💔`)
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
  
              addMoney(message.author, -20)
              msg.edit(embed)
              .then((msg) => 
              {
                message.channel.awaitMessages(m => m.author.id == message.author.id,
                  {max: 1, time: 30000}).then(async function(collected) {
                    tryOfguess = parseInt(collected.first().content)
                    if (tryOfguess == theNumber) 
                    {
                    triesLeft = 1
                    if (tryOfguess >= 1 && tryOfguess <= 10) tryToShow = tryOfguess
                    else tryToShow = "not a valid number!"

                    embed = new Discord.MessageEmbed()
                    .setColor('#228B22')
                    .setTitle(`Guess the number game of ${message.author.tag}:`)
                    .setDescription(`Answer: \`${tryToShow}\`\nTries: \`${3 - triesLeft}\` ❤️ ❤️ 💔\nResult: **🏆 ${message.author.tag} wins and earns 130$! 🏆**`)
                    .setTimestamp()
                    .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
        
                    msg.edit(embed)

                    
                    addMoney(message.author, 150)
                    return;
                    }
                    else 
                    {
                      triesLeft = 1
                      if (tryOfguess >= 1 && tryOfguess <= 10) tryToShow = tryOfguess
                      else tryToShow = "not a valid number!"

                      embed = new Discord.MessageEmbed()
                      .setColor('#228B22')
                      .setTitle(`Guess the number game of ${message.author.tag}:`)
                      .setDescription(`**💔 Miss! 💔**\nYour answer: \`${tryToShow}\`\nTries left: \`${triesLeft}\` ❤️ 💔 💔`)
                      .setTimestamp()
                      .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

                      addMoney(message.author, -20)
          
                      msg.edit(embed)
                      .then((msg) => 
                      {
                        message.channel.awaitMessages(m => m.author.id == message.author.id,
                          {max: 1, time: 30000}).then(async function(collected) {
                            tryOfguess = parseInt(collected.first().content)
                            if (tryOfguess == theNumber) 
                            {
                              triesLeft = 0
                              if (tryOfguess >= 1 && tryOfguess <= 10) tryToShow = tryOfguess
                              else tryToShow = "not a valid number!"

                            embed = new Discord.MessageEmbed()
                            .setColor('#228B22')
                            .setTitle(`Guess the number game of ${message.author.tag}:`)
                            .setDescription(`Answer: \`${tryToShow}\`\nTries: \`${3 - triesLeft}\` ❤️ 💔 💔\nResult: **🏆 ${message.author.tag} wins and earns 110$! 🏆**`)
                            .setTimestamp()
                            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                
                            msg.edit(embed)

                            addMoney(message.author, 150)
                            }
                            else 
                            {
                              triesLeft = 0
                              if (tryOfguess >= 1 && tryOfguess <= 10) tryToShow = tryOfguess
                              else tryToShow = "not a valid number!"

                              embed = new Discord.MessageEmbed()
                              .setColor('#228B22')
                              .setTitle(`Guess the number game of ${message.author.tag}:`)
                              .setDescription(`Your answer: \`${tryToShow}\`\nThe correct answer: \`${theNumber}\`\nTries left: \`${triesLeft}\` 💔 💔 💔\nResult: **☠️ ${message.author.tag} loses and loses 60$! ☠️**`)
                              .setTimestamp()
                              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

                              addMoney(message.author, -20)
                  
                              msg.edit(embed)
                            }
                
                          }).catch(() => {
                            let embed = new Discord.MessageEmbed()
                            .setColor('#228B22')
                            .setTitle(`Guess the number game of ${message.author.tag}:`)
                            .setDescription(`No responce after 30s, game cancelled!`)
                            .setTimestamp()
                            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                            msg.edit(embed)
                          });
                      })
                    }
        
                  }).catch(() => {
                    let embed = new Discord.MessageEmbed()
                    .setColor('#228B22')
                    .setTitle(`Guess the number game of ${message.author.tag}:`)
                    .setDescription(`No responce after 30s, game cancelled!`)
                    .setTimestamp()
                    .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                    msg.edit(embed)
                  });
              })
            }

          }).catch(() => 
          {
            let embed = new Discord.MessageEmbed()
            .setColor('#228B22')
            .setTitle(`Guess the number game of ${message.author.tag}:`)
            .setDescription(`No responce after 30s, game cancelled!`)
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            msg.edit(embed)
          })
      })
      }


      else if (primaryCommand.toLowerCase() == prefix + "webhook-bot") 
      {
        if (argumentsNotSplited == "CLEAN" && !message.attachments.size) 
        {
          await db.set(`customWebhookBotNameInServer${message.guild.id}`, null)
          await db.set(`customWebhookBotUrlInServer${message.guild.id}`, null)
          sendWithWebhookCheck(message.channel, "InterManager's webhooks cleaned!")
          return
        }
        if (argumentsNotSplited.length < 81) 
        {
          await db.set(`customWebhookBotNameInServer${message.guild.id}`, argumentsNotSplited)
        }
        else return sendWithWebhookCheck(message.channel, `No name detected!`)
        if (message.attachments.size) 
        {
          var attachments = (message.attachments).array();
          await db.set(`customWebhookBotUrlInServer${message.guild.id}`, attachments[0].url)
        }
        else return sendWithWebhookCheck(message.channel, `No image detected!`)

        if (await db.fetch(`customWebhookBotUrlInServer${message.guild.id}`) != null && await db.fetch(`customWebhookBotNameInServer${message.guild.id}`) != null)
        {
          sendWithWebhookCheck(message.channel, `New data saved:\nName: ${await db.fetch(`customWebhookBotNameInServer${message.guild.id}`)}\nURL: ${await db.fetch(`customWebhookBotUrlInServer${message.guild.id}`)}`)
        }
      }


      else if (primaryCommand.toLowerCase() == prefix + "webhook") 
      {
        if (arguments.length == 1 && arguments[0] == "CLEAN")
        {
          message.guild.fetchWebhooks()
          .then(webhooks => webhooks.forEach((webhook) => 
          {
            if (webhook.owner.id == client.user.id) webhook.delete()
          }))
          .catch(console.error);
          sendWithWebhookCheck(message.channel, "Webhooks cleaned!")
          return
        }


        message.channel.createWebhook(arguments[0], {
          avatar: arguments[1],
        })
          .then(webhook => webhook.send(`I just got created! Webhook's ID: ${webhook.id}`))
          .catch(console.error);
      }


      else if (primaryCommand.toLowerCase() == prefix + "webhook-delete") 
      {
        client.fetchWebhook(arguments[0])
        
        .then(webhook => 
        {
          sendWithWebhookCheck(message.channel, `Webhook ${webhook.name} just got deleted!`)
          webhook.delete()
        })
        .catch(console.error);
      }
      

      else if (primaryCommand.toLowerCase() == prefix + "info") 
      {
        let objectToShow
        if (arguments.length != 1) return sendWithWebhookCheck(message.channel, translating(language, {english: `Incorrect number of arguments!\nCorrect usage: \`[prefix]info server/guild/[member mention/member ID]\``, polish: `Niepoprawna liczba argumentów!\nPoprawne użycie: \`[prefix]info server/guild/[oznaczenie użytkownika/ID użytkownika]\``}))
        if (arguments[0] == `server` || arguments[0] == `guild`) 
        {
          objectToShow = `server`

          let gl = message.guild;
          
          let icon = `[Click here](${gl.iconURL({size: 1024, dynamic: true, format: 'jpg' })})`

          let banner;
          if (gl.bannerURL() == null || gl.bannerURL() == undefined)
          {
            banner = `\`[no banner]\``
          }
          else 
          {
            banner = `[Click here](${gl.bannerURL({size: 2048, dynamic: true, format: 'jpg' })})`
          }

          var notManagedRoles = 0;
          var managedRoles = 0;
          var adminPermsRole = 0;
          gl.roles.cache.forEach(function(role) 
          {
            if (role.managed == true)
            {
              managedRoles++
            }
            else 
            {
              notManagedRoles++
            }
          })

          let embed = new Discord.MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`Server ${gl.name}`)
          //.setURL('https://discord.js.org/')
          //.setAuthor('Some name', 'https://i.imgur.com/wSTFkRM.png', 'https://discord.js.org')
          .setDescription(`Name: \`${gl.name}\`\nID: \`${gl.id}\`\nIcon: ${icon}\nOwner: \`${gl.owner.user.tag}\`\nRegion: \`${gl.region}\`\nBanner: ${banner}`)
          .setThumbnail(gl.iconURL({size: 1024, dynamic: true}))
          .addFields(
            { name: 'Members:', value: `**Total:** \`${(await gl.members.fetch()).size}\`\nPeople: \`${(await gl.members.fetch()).filter(function (member) {return member.user.bot === false}).size}\`\nBots: \`${(await gl.members.fetch()).filter(function (member) {return member.user.bot === true}).size}\`` },
            //{ name: '\u200B', value: '\u200B' },
            { name: 'Channels:', value: `**Total:** \`${gl.channels.cache.size}\`\nCategories: \`${gl.channels.cache.filter(function (channel) {return channel.type === 'category'}).size}\`\nText channels: \`${gl.channels.cache.filter(function (channel) {return channel.type === 'text'}).size}\`\nVoice channels: \`${gl.channels.cache.filter(function (channel) {return channel.type === 'voice'}).size}\`\nOther channels: \`${gl.channels.cache.filter(function (channel) {return channel.type !== 'text' && channel.type !== 'voice' && channel.type !== 'category'}).size}\``, inline: true },
            { name: 'Roles:', value: `**Total:** \`${gl.roles.cache.size}\`\nServer roles: \`${notManagedRoles}\`\nBot roles: \`${managedRoles}\``, inline: true },
          )
          //.addField('Inline field title', 'Some value here', true)
          //.setImage('https://i.imgur.com/wSTFkRM.png')
          .setTimestamp()
          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
        
        sendWithWebhookCheck(message.channel, embed);
        }
        else if (arguments.length == 1 && (message.mentions.members.first() != undefined && message.mentions.members.first() != null || (await message.guild.members.fetch()).get(arguments[0] != undefined))) 
        {
          objectToShow = `member`
          let member = message.mentions.members.first()
          if (member == undefined) member = (await message.guild.members.fetch()).get(arguments[0])

          let memberRoles = ""
          if(member.roles.cache.size > 1)
          {
          for (i=message.guild.roles.cache.size;i>1; i = i-1)
          {
            let r = message.guild.roles.cache.find(p => p.rawPosition == i)
            if (r != undefined)
            {
            if (member.roles.cache.has(r.id))
            memberRoles = memberRoles + '`' + r.name + '`,\n'
            }
          }
          }
          else memberRoles = "[no roles]"
          //translating(language, {english: ``, polish: ``})
          var emb = new Discord.MessageEmbed()
          .setColor('#0099ff')
          .setTitle(translating(language, {english: `Member ${member.displayName}`, polish: `Członek ${member.displayName}`}))
          .setDescription(translating(language, {english: `Name in server: \`${member.displayName}\`\nID: \`${member.id}\`\nAvatar: [Click here](${member.user.avatarURL({size: 1024, dynamic: true, format: 'jpg' })})\nTag: \`${member.user.tag}\`\nBot: \`${(member.user.bot) ? "yes" : "no"}\`\nAccount created: \`${member.user.createdAt.toLocaleString()}\`\nJoined server: \`${member.joinedAt.toLocaleString()}\``, polish: `Nick na serwerze: \`${member.displayName}\`\nID: \`${member.id}\`\nAwatar: [Kliknij tutaj](${member.user.avatarURL({size: 1024, dynamic: true, format: 'jpg' })})\nTag: \`${member.user.tag}\`\nBot: \`${(member.user.bot) ? "tak" : "nie"}\`\nUtworzono konto: \`${member.user.createdAt.toLocaleString()}\`\nDołączono do serwera: \`${message.member.joinedAt.toLocaleString()}\``}))
          .setThumbnail(member.user.avatarURL({size: 1024, dynamic: true, format: 'jpg' }))
          .addFields(
            { name: translating(language, {english: `Roles:`, polish: `Role:`}), value: memberRoles},
          )
          .setTimestamp()
          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
        
        sendWithWebhookCheck(message.channel, emb);
        }
        //else if (arguments[0] == `user`) objectToShow = `user`
        //else if (arguments[0] == `channel`) objectToShow = `channel`
        //else if (arguments[0] == `role`) objectToShow = `role`
        else return sendWithWebhookCheck(message.channel, translating(language, {english: `No item found!\nCorrect usage: \`[prefix]info server/guild/[member mention/member ID]\``, polish: `Nic nie znaleziono!\nPoprawne użycie: \`[prefix]info server/guild/[oznaczenie użytkownika/ID użytkownika]\``}))
      }


      else if (primaryCommand.toLowerCase() == prefix + "deed") 
      {
        let commandName = "Deed"
        if (await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`) == null ) 
        {
          await db.set(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`, 0)
        }
        if (await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`) != 0 ) 
        {
          sendWithWebhookCheck(message.channel, `This command is in slowmode! Wait ${await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)} more seconds.`)
          let oldSlowdown = await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)
          setTimeout(async function()
          { 
            if (oldSlowdown == await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)) 
            {
              sendWithWebhookCheck(message.channel, `An error occured, slowdown reset!`)
              await db.set(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`, 0)
            }
          }, 2000);
          return;
        }
        const rybaEmoji = "🐟"
        var money = await db.fetch(`moneyOfMember${message.member.id}`)
        var deedIndex = Math.floor(Math.random() * 12) + 1;
        //sendWithWebhookCheck(message.channel, deedIndex)
        if (deedIndex == 1) 
        {
          var randomMoneynumber = Math.floor(Math.random() * 50) + 51;
          addMoney(message.author, randomMoneynumber)
          message.reply(`You donated to LGBT community and scientists finally found the cure! The Glorious Ryba gave you ${randomMoneynumber}$ for this good deed! ${rybaEmoji}`)
        }
  
        if (deedIndex == 2) 
        {
          var randomMoneynumber = Math.floor(Math.random() * 50) + 51;
          addMoney(message.author, -randomMoneynumber)
          message.reply(`You voted for a nazi party in the last election! The Glorious Ryba punished you with ${randomMoneynumber}$ loss! ${rybaEmoji}`)
        }
  
        if (deedIndex == 3) 
        {
          var randomMoneynumber = Math.floor(Math.random() * 50) + 51;
          addMoney(message.author, randomMoneynumber)
          message.reply(`You shared InterManager to your friends! The Glorious Ryba gave you ${randomMoneynumber}$ for this good deed! ${rybaEmoji}`)
        }
  
        if (deedIndex == 4) 
        {
          var randomMoneynumber = Math.floor(Math.random() * 50) + 51;
          addMoney(message.author, -randomMoneynumber)
          message.reply(`You persuaded your friend to have an abortion! The Glorious Ryba punished you with ${randomMoneynumber}$ loss! ${rybaEmoji}`)
        }
  
        if (deedIndex == 5) 
        {
          var randomMoneynumber = Math.floor(Math.random() * 50) + 51;
          addMoney(message.author, randomMoneynumber)
          message.reply(`You shot a furry! The Glorious Ryba gave you ${randomMoneynumber}$ for this good deed! ${rybaEmoji}`)
        }

        if (deedIndex == 6) 
        {
          var randomMoneynumber = Math.floor(Math.random() * 50) + 51;
          addMoney(message.author, -randomMoneynumber)
          message.reply(`You drank too much and beat your babushka! The Glorious Ryba punished you with ${randomMoneynumber}$ loss! ${rybaEmoji}`)
        }

        if (deedIndex == 7) 
        {
          var randomMoneynumber = Math.floor(Math.random() * 50) + 51;
          addMoney(message.author, randomMoneynumber)
          message.reply(`You have been wearing your face mask all the day in a proper way! The Glorious Ryba gave you ${randomMoneynumber}$ for this good deed! ${rybaEmoji}`)
        }

        if (deedIndex == 8) 
        {
          var randomMoneynumber = Math.floor(Math.random() * 50) + 51;
          addMoney(message.author, -randomMoneynumber)
          message.reply(`You are gay! The Glorious Ryba punished you with ${randomMoneynumber}$ loss! ${rybaEmoji}`)
        }

        if (deedIndex == 9) 
        {
          var randomMoneynumber = Math.floor(Math.random() * 50) + 51;
          addMoney(message.author, randomMoneynumber)
          message.reply(`You saved Palestine! The Glorious Ryba gave you ${randomMoneynumber}$ for this good deed! ${rybaEmoji}`)
        }

        if (deedIndex == 10) 
        {
          var randomMoneynumber = Math.floor(Math.random() * 50) + 51;
          addMoney(message.author, -randomMoneynumber)
          message.reply(`You committed war crimes! The Glorious Ryba punished you with ${randomMoneynumber}$ loss! ${rybaEmoji}`)
        }

        if (deedIndex == 11) 
        {
          var randomMoneynumber = Math.floor(Math.random() * 50) + 51;
          addMoney(message.author, randomMoneynumber)
          message.reply(`You donated to an organisation that protects marine animals! The Glorious Ryba gave you ${randomMoneynumber}$ for this good deed! ${rybaEmoji}`)
        }

        if (deedIndex == 12) 
        {
          var randomMoneynumber = Math.floor(Math.random() * 50) + 51;
          addMoney(message.author, -randomMoneynumber)
          message.reply(`You ate a fish! The Glorious Ryba punished you with ${randomMoneynumber}$ loss! ${rybaEmoji}`)
        }
        globalSlowmode(message, commandName, 10)
      } 


      else if (primaryCommand.toLowerCase() == prefix + "segzy") 
      {
        let member;
        if (arguments.length == 0) member = (await message.guild.members.fetch()).get(message.author.id)
        else 
        {
          member = message.mentions.members.first()
          if (member == undefined || member == null) 
          {
            member = (await message.guild.members.fetch()).get(argumentsNotSplited)
            if (member == undefined || member == null) 
            {
              sendWithWebhookCheck(message.channel, "No user found!")
              return
            }
          }
        }
        sendWithWebhookCheck(message.channel, "Drawing the image...").then(async function(msg) 
        {
          
          let user = member.user;
          let avatar = await Canvas.loadImage(user.displayAvatarURL({size: 1024, format: 'png' }));
          let avatarCanvas = Canvas.createCanvas(300, 300);
          let avatarCtx = avatarCanvas.getContext('2d');
          avatarCtx.translate(150, 150);
          avatarCtx.drawImage(avatar, -150, -150, 300, 300)

          let canvas = Canvas.createCanvas(720, 720);
          let context = canvas.getContext('2d');
          //context.rotate(90 * Math.PI / 180);
          let imageToEdit = await Canvas.loadImage('https://cdn.discordapp.com/attachments/831143355131494440/855727329677541396/segzy.png');
          context.drawImage(imageToEdit, 00, 00, 720, 720);
          context.drawImage(avatarCanvas, 375, 375, 300, 300);
          let attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'image.png');
          //sendWithWebhookCheck(message.channel, `${user.tag} is very segzy ( ͡° ͜ʖ ͡°)`)
          sendWithWebhookCheck(message.channel, attachment).then(msg.delete())
          //console.log(imageToEdit)
        })
      }


      else if (primaryCommand.toLowerCase() == prefix + "trade") 
      {
        //console.log("This 'is (my)' 'simple text'".match(/\'[^]+\'/)[0])

        //console.log( string.match(/\(([^()]*)\)/)[1] )
        if (!argumentsNotSplited.includes("{") || !argumentsNotSplited.includes("}")) return sendWithWebhookCheck(message.channel, "Wrong usage! Make sure you put 2 texts in 2 `{}` and try again.")
        if (argumentsNotSplited.match(/\{([^{}}]*)\}/g) == null || argumentsNotSplited.match(/\{([^{}}]*)\}/g) == undefined) return sendWithWebhookCheck(message.channel, "Wrong usage! Make sure you put 2 texts in 2 `{}` and try again.")
        if (argumentsNotSplited.match(/\{([^{}}]*)\}/g)[0] == null || argumentsNotSplited.match(/\{([^{}}]*)\}/g)[0] == undefined) return sendWithWebhookCheck(message.channel, "Wrong usage! Make sure you put 2 texts in 2 `{}` and try again.")
        if (argumentsNotSplited.match(/\{([^{}}]*)\}/g)[1] == null || argumentsNotSplited.match(/\{([^{}}]*)\}/g)[1] == undefined) return sendWithWebhookCheck(message.channel, "Wrong usage! Make sure you put 2 texts in 2 `{}` and try again.")
        let iReceive = argumentsNotSplited.match(/\{([^{}}]*)\}/g).map(function($0) { return $0.substring(1,$0.length-1) })[0]
        let youReceive = argumentsNotSplited.match(/\{([^{}}]*)\}/g).map(function($0) { return $0.substring(1,$0.length-1) })[1]
        sendWithWebhookCheck(message.channel, "Drawing the image...").then(async function(msg)
        {

        let avatar = await Canvas.loadImage(message.author.displayAvatarURL({size: 1024, format: 'png' }));
        let avatarCanvas = Canvas.createCanvas(300, 300);
        let avatarCtx = avatarCanvas.getContext('2d');
        avatarCtx.translate(150, 150);
        //avatarCtx.rotate(90 * Math.PI / 180)
        avatarCtx.drawImage(avatar, -150, -150, 300, 300)

        var iReceiveCanvas = Canvas.createCanvas(700, 800);
        var iReceiveCtx = iReceiveCanvas.getContext('2d');
        //var maxWidth = 150;
        var text = iReceive;
      
        iReceiveCtx.fillStyle = '#ffffff';
        iReceiveCtx.font = "40px Arial";
        wrapText(iReceiveCtx, text, 0, 100, 150, 40)

        var youReceiveCanvas = Canvas.createCanvas(700, 800);
        var youReceiveCtx = youReceiveCanvas.getContext('2d');
        //var maxWidth = 150;
        var text2 = youReceive;
      
        youReceiveCtx.fillStyle = '#ffffff';
        youReceiveCtx.font = "40px Arial";
        wrapText(youReceiveCtx, text2, 0, 100, 150, 40)

        //let attachment = new Discord.MessageAttachment(textCanvas.toBuffer(), 'image.png');
        //sendWithWebhookCheck(message.channel, attachment)
        //console.log(lines)
        //textCtx.fillText(lines, 10, 50, 150);

        let canvas = Canvas.createCanvas(607, 794);
        let context = canvas.getContext('2d');
        //context.rotate(90 * Math.PI / 180);
        //let black = await Canvas.loadImage('https://www.technistone.com/color-range/image-slab/deska_gobi_black_p.jpg');
        let imageToEdit = await Canvas.loadImage('https://cdn.discordapp.com/attachments/831143355131494440/856158061257031720/fdc.png');
        context.drawImage(imageToEdit, 00, 00, canvas.width, canvas.height);
        context.drawImage(avatarCanvas, 190, 300, 230, 230);
        //context.drawImage(black, 375, 200, 150, 500);
        context.drawImage(iReceiveCanvas, 60, 125, 500, 600)
        context.drawImage(youReceiveCanvas, 420, 125, 500, 600)
        context.fillStyle = '#ffffff';
        //context.fillText(context, iReceive, 50, -285, 150, 500, 300);
        let attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
        //sendWithWebhookCheck(message.channel, `${user.tag} is very segzy ( ͡° ͜ʖ ͡°)`)
        sendWithWebhookCheck(message.channel, attachment).then(msg.delete())
        })
      }


      else if (primaryCommand.toLowerCase() == prefix + "think") 
      {
        let mark;
        let hero;
        let member;
        if (arguments.length == 0) return sendWithWebhookCheck(message.channel, "Mention 1 or 2 members!")
        else 
        {
          member = message.mentions.members.first()
          if (member == undefined || member == null) 
          {
            member = (await message.guild.members.fetch()).get(arguments[0])
            if (member == undefined || member == null) 
            {
              sendWithWebhookCheck(message.channel, "No user found!")
              return
            }
          }
        }
        {
          if (message.mentions.members.first(2)[1] == undefined && arguments.length != 2)
          {
            mark = member.user;
            hero = message.author;
          }
          else 
          {
            hero = member.user;

            member = message.mentions.members.first(2)[1]
            if (member == undefined || member == null) 
            {
              member = (await message.guild.members.fetch()).get(arguments[1])
              if (member == undefined || member == null) 
              {
                sendWithWebhookCheck(message.channel, "No user found!")
                return
              }
            }
            mark = member.user;
          }
          //console.log(message.mentions.members.first(2)[1])
        }

        sendWithWebhookCheck(message.channel, "Drawing the image...").then(async function(msg) 
        {
          let canvas = Canvas.createCanvas(1421, 725);
          let context = canvas.getContext('2d');
          let imageToEdit = await Canvas.loadImage('https://media.discordapp.net/attachments/831143355131494440/856982222376402955/thinkmarkthumbnail.png?width=1096&height=559');
          context.drawImage(imageToEdit, 00, 00, canvas.width, canvas.height);

          let heroAvatar = await Canvas.loadImage(hero.displayAvatarURL({size: 1024, format: 'png' }));
          let heroCanvas = Canvas.createCanvas(300, 300);
          let heroCtx = heroCanvas.getContext('2d');
          heroCtx.drawImage(heroAvatar, 0, 0, 300, 300)

          let markAvatar = await Canvas.loadImage(mark.displayAvatarURL({size: 1024, format: 'png' }));
          let markCanvas = Canvas.createCanvas(300, 300);
          let markCtx = markCanvas.getContext('2d');
          markCtx.drawImage(markAvatar, 0, 0, 300, 300)

          let textCanvas = Canvas.createCanvas(canvas.width, 400);
          let textCtx = textCanvas.getContext('2d');
          textCtx.fillStyle = '#ffffff';
          textCtx.font = "40px Arial";
          textCtx.textAlign = "center"; 
          let txt = `think ${mark.username}, think!`.toUpperCase()
          textCtx.fillText(txt, canvas.width/2, 100)
          //let attachment2 = new Discord.MessageAttachment(textCanvas.toBuffer(), 'image.png');
          //sendWithWebhookCheck(message.channel, attachment2)

          context.drawImage(textCanvas, 0, 600, canvas.width, 400);
          context.drawImage(markCanvas, 1000, 100, 290, 290);
          context.drawImage(heroCanvas, 490, 155, 155, 155);
          //context.translate(canvas.width/2, 0)

          let attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'image.png');
          sendWithWebhookCheck(message.channel, attachment).then(msg.delete())
        })
      }


      else if (primaryCommand.toLowerCase() == prefix + "ap") 
      {
        if (message.author.id == message.guild.ownerID) return sendWithWebhookCheck(message.channel, "Server owners don't receive action points!")
        if (await db.fetch(`actionPointsOfMember${message.author.id}InServer${message.guild.id}`) == null || await db.fetch(`actionPointsOfMember${message.author.id}InServer${message.guild.id}`) < 1) await db.set(`actionPointsOfMember${message.author.id}InServer${message.guild.id}`, 0)
        let actionPoints = await db.fetch(`actionPointsOfMember${message.author.id}InServer${message.guild.id}`)
        //console.log(message.author.id)
        sendWithWebhookCheck(message.channel, "You currently have " + actionPoints + " action points!")
        if (actionPoints != 0) 
        {
          let oldValue = await db.fetch(`actionPointsOfMember${message.author.id}InServer${message.guild.id}`)
          setTimeout(async function()
          { 
            if (oldValue == await db.fetch(`actionPointsOfMember${message.author.id}InServer${message.guild.id}`)) 
            {
              await db.set(`actionPointsOfMember${message.author.id}InServer${message.guild.id}`, 0)
              sendWithWebhookCheck(message.channel, "An error occured, reset of action points!")
            }
          }, 3000);
        }
      }


      else if (primaryCommand.toLowerCase() == prefix + "security") 
      {
        if (await db.fetch(`punishmendForReachingActionPointsLimitIn${message.guild.id}`) == null) await db.set(`punishmendForReachingActionPointsLimitIn${message.guild.id}`, `roles remove`)
        let embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Security menu:')
        .setDescription('Need help with keeping the server safe? No problem! Just setup everything and the bot will keep an eye on it.\n\nWhat do you want to do?')
        .addFields(
          { name: "🔍 - overview", value: "Shows current security settings" },
          { name: "👮 - permit", value: "Enable or disable security" },
          { name: "🎚️ - manage income", value: "Manage income of action points for each action" },
          { name: "⚖️ - manage punishment", value: "Manage action points limit or punishment for reaching the limit" },
          { name: "⛔ - cancel", value: "Exit security menu" },
        )
        .setTimestamp()
        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
      
      message.channel.send(embed)
      .then((msg) => 
      {
        msg.react('🔍')
        .then(msg.react('👮'))
        .then(msg.react('🎚️'))
        .then(msg.react('⚖️'))
        .then(msg.react('⛔'))

        msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '🔍' || reaction.emoji.name == '👮' || reaction.emoji.name == '🎚️' || reaction.emoji.name == '⚖️' || reaction.emoji.name == '⛔'),
        { max: 1, time: 1000 * 60 }).then(async function(collected) 
        { 
          if (collected.first().emoji.name == '🔍')
          {
            msg.reactions.removeAll()
            let permit
            if (await db.fetch(`securityOfServer${message.guild.id}`) == true) permit = "enabled"
            else permit = "disabled"

            embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Security overview by ${message.author.tag}:`)
            // await db.fetch(`actionPointsForMassMentionInServer${message.guild.id}`)
            //.setDescription('Need help with keeping the server safe? No problem! Just setup everything and the bot will keep an eye on it.\n\nWhat do you want to do?')
            .addFields(
              { name: "👮 Permit:", value: permit },
              { name: "🎚️ Income:", value: `**💬 Messages:**\nMessage sent: \`${await db.fetch(`actionPointsForMessageInServer${message.guild.id}`)}\`\nSpam (message repetition): \`${await db.fetch(`actionPointsForSpamInServer${message.guild.id}`)}\`\nMember mention: \`${await db.fetch(`actionPointsForSingleMentionInServer${message.guild.id}`)}\`\nMass (role) metion: \`${await db.fetch(`actionPointsForMassMentionInServer${message.guild.id}`)}\`\nAny link: \`${await db.fetch(`actionPointsForLinkInServer${message.guild.id}`)}\`\nDiscord invite: \`${await db.fetch(`actionPointsForDiscordInviteInServer${message.guild.id}`)}\`\n**👥 Members:**\nBan: \`${await db.fetch(`actionPointsForGuildBanAddInServer${message.guild.id}`)}\`\nUnban: \`${await db.fetch(`actionPointsForGuildBanRemoveInServer${message.guild.id}`)}\`\nMember edit: \`${await db.fetch(`actionPointsForGuildMemberUpdateInServer${message.guild.id}`)}\`\n**🗒️ Channels:**\nChannel create: \`${await db.fetch(`actionPointsForChannelCreateInServer${message.guild.id}`)}\`\nChannel delete: \`${await db.fetch(`actionPointsForChannelDeleteInServer${message.guild.id}`)}\`\nChannel edit: \`${await db.fetch(`actionPointsForChannelUpdateInServer${message.guild.id}`)}\`\n**🎭 Roles:**\nRole create: \`${await db.fetch(`actionPointsForRoleCreateInServer${message.guild.id}`)}\`\nRole delete: \`${await db.fetch(`actionPointsForRoleDeleteInServer${message.guild.id}`)}\`\nRole edit: \`${await db.fetch(`actionPointsForRoleUpdateInServer${message.guild.id}`)}\`\n**😀 Emojis:**\nEmoji create: \`${await db.fetch(`actionPointsForEmojiCreateInServer${message.guild.id}`)}\`\nEmoji delete: \`${await db.fetch(`actionPointsForEmojiDeleteInServer${message.guild.id}`)}\`\nEmoji edit: \`${await db.fetch(`actionPointsForEmojiUpdateInServer${message.guild.id}`)}\`\n` },
              { name: "⚖️ Punishment", value: `Punishment limit: 100ap\nPunishment: ${await db.fetch(`punishmendForReachingActionPointsLimitIn${message.guild.id}`)}` },
            )
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
          
          msg.edit(embed)
          }
          if (collected.first().emoji.name == '👮') 
          {
            msg.reactions.removeAll()
            if (await db.fetch(`securityOfServer${message.guild.id}`) == true) 
            {
              embed = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .setTitle(`Managing permit by ${message.author.tag}:`)
              .setDescription('Security in this server is enabled. Disable?')
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
            msg.edit(embed)
            }
            else 
            {
              embed = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .setTitle(`Managing permit by ${message.author.tag}:`)
              .setDescription('Security in this server is disabled. Enable?')
              .setTimestamp()
              .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
            
            msg.edit(embed)
            }
              msg.react('✅')
              .then(msg.react('⛔'))

              msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '⛔'),
              { max: 1, time: 1000 * 30 }).then(async function(collected) 
              {
                if (collected.first().emoji.name == '✅' && await db.fetch(`securityOfServer${message.guild.id}`) == true)
                {
                  await db.set(`securityOfServer${message.guild.id}`, false)

                  msg.reactions.removeAll()

                  embed = new Discord.MessageEmbed()
                  .setColor('#0099ff')
                  .setTitle(`Managing permit by ${message.author.tag}:`)
                  .setDescription('Security of this server successfully disabled!')
                  .setTimestamp()
                  .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                
                msg.edit(embed)
                }
                else if (collected.first().emoji.name == '✅' && await db.fetch(`securityOfServer${message.guild.id}`) != true) 
                {
                  await db.set(`securityOfServer${message.guild.id}`, true)

                  msg.reactions.removeAll()

                  embed = new Discord.MessageEmbed()
                  .setColor('#0099ff')
                  .setTitle(`Managing permit by ${message.author.tag}:`)
                  .setDescription('Security of this server successfully enabled!')
                  .setTimestamp()
                  .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                
                msg.edit(embed)
                }
                else if (collected.first().emoji.name == '⛔') 
                {
                  msg.reactions.removeAll()
                  const embed = new Discord.MessageEmbed()
                  .setColor('#FF0000')
                  .setTitle('Operation cancelled!')
                  .setTimestamp()
                  .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                
                msg.edit(embed)
                  return
                }
              }).catch(() => {
                msg.reactions.removeAll()
                const embed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Operation cancelled!')
                .setTimestamp()
                .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
              
              msg.edit(embed)
              return;
              });
          }
          if (collected.first().emoji.name == '🎚️')
          {
            msg.reactions.removeAll()
            embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Managing income by ${message.author.tag}:`)
            // await db.fetch(`actionPointsForMassMentionInServer${message.guild.id}`)
            .setDescription('What parameter do you want to change? Please send it\'s name or ID in the chat now! Type "CANCEL" to cancel.')
            .addFields(
              { name: "💬 Messages:", value: `Message sent: \`${await db.fetch(`actionPointsForMessageInServer${message.guild.id}`)}\`, ID: **1.1**\nSpam (message repetition): \`${await db.fetch(`actionPointsForSpamInServer${message.guild.id}`)}\`, ID: **1.2**\nMember mention: \`${await db.fetch(`actionPointsForSingleMentionInServer${message.guild.id}`)}\`, ID: **1.3**\nMass (role) metion: \`${await db.fetch(`actionPointsForMassMentionInServer${message.guild.id}`)}\`, ID: **1.4**\nAny link: \`${await db.fetch(`actionPointsForLinkInServer${message.guild.id}`)}\`, ID: **1.5**\nDiscord invite: \`${await db.fetch(`actionPointsForDiscordInviteInServer${message.guild.id}`)}\`, ID: **1.6**`},
              { name: "👥 Members:", value: `Ban: \`${await db.fetch(`actionPointsForGuildBanAddInServer${message.guild.id}`)}\`, ID: **2.1**\nUnban: \`${await db.fetch(`actionPointsForGuildBanRemoveInServer${message.guild.id}`)}\`, ID: **2.2**\nMember edit: \`${await db.fetch(`actionPointsForGuildMemberUpdateInServer${message.guild.id}`)}\`, ID: **2.3**` },
              { name: "🗒️ Channels:", value: `Channel create: \`${await db.fetch(`actionPointsForChannelCreateInServer${message.guild.id}`)}\`, ID: **3.1**\nChannel delete: \`${await db.fetch(`actionPointsForChannelDeleteInServer${message.guild.id}`)}\`, ID: **3.2**\nChannel edit: \`${await db.fetch(`actionPointsForChannelUpdateInServer${message.guild.id}`)}\`, ID: **3.3**` },
              { name: "🎭 Roles:", value: `Role create: \`${await db.fetch(`actionPointsForRoleCreateInServer${message.guild.id}`)}\`, ID: **4.1**\nRole delete: \`${await db.fetch(`actionPointsForRoleDeleteInServer${message.guild.id}`)}\`, ID: **4.2**\nRole edit: \`${await db.fetch(`actionPointsForRoleUpdateInServer${message.guild.id}`)}\`, ID: **4.3**` },
              { name: "😀 Emojis:", value: `Emoji create: \`${await db.fetch(`actionPointsForEmojiCreateInServer${message.guild.id}`)}\`, ID: **5.1**\nEmoji delete: \`${await db.fetch(`actionPointsForEmojiDeleteInServer${message.guild.id}`)}\`, ID: **5.2**\nEmoji edit: \`${await db.fetch(`actionPointsForEmojiUpdateInServer${message.guild.id}`)}\`, ID: **5.3**` },
            )
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
          
          msg.edit(embed)

          message.channel.awaitMessages(m => m.author.id == message.author.id,
            {max: 1, time: 1000 * 60 }).then(async function(collected) 
            {
              let theAnswer = collected.first().content.toLowerCase()
              actionNameFind(theAnswer)
              .then(function(resolved) 
              {
                let commandName = resolved[0]
                let found = resolved[1]
                //console.log(found)
                //console.log(commandName)
                if (commandName == `didn't find`)
                {
                  msg.reactions.removeAll()
                  embed = new Discord.MessageEmbed()
                  .setColor('#FF0000')
                  .setTitle('No parameter found, operation cancelled!')
                  .setTimestamp()
                  .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                
                msg.edit(embed)
                return;
                }
                if (commandName == `cancel`) 
                {
                  msg.reactions.removeAll()
                  embed = new Discord.MessageEmbed()
                  .setColor('#FF0000')
                  .setTitle('Operation cancelled!')
                  .setTimestamp()
                  .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                
                msg.edit(embed)
                return;
                }
                else 
                {
                  embed = new Discord.MessageEmbed()
                  .setColor('#0099ff')
                  .setTitle(`Managing income by ${message.author.tag}:`)
                  // await db.fetch(`actionPointsForMassMentionInServer${message.guild.id}`)
                  .setDescription(`You are editing \`${found}\`! Please enter a number from 0 to 100!`)
                  .setTimestamp()
                  .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                
                  msg.edit(embed)

                  message.channel.awaitMessages(m => m.author.id == message.author.id,
                    {max: 1, time: 1000 * 60 }).then(async function(collected) 
                    {
                      let theValue
                      //if (collected.first().content.toLowerCase() != `max` && collected.first().content.toLowerCase() != `null` && collected.first().content.toLowerCase() != `def`)
                      theValue = parseInt(collected.first().content)
                      if (theValue == undefined || theValue == null)
                      {
                        embed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle(`You didn't enter a valid number, operation cancelled!`)
                        // await db.fetch(`actionPointsForMassMentionInServer${message.guild.id}`)
                        //.setDescription(`You didn't enter a valid number, operation cancelled!`)
                        .setTimestamp()
                        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                      
                        msg.edit(embed)
                        return
                      }
                      if (theValue < 0)
                      {
                        theValue = 0
                      }
                      if (theValue > 100)
                      {
                        theValue = 100
                      }
                      await db.set(`actionPointsFor${commandName}InServer${message.guild.id}`, theValue)

                      embed = new Discord.MessageEmbed()
                      .setColor('#0099ff')
                      .setTitle(`Managing income by ${message.author.tag}:`)
                      // await db.fetch(`actionPointsForMassMentionInServer${message.guild.id}`)
                      .setDescription(`Income for \`${found}\` successfully changed to \`${theValue}\`!`)
                      .setTimestamp()
                      .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                    
                      msg.edit(embed)
                    })
                }
              })
            })
          }
          if (collected.first().emoji.name == '⛔')
          {
            msg.reactions.removeAll()
            const embed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle('Operation cancelled!')
            .setTimestamp()
            .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
          
          msg.edit(embed)
          return;
          }
        }).catch(() => {
          msg.reactions.removeAll()
          const embed = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Operation cancelled!')
          .setTimestamp()
          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
        
        msg.edit(embed)
        return;
        });
      })
      }


      else if(primaryCommand.toLowerCase() == prefix + "template") 
      {
        if (!message.member.hasPermission('MANAGE_GUILD')) return sendWithWebhookCheck(message.channel, "You cannot manage this setting!")
        const templateEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Templates menu:')
        .setDescription('What do you want to do?')
        //.setThumbnail('https://i.imgur.com/wSTFkRM.png')
        .addFields(
          { name: "📝 - create new template", value: "Create a new template based on this server" },
          { name: "💾 - load template", value: "Use a template you already have" },
          { name: "🗑️ - delete template", value: "Delete an unwanted template" },
          { name: "⛔ - cancel", value: "Exit templates menu" },
          //{ name: "In progress commands (not recomended to use): ", value: inProgressCommands },
          //{ name: '\u200B', value: '\u200B' },
          //{ name: 'Inline field title', value: 'Some value here', inline: true },
          //{ name: 'Inline field title', value: 'Some value here', inline: true },
        )
        //.addField('Inline field title', 'Some value here', true)
        //.setImage('https://i.imgur.com/wSTFkRM.png')
        .setTimestamp()
        .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
      
      message.channel.send(templateEmbed)
      .then((msg) => 
      {
        msg.react('📝')
        .then(msg.react('💾'))
        .then(msg.react('🗑️'))
        .then(msg.react('⛔'))

        msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '📝' || reaction.emoji.name == '💾' || reaction.emoji.name == '🗑️' || reaction.emoji.name == '⛔'),
        { max: 1, time: 1000 * 60 }).then(async function(collected) {
                if (collected.first().emoji.name == '📝') 
                {
                  let templates = await db.fetch(`serverTemplatesOfUser${message.author.id}`)
                  if (templates == null || templates == undefined) templates = []
                  //console.log(templates.length)
                  if (templates.length < 3)
                  {
                    msg.reactions.removeAll()
                    const templateEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('New template')
                    .setDescription('Please give your new template a name (for example "MyTemplate1"). Do it in the chat now! The name must include less than 30 characters and cannot include spaces.')
                    .setTimestamp()
                    .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                  
                  msg.edit(templateEmbed)
                  .then((msg) => 
                  {
                    message.channel.awaitMessages(m => m.author.id == message.author.id,
                      {max: 1, time: 1000 * 30}).then(async function(collected) {
                        let newTemplateName = collected.first().content
                        if(newTemplateName.length > 30 || newTemplateName.includes(" ")) 
                        {
                          msg.reactions.removeAll()
                          const templateEmbed = new Discord.MessageEmbed()
                          .setColor('#0099ff')
                          .setTitle('Operation error!')
                          .setDescription('Name of the new template is too long or includes spaces!')
                          .setTimestamp()
                          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                        
                        msg.edit(templateEmbed)
                        return;
                        }
                        let chans = message.guild.channels.cache
                        let channelsToExport = []
                        for(i=0;i<chans.filter(x=>x.type == "category").size;i++)
                        {
                          let cat = chans.find(x=>x.type == "category" && x.position == i)
                          channelsToExport.push(cat)
                          for(j=0;j<chans.filter(x=>x.parentID == cat.id).size;j++)
                          {
                            channelsToExport.push(chans.find(x=>x.parentID == cat.id && x.position == j))
                          }
                        }
                          let newTemplate = {name: newTemplateName, guildObject: {name: message.guild.name, icon: message.guild.iconURL({dynamic: true, size: 1024}), channelsCache: channelsToExport, rolesCache: message.guild.roles.cache, emojisCache: message.guild.emojis.cache}}
                          templates.push(newTemplate)
                          await db.set(`serverTemplatesOfUser${message.author.id}`, templates)
                          let updatedTemplates = await db.fetch(`serverTemplatesOfUser${message.author.id}`)
                          console.log(updatedTemplates.find(x => x.name == newTemplateName).guildObject.channelsCache)
                          updatedTemplates.find(x => x.name == newTemplateName).guildObject.channelsCache.forEach(function(c)
                          {
                            if(c.type != 'category')
                            {
                              let oldC = channelsToExport.find(x => x.id == c.id)
                              delete c.parentID;
                              c.parent = {name: oldC.parent.name, id: oldC.parentID, position: oldC.parent.position}
                            }
                          })
                          
                          await db.set(`serverTemplatesOfUser${message.author.id}`, updatedTemplates)

                          const templateEmbed = new Discord.MessageEmbed()
                          .setColor('#0099ff')
                          .setTitle('New template')
                          .setDescription(`Template \`${newTemplateName}\` of this server successfully added to your templates!`)
                          .setTimestamp()
                          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                          
                          msg.edit(templateEmbed)
                          //console.log(await db.fetch(`serverTemplatesOfUser${message.author.id}`))
                    })
                  })
                  }
                  else 
                  {
                    msg.reactions.removeAll()
                    const templateEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Operation error!')
                    .setDescription('You can have max 3 templates! Delete one to create an another one.')
                    .setTimestamp()
                    .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                    
                    msg.edit(templateEmbed)
                    return;
                  }
                }
                if (collected.first().emoji.name == '💾') 
                {
                  msg.reactions.removeAll()
                  let templates = await db.fetch(`serverTemplatesOfUser${message.author.id}`)
                  if (templates == null || templates == undefined) templates = []
                  if (templates.length == 0) 
                  {
                    const templateEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Operation error!')
                    .setDescription('You don\'t have any templates saved! Create a template first.')
                    .setTimestamp()
                    .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                  
                  msg.edit(templateEmbed)
                  return;
                  }

                  const templateEmbed = new Discord.MessageEmbed()
                  .setColor('#0099ff')
                  .setTitle('Load template')
                  .setDescription(`**Pick the template to load:\nSlot 1️⃣: ${(templates[0] != null && templates[0] != undefined) ? "`"+templates[0].name+"`" : "[empty slot]"}\nSlot 2️⃣: ${(templates[1] != null && templates[1] != undefined) ? "`"+templates[1].name+"`" : "[empty slot]"}\nSlot 3️⃣: ${(templates[2] != null && templates[2] != undefined) ? "`"+templates[2].name+"`" : "[empty slot]"}**`)
                  .setTimestamp()
                  .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                
                msg.edit(templateEmbed)
                .then((msg) => 
                  {
                    msg.react('1️⃣')
                    .then(msg.react('2️⃣'))
                    .then(msg.react('3️⃣'))
            
                    msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '1️⃣' || reaction.emoji.name == '2️⃣' || reaction.emoji.name == '3️⃣'),
                    { max: 1, time: 1000 * 60 }).then(async function(collected) 
                    {
                      msg.reactions.removeAll()
                      let tempToLoadIndex
                      if (collected.first().emoji.name == '1️⃣') tempToLoadIndex = 0
                      if (collected.first().emoji.name == '2️⃣') tempToLoadIndex = 1
                      if (collected.first().emoji.name == '3️⃣') tempToLoadIndex = 2

                      const templateEmbed = new Discord.MessageEmbed()
                      .setColor('#0099ff')
                      .setTitle('Load template')
                      .setDescription(`**Load template \`${templates[tempToLoadIndex].name}\`? This action may delete current items of this server (channels, roles, emojis) and create new ones.**`)
                      .setTimestamp()
                      .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

                      let toLoad = templates[tempToLoadIndex].name
                    
                    msg.edit(templateEmbed)
                    .then((msg) => 
                    {
                      msg.react('✅')
                      .then(msg.react('⛔'))
              
                      msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '⛔'),
                      { max: 1, time: 1000 * 60 }).then(async function(collected) 
                      {
                        if (collected.first().emoji.name == '✅') 
                        {
                          loadTemplate(message.guild, templates[tempToLoadIndex], "refresh")
                        }
                        if (collected.first().emoji.name == '⛔') 
                        {
                          msg.reactions.removeAll()
                          const templateEmbed = new Discord.MessageEmbed()
                          .setColor('#FF0000')
                          .setTitle('Operation cancelled!')
                          .setTimestamp()
                          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                        
                        msg.edit(templateEmbed)
                        }
                      })
                    })
                    })
                  })
                  
                }
                if (collected.first().emoji.name == '🗑️')
                {
                  let templates = await db.fetch(`serverTemplatesOfUser${message.author.id}`)
                  if (templates == null || templates == undefined) templates = []

                  msg.reactions.removeAll()
                  const templateEmbed = new Discord.MessageEmbed()
                  .setColor('#0099ff')
                  .setTitle('Delete template')
                  .setDescription(`**Pick the template to delete:\nSlot 1️⃣: ${(templates[0] != null && templates[0] != undefined) ? "`"+templates[0].name+"`" : "[empty slot]"}\nSlot 2️⃣: ${(templates[1] != null && templates[1] != undefined) ? "`"+templates[1].name+"`" : "[empty slot]"}\nSlot 3️⃣: ${(templates[2] != null && templates[2] != undefined) ? "`"+templates[2].name+"`" : "[empty slot]"}**`)
                  .setTimestamp()
                  .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                
                msg.edit(templateEmbed)
                .then((msg) => 
                  {
                    msg.react('1️⃣')
                    .then(msg.react('2️⃣'))
                    .then(msg.react('3️⃣'))
            
                    msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '1️⃣' || reaction.emoji.name == '2️⃣' || reaction.emoji.name == '3️⃣'),
                    { max: 1, time: 1000 * 60 }).then(async function(collected) 
                    {
                      msg.reactions.removeAll()
                      let tempToDeleteIndex
                      if (collected.first().emoji.name == '1️⃣') tempToDeleteIndex = 0
                      if (collected.first().emoji.name == '2️⃣') tempToDeleteIndex = 1
                      if (collected.first().emoji.name == '3️⃣') tempToDeleteIndex = 2

                      const templateEmbed = new Discord.MessageEmbed()
                      .setColor('#0099ff')
                      .setTitle('Delete template')
                      .setDescription(`**Permanently delete template \`${templates[tempToDeleteIndex].name}\`? You won't be able to undo this action.**`)
                      .setTimestamp()
                      .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());

                      let toDelete = templates[tempToDeleteIndex].name
                    
                    msg.edit(templateEmbed)
                    .then((msg) => 
                    {
                      msg.react('✅')
                      .then(msg.react('⛔'))
              
                      msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '⛔'),
                      { max: 1, time: 1000 * 60 }).then(async function(collected) 
                      {
                        let tempToDeleteIndex
                        if (collected.first().emoji.name == '✅') 
                        {
                          msg.reactions.removeAll()
                          templates.splice(tempToDeleteIndex, 1)
                          await db.set(`serverTemplatesOfUser${message.author.id}`, templates)

                          const templateEmbed = new Discord.MessageEmbed()
                          .setColor('#0099ff')
                          .setTitle('Delete template')
                          .setDescription(`**Template \`${toDelete}\` deleted!**`)
                          .setTimestamp()
                          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                        
                        msg.edit(templateEmbed)
                        }
                        if (collected.first().emoji.name == '⛔') 
                        {
                          msg.reactions.removeAll()
                          const templateEmbed = new Discord.MessageEmbed()
                          .setColor('#FF0000')
                          .setTitle('Operation cancelled!')
                          .setTimestamp()
                          .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                        
                        msg.edit(templateEmbed)
                        }
                      })
                    })
                    })
                  })
                }
                if (collected.first().emoji.name == '⛔') 
                {
                  msg.reactions.removeAll()
                  const templateEmbed = new Discord.MessageEmbed()
                  .setColor('#FF0000')
                  .setTitle('Operation cancelled!')
                  .setTimestamp()
                  .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
                
                msg.edit(templateEmbed)
                return;
                }
              }).catch(() => {
                msg.reactions.removeAll()
                const templateEmbed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Operation cancelled!')
                .setTimestamp()
                .setFooter(translating(language, {english: `${primaryCommand} by ${message.author.tag}`, polish: `${primaryCommand} od ${message.author.tag}`, croatian: `${primaryCommand} od ${message.author.tag}`}), message.author.avatarURL());
              
              msg.edit(templateEmbed)
              return;
          });
      })



      }


      else if(await db.fetch(`customRoleCommandsOfServer${message.guild.id}`) != null && await db.fetch(`customRoleCommandsOfServer${message.guild.id}`).map(x=>x.name).includes(primaryCommand.slice(prefix.length)))
      {
        let command = await db.fetch(`customRoleCommandsOfServer${message.guild.id}`).find(x => prefix + x.name == primaryCommand)
        if(command.permission != "NO" && !message.member.hasPermission(command.permission)) return sendWithWebhookCheck(message.channel, "You don't have the permission required to use this command ("+ command.permission.split("_").join(" ").toLowerCase() +")!")

        let receiver;
        if(command.receiver == "me") receiver = message.member;
        if(command.receiver == "mention") 
        {
          receiver = message.mentions.members.first()
          if(receiver == undefined) return sendWithWebhookCheck(message.channel, "You didn't mention a valid member!")
        }
        if(command.receiver == "id")
        {
          receiver = (await message.guild.members.fetch()).get(arguments[0])
          if(receiver == undefined) return sendWithWebhookCheck(message.channel, "You didn't provide ID of a valid member!")
        }

        if (receiver.roles.highest.position > message.guild.me.roles.highest.position || command.receiver != "me" && receiver.roles.highest.position >= message.member.roles.highest.position) return sendWithWebhookCheck(message.channel, "Me or you cannot manage this member!")


        if(command.rolesToAdd.length > 0)
        {
          command.rolesToAdd.forEach((r) => 
          {
            receiver.roles.add(r.id).catch()
          })
        }
        if(command.rolesToRemove != "all" && command.rolesToRemove.length > 0)
        {
          command.rolesToRemove.forEach((r) => 
          {
            receiver.roles.remove(r.id).catch()
          })
        }
        else if(command.rolesToRemove == "all")
        {
          receiver.roles.cache.forEach((r) => 
          {
            receiver.roles.remove(r.id).catch()
          })
        }
      }
    })







    async function sendWithWebhookCheck(channel, message) 
    {
      return new Promise(async function(res, rej) {
        if (await db.fetch(`customWebhookBotNameInServer${channel.guild.id}`) != null && await db.fetch(`customWebhookBotUrlInServer${channel.guild.id}`) != null)
        {
          let name = await db.fetch(`customWebhookBotNameInServer${channel.guild.id}`)
          let url = await db.fetch(`customWebhookBotUrlInServer${channel.guild.id}`)
          var theWebhook

          channel.fetchWebhooks()
          .then(webhooks => {
            theWebhook = webhooks.find(webhook => webhook.name == name && webhook.owner.id == client.user.id)
            if (theWebhook != null && theWebhook != undefined) 
            {
              theWebhook.send(message)
              .then((msg) => {
                  res(msg);
              })
            }
          /*webhooks.forEach((webhook) => 
          {
            channel.fetchWebhooks()
            if (webhook.name == name && webhook.owner.id == client.user.id) 
            {
              theWebhook = webhook
              theWebhook.send(message)
              .then((msg) => {
                  res(msg);
              })
            }
          })*/
          if (theWebhook == null || theWebhook == undefined)
          {
            channel.send("Creating a new webhook for this channel...\nPlease don't use commands in this channel now or the bot will create more webhooks. In that case use command `webhook CLEAN`!")
            .then((infoMessage) => 
            {
              channel.createWebhook(name, {
                avatar: url,
              })
                .then(webhook => {
                  webhook.send(message)
                  infoMessage.delete()
                  .then((msg) => {
                      res(msg);
                  })
                })
                .catch(function() 
                {
                  infoMessage.delete()
                  channel.send(`An error occurred during creating a new webhook for this channel! Please make sure there are less than 10 webhooks in this channel and the bot has required permissions.`)
                  .then(function(msg) 
                  {
                    msg.delete({ timeout: 5000 })
                  })
                });
            })
          }
          //console.log()
          
        })
        }
        else 
        channel.send(message)
        .then((msg) => { 
            res(msg);
      })
      })
    }

    async function globalSlowmode(message, commandName, duration) 
    {
      let total = await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`) + duration
      await db.set(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`, total)
      if (total - duration != 0) return;
      let interval = setInterval(async function() {
        total = await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`)
        total = total - 1
        await db.set(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`, total)
        if (await db.fetch(`globalSlowmodeOfCommand${commandName}ForMember${message.author.id}`) == 0) clearInterval(interval);
      }, 1000);
    }

    async function localSlowmode(message, commandName, duration) 
    {
      let total = await db.fetch(`localSlowmodeOfCommand${commandName}ForMember${message.author.id}InServer${message.guild.id}`) + duration
      await db.set(`localSlowmodeOfCommand${commandName}ForMember${message.author.id}InServer${message.guild.id}`, total)
      if (total - duration != 0) return;
      let interval = setInterval(async function() {
        total = await db.fetch(`localSlowmodeOfCommand${commandName}ForMember${message.author.id}InServer${message.guild.id}`)
        total = total - 1
        await db.set(`localSlowmodeOfCommand${commandName}ForMember${message.author.id}InServer${message.guild.id}`, total)
        if (await db.fetch(`localSlowmodeOfCommand${commandName}ForMember${message.author.id}InServer${message.guild.id}`) == 0) clearInterval(interval);
      }, 1000);
    }

    async function serverSlowmode(message, commandName, duration) 
    {
      let total = await db.fetch(`serverSlowmodeOfCommand${commandName}InServer${message.guild.id}`) + duration
      await db.set(`serverSlowmodeOfCommand${commandName}InServer${message.guild.id}`, total)
      if (total - duration != 0) return;
      let interval = setInterval(async function() {
        total = await db.fetch(`serverSlowmodeOfCommand${commandName}InServer${message.guild.id}`)
        total = total - 1
        await db.set(`serverSlowmodeOfCommand${commandName}InServer${message.guild.id}`, total)
        if (await db.fetch(`serverSlowmodeOfCommand${commandName}InServer${message.guild.id}`) == 0) clearInterval(interval);
      }, 1000);
    }

    async function actionPoints(member, actionName, guild) 
    {
      if (member.id == client.user.id || member.id == guild.owner.user.id) return;
      //console.log(member.id)
      if (await db.fetch(`actionPointsOfMember${member.id}InServer${guild.id}`) == null) await db.set(`actionPointsOfMember${member.id}InServer${guild.id}`, 0)
      let pointsBefore = await db.fetch(`actionPointsOfMember${member.id}InServer${guild.id}`)
      await db.set(`actionPointsOfMember${member.id}InServer${guild.id}`, await db.fetch(`actionPointsOfMember${member.id}InServer${guild.id}`) + await db.fetch(`actionPointsFor${actionName}InServer${guild.id}`)) 
      let actionPoints = await db.fetch(`actionPointsOfMember${member.id}InServer${guild.id}`)
      //console.log(`Trigger of: ${actionName}, ${actionPoints}`)
      if (actionPoints < 99 && actionPoints > ((80/100) * 100) && member.roles.highest.position < guild.members.cache.get(client.user.id).roles.highest.position)
      {
        member.send(`You have just reached 80% of action points required to be punished in server ${guild.name}. Calm down or I will have to act!`)
      }
      if (actionPoints > 99)
      {
        if (guild.members.cache.get(member.id).roles.highest.position >= guild.members.cache.get(client.user.id).roles.highest.position) 
        {
        if (await db.fetch(`idOfLoggingChannelOfServer${guild.id}`) != null && client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${guild.id}`)) != undefined) client.channels.cache.get(await db.fetch(`idOfLoggingChannelOfServer${guild.id}`)).send(`Member ${member} has reached action points limit but i couldn't have done anything! Make sure the server is safe!`)
        guild.owner.send(`Member ${member.user.tag} has reached action points limit in server ${guild.name} but i couldn't have done anything! Make sure the server is safe!`)
        await db.set(`actionPointsOfMember${member.id}InServer${guild.id}`, 0) 
        return;
        }

        if (await db.fetch(`punishmendForReachingActionPointsLimitIn${guild.id}`) == null) await db.set(`punishmendForReachingActionPointsLimitIn${guild.id}`, `ban`)

        if (await db.fetch(`punishmendForReachingActionPointsLimitIn${guild.id}`) == `ban`)
        {
        member.ban({reason: `Reaching action points limit!`})
        .then(async function(m) 
        {
        m.send(`You were banned from ${guild.name} for reaching action points limit!`)
        await db.set(`actionPointsOfMember${member.id}InServer${guild.id}`, 0) 
        })
        }


        else if (await db.fetch(`punishmendForReachingActionPointsLimitIn${guild.id}`) == `roles remove`)
        {
        member.roles.cache.forEach(function (role) 
        {
          if (role.name != '@everyone')
          {
            member.roles.remove(role)
          }
        })
        await db.set(`actionPointsOfMember${member.id}InServer${guild.id}`, 0) 
          member.send(`Your roles got removed for reaching action points limit in ${guild.name}!`)
          await db.set(`actionPointsOfMember${member.id}InServer${guild.id}`, 0) 
        }


      }
      if (pointsBefore == 0) 
      {
      let interval = setInterval(async function() {
        actionPoints = await db.fetch(`actionPointsOfMember${member.id}InServer${guild.id}`)
        actionPoints = actionPoints - 1
        await db.set(`actionPointsOfMember${member.id}InServer${guild.id}`, actionPoints)
        if (await db.fetch(`actionPointsOfMember${member.id}InServer${guild.id}`) < 1) clearInterval(interval);
      }, 1000);
      }
      else 
      {
        let oldAp = await db.fetch(`actionPointsOfMember${member.id}InServer${guild.id}`)
        setTimeout(async function()
        { 
          if (oldAp == await db.fetch(`actionPointsOfMember${member.id}InServer${guild.id}`)) 
          {
            //sendWithWebhookCheck(message.channel, `An error occured, action points reset!`)
            await db.set(`actionPointsOfMember${member.id}InServer${guild.id}`, 0)
          }
        }, 3000);
        return;
      }
    }

    function fastActionsUse(theEmbed, guild, authorToSend, actionName, firstActionObject, secondActionObject)
    {
      let theBotMember = guild.members.cache.get(client.user.id)
      theEmbed.react('⬅️')
      .then(theEmbed.react('🔨'))
      let demandedPerm;

      if (actionName == 'ChannelCreate' || actionName == 'ChannelDelete' || actionName == 'ChannelUpdate') demandedPerm = 'MANAGE_CHANNELS'
      if (actionName == 'EmojiCreate' || actionName == 'EmojiDelete' || actionName == 'EmojiUpdate') demandedPerm = 'MANAGE_EMOJIS'
      if (actionName == 'GuildBanAdd' || actionName == 'GuildBanRemove') demandedPerm = 'BAN_MEMBERS'
      if (actionName == 'RoleCreate' || actionName == 'RoleDelete' || actionName == 'RoleUpdate') demandedPerm = 'MANAGE_ROLES'

      theEmbed.awaitReactions((reaction, user) => user.id != client.user.id && guild.members.cache.get(user.id).hasPermission([demandedPerm]) && guild.me.hasPermission([demandedPerm]) && (reaction.emoji.name == '⬅️'),
      { max: 1, time: 60000 * 5}).then(async function(collected) {
          let theActionAuthor;
          collected.first().users.cache.forEach(function(user)
          {
            if (user.id != client.user.id && guild.members.cache.get(user.id).hasPermission([demandedPerm])) 
            {
              theActionAuthor = user
            }
          })
          if (theActionAuthor == undefined || theActionAuthor == null) return;

          if (actionName == 'ChannelCreate') 
          {
            firstActionObject.delete(`Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`)
            .catch(() => {
              console.log(`Something went wrong with fast action (channelCreate fast actions) deleting ${firstActionObject.name}!`)
            })
          }
          if (actionName == 'ChannelDelete') 
          {
            guild.channels.create(firstActionObject.name, {topic: firstActionObject.topic, type: firstActionObject.type, permissionOverwrites: firstActionObject.permissionOverwrites, reason: `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`})
            .then((ch) => 
            {
              if (firstActionObject.parent != null) ch.setParent(firstActionObject.parent.id)
            })
          }
          if (actionName == 'ChannelUpdate') 
          {
            if (firstActionObject.name != secondActionObject.name) guild.channels.cache.get(secondActionObject.id).setName(firstActionObject.name, `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`)
            if (firstActionObject.topic != secondActionObject.topic) guild.channels.cache.get(secondActionObject.id).setTopic(firstActionObject.topic, `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`)
            if (firstActionObject.rateLimitPerUser != secondActionObject.rateLimitPerUser) guild.channels.cache.get(secondActionObject.id).setRateLimitPerUser(firstActionObject.rateLimitPerUser, `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`)
            if (firstActionObject.nsfw != secondActionObject.nsfw) guild.channels.cache.get(secondActionObject.id).setNSFW(firstActionObject.nsfw, `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`)
            //if (firstActionObject.type != secondActionObject.type) guild.channels.cache.get(secondActionObject.id).setType(firstActionObject.type)
            //edit({ type: firstActionObject.type })
          }
          if (actionName == 'EmojiCreate') 
          {
            firstActionObject.delete(`Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`)
            .catch(() => {
              console.log(`Something went wrong with fast action (emojiCreate fast actions) deleting ${firstActionObject.name}!`)
            })
          }
          if (actionName == 'EmojiDelete') 
          {
            guild.emojis.create(firstActionObject.url, firstActionObject.name, {reason: `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`})
          }
          if (actionName == 'EmojiUpdate') 
          {
            if (firstActionObject.name != secondActionObject.name) guild.emojis.cache.get(secondActionObject.id).setName(firstActionObject.name)
          }
          if (actionName == 'GuildBanAdd') 
          {
            guild.members.unban(firstActionObject.id, `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`)
          }
          if (actionName == 'GuildBanRemove') 
          {
            //console.log(firstActionObject)
            guild.members.ban(firstActionObject.id, {reason: `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`})
          }
          if (actionName == 'RoleCreate') 
          {
            //console.log(firstActionObject)
            if (firstActionObject.position < guild.members.cache.get(theActionAuthor.id).roles.highest.position && firstActionObject.position < theBotMember.roles.highest.position)
            {
            firstActionObject.delete(`Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`)
            }
            else 
            {
              theEmbed.reactions.cache.get('⬅️').remove()
            }
          }
          if (actionName == 'RoleDelete') 
          {
            let thePosition
            if (guild.members.cache.get(theActionAuthor.id).roles.highest.position > theBotMember.roles.highest.position) thePosition = theBotMember.roles.highest.position
            else thePosition = guild.members.cache.get(theActionAuthor.id).roles.highest.position


            if (firstActionObject.rawPosition < guild.members.cache.get(theActionAuthor.id).roles.highest.position && firstActionObject.rawPosition < theBotMember.roles.highest.position)
            {
            guild.roles.create({data: {name: firstActionObject.name, color: firstActionObject.color, hoist: firstActionObject.hoist, mentionable: firstActionObject.mentionable, permissions: firstActionObject.permissions, position: firstActionObject.rawPosition }, reason: `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`})
            }
            else (firstActionObject.rawPosition >= guild.members.cache.get(theActionAuthor.id).roles.highest.position)
            {
              guild.roles.create({data: {name: firstActionObject.name, color: firstActionObject.color, hoist: firstActionObject.hoist, mentionable: firstActionObject.mentionable, permissions: firstActionObject.permissions, position: thePosition }, reason: `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`})
            }
          }
          if (actionName == 'RoleUpdate') 
          {
            //console.log(firstActionObject)
            if (firstActionObject.position < guild.members.cache.get(theActionAuthor.id).roles.highest.position && firstActionObject.position < theBotMember.roles.highest.position)
            {
              if (firstActionObject.name != secondActionObject.name) guild.roles.cache.get(secondActionObject.id).setName(firstActionObject.name, `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`)
              if (firstActionObject.color != secondActionObject.color) guild.roles.cache.get(secondActionObject.id).setColor(firstActionObject.color, `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`)
              if (firstActionObject.hoist != secondActionObject.hoist) guild.roles.cache.get(secondActionObject.id).setHoist(firstActionObject.hoist, `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`)
              if (firstActionObject.mentionable != secondActionObject.mentionable) guild.roles.cache.get(secondActionObject.id).setMentionable(firstActionObject.mentionable, `Fast action by: ${theActionAuthor.id} (use command 'find' to find the user)`)
            }
            else 
            {
              theEmbed.reactions.cache.get('⬅️').remove()
            }
          }


          if (await db.fetch(`securityOfServer${guild.id}`) == true)
          {
          actionPoints(theActionAuthor, actionName, guild)
          }

          theEmbed.reactions.cache.get('⬅️').remove()
        }).catch(() => 
        {
          theEmbed.reactions.cache.get('⬅️').remove()
        })
      theEmbed.awaitReactions((reaction, user) => user.id != client.user.id && guild.members.cache.get(user.id).hasPermission(['BAN_MEMBERS']) && theBotMember.hasPermission(['BAN_MEMBERS']) && guild.members.cache.get(authorToSend.id).roles.highest.position < theBotMember.roles.highest.position && guild.members.cache.get(authorToSend.id).roles.highest.position < guild.members.cache.get(user.id).roles.highest.position && authorToSend.id != guild.ownerID && (reaction.emoji.name == '🔨'),
      { max: 1, time: 60000 * 5}).then(function(collected) {
        let theActionAuthor;
        collected.first().users.cache.forEach(function(user) 
        {
          if (user.id != client.user.id && guild.members.cache.get(user.id).hasPermission(['BAN_MEMBERS']) && theBotMember.hasPermission(['BAN_MEMBERS']) && guild.members.cache.get(authorToSend.id).roles.highest.position < theBotMember.roles.highest.position && guild.members.cache.get(authorToSend.id).roles.highest.position < guild.members.cache.get(user.id).roles.highest.position && authorToSend.id != guild.ownerID) 
          {
            theActionAuthor = user
          }
        })
        if (theActionAuthor == undefined || theActionAuthor == null) return;
          authorToSend.ban({reason: `Fast action ban by ${theActionAuthor.tag}!`}).then((m) => 
          {
            m.send(`You were banned from ${guild.name} by fast actions!`)
          }).catch(() => {
            console.log(`Something went wrong with fast action (roleCreate fast actions) banning ${authorToSend.user.tag}!`)
          })
          //console.log(collected)
          theEmbed.reactions.cache.get('🔨').remove()
        }).catch(() => 
        {
          theEmbed.reactions.cache.get('🔨').remove()
        })
    }

    async function addMoney(user, number) 
    {
      await db.set(`moneyOfMember${user.id}`, await db.fetch(`moneyOfMember${user.id}`) + number)
      if (await db.fetch(`moneyOfMember${user.id}`) < 0) await db.set(`moneyOfMember${user.id}`, 0)
      if (await db.fetch(`moneyOfMember${user.id}`) > await db.fetch(`moneyRecordOfMember${user.id}`)) await db.set(`moneyRecordOfMember${user.id}`, await db.fetch(`moneyOfMember${user.id}`))
    }

    async function removeBotAdmin(message, userId)
    {
      let admins = await db.fetch(`adminsOfBot`);
      if (admins == null) await db.set(`adminsOfBot`, ["501747059854934036"])
      let user = client.users.cache.get(userId)
      if (user == null || user == undefined) return sendWithWebhookCheck(message.channel, "No user with this ID found!")
      if (!admins.includes(userId)) return sendWithWebhookCheck(message.channel, "This member is not an admin!")
      admins = admins.filter(id => id !== userId)
      //var index = colors.indexOf(userId);
      //admins.splice(index, 1);
      await db.set(`adminsOfBot`, admins)
      sendWithWebhookCheck(message.channel, `Current admins of the bot: ${await db.fetch(`adminsOfBot`)}`)
    }

    async function addBotAdmin(message, userId)
    {
      let admins = await db.fetch(`adminsOfBot`);
      if (admins == null) await db.set(`adminsOfBot`, ["501747059854934036"])
      let user = client.users.cache.get(userId)
      if (user == null || user == undefined) return sendWithWebhookCheck(message.channel, "No user with this ID found!")
      admins = await db.fetch(`adminsOfBot`);
      if (admins.includes(userId)) return sendWithWebhookCheck(message.channel, "This member is already an admin!")
      admins.push(userId)
      //console.log(admins)
      await db.set(`adminsOfBot`, admins)
      sendWithWebhookCheck(message.channel, `Current admins of the bot: ${await db.fetch(`adminsOfBot`)}`)
    }

    function actionNameFind(theParameter) 
    {
      return new Promise(async function(res, rej) 
      {
        let commandName;
        let found;

        if (theParameter == `1.1` || theParameter == `message` || theParameter == `message sent` || theParameter == `m` || theParameter == `ms` || theParameter == `message-sent`) 
        {
          commandName = `Message`
          found = `Message sent`
        }
        else if (theParameter == `1.2` || theParameter == `spam` || theParameter == `s` || theParameter == `mr` || theParameter == `message repetition` || theParameter == `message-repetition` || theParameter == `spam (message repetition)` || theParameter == `spam message repetition`) 
        {
          commandName = `Spam`
          found = `Spam (message repetition)`
        }
        else if (theParameter == `1.3` || theParameter == `member mention` || theParameter == `mm` || theParameter == `member-mention`) 
        {
          commandName = `SingleMention`
          found = `Member mention`
        }
        else if (theParameter == `1.4` || theParameter == `mass mention` || theParameter == `rm` || theParameter == `role mention` || theParameter == `mass-mention` || theParameter == `mass (role) mention` || theParameter == `mass role mention`) 
        {
          commandName = `MassMention`
          found = `Mass (role) mention`
        }
        else if (theParameter == `1.5` || theParameter == `link` || theParameter == `l` || theParameter == `any link` || theParameter == `al` || theParameter == `any-link`) 
        {
          commandName = `Link`
          found = `Any link`
        }
        else if (theParameter == `1.6` || theParameter == `invite` || theParameter == `i` || theParameter == `discord invite` || theParameter == `di` || theParameter == `discord-invite`) 
        {
          commandName = `DiscordInvite`
          found = `Discord invite`
        }
        else if (theParameter == `2.1` || theParameter == `ban` || theParameter == `b` || theParameter == `member ban` || theParameter == `mb` || theParameter == `member-ban`) 
        {
          commandName = `GuildBanAdd`
          found = `Ban`
        }
        else if (theParameter == `2.2` || theParameter == `unban` || theParameter == `ub` || theParameter == `member unban` || theParameter == `mub` || theParameter == `member-unban`) 
        {
          commandName = `GuildBanRemove`
          found = `Unban`
        }
        else if (theParameter == `2.3` || theParameter == `member edit` || theParameter == `me` || theParameter == `member-edit` || theParameter == `member-update` || theParameter == `mu` || theParameter == `member update`) 
        {
          commandName = `MemberUpdate`
          found = `Member edit`
        }
        else if (theParameter == `3.1` || theParameter == `channel create` || theParameter == `cc` || theParameter == `channel-create` || theParameter == `chc`) 
        {
          commandName = `ChannelCreate`
          found = `Channel create`
        }
        else if (theParameter == `3.2` || theParameter == `channel delete` || theParameter == `cd` || theParameter == `channel-delete` || theParameter == `chd`) 
        {
          commandName = `ChannelDelete`
          found = `Channel delete`
        }
        else if (theParameter == `3.3` || theParameter == `channel edit` || theParameter == `ce` || theParameter == `channel-edit` || theParameter == `che`) 
        {
          commandName = `ChannelUpdate`
          found = `Channel edit`
        }
        else if (theParameter == `4.1` || theParameter == `role create` || theParameter == `rc` || theParameter == `role-create`) 
        {
          commandName = `RoleCreate`
          found = `Role create`
        }
        else if (theParameter == `4.2` || theParameter == `role delete` || theParameter == `rd` || theParameter == `role-delete`) 
        {
          commandName = `RoleDelete`
          found = `Role delete`
        }
        else if (theParameter == `4.3` || theParameter == `role edit` || theParameter == `re` || theParameter == `role-edit`) 
        {
          commandName = `RoleUpdate`
          found = `Role edit`
        }
        else if (theParameter == `5.1` || theParameter == `emoji create` || theParameter == `ec` || theParameter == `emoji-create`) 
        {
          commandName = `EmojiCreate`
          found = `Emoji create`
        }
        else if (theParameter == `5.2` || theParameter == `emoji delete` || theParameter == `ed` || theParameter == `emoji-delete`) 
        {
          commandName = `EmojiDelete`
          found = `Emoji delete`
        }
        else if (theParameter == `5.3` || theParameter == `emoji edit` || theParameter == `ee` || theParameter == `emoji-edit`) 
        {
          commandName = `EmojiUpdate`
          found = `Emoji edit`
        }
        else if (theParameter == `cancel` || theParameter == `c`) 
        {
          commandName = `cancel`
          found = `CANCEL`
        }
        else 
        {
          commandName = `didn't find`
          found = `nothing`
        }
        res([commandName, found])
      })
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
      var words = text.split(' ');
      var line = '';
  
      for(var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = ctx.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, y);
          //console.log(line)
          line = words[n] + ' ';
          y += lineHeight;
        }
        else {
          line = testLine;
        }
      }
      //console.log(line)
      ctx.fillText(line, x, y);
    }

    async function loadTemplate(guild, template, type) 
    {
      if (type == "refresh")
      {
        let highestManagedRolePosition = 0
        let highestManagedRole
        let rolesToDelete = guild.roles.cache.filter(r => r.name != "@everyone" && r.position < guild.me.roles.highest.position && r.managed == false)

        deleteAll(rolesToDelete)
        .then(function(rolesDeleted)
        {
          guild.roles.cache.forEach(function(role)
          {
            if (role.managed == true && role.position < guild.me.roles.highest.position && role.position > highestManagedRolePosition)
            highestManagedRolePosition = role.position
          })
          highestManagedRole = guild.roles.cache.find(r => r.position == highestManagedRolePosition)

          deleteAll(guild.channels.cache)
          .then(function(channelsDeleted) 
          {
            console.log(`Stats:\nHighest managed role: ${highestManagedRole.name}\nRoles deleted: ${rolesDeleted}\nChannels deleted: ${channelsDeleted}`)

            let rolesToCreate = template.guildObject.rolesCache

            createAll(rolesToCreate, guild)
            .then(function()
            {
              createAll(template.guildObject.channelsCache, guild)
            })
          })
        })
      }
    }

    function deleteAll(items) 
    {
      return new Promise(async function(res, rej) {
        let left = items.size
        if (items.size > 0)
        {
          items.forEach(function(item) 
          {
            item.delete()
            .then(() => 
            {
              left -= 1
              if (left <= 0) res(true)
            })
            //.then(console.log(item.name + " deleted!"))
          })
        }
        else 
        {
          res(true)
        }
      })
    }

    function createAll(items, guild) 
    {
      return new Promise(async function(res, rej) {
        //console.log(items.length)
        let left = items.length
        console.log(items.length)
        //console.log(items.size)
        if (items.length > 0)
        {
          //console.log("We got to creating itmes!")
          if (items[0].type != undefined) 
          {
            console.log("Creating channels!")

            let categories = []
            let otherChannels = []

            for (i = 0; i < items.length; i++)
            {
              let item = items[i]
              if (item.type == 'category') categories.push(item)
              else otherChannels.push(item)
            }

            createChannels(categories, guild)
            .then(createChannels(otherChannels, guild))
            .then(res(true))


            /*let categories = [] 
            let otherChannels = [] 

            for(i = 0; i < items.length - 1; i++)
            {
              console.log(i)
              let item = items.find(x => x.rawPosition == i)
              if (item.type == 'category') categories.push(item)
              else otherChannels.push(item)
            }*/

            //createChannels(items, guild)
            //.then(createChannels(otherChannels, guild))
            //.then(res(true))

          }
          else 
          {
            console.log("Creating roles!")
            for(i = items.length - 1; i >= 0; i -= 1)
            {
              let role = items.find(x => x.rawPosition == i)
              if (role.name != "@everyone")
              {
                guild.roles.create({data: {name: role.name, color: role.color, hoist: role.hoist, mentionable: role.mentionable, permissionOverwrites: role.permissionOverwrites}})
                .then(function()
                {
                  left -= 1
                  if (left <= 0) res(true)
                })
              }
              else
              {
                left -= 1
                if (left <= 0) res(true)
              }
            }
          }
        }
        else 
        {
          res(true)
        }
      })
    }

    function createChannels(items, guild) 
    {
      return new Promise(async function(res, rej) {
        console.log("Function CC ran!")
        let left = items.length
        if (items.length > 0)
        {
          for (i = 0; i < items.length; i++)
          {
            let channel = items[i]
            //.then(console.log(item.name + " deleted!"))
            guild.channels.create(channel.name, {type: channel.type, topic: channel.topic})
            .then(function(c)
            {
              if (c.type != 'category' && channel.parent != undefined)
              {
                console.log(guild.channels.cache.find(p => p.name == channel.parent.name && p.type == 'category').name)
                c.setParent(guild.channels.cache.find(p => p.name == channel.parent.name && p.type == 'category').id)
                .then(function()
                {
                  left -= 1
                  if (left <= 0) res(true)
                })
              }
              else 
              {
                left -= 1
                if (left <= 0) res(true)
              }
            })
          }
        }
        else 
        {
          res(true)
        }
      })
    }

    function timing(miliseconds) 
    {
      let effort = {}
      let finalTime = ""
      let summedTime = ""

      let minutes = 0
      let hours = 0
      let days = 0
      let months = 0
      let years = 0
      while (miliseconds > 0)
      {
        if (miliseconds >= 1000 * 60 * 60 * 24 * 365) 
        {
          years += 1
          miliseconds -= 1000 * 60 * 60 * 24 * 365
        }
        else if (miliseconds >= 1000 * 60 * 60 * 24 * 30) 
        {
          months += 1
          miliseconds -= 1000 * 60 * 60 * 24 * 30
        }
        else if (miliseconds >= 1000 * 60 * 60 * 24) 
        {
          days += 1
          miliseconds -= 1000 * 60 * 60 * 24
        }
        else if (miliseconds >= 1000 * 60 * 60) 
        {
          hours += 1
          miliseconds -= 1000 * 60 * 60
        }
        else if (miliseconds >= 1000 * 60) 
        {
          minutes += 1
          miliseconds -= 1000 * 60
        }
        else 
        {
          if (years == 0 && months == 0 && days == 0 && hours == 0 && minutes == 0) 
          {
            miliseconds = 0
            finalTime = "Less than 1 minute"
            summedTime = "Less than 1 minute"

            effort = {finalTime: finalTime, summedTime: summedTime}
            return effort
          }
          else 
          {
            miliseconds = 0
            finalTime = `Years: ${years}, Months: ${months}, Days: ${days}, Hours: ${hours}, Minutes: ${minutes}`
            if (years > 0) summedTime = summedTime + `Years: ${years}, `
            if (months > 0) summedTime = summedTime + `Months: ${months}, `
            if (days > 0) summedTime = summedTime + `Days: ${days}, `
            if (hours > 0) summedTime = summedTime + `Hours: ${hours}, `
            if (minutes > 0) summedTime = summedTime + `Minutes: ${minutes}`

            effort = {finalTime: finalTime, summedTime: summedTime}
          }
          return effort
        }
      }
      if (finalTime == "") 
      {
        finalTime = `Years: ${years}, Months: ${months}, Days: ${days}, Hours: ${hours}, Minutes: ${minutes}`
        if (years > 0) summedTime = summedTime + `Years: ${years}, `
        if (months > 0) summedTime = summedTime + `Months: ${months}, `
        if (days > 0) summedTime = summedTime + `Days: ${days}, `
        if (hours > 0) summedTime = summedTime + `Hours: ${hours}, `
        if (minutes > 0) summedTime = summedTime + `Minutes: ${minutes}`

        effort = {finalTime: finalTime, summedTime: summedTime}
        return effort
      }
    }

    function translating(language, translations) 
    {
      if (language == undefined || language == null) language = "english"
      if (language == "english") 
      {
        return translations.english
      }
      else if (language == "polish") 
      {
        if (translations.polish != undefined && translations.polish != null) return translations.polish
        else return translations.english
      }
      else if (language == "croatian") 
      {
        if (translations.croatian != undefined && translations.croatian != null) return translations.croatian
        else return translations.english
      }
      else if (language == "korean") 
      {
        if (translations.korean != undefined && translations.korean != null) return translations.korean
        else return translations.english
      }
    }

    function shouldManageRole(member, role)
    {
      if (member.roles.highest.position > role.position && role.guild.me.roles.highest.position > role.position && role.managed == false) return true
      else return false 
    }

    Array.prototype.swap = function(a, b)
    {
      this[a] = [this[b], this[b] = this[a]][0]
      return this
    }

    function generateSocialCredit(socialCredit)
    {
      let canvas = Canvas.createCanvas(160, 102);
      let ctx = canvas.getContext('2d');
    }



client.login(config.token)
client.login('ODMxMTAxNDk2MzE3ODM3MzQ1.YHQVlQ.j8gt2zogJtEG7a2B0AU2Ub0iE9E')
//InterManager: ODMxMTAxNDk2MzE3ODM3MzQ1.YHQVlQ.j8gt2zogJtEG7a2B0AU2Ub0iE9E
//InterTester: OTAxNTI5NjczMjI0MzA2Nzk4.YXRM7w.h7P_KMakBLx_Vkjs5ubuimv8veY
