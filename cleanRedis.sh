#!/bin/bash

#Delete all keys
echo "flushall" | redis-cli -h 127.0.0.1 -p 6379 -a dev

exit 0 