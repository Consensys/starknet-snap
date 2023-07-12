// ERROR, WARN, INFO, DEBUG, TRACE, ALL, and OF
export enum LogLevel {
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
    TRACE = 5,
    ALL = 6,
    OFF = 0
}

export const logger = class {
    static level:number = 0;

    static setLevel(level:string) {
        if (level && Object.values(LogLevel).includes(level.toUpperCase())) {
            logger.level = LogLevel[level.toUpperCase()];
        }
        else{
            logger.level = LogLevel.OFF;
        } 
    } 
    
    static error(message?: any, ...optionalParams: any[]) {
        if (logger.level >= LogLevel.ERROR) {
            console.error(message, ...optionalParams)
        }
    }

    static warn(message?: any, ...optionalParams: any[]) {
        if (logger.level >= LogLevel.WARN) {
            console.warn(message, ...optionalParams)
        }
    }

    static info(message?: any, ...optionalParams: any[]) {
        if (logger.level >= LogLevel.INFO) {
            console.error(message, ...optionalParams)
        }
    }

    static debug(message?: any, ...optionalParams: any[]) {
        if (logger.level >= LogLevel.DEBUG) {
            console.debug(message, ...optionalParams)
        }
    }

    static trace(message?: any, ...optionalParams: any[]) {
        if (logger.level >= LogLevel.TRACE) {
            console.trace(message, ...optionalParams)
        }
    }

    static log(message?: any, ...optionalParams: any[]) {
        if (logger.level >= LogLevel.ALL) {
            console.log(message, ...optionalParams)
        }
    }

    static getLevel() {
        return logger.level
    } 
}