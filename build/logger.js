"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
var LogType;
(function (LogType) {
    LogType["DEBUG"] = "DEBUG";
    LogType["TRACE"] = "TRACE";
    LogType["INFO"] = "INFO";
    LogType["STATUS"] = "STATUS";
    LogType["ERROR"] = "ERROR";
})(LogType || (LogType = {}));
var Colour;
(function (Colour) {
    Colour["red"] = "\u001B[31m";
    Colour["yellow"] = "\u001B[33m";
    Colour["green"] = "\u001B[32m";
    Colour["black"] = "\u001B[39m";
})(Colour || (Colour = {}));
class Logger {
    static write(type, ...args) {
        let colour = Colour.black;
        const now = new Date();
        const dateStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        switch (type) {
            case LogType.DEBUG:
                colour = Colour.black;
                args = args.map((a) => colour + a);
                console.log(colour, `[${dateStr}] ${this.loggerName}:`, ...args, Colour.black);
                break;
            case LogType.INFO:
                colour = Colour.yellow;
                args = args.map((a) => colour + a);
                console.info(colour, `[${dateStr}] ${this.loggerName}:`, ...args, Colour.black);
                break;
            case LogType.TRACE:
                colour = Colour.yellow;
                args = args.map((a) => colour + a);
                console.trace(colour, `[${dateStr}] ${this.loggerName}:`, ...args, Colour.black);
                break;
            case LogType.STATUS:
                colour = Colour.green;
                args = args.map((a) => colour + a);
                console.info(colour, `[${dateStr}] ${this.loggerName}:`, ...args, Colour.black);
                break;
            case LogType.ERROR:
                colour = Colour.red;
                args = args.map((a) => colour + a);
                console.error(colour, `[${dateStr}] ${this.loggerName}:`, ...args, Colour.black);
                break;
        }
    }
    static log(...args) {
        return this.write(LogType.DEBUG, ...args);
    }
    static info(...args) {
        return this.write(LogType.INFO, ...args);
    }
    static trace(...args) {
        return this.write(LogType.TRACE, ...args);
    }
    static status(...args) {
        return this.write(LogType.STATUS, ...args);
    }
    static error(...args) {
        return this.write(LogType.ERROR, ...args);
    }
}
Logger.loggerName = 'x-gpt';
exports.Logger = Logger;
