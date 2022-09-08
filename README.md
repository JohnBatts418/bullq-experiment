#### A playground to easily see how bullq handles messages

##### To install
-  A redis instance running locally - `brew install redis` 
- `npm i`

##### To Run
`npm run start` 

## If you want to clean redis
`echo "flushall" | redis-cli -h 127.0.0.1 -p 6379 -a dev`

#### Ideas you can try:
- Decrease the queue timeout and see how it handles timeouts in the job processor
- turn off or restart your redis instance while it is processing 
- Your own custom backoff handler