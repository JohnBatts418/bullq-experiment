### Custom Branch for trying sandbox worker
This used the sandbox workers as described here https://docs.bullmq.io/guide/workers/sandboxed-processors

Here we block the event loop using the crypto lib. If we use the sandbox worker, it doesnt stall, if we dont, it does. 


##### To install
-  A redis instance running locally - `brew install redis` 
- `npm i`

##### To Run
`npm run start` 

## If you want to clean redis
`echo "flushall" | redis-cli -h 127.0.0.1 -p 6379 -a dev`