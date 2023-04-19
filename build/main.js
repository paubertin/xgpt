"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const config_1 = require("./config/config");
const logger_1 = require("./logger");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.init();
        logger_1.Logger.log('test debug');
        logger_1.Logger.info('test info');
        logger_1.Logger.trace('test trace');
        logger_1.Logger.status('test status');
        logger_1.Logger.error('test error');
        config_1.Config.checkOpenAIAPIKey();
    });
}
exports.main = main;
