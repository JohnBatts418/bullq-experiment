import Bull from 'bull';
import { REDIS_OPTIONS, redisCommands, flushDB } from './redis';

export interface JobData {
  testKey: string;
}

export const jobData: JobData = {
  testKey: 'testValue',
};

const ANALYSIS_CONCURRENCY = 1;

export const analysisQueue = new Bull<JobData>('localTestQ', 'redis://127.0.0.1:6379', {
  redis: REDIS_OPTIONS,
  settings: {
    maxStalledCount: 3,
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

async function analyze(job: Bull.Job<JobData>, done: () => any) {
  console.log(`Analyzing job ${job.id}`);
  await storeProgressData(`${job.id}`, 'PROCESSING');

  const updateProgressCallback = async (progress: number): Promise<void> => {
    await job.progress(progress);
  };
  await sleeper(job, updateProgressCallback);

  console.log(`processor done for job ${job.id}`);
  return done();
}

void analysisQueue.process('*', ANALYSIS_CONCURRENCY, analyze);

console.log('Queue is ready');

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sleeper(job: Bull.Job<JobData>, updateProgressCallback: (progress: number) => Promise<void>) {
  let ticker = 0;
  for (ticker; ticker < 10; ticker++) {
    updateProgressCallback(ticker);
    console.log(`Waiting ${ticker} seconds... for job ${job.id}`);
    await sleep(ticker * 1000);
  }
  console.log(`Sleeping done for job ${job.id}`);
}

export async function storeProgressData(keyHash: string, data: string): Promise<void> {
  const ttl = 360;
  await redisCommands.setex(`myKey: ${keyHash}`, ttl, `${JSON.stringify(data)}`);
}

analysisQueue.add('exampleJob1', jobData, {
  jobId: 111111,
});
analysisQueue.add('exampleJob2', jobData, {
  jobId: 2222222,
});
analysisQueue.add('exampleJob2', jobData, {
  jobId: 3333333,
});

// Uncomment this if you want to clean redis on exit
// process.on('SIGINT', () => {
//   console.log('SIGINT caught');
//   flushDB();
//   process.exit(0);
// });
