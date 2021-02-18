# signal-take-home
Signal Server Take-Home Exercise

Michael Lorton — February 17, 2021

## DESCRIPTION

This is my attempt to implement the project described [here](https://signal.org/blog/giphy-experiment/).

It can be run in the ordinary way, check out the repo, `yarn install` then `yarn server`.

`yarn server -h` will print out the complete usage.

`yarn client` will run a test, using `curl`.

## TODO

This represents only a few hours work, so naturally there is a lot of room for improvement:

* error handling -- only the simplest error handling is currently supported.  It should be tested in various other cases; most prominently, network failure when attempting to connect to the remote host.
* logging -- again, it has only basic logging
* improved HTTP parsing -- the parsing is very simple-minded, just looking for the string after CONNECT
* deployment and monitoring -- right now it is compiled and run from the command line; not acceptable for production.
  