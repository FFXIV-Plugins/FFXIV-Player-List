const VERSION = "7.00.8"
const MAX_LEVEL = 100

function i18n () {
    callOverlayHandler({call: "getLanguage"}).then((lang) => {
        if (lang.language === 'Chinese') {
            showSelectorAll(".chinese")
            hideSelectorAll(".english")
        } else {
            hideSelectorAll(".chinese")
            showSelectorAll(".english")
        }
    })
}

function hideSelectorAll (selector) {
    document.querySelectorAll(selector).forEach(element => {
        if (element.style.display !== 'none') {
            element.setAttribute('data-display', element.style.display)
        }
        element.style.display = 'none';
    });
}

function showSelectorAll (selector) {
    document.querySelectorAll(selector).forEach(element => {
        let dataDisplay = element.getAttribute('data-display')
        if (!dataDisplay) {
            element.style.removeProperty('display')
        } else {
            element.style.display = dataDisplay
        }
    });
}

function toggleSelectorAll (selector) {
    document.querySelectorAll(selector).forEach(element => {
        element.style.display === 'none' ? showSelectorAll(selector) : hideSelectorAll(selector)
    });
}

const Config = {
    get: function (key) {
        return window.localStorage.getItem(`playerlist:config:${key}`)
    },
    set: function (key, value) {
        return window.localStorage.setItem(`playerlist:config:${key}`, value)
    },
}

const MeetUp = {
    div: () => document.querySelector("#meetup-player-count"),
    get: (key) => {
        return window.localStorage.getItem(`playerlist:meetup:${key}`)
    },
    set: (key, value) => {
        return window.localStorage.setItem(`playerlist:meetup:${key}`, value)
    },
    inc: (key) => {
        let current = MeetUp.get(key) || 0
        let result = parseInt(current) + 1
        MeetUp.set(key, result)
        return result
    },
    keys: () => {
        let result = []
        for (let key in window.localStorage) {
            if (key.startsWith("playerlist:meetup:")) {
                result.push(key)
            }
        }
        return result
    },
    clear: () => {
        for (let key of MeetUp.keys()) {
            window.localStorage.removeItem(key)
        }
        PlayerList.clear()
    },
    count: () => {
        return MeetUp.keys().length
    },
    updateHtml: () => {
        MeetUp.div().textContent = MeetUp.count()
    },
}

const PlayerParser = {
    parseLevel: (levelHex) => parseInt(levelHex, 16),
    parseJob: (jobId) => {
        // Job IDs: https://github.com/anoyetta/ACT.Hojoring/blob/master/source/FFXIV.Framework/FFXIV.Framework/XIVHelper/Jobs.cs
        // Job Abbrs: https://github.com/OverlayPlugin/cactbot/tree/main/resources/ffxiv/jobs
        jobIdMap = {
            "0": "ADV",
            "1": "GLA",
            "2": "PGL",
            "3": "MRD",
            "4": "LNC",
            "5": "ARC",
            "6": "CNJ",
            "7": "THM",
            "8": "CRP",
            "9": "BSM",
            "A": "ARM",
            "B": "GSM",
            "C": "LTW",
            "D": "WVR",
            "E": "ALC",
            "F": "CUL",
            "10": "MIN",
            "11": "BOT",
            "12": "FSH",
            "13": "PLD",
            "14": "MNK",
            "15": "WAR",
            "16": "DRG",
            "17": "BRD",
            "18": "WHM",
            "19": "BLM",
            "1A": "ACN",
            "1B": "SMN",
            "1C": "SCH",
            "1D": "ROG",
            "1E": "NIN",
            "1F": "MCH",
            "20": "DRK",
            "21": "AST",
            "22": "SAM",
            "23": "RDM",
            "24": "BLU",
            "25": "GNB",
            "26": "DNC",
            "27": "RPR",
            "28": "SGE",
            "29": "VPR",
            "2A": "PCT"
        }
        let jobAbbr = jobIdMap[jobId]
        return jobAbbr || `Unknown (Job ID: ${jobId})`
    },
    parseRole: (job) => {
        switch (job) {
            // Tank
            case 'GLA':
            case 'PLD':
            case 'MRD':
            case 'WAR':
            case 'DRK':
            case 'GNB':
                return "tank";
            // Healer
            case 'CNJ':
            case 'WHM':
            case 'SCH':
            case 'AST':
            case 'SGE':
                return "healer";
            // Melee DPS
            case 'PGL':
            case 'MNK':
            case 'LNC':
            case 'DRG':
            case 'ROG':
            case 'NIN':
            case 'SAM':
            case 'RPR':
            case 'VPR':
            // Range DPS
            case 'ARC':
            case 'BRD':
            case 'MCH':
            case 'DNC':
            // Magic DPS
            case 'THM':
            case 'BLM':
            case 'ACN':
            case 'SMN':
            case 'RDM':
            case 'PCT':
            case 'BLU':
                return "dps";
            // Gatherer
            case 'MIN':
            case 'BOT':
            case 'FSH':
                return "gatherer";
            // Crafter
            case 'CRP':
            case 'BSM':
            case 'ARM':
            case 'GSM':
            case 'LTW':
            case 'WVR':
            case 'ALC':
            case 'CUL':
                return "crafter";
            default:
                return job;
        }
    }
}

const PlayerCount = {
    div: () => document.querySelector("#player-count"),
    updateHtml: () => {
        let player_count = PlayerList.count()
        if (player_count > 0) {
            PlayerCount.div().textContent = player_count
        } else {
            PlayerCount.div().textContent = ""
        }
    }
}

const primaryPlayer = {

}

