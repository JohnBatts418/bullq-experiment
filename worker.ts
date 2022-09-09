import Bull from 'bull';
import { REDIS_OPTIONS, redisCommands, flushDB } from './redis';

export interface JobData {
  testKey: string;
}

export const jobData: JobData = {
  testKey: 'testValue',
};

const ANALYSIS_CONCURRENCY = 2;

export const analysisQueue = new Bull<JobData>('localTestQ', 'redis://127.0.0.1:6379', {
  redis: REDIS_OPTIONS,
  settings: {
    // maxStalledCount: 3,
    // stalledInterval: 1000,
    // lockDuration: 2000, //sandbox worker doesnt seem to be affect by these.
    // lockRenewTime: 1000,
    retryProcessDelay: 2000,
  },
  defaultJobOptions: {
    attempts: 3,
    timeout: 1000 * 60 * 60, //1hr
    // timeout: 10000, //10 seconds
    removeOnComplete: true,
    removeOnFail: true,
  },
});

analysisQueue.on('stalled', async job => {
  console.log(`Job ${job.id} stalled, on attempt ${job.attemptsMade}`);
  await storeProgressData(`${job.id}`, 'WAITING');
});
analysisQueue.on('waiting', async jobId => {
  console.log(`Job ${jobId} is now waiting`);
  await storeProgressData(`${jobId}`, 'WAITING');
});

analysisQueue.on('completed', async (job, result) => {
  console.log(`Job ${job.id} completed with result ${result}`);
  await storeProgressData(`${job.id}`, 'COMPLETED');
});
analysisQueue.on('failed', async (job, err) => {
  console.log(`Job ${job.id} FAILED. err is: msg: ${err.message}, name : ${err.name}, stack : ${err.stack}`);
  await storeProgressData(`${job.id}`, 'FAILED');
});

async function analyze(job: Bull.Job<JobData>) {
  console.log('Analyzing job %s', job.id);
  await storeProgressData(`${job.id}`, 'PROCESSING');

  const { createHash } = await import('node:crypto');
  //block the event
  let hash = createHash('sha256');
  const numberOfHasUpdates = 10e6;

  for (let iter = 0; iter < numberOfHasUpdates; iter++) {
    hash.update('aaaaaabbbbbccccccc');
  }

  const updateProgressCallback = async (progress: number): Promise<void> => {
    await job.progress(progress);
  };
  await sleeper(job, updateProgressCallback);

  console.log('processor done for job %s', job.id);
  return;
}

//SANDBOX WORKER IMPLEMENTATION
void analysisQueue.process('*', ANALYSIS_CONCURRENCY, `${__dirname}/external-analyze.js`);

//LOCAL WORKER IMPLEMENTATION
// void analysisQueue.process('*', ANALYSIS_CONCURRENCY, analyze);

console.log('Queue is ready');

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sleeper(job: Bull.Job<JobData>, updateProgressCallback: (progress: number) => Promise<void>) {
  let ticker = 0;
  for (ticker; ticker < 10; ticker++) {
    updateProgressCallback(ticker);
    console.log(`Waiting ${ticker} seconds... for job ${job.id}, attempt: ${job.attemptsMade}`);
    await sleep(ticker * 1000);
  }
  console.log(`Sleeping done for job ${job.id}`);
}

export async function storeProgressData(keyHash: string, data: string): Promise<void> {
  const ttl = 360;
  await redisCommands.setex(`SnykStateTracker: ${keyHash}`, ttl, `${JSON.stringify(data)}`);
}

analysisQueue.add('exampleJob1', jobData, {
  jobId: 111111,
});
// analysisQueue.add('exampleJob2', jobData, {
//   jobId: 2222222,
// });
// analysisQueue.add('exampleJob2', jobData, {
//   jobId: 3333333,
// });

// Uncomment this if you want to clean redis on exit
// process.on('SIGINT', () => {
//   console.log('SIGINT caught');
//   flushDB();
//   process.exit(0);
// });
