import Bull from 'bull';
import { JobData, sleeper, storeProgressData } from './worker';

module.exports = async function (job: Bull.Job<JobData>) {
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
};
