"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeProgressData = exports.sleeper = exports.analysisQueue = exports.jobData = void 0;
const bull_1 = __importDefault(require("bull"));
const redis_1 = require("./redis");
exports.jobData = {
    testKey: 'testValue',
};
const ANALYSIS_CONCURRENCY = 2;
exports.analysisQueue = new bull_1.default('localTestQ', 'redis://127.0.0.1:6379', {
    redis: redis_1.REDIS_OPTIONS,
    settings: {
        // maxStalledCount: 3,
        // stalledInterval: 1000,
        // lockDuration: 2000,
        // lockRenewTime: 1000,
        retryProcessDelay: 2000,
    },
    defaultJobOptions: {
        attempts: 3,
        timeout: 1000 * 60 * 60,
        // timeout: 10000, //10 seconds
        removeOnComplete: true,
        removeOnFail: true,
    },
});
exports.analysisQueue.on('stalled', (job) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Job ${job.id} stalled, on attempt ${job.attemptsMade}`);
    yield storeProgressData(`${job.id}`, 'WAITING');
}));
exports.analysisQueue.on('waiting', (jobId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Job ${jobId} is now waiting`);
    yield storeProgressData(`${jobId}`, 'WAITING');
}));
exports.analysisQueue.on('completed', (job, result) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Job ${job.id} completed with result ${result}`);
    yield storeProgressData(`${job.id}`, 'COMPLETED');
}));
exports.analysisQueue.on('failed', (job, err) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Job ${job.id} FAILED. err is: msg: ${err.message}, name : ${err.name}, stack : ${err.stack}`);
    yield storeProgressData(`${job.id}`, 'FAILED');
}));
function analyze(job) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Analyzing job %s', job.id);
        yield storeProgressData(`${job.id}`, 'PROCESSING');
        const { createHash } = yield Promise.resolve().then(() => __importStar(require('node:crypto')));
        //block the event
        let hash = createHash('sha256');
        const numberOfHasUpdates = 10e6;
        for (let iter = 0; iter < numberOfHasUpdates; iter++) {
            hash.update('aaaaaabbbbbccccccc');
        }
        const updateProgressCallback = (progress) => __awaiter(this, void 0, void 0, function* () {
            yield job.progress(progress);
        });
        yield sleeper(job, updateProgressCallback);
        console.log('processor done for job %s', job.id);
        return;
    });
}
void exports.analysisQueue.process('*', ANALYSIS_CONCURRENCY, `${__dirname}/external-analyze.js`);
console.log('Queue is ready');
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function sleeper(job, updateProgressCallback) {
    return __awaiter(this, void 0, void 0, function* () {
        let ticker = 0;
        for (ticker; ticker < 10; ticker++) {
            updateProgressCallback(ticker);
            console.log(`Waiting ${ticker} seconds... for job ${job.id}, attempt: ${job.attemptsMade}`);
            yield sleep(ticker * 1000);
        }
        console.log(`Sleeping done for job ${job.id}`);
    });
}
exports.sleeper = sleeper;
function storeProgressData(keyHash, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const ttl = 360;
        yield redis_1.redisCommands.setex(`SnykStateTracker: ${keyHash}`, ttl, `${JSON.stringify(data)}`);
    });
}
exports.storeProgressData = storeProgressData;
exports.analysisQueue.add('exampleJob1', exports.jobData, {
    jobId: 111111,
});
exports.analysisQueue.add('exampleJob2', exports.jobData, {
    jobId: 2222222,
});
exports.analysisQueue.add('exampleJob2', exports.jobData, {
    jobId: 3333333,
});
// Uncomment this if you want to clean redis on exit
// process.on('SIGINT', () => {
//   console.log('SIGINT caught');
//   flushDB();
//   process.exit(0);
// });
