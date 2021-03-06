const { Client } = require("discord.js");
const BaseEvent = require('./base/BaseEvent');
const BaseCommand = require('./base/BaseCommand');
const fs = require("fs").promises
const path = require("path");
const SortilegeDefense = require('./assets/jobs/sorcier/sorts/defenses')
const SortilegeAttaque = require('./assets/jobs/sorcier/sorts/attacks')
require('./assets/structures/User')
require('dotenv').config()
const { createConnection } = require('mysql');
const util = require('util')
const db = createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "rpg"
});
const query = util.promisify(db.query).bind(db);

class Bot extends Client {
    constructor(options) {
        super(options);
        this.commands = new Map();
        this.events = new Map();
        this.aliases = new Map();
        this.sortilegesDefense = new Map();
        this.sortilegesAttaque = new Map();
    }
    async _start() {
        await this.login(process.env.TOKEN_BOT);
        await this._chargementEvent(path.join(__dirname, './events/'));
        await this._chargementCommand(path.join(__dirname, "./cmds/"));
        await this._loadSortileges();
    }
    async _loadSortileges() {
      let sortileges = await query('SELECT * FROM sorts')
      for(let i = 0; i < sortileges.length; i++) {
        if(sortileges[i].type === "defense") this.sortilegesDefense.set(sortileges[i].name.toLowerCase(), new SortilegeDefense(sortileges[i].name, sortileges[i].utilities));
        else this.sortilegesAttaque.set(sortileges[i].name.toLowerCase(), new SortilegeAttaque(sortileges[i].name, sortileges[i].utilities));
      }
    }
    async _chargementCommand(cmdPath) {
          const files = await fs.readdir(cmdPath);
          for (const file of files) {
            const stat = await fs.lstat(path.join(cmdPath, file));
            if (stat.isDirectory()) this._chargementCommand(path.join(cmdPath, file));
            if (file.endsWith('.js')) {
              const Command = require(path.join(cmdPath, file));
              if (Command.prototype instanceof BaseCommand) {
                const cmd = new Command();
                this.commands.set(cmd.name, cmd);
                console.log(`[Development | Command]: ${cmd.name}`)
                cmd.aliases.forEach((alias) => {
                  this.commands.set(alias, cmd);
                });
              }
            }
          }
    }
    async _chargementEvent(eventPath) {
          const files = await fs.readdir(eventPath);
          for (const file of files) {
              const stat = await fs.lstat(path.join(eventPath, file));
              if (stat.isDirectory()) this._chargementEvent(path.join(eventPath, file));
              if (file.endsWith('.js')) {
                  const Event = require(path.join(eventPath, file));
                  if (Event.prototype instanceof BaseEvent) {
                      const event = new Event();
                      this.events.set(event.name, event);
                      this.on(event.name, event.run.bind(event, this));
                      console.log(`[Development | Event]: ${event.name}`)
                  }
              }
          }
    }
}
module.exports = Bot;