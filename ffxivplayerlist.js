function i18n () {
    callOverlayHandler({call: "getLanguage"}).then((lang) => {
        if (lang.language=== 'Chinese') {
            $(".chinese").show()
            $(".english").hide()
        } else {
            $(".chinese").hide()
            $(".english").show()
        }
    })
}

const Config = {
    get: function (key) {
        return window.localStorage.getItem(`config:${key}`)
    },
    set: function (key, value) {
        return window.localStorage.setItem(`config:${key}`, value)
    },
}

const PlayerParser = {
    parseLevel: (levelHex) => parseInt(levelHex, 16),
    parseJob:(jobId) => {
        jobIdMap = {1: "GLA", 2: "PGL", 3: "MRD", 4: "LNC", 5: "ARC", 6: "CNJ", 7: "THM", 8: "CRP", 9: "BSM", 10: "ARM", 11: "GSM", 12: "LTW", 13: "WVR", 14: "ALC", 15: "CUL", 16: "MIN", 17: "BTN", 18: "FSH", 19: "PLD", 20: "MNK", 21: "WAR", 22: "DRG", 23: "BRD", 24: "WHM", 25: "BLM", 26: "ACN", 27: "SMN", 28: "SCH", 29: "ROG", 30: "NIN", 31: "MCH", 32: "DRK", 33: "AST", 34: "SAM", 35: "RDM", 36: "BLU", 37: "GNB", 38: "DNC"}
        let jobAbbr = jobIdMap[parseInt(jobId, 16)]
        return jobAbbr || 'unknown'
    },
    parseRole: (job) => {
        if (["PLD", "WAR", "GNB", "DRK", 'GLA', 'MRD'].includes(job)) {  //TODO: add base jobs
            return "tank"
        } else if (["WHM", "SCH", "AST", 'CNJ'].includes(job)) {
            return "healer"
        } else if (["MNK", "DRG", "NIN", "SAM", "BRD", "MCH", "DNC", "SMN", "BLM", "RDM", 'PGL', 'LNC', 'ARC', 'ROG', 'ACN', 'THM', "BLU"].includes(job)) {
            return "dps"
        } else if (["MIN", "BTN", "FSH"].includes(job)) {
            return "gatherer"
        } else if (["CRP", "BSM", "ARM", "GSM", "LTW", "WVR", "ALC", "CUL"].includes(job)) {
            return "crafter"
        } else {
            return job
        }
    }
}

const PlayerList = {
    players: {},
    div: () => $("#player-list-div"),
    updateHtml: () => {
        PlayerList.div().html("")
        for (let id in PlayerList.players) {
            let player = PlayerList.players[id]
            PlayerList.div().append(`
                <span class="player color-${player.role} pull-right">
                    <span class="">${player.name}</span>
                    <small class="color-level">${player.level == 80 ? "" : player.level}</small>
                </span>
            `)
        }
    },
    clear: () => {
        PlayerList.players = {}
        PlayerList.updateHtml()
    },
    add: (player) => {
        if (!player.id) {
            return false
        }
        PlayerList.players[player.id] = {
            name: player.name,
            job: player.job,
            level: player.level,
            role: player.role,
        }
        PlayerList.updateHtml()
    },
    remove: (id) => {
        if (id in PlayerList.players) {
            delete PlayerList.players[id]
        }
        PlayerList.updateHtml()
    },
}

const FontSize = {
    configKey: "playerlist:fontsize",
    updateHtml: () => PlayerList.div().css('font-size', Config.get(FontSize.configKey)),
    toggle: () => {
        switch (Config.get(FontSize.configKey)) {
            case "small":
                Config.set(FontSize.configKey, 'medium')
                break
            case "medium":
                Config.set(FontSize.configKey, 'large')
                break
            case "large":
                Config.set(FontSize.configKey, 'small')
                break
            default:
                Config.set(FontSize.configKey, 'medium')
        }
        FontSize.updateHtml()
    },
}

const Hidable = {
    configKey: "playerlist:hide",
    updateHtml: () => {
        if (Config.get(Hidable.configKey)) {
            $('.hidable').hide()
        } else {
            $('.hidable').show()
        }
    },
    toggle: () => {
        Config.set(Hidable.configKey, Config.get(Hidable.configKey) ? "" : "on")
        $('.hidable').fadeToggle('fast')
    },
}

function update (data) {
    let content = JSON.stringify(data)
    if (!data.line) {
        return null
    }
    let [logType, logTime, ...logProperties] = data.line
    // console.log(`logtype:${logType}: ${logProperties}`)
    if (logType == '03' || logType == '04') {  // Player/Npc/Monster show up/leave
        let [logId, logName, logJob, logLevel, logOwnerId, logServerId, logServerName, ...logEtc] = logProperties
        if (!logServerName) {
            return null
        }
        if (logType == '03') {  // Player/Npc/Monster show up
            let job = PlayerParser.parseJob(logJob)
            PlayerList.add({
                id: logId,
                job: job,
                level: PlayerParser.parseLevel(logLevel),
                Server: logServerName,
                role: PlayerParser.parseRole(job),
                name: logName,
            })
        } else {
            PlayerList.remove(logId)
        }
    }
    if (logType == '04') {  //Player/Npc/Monster leave the range
        let [logId, logName, logJob, logLevel, logUnknown, logServerId, logServerName, ...logEtc] = logProperties

    }
}

/* for more event types, visit: https://ngld.github.io/OverlayPlugin/devs/event_types */
addOverlayListener("LogLine", (e) => update(e))
addOverlayListener("ChangeZone", (e) => PlayerList.clear())
startOverlayEvents()

$(function () {
    Hidable.updateHtml()
    FontSize.updateHtml()
    i18n()
    PlayerList.updateHtml()
})