const PlayerList = {
    players: {},
    div: () => document.querySelector("#player-list-div"),
    updateHtml: () => {
        PlayerList.div().innerHTML = ""
        let sortedIds = Object.keys(PlayerList.players).sort((id1, id2) => parseInt(PlayerList.players[id2].meetup) - parseInt(PlayerList.players[id1].meetup))
        for (let id of sortedIds) {
            let player = PlayerList.players[id]
            let player_div = document.createElement("div")
            player_div.classList.add("bg-opacity-dark-25", "p-1", "rounded")
            player_div.innerHTML = `
                <div class="player color-${player.role}">
                    <div class="player-name">${player.name}</div>
                    <div class="player-info">
                        <small class="player-meetup">♥${player.meetup}</small>
                        <small class="player-level ${player.level == MAX_LEVEL ? 'hidden' : ''}">
                            <span class="player-level-prefix">Lv.</span>
                            ${player.level}
                        </small>
                    </div>
                </div>
            `
            PlayerList.div().appendChild(player_div)
        }
        PlayerCount.updateHtml()
        MeetUp.updateHtml()
    },
    clear: () => {
        PlayerList.players = {}
        PlayerList.updateHtml()
    },
    add: (player) => {
        if (!player.id || player.id == primaryPlayer['id']) {
            return false
        }
        PlayerList.players[player.id] = {
            name: player.name,
            job: player.job,
            level: player.level,
            role: player.role,
            meetup: MeetUp.inc(player.id),
        }
        PlayerList.updateHtml()
    },
    remove: (id) => {
        if (id in PlayerList.players) {
            delete PlayerList.players[id]
        }
        PlayerList.updateHtml()
    },
    count: () => Object.keys(PlayerList.players).length,
    test: () => {
        let fakePlayers = [
            {id: 1, name: "Mr.Crafter", role: "crafter", job: "ALC"},
            {id: 2, name: "Mrs.Gatherer", role: "gatherer", job: "FSH"},
            {id: 3, name: "Lord DPS", role: "dps", job: "MCH"},
            {id: 4, name: "King Tank", role: "tank", job: "DRK"},
            {id: 5, name: "Miss Healer", role: "healer", job: "AST"},
            {id: 6, name: "能工巧匠先生", role: "crafter", job: "ALC"},
            {id: 7, name: "大地使者夫人", role: "gatherer", job: "FSH"},
            {id: 8, name: "输出领主", role: "dps", job: "RPR"},
            {id: 9, name: "高贵坦克", role: "tank", job: "DRK"},
            {id: 10, name: "治疗小姐", role: "healer", job: "SGE"},
        ]
        for (let fakePlayer of fakePlayers) {
            fakePlayer.level = Math.random() < 0.3 ? MAX_LEVEL : Math.floor(Math.random() * MAX_LEVEL) + 1  // 30% chance to be MAX_LEVEL, otherwise random level
            PlayerList.add(fakePlayer)
        }
    },
}

const FontSize = {
    configKey: "fontsize",
    updateHtml: () => PlayerList.div().style.fontSize = Config.get(FontSize.configKey),
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
    configKey: "hide",
    updateHtml: () => {
        if (Config.get(Hidable.configKey)) {
            hideSelectorAll('.hidable')
        } else {
            showSelectorAll('.hidable')
        }
    },
    toggle: () => {
        Config.set(Hidable.configKey, Config.get(Hidable.configKey) ? "" : "on")
        toggleSelectorAll('.hidable')
    },
}

const FocusMode = {
    configKey: "focus",
    updateHtml: () => {
        if (Config.get(FocusMode.configKey)) {
            document.querySelectorAll('.focus-hidden').forEach(element => {
                element.style.display = 'none';
            });
            document.querySelectorAll('.focus-show').forEach(element => {
                element.style.display = 'block';
            });
        } else {
            document.querySelectorAll('.focus-hidden').forEach(element => {
                element.style.display = 'block';
            });
            document.querySelectorAll('.focus-show').forEach(element => {
                element.style.display = 'none';
            });
        }
        if (Config.get(FocusMode.configKey)) {
            hideSelectorAll('.focus-hidden')
            showSelectorAll('.focus-show')
        } else {
            showSelectorAll('.focus-hidden')
            hideSelectorAll('.focus-show')
        }
    },
    toggle: () => {
        Config.set(FocusMode.configKey, Config.get(FocusMode.configKey) ? "" : "on")
        FocusMode.updateHtml()
    },
}

function update (data) {
    let content = JSON.stringify(data)
    if (!data.line) {
        return null
    }
    let [logType, logTime, ...logProperties] = data.line
    // LogType refers to: https://github.com/quisquous/cactbot/blob/main/docs/LogGuide.md
    // console.log(`logtype:${logType}: ${logProperties}`)
    if (logType == '02') {  // Primary Player Change
        let [primaryPlayerId, primaryPlayerName, ...primaryPlayerEtc] = logProperties
        primaryPlayer['id'] = primaryPlayerId
        primaryPlayer['Name'] = primaryPlayerName
    }
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
        } else {  //Player/Npc/Monster leave the range
            PlayerList.remove(logId)
        }
    }
}

/* for more event types, visit: https://ngld.github.io/OverlayPlugin/devs/event_types */
addOverlayListener("LogLine", (e) => update(e))
addOverlayListener("ChangeZone", (e) => PlayerList.clear())
startOverlayEvents()

document.addEventListener('DOMContentLoaded', function () {
    i18n()
    Hidable.updateHtml()
    FocusMode.updateHtml()
    FontSize.updateHtml()
    PlayerList.updateHtml()
    console.log(`[LOADED] FFXIV Player List: Version ${VERSION}`)
});
